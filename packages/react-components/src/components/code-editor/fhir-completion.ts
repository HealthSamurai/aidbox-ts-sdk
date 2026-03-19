import {
	type Completion,
	type CompletionContext,
	type CompletionResult,
	type CompletionSource,
	completionStatus,
	startCompletion,
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
	profile?: string[];
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
	sliceName?: string;
	fixedUri?: string;
}

interface StructureDefinition {
	type: string;
	url?: string;
	name?: string;
	baseDefinition?: string;
	context?: { expression: string; type: string }[];
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
	_ilike?: string;
}

export type GetStructureDefinitions = (
	params: StructureDefinitionSearchParams,
) => Promise<StructureDefinition[]>;

export type ExpandValueSet = (
	url: string,
	filter: string,
) => Promise<{ code: string; display?: string; system?: string }[]>;

// ── Cache ──────────────────────────────────────────────────────────────

const sdCache = new Map<string, StructureDefinition | null>();
const pendingRequests = new Map<string, Promise<StructureDefinition | null>>();
const listCache = new Map<string, StructureDefinition[]>();
const pendingListRequests = new Map<string, Promise<StructureDefinition[]>>();

const SD_ELEMENTS = "differential,type,name,baseDefinition,url,context";

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
	// Return element with only the matched type so resolveElements picks the right one
	for (const el of elements) {
		if (!el.path.endsWith("[x]")) continue;
		if (!el.path.startsWith(`${parentPath}.`)) continue;
		const baseName = fieldName(el);
		if (!key.toLowerCase().startsWith(baseName.toLowerCase())) continue;
		const typeSuffix = key.slice(baseName.length).toLowerCase();
		const matchedType = el.type?.find((t) => t.code.toLowerCase() === typeSuffix);
		if (matchedType) {
			return { ...el, type: [matchedType] };
		}
	}
	return undefined;
}

// ── Resolve completions at path ────────────────────────────────────────

// Collect all elements including inherited from base definitions
async function collectAllElements(
	type: string,
	getSDs: GetStructureDefinitions,
): Promise<{ elements: FhirElement[]; basePath: string } | null> {
	const sd = await getCachedSD(type, getSDs);
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
	| "array-extension"
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
	// Extension arrays get special snippet with {"url": ""}
	if (typeCode === "Extension" && isArray) return "array-extension";
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
		case "array-extension": {
			const text = `"${name}": [\n${inner}{\n${innerInner}"url": ""\n${inner}}\n${indent}]`;
			return { text, cursorOffset: text.lastIndexOf('""') + 1 };
		}
		case "array-primitive": {
			const text = `"${name}": [\n${inner}\n${indent}]`;
			return { text, cursorOffset: text.indexOf(inner + "\n") + inner.length };
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

// ── Extension helpers ──────────────────────────────────────────────────

interface ExtensionInfo {
	url: string;
	name?: string | undefined;
	isNested: boolean;
	valueTypes: string[];
	slices: { sliceName: string; fixedUri: string; short?: string | undefined }[];
}

function analyzeExtensionSD(sd: StructureDefinition): ExtensionInfo | null {
	if (!sd.differential?.element) return null;
	const elements = sd.differential.element;

	const valueEl = elements.find((e) => e.path === "Extension.value[x]");
	const isNested = valueEl?.max === "0";
	const valueTypes = isNested ? [] : (valueEl?.type?.map((t) => t.code) ?? []);

	const slices: ExtensionInfo["slices"] = [];
	for (const el of elements) {
		if (el.path === "Extension.extension" && el.sliceName) {
			const sliceName = el.sliceName;
			const urlEl = elements.find(
				(e) =>
					e.path === "Extension.extension.url" &&
					e.fixedUri &&
					elements.indexOf(e) > elements.indexOf(el),
			);
			const fixedUri = urlEl?.fixedUri ?? sliceName;
			slices.push({ sliceName, fixedUri, short: el.short });
		}
	}

	return {
		url: sd.url ?? sd.type,
		name: sd.name,
		isNested,
		valueTypes,
		slices,
	};
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

			// Trigger value autocomplete after inserting a snippet with cursor in value position
			if (kind === "string" || kind === "array-primitive" || kind === "array-extension") {
				setTimeout(() => startCompletion(view), 0);
			}
		},
	};
	if (element.short) completion.info = element.short;
	return completion;
}

// ── Completion source ──────────────────────────────────────────────────

// ── Terminology binding resolution ─────────────────────────────────────

// Build the FHIR element path for a given JSON path + valueKey
// e.g. resourceType="Patient", path=["address"], valueKey="state" → "Patient.address.state"
// For "code" inside Coding: path=["maritalStatus","coding"], valueKey="code" → walk up to find bound parent
function buildFhirElementPath(
	resourceType: string,
	path: string[],
	valueKey: string,
): string {
	return `${resourceType}.${[...path, valueKey].join(".")}`;
}

