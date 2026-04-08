import {
	type Completion,
	type CompletionContext,
	type CompletionResult,
	type CompletionSource,
	completionStatus,
	startCompletion,
} from "@codemirror/autocomplete";
import { jsonLanguage } from "@codemirror/lang-json";
import { ensureSyntaxTree, syntaxTree } from "@codemirror/language";
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
import {
	buildJsonDocumentContext,
	type DocumentContext,
	findRootJsonObject,
	type PropertyInfo,
	walkJsonProperties,
} from "./json-ast";

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
	fixedString?: string;
	fixedCode?: string;
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

// ── Constants ──────────────────────────────────────────────────────────

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
	const direct = elements.find((el) => {
		if (!el.path.startsWith(`${parentPath}.`)) return false;
		const name = fieldName(el);
		return name === key || name.toLowerCase() === key.toLowerCase();
	});
	if (direct) return direct;

	for (const el of elements) {
		if (!el.path.endsWith("[x]")) continue;
		if (!el.path.startsWith(`${parentPath}.`)) continue;
		const baseName = fieldName(el);
		if (!key.toLowerCase().startsWith(baseName.toLowerCase())) continue;
		const typeSuffix = key.slice(baseName.length).toLowerCase();
		const matchedType = el.type?.find(
			(t) => t.code.toLowerCase() === typeSuffix,
		);
		if (matchedType) {
			return { ...el, type: [matchedType] };
		}
	}
	return undefined;
}

// ── Resolve completions at path ────────────────────────────────────────

async function collectAllElements(
	type: string,
	getSDs: GetStructureDefinitions,
): Promise<{ elements: FhirElement[]; basePath: string } | null> {
	const sd = await getCachedSD(type, getSDs);
	if (!sd?.differential?.element) return null;

	const elements = [...sd.differential.element];

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

		if (el.contentReference) {
			currentPath = el.contentReference.replace(/^#/, "");
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

async function findResourceBoundary(
	path: string[],
	resourceType: string,
	getSDs: GetStructureDefinitions,
): Promise<number | null> {
	if (path.length === 0) return null;

	const result = await collectAllElements(resourceType, getSDs);
	if (!result) return null;

	let currentPath = resourceType;
	let currentElements = result.elements;

	for (let i = 0; i < path.length; i++) {
		const key = path[i]!;
		if (key === "resourceType") return null;

		const el = findElement(currentElements, currentPath, key);
		if (!el) return null;

		if (el.type?.some((t) => t.code === "Resource")) {
			return i;
		}

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
	return null;
}

// ── Snippet & Completion Builders ──────────────────────────────────────

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
		if (element.contentReference) return isArray ? "array-complex" : "object";
		return "bare";
	}
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
	const inner = `${indent}  `;
	const innerInner = `${inner}  `;
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
			return { text, cursorOffset: text.indexOf(`${inner}\n`) + inner.length };
		}
		case "object": {
			const text = `"${name}": {\n${inner}\n${indent}}`;
			return { text, cursorOffset: text.indexOf(`${inner}\n`) + inner.length };
		}
		case "string": {
			const text = `"${name}": ""`;
			return { text, cursorOffset: text.length - 1 };
		}
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

			const afterName = doc.slice(actualTo).match(/^\s*:/);
			if (afterName) {
				const insert = `"${name}"`;
				view.dispatch({
					changes: { from: actualFrom, to: actualTo, insert },
					selection: { anchor: actualFrom + insert.length },
				});
				return;
			}

			const line = view.state.doc.lineAt(actualFrom);
			const lineText = line.text;
			const indent = lineText.match(/^(\s*)/)?.[1] ?? "";

			const { text, cursorOffset } = buildSnippet(name, kind, indent);

			view.dispatch({
				changes: { from: actualFrom, to: actualTo, insert: text },
				selection: { anchor: actualFrom + cursorOffset },
			});

			if (
				kind === "string" ||
				kind === "number" ||
				kind === "array-primitive" ||
				kind === "array-extension"
			) {
				setTimeout(() => startCompletion(view), 0);
			}
		},
	};
	if (element.short) completion.info = element.short;
	return completion;
}

function toParameterPropertyCompletion(element: FhirElement): Completion {
	const name = fieldName(element);
	if (name !== "parameter" && name !== "part") return toCompletion(element);

	const types = element.type?.map((t) => t.code).join(" | ") ?? "";
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

			const afterName = doc.slice(actualTo).match(/^\s*:/);
			if (afterName) {
				const insert = `"${name}"`;
				view.dispatch({
					changes: { from: actualFrom, to: actualTo, insert },
					selection: { anchor: actualFrom + insert.length },
				});
				return;
			}

			const line = view.state.doc.lineAt(actualFrom);
			const indent = line.text.match(/^(\s*)/)?.[1] ?? "";
			const inner = `${indent}  `;
			const innerInner = `${inner}  `;
			const text = `"${name}": [\n${inner}{\n${innerInner}"name": ""\n${inner}}\n${indent}]`;
			view.dispatch({
				changes: { from: actualFrom, to: actualTo, insert: text },
				selection: { anchor: actualFrom + text.lastIndexOf('""') + 1 },
			});
			setTimeout(() => startCompletion(view), 0);
		},
	};
	if (element.short) completion.info = element.short;
	return completion;
}

