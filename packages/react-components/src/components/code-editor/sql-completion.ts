import {
	autocompletion,
	type Completion,
	type CompletionContext,
	type CompletionResult,
	type CompletionSource,
	startCompletion,
} from "@codemirror/autocomplete";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

// ── Public types ──

export type SqlQueryType =
	| "tables"
	| "columns"
	| "functions"
	| "jsonb_columns"
	| "structure_definition";

interface StructureDefinitionElementType {
	code: string;
}

interface StructureDefinitionElement {
	path?: string;
	type?: StructureDefinitionElementType[];
	max?: string;
	short?: string;
	definition?: string;
}

interface StructureDefinition {
	name?: string;
	snapshot?: {
		element: StructureDefinitionElement[];
	};
}

export interface SqlConfig {
	executeSql: (
		query: string,
		type: SqlQueryType,
	) => Promise<Record<string, unknown>[]>;
}

// ── Internal types ──

type SchemaMap = Record<string, string[]>;
type JsonbColumnMap = Record<string, string[]>;
type ColumnInfo = { name: string; dataType: string };
type ColumnMap = Record<string, ColumnInfo[]>;

type FhirFieldInfo = {
	name: string;
	datatype: string;
	isArray: boolean;
	description: string | undefined;
};

type FhirPathChildren = Record<string, FhirFieldInfo[]>;

type JsonbChain = {
	tableOrAlias: string | null;
	column: string;
	path: string[];
	isPathOp: boolean;
	partialInput: string;
	insideQuote: boolean;
	lastRawSegment: string | null;
};

type AliasEntry = { schema: string; table: string };

export interface SqlMetadata {
	schemas: SchemaMap;
	jsonbColumns: JsonbColumnMap;
	functions: string[];
	columns: ColumnMap;
}

// ── SQL queries ──

const TABLES_QUERY = `SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pgagent') AND table_type = 'BASE TABLE' ORDER BY table_schema, table_name`;

const JSONB_COLUMNS_QUERY = `SELECT c.table_schema, c.table_name, c.column_name FROM information_schema.columns c JOIN information_schema.tables t ON c.table_schema = t.table_schema AND c.table_name = t.table_name WHERE t.table_type = 'BASE TABLE' AND c.table_schema NOT IN ('pg_catalog', 'information_schema', 'pgagent') AND c.udt_name = 'jsonb'`;

const FUNCTIONS_QUERY = `SELECT DISTINCT p.proname AS name FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e' WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') AND d.objid IS NULL ORDER BY p.proname`;

const COLUMNS_QUERY = `SELECT c.table_schema, c.table_name, c.column_name, c.data_type FROM information_schema.columns c JOIN information_schema.tables t ON c.table_schema = t.table_schema AND c.table_name = t.table_name WHERE t.table_type = 'BASE TABLE' AND c.table_schema NOT IN ('pg_catalog', 'information_schema', 'pgagent') ORDER BY c.table_schema, c.table_name, c.ordinal_position`;

// ── FHIR StructureDefinition processing ──

function isExpandedVariant(path: string, unionBases: Set<string>): boolean {
	const parts = path.split(".");
	if (parts.length < 2) return false;
	const parentPath = parts.slice(0, -1).join(".");
	const name = parts[parts.length - 1]!;

	for (const base of unionBases) {
		const baseParts = base.split(".");
		const baseName = baseParts[baseParts.length - 1]!;
		const baseParent = baseParts.slice(0, -1).join(".");

		if (
			parentPath === baseParent &&
			name.startsWith(baseName) &&
			name.length > baseName.length &&
			/^[A-Z]/.test(name.slice(baseName.length))
		) {
			return true;
		}
	}
	return false;
}