// Check if a profile's differential overrides the binding for a given element path
async function findProfileBinding(
	profileUrls: string[],
	resourceType: string,
	path: string[],
	valueKey: string,
	getSDs: GetStructureDefinitions,
): Promise<string | null> {
	if (profileUrls.length === 0) return null;

	for (const profileUrl of profileUrls) {
		const sd = await getCachedSD(profileUrl, getSDs);
		if (!sd?.differential?.element) continue;

		// Direct match: e.g. Patient.gender
		const directPath = buildFhirElementPath(resourceType, path, valueKey);
		for (const el of sd.differential.element) {
			if (el.path === directPath && el.binding?.valueSet) {
				return el.binding.valueSet;
			}
		}

		// For "code" inside Coding/CodeableConcept — check parent paths
		if (valueKey === "code") {
			for (let i = path.length; i > 0; i--) {
				const parentFhirPath = buildFhirElementPath(resourceType, path.slice(0, i - 1), path[i - 1]!);
				for (const el of sd.differential.element) {
					if (el.path === parentFhirPath && el.binding?.valueSet) {
						return el.binding.valueSet;
					}
				}
			}
		}
	}
	return null;
}

// Find binding from extension SD differential for a value inside extension object
async function findExtensionBinding(
	doc: string,
	pos: number,
	getSDs: GetStructureDefinitions,
): Promise<string | null> {
	const textBefore = doc.slice(0, pos);

	// Find the nearest extension "url" in current or parent object
	// Match "url": "value" scanning backwards through the text
	const urlMatches = [...textBefore.matchAll(/"url"\s*:\s*"([^"]+)"/g)];
	if (urlMatches.length === 0) return null;

	// Work backwards from the most recent url match
	for (let i = urlMatches.length - 1; i >= 0; i--) {
		const extUrl = urlMatches[i]![1]!;
		// Skip non-extension URLs (like profile URLs)
		if (!extUrl.includes("StructureDefinition/") && !extUrl.includes("Extension")) {
			// Could be a slice name like "ombCategory" — find the parent extension URL
			const parentUrlMatches = [...textBefore.slice(0, urlMatches[i]!.index).matchAll(/"url"\s*:\s*"([^"]+)"/g)];
			for (let j = parentUrlMatches.length - 1; j >= 0; j--) {
				const parentUrl = parentUrlMatches[j]![1]!;
				if (!parentUrl.includes("/")) continue;
				const parentSD = await getCachedSD(parentUrl, getSDs);
				if (!parentSD?.differential?.element) continue;
				// Find the slice matching extUrl and check its value[x] binding
				let inSlice = false;
				for (const el of parentSD.differential.element) {
					if (el.path === "Extension.extension" && el.sliceName) {
						const urlEl = parentSD.differential.element.find(
							(e) => e.path === "Extension.extension.url" && e.fixedUri &&
								parentSD.differential!.element.indexOf(e) > parentSD.differential!.element.indexOf(el),
						);
						if ((urlEl?.fixedUri ?? el.sliceName) === extUrl) {
							inSlice = true;
							continue;
						}
						if (inSlice) break;
					}
					if (inSlice && el.path === "Extension.extension.value[x]" && el.binding?.valueSet) {
						return el.binding.valueSet;
					}
				}
				if (inSlice) break;
			}
			continue;
		}
		// Direct extension URL — check its value[x] binding
		const sd = await getCachedSD(extUrl, getSDs);
		if (!sd?.differential?.element) continue;
		for (const el of sd.differential.element) {
			if (el.path === "Extension.value[x]" && el.binding?.valueSet) {
				return el.binding.valueSet;
			}
		}
	}
	return null;
}

async function findBindingForValue(
	path: string[],
	valueKey: string,
	resourceType: string,
	getSDs: GetStructureDefinitions,
	profileUrls: string[] = [],
	doc?: string,
	pos?: number,
): Promise<string | null> {
	// Check extension binding first (for values inside extension objects)
	if (doc != null && pos != null) {
		// Check if we're inside an extension context (path contains "extension")
		const inExtension = path.some((p) => p === "extension" || p === "modifierExtension");
		if (inExtension) {
			const extBinding = await findExtensionBinding(doc, pos, getSDs);
			if (extBinding) return extBinding;
		}
	}

	// Check profile overrides first
	const profileBinding = await findProfileBinding(profileUrls, resourceType, path, valueKey, getSDs);
	if (profileBinding) return profileBinding;

	// Case 1: Direct binding on the field (e.g. code type like Patient.gender)
	const elements = await resolveElements(path, resourceType, getSDs);
	for (const el of elements) {
		if (fieldName(el) === valueKey && el.binding?.valueSet) {
			return el.binding.valueSet;
		}
	}

	// Case 2: valueKey is "code" — walk up to find Coding/CodeableConcept with binding
	// Handles: Coding.code, CodeableConcept.coding[].code
	if (valueKey === "code") {
		for (let i = path.length; i > 0; i--) {
			const parentElements = await resolveElements(
				path.slice(0, i - 1),
				resourceType,
				getSDs,
			);
			for (const el of parentElements) {
				if (fieldName(el) === path[i - 1] && el.binding?.valueSet) {
					return el.binding.valueSet;
				}
			}
		}
	}

	return null;
}

// Find canonical targetProfile for an array element (e.g. Meta.profile → StructureDefinition)
// Returns the FHIR resource type name from the targetProfile URL, or null
async function findCanonicalTargetType(
	path: string[],
	arrayKey: string,
	resourceType: string,
	getSDs: GetStructureDefinitions,
): Promise<string | null> {
	const elements = await resolveElements(path, resourceType, getSDs);
	for (const el of elements) {
		if (fieldName(el) !== arrayKey) continue;
		if (el.max !== "*") continue;
		const t = el.type?.[0];
		if (t?.code !== "canonical" || !t.targetProfile?.length) continue;
		// Extract resource type from targetProfile URL
		return t.targetProfile[0]?.split("/").pop() ?? null;
	}
	return null;
}

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