function elementsToCompletions(
	elements: FhirElement[],
	mapFn: (el: FhirElement) => Completion,
): Completion[] {
	const completions: Completion[] = [];
	for (const el of elements) {
		completions.push(mapFn(el));
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

// ── Parameters slice helpers ────────────────────────────────────────────

const parametersTypeCache = new Map<string, boolean>();

async function isParametersType(
	resourceType: string,
	getSDs: GetStructureDefinitions,
): Promise<boolean> {
	if (resourceType === "Parameters") return true;
	if (parametersTypeCache.has(resourceType))
		return parametersTypeCache.get(resourceType)!;

	const sd = await getCachedSD(resourceType, getSDs);
	if (!sd?.baseDefinition) {
		parametersTypeCache.set(resourceType, false);
		return false;
	}
	const baseType = sd.baseDefinition.split("/").pop()?.split("|")[0] ?? "";
	const result = await isParametersType(baseType, getSDs);
	parametersTypeCache.set(resourceType, result);
	return result;
}

interface ParameterSlice {
	sliceName: string;
	fixedName: string;
	min: number;
	max: string;
	valueTypes: string[];
	short?: string;
}

async function getParameterSlices(
	profileUrls: string[],
	getSDs: GetStructureDefinitions,
): Promise<ParameterSlice[]> {
	const slices: ParameterSlice[] = [];

	for (const profileUrl of profileUrls) {
		const sd = await getCachedSD(profileUrl, getSDs);
		if (!sd?.differential?.element) continue;

		const elements = sd.differential.element;
		// Find the parameter path dynamically: "X.parameter" where X is the profile's type
		const paramPath = `${sd.type}.parameter`;

		let current: {
			sliceName: string;
			min: number;
			max: string;
			fixedName: string | null;
			valueTypes: string[];
			short: string | undefined;
		} | null = null;

		const flush = () => {
			if (current?.fixedName) {
				const s: ParameterSlice = {
					sliceName: current.sliceName,
					fixedName: current.fixedName,
					min: current.min,
					max: current.max,
					valueTypes: current.valueTypes,
				};
				if (current.short != null) s.short = current.short;
				slices.push(s);
			}
		};

		for (const el of elements) {
			if (el.path === paramPath && el.sliceName) {
				flush();
				current = {
					sliceName: el.sliceName,
					min: el.min ?? 0,
					max: el.max ?? "*",
					fixedName: null,
					valueTypes: [],
					short: el.short,
				};
				continue;
			}

			if (!current) continue;

			if (el.path === `${paramPath}.name` && el.fixedString) {
				current.fixedName = el.fixedString;
			}
			if (el.path === `${paramPath}.value[x]` && el.type) {
				current.valueTypes = el.type.map((t) => t.code);
			}
		}

		flush();
	}

	return slices;
}

// ── Fixed value helpers ────────────────────────────────────────────────

async function getFixedValues(
	effectivePath: string[],
	valueKey: string,
	resourceType: string,
	profileUrls: string[],
	getSDs: GetStructureDefinitions,
): Promise<string | null> {
	for (const profileUrl of profileUrls) {
		const sd = await getCachedSD(profileUrl, getSDs);
		if (!sd?.differential?.element) continue;

		const fhirPath = `${resourceType}.${[...effectivePath, valueKey].join(".")}`;
		for (const el of sd.differential.element) {
			if (el.path !== fhirPath) continue;
			if (el.fixedString != null) return el.fixedString;
			if (el.fixedUri != null) return el.fixedUri;
			if (el.fixedCode != null) return el.fixedCode;
		}
	}
	return null;
}

/** @internal — exported for tests only */
export function buildParameterSnippet(
	name: string,
	valueTypes: string[],
	indent: string,
): { text: string; cursorOffset: number } {
	const inner = `${indent}  `;

	if (valueTypes.length === 1 && FHIR_STRING_TYPES.has(valueTypes[0]!)) {
		const tc = valueTypes[0]!;
		const vf = `value${tc.charAt(0).toUpperCase()}${tc.slice(1)}`;
		const text = `{\n${inner}"name": "${name}",\n${inner}"${vf}": ""\n${indent}}`;
		return { text, cursorOffset: text.lastIndexOf('""') + 1 };
	}
	if (valueTypes.length === 1 && FHIR_NUMBER_TYPES.has(valueTypes[0]!)) {
		const tc = valueTypes[0]!;
		const vf = `value${tc.charAt(0).toUpperCase()}${tc.slice(1)}`;
		const text = `{\n${inner}"name": "${name}",\n${inner}"${vf}": \n${indent}}`;
		return {
			text,
			cursorOffset: text.indexOf(`"${vf}": \n`) + `"${vf}": `.length,
		};
	}
	if (valueTypes.length === 1) {
		const tc = valueTypes[0]!;
		const vf = `value${tc.charAt(0).toUpperCase()}${tc.slice(1)}`;
		const innerInner = `${inner}  `;
		const text = `{\n${inner}"name": "${name}",\n${inner}"${vf}": {\n${innerInner}\n${inner}}\n${indent}}`;
		return {
			text,
			cursorOffset:
				text.indexOf(`${innerInner}\n${inner}}`) + innerInner.length,
		};
	}
	// Default to valueString when no value type constraint
	const text = `{\n${inner}"name": "${name}",\n${inner}"valueString": ""\n${indent}}`;
	if (name === "") {
		// Generic template: cursor in name
		return { text, cursorOffset: text.indexOf('""') + 1 };
	}
	return { text, cursorOffset: text.lastIndexOf('""') + 1 };
}

// ── Binding & Reference Resolution ─────────────────────────────────────

function buildFhirElementPath(
	resourceType: string,
	path: string[],
	valueKey: string,
): string {
	return `${resourceType}.${[...path, valueKey].join(".")}`;
}

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

		const directPath = buildFhirElementPath(resourceType, path, valueKey);
		for (const el of sd.differential.element) {
			if (el.path === directPath && el.binding?.valueSet) {
				return el.binding.valueSet;
			}
		}

		if (valueKey === "code") {
			for (let i = path.length; i > 0; i--) {
				const parentFhirPath = buildFhirElementPath(
					resourceType,
					path.slice(0, i - 1),
					path[i - 1]!,
				);
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

async function findExtensionBinding(
	doc: string,
	pos: number,
	getSDs: GetStructureDefinitions,
): Promise<string | null> {
	const textBefore = doc.slice(0, pos);

	const urlMatches = [...textBefore.matchAll(/"url"\s*:\s*"([^"]+)"/g)];
	if (urlMatches.length === 0) return null;

	for (let i = urlMatches.length - 1; i >= 0; i--) {
		const extUrl = urlMatches[i]![1]!;
		if (
			!extUrl.includes("StructureDefinition/") &&
			!extUrl.includes("Extension")
		) {
			const parentUrlMatches = [
				...textBefore
					.slice(0, urlMatches[i]?.index)
					.matchAll(/"url"\s*:\s*"([^"]+)"/g),
			];
			for (let j = parentUrlMatches.length - 1; j >= 0; j--) {
				const parentUrl = parentUrlMatches[j]![1]!;
				if (!parentUrl.includes("/")) continue;
				const parentSD = await getCachedSD(parentUrl, getSDs);
				if (!parentSD?.differential?.element) continue;
				let inSlice = false;
				for (const el of parentSD.differential.element) {
					if (el.path === "Extension.extension" && el.sliceName) {
						const urlEl = parentSD.differential.element.find(
							(e) =>
								e.path === "Extension.extension.url" &&
								e.fixedUri &&
								parentSD.differential!.element.indexOf(e) >
									parentSD.differential!.element.indexOf(el),
						);
						if ((urlEl?.fixedUri ?? el.sliceName) === extUrl) {
							inSlice = true;
							continue;
						}
						if (inSlice) break;
					}
					if (
						inSlice &&
						el.path === "Extension.extension.value[x]" &&
						el.binding?.valueSet
					) {
						return el.binding.valueSet;
					}
				}
				if (inSlice) break;
			}
			continue;
		}
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
	if (doc != null && pos != null) {
		const inExtension = path.some(
			(p) => p === "extension" || p === "modifierExtension",
		);
		if (inExtension) {
			const extBinding = await findExtensionBinding(doc, pos, getSDs);
			if (extBinding) return extBinding;
		}
	}

	const profileBinding = await findProfileBinding(
		profileUrls,
		resourceType,
		path,
		valueKey,
		getSDs,
	);
	if (profileBinding) return profileBinding;

	const elements = await resolveElements(path, resourceType, getSDs);
	for (const el of elements) {
		if (fieldName(el) === valueKey && el.binding?.valueSet) {
			return el.binding.valueSet;
		}
	}

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
		return t.targetProfile[0]?.split("/").pop() ?? null;
	}
	return null;
}

async function resolveReferenceTargets(
	path: string[],
	resourceType: string,
	getSDs: GetStructureDefinitions,
): Promise<string[] | null> {
	const result = await collectAllElements(resourceType, getSDs);
	if (!result) return null;

	let currentPath = resourceType;
	let currentElements = result.elements;

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

	const lastKey = path[path.length - 1];
	if (!lastKey) return null;

	const el = findElement(currentElements, currentPath, lastKey);
	if (!el?.type) return null;

	const targets: string[] = [];
	for (const t of el.type) {
		if (t.code === "Reference" && t.targetProfile) {
			for (const profile of t.targetProfile) {
				const rt = profile.split("/").pop();
				if (rt) targets.push(rt);
			}
		}
	}
	return targets.length > 0 ? targets : null;
}

// ── Unified completion handler ─────────────────────────────────────────

async function fhirComplete(
	ctx: DocumentContext,
	getSDs: GetStructureDefinitions,
	resourceTypeHint: string | undefined,
	expandValueSet: ExpandValueSet | undefined,
	completionContext: CompletionContext,
): Promise<CompletionResult | null> {
	const { pos, doc } = ctx;

	// 1. Resolve context: resourceType, effectivePath, profileUrls
	// Search from root (outermost scope) inward to find the root resourceType.
	// If not found in doc, fall back to resourceTypeHint (derived from URL).
	let resourceType: string | undefined;
	let hasExplicitResourceType = false;
	let rtScope = ctx.getScope(0);
	for (let level = ctx.fullPath.length; level >= 0; level--) {
		const s = ctx.getScope(level);
		const rt = s.getString("resourceType");
		if (rt) {
			resourceType = rt;
			hasExplicitResourceType = true;
			rtScope = s;
			break;
		}
	}
	// If no resourceType found in any scope, use hint.
	// If found only in an inner scope (not the root), still prefer hint for
	// boundary detection — the inner RT will be picked up via getScope later.
	if (!resourceType) {
		resourceType = resourceTypeHint;
		rtScope = ctx.getScope(ctx.fullPath.length);
	} else if (resourceTypeHint && ctx.fullPath.length > 0) {
		// Check if the found RT is actually from an inner scope, not the root.
		// If the root scope has no RT but hint is available, use hint as the
		// outer RT so that findResourceBoundary can resolve the path correctly.
		const rootRT = ctx.getScope(ctx.fullPath.length).getString("resourceType");
		if (!rootRT) {
			resourceType = resourceTypeHint;
			hasExplicitResourceType = false;
		}
	}

	let effectivePath = ctx.fullPath;
	let profileUrls: string[] = [];

	// Detect Resource-typed boundary (e.g. contained, Bundle.entry.resource)
	if (resourceType && effectivePath.length > 0) {
		const boundaryIdx = await findResourceBoundary(
			effectivePath,
			resourceType,
			getSDs,
		);
		if (boundaryIdx !== null) {
			const innerPath = effectivePath.slice(boundaryIdx + 1);
			const innerScope = ctx.getScope(innerPath.length);
			const innerRT = innerScope.getString("resourceType");
			effectivePath = innerPath;
			if (innerRT) {
				resourceType = innerRT;
				hasExplicitResourceType = true;
			} else {
				resourceType = "DomainResource";
				hasExplicitResourceType = false;
			}
			profileUrls = innerScope.getStringArray("meta", "profile");
		} else {
			profileUrls = rtScope.getStringArray("meta", "profile");
		}
	} else {
		profileUrls = rtScope.getStringArray("meta", "profile");
	}

	// 2. Handle cursor position kinds
	const cp = ctx.cursorPosition;

	if (cp.kind === "value") {
		return handleValueCompletion(
			cp.key,
			effectivePath,
			resourceType,
			hasExplicitResourceType,
			profileUrls,
			doc,
			pos,
			getSDs,
			expandValueSet,
			completionContext,
			ctx,
		);
	}

	if (cp.kind === "array-item") {
		return handleArrayItemCompletion(
			cp.parentKey,
			effectivePath,
			resourceType,
			doc,
			pos,
			getSDs,
			completionContext,
			profileUrls,
		);
	}

	if (cp.kind === "property") {
		// Don't offer property completions inside arrays
		if (ctx.isInsideArray()) return null;

		return handlePropertyCompletion(
			effectivePath,
			resourceType,
			hasExplicitResourceType,
			doc,
			pos,
			getSDs,
			completionContext,
			ctx,
		);
	}

	return null;
}

// ── Value completion ───────────────────────────────────────────────────

async function handleValueCompletion(
	valueKey: string,
	effectivePath: string[],
	resourceType: string | undefined,
	_hasExplicitResourceType: boolean,
	profileUrls: string[],
	doc: string,
	pos: number,
	getSDs: GetStructureDefinitions,
	expandValueSet: ExpandValueSet | undefined,
	completionContext: CompletionContext,
	ctx: DocumentContext,
): Promise<CompletionResult | null> {
	// resourceType value
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
		const word = completionContext.matchBefore(/[\w]*/);
		return { from: word?.from ?? pos, options, validFor: /^\w*$/ };
	}

	// Parameters.parameter.name → slice names from profile
	if (
		valueKey === "name" &&
		resourceType &&
		effectivePath.length > 0 &&
		effectivePath[effectivePath.length - 1] === "parameter" &&
		(await isParametersType(resourceType, getSDs))
	) {
		const slices = await getParameterSlices(profileUrls, getSDs);
		if (slices.length > 0) {
			const options: Completion[] = slices.map((slice) => ({
				label: slice.fixedName,
				type: "text",
				detail: slice.min > 0 ? "required" : "optional",
				boost: slice.min > 0 ? 2 : 0,
				...(slice.short ? { info: slice.short } : {}),
				apply: (view: EditorView, _c: Completion, from: number, to: number) => {
					const d = view.state.doc.toString();
					let actualTo = to;
					if (actualTo < d.length && d[actualTo] === '"') actualTo++;
					view.dispatch({
						changes: {
							from,
							to: actualTo,
							insert: `${slice.fixedName}"`,
						},
						selection: { anchor: from + slice.fixedName.length + 1 },
					});
					// Auto-insert value[x] field based on slice type
					const vTypes = slice.valueTypes;
					if (vTypes.length === 0) vTypes.push("string");
					if (vTypes.length === 1) {
						setTimeout(() => {
							const cp = view.state.selection.main.head;
							const cd = view.state.doc.toString();
							const after = cd.slice(cp);
							if (!/^\s*\n\s*\}/.test(after)) return;
							const lineObj = view.state.doc.lineAt(cp);
							const ind = lineObj.text.match(/^(\s*)/)?.[1] ?? "";
							const tc = vTypes[0]!;
							const vf = `value${tc.charAt(0).toUpperCase()}${tc.slice(1)}`;
							let ins: string;
							let cOff: number;
							if (FHIR_STRING_TYPES.has(tc)) {
								ins = `,\n${ind}"${vf}": ""`;
								cOff = ins.length - 1;
							} else if (FHIR_NUMBER_TYPES.has(tc)) {
								ins = `,\n${ind}"${vf}": `;
								cOff = ins.length;
							} else {
								const inner = `${ind}  `;
								ins = `,\n${ind}"${vf}": {\n${inner}\n${ind}}`;
								cOff = ins.indexOf(`${inner}\n${ind}}`) + inner.length;
							}
							view.dispatch({
								changes: { from: cp, insert: ins },
								selection: { anchor: cp + cOff },
							});
							setTimeout(() => startCompletion(view), 0);
						}, 10);
					}
				},
			}));
			const word = completionContext.matchBefore(/[\w]*/);
			return { from: word?.from ?? pos, options, validFor: /^\w*$/ };
		}
	}

	// Fixed value from profile (fixedString, fixedUri, fixedCode)
	if (resourceType && profileUrls.length > 0) {
		const fixedVal = await getFixedValues(
			effectivePath,
			valueKey,
			resourceType,
			profileUrls,
			getSDs,
		);
		if (fixedVal != null) {
			const option: Completion = {
				label: fixedVal,
				type: "text",
				boost: 10,
				apply: (view: EditorView, _c: Completion, from: number, to: number) => {
					const d = view.state.doc.toString();
					let actualTo = to;
					if (actualTo < d.length && d[actualTo] === '"') actualTo++;
					view.dispatch({
						changes: { from, to: actualTo, insert: `${fixedVal}"` },
						selection: { anchor: from + fixedVal.length + 1 },
					});
				},
			};
			const word = completionContext.matchBefore(/[\w.:/-]*/);
			return {
				from: word?.from ?? pos,
				options: [option],
				validFor: /^[\w.:/-]*$/,
			};
		}
	}

	// reference value
	if (valueKey === "reference" && resourceType) {
		const targets = await resolveReferenceTargets(
			effectivePath,
			resourceType,
			getSDs,
		);
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
			const word = completionContext.matchBefore(/[\w/]*/);
			return { from: word?.from ?? pos, options, validFor: /^[\w/]*$/ };
		}
	}

	// Extension URL value
	if (valueKey === "url") {
		const lastSeg = ctx.fullPath[ctx.fullPath.length - 1];
		if (lastSeg === "extension" || lastSeg === "modifierExtension") {
			return handleExtensionUrlCompletion(
				effectivePath,
				resourceType,
				profileUrls,
				doc,
				pos,
				getSDs,
				completionContext,
				ctx,
			);
		}
	}

	// Boolean value
	if (resourceType) {
		const elements = await resolveElements(effectivePath, resourceType, getSDs);
		const el = elements.find((e) => fieldName(e) === valueKey);
		if (el?.type?.length === 1 && el.type[0]?.code === "boolean") {
			const word = completionContext.matchBefore(/[\w]*/);
			const options: Completion[] = ["true", "false"].map((v) => ({
				label: v,
				type: "keyword",
				apply: (view: EditorView, _c: Completion, from: number, to: number) => {
					const d = view.state.doc.toString();
					let actualFrom = from;
					let actualTo = to;
					// Remove surrounding quotes if present
					if (actualFrom > 0 && d[actualFrom - 1] === '"') actualFrom--;
					if (actualTo < d.length && d[actualTo] === '"') actualTo++;
					view.dispatch({
						changes: { from: actualFrom, to: actualTo, insert: v },
						selection: { anchor: actualFrom + v.length },
					});
				},
			}));
			return { from: word?.from ?? pos, options, validFor: /^\w*$/ };
		}
	}

	// Terminology binding
	if (
		valueKey !== "resourceType" &&
		valueKey !== "reference" &&
		valueKey !== "url" &&
		expandValueSet &&
		resourceType
	) {
		const valueSetUrl = await findBindingForValue(
			effectivePath,
			valueKey,
			resourceType,
			getSDs,
			profileUrls,
			doc,
			pos,
		);
		if (valueSetUrl) {
			const quoteWord = completionContext.matchBefore(/"[\w-]*/);
			const from = quoteWord?.from ?? pos;
			const filter = quoteWord ? quoteWord.text.replace(/^"/, "") : "";
			try {
				const codes = await expandValueSet(valueSetUrl, filter);
				if (codes.length > 0) {
					const options: Completion[] = codes.map((c) => ({
						label: c.code,
						...(c.display ? { info: c.display } : {}),
						type: "text",
						apply: (
							view: EditorView,
							_c: Completion,
							applyFrom: number,
							applyTo: number,
						) => {
							const d = view.state.doc.toString();
							let actualFrom = applyFrom;
							let actualTo = applyTo;
							if (d[actualFrom] === '"') actualFrom++;
							if (actualTo < d.length && d[actualTo] === '"') actualTo++;
							view.dispatch({
								changes: {
									from: actualFrom,
									to: actualTo,
									insert: `${c.code}"`,
								},
								selection: { anchor: actualFrom + c.code.length + 1 },
							});
						},
					}));
					return { from, options, filter: false };
				}
			} catch {
				// expand failed
			}
		}
	}

	return null;
}

// ── Extension URL completion ───────────────────────────────────────────

async function handleExtensionUrlCompletion(
	_effectivePath: string[],
	resourceType: string | undefined,
	profileUrls: string[],
	doc: string,
	pos: number,
	getSDs: GetStructureDefinitions,
	completionContext: CompletionContext,
	ctx: DocumentContext,
): Promise<CompletionResult | null> {
	// Check for nested extension (parent has url)
	const urlKeyPos = doc.lastIndexOf('"url"', pos);
	let scanEnd = urlKeyPos !== -1 ? urlKeyPos : pos;
	for (let i = scanEnd - 1; i >= 0; i--) {
		const c = doc[i];
		if (c === "{") {
			scanEnd = i;
			break;
		}
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
		if (esc) {
			esc = false;
			continue;
		}
		if (ch === "\\") {
			esc = true;
			continue;
		}
		if (ch === '"') {
			inStr = !inStr;
			continue;
		}
		if (inStr) continue;
		if (ch === "}" || ch === "]") {
			depth++;
		} else if (ch === "[") {
			if (depth === 0) {
				foundExtArray = true;
				continue;
			}
			depth--;
		} else if (ch === "{") {
			if (depth === 0 && foundExtArray) {
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
		return handleNestedExtensionSlices(
			parentExtUrl,
			pos,
			getSDs,
			completionContext,
		);
	}

	if (!resourceType) return null;

	// Top-level extension URL completions
	const path = ctx.fullPath;
	const contextTypes: string[] = [
		resourceType,
		"DomainResource",
		"Resource",
		"Element",
	];
	const extIdx = path.lastIndexOf("extension");
	if (extIdx > 0) {
		let currentRT = resourceType;
		for (let i = 0; i < extIdx; i++) {
			const seg = path[i];
			if (!seg) break;
			const elements = await resolveElements([], currentRT, getSDs);
			const el = elements.find((e) => fieldName(e) === seg);
			if (el?.type?.[0]?.code && !isPrimitiveType(el.type[0].code))
				currentRT = el.type[0].code;
			else break;
		}
		if (currentRT !== resourceType) {
			contextTypes.length = 0;
			contextTypes.push(
				currentRT,
				"Element",
				`${resourceType}.${path.slice(0, extIdx).join(".")}`,
			);
		}
	}

	// Profile extensions
	const profileExtUrls: string[] = [];
	if (contextTypes.includes(resourceType)) {
		for (const pUrl of profileUrls) {
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

	const bareWord = completionContext.matchBefore(/[\w.:/-]*/);
	const filter = bareWord?.text ?? "";
	const searchParams: StructureDefinitionSearchParams = {
		type: "Extension",
		derivation: "constraint",
		_elements: "url,context",
		_count: "500",
	};
	if (filter) searchParams._ilike = filter;
	const results = await getCachedSDList(searchParams, getSDs);

	const containerType = contextTypes[0];
	const fhirPath = contextTypes.find((c) => c.includes("."));
	const contextExts = results.filter((sd) =>
		sd.context?.some(
			(c) => c.type === "element" && contextTypes.includes(c.expression),
		),
	);
	const seen = new Set<string>();
	const allExts: { url: string; boost: number }[] = [];
	if (contextTypes.includes(resourceType)) {
		for (const u of profileExtUrls) {
			if (!seen.has(u)) {
				seen.add(u);
				allExts.push({ url: u, boost: 20 });
			}
		}
	}
	for (const sd of contextExts) {
		const u = sd.url ?? sd.type;
		if (seen.has(u)) continue;
		seen.add(u);
		const ctxExprs =
			sd.context
				?.filter((c) => c.type === "element")
				.map((c) => c.expression) ?? [];
		let boost = 0;
		if (fhirPath && ctxExprs.includes(fhirPath)) boost = 15;
		else if (containerType && ctxExprs.includes(containerType)) boost = 10;
		else if (ctxExprs.includes(resourceType)) boost = 5;
		else if (ctxExprs.some((e) => e === "DomainResource" || e === "Resource"))
			boost = 2;
		else if (ctxExprs.includes("Element")) boost = 1;
		allExts.push({ url: u, boost });
	}
	const lf = filter.toLowerCase();
	const filtered = (
		lf ? allExts.filter((e) => e.url.toLowerCase().includes(lf)) : allExts
	).sort((a, b) => b.boost - a.boost);
	if (filtered.length > 0) {
		const options: Completion[] = filtered.map((ext) => ({
			label: ext.url,
			type: "text",
			boost: ext.boost,
			apply: (
				view: EditorView,
				_c: Completion,
				applyFrom: number,
				applyTo: number,
			) => {
				const d = view.state.doc.toString();
				let actualTo = applyTo;
				if (actualTo < d.length && d[actualTo] === '"') actualTo++;
				view.dispatch({
					changes: { from: applyFrom, to: actualTo, insert: `${ext.url}"` },
					selection: { anchor: applyFrom + ext.url.length + 1 },
				});
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
						const inner = `${ind}  `;
						const innerInner = `${inner}  `;
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
							const inner = `${ind}  `;
							ins = `,\n${ind}"${vf}": {\n${inner}\n${ind}}`;
							cOff = ins.indexOf(`${inner}\n${ind}`) + inner.length;
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
	return null;
}

async function handleNestedExtensionSlices(
	parentExtUrl: string,
	pos: number,
	getSDs: GetStructureDefinitions,
	completionContext: CompletionContext,
): Promise<CompletionResult | null> {
	const parentSD = await getCachedSD(parentExtUrl, getSDs);
	if (!parentSD) return null;
	const info = analyzeExtensionSD(parentSD);
	if (!info?.slices.length) return null;

	const word = completionContext.matchBefore(/[\w.:/-]*/);
	const filter = word?.text.toLowerCase() ?? "";
	const matching = filter
		? info.slices.filter(
				(s) =>
					s.fixedUri.toLowerCase().includes(filter) ||
					(s.short?.toLowerCase().includes(filter) ?? false),
			)
		: info.slices;

	const options: Completion[] = matching.map((slice) => {
		const sliceElements = parentSD.differential?.element ?? [];
		let sliceValueTypes: string[] = [];
		let inSl = false;
		for (const el of sliceElements) {
			if (
				el.path === "Extension.extension" &&
				el.sliceName === slice.sliceName
			) {
				inSl = true;
				continue;
			}
			if (inSl && el.path === "Extension.extension.value[x]") {
				sliceValueTypes = el.type?.map((t) => t.code) ?? [];
				break;
			}
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
							const inner = `${ind}  `;
							ins = `,\n${ind}"${vf}": {\n${inner}\n${ind}}`;
							cOff = ins.indexOf(`${inner}\n${ind}`) + inner.length;
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
	if (options.length > 0)
		return { from: word?.from ?? pos, options, filter: false };
	return null;
}

// ── Array item completion ──────────────────────────────────────────────

async function handleArrayItemCompletion(
	parentKey: string,
	effectivePath: string[],
	resourceType: string | undefined,
	_doc: string,
	pos: number,
	getSDs: GetStructureDefinitions,
	completionContext: CompletionContext,
	profileUrls: string[],
): Promise<CompletionResult | null> {
	if (!resourceType) return null;

	// Parameters.parameter or part → snippet completions from profile slices
	if (
		(parentKey === "parameter" || parentKey === "part") &&
		(await isParametersType(resourceType, getSDs))
	) {
		const slices =
			parentKey === "parameter"
				? await getParameterSlices(profileUrls, getSDs)
				: [];

		const options: Completion[] = [];

		for (const slice of slices) {
			options.push({
				label: slice.fixedName,
				type: "text",
				detail:
					slice.min > 0 ? `${slice.min}..${slice.max}` : `0..${slice.max}`,
				boost: slice.min > 0 ? 2 : 0,
				...(slice.short ? { info: slice.short } : {}),
				apply: (view: EditorView, _c: Completion, from: number, to: number) => {
					const line = view.state.doc.lineAt(from);
					const indent = line.text.match(/^(\s*)/)?.[1] ?? "";
					const { text, cursorOffset } = buildParameterSnippet(
						slice.fixedName,
						slice.valueTypes,
						indent,
					);

					view.dispatch({
						changes: { from, to, insert: text },
						selection: { anchor: from + cursorOffset },
					});
					setTimeout(() => startCompletion(view), 0);
				},
			});
		}

		// Generic parameter template (always available)
		options.push({
			label: "parameter",
			type: "text",
			boost: -1,
			info: "Custom parameter",
			apply: (view: EditorView, _c: Completion, from: number, to: number) => {
				const line = view.state.doc.lineAt(from);
				const indent = line.text.match(/^(\s*)/)?.[1] ?? "";
				const { text, cursorOffset } = buildParameterSnippet("", [], indent);
				view.dispatch({
					changes: { from, to, insert: text },
					selection: { anchor: from + cursorOffset },
				});
				setTimeout(() => startCompletion(view), 0);
			},
		});

		const word = completionContext.matchBefore(/[\w]*/);
		return { from: word?.from ?? pos, options };
	}

	// Get path excluding the array key itself
	const parentPath =
		effectivePath.length > 0 &&
		effectivePath[effectivePath.length - 1] === parentKey
			? effectivePath.slice(0, -1)
			: effectivePath;

	const targetType = await findCanonicalTargetType(
		parentPath,
		parentKey,
		resourceType,
		getSDs,
	);
	if (targetType === "StructureDefinition") {
		const allSDs = await getCachedSDList(
			{
				type: `${resourceType},DomainResource,Resource`,
				derivation: "constraint",
				_elements: "url,name",
				_count: "50",
			},
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
			const quoteWord = completionContext.matchBefore(/"[^"]*/);
			const bareWord = completionContext.matchBefore(/[\w.:/-]*/);
			const from = quoteWord?.from ?? bareWord?.from ?? pos;
			const filter = quoteWord
				? quoteWord.text.replace(/^"/, "").toLowerCase()
				: (bareWord?.text.toLowerCase() ?? "");
			const filtered = filter
				? uniqueSDs.filter(
						(sd) =>
							sd.name?.toLowerCase().includes(filter) ||
							sd.url?.toLowerCase().includes(filter),
					)
				: uniqueSDs;
			const options: Completion[] = filtered.map((sd) => {
				const url = sd.url ?? sd.type;
				return {
					label: url,
					...(sd.name ? { info: sd.name } : {}),
					type: "text",
					apply: (
						view: EditorView,
						_c: Completion,
						applyFrom: number,
						applyTo: number,
					) => {
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
	return null;
}

// ── Property completion ────────────────────────────────────────────────

async function handlePropertyCompletion(
	effectivePath: string[],
	resourceType: string | undefined,
	hasExplicitResourceType: boolean,
	doc: string,
	pos: number,
	getSDs: GetStructureDefinitions,
	completionContext: CompletionContext,
	ctx: DocumentContext,
): Promise<CompletionResult | null> {
	const line = completionContext.state.doc.lineAt(pos);
	const beforeCursor = line.text.slice(0, pos - line.from).trimStart();

	// Only auto-trigger property completions when user has started typing
	if (
		!completionContext.explicit &&
		/,\s*"?\s*$/.test(beforeCursor) &&
		!completionContext.matchBefore(/\w+/)
	)
		return null;

	const makeJsonRtCompletion = (): Completion => {
		const c: Completion = {
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
		c.info = "FHIR resource type";
		return c;
	};

	let completions: Completion[];
	if (resourceType) {
		const elements = await resolveElements(effectivePath, resourceType, getSDs);
		const isParams = await isParametersType(resourceType, getSDs);
		const mapFn = isParams
			? (el: FhirElement) => toParameterPropertyCompletion(el)
			: toCompletion;
		completions = elementsToCompletions(elements, mapFn);
		if (!hasExplicitResourceType && effectivePath.length === 0) {
			completions = [makeJsonRtCompletion(), ...completions];
		}
	} else if (effectivePath.length === 0) {
		const domainElements = await resolveElements(
			effectivePath,
			"DomainResource",
			getSDs,
		);
		completions = [
			makeJsonRtCompletion(),
			...elementsToCompletions(domainElements, toCompletion),
		];
	} else {
		return null;
	}

	// Filter out properties already present in current object
	const existingKeys = new Set(ctx.getScope(0).getKeys());
	completions = completions.filter((c) => !existingKeys.has(c.label));

	if (completions.length === 0) return null;

	const word = completionContext.matchBefore(/"?\w*/);
	let from = word?.from ?? pos;
	if (from < doc.length && doc[from] === '"') from++;

	return { from, options: completions, validFor: /^\w*$/ };
}

// ── Thin wrapper ───────────────────────────────────────────────────────

/** @internal — exported for tests only */
export function jsonCompletionSource(
	getSDs: GetStructureDefinitions,
	resourceTypeHint?: string,
	expandValueSet?: ExpandValueSet,
): CompletionSource {
	return async (cc: CompletionContext): Promise<CompletionResult | null> => {
		const ctx = buildJsonDocumentContext(cc.state.doc.toString(), cc.pos);
		return fhirComplete(ctx, getSDs, resourceTypeHint, expandValueSet, cc);
	};
}

// ── Validation ─────────────────────────────────────────────────────────

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
			if (el.type?.length === 1 && typeCode && isPrimitiveType(typeCode)) {
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
			const tree =
				ensureSyntaxTree(view.state, view.state.doc.length, 1000) ??
				syntaxTree(view.state);

			const { properties, emptyStrings } = walkJsonProperties(
				currentDoc,
				tree,
				resourceTypeHint ?? null,
			);

			if (!findRootJsonObject(currentDoc, tree)) {
				try {
					view.dispatch({ effects: setFhirDiagnosticsEffect.of([]) });
				} catch {
					/* view destroyed */
				}
				return;
			}

			if (properties.length === 0 && emptyStrings.length === 0) {
				try {
					view.dispatch({ effects: setFhirDiagnosticsEffect.of([]) });
				} catch {
					/* view destroyed */
				}
				return;
			}

			const rawDiags = await validateFhirProperties(properties, getSDs);
			if (destroyed) return;
			if (view.state.doc.toString() !== currentDoc) return;

			// for (const es of emptyStrings) {
			// 	rawDiags.push({
			// 		from: es.from,
			// 		to: es.to,
			// 		message: "Value must not be empty",
			// 	});
			// }

			const diags: FhirDiagnosticWithLine[] = rawDiags.map((d) => ({
				...d,
				line: view.state.doc.lineAt(d.from).number,
			}));

			try {
				view.dispatch({ effects: setFhirDiagnosticsEffect.of(diags) });
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

				const marks: { from: number; to: number; value: Decoration }[] = [];
				const lineDecos: { from: number; to: number; value: Decoration }[] = [];
				const gutter: { from: number; to: number; value: GutterMarker }[] = [];
				const messages = new Map<number, string>();

				for (const d of diags) {
					marks.push(fhirUnderline.range(d.from, d.to));
					const existing = messages.get(d.line);
					if (existing) {
						messages.set(d.line, `${existing}\n${d.message}`);
					} else {
						messages.set(d.line, d.message);
						const line = tr.state.doc.line(d.line);
						lineDecos.push(fhirErrorLineDecoration.range(line.from));
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

// ── Public API ─────────────────────────────────────────────────────────

export function buildFhirCompletionExtension(
	getSDs: GetStructureDefinitions,
	resourceTypeHint?: string,
	expandValueSet?: ExpandValueSet,
): Extension {
	const jsonSource = jsonCompletionSource(
		getSDs,
		resourceTypeHint,
		expandValueSet,
	);

	const autoTrigger = EditorView.updateListener.of((update) => {
		if (!update.docChanged) return;
		if (completionStatus(update.view.state)) return;
		const { state } = update.view;
		const pos = state.selection.main.head;
		const doc = state.doc.toString();
		const line = state.doc.lineAt(pos);
		const beforeCursor = line.text.slice(0, pos - line.from).trimStart();
		// Trigger on empty lines (including after snippet insertion),
		// after [ (array open), or after " (string value start)
		const shouldTrigger =
			beforeCursor === "" ||
			(pos > 0 && doc[pos - 1] === "[") ||
			(pos > 0 && doc[pos - 1] === '"' && pos > 1 && doc[pos - 2] !== "\\");
		if (!shouldTrigger) return;
		// Skip bulk replacements (e.g. tab switch, currentValue update)
		// but allow snippets — check only if the ENTIRE doc was replaced
		let totalInserted = 0;
		update.changes.iterChanges((_fA, _tA, _fB, _tB, ins) => {
			totalInserted += ins.length;
		});
		if (totalInserted > doc.length * 0.5) return;
		setTimeout(() => startCompletion(update.view), 0);
	});

	return [
		jsonLanguage.data.of({ autocomplete: jsonSource }),
		autoTrigger,
		fhirDiagnosticsField,
		fhirLinterTheme,
		buildFhirValidationPlugin(getSDs, resourceTypeHint),
	];
}
