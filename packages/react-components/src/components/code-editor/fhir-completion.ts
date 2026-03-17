import type {
	Completion,
	CompletionContext,
	CompletionResult,
	CompletionSource,
} from "@codemirror/autocomplete";
import { jsonLanguage } from "@codemirror/lang-json";
import { yamlLanguage } from "@codemirror/lang-yaml";
import type { Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

// ── Types ──────────────────────────────────────────────────────────────

interface FhirElementType {
	code: string;
	targetProfile?: string[];
}

interface FhirElement {
	path: string;
	short?: string;
	definition?: string;
	min?: number;
	max?: string;
	type?: FhirElementType[];
	binding?: { valueSet: string; strength: string };
}

interface StructureDefinition {
	type: string;
	name?: string;
	baseDefinition?: string;
	differential?: { element: FhirElement[] };
}

export interface StructureDefinitionSearchParams {
	type?: string;
	url?: string;
	derivation?: string;
	"derivation:missing"?: string;
	kind?: string;
	_count?: string;
	_elements?: string;
}

export type GetStructureDefinitions = (
	params: StructureDefinitionSearchParams,
) => Promise<StructureDefinition[]>;

// ── Cache ──────────────────────────────────────────────────────────────

const sdCache = new Map<string, StructureDefinition | null>();
const pendingRequests = new Map<string, Promise<StructureDefinition | null>>();
const listCache = new Map<string, StructureDefinition[]>();
const pendingListRequests = new Map<string, Promise<StructureDefinition[]>>();

const SD_ELEMENTS = "differential,type,name,baseDefinition";

function cacheKey(params: StructureDefinitionSearchParams): string {
	return JSON.stringify(params);
}

async function getCachedSDList(
	params: StructureDefinitionSearchParams,
	getSDs: GetStructureDefinitions,
): Promise<StructureDefinition[]> {
	const key = cacheKey(params);
	if (listCache.has(key)) return listCache.get(key) ?? [];

	let pending = pendingListRequests.get(key);
	if (!pending) {
		pending = getSDs(params)
			.then((list) => {
				listCache.set(key, list);
				pendingListRequests.delete(key);
				// Only cache individual SDs that have differential
				for (const sd of list) {
					if (sd.differential?.element) {
						sdCache.set(sd.type, sd);
					}
				}
				return list;
			})
			.catch(() => {
				pendingListRequests.delete(key);
				listCache.set(key, []);
				return [];
			});
		pendingListRequests.set(key, pending);
	}
	return pending;
}

async function getCachedSD(
	type: string,
	getSDs: GetStructureDefinitions,
): Promise<StructureDefinition | null> {
	if (sdCache.has(type)) return sdCache.get(type) ?? null;

	const key = `single:${type}`;
	let pending = pendingRequests.get(key);
	if (!pending) {
		const isUrl = type.includes("/");
		const searchByType = (params: StructureDefinitionSearchParams) =>
			getSDs(params).then((list) => list[0] ?? null);

		pending = (
			isUrl
				? searchByType({ url: type, _elements: SD_ELEMENTS, _count: "1" })
				: searchByType({
						type,
						derivation: "specialization",
						_elements: SD_ELEMENTS,
						_count: "1",
					}).then(
						(sd) =>
							sd ??
							searchByType({
								type,
								"derivation:missing": "true",
								_elements: SD_ELEMENTS,
								_count: "1",
							}),
					)
		)
			.then((sd) => {
				sdCache.set(type, sd);
				pendingRequests.delete(key);
				return sd;
			})
			.catch(() => {
				pendingRequests.delete(key);
				return null;
			});
		pendingRequests.set(key, pending);
	}
	return pending;
}

// ── JSON path at cursor ────────────────────────────────────────────────

function getJsonPathAtCursor(doc: string, pos: number): string[] {
	const path: string[] = [];
	let inString = false;
	let isEscaped = false;
	let currentKey = "";
	let collectingKey = false;
	let lastKey = "";

	for (let i = 0; i < pos; i++) {
		const ch = doc[i];

		if (isEscaped) {
			if (collectingKey) currentKey += ch;
			isEscaped = false;
			continue;
		}
		if (ch === "\\") {
			isEscaped = true;
			if (collectingKey) currentKey += ch;
			continue;
		}
		if (ch === '"') {
			if (!inString) {
				inString = true;
				collectingKey = true;
				currentKey = "";
			} else {
				inString = false;
				if (collectingKey) {
					lastKey = currentKey;
					collectingKey = false;
				}
			}
			continue;
		}
		if (inString) {
			if (collectingKey) currentKey += ch;
			continue;
		}
		if (ch === "{") {
			if (lastKey) path.push(lastKey);
			lastKey = "";
		} else if (ch === "}") {
			path.pop();
			lastKey = "";
		} else if (ch === ",") {
			lastKey = "";
		}
	}
	return path;
}

// ── YAML path at cursor ─────────────────────────────────────────────────

function getYamlPathAtCursor(doc: string, pos: number): string[] {
	const lines = doc.slice(0, pos).split("\n");
	const currentLine = lines[lines.length - 1] ?? "";
	const currentIndent = currentLine.search(/\S/);

	// Walk backwards to build path from indentation
	const path: string[] = [];
	let targetIndent = currentIndent;

	for (let i = lines.length - 2; i >= 0; i--) {
		const line = lines[i] ?? "";
		const trimmed = line.trimStart();
		if (!trimmed || trimmed.startsWith("#")) continue;

		const indent = line.search(/\S/);
		// Strip leading "- " for array items
		const content = trimmed.startsWith("- ") ? trimmed.slice(2) : trimmed;
		const colonIdx = content.indexOf(":");

		if (indent < targetIndent && colonIdx > 0) {
			const key = content.slice(0, colonIdx).trim();
			path.unshift(key);
			targetIndent = indent;
		}
	}

	return path;
}

function getYamlResourceType(doc: string): string | null {
	const match = doc.match(/^resourceType:\s*(\S+)/m);
	return match?.[1] ?? null;
}

function isYamlPropertyPosition(beforeCursor: string): boolean {
	const trimmed = beforeCursor.trimStart();
	// Empty line, or typing a key (no colon yet), or after "- "
	if (trimmed === "" || trimmed === "-" || trimmed === "- ") return true;
	if (trimmed.includes(":")) return false;
	// Typing a word without colon = key position
	return /^(-\s+)?[\w]*$/.test(trimmed);
}

function isYamlValuePosition(beforeCursor: string): string | null {
	const match = beforeCursor.match(/(\w+):\s*(\S*)$/);
	if (match) return match[1] ?? null;
	return null;
}

// ── Element helpers ────────────────────────────────────────────────────

function fieldName(element: FhirElement): string {
	const parts = element.path.split(".");
	return (parts[parts.length - 1] ?? "").replace("[x]", "");
}

function directChildren(
	elements: FhirElement[],
	parentPath: string,
): FhirElement[] {
	const prefix = `${parentPath}.`;
	return elements.filter((el) => {
		if (!el.path.startsWith(prefix)) return false;
		const rest = el.path.slice(prefix.length);
		return !rest.includes(".");
	});
}

function findElement(
	elements: FhirElement[],
	parentPath: string,
	key: string,
): FhirElement | undefined {
	// Direct match
	const direct = elements.find((el) => {
		if (!el.path.startsWith(`${parentPath}.`)) return false;
		const name = fieldName(el);
		return name === key || name.toLowerCase() === key.toLowerCase();
	});
	if (direct) return direct;

	// Choice type match: key "deceasedBoolean" → element "deceased[x]" with type boolean
	return elements.find((el) => {
		if (!el.path.endsWith("[x]")) return false;
		if (!el.path.startsWith(`${parentPath}.`)) return false;
		const baseName = fieldName(el);
		if (!key.toLowerCase().startsWith(baseName.toLowerCase())) return false;
		const typeSuffix = key.slice(baseName.length).toLowerCase();
		return el.type?.some((t) => t.code.toLowerCase() === typeSuffix) ?? false;
	});
}

// ── Resolve completions at path ────────────────────────────────────────

// Collect all elements including inherited from base definitions
async function collectAllElements(
	type: string,
	getSDs: GetStructureDefinitions,
): Promise<{ elements: FhirElement[]; basePath: string } | null> {
	const sd = await getCachedSD(type, getSDs);
	console.log(
		"[fhir] collectAllElements:",
		type,
		"sd:",
		sd?.type,
		"elements:",
		sd?.differential?.element?.length,
	);
	if (!sd?.differential?.element) return null;

	const elements = [...sd.differential.element];

	// Recursively load base definition elements
	if (sd.baseDefinition) {
		const base = await collectAllElements(sd.baseDefinition, getSDs);
		if (base) {
			for (const baseEl of base.elements) {
				const remappedPath = baseEl.path.replace(
					new RegExp(`^${base.basePath}`),
					sd.type,
				);
				if (!elements.some((e) => e.path === remappedPath)) {
					elements.push({ ...baseEl, path: remappedPath });
				}
			}
		}
	}

	return { elements, basePath: sd.type };
}

async function resolveElements(
	path: string[],
	resourceType: string,
	getSDs: GetStructureDefinitions,
): Promise<FhirElement[]> {
	const result = await collectAllElements(resourceType, getSDs);
	if (!result) return [];

	let currentPath = resourceType;
	let currentElements = result.elements;

	for (const key of path) {
		if (key === "resourceType") return [];

		const el = findElement(currentElements, currentPath, key);
		if (!el?.type?.[0]) return [];

		const typeCode = el.type[0].code;

		if (typeCode === "BackboneElement") {
			currentPath = el.path;
			continue;
		}

		const typeResult = await collectAllElements(typeCode, getSDs);
		if (!typeResult) return [];
		currentPath = typeResult.basePath;
		currentElements = typeResult.elements;
	}

	// Expand choice types and collect
	const children = directChildren(currentElements, currentPath);
	const expanded: FhirElement[] = [];

	for (const el of children) {
		const isChoiceType = el.path.endsWith("[x]");
		if (isChoiceType && el.type && el.type.length > 0) {
			for (const t of el.type) {
				expanded.push({
					...el,
					path: el.path.replace(
						"[x]",
						t.code.charAt(0).toUpperCase() + t.code.slice(1),
					),
					type: [t],
				});
			}
		} else {
			expanded.push(el);
		}
	}

	return expanded;
}

function elementsToCompletions(
	elements: FhirElement[],
	mapFn: (el: FhirElement) => Completion,
): Completion[] {
	const completions: Completion[] = [];
	for (const el of elements) {
		completions.push(mapFn(el));
		// Primitive extensions
		const name = fieldName(el);
		const firstTypeCode = el.type?.[0]?.code;
		if (
			el.type?.length === 1 &&
			firstTypeCode &&
			PRIMITIVE_TYPES.has(firstTypeCode)
		) {
			const ext: Completion = {
				label: `_${name}`,
				type: "property",
				detail: "Element",
				boost: -1,
			};
			ext.info = "Primitive element extension";
			completions.push(ext);
		}
	}
	return completions;
}

const PRIMITIVE_TYPES = new Set([
	"boolean",
	"integer",
	"string",
	"decimal",
	"uri",
	"url",
	"canonical",
	"base64Binary",
	"instant",
	"date",
	"dateTime",
	"time",
	"code",
	"oid",
	"id",
	"markdown",
	"unsignedInt",
	"positiveInt",
	"uuid",
	"xhtml",
]);

type SnippetKind =
	| "array-complex"
	| "array-primitive"
	| "object"
	| "string"
	| "number"
	| "bare";

function snippetKind(element: FhirElement): SnippetKind {
	const isArray = element.max === "*";
	const typeCode = element.type?.[0]?.code;
	if (!typeCode) return "bare";
	if (isArray)
		return PRIMITIVE_TYPES.has(typeCode) ? "array-primitive" : "array-complex";
	if (
		typeCode === "boolean" ||
		typeCode === "integer" ||
		typeCode === "decimal" ||
		typeCode === "positiveInt" ||
		typeCode === "unsignedInt"
	)
		return "number";
	if (PRIMITIVE_TYPES.has(typeCode)) return "string";
	return "object";
}

function buildSnippet(
	name: string,
	kind: SnippetKind,
	indent: string,
): { text: string; cursorOffset: number } {
	const inner = indent + "  ";
	const innerInner = inner + "  ";
	switch (kind) {
		case "array-complex": {
			const text = `"${name}": [\n${inner}{\n${innerInner}\n${inner}}\n${indent}]`;
			return {
				text,
				cursorOffset: text.indexOf(innerInner) + innerInner.length,
			};
		}
		case "array-primitive": {
			const text = `"${name}": []`;
			return { text, cursorOffset: text.length - 1 };
		}
		case "object": {
			const text = `"${name}": {\n${inner}\n${indent}}`;
			return { text, cursorOffset: text.indexOf(inner + "\n") + inner.length };
		}
		case "string": {
			const text = `"${name}": ""`;
			return { text, cursorOffset: text.length - 1 };
		}
		case "number":
		case "bare":
		default: {
			const text = `"${name}": `;
			return { text, cursorOffset: text.length };
		}
	}
}

function toCompletion(element: FhirElement): Completion {
	const name = fieldName(element);
	const types = element.type?.map((t) => t.code).join(" | ") ?? "";
	const kind = snippetKind(element);

	const completion: Completion = {
		label: name,
		type: "property",
		detail: types,
		boost: element.min && element.min > 0 ? 2 : 0,
		apply: (view, _completion, from, to) => {
			const doc = view.state.doc.toString();
			let actualFrom = from;
			let actualTo = to;
			if (actualFrom > 0 && doc[actualFrom - 1] === '"') actualFrom--;
			if (actualTo < doc.length && doc[actualTo] === '"') actualTo++;

			// Detect current indentation
			const line = view.state.doc.lineAt(actualFrom);
			const lineText = line.text;
			const indent = lineText.match(/^(\s*)/)?.[1] ?? "";

			const { text, cursorOffset } = buildSnippet(name, kind, indent);

			view.dispatch({
				changes: { from: actualFrom, to: actualTo, insert: text },
				selection: { anchor: actualFrom + cursorOffset },
			});
		},
	};
	if (element.short) completion.info = element.short;
	return completion;
}

// ── Completion source ──────────────────────────────────────────────────

// Check if cursor is in a value position (after "key": or key: )
function isValuePosition(beforeCursor: string): string | null {
	const match = beforeCursor.match(/"?(\w+)"?\s*:\s*"?([^"]*)?$/);
	if (match) return match[1] ?? null;
	return null;
}