// Check if cursor is in a value position (after "key": or key: )
function isValuePosition(beforeCursor: string): string | null {
	const match = beforeCursor.match(/"?(\w+)"?\s*:\s*"?([^"]*)?$/);
	if (match) return match[1] ?? null;
	return null;
}

// Extract meta.profile URLs from JSON document
function getJsonProfileUrls(doc: string): string[] {
	const match = doc.match(/"profile"\s*:\s*\[([\s\S]*?)\]/);
	if (!match?.[1]) return [];
	const urls: string[] = [];
	const re = /"([^"]+)"/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(match[1])) !== null) {
		if (m[1]) urls.push(m[1]);
	}
	return urls;
}

// Extract meta.profile URLs from YAML document
function getYamlProfileUrls(doc: string): string[] {
	const profileSection = doc.match(/profile:\s*\n((?:\s+-\s+.+\n?)*)/);
	if (!profileSection?.[1]) return [];
	const urls: string[] = [];
	const re = /-\s+['"]?([^'"\n]+)['"]?/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(profileSection[1])) !== null) {
		if (m[1]) urls.push(m[1].trim());
	}
	return urls;
}

export function fhirCompletionSource(
	getSDs: GetStructureDefinitions,
	resourceTypeHint?: string,
	expandValueSet?: ExpandValueSet,
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

		// Extension URL value completion — "url": "|" inside extension object
		if (valueKey === "url") {
			const bodyStart = doc.indexOf("\n\n");
			const jsonStart = bodyStart !== -1 ? bodyStart + 2 : 0;
			const jsonBody = doc.slice(jsonStart);
			const posInBody = pos - jsonStart;
			const path = getJsonPathAtCursor(jsonBody, posInBody);
			const lastSeg = path[path.length - 1];
			if (lastSeg === "extension" || lastSeg === "modifierExtension") {
				const rtMatch = doc.match(/"resourceType"\s*:\s*"([^"]+)"/);
				const resourceType = rtMatch?.[1] ?? resourceTypeHint;
				// Determine if nested by scanning backwards for parent extension URL
				// Find the "extension": [ that contains our cursor, then check if
				// the object containing that array has a "url" field
				// Find the { opening current extension object by finding "url" key position
				// then scanning backwards from there (avoids string-tracking issues)
				const urlKeyPos = doc.lastIndexOf('"url"', pos);
				let scanEnd = urlKeyPos !== -1 ? urlKeyPos : pos;
				// From "url" position, find the opening {
				for (let i = scanEnd - 1; i >= 0; i--) {
					const c = doc[i];
					if (c === "{") { scanEnd = i; break; }
					if (c === "}" || c === "]" || c === "[") break;
				}
				const textBefore = doc.slice(0, scanEnd);
				let parentExtUrl: string | null = null;
				let depth = 0;
				let inStr = false;
				let esc = false;
				let foundExtArray = false;
				for (let i = textBefore.length - 1; i >= 0; i--) {
					const ch = textBefore[i];
					if (esc) { esc = false; continue; }
					if (ch === "\\") { esc = true; continue; }
					if (ch === '"') { inStr = !inStr; continue; }
					if (inStr) continue;
					if (ch === "}" || ch === "]") { depth++; }
					else if (ch === "[") {
						if (depth === 0) { foundExtArray = true; continue; }
						depth--;
					} else if (ch === "{") {
						if (depth === 0 && foundExtArray) {
							// Found the parent object of the extension array
							// Check if it has "url": "..." inside
							const objText = textBefore.slice(i);
							const urlMatch = objText.match(/^\{[\s\S]*?"url"\s*:\s*"([^"]+)"/);
							if (urlMatch?.[1]?.includes("/")) {
								parentExtUrl = urlMatch[1];
							}
							break;
						}
						if (depth === 0) break;
						depth--;
					}
				}
				if (parentExtUrl) {
					const parentSD = await getCachedSD(parentExtUrl, getSDs);
					if (parentSD) {
						const info = analyzeExtensionSD(parentSD);
						if (info?.slices.length) {
							const word = context.matchBefore(/[\w.:/-]*/);
							const filter = word?.text.toLowerCase() ?? "";
							const matching = filter
								? info.slices.filter((s) => s.fixedUri.toLowerCase().includes(filter) || (s.short?.toLowerCase().includes(filter) ?? false))
								: info.slices;
							const options: Completion[] = matching.map((slice) => {
								// Find value type for this slice
								const sliceElements = parentSD.differential?.element ?? [];
								let sliceValueTypes: string[] = [];
								let inSl = false;
								for (const el of sliceElements) {
									if (el.path === "Extension.extension" && el.sliceName === slice.sliceName) { inSl = true; continue; }
									if (inSl && el.path === "Extension.extension.value[x]") { sliceValueTypes = el.type?.map((t) => t.code) ?? []; break; }
									if (inSl && el.path === "Extension.extension" && el.sliceName) break;
								}
								return {
									label: slice.fixedUri,
									...(slice.short ? { info: slice.short } : {}),
									type: "text",
									apply: (view: EditorView, _c: Completion, from: number, to: number) => {
										const d = view.state.doc.toString();
										let actualTo = to;
										if (actualTo < d.length && d[actualTo] === '"') actualTo++;
										view.dispatch({
											changes: { from, to: actualTo, insert: `${slice.fixedUri}"` },
											selection: { anchor: from + slice.fixedUri.length + 1 },
										});
										if (sliceValueTypes.length === 1) {
											setTimeout(() => {
												const cp = view.state.selection.main.head;
												const cd = view.state.doc.toString();
												const af = cd.slice(cp);
												if (!/^\s*\n\s*\}/.test(af)) return;
												const lo = view.state.doc.lineAt(cp);
												const ind = lo.text.match(/^(\s*)/)?.[1] ?? "";
												const tc = sliceValueTypes[0]!;
												const vf = `value${tc.charAt(0).toUpperCase()}${tc.slice(1)}`;
												let ins: string;
												let cOff: number;
												if (FHIR_STRING_TYPES.has(tc) || tc === "code") {
													ins = `,\n${ind}"${vf}": ""`;
													cOff = ins.length - 1;
												} else if (FHIR_NUMBER_TYPES.has(tc)) {
													ins = `,\n${ind}"${vf}": `;
													cOff = ins.length;
												} else {
													const inner = ind + "  ";
													ins = `,\n${ind}"${vf}": {\n${inner}\n${ind}}`;
													cOff = ins.indexOf(inner + "\n" + ind) + inner.length;
												}
												view.dispatch({
													changes: { from: cp, insert: ins },
													selection: { anchor: cp + cOff },
												});
												setTimeout(() => startCompletion(view), 0);
											}, 10);
										}
									},
								};
							});
							if (options.length > 0) return { from: word?.from ?? pos, options, filter: false };
						}
					}
				} else if (resourceType) {
					// Top-level or nested-in-type: resolve context
					const contextTypes: string[] = [resourceType, "DomainResource", "Resource", "Element"];
					const extIdx = path.lastIndexOf("extension");
					if (extIdx > 0) {
						let currentRT = resourceType;
						for (let i = 0; i < extIdx; i++) {
							const seg = path[i];
							if (!seg) break;
							const elements = await resolveElements([], currentRT, getSDs);
							const el = elements.find((e) => fieldName(e) === seg);
							if (el?.type?.[0]?.code && !isPrimitiveType(el.type[0].code)) currentRT = el.type[0].code;
							else break;
						}
						if (currentRT !== resourceType) {
							contextTypes.length = 0;
							contextTypes.push(currentRT, "Element", `${resourceType}.${path.slice(0, extIdx).join(".")}`);
						}
					}
					// Profile extensions
					const profileExtUrls: string[] = [];
					if (contextTypes.includes(resourceType)) {
						for (const pUrl of getJsonProfileUrls(doc)) {
							const profileSD = await getCachedSD(pUrl, getSDs);
							if (!profileSD?.differential?.element) continue;
							for (const el of profileSD.differential.element) {
								for (const t of el.type ?? []) {
									if (t.code === "Extension") {
										for (const p of t.profile ?? []) {
											const clean = p.includes("|") ? p.slice(0, p.indexOf("|")) : p;
											if (!profileExtUrls.includes(clean)) profileExtUrls.push(clean);
										}
									}
								}
							}
						}
					}
					const bareWord = context.matchBefore(/[\w.:/-]*/);
					const filter = bareWord?.text ?? "";
					const searchParams: StructureDefinitionSearchParams = { type: "Extension", derivation: "constraint", _elements: "url,context", _count: "500" };
					if (filter) searchParams._ilike = filter;
					const results = await getCachedSDList(searchParams, getSDs);
					// Build context hierarchy for boost scoring
					const containerType = contextTypes[0]; // e.g. "Address" or "Patient"
					const fhirPath = contextTypes.find((c) => c.includes(".")); // e.g. "Patient.address"
					const contextExts = results.filter((sd) => sd.context?.some((c) => c.type === "element" && contextTypes.includes(c.expression)));
					const seen = new Set<string>();
					const allExts: { url: string; boost: number }[] = [];
					if (contextTypes.includes(resourceType)) {
						for (const u of profileExtUrls) { if (!seen.has(u)) { seen.add(u); allExts.push({ url: u, boost: 20 }); } }
					}
					for (const sd of contextExts) {
						const u = sd.url ?? sd.type;
						if (seen.has(u)) continue;
						seen.add(u);
						const ctxExprs = sd.context?.filter((c) => c.type === "element").map((c) => c.expression) ?? [];
						let boost = 0;
						// Exact FHIR path match (e.g. "Patient.address") — highest
						if (fhirPath && ctxExprs.includes(fhirPath)) boost = 15;
						// Exact container type match (e.g. "Address")
						else if (containerType && ctxExprs.includes(containerType)) boost = 10;
						// Resource type match (e.g. "Patient")
						else if (ctxExprs.includes(resourceType)) boost = 5;
						// DomainResource/Resource
						else if (ctxExprs.some((e) => e === "DomainResource" || e === "Resource")) boost = 2;
						// Element (generic)
						else if (ctxExprs.includes("Element")) boost = 1;
						allExts.push({ url: u, boost });
					}
					const lf = filter.toLowerCase();
					const filtered = (lf ? allExts.filter((e) => e.url.toLowerCase().includes(lf)) : allExts)
						.sort((a, b) => b.boost - a.boost);
					if (filtered.length > 0) {
						const options: Completion[] = filtered.map((ext) => ({
							label: ext.url, type: "text", boost: ext.boost,
							apply: (view: EditorView, _c: Completion, applyFrom: number, applyTo: number) => {
								const d = view.state.doc.toString();
								let actualTo = applyTo;
								if (actualTo < d.length && d[actualTo] === '"') actualTo++;
								view.dispatch({
									changes: { from: applyFrom, to: actualTo, insert: `${ext.url}"` },
									selection: { anchor: applyFrom + ext.url.length + 1 },
								});
								// After inserting URL, fetch SD and append value/extension field
								setTimeout(async () => {
									const fullSD = await getCachedSD(ext.url, getSDs);
									if (!fullSD) return;
									const extInfo = analyzeExtensionSD(fullSD);
									if (!extInfo) return;
									const cursorPos = view.state.selection.main.head;
									const curDoc = view.state.doc.toString();
									const after = curDoc.slice(cursorPos);
									if (!/^\s*\n\s*\}/.test(after)) return;
									const lineObj = view.state.doc.lineAt(cursorPos);
									const ind = lineObj.text.match(/^(\s*)/)?.[1] ?? "";
									let ins: string;
									let cOff: number;
									if (extInfo.isNested) {
										const inner = ind + "  ";
										const innerInner = inner + "  ";
										ins = `,\n${ind}"extension": [\n${inner}{\n${innerInner}"url": ""\n${inner}}\n${ind}]`;
										cOff = ins.lastIndexOf('""') + 1;
									} else if (extInfo.valueTypes.length === 1) {
										const tc = extInfo.valueTypes[0]!;
										const vf = `value${tc.charAt(0).toUpperCase()}${tc.slice(1)}`;
										if (FHIR_STRING_TYPES.has(tc) || tc === "code") {
											ins = `,\n${ind}"${vf}": ""`;
											cOff = ins.length - 1;
										} else if (FHIR_NUMBER_TYPES.has(tc)) {
											ins = `,\n${ind}"${vf}": `;
											cOff = ins.length;
										} else {
											const inner = ind + "  ";
											ins = `,\n${ind}"${vf}": {\n${inner}\n${ind}}`;
											cOff = ins.indexOf(inner + "\n" + ind) + inner.length;
										}
									} else {
										return;
									}
									view.dispatch({
										changes: { from: cursorPos, insert: ins },
										selection: { anchor: cursorPos + cOff },
									});
									setTimeout(() => startCompletion(view), 0);
								}, 10);
							},
						}));
						return { from: bareWord?.from ?? pos, options, filter: false };
					}
				}
				return null;
			}
		}

		// Terminology binding value completion
		if (valueKey && valueKey !== "resourceType" && valueKey !== "reference" && valueKey !== "url" && expandValueSet) {
			const path = getJsonPathAtCursor(doc, pos);
			const rtMatch = doc.match(/"resourceType"\s*:\s*"([^"]+)"/);
			const resourceType = rtMatch?.[1] ?? resourceTypeHint;
			if (resourceType) {
				const profileUrls = getJsonProfileUrls(doc);
				const valueSetUrl = await findBindingForValue(path, valueKey, resourceType, getSDs, profileUrls, doc, pos);
				if (valueSetUrl) {
					// Include opening quote in match so from < pos (triggers auto-show)
					const quoteWord = context.matchBefore(/"[\w-]*/);
					const from = quoteWord?.from ?? pos;
					const filter = quoteWord ? quoteWord.text.replace(/^"/, "") : "";
					try {
						const codes = await expandValueSet(valueSetUrl, filter);
						if (codes.length > 0) {
							const options: Completion[] = codes.map((c) => ({
								label: c.code,
								...(c.display ? { info: c.display } : {}),
								type: "text",
								apply: (view: EditorView, _c: Completion, applyFrom: number, applyTo: number) => {
									const d = view.state.doc.toString();
									let actualFrom = applyFrom;
									let actualTo = applyTo;
									if (d[actualFrom] === '"') actualFrom++;
									if (actualTo < d.length && d[actualTo] === '"') actualTo++;
									view.dispatch({
										changes: { from: actualFrom, to: actualTo, insert: `${c.code}"` },
										selection: { anchor: actualFrom + c.code.length + 1 },
									});
								},
							}));
							return { from, options, filter: false };
						}
					} catch {
						// expand failed — fall through
					}
				}
			}
		}

		// Canonical array completion (e.g. meta.profile → StructureDefinition profiles)
		// Use regex to detect array context — isInsideJsonArray fails inside ""
		{
			const textBefore = doc.slice(0, pos);
			// Match "key": [ ... with cursor inside the array (possibly inside "")
			const arrayMatch = textBefore.match(/"(\w+)"\s*:\s*\[\s*(?:"[^"]*"\s*,\s*)*"?[^"]*$/s);
			if (arrayMatch) {
				const arrayKey = arrayMatch[1]!;
				// Find JSON body start for correct path resolution
				const bodyStart = doc.indexOf("\n\n");
				const jsonStart = bodyStart !== -1 ? bodyStart + 2 : 0;
				const jsonBody = doc.slice(jsonStart);
				const posInBody = pos - jsonStart;
				// Get path excluding the array key itself (parent path)
				const fullPath = getJsonPathAtCursor(jsonBody, posInBody);
				// The array key is the last segment pushed by { before [
				// Remove it to get parentPath
				const parentPath = fullPath.length > 0 && fullPath[fullPath.length - 1] === arrayKey
					? fullPath.slice(0, -1)
					: fullPath;
				const rtMatch = doc.match(/"resourceType"\s*:\s*"([^"]+)"/);
				const resourceType = rtMatch?.[1] ?? resourceTypeHint;
				if (resourceType) {
					const targetType = await findCanonicalTargetType(parentPath, arrayKey, resourceType, getSDs);
					if (targetType === "StructureDefinition") {
						const allSDs = await getCachedSDList(
							{ type: `${resourceType},DomainResource,Resource`, derivation: "constraint", _elements: "url,name", _count: "50" },
							getSDs,
						);
						const seen = new Set<string>();
						const uniqueSDs = allSDs.filter((sd) => {
							const u = sd.url ?? sd.type;
							if (seen.has(u)) return false;
							seen.add(u);
							return true;
						});
						if (uniqueSDs.length > 0) {
							const quoteWord = context.matchBefore(/"[^"]*/);
							const bareWord = context.matchBefore(/[\w.:/-]*/);
							const from = quoteWord?.from ?? bareWord?.from ?? pos;
							const filter = quoteWord
								? quoteWord.text.replace(/^"/, "").toLowerCase()
								: (bareWord?.text.toLowerCase() ?? "");
							const filtered = filter
								? uniqueSDs.filter((sd) => sd.name?.toLowerCase().includes(filter) || sd.url?.toLowerCase().includes(filter))
								: uniqueSDs;
							const options: Completion[] = filtered.map((sd) => {
								const url = sd.url ?? sd.type;
								return {
									label: url,
									...(sd.name ? { info: sd.name } : {}),
									type: "text",
									apply: (view: EditorView, _c: Completion, applyFrom: number, applyTo: number) => {
										const d = view.state.doc.toString();
										let actualTo = applyTo;
										if (actualTo < d.length && d[actualTo] === '"') actualTo++;
										view.dispatch({
											changes: { from: applyFrom, to: actualTo, insert: `"${url}"` },
											selection: { anchor: applyFrom + url.length + 2 },
										});
									},
								};
							});
							if (options.length > 0) {
								return { from, options, filter: false };
							}
						}
					}
					if (targetType) return null;
				}
			}
		}

		// Don't offer property completions inside arrays
		// Scan backwards to find nearest unmatched [ or {
		{
			const bodyStart = doc.indexOf("\n\n");
			const jsonStart = bodyStart !== -1 ? bodyStart + 2 : 0;
			const jsonBody = doc.slice(jsonStart);
			const posInBody = pos - jsonStart;
			let depth = 0;
			let inStr = false;
			let escaped = false;
			let insideArray = false;
			for (let i = posInBody - 1; i >= 0; i--) {
				const ch = jsonBody[i];
				if (escaped) { escaped = false; continue; }
				if (ch === "\\") { escaped = true; continue; }
				if (ch === '"') { inStr = !inStr; continue; }
				if (inStr) continue;
				if (ch === "}" || ch === "]") { depth++; }
				else if (ch === "{") { if (depth === 0) { insideArray = false; break; } depth--; }
				else if (ch === "[") { if (depth === 0) { insideArray = true; break; } depth--; }
			}
			if (insideArray) return null;
		}

		// Property name position — with or without quotes
		const isPropertyPosition =
			beforeCursor === "" ||
			beforeCursor === '"' ||
			/^"?[\w]*$/.test(beforeCursor) ||
			/[{,]\s*"?[\w]*$/.test(beforeCursor);

		if (!isPropertyPosition) return null;

		// Only auto-trigger property completions when the user has started typing a name
		// Don't auto-trigger after a comma without typing (e.g. "Patient", |)
		if (!context.explicit && /,\s*"?\s*$/.test(beforeCursor) && !context.matchBefore(/\w+/)) return null;

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

			if (isArray || isString) {
				setTimeout(() => startCompletion(view), 0);
			}
		},
	};
	if (element.short) completion.info = element.short;
	return completion;
}

// ── YAML completion source ──────────────────────────────────────────────

export function yamlFhirCompletionSource(
	getSDs: GetStructureDefinitions,
	resourceTypeHint?: string,
	expandValueSet?: ExpandValueSet,
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

		// Extension URL value completion in YAML — url: "|" inside extension
		if (valueKey === "url") {
			const path = getYamlPathAtCursor(doc, pos);
			const lastSeg = path[path.length - 1];
			if (lastSeg === "extension" || lastSeg === "modifierExtension") {
				const resourceType = getYamlResourceType(doc) ?? resourceTypeHint;
				// Check for nested extension — find parent url in YAML
				let parentExtUrl: string | null = null;
				const urlMatches = [...doc.slice(0, pos).matchAll(/url:\s*['"]?([^\s'"]+)['"]?/g)];
				// If path has multiple extension segments, find parent
				const extCount = path.filter((p) => p === "extension" || p === "modifierExtension").length;
				if (extCount >= 2) {
					for (let i = urlMatches.length - 1; i >= 0; i--) {
						const u = urlMatches[i]![1]!;
						if (u.includes("/")) { parentExtUrl = u; break; }
					}
				}
				if (parentExtUrl) {
					const parentSD = await getCachedSD(parentExtUrl, getSDs);
					if (parentSD) {
						const info = analyzeExtensionSD(parentSD);
						if (info?.slices.length) {
							const word = context.matchBefore(/[\w.:/-]*/);
							const filter = word?.text.toLowerCase() ?? "";
							const matching = filter
								? info.slices.filter((s) => s.fixedUri.toLowerCase().includes(filter) || (s.short?.toLowerCase().includes(filter) ?? false))
								: info.slices;
							const options: Completion[] = matching.map((slice) => ({
								label: slice.fixedUri,
								...(slice.short ? { info: slice.short } : {}),
								type: "text",
							}));
							if (options.length > 0) return { from: word?.from ?? pos, options, filter: false };
						}
					}
				} else if (resourceType) {
					const contextTypes: string[] = [resourceType, "DomainResource", "Resource", "Element"];
					// Resolve container type from path
					const extIdx = path.lastIndexOf("extension");
					if (extIdx > 0) {
						let currentRT = resourceType;
						for (let i = 0; i < extIdx; i++) {
							const seg = path[i];
							if (!seg) break;
							const elements = await resolveElements([], currentRT, getSDs);
							const el = elements.find((e) => fieldName(e) === seg);
							if (el?.type?.[0]?.code && !isPrimitiveType(el.type[0].code)) currentRT = el.type[0].code;
							else break;
						}
						if (currentRT !== resourceType) {
							contextTypes.length = 0;
							contextTypes.push(currentRT, "Element", `${resourceType}.${path.slice(0, extIdx).join(".")}`);
						}
					}
					// Profile extensions
					const profileExtUrls: string[] = [];
					if (contextTypes.includes(resourceType)) {
						for (const pUrl of getYamlProfileUrls(doc)) {
							const profileSD = await getCachedSD(pUrl, getSDs);
							if (!profileSD?.differential?.element) continue;
							for (const el of profileSD.differential.element) {
								for (const t of el.type ?? []) {
									if (t.code === "Extension") {
										for (const p of t.profile ?? []) {
											const clean = p.includes("|") ? p.slice(0, p.indexOf("|")) : p;
											if (!profileExtUrls.includes(clean)) profileExtUrls.push(clean);
										}
									}
								}
							}
						}
					}
					const bareWord = context.matchBefore(/[\w.:/-]*/);
					const filter = bareWord?.text ?? "";
					const searchParams: StructureDefinitionSearchParams = { type: "Extension", derivation: "constraint", _elements: "url,context", _count: "500" };
					if (filter) searchParams._ilike = filter;
					const results = await getCachedSDList(searchParams, getSDs);
					const containerType = contextTypes[0];
					const fhirPath = contextTypes.find((c) => c.includes("."));
					const contextExts = results.filter((sd) => sd.context?.some((c) => c.type === "element" && contextTypes.includes(c.expression)));
					const seen = new Set<string>();
					const allExts: { url: string; boost: number }[] = [];
					if (contextTypes.includes(resourceType)) {
						for (const u of profileExtUrls) { if (!seen.has(u)) { seen.add(u); allExts.push({ url: u, boost: 20 }); } }
					}
					for (const sd of contextExts) {
						const u = sd.url ?? sd.type;
						if (seen.has(u)) continue;
						seen.add(u);
						const ctxExprs = sd.context?.filter((c) => c.type === "element").map((c) => c.expression) ?? [];
						let boost = 0;
						if (fhirPath && ctxExprs.includes(fhirPath)) boost = 15;
						else if (containerType && ctxExprs.includes(containerType)) boost = 10;
						else if (ctxExprs.includes(resourceType)) boost = 5;
						else if (ctxExprs.some((e) => e === "DomainResource" || e === "Resource")) boost = 2;
						else if (ctxExprs.includes("Element")) boost = 1;
						allExts.push({ url: u, boost });
					}
					const lf = filter.toLowerCase();
					const sorted = (lf ? allExts.filter((e) => e.url.toLowerCase().includes(lf)) : allExts).sort((a, b) => b.boost - a.boost);
					if (sorted.length > 0) {
						const options: Completion[] = sorted.map((ext) => ({ label: ext.url, type: "text", boost: ext.boost }));
						return { from: bareWord?.from ?? pos, options, filter: false };
					}
				}
				return null;
			}
		}

		// Terminology binding value completion
		if (valueKey && valueKey !== "resourceType" && valueKey !== "reference" && valueKey !== "url" && expandValueSet) {
			const path = getYamlPathAtCursor(doc, pos);
			const resourceType = getYamlResourceType(doc) ?? resourceTypeHint;
			if (resourceType) {
				const profileUrls = getYamlProfileUrls(doc);
				const valueSetUrl = await findBindingForValue(path, valueKey, resourceType, getSDs, profileUrls, doc, pos);
				if (valueSetUrl) {
					const word = context.matchBefore(/[\w-]*/);
					const filter = word ? doc.slice(word.from, pos) : "";
					try {
						const codes = await expandValueSet(valueSetUrl, filter);
						if (codes.length > 0) {
							const options: Completion[] = codes.map((c) => ({
								label: c.code,
								...(c.display ? { info: c.display } : {}),
								type: "text",
							}));
							return { from: word?.from ?? pos, options, validFor: /^[\w-]*$/ };
						}
					} catch {
						// expand failed — fall through
					}
				}
			}
		}

		// Canonical array completion in YAML (e.g. meta.profile → StructureDefinition profiles)
		{
			const trimmed = beforeCursor.trimStart();
			const isArrayItem = trimmed === "-" || trimmed === "- " || trimmed.startsWith("- ");
			if (isArrayItem) {
				const path = getYamlPathAtCursor(doc, pos);
				const arrayKey = path[path.length - 1];
				if (path.length > 0 && arrayKey) {
					const parentPath = path.slice(0, -1);
					const resourceType = getYamlResourceType(doc) ?? resourceTypeHint;
					if (resourceType) {
						const targetType = await findCanonicalTargetType(parentPath, arrayKey, resourceType, getSDs);
						if (targetType === "StructureDefinition") {
							const allSDs = await getCachedSDList(
								{ type: `${resourceType},DomainResource,Resource`, derivation: "constraint", _elements: "url,name", _count: "50" },
								getSDs,
							);
							const seen = new Set<string>();
							const uniqueSDs = allSDs.filter((sd) => {
								const u = sd.url ?? sd.type;
								if (seen.has(u)) return false;
								seen.add(u);
								return true;
							});
							if (uniqueSDs.length > 0) {
								const word = context.matchBefore(/[\w.:/-]*/);
								const from = word?.from ?? pos;
								const filter = word?.text.toLowerCase() ?? "";
								const filtered = filter
									? uniqueSDs.filter((sd) => sd.name?.toLowerCase().includes(filter) || sd.url?.toLowerCase().includes(filter))
									: uniqueSDs;
								const options: Completion[] = filtered.map((sd) => ({
									label: sd.url ?? sd.type,
									...(sd.name ? { info: sd.name } : {}),
									type: "text",
								}));
								if (options.length > 0) {
									return { from, options, filter: false };
								}
							}
						}
						if (targetType) return null;
					}
				}
			}
		}

		if (!isYamlPropertyPosition(beforeCursor)) return null;

		// Only auto-trigger property completions when the user has started typing a name
		// Don't auto-trigger after a comma without typing (e.g. "Patient", |)
		if (!context.explicit && /,\s*"?\s*$/.test(beforeCursor) && !context.matchBefore(/\w+/)) return null;

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
		// Skip array scalar values (quoted strings, URLs, or bare values)
		if (isArrayItem && (content.startsWith("'") || content.startsWith('"') || !content.includes(": "))) continue;
		const colonIdx = content.indexOf(": ");
		if (colonIdx <= 0) continue;

		const key = content.slice(0, colonIdx).trim();
		const valueAfterColon = content.slice(colonIdx + 2).trim();

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
			const afterColonStr = content.slice(colonIdx + 2);
			const wsLen = afterColonStr.length - afterColonStr.trimStart().length;
			const emptyFrom = charOffset + keyIndent + colonIdx + 2 + wsLen;
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

		function hasActiveDiagnostics() {
			try {
				return view.state.field(fhirDiagnosticsField).messages.size > 0;
			} catch {
				return false;
			}
		}

		function scheduleCheck() {
			if (timeout) clearTimeout(timeout);
			const delay = hasActiveDiagnostics() ? 0 : 1500;
			timeout = setTimeout(() => check(), delay);
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
	expandValueSet?: ExpandValueSet,
): Extension {
	const jsonSource = fhirCompletionSource(getSDs, resourceTypeHint, expandValueSet);
	const yamlSource = yamlFhirCompletionSource(getSDs, resourceTypeHint, expandValueSet);
	// Trigger completion on empty lines inside objects (where from === pos
	// would cause CodeMirror to suppress auto-triggered results)
	const autoTrigger = EditorView.updateListener.of((update) => {
		if (!update.docChanged) return;
		if (completionStatus(update.view.state)) return;
		// Ignore bulk replacements (e.g. tab switch, currentValue update)
		let changeSize = 0;
		update.changes.iterChanges((_fA, _tA, _fB, _tB, ins) => { changeSize += ins.length; });
		if (changeSize > 50) return;
		const { state } = update.view;
		const pos = state.selection.main.head;
		const doc = state.doc.toString();
		const line = state.doc.lineAt(pos);
		const beforeCursor = line.text.slice(0, pos - line.from).trimStart();
		// Empty line, inside [] or inside ""
		const shouldTrigger =
			beforeCursor === "" ||
			(pos > 0 && doc[pos - 1] === "[") ||
			(pos > 0 && doc[pos - 1] === '"' && pos > 1 && doc[pos - 2] !== "\\");
		if (!shouldTrigger) return;
		setTimeout(() => startCompletion(update.view), 0);
	});

	return [
		jsonLanguage.data.of({ autocomplete: jsonSource }),
		yamlLanguage.data.of({ autocomplete: yamlSource }),
		autoTrigger,
		fhirDiagnosticsField,
		fhirLinterTheme,
		buildFhirValidationPlugin(getSDs, resourceTypeHint),
	];
}