function buildFromStructureDefinition(
	sd: StructureDefinition,
): FhirPathChildren {
	const elements = sd.snapshot?.element ?? [];
	const result: FhirPathChildren = {};

	const unionBases = new Set<string>();
	for (const el of elements) {
		if (!el.path) continue;
		const name = el.path.split(".").pop() ?? "";
		if (name.endsWith("[x]")) {
			unionBases.add(el.path.replace(/\[x\]$/, ""));
		}
	}

	for (const el of elements) {
		if (!el.path) continue;
		const parts = el.path.split(".");
		if (parts.length < 2) continue;

		if (isExpandedVariant(el.path, unionBases)) continue;

		const parentPath = parts.slice(0, -1).join(".");
		const rawName = parts[parts.length - 1]!;

		if (!result[parentPath]) result[parentPath] = [];

		if (rawName.endsWith("[x]")) {
			const name = rawName.slice(0, -3);
			if (result[parentPath].some((f) => f.name === name)) continue;

			result[parentPath].push({
				name,
				datatype: "union",
				isArray: el.max === "*",
				description: el.short ?? el.definition,
			});

			const unionPath = `${parentPath}.${name}`;
			if (!result[unionPath]) result[unionPath] = [];
			for (const t of el.type ?? []) {
				if (!result[unionPath].some((f) => f.name === t.code)) {
					result[unionPath].push({
						name: t.code,
						datatype: t.code,
						isArray: false,
						description: el.short ?? el.definition,
					});
				}
			}
		} else {
			if (result[parentPath].some((f) => f.name === rawName)) continue;

			result[parentPath].push({
				name: rawName,
				datatype: el.type?.[0]?.code ?? "",
				isArray: el.max === "*",
				description: el.short ?? el.definition,
			});
		}
	}

	return result;
}

function transformReferenceFields(result: FhirPathChildren): void {
	for (const [path, children] of Object.entries(result)) {
		const hasReferenceField = children.some((c) => c.name === "reference");
		if (!hasReferenceField) continue;

		result[path] = children.flatMap((child) => {
			if (child.name === "reference") {
				return [
					{
						name: "id",
						datatype: "string",
						isArray: false,
						description: "Resource ID" as string | undefined,
					},
					{
						name: "resourceType",
						datatype: "string",
						isArray: false,
						description: "Resource type" as string | undefined,
					},
				];
			}
			return [child];
		});
	}
}

// ── SQL parsing utilities ──

const SQL_TABLE_KEYWORDS =
	/\b(?:from|join|inner\s+join|left\s+join|right\s+join|full\s+join|cross\s+join|into|update|table)\s+$/i;

function isInsideString(textBefore: string): boolean {
	let count = 0;
	for (let i = 0; i < textBefore.length; i++) {
		if (textBefore[i] === "'") {
			if (i + 1 < textBefore.length && textBefore[i + 1] === "'") {
				i++;
			} else {
				count++;
			}
		}
	}
	return count % 2 !== 0;
}

function isInJsonbContext(textBefore: string): boolean {
	return parseJsonbChain(textBefore) !== null;
}