export function fhirCompletionSource(
	getSDs: GetStructureDefinitions,
): CompletionSource {
	return async (
		context: CompletionContext,
	): Promise<CompletionResult | null> => {
		const { state, pos } = context;
		const doc = state.doc.toString();

		const line = state.doc.lineAt(pos);
		const beforeCursor = line.text.slice(0, pos - line.from).trimStart();

		// Check if we're in a value position for resourceType
		const valueKey = isValuePosition(beforeCursor);
		if (valueKey === "resourceType") {
			const sds = await getCachedSDList(
				{
					derivation: "specialization",
					kind: "resource",
					_elements: "type",
					_count: "500",
				},
				getSDs,
			);
			const options: Completion[] = sds.map((sd) => ({
				label: sd.type,
				type: "type",
				apply: (view: EditorView, _c: Completion, from: number, to: number) => {
					const d = view.state.doc.toString();
					let actualTo = to;
					if (actualTo < d.length && d[actualTo] === '"') actualTo++;
					view.dispatch({
						changes: { from, to: actualTo, insert: `${sd.type}"` },
						selection: { anchor: from + sd.type.length + 1 },
					});
				},
			}));
			if (options.length === 0) return null;
			const word = context.matchBefore(/[\w]*/);
			return { from: word?.from ?? pos, options, validFor: /^\w*$/ };
		}

		// Property name position — with or without quotes
		const isPropertyPosition =
			beforeCursor === "" ||
			beforeCursor === '"' ||
			/^"?[\w]*$/.test(beforeCursor);

		if (!isPropertyPosition) return null;

		const path = getJsonPathAtCursor(doc, pos);
		const rtMatch = doc.match(/"resourceType"\s*:\s*"([^"]+)"/) ??
			doc.match(/resourceType\s*:\s*"([^"]+)"/);
		const resourceType = rtMatch?.[1];

		let completions: Completion[];
		if (resourceType) {
			const elements = await resolveElements(path, resourceType, getSDs);
			completions = elementsToCompletions(elements, toCompletion);
		} else if (path.length === 0) {
			const rtCompletion: Completion = {
				label: "resourceType",
				type: "property",
				detail: "string",
				boost: 10,
				apply: (view, _completion, from, to) => {
					const d = view.state.doc.toString();
					let actualFrom = from;
					let actualTo = to;
					if (actualFrom > 0 && d[actualFrom - 1] === '"') actualFrom--;
					if (actualTo < d.length && d[actualTo] === '"') actualTo++;
					const text = '"resourceType": ""';
					view.dispatch({
						changes: { from: actualFrom, to: actualTo, insert: text },
						selection: { anchor: actualFrom + text.length - 1 },
					});
				},
			};
			rtCompletion.info = "FHIR resource type";
			const domainElements = await resolveElements(
				path,
				"DomainResource",
				getSDs,
			);
			completions = [
				rtCompletion,
				...elementsToCompletions(domainElements, toCompletion),
			];
		} else {
			return null;
		}

		if (completions.length === 0) return null;

		const word = context.matchBefore(/"?\w*/);
		let from = word?.from ?? pos;
		if (from < doc.length && doc[from] === '"') from++;

		return { from, options: completions, validFor: /^\w*$/ };
	};
}

