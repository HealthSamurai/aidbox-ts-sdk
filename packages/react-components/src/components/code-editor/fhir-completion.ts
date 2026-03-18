import type {
	Completion,
	CompletionContext,
	CompletionResult,
	CompletionSource,
} from "@codemirror/autocomplete";
import { jsonLanguage } from "@codemirror/lang-json";
import { yamlLanguage } from "@codemirror/lang-yaml";
import {
	type Extension,
	RangeSet,
	StateEffect,
	StateField,
} from "@codemirror/state";
import {
	Decoration,
	EditorView,
	GutterMarker,
	gutterLineClass,
	ViewPlugin,
	type ViewUpdate,
} from "@codemirror/view";
import { ensureSyntaxTree, syntaxTree } from "@codemirror/language";
import type { SyntaxNode } from "@lezer/common";

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
	contentReference?: string;
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
	let currentIndent = currentLine.search(/\S/);
	if (currentIndent === -1) currentIndent = currentLine.length;

	// Walk backwards to build path from indentation
	const path: string[] = [];
	let targetIndent = currentIndent;

	for (let i = lines.length - 2; i >= 0; i--) {
		const line = lines[i] ?? "";
		const trimmed = line.trimStart();
		if (!trimmed || trimmed.startsWith("#")) continue;

		const indent = line.search(/\S/);
		const isArrayItem = trimmed.startsWith("- ");
		const content = isArrayItem ? trimmed.slice(2) : trimmed;
		const colonIdx = content.indexOf(":");

		if (indent < targetIndent && colonIdx > 0) {
			// For array items like "  - given:", dash is at indent 2 but
			// content starts at indent 4. If cursor is at indent 4, it's a
			// sibling of "given" (same array item), not nested under it.
			if (isArrayItem && indent + 2 >= targetIndent) {
				targetIndent = indent;
				continue;
			}
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
	// Empty line, or after "- " (dash with space)
	if (trimmed === "" || trimmed === "- ") return true;
	// Bare "-" without space — not ready for property yet
	if (trimmed === "-") return false;
	if (trimmed.includes(":")) return false;
	// Typing a word without colon = key position (optionally after "- ")
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
		if (!el) return [];

		// contentReference (e.g. "#Questionnaire.item") — resolve to referenced path
		if (el.contentReference) {
			const refPath = el.contentReference.replace(/^#/, "");
			currentPath = refPath;
			continue;
		}

		if (!el.type?.[0]) return [];
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

function isPrimitiveType(typeCode: string): boolean {
	return (
		PRIMITIVE_TYPES.has(typeCode) ||
		typeCode.startsWith("http://hl7.org/fhirpath/System.")
	);
}

const FHIR_STRING_TYPES = new Set([
	"string",
	"code",
	"uri",
	"url",
	"canonical",
	"id",
	"markdown",
	"oid",
	"uuid",
	"base64Binary",
	"xhtml",
	"http://hl7.org/fhirpath/System.String",
]);

const FHIR_NUMBER_TYPES = new Set([
	"boolean",
	"integer",
	"decimal",
	"positiveInt",
	"unsignedInt",
	"http://hl7.org/fhirpath/System.Boolean",
	"http://hl7.org/fhirpath/System.Integer",
	"http://hl7.org/fhirpath/System.Decimal",
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
	if (!typeCode) {
		// contentReference elements have no type but are complex objects
		if (element.contentReference) return isArray ? "array-complex" : "object";
		return "bare";
	}
	if (isArray)
		return isPrimitiveType(typeCode) ? "array-primitive" : "array-complex";
	if (FHIR_NUMBER_TYPES.has(typeCode)) return "number";
	if (isPrimitiveType(typeCode)) return "string";
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

			// If replacing an existing property name (colon already follows),
			// only replace the name, don't insert a snippet with value
			const afterName = doc.slice(actualTo).match(/^\s*:/);
			if (afterName) {
				const insert = `"${name}"`;
				view.dispatch({
					changes: { from: actualFrom, to: actualTo, insert },
					selection: { anchor: actualFrom + insert.length },
				});
				return;
			}

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

// ── Reference target resolution ────────────────────────────────────────

async function resolveReferenceTargets(
	path: string[],
	resourceType: string,
	getSDs: GetStructureDefinitions,
): Promise<string[] | null> {
	// path is the path TO the Reference element (e.g. ["managingOrganization"])
	// We need to find the element at this path and check if its type is Reference
	const result = await collectAllElements(resourceType, getSDs);
	if (!result) return null;

	let currentPath = resourceType;
	let currentElements = result.elements;

	// Walk all segments except the last to resolve the parent context
	for (let i = 0; i < path.length - 1; i++) {
		const key = path[i]!;
		if (key === "resourceType") return null;

		const el = findElement(currentElements, currentPath, key);
		if (!el) return null;

		if (el.contentReference) {
			currentPath = el.contentReference.replace(/^#/, "");
			continue;
		}
		if (!el.type?.[0]) return null;
		const typeCode = el.type[0].code;
		if (typeCode === "BackboneElement") {
			currentPath = el.path;
			continue;
		}
		const typeResult = await collectAllElements(typeCode, getSDs);
		if (!typeResult) return null;
		currentPath = typeResult.basePath;
		currentElements = typeResult.elements;
	}

	// Now find the last segment — this should be a Reference element
	const lastKey = path[path.length - 1];
	if (!lastKey) return null;

	const el = findElement(currentElements, currentPath, lastKey);
	if (!el?.type) return null;

	// Collect targetProfile from all Reference types
	const targets: string[] = [];
	for (const t of el.type) {
		if (t.code === "Reference" && t.targetProfile) {
			for (const profile of t.targetProfile) {
				// Extract resource type from profile URL: "http://hl7.org/fhir/StructureDefinition/Organization" → "Organization"
				const rt = profile.split("/").pop();
				if (rt) targets.push(rt);
			}
		}
	}
	return targets.length > 0 ? targets : null;
}

// Check if cursor is directly inside a JSON array (not inside an object within the array)
function isInsideJsonArray(doc: string, pos: number): boolean {
	let depth = 0;
	let inString = false;
	let isEscaped = false;
	for (let i = pos - 1; i >= 0; i--) {
		const ch = doc[i];
		if (isEscaped) {
			isEscaped = false;
			continue;
		}
		if (ch === "\\") {
			isEscaped = true;
			continue;
		}
		if (ch === '"') {
			inString = !inString;
			continue;
		}
		if (inString) continue;
		if (ch === "}" || ch === "]") {
			depth++;
		} else if (ch === "{") {
			if (depth === 0) return false;
			depth--;
		} else if (ch === "[") {
			if (depth === 0) return true;
			depth--;
		}
	}
	return false;
}

// Check if cursor is in a value position (after "key": or key: )
function isValuePosition(beforeCursor: string): string | null {
	const match = beforeCursor.match(/"?(\w+)"?\s*:\s*"?([^"]*)?$/);
	if (match) return match[1] ?? null;
	return null;
}

export function fhirCompletionSource(
	getSDs: GetStructureDefinitions,
	resourceTypeHint?: string,
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

		// Check if we're in a value position for "reference" inside a Reference type
		if (valueKey === "reference") {
			const path = getJsonPathAtCursor(doc, pos);
			const rtMatch = doc.match(/"resourceType"\s*:\s*"([^"]+)"/);
			const resourceType = rtMatch?.[1] ?? resourceTypeHint;
			if (resourceType && path.length > 0) {
				const targets = await resolveReferenceTargets(path, resourceType, getSDs);
				if (targets) {
					const options: Completion[] = targets.map((rt) => ({
						label: `${rt}/`,
						type: "type",
						apply: (view: EditorView, _c: Completion, from: number, to: number) => {
							view.dispatch({
								changes: { from, to, insert: `${rt}/` },
								selection: { anchor: from + rt.length + 1 },
							});
						},
					}));
					const word = context.matchBefore(/[\w/]*/);
					return { from: word?.from ?? pos, options, validFor: /^[\w/]*$/ };
				}
			}
		}

		// Property name position — with or without quotes
		const isPropertyPosition =
			beforeCursor === "" ||
			beforeCursor === '"' ||
			/^"?[\w]*$/.test(beforeCursor) ||
			/[{,]\s*"?[\w]*$/.test(beforeCursor);

		if (!isPropertyPosition) return null;

		// Don't offer property completions inside arrays (e.g. "profile": [""])
		if (isInsideJsonArray(doc, pos)) return null;

		const path = getJsonPathAtCursor(doc, pos);
		const rtMatch = doc.match(/"resourceType"\s*:\s*"([^"]+)"/) ??
			doc.match(/resourceType\s*:\s*"([^"]+)"/);
		const resourceType = rtMatch?.[1] ?? resourceTypeHint;

		const hasExplicitResourceType = !!rtMatch?.[1];

		let completions: Completion[];
		if (resourceType) {
			const elements = await resolveElements(path, resourceType, getSDs);
			completions = elementsToCompletions(elements, toCompletion);
			if (!hasExplicitResourceType && path.length === 0) {
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
				completions = [rtCompletion, ...completions];
			}
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
	const isPrimitive = typeCode ? isPrimitiveType(typeCode) : false;

	const completion: Completion = {
		label: name,
		type: "property",
		detail: types,
		boost: element.min && element.min > 0 ? 2 : 0,
		apply: (view, _completion, from, to) => {
			const doc = view.state.doc.toString();
			const afterTo = doc.slice(to);

			// If a colon already follows, just replace the property name
			if (/^\s*:/.test(afterTo)) {
				view.dispatch({
					changes: { from, to, insert: name },
					selection: { anchor: from + name.length },
				});
				return;
			}

			const line = view.state.doc.lineAt(from);
			const charsBeforeFrom = from - line.from;
			const indent = " ".repeat(charsBeforeFrom);
			const inner = `${indent}  `;

			let text: string;
			let cursorOffset: number;
			const isString = typeCode ? FHIR_STRING_TYPES.has(typeCode) : false;
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
	resourceTypeHint?: string,
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

		// Value position for "reference" inside a Reference type
		if (valueKey === "reference") {
			const path = getYamlPathAtCursor(doc, pos);
			// path includes keys up to cursor; "reference" is the current key,
			// so the parent Reference element is at path (without "reference" in path since
			// getYamlPathAtCursor gives parents). We need path + ["reference"] context.
			// Actually path gives ancestor keys. The element containing "reference" is at path.
			const resourceType = getYamlResourceType(doc) ?? resourceTypeHint;
			if (resourceType && path.length > 0) {
				// path = ["managingOrganization"] when cursor is on reference value
				// We need to find the element at path[-1] from the grandparent
				const targets = await resolveReferenceTargets(path, resourceType, getSDs);
				if (targets) {
					const options: Completion[] = targets.map((rt) => ({
						label: `${rt}/`,
						type: "type",
					}));
					const word = context.matchBefore(/[\w/]*/);
					return { from: word?.from ?? pos, options, validFor: /^[\w/]*$/ };
				}
			}
		}

		if (!isYamlPropertyPosition(beforeCursor)) return null;

		const path = getYamlPathAtCursor(doc, pos);
		const hasExplicitResourceType = !!getYamlResourceType(doc);
		const resourceType = getYamlResourceType(doc) ?? resourceTypeHint;

		let completions: Completion[];
		if (resourceType) {
			const elements = await resolveElements(path, resourceType, getSDs);
			completions = elementsToCompletions(elements, toYamlFieldCompletion);
			if (!hasExplicitResourceType && path.length === 0) {
				const rtCompletion: Completion = {
					label: "resourceType",
					type: "property",
					detail: "string",
					boost: 10,
					apply: "resourceType: ",
				};
				rtCompletion.info = "FHIR resource type";
				completions = [rtCompletion, ...completions];
			}
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

// ── YAML FHIR linter ──────────────────────────────────────────────────

const HTTP_METHOD_RE = /^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s/;

function findRootYamlDocument(doc: string): { start: number } | null {
	const firstLine = doc.slice(0, doc.indexOf("\n") >>> 0).trimStart();
	const isHttpMode = HTTP_METHOD_RE.test(firstLine);

	if (isHttpMode) {
		// HTTP mode: body starts after blank line
		const bodyStart = doc.indexOf("\n\n");
		if (bodyStart === -1) return null;
		const start = bodyStart + 2;
		if (start >= doc.length) return null;
		const bodyContent = doc.slice(start).trimStart();
		if (!bodyContent) return null;
		// Check that what follows isn't JSON
		if (bodyContent.startsWith("{") || bodyContent.startsWith("[")) return null;
		return { start };
	}

	// Pure YAML: check first non-whitespace isn't JSON
	const firstNonWs = doc.trimStart();
	if (firstNonWs.startsWith("{") || firstNonWs.startsWith("[")) return null;
	return { start: 0 };
}

function walkYamlObject(
	text: string,
	startOffset: number,
	parentPath: string[],
	parentResourceType: string | null,
	result: PropertyInfo[],
	emptyStrings?: EmptyStringInfo[],
): void {
	const yamlText = text.slice(startOffset);
	const yamlLines = yamlText.split("\n");

	// Detect resourceType
	let ownResourceType: string | null = null;
	for (const line of yamlLines) {
		const trimmed = line.trimStart();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const m = trimmed.match(/^resourceType:\s*(\S+)/);
		if (m) {
			ownResourceType = m[1] ?? null;
			break;
		}
		// Only check top-level lines (indent 0)
		if (line.search(/\S/) === 0 && !m) continue;
		if (line.search(/\S/) > 0) continue;
	}

	const resourceType = ownResourceType ?? parentResourceType;
	const basePath = ownResourceType ? [] : parentPath;
	if (!resourceType) return;

	const stack: { indent: number; path: string[]; arrayChildIndent: number | null }[] = [
		{ indent: -1, path: basePath, arrayChildIndent: null },
	];

	for (let i = 0; i < yamlLines.length; i++) {
		const line = yamlLines[i]!;
		const trimmed = line.trimStart();
		if (!trimmed || trimmed.startsWith("#")) continue;

		const indent = line.length - trimmed.length;
		const isArrayItem = trimmed.startsWith("- ");
		const content = isArrayItem ? trimmed.slice(2) : trimmed;
		const colonIdx = content.indexOf(":");
		if (colonIdx <= 0) continue;

		const key = content.slice(0, colonIdx).trim();
		const valueAfterColon = content.slice(colonIdx + 1).trim();

		// Pop stack to find parent
		while (stack.length > 1 && stack[stack.length - 1]!.indent >= indent) {
			stack.pop();
		}
		let parentEntry = stack[stack.length - 1]!;

		// Track where array items appear under this parent
		if (isArrayItem && parentEntry.arrayChildIndent === null) {
			parentEntry.arrayChildIndent = indent;
		}

		// If parent has array children and this non-array line is at the array item
		// level (not deeper inside an item), it's invalid YAML — treat as grandparent's child.
		if (
			!isArrayItem &&
			parentEntry.arrayChildIndent !== null &&
			indent <= parentEntry.arrayChildIndent &&
			stack.length > 1
		) {
			stack.pop();
			parentEntry = stack[stack.length - 1]!;
		}

		// Calculate character offset for this key
		const keyIndent = isArrayItem ? indent + 2 : indent;
		let charOffset = startOffset;
		for (let j = 0; j < i; j++) {
			charOffset += yamlLines[j]!.length + 1;
		}
		const keyFrom = charOffset + keyIndent;
		const keyTo = keyFrom + key.length;

		result.push({
			name: key,
			path: [...parentEntry.path],
			resourceType,
			from: keyFrom,
			to: keyTo,
		});

		// Check for empty strings
		if (emptyStrings && (valueAfterColon === "''" || valueAfterColon === '""')) {
			const afterColonStr = content.slice(colonIdx + 1);
			const wsLen = afterColonStr.length - afterColonStr.trimStart().length;
			const emptyFrom = charOffset + keyIndent + colonIdx + 1 + wsLen;
			const emptyTo = emptyFrom + 2;
			emptyStrings.push({ from: emptyFrom, to: emptyTo });
		}

		// Push to stack if this key has nested content (no inline value, or value is empty)
		// For array items (- key:), use effective indent (indent + 2) so that
		// sibling properties at the same level correctly pop this entry.
		if (!valueAfterColon || valueAfterColon === "" || valueAfterColon.startsWith("#")) {
			const effectiveIndent = isArrayItem ? indent + 2 : indent;
			stack.push({ indent: effectiveIndent, path: [...parentEntry.path, key], arrayChildIndent: null });
		}
	}
}

// ── JSON FHIR linter ──────────────────────────────────────────────────

type PropertyInfo = {
	name: string;
	path: string[];
	resourceType: string;
	from: number;
	to: number;
};

type EmptyStringInfo = {
	from: number;
	to: number;
};

function walkJsonObject(
	node: SyntaxNode,
	parentPath: string[],
	parentResourceType: string | null,
	doc: string,
	result: PropertyInfo[],
	emptyStrings?: EmptyStringInfo[],
): void {
	// Detect if this object declares its own resourceType
	let ownResourceType: string | null = null;
	for (let child = node.firstChild; child; child = child.nextSibling) {
		if (child.name !== "Property") continue;
		const nameNode = child.getChild("PropertyName");
		if (!nameNode) continue;
		const keyName = doc
			.slice(nameNode.from, nameNode.to)
			.replace(/^"|"$/g, "");
		if (keyName === "resourceType") {
			for (let v = child.firstChild; v; v = v.nextSibling) {
				if (v.name === "String") {
					ownResourceType = doc
						.slice(v.from, v.to)
						.replace(/^"|"$/g, "");
					break;
				}
			}
			break;
		}
	}

	const resourceType = ownResourceType ?? parentResourceType;
	const path = ownResourceType ? [] : parentPath;

	if (!resourceType) return;

	for (let child = node.firstChild; child; child = child.nextSibling) {
		if (child.name !== "Property") continue;
		const nameNode = child.getChild("PropertyName");
		if (!nameNode) continue;
		const name = doc
			.slice(nameNode.from, nameNode.to)
			.replace(/^"|"$/g, "");

		result.push({
			name,
			path: [...path],
			resourceType,
			from: nameNode.from,
			to: nameNode.to,
		});

		for (let v = child.firstChild; v; v = v.nextSibling) {
			if (v.name === "Object") {
				walkJsonObject(
					v,
					[...path, name],
					resourceType,
					doc,
					result,
					emptyStrings,
				);
			} else if (v.name === "Array") {
				for (
					let item = v.firstChild;
					item;
					item = item.nextSibling
				) {
					if (item.name === "Object") {
						walkJsonObject(
							item,
							[...path, name],
							resourceType,
							doc,
							result,
							emptyStrings,
						);
					}
				}
			} else if (v.name === "String" && emptyStrings) {
				const raw = doc.slice(v.from, v.to);
				if (raw === '""') {
					emptyStrings.push({ from: v.from, to: v.to });
				}
			}
		}
	}
}

type FhirDiagnostic = {
	from: number;
	to: number;
	message: string;
};

async function validateFhirProperties(
	properties: PropertyInfo[],
	getSDs: GetStructureDefinitions,
): Promise<FhirDiagnostic[]> {
	const groups = new Map<
		string,
		{ resourceType: string; path: string[]; props: PropertyInfo[] }
	>();
	for (const prop of properties) {
		const key = `${prop.resourceType}|${prop.path.join(".")}`;
		let group = groups.get(key);
		if (!group) {
			group = {
				resourceType: prop.resourceType,
				path: [...prop.path],
				props: [],
			};
			groups.set(key, group);
		}
		group.props.push(prop);
	}

	const diagnostics: FhirDiagnostic[] = [];

	for (const { resourceType, path, props } of groups.values()) {
		const elements = await resolveElements(path, resourceType, getSDs);
		if (elements.length === 0) continue;

		const validNames = new Set<string>();
		for (const el of elements) {
			const name = fieldName(el);
			validNames.add(name);
			const typeCode = el.type?.[0]?.code;
			if (
				el.type?.length === 1 &&
				typeCode &&
				isPrimitiveType(typeCode)
			) {
				validNames.add(`_${name}`);
			}
		}
		if (path.length === 0) {
			validNames.add("resourceType");
		}

		for (const prop of props) {
			if (!validNames.has(prop.name)) {
				diagnostics.push({
					from: prop.from,
					to: prop.to,
					message: `Unknown property "${prop.name}"`,
				});
			}
		}
	}

	return diagnostics;
}

function findRootJsonObject(
	doc: string,
	tree: ReturnType<typeof syntaxTree>,
): SyntaxNode | null {
	// Pure JSON mode: top node is JsonText with Object child
	const direct = tree.topNode.getChild("Object");
	if (direct) return direct;

	// HTTP mode (mixed parsing): find body after blank line,
	// then resolve into the mounted JSON subtree
	const bodyStart = doc.indexOf("\n\n");
	if (bodyStart === -1) return null;

	const jsonStart = bodyStart + 2;
	if (jsonStart >= doc.length) return null;

	// resolveInner enters mounted (mixed-parsed) subtrees
	const innerNode = tree.resolveInner(jsonStart, 1);
	if (!innerNode) return null;

	// Walk up to find the Object node
	let node: SyntaxNode | null = innerNode;
	while (node) {
		if (node.name === "Object") return node;
		if (node.name === "JsonText") {
			return node.getChild("Object");
		}
		node = node.parent;
	}

	return null;
}

// ── FHIR validation decorations ───────────────────────────────────────

type FhirDiagnosticWithLine = FhirDiagnostic & { line: number };

const setFhirDiagnosticsEffect = StateEffect.define<FhirDiagnosticWithLine[]>();

const fhirUnderline = Decoration.mark({ class: "cm-fhir-error-underline" });
const fhirErrorLineDecoration = Decoration.line({ class: "cm-errorLine" });

class FhirGutterMarker extends GutterMarker {
	elementClass = "cm-errorLineGutter";
}
const fhirGutterMarker = new FhirGutterMarker();

export const fhirDiagnosticsField = StateField.define<{
	marks: RangeSet<Decoration>;
	lineDecos: RangeSet<Decoration>;
	gutterMarkers: RangeSet<GutterMarker>;
	messages: Map<number, string>;
}>({
	create() {
		return {
			marks: Decoration.none,
			lineDecos: Decoration.none,
			gutterMarkers: RangeSet.empty,
			messages: new Map(),
		};
	},
	update(value, tr) {
		for (const effect of tr.effects) {
			if (effect.is(setFhirDiagnosticsEffect)) {
				const diags = effect.value;
				if (diags.length === 0) {
					return {
						marks: Decoration.none,
						lineDecos: Decoration.none,
						gutterMarkers: RangeSet.empty,
						messages: new Map(),
					};
				}

				const marks: { from: number; to: number; value: Decoration }[] =
					[];
				const lineDecos: {
					from: number;
					to: number;
					value: Decoration;
				}[] = [];
				const gutter: {
					from: number;
					to: number;
					value: GutterMarker;
				}[] = [];
				const messages = new Map<number, string>();

				for (const d of diags) {
					marks.push(fhirUnderline.range(d.from, d.to));
					const existing = messages.get(d.line);
					if (existing) {
						messages.set(d.line, `${existing}\n${d.message}`);
					} else {
						messages.set(d.line, d.message);
						const line = tr.state.doc.line(d.line);
						lineDecos.push(
							fhirErrorLineDecoration.range(line.from),
						);
						gutter.push(fhirGutterMarker.range(line.from));
					}
				}

				return {
					marks: Decoration.set(marks, true),
					lineDecos: Decoration.set(lineDecos, true),
					gutterMarkers: RangeSet.of(gutter, true),
					messages,
				};
			}
		}
		if (tr.docChanged) {
			try {
				return {
					marks: value.marks.map(tr.changes),
					lineDecos: value.lineDecos.map(tr.changes),
					gutterMarkers: value.gutterMarkers.map(tr.changes),
					messages: value.messages,
				};
			} catch {
				return {
					marks: Decoration.none,
					lineDecos: Decoration.none,
					gutterMarkers: RangeSet.empty,
					messages: new Map(),
				};
			}
		}
		return value;
	},
	provide(field) {
		return [
			EditorView.decorations.from(field, (v) => v.marks),
			EditorView.decorations.from(field, (v) => v.lineDecos),
			gutterLineClass.from(field, (v) => v.gutterMarkers),
		];
	},
});

const fhirLinterTheme = EditorView.theme({
	".cm-fhir-error-underline": {
		textDecorationLine: "underline",
		textDecorationStyle: "wavy",
		textDecorationColor: "var(--color-text-error-primary)",
		textUnderlineOffset: "3px",
	},
	".cm-lineNumbers .cm-gutterElement.cm-errorLineGutter": {
		color: "var(--color-text-error-primary)",
		backgroundColor:
			"color-mix(in srgb, var(--color-text-error-primary) 7%, transparent)",
	},
});

function buildFhirValidationPlugin(
	getSDs: GetStructureDefinitions,
	resourceTypeHint?: string,
): Extension {
	return ViewPlugin.define((view) => {
		let timeout: ReturnType<typeof setTimeout> | null = null;
		let destroyed = false;

		function scheduleCheck() {
			if (timeout) clearTimeout(timeout);
			timeout = setTimeout(() => check(), 500);
		}

		async function check() {
			if (destroyed) return;
			const currentDoc = view.state.doc.toString();
			// Ensure syntax tree is fully parsed before checking
			const tree =
				ensureSyntaxTree(view.state, view.state.doc.length, 1000) ??
				syntaxTree(view.state);

			const properties: PropertyInfo[] = [];
			const emptyStrings: EmptyStringInfo[] = [];

			// Try JSON first
			const rootObj = findRootJsonObject(currentDoc, tree);
			if (rootObj) {
				walkJsonObject(rootObj, [], resourceTypeHint ?? null, currentDoc, properties, emptyStrings);
			} else {
				// Try YAML
				const yamlDoc = findRootYamlDocument(currentDoc);
				if (yamlDoc) {
					walkYamlObject(currentDoc, yamlDoc.start, [], resourceTypeHint ?? null, properties, emptyStrings);
				}
			}

			if (!rootObj && !findRootYamlDocument(currentDoc)) {
				try {
					view.dispatch({
						effects: setFhirDiagnosticsEffect.of([]),
					});
				} catch {
					/* view destroyed */
				}
				return;
			}

			if (properties.length === 0 && emptyStrings.length === 0) {
				try {
					view.dispatch({
						effects: setFhirDiagnosticsEffect.of([]),
					});
				} catch {
					/* view destroyed */
				}
				return;
			}

			const rawDiags = await validateFhirProperties(
				properties,
				getSDs,
			);
			if (destroyed) return;
			if (view.state.doc.toString() !== currentDoc) return;

			for (const es of emptyStrings) {
				rawDiags.push({
					from: es.from,
					to: es.to,
					message: "Value must not be empty",
				});
			}

			const diags: FhirDiagnosticWithLine[] = rawDiags.map((d) => ({
				...d,
				line: view.state.doc.lineAt(d.from).number,
			}));

			try {
				view.dispatch({
					effects: setFhirDiagnosticsEffect.of(diags),
				});
			} catch {
				/* view destroyed */
			}
		}

		scheduleCheck();

		return {
			update(update: ViewUpdate) {
				if (update.docChanged) {
					scheduleCheck();
				}
			},
			destroy() {
				destroyed = true;
				if (timeout) clearTimeout(timeout);
			},
		};
	});
}

// ── Public API ─────────────────────────────────────────────────────────

export function buildFhirCompletionExtension(
	getSDs: GetStructureDefinitions,
	resourceTypeHint?: string,
): Extension {
	const jsonSource = fhirCompletionSource(getSDs, resourceTypeHint);
	const yamlSource = yamlFhirCompletionSource(getSDs, resourceTypeHint);
	return [
		jsonLanguage.data.of({ autocomplete: jsonSource }),
		yamlLanguage.data.of({ autocomplete: yamlSource }),
		fhirDiagnosticsField,
		fhirLinterTheme,
		buildFhirValidationPlugin(getSDs, resourceTypeHint),
	];
}