function parseJsonbChain(textBefore: string): JsonbChain | null {
	const pathOpMatch = textBefore.match(/((?:\w+\.)?\w+)\s*#>>?\s*'\{([^}]*)$/);
	if (pathOpMatch) {
		const ref = pathOpMatch[1]!;
		const pathContent = pathOpMatch[2]!;
		const segments = pathContent ? pathContent.split(",") : [];
		const partialInput = segments.length > 0 ? (segments.pop() ?? "") : "";
		const lastRawSegment =
			segments.length > 0 ? (segments[segments.length - 1] ?? null) : null;
		const path = segments.filter((s) => !/^\d+$/.test(s));

		const dotParts = ref.split(".");
		if (dotParts.length === 2) {
			return {
				tableOrAlias: dotParts[0]!,
				column: dotParts[1]!,
				path,
				isPathOp: true,
				partialInput,
				insideQuote: false,
				lastRawSegment,
			};
		}
		return {
			tableOrAlias: null,
			column: dotParts[0]!,
			path,
			isPathOp: true,
			partialInput,
			insideQuote: false,
			lastRawSegment,
		};
	}

	const arrowPattern =
		/(?:((?:\w+\.)?\w+)((?:\s*->>?\s*(?:'[^']*'|\d+))*)\s*->>?\s*)('?)([^']*)?$/;
	const arrowMatch = textBefore.match(arrowPattern);
	if (!arrowMatch) return null;

	const ref = arrowMatch[1]!;
	const chainPart = arrowMatch[2] || "";
	const insideQuote = arrowMatch[3] === "'";
	const partialInput = arrowMatch[4] ?? "";

	const chainSegments: string[] = [];
	let lastRawSeg: string | null = null;
	const segmentRegex = /->>?\s*(?:'([^']*)'|(\d+))/g;
	for (
		let m = segmentRegex.exec(chainPart);
		m !== null;
		m = segmentRegex.exec(chainPart)
	) {
		const seg = m[1] ?? m[2] ?? "";
		lastRawSeg = seg;
		if (!/^\d+$/.test(seg)) {
			chainSegments.push(seg);
		}
	}

	const dotParts = ref.split(".");
	if (dotParts.length === 2) {
		return {
			tableOrAlias: dotParts[0]!,
			column: dotParts[1]!,
			path: chainSegments,
			isPathOp: false,
			partialInput,
			insideQuote,
			lastRawSegment: lastRawSeg,
		};
	}
	return {
		tableOrAlias: null,
		column: dotParts[0]!,
		path: chainSegments,
		isPathOp: false,
		partialInput,
		insideQuote,
		lastRawSegment: lastRawSeg,
	};
}

function buildAliasMap(
	sql: string,
	schemas: SchemaMap,
): Record<string, AliasEntry> {
	const aliases: Record<string, AliasEntry> = {};
	const regex = /\b(?:FROM|JOIN)\s+((?:\w+\.)?\w+)(?:\s+(?:AS\s+)?(\w+))?/gi;

	for (let match = regex.exec(sql); match !== null; match = regex.exec(sql)) {
		const fullTable = match[1]!;
		const alias = match[2];

		let schema: string;
		let table: string;
		if (fullTable.includes(".")) {
			const parts = fullTable.split(".");
			schema = parts[0]!;
			table = parts[1]!;
		} else {
			table = fullTable;
			let found: string | null = null;
			for (const [s, tables] of Object.entries(schemas)) {
				if (tables.includes(table)) {
					found = s;
					if (s === "public") break;
				}
			}
			schema = found ?? "public";
		}

		if (alias) {
			aliases[alias.toLowerCase()] = { schema, table };
		}
		aliases[table.toLowerCase()] = { schema, table };
	}

	return aliases;
}

function tableToResourceType(table: string): string {
	return table
		.split("_")
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
		.join("");
}

function getCurrentStatement(doc: string, pos: number): string {
	let start = 0;
	let end = doc.length;

	const before = doc.lastIndexOf(";", pos - 1);
	if (before !== -1) start = before + 1;

	const after = doc.indexOf(";", pos);
	if (after !== -1) end = after;

	return doc.slice(start, end);
}

// ── Completion result builders ──

function buildJsonbResult(
	chain: JsonbChain,
	pathChildren: FhirPathChildren,
	resourceType: string,
	context: CompletionContext,
): CompletionResult | null {
	const lookupPath =
		chain.path.length > 0
			? `${resourceType}.${chain.path.join(".")}`
			: resourceType;

	const children = pathChildren[lookupPath];
	if (!children || children.length === 0) return null;

	const partial = chain.partialInput.toLowerCase();
	const filtered = partial
		? children.filter((f) => f.name.toLowerCase().startsWith(partial))
		: children;

	if (filtered.length === 0) return null;

	if (chain.isPathOp) {
		return {
			from: context.pos - chain.partialInput.length,
			validFor: /^\w*$/,
			options: filtered.map(
				(f): Completion => ({
					label: f.name,
					type: "property",
					detail: f.datatype + (f.isArray ? "[]" : ""),
					...(f.description != null ? { info: f.description } : {}),
				}),
			),
		};
	}

	if (chain.insideQuote) {
		return {
			from: context.pos - chain.partialInput.length,
			validFor: /^\w*$/,
			options: filtered.map(
				(f): Completion => ({
					label: f.name,
					type: "property",
					detail: f.datatype + (f.isArray ? "[]" : ""),
					...(f.description != null ? { info: f.description } : {}),
					apply: (
						view: EditorView,
						_completion: Completion,
						from: number,
						to: number,
					) => {
						const after = view.state.sliceDoc(to, to + 1);
						const end = after === "'" ? to + 1 : to;
						const insert = `${f.name}'`;
						view.dispatch({
							changes: { from, to: end, insert },
							selection: { anchor: from + insert.length },
						});
					},
				}),
			),
		};
	}

	return {
		from: context.pos - chain.partialInput.length,
		validFor: /^'?\w*'?$/,
		options: filtered.map(
			(f): Completion => ({
				label: `'${f.name}'`,
				type: "property",
				detail: f.datatype + (f.isArray ? "[]" : ""),
				...(f.description != null ? { info: f.description } : {}),
				apply: `'${f.name}'`,
			}),
		),
	};
}

function isArrayPosition(
	chain: JsonbChain,
	pathChildren: FhirPathChildren,
	resourceType: string,
): boolean {
	if (!chain.lastRawSegment || /^\d+$/.test(chain.lastRawSegment)) return false;
	if (!chain.isPathOp && chain.insideQuote) return false;

	const fieldName = chain.lastRawSegment;
	const parentPath =
		chain.path.length > 1
			? `${resourceType}.${chain.path.slice(0, -1).join(".")}`
			: resourceType;
	const parentChildren = pathChildren[parentPath];
	if (!parentChildren) return false;

	const element = parentChildren.find((f) => f.name === fieldName);
	return !!element?.isArray;
}

function buildArrayIndexResult(
	chain: JsonbChain,
	context: CompletionContext,
): CompletionResult {
	return {
		from: context.pos - chain.partialInput.length,
		options: [
			{
				label: "0",
				type: "enum",
				detail: "array index",
			},
		],
	};
}

async function resolveNestedTypes(
	pathChildren: FhirPathChildren,
	resourceType: string,
	path: string[],
	fetchSchema: (type: string) => Promise<FhirPathChildren | null>,
): Promise<void> {
	for (let i = 0; i < path.length; i++) {
		const currentPath = `${resourceType}.${path.slice(0, i + 1).join(".")}`;

		if (pathChildren[currentPath]) continue;

		const parentPath =
			i === 0 ? resourceType : `${resourceType}.${path.slice(0, i).join(".")}`;
		const parentChildren = pathChildren[parentPath];
		if (!parentChildren) return;

		const segmentName = path[i]!;
		const element = parentChildren.find((f) => f.name === segmentName);
		if (!element?.datatype) return;

		if (element.datatype === "union") continue;

		const firstChar = element.datatype[0]!;
		if (firstChar !== firstChar.toUpperCase()) return;

		const typeChildren = await fetchSchema(element.datatype);
		if (!typeChildren) return;

		const typeName = element.datatype;
		for (const [key, children] of Object.entries(typeChildren)) {
			const suffix = key === typeName ? "" : key.slice(typeName.length);
			pathChildren[currentPath + suffix] = children;
		}
	}
}

// ── Completion extensions ──

function tableCompletionExtension(schemas: SchemaMap): Extension {
	const source = (context: CompletionContext): CompletionResult | null => {
		const line = context.state.doc.lineAt(context.pos);
		const textBefore = line.text.slice(0, context.pos - line.from);

		if (isInsideString(textBefore)) return null;

		const schemaDot = textBefore.match(/(\w+)\.(\w*)$/);
		if (schemaDot) {
			const schemaName = schemaDot[1]!;
			const tables = schemas[schemaName];
			if (!tables) return null;
			return {
				from: context.pos - (schemaDot[2] ?? "").length,
				options: tables.map((t) => ({ label: t, type: "table" })),
			};
		}

		const word = context.matchBefore(/\w*/);
		if (!word) return null;

		const beforeWord = textBefore.slice(0, word.from - line.from);
		if (!SQL_TABLE_KEYWORDS.test(beforeWord) && !context.explicit) return null;

		const options: { label: string; type: string; detail?: string }[] = [];

		for (const [schema, tables] of Object.entries(schemas)) {
			options.push({ label: `${schema}.`, type: "keyword", detail: "schema" });
			for (const table of tables) {
				if (schema === "public") {
					options.push({ label: table, type: "table" });
				} else {
					options.push({
						label: `${schema}.${table}`,
						type: "table",
						detail: schema,
					});
				}
			}
		}

		return { from: word.from, options };
	};

	return EditorState.languageData.of(() => [{ autocomplete: source }]);
}

function columnCompletionExtension(ctx: {
	schemas: SchemaMap;
	columns: ColumnMap;
}): Extension {
	const source = (context: CompletionContext): CompletionResult | null => {
		const line = context.state.doc.lineAt(context.pos);
		const textBefore = line.text.slice(0, context.pos - line.from);

		if (isInsideString(textBefore)) return null;

		const fullDoc = context.state.doc.toString();
		const statement = getCurrentStatement(fullDoc, context.pos);
		const aliases = buildAliasMap(statement, ctx.schemas);

		if (Object.keys(aliases).length === 0) return null;

		const aliasDot = textBefore.match(/(\w+)\.(\w*)$/);
		if (aliasDot) {
			const beforeAlias = textBefore.slice(
				0,
				textBefore.length - aliasDot[0].length,
			);
			if (SQL_TABLE_KEYWORDS.test(beforeAlias)) return null;

			const aliasName = aliasDot[1]!;
			const entry = aliases[aliasName.toLowerCase()];
			if (!entry) return null;
			const key = `${entry.schema}.${entry.table}`;
			const cols = ctx.columns[key];
			if (!cols || cols.length === 0) return null;

			return {
				from: context.pos - (aliasDot[2] ?? "").length,
				options: cols.map((c) => ({
					label: c.name,
					type: "variable",
					detail: c.dataType,
				})),
			};
		}

		const word = context.matchBefore(/\w*/);
		if (!word) return null;
		if (word.from === word.to && !context.explicit) return null;

		const textBeforeWord = textBefore.slice(0, word.from - line.from);
		if (SQL_TABLE_KEYWORDS.test(textBeforeWord)) return null;

		const seen = new Set<string>();
		const options: { label: string; type: string; detail: string }[] = [];
		for (const entry of Object.values(aliases)) {
			const key = `${entry.schema}.${entry.table}`;
			const cols = ctx.columns[key];
			if (!cols) continue;
			for (const c of cols) {
				const dedup = `${c.name}::${entry.table}`;
				if (seen.has(dedup)) continue;
				seen.add(dedup);
				options.push({
					label: c.name,
					type: "variable",
					detail: `${c.dataType} · ${entry.table}`,
				});
			}
		}

		if (options.length === 0) return null;
		return { from: word.from, options };
	};

	return EditorState.languageData.of(() => [{ autocomplete: source }]);
}

function triggerCompletionAfter(view: EditorView) {
	requestAnimationFrame(() => startCompletion(view));
}

function jsonbOperatorExtension(): Extension {
	const source = (context: CompletionContext): CompletionResult | null => {
		const line = context.state.doc.lineAt(context.pos);
		const textBefore = line.text.slice(0, context.pos - line.from);

		if (/\w\s*#$/.test(textBefore)) {
			return {
				from: context.pos - 1,
				options: [
					{
						label: "#>> '{}'",
						type: "operator",
						apply: (view, _completion, from, to) => {
							const insert = "#>> '{";
							view.dispatch({
								changes: { from, to, insert: `${insert}}' ` },
								selection: { anchor: from + insert.length },
							});
							triggerCompletionAfter(view);
						},
					},
					{
						label: "#> '{}'",
						type: "operator",
						apply: (view, _completion, from, to) => {
							const insert = "#> '{";
							view.dispatch({
								changes: { from, to, insert: `${insert}}' ` },
								selection: { anchor: from + insert.length },
							});
							triggerCompletionAfter(view);
						},
					},
				],
			};
		}

		if (/\w\s*->$/.test(textBefore) && !/\w\s*->>$/.test(textBefore)) {
			return {
				from: context.pos - 2,
				options: [
					{
						label: "->> ''",
						type: "operator",
						apply: (view, _completion, from, to) => {
							const insert = "->> '";
							view.dispatch({
								changes: { from, to, insert: `${insert}' ` },
								selection: { anchor: from + insert.length },
							});
							triggerCompletionAfter(view);
						},
					},
					{
						label: "-> ''",
						type: "operator",
						apply: (view, _completion, from, to) => {
							const insert = "-> '";
							view.dispatch({
								changes: { from, to, insert: `${insert}' ` },
								selection: { anchor: from + insert.length },
							});
							triggerCompletionAfter(view);
						},
					},
					{
						label: "->> 0",
						type: "operator",
						apply: (view, _completion, from, to) => {
							const insert = "->> ";
							view.dispatch({
								changes: { from, to, insert: `${insert}0 ` },
								selection: {
									anchor: from + insert.length,
									head: from + insert.length + 1,
								},
							});
						},
					},
					{
						label: "-> 0",
						type: "operator",
						apply: (view, _completion, from, to) => {
							const insert = "-> ";
							view.dispatch({
								changes: { from, to, insert: `${insert}0 ` },
								selection: {
									anchor: from + insert.length,
									head: from + insert.length + 1,
								},
							});
						},
					},
				],
			};
		}

		return null;
	};

	return EditorState.languageData.of(() => [{ autocomplete: source }]);
}

function jsonbCompletionExtension(ctx: {
	schemas: SchemaMap;
	jsonbColumns: JsonbColumnMap;
	sdCache: Record<string, FhirPathChildren>;
	sdNotFound: Set<string>;
	fetchSchema: (type: string) => Promise<FhirPathChildren | null>;
}): Extension {
	const resolveChain = (
		context: CompletionContext,
	): { chain: JsonbChain; resourceType: string } | null => {
		const line = context.state.doc.lineAt(context.pos);
		const textBefore = line.text.slice(0, context.pos - line.from);

		const chain = parseJsonbChain(textBefore);
		if (!chain) return null;

		const fullDoc = context.state.doc.toString();
		const statement = getCurrentStatement(fullDoc, context.pos);
		const aliases = buildAliasMap(statement, ctx.schemas);

		let resolved: AliasEntry | null = null;

		if (chain.tableOrAlias) {
			resolved = aliases[chain.tableOrAlias.toLowerCase()] ?? null;
		} else {
			for (const entry of Object.values(aliases)) {
				const key = `${entry.schema}.${entry.table}`;
				const cols = ctx.jsonbColumns[key];
				if (cols?.includes(chain.column)) {
					resolved = entry;
					break;
				}
			}
		}

		if (!resolved) return null;

		const jsonbKey = `${resolved.schema}.${resolved.table}`;
		const jsonbCols = ctx.jsonbColumns[jsonbKey];
		if (!jsonbCols?.includes(chain.column)) return null;

		if (chain.column !== "resource") return null;

		const resourceType = tableToResourceType(resolved.table);
		if (ctx.sdNotFound.has(resourceType)) return null;

		return { chain, resourceType };
	};

	const complete = async (
		chain: JsonbChain,
		resourceType: string,
		pathChildren: FhirPathChildren,
		context: CompletionContext,
	): Promise<CompletionResult | null> => {
		if (chain.path.length > 0) {
			await resolveNestedTypes(
				pathChildren,
				resourceType,
				chain.path,
				ctx.fetchSchema,
			);
		}

		if (isArrayPosition(chain, pathChildren, resourceType)) {
			return buildArrayIndexResult(chain, context);
		}

		return buildJsonbResult(chain, pathChildren, resourceType, context);
	};

	const source = (
		context: CompletionContext,
	): CompletionResult | null | Promise<CompletionResult | null> => {
		const info = resolveChain(context);
		if (!info) return null;

		const { chain, resourceType } = info;

		const cached = ctx.sdCache[resourceType];
		if (cached) {
			if (chain.path.length === 0) {
				return buildJsonbResult(chain, cached, resourceType, context);
			}
			return complete(chain, resourceType, cached, context);
		}

		return ctx.fetchSchema(resourceType).then((fetched) => {
			if (!fetched) return null;
			return complete(chain, resourceType, fetched, context);
		});
	};

	return EditorState.languageData.of(() => [{ autocomplete: source }]);
}

function sqlCompletionOverride(): Extension {
	return autocompletion({
		override: [
			async (context: CompletionContext): Promise<CompletionResult | null> => {
				const line = context.state.doc.lineAt(context.pos);
				const textBefore = line.text.slice(0, context.pos - line.from);
				const inJsonb = isInJsonbContext(textBefore);

				const langSources = context.state.languageDataAt<CompletionSource>(
					"autocomplete",
					context.pos,
				);

				const results = (
					await Promise.all(
						langSources.map((src) => Promise.resolve(src(context))),
					)
				).filter((r): r is CompletionResult => r !== null);

				if (results.length === 0) return null;

				if (inJsonb) {
					const jsonbTypes = new Set(["property", "enum", "operator"]);
					const jsonbResult = results.find((r) =>
						r.options.some((o) => jsonbTypes.has(o.type ?? "")),
					);
					if (!jsonbResult) return null;
					return {
						...jsonbResult,
						options: jsonbResult.options.filter((o) =>
							jsonbTypes.has(o.type ?? ""),
						),
					};
				}

				const aliasColumnResult = results.find((r) =>
					r.options.length > 0 && r.options.every((o) => o.type === "variable"),
				);
				if (aliasColumnResult) return aliasColumnResult;

				const hasTableResults = results.some((r) =>
					r.options.some((o) => o.type === "table"),
				);

				if (hasTableResults) {
					const tableOptions = results.flatMap((r) =>
						r.options.filter((o) => o.type === "table" || o.type === "keyword"),
					);
					const from = results.find((r) =>
						r.options.some((o) => o.type === "table"),
					)?.from;
					if (from == null) return null;
					return { from, options: tableOptions };
				}

				if (results.length === 1) return results[0]!;

				const groups = new Map<
					number,
					{ from: number; options: Completion[] }
				>();
				for (const r of results) {
					const existing = groups.get(r.from);
					if (existing) {
						existing.options.push(...r.options);
					} else {
						groups.set(r.from, {
							from: r.from,
							options: [...r.options],
						});
					}
				}

				let best: { from: number; options: Completion[] } | null = null;
				for (const g of groups.values()) {
					if (!best || g.options.length > best.options.length) best = g;
				}
				if (best) {
					best.options = best.options.map((o) => {
						if (o.type === "keyword") return { ...o, boost: 2 };
						if (o.type === "type") return { ...o, boost: 1 };
						if (o.type === "variable") return { ...o, boost: -1 };
						return o;
					});
				}
				return best;
			},
		],
	});
}

// ── Public API ──

export async function fetchSqlMetadata(
	executeSql: SqlConfig["executeSql"],
): Promise<SqlMetadata> {
	const [tablesRows, jsonbRows, functionsRows, columnsRows] = await Promise.all(
		[
			executeSql(TABLES_QUERY, "tables"),
			executeSql(JSONB_COLUMNS_QUERY, "jsonb_columns"),
			executeSql(FUNCTIONS_QUERY, "functions"),
			executeSql(COLUMNS_QUERY, "columns"),
		],
	);

	const schemas: SchemaMap = {};
	for (const row of tablesRows) {
		const s = String(row.table_schema);
		if (!schemas[s]) schemas[s] = [];
		schemas[s].push(String(row.table_name));
	}

	const jsonbColumns: JsonbColumnMap = {};
	for (const row of jsonbRows) {
		const key = `${row.table_schema}.${row.table_name}`;
		if (!jsonbColumns[key]) jsonbColumns[key] = [];
		jsonbColumns[key].push(String(row.column_name));
	}

	const functions = functionsRows.map((r) => String(r.name));

	const columns: ColumnMap = {};
	for (const row of columnsRows) {
		const key = `${row.table_schema}.${row.table_name}`;
		if (!columns[key]) columns[key] = [];
		columns[key].push({
			name: String(row.column_name),
			dataType: String(row.data_type),
		});
	}

	return { schemas, jsonbColumns, functions, columns };
}

export function buildSqlCompletionExtensions(
	metadata: SqlMetadata,
	executeSql: SqlConfig["executeSql"],
): Extension[] {
	const sdCache: Record<string, FhirPathChildren> = {};
	const sdNotFound = new Set<string>();

	const fetchSchema = async (
		resourceType: string,
	): Promise<FhirPathChildren | null> => {
		if (sdCache[resourceType]) return sdCache[resourceType];
		if (sdNotFound.has(resourceType)) return null;

		try {
			const name = resourceType.replace(/'/g, "''");
			const rows = await executeSql(
				`SELECT resource FROM far.canonicalresource WHERE rt = 'StructureDefinition' AND resource->>'name' = '${name}' LIMIT 1`,
				"structure_definition",
			);
			const sd = (rows[0]?.resource ?? null) as StructureDefinition | null;
			if (!sd) {
				sdNotFound.add(resourceType);
				return null;
			}

			const pathChildren = buildFromStructureDefinition(sd);
			transformReferenceFields(pathChildren);
			sdCache[resourceType] = pathChildren;
			return pathChildren;
		} catch {
			sdNotFound.add(resourceType);
			return null;
		}
	};

	return [
		EditorView.theme({
			".cm-tooltip.cm-tooltip-autocomplete": {
				background: "var(--color-bg-primary)",
				border: "1px solid var(--color-border-primary)",
				borderRadius: "var(--radius-md)",
				padding: "4px",
				boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
				fontFamily: "var(--font-family-sans)",
				fontSize: "14px",
			},
			".cm-tooltip.cm-tooltip-autocomplete > ul": {
				maxHeight: "300px",
			},
			".cm-tooltip-autocomplete ul li": {
				padding: "4px 8px",
				borderRadius: "4px",
			},
			".cm-tooltip-autocomplete ul li[aria-selected]": {
				background: "var(--color-bg-quaternary)",
				color: "var(--color-text-primary)",
			},
			".cm-completionLabel": {
				color: "var(--color-text-primary)",
				fontSize: "14px",
			},
			".cm-completionDetail": {
				color: "var(--color-text-tertiary)",
				fontSize: "12px",
				fontStyle: "normal",
				marginLeft: "8px",
			},
			".cm-completionIcon": {
				padding: "0",
				marginRight: "6px",
				width: "18px",
				height: "18px",
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				borderRadius: "4px",
				fontSize: "11px",
				fontWeight: "600",
				lineHeight: "1",
				boxSizing: "border-box",
			},
			".cm-completionIcon-table": {
				background: "var(--color-blue-100)",
				color: "var(--color-blue-600)",
			},
			".cm-completionIcon-table::after": {
				content: "'T'",
			},
			".cm-completionIcon-keyword": {
				background: "var(--color-green-200)",
				color: "var(--color-green-700)",
			},
			".cm-completionIcon-keyword::after": {
				content: "'S'",
			},
			".cm-completionIcon-property": {
				background: "var(--color-purple-100)",
				color: "var(--color-purple-600)",
			},
			".cm-completionIcon-property::after": {
				content: "'F'",
			},
			".cm-completionIcon-variable": {
				background: "var(--color-yellow-200)",
				color: "var(--color-yellow-700)",
			},
			".cm-completionIcon-variable::after": {
				content: "'C'",
			},
		}),
		tableCompletionExtension(metadata.schemas),
		columnCompletionExtension({
			schemas: metadata.schemas,
			columns: metadata.columns,
		}),
		jsonbCompletionExtension({
			schemas: metadata.schemas,
			jsonbColumns: metadata.jsonbColumns,
			sdCache,
			sdNotFound,
			fetchSchema,
		}),
		jsonbOperatorExtension(),
		sqlCompletionOverride(),
	];
}