// ── YAML completion helpers ─────────────────────────────────────────────

function toYamlFieldCompletion(element: FhirElement): Completion {
	const name = fieldName(element);
	const types = element.type?.map((t) => t.code).join(" | ") ?? "";
	const isArray = element.max === "*";
	const typeCode = element.type?.[0]?.code;
	const isPrimitive = typeCode ? PRIMITIVE_TYPES.has(typeCode) : false;

	const completion: Completion = {
		label: name,
		type: "property",
		detail: types,
		boost: element.min && element.min > 0 ? 2 : 0,
		apply: (view, _completion, from, to) => {
			const line = view.state.doc.lineAt(from);
			// Indent = everything before cursor position on this line
			const charsBeforeFrom = from - line.from;
			const indent = " ".repeat(charsBeforeFrom);
			const inner = `${indent}  `;

			let text: string;
			let cursorOffset: number;
			const isString = typeCode === "string" || typeCode === "code" || typeCode === "uri" || typeCode === "url" || typeCode === "canonical" || typeCode === "id" || typeCode === "markdown" || typeCode === "oid" || typeCode === "uuid" || typeCode === "base64Binary" || typeCode === "xhtml";
			if (isArray) {
				text = `${name}:\n${inner}- `;
				cursorOffset = text.length;
			} else if (isString) {
				text = `${name}: ''`;
				cursorOffset = text.length - 1;
			} else if (isPrimitive) {
				text = `${name}: `;
				cursorOffset = text.length;
			} else {
				text = `${name}:\n${inner}`;
				cursorOffset = text.length;
			}

			view.dispatch({
				changes: { from, to, insert: text },
				selection: { anchor: from + cursorOffset },
			});
		},
	};
	if (element.short) completion.info = element.short;
	return completion;
}

// ── YAML completion source ──────────────────────────────────────────────

export function yamlFhirCompletionSource(
	getSDs: GetStructureDefinitions,
): CompletionSource {
	return async (
		context: CompletionContext,
	): Promise<CompletionResult | null> => {
		const { state, pos } = context;
		const doc = state.doc.toString();

		const line = state.doc.lineAt(pos);
		const beforeCursor = line.text.slice(0, pos - line.from);

		// Value position for resourceType
		const valueKey = isYamlValuePosition(beforeCursor);
		if (valueKey === "resourceType") {
			const sds = await getCachedSDList(
				{
					derivation: "specialization",
					kind: "resource",
					_elements: "type",
					_count: "500",
				},
				getSDs,
			);
			const options: Completion[] = sds.map((sd) => ({
				label: sd.type,
				type: "type",
			}));
			if (options.length === 0) return null;
			const word = context.matchBefore(/[\w]*/);
			return { from: word?.from ?? pos, options, validFor: /^\w*$/ };
		}

		if (!isYamlPropertyPosition(beforeCursor)) return null;

		const path = getYamlPathAtCursor(doc, pos);
		const resourceType = getYamlResourceType(doc);

		let completions: Completion[];
		if (resourceType) {
			const elements = await resolveElements(path, resourceType, getSDs);
			completions = elementsToCompletions(elements, toYamlFieldCompletion);
		} else if (path.length === 0) {
			const rtCompletion: Completion = {
				label: "resourceType",
				type: "property",
				detail: "string",
				boost: 10,
				apply: "resourceType: ",
			};
			rtCompletion.info = "FHIR resource type";
			const domainElements = await resolveElements(
				path,
				"DomainResource",
				getSDs,
			);
			completions = [
				rtCompletion,
				...elementsToCompletions(domainElements, toYamlFieldCompletion),
			];
		} else {
			return null;
		}

		if (completions.length === 0) return null;

		// Strip "- " prefix for matching
		const word = context.matchBefore(/[\w]*/);

		return { from: word?.from ?? pos, options: completions, validFor: /^\w*$/ };
	};
}

// ── Public API ─────────────────────────────────────────────────────────

export function buildFhirCompletionExtension(
	getSDs: GetStructureDefinitions,
): Extension {
	const jsonSource = fhirCompletionSource(getSDs);
	const yamlSource = yamlFhirCompletionSource(getSDs);
	return [
		jsonLanguage.data.of({ autocomplete: jsonSource }),
		yamlLanguage.data.of({ autocomplete: yamlSource }),
	];
}
