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
	EditorSelection,
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
	requestFormat,
	walkJsonProperties,
} from "./json-ast";

// ── Types ──────────────────────────────────────────────────────────────

interface FhirElementType {
	code: string;
	profile?: string[];
	targetProfile?: string[];
}

interface FhirBinding {
	valueSet?: string;
	strength?: string;
}

interface FhirElement {
	path: string;
	short?: string;
	definition?: string;
	min?: number;
	max?: string;
	type?: FhirElementType[];
	binding?: FhirBinding;
	contentReference?: string;
	sliceName?: string;
	fixedUri?: string;
	fixedString?: string;
	fixedCode?: string;
	// Accepted, but not offered: FHIR-style keys in the Aidbox format
	hidden?: boolean;
	// An Aidbox format key (polymorphic value types, reference keys): no
	// `_name` primitive extension
	aidbox?: boolean;
}

interface StructureDefinition {
	type: string;
	url?: string;
	version?: string;
	name?: string;
	derivation?: string;
	baseDefinition?: string;
	context?: { expression: string; type: string }[];
	differential?: { element: FhirElement[] };
}

export interface StructureDefinitionSearchParams {
	type?: string;
	url?: string;
	version?: string;
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

export interface ExpandedCode {
	code: string;
	display?: string;
	system?: string;
}

export interface ValueSetExpansion {
	codes: ExpandedCode[];
	// Every code matching the filter is listed: the expansion was not cut
	complete: boolean;
}

// A plain list of codes is accepted too; its completeness is then unknown
export type ExpandValueSet = (
	url: string,
	filter: string,
) => Promise<ExpandedCode[] | ValueSetExpansion>;

// FHIR JSON, or the Aidbox format of the Aidbox API (paths without /fhir):
// polymorphic values as {"deceased": {"boolean": true}} and references as
// {"resourceType": "Patient", "id": "pt-1"}
export type ResourceFormat = "fhir" | "aidbox";

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

const CORE_SD_PREFIX = "http://hl7.org/fhir/StructureDefinition/";
const FHIRPATH_TYPE_PREFIX = "http://hl7.org/fhirpath/System.";

// StructureDefinition search returns one page: the counts must cover a whole
// registry, otherwise the entries past the page are silently missing.
const RESOURCE_TYPES_COUNT = "1000";
const EXTENSIONS_COUNT = "5000";
const PROFILES_COUNT = "1000";
// Versions of one canonical, or definitions of one type, to choose from
const VERSIONS_COUNT = "50";

const RESOURCE_TYPES_QUERY: StructureDefinitionSearchParams = {
	derivation: "specialization",
	kind: "resource",
	_elements: "type",
	_count: RESOURCE_TYPES_COUNT,
};

// Text of a value being typed: up to a quote, whitespace or JSON punctuation
const VALUE_WORD = /[^"\s,{}[\]]*/;
const VALUE_WORD_FULL = /^[^"\s,{}[\]]*$/;

// FHIRPath system types (Resource.id, Extension.url) are shown as FHIR primitives
function typeLabel(code: string): string {
	if (!code.startsWith(FHIRPATH_TYPE_PREFIX)) return code;
	const name = code.slice(FHIRPATH_TYPE_PREFIX.length);
	return name.charAt(0).toLowerCase() + name.slice(1);
}

function typesOf(element: FhirElement): string {
	return element.type?.map((t) => typeLabel(t.code)).join(" | ") ?? "";
}

function isExtensionKey(key: string | undefined): boolean {
	return key === "extension" || key === "modifierExtension";
}

function capitalize(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

// ── Cache ──────────────────────────────────────────────────────────────

// A failed or empty lookup expires, so a transient error (expired session,
// network glitch) or a package installed later does not disable completion
// until the page is reloaded.
const NEGATIVE_TTL_MS = 30_000;

interface CacheEntry<T> {
	value: T;
	expires: number;
}

const sdCache = new Map<string, CacheEntry<StructureDefinition | null>>();
const pendingRequests = new Map<string, Promise<StructureDefinition | null>>();
const listCache = new Map<string, CacheEntry<StructureDefinition[]>>();
const pendingListRequests = new Map<string, Promise<StructureDefinition[]>>();

const SD_ELEMENTS =
	"differential,type,name,baseDefinition,url,version,derivation,context";

function readCache<T>(
	cache: Map<string, CacheEntry<T>>,
	key: string,
): CacheEntry<T> | undefined {
	const entry = cache.get(key);
	if (entry && entry.expires <= Date.now()) {
		cache.delete(key);
		return undefined;
	}
	return entry;
}

function writeCache<T>(
	cache: Map<string, CacheEntry<T>>,
	key: string,
	value: T,
	found: boolean,
): void {
	cache.set(key, {
		value,
		expires: found ? Number.POSITIVE_INFINITY : Date.now() + NEGATIVE_TTL_MS,
	});
}

function cacheKey(params: StructureDefinitionSearchParams): string {
	return JSON.stringify(params);
}

async function getCachedSDList(
	params: StructureDefinitionSearchParams,
	getSDs: GetStructureDefinitions,
): Promise<StructureDefinition[]> {
	const key = cacheKey(params);
	const cached = readCache(listCache, key);
	if (cached) return cached.value;

	let pending = pendingListRequests.get(key);
	if (!pending) {
		pending = getSDs(params)
			.catch((): StructureDefinition[] => [])
			.then((list) => {
				writeCache(listCache, key, list, list.length > 0);
				pendingListRequests.delete(key);
				return list;
			});
		pendingListRequests.set(key, pending);
	}
	return pending;
}

function splitCanonical(ref: string): {
	url: string;
	version: string | undefined;
} {
	const bar = ref.indexOf("|");
	return bar === -1
		? { url: ref, version: undefined }
		: { url: ref.slice(0, bar), version: ref.slice(bar + 1) };
}

// Numeric-aware comparison of dotted versions: 10.0.0 > 9.1.0
function compareVersions(a = "", b = ""): number {
	const left = a.split(/[.-]/);
	const right = b.split(/[.-]/);
	for (let i = 0; i < Math.max(left.length, right.length); i++) {
		const x = left[i] ?? "";
		const y = right[i] ?? "";
		if (x === y) continue;
		const nx = Number(x);
		const ny = Number(y);
		if (x !== "" && y !== "" && !Number.isNaN(nx) && !Number.isNaN(ny)) {
			return nx - ny;
		}
		return x < y ? -1 : 1;
	}
	return 0;
}

// One canonical or type can match several definitions (package versions,
// custom types): take the requested version, then the preferred url, then
// the latest version.
function pickDefinition(
	list: StructureDefinition[],
	version?: string,
	preferredUrl?: string,
): StructureDefinition | null {
	if (version) {
		const exact = list.find((sd) => sd.version === version);
		if (exact) return exact;
	}
	const preferred = list.filter((sd) => sd.url === preferredUrl);
	let best: StructureDefinition | null = null;
	for (const sd of preferred.length > 0 ? preferred : list) {
		if (!best || compareVersions(sd.version, best.version) > 0) best = sd;
	}
	return best;
}

async function loadSD(
	ref: string,
	getSDs: GetStructureDefinitions,
): Promise<StructureDefinition | null> {
	if (ref.includes("/")) {
		const { url, version } = splitCanonical(ref);
		const search = (params: StructureDefinitionSearchParams) =>
			getSDs({
				url,
				...params,
				_elements: SD_ELEMENTS,
				_count: VERSIONS_COUNT,
			});
		// An unknown version falls back to the latest one
		const versioned = version ? await search({ version }) : [];
		return pickDefinition(
			versioned.length > 0 ? versioned : await search({}),
			version,
		);
	}

	const search = (params: StructureDefinitionSearchParams) =>
		getSDs({
			type: ref,
			...params,
			_elements: SD_ELEMENTS,
			_count: VERSIONS_COUNT,
		});
	const coreUrl = `${CORE_SD_PREFIX}${ref}`;
	const specialized = await search({ derivation: "specialization" });
	if (specialized.length > 0) {
		return pickDefinition(specialized, undefined, coreUrl);
	}
	return pickDefinition(
		await search({ "derivation:missing": "true" }),
		undefined,
		coreUrl,
	);
}

// A core type is the same definition by name and by url: cache it under both
function rememberAlias(ref: string, sd: StructureDefinition): void {
	const coreUrl = `${CORE_SD_PREFIX}${sd.type}`;
	if (sd.url !== coreUrl || ref.includes("|")) return;
	const alias = ref === coreUrl ? sd.type : coreUrl;
	if (!readCache(sdCache, alias)) writeCache(sdCache, alias, sd, true);
}

// `ref` is a type name or a canonical url, optionally with `|version`
async function getCachedSD(
	ref: string,
	getSDs: GetStructureDefinitions,
): Promise<StructureDefinition | null> {
	const cached = readCache(sdCache, ref);
	if (cached) return cached.value;

	let pending = pendingRequests.get(ref);
	if (!pending) {
		pending = loadSD(ref, getSDs)
			.catch(() => null)
			.then((sd) => {
				writeCache(sdCache, ref, sd, sd !== null);
				if (sd) rememberAlias(ref, sd);
				pendingRequests.delete(ref);
				return sd;
			});
		pendingRequests.set(ref, pending);
	}
	return pending;
}

// ── Element helpers ────────────────────────────────────────────────────

function fieldName(element: FhirElement): string {
	const parts = element.path.split(".");
	return (parts[parts.length - 1] ?? "").replace("[x]", "");
}

function isChildOf(element: FhirElement, parentPath: string): boolean {
	return (
		element.path.startsWith(`${parentPath}.`) &&
		!element.path.slice(parentPath.length + 1).includes(".")
	);
}

function directChildren(
	elements: FhirElement[],
	parentPath: string,
): FhirElement[] {
	const seen = new Set<string>();
	return elements.filter((el) => {
		// Slices repeat the path of the sliced element
		if (!isChildOf(el, parentPath) || seen.has(el.path)) return false;
		seen.add(el.path);
		return true;
	});
}

// Members every element has, which differentials do not repeat: id and
// extension, plus modifierExtension on backbone elements.
function universalElement(
	parentPath: string,
	key: string,
	isBackbone: boolean,
): FhirElement | undefined {
	const path = `${parentPath}.${key}`;
	if (key === "id")
		return { path, min: 0, max: "1", type: [{ code: "string" }] };
	if (key === "extension" || (key === "modifierExtension" && isBackbone)) {
		return { path, min: 0, max: "*", type: [{ code: "Extension" }] };
	}
	return undefined;
}

// Where the members of a JSON object are defined: children of `path`
interface PathCursor {
	path: string;
	elements: FhirElement[];
	// union: the type keys of an Aidbox polymorphic value
	kind: "resource" | "backbone" | "datatype" | "union";
}

// Child element named by a JSON key: a direct child (never a deeper element
// with the same name), a choice type variant, `_name` of a primitive, or a
// member every element has.
function findElement(cursor: PathCursor, key: string): FhirElement | undefined {
	const children = directChildren(cursor.elements, cursor.path);
	const lower = key.toLowerCase();
	const named =
		children.find((el) => fieldName(el) === key) ??
		children.find((el) => fieldName(el).toLowerCase() === lower);
	if (named) return named;

	for (const el of children) {
		if (!el.path.endsWith("[x]")) continue;
		const baseName = fieldName(el).toLowerCase();
		if (!lower.startsWith(baseName)) continue;
		const typeSuffix = lower.slice(baseName.length);
		const matchedType = el.type?.find(
			(t) => t.code.toLowerCase() === typeSuffix,
		);
		if (matchedType) {
			return {
				...el,
				path: el.path.replace("[x]", capitalize(matchedType.code)),
				type: [matchedType],
			};
		}
	}

	if (key.startsWith("_")) {
		const primitive = findElement(cursor, key.slice(1));
		const typeCode = primitive?.type?.[0]?.code;
		if (primitive && typeCode && isPrimitiveType(typeCode)) {
			return {
				path: `${cursor.path}.${key}`,
				max: primitive.max ?? "1",
				type: [{ code: "Element" }],
			};
		}
	}

	// Resources get id and extension from their base definitions
	if (cursor.kind === "resource" || cursor.kind === "union") return undefined;
	return universalElement(cursor.path, key, cursor.kind === "backbone");
}

// Type keys of an Aidbox polymorphic value, one per allowed type
function unionMembers(element: FhirElement, basePath: string): FhirElement[] {
	return (element.type ?? []).map((type) => ({
		path: `${basePath}.${type.code}`,
		min: 0,
		max: "1",
		type: [type],
		aidbox: true,
		...(element.short ? { short: element.short } : {}),
		...(element.binding ? { binding: element.binding } : {}),
	}));
}

// Aidbox references: {resourceType, id}, {localRef} for contained resources,
// {uri} for absolute ones; `reference` is still accepted
const AIDBOX_REFERENCE_MEMBERS: FhirElement[] = [
	{
		path: "Reference.resourceType",
		min: 0,
		max: "1",
		type: [{ code: "code" }],
		short: "Type of the referenced resource",
		aidbox: true,
	},
	{
		path: "Reference.localRef",
		min: 0,
		max: "1",
		type: [{ code: "string" }],
		short: "Id of a contained resource",
		aidbox: true,
	},
	{
		path: "Reference.uri",
		min: 0,
		max: "1",
		type: [{ code: "uri" }],
		short: "Absolute URL of the referenced resource",
		aidbox: true,
	},
];

// Set by the server in the Aidbox format; accepted, not offered
const AIDBOX_META_CREATED_AT: FhirElement = {
	path: "Meta.createdAt",
	min: 0,
	max: "1",
	type: [{ code: "instant" }],
	hidden: true,
	aidbox: true,
};

// Elements of a datatype in the Aidbox format
function aidboxTypeElements(
	typeCode: string,
	elements: FhirElement[],
): FhirElement[] {
	if (typeCode === "Meta") return [...elements, AIDBOX_META_CREATED_AT];
	if (typeCode !== "Reference") return elements;
	return [
		...AIDBOX_REFERENCE_MEMBERS,
		...elements.map((el) => {
			if (el.path === "Reference.reference") return { ...el, hidden: true };
			if (el.path === "Reference.id") {
				return { ...el, short: "Id of the referenced resource" };
			}
			return el;
		}),
	];
}

// ── Resolve completions at path ────────────────────────────────────────

const elementsCache = new Map<
	string,
	{ elements: FhirElement[]; basePath: string }
>();

// Elements of a type, including the ones inherited through baseDefinition
async function collectAllElements(
	type: string,
	getSDs: GetStructureDefinitions,
): Promise<{ elements: FhirElement[]; basePath: string } | null> {
	const memo = elementsCache.get(type);
	if (memo) return memo;

	const sd = await getCachedSD(type, getSDs);
	if (!sd?.differential?.element) return null;

	const elements = [...sd.differential.element];
	const paths = new Set(elements.map((el) => el.path));
	const visited = new Set<string>();
	let complete = true;
	let base = sd.baseDefinition;
	while (base && !visited.has(base)) {
		visited.add(base);
		const baseSD = await getCachedSD(base, getSDs);
		if (!baseSD?.differential?.element) {
			complete = false;
			break;
		}
		for (const el of baseSD.differential.element) {
			if (el.path !== baseSD.type && !el.path.startsWith(`${baseSD.type}.`)) {
				continue;
			}
			const path = sd.type + el.path.slice(baseSD.type.length);
			if (paths.has(path)) continue;
			paths.add(path);
			elements.push({ ...el, path });
		}
		base = baseSD.baseDefinition;
	}

	const result = { elements, basePath: sd.type };
	// A chain broken by a failed lookup is rebuilt once the lookup expires
	if (complete) elementsCache.set(type, result);
	return result;
}

async function rootCursor(
	resourceType: string,
	getSDs: GetStructureDefinitions,
): Promise<PathCursor | null> {
	const result = await collectAllElements(resourceType, getSDs);
	return result
		? { path: result.basePath, elements: result.elements, kind: "resource" }
		: null;
}

// Cursor for the members of `element`'s value
async function enterElement(
	cursor: PathCursor,
	element: FhirElement,
	getSDs: GetStructureDefinitions,
	format: ResourceFormat = "fhir",
): Promise<PathCursor | null> {
	if (format === "aidbox" && element.path.endsWith("[x]")) {
		const basePath = element.path.slice(0, -"[x]".length);
		return {
			path: basePath,
			elements: unionMembers(element, basePath),
			kind: "union",
		};
	}
	if (element.contentReference) {
		const ref = element.contentReference;
		return {
			path: ref.slice(ref.indexOf("#") + 1),
			elements: cursor.elements,
			kind: "backbone",
		};
	}
	const typeCode = element.type?.[0]?.code;
	if (!typeCode) return null;

	// Backbone elements, and inline elements such as Timing.repeat, define
	// their children in place
	const inline = cursor.elements.some((el) =>
		el.path.startsWith(`${element.path}.`),
	);
	if (typeCode === "BackboneElement" || inline) {
		return {
			path: element.path,
			elements: cursor.elements,
			kind: typeCode === "BackboneElement" ? "backbone" : "datatype",
		};
	}

	const typeResult = await collectAllElements(typeCode, getSDs);
	if (!typeResult) return null;
	return {
		path: typeResult.basePath,
		elements:
			format === "aidbox"
				? aidboxTypeElements(typeCode, typeResult.elements)
				: typeResult.elements,
		kind: typeCode === "Resource" ? "resource" : "datatype",
	};
}

interface PathWalk {
	// Members of the value at the end of the path; null when it has none
	cursor: PathCursor | null;
	// Element at the end of the path; null for the resource itself
	element: FhirElement | null;
	// The path with FHIR keys: Aidbox ["value", "Quantity"] is ["valueQuantity"]
	fhirPath: string[];
}

// Follow a JSON path from the resource root; null when a key is unknown
async function walkPath(
	path: string[],
	resourceType: string,
	getSDs: GetStructureDefinitions,
	format: ResourceFormat = "fhir",
): Promise<PathWalk | null> {
	let cursor = await rootCursor(resourceType, getSDs);
	let element: FhirElement | null = null;
	const fhirPath: string[] = [];
	for (const key of path) {
		if (!cursor) return null;
		const el = findElement(cursor, key);
		if (!el) return null;
		if (cursor.kind === "union") {
			fhirPath.push(`${fhirPath.pop() ?? ""}${capitalize(key)}`);
		} else {
			fhirPath.push(key);
		}
		element = el;
		cursor = await enterElement(cursor, el, getSDs, format);
	}
	return { cursor, element, fhirPath };
}

async function resolveElements(
	path: string[],
	resourceType: string,
	getSDs: GetStructureDefinitions,
	format: ResourceFormat = "fhir",
): Promise<FhirElement[]> {
	const cursor = (await walkPath(path, resourceType, getSDs, format))?.cursor;
	if (!cursor) return [];

	const expanded: FhirElement[] = [];
	for (const el of directChildren(cursor.elements, cursor.path)) {
		const isChoiceType = el.path.endsWith("[x]");
		if (isChoiceType && el.type && el.type.length > 0) {
			// Aidbox: one key holding the typed value ({"deceased": {"boolean": ...}});
			// the FHIR keys (deceasedBoolean) are accepted as well
			if (format === "aidbox") expanded.push(el);
			for (const t of el.type) {
				expanded.push({
					...el,
					path: el.path.replace("[x]", capitalize(t.code)),
					type: [t],
					...(format === "aidbox" ? { hidden: true } : {}),
				});
			}
		} else {
			expanded.push(el);
		}
	}

	// Differentials do not repeat the id/extension/modifierExtension inherited
	// by backbone elements and datatypes. Resources declare them through their
	// base definitions (Bundle and Parameters have no extension).
	if (cursor.kind === "backbone" || cursor.kind === "datatype") {
		appendUniversalElements(expanded, cursor.path, cursor.kind === "backbone");
	}

	return expanded;
}

function appendUniversalElements(
	elements: FhirElement[],
	basePath: string,
	isBackbone: boolean,
): void {
	const present = new Set(elements.map((el) => fieldName(el)));
	for (const key of ["id", "extension", "modifierExtension"]) {
		if (present.has(key)) continue;
		const el = universalElement(basePath, key, isBackbone);
		if (el) elements.push(el);
	}
}

// Index of the first path segment holding a resource (contained,
// Bundle.entry.resource, Parameters.parameter.resource)
async function findResourceBoundary(
	path: string[],
	resourceType: string,
	getSDs: GetStructureDefinitions,
	format: ResourceFormat = "fhir",
): Promise<number | null> {
	let cursor = await rootCursor(resourceType, getSDs);
	for (const [index, key] of path.entries()) {
		if (!cursor) return null;
		const el = findElement(cursor, key);
		if (!el) return null;
		if (el.type?.some((t) => t.code === "Resource")) return index;
		cursor = await enterElement(cursor, el, getSDs, format);
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
	| "bare"
	// Aidbox format: {"deceased": {}} holding a type key
	| "union"
	// Aidbox format: references starting with {"resourceType": ""}
	| "reference"
	| "array-reference";

function snippetKind(element: FhirElement): SnippetKind {
	// A choice element by its own name exists only in the Aidbox format
	if (element.path.endsWith("[x]")) return "union";
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
		case "object":
		case "union": {
			const text = `"${name}": {\n${inner}\n${indent}}`;
			return { text, cursorOffset: text.indexOf(`${inner}\n`) + inner.length };
		}
		case "reference": {
			const text = `"${name}": {\n${inner}"resourceType": ""\n${indent}}`;
			return { text, cursorOffset: text.lastIndexOf('""') + 1 };
		}
		case "array-reference": {
			const text = `"${name}": [\n${inner}{\n${innerInner}"resourceType": ""\n${inner}}\n${indent}]`;
			return { text, cursorOffset: text.lastIndexOf('""') + 1 };
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

// Snippets that leave the cursor where a value is expected keep completing
function continuesCompletion(kind: SnippetKind): boolean {
	return (
		kind === "string" ||
		kind === "number" ||
		kind === "array-primitive" ||
		kind === "array-extension" ||
		kind === "union" ||
		kind === "reference" ||
		kind === "array-reference"
	);
}

function memberKind(element: FhirElement, format: ResourceFormat): SnippetKind {
	const [type, ...others] = element.type ?? [];
	if (
		format === "aidbox" &&
		type?.code === "Reference" &&
		others.length === 0
	) {
		return element.max === "*" ? "array-reference" : "reference";
	}
	return snippetKind(element);
}

function lineIndent(view: EditorView, pos: number): string {
	return view.state.doc.lineAt(pos).text.match(/^(\s*)/)?.[1] ?? "";
}

const REVEAL_MARGIN_LINES = 3;

// Scroll an inserted text into view: the cursor and the end of the insertion
// stay visible with a few lines of room around them, not at the very edge.
// A scroll effect sent with the edit itself is clipped to the old document,
// so it goes in a transaction of its own.
function revealInsertion(view: EditorView, cursor: number, end: number): void {
	view.dispatch({
		effects: EditorView.scrollIntoView(
			EditorSelection.range(Math.max(cursor, end), cursor),
			{ y: "nearest", yMargin: view.defaultLineHeight * REVEAL_MARGIN_LINES },
		),
	});
}

// Insert an object member or array item at [from, to), adding the commas that
// separate it from the previous and the next entry.
function insertEntry(
	view: EditorView,
	from: number,
	to: number,
	text: string,
	cursorOffset: number,
): void {
	const doc = view.state.doc.toString();
	let prev = from - 1;
	while (prev >= 0 && /\s/.test(doc[prev] ?? "")) prev--;
	const prevChar = doc[prev];
	const commaBefore = prevChar !== undefined && !"{[,".includes(prevChar);
	const commaAfter = /^\s*["{[]/.test(doc.slice(to));
	const insert = commaAfter ? `${text},` : text;
	const changes = [{ from, to, insert }];
	if (commaBefore)
		changes.unshift({ from: prev + 1, to: prev + 1, insert: "," });
	const start = from + (commaBefore ? 1 : 0);
	const anchor = start + cursorOffset;
	view.dispatch({
		changes,
		selection: { anchor },
	});
	revealInsertion(view, anchor, start + insert.length);
}

// Complete a property name: rename the key when it already has a value,
// otherwise insert the snippet. Returns whether a snippet was inserted.
function applyProperty(
	view: EditorView,
	from: number,
	to: number,
	name: string,
	snippet: (indent: string) => { text: string; cursorOffset: number },
): boolean {
	const doc = view.state.doc.toString();
	let actualFrom = from;
	let actualTo = to;
	if (actualFrom > 0 && doc[actualFrom - 1] === '"') actualFrom--;
	if (actualTo < doc.length && doc[actualTo] === '"') actualTo++;

	if (/^\s*:/.test(doc.slice(actualTo))) {
		const insert = `"${name}"`;
		const anchor = actualFrom + insert.length;
		view.dispatch({
			changes: { from: actualFrom, to: actualTo, insert },
			selection: { anchor },
		});
		revealInsertion(view, anchor, anchor);
		return false;
	}

	const { text, cursorOffset } = snippet(lineIndent(view, actualFrom));
	insertEntry(view, actualFrom, actualTo, text, cursorOffset);
	return true;
}

// Insert a string value at [from, to), adding the quotes not typed yet.
// `keepOpen` leaves the cursor inside the string (to type a reference id).
function insertStringValue(
	view: EditorView,
	from: number,
	to: number,
	value: string,
	keepOpen = false,
): void {
	const doc = view.state.doc.toString();
	const opened = doc[from - 1] === '"';
	const closed = doc[to] === '"';
	const insert = `${opened ? "" : '"'}${value}${closed ? "" : '"'}`;
	const valueEnd = from + insert.length - (closed ? 0 : 1);
	const anchor = keepOpen ? valueEnd : valueEnd + 1;
	view.dispatch({
		changes: { from, to, insert },
		selection: { anchor },
	});
	revealInsertion(view, anchor, anchor);
}

// Insert a JSON literal (boolean, number), dropping quotes typed around it
function insertLiteral(
	view: EditorView,
	from: number,
	to: number,
	value: string,
): void {
	const doc = view.state.doc.toString();
	const start = from > 0 && doc[from - 1] === '"' ? from - 1 : from;
	const end = to < doc.length && doc[to] === '"' ? to + 1 : to;
	const anchor = start + value.length;
	view.dispatch({
		changes: { from: start, to: end, insert: value },
		selection: { anchor },
	});
	revealInsertion(view, anchor, anchor);
}

// After a url or name is chosen, add the next member when the completed one is
// the last member of its object, and keep completing inside it.
function appendMember(
	view: EditorView,
	snippet: (indent: string) => { text: string; cursorOffset: number },
): void {
	const head = view.state.selection.main.head;
	if (!/^\s*\n\s*\}/.test(view.state.doc.sliceString(head))) return;
	const indent = lineIndent(view, head);
	const { text, cursorOffset } = snippet(indent);
	const insert = `,\n${indent}${text}`;
	const anchor = head + 2 + indent.length + cursorOffset;
	view.dispatch({
		changes: { from: head, insert },
		selection: { anchor },
	});
	revealInsertion(view, anchor, head + insert.length);
	setTimeout(() => startCompletion(view), 0);
}

function valueSnippetKind(type: string): SnippetKind {
	if (FHIR_NUMBER_TYPES.has(type)) return "number";
	return isPrimitiveType(type) ? "string" : "object";
}

// `value[x]` of a single type: "valueString" in FHIR, {"value": {"string":
// ...}} in the Aidbox format
function valueMemberSnippet(
	type: string,
	indent: string,
	format: ResourceFormat,
): { text: string; cursorOffset: number } {
	if (format === "fhir") {
		return buildSnippet(
			`value${capitalize(type)}`,
			valueSnippetKind(type),
			indent,
		);
	}
	const inner = `${indent}  `;
	const member = buildSnippet(type, valueSnippetKind(type), inner);
	const head = `"value": {\n${inner}`;
	return {
		text: `${head}${member.text}\n${indent}}`,
		cursorOffset: head.length + member.cursorOffset,
	};
}

// `value[x]` member of an extension or parameter allowing a single type
function appendValueMember(
	view: EditorView,
	valueTypes: string[],
	format: ResourceFormat = "fhir",
): void {
	const [type] = valueTypes;
	if (valueTypes.length !== 1 || !type) return;
	appendMember(view, (indent) => valueMemberSnippet(type, indent, format));
}

function appendNestedExtensions(view: EditorView): void {
	appendMember(view, (indent) => {
		const inner = `${indent}  `;
		const text = `"extension": [\n${inner}{\n${inner}  "url": ""\n${inner}}\n${indent}]`;
		return { text, cursorOffset: text.lastIndexOf('""') + 1 };
	});
}

function toCompletion(
	element: FhirElement,
	format: ResourceFormat = "fhir",
): Completion {
	const name = fieldName(element);
	const kind = memberKind(element, format);

	const completion: Completion = {
		label: name,
		type: "property",
		detail: typesOf(element),
		boost: element.min && element.min > 0 ? 2 : 0,
		apply: (view, _completion, from, to) => {
			const inserted = applyProperty(view, from, to, name, (indent) =>
				buildSnippet(name, kind, indent),
			);
			if (inserted && continuesCompletion(kind)) {
				setTimeout(() => startCompletion(view), 0);
			}
		},
	};
	if (element.short) completion.info = element.short;
	return completion;
}

function toParameterPropertyCompletion(
	element: FhirElement,
	format: ResourceFormat = "fhir",
): Completion {
	const name = fieldName(element);
	if (name !== "parameter" && name !== "part") {
		return toCompletion(element, format);
	}

	const completion: Completion = {
		label: name,
		type: "property",
		detail: typesOf(element),
		boost: element.min && element.min > 0 ? 2 : 0,
		apply: (view, _completion, from, to) => {
			const inserted = applyProperty(view, from, to, name, (indent) => {
				const inner = `${indent}  `;
				const innerInner = `${inner}  `;
				const text = `"${name}": [\n${inner}{\n${innerInner}"name": ""\n${inner}}\n${indent}]`;
				return { text, cursorOffset: text.lastIndexOf('""') + 1 };
			});
			if (inserted) setTimeout(() => startCompletion(view), 0);
		},
	};
	if (element.short) completion.info = element.short;
	return completion;
}

// `_name`: id and extensions of a primitive value (one per item of a list)
function toPrimitiveExtensionCompletion(element: FhirElement): Completion {
	const parentPath = element.path.slice(0, element.path.lastIndexOf("."));
	const completion = toCompletion({
		path: `${parentPath}._${fieldName(element)}`,
		max: element.max ?? "1",
		type: [{ code: "Element" }],
	});
	completion.detail = "Element";
	completion.boost = -1;
	completion.info = "Primitive element extension";
	return completion;
}

function elementsToCompletions(
	elements: FhirElement[],
	mapFn: (el: FhirElement) => Completion,
): Completion[] {
	const completions: Completion[] = [];
	for (const el of elements) {
		completions.push(mapFn(el));
		const firstTypeCode = el.type?.[0]?.code;
		if (
			!el.aidbox &&
			el.type?.length === 1 &&
			firstTypeCode &&
			PRIMITIVE_TYPES.has(firstTypeCode)
		) {
			completions.push(toPrimitiveExtensionCompletion(el));
		}
	}
	return completions;
}

// A new object starting with the member `element`: an array item (separated
// from its neighbours by commas) or the resource of an empty document
function toObjectCompletion(
	element: FhirElement,
	separated: boolean,
	format: ResourceFormat = "fhir",
): Completion {
	const name = fieldName(element);
	const kind = memberKind(element, format);

	const completion: Completion = {
		label: name,
		type: "property",
		detail: typesOf(element),
		boost: element.min && element.min > 0 ? 2 : 0,
		apply: (view, _completion, from, to) => {
			const doc = view.state.doc.toString();
			const start = from > 0 && doc[from - 1] === '"' ? from - 1 : from;
			const end = to < doc.length && doc[to] === '"' ? to + 1 : to;
			const indent = lineIndent(view, start);
			const inner = `${indent}  `;
			const member = buildSnippet(name, kind, inner);
			const text = `{\n${inner}${member.text}\n${indent}}`;
			const cursorOffset = 2 + inner.length + member.cursorOffset;
			if (separated) {
				insertEntry(view, start, end, text, cursorOffset);
			} else {
				view.dispatch({
					changes: { from: start, to: end, insert: text },
					selection: { anchor: start + cursorOffset },
				});
				revealInsertion(view, start + cursorOffset, start + text.length);
			}
			if (continuesCompletion(kind)) setTimeout(() => startCompletion(view), 0);
		},
	};
	if (element.short) completion.info = element.short;
	return completion;
}

// ── Extension helpers ──────────────────────────────────────────────────

// `<base>.value[x]`, or its type-specific form (`Extension.valueCode`)
function isValuePath(path: string, base: string): boolean {
	const prefix = `${base}.value`;
	if (!path.startsWith(prefix)) return false;
	const suffix = path.slice(prefix.length);
	return suffix === "[x]" || /^[A-Z][A-Za-z0-9]*$/.test(suffix);
}

// Types a value element allows; a type-specific path names the type itself
function valueTypesOf(element: FhirElement, base: string): string[] {
	const declared = element.type?.map((t) => t.code) ?? [];
	if (declared.length > 0) return declared;
	const suffix = element.path.slice(`${base}.value`.length);
	if (suffix === "[x]" || suffix === "") return [];
	const primitive = suffix.charAt(0).toLowerCase() + suffix.slice(1);
	return [PRIMITIVE_TYPES.has(primitive) ? primitive : suffix];
}

interface ExtensionSlice {
	sliceName: string;
	url: string;
	short?: string | undefined;
	valueTypes: string[];
	binding?: FhirBinding | undefined;
}

interface ExtensionInfo {
	isNested: boolean;
	valueTypes: string[];
	binding?: FhirBinding | undefined;
	slices: ExtensionSlice[];
}

// Sub-extensions of a complex extension, each with its url and value
function extensionSlices(elements: FhirElement[]): ExtensionSlice[] {
	const slices: ExtensionSlice[] = [];
	let current: ExtensionSlice | null = null;
	for (const el of elements) {
		if (el.path === "Extension.extension" && el.sliceName) {
			current = {
				sliceName: el.sliceName,
				url: el.sliceName,
				short: el.short,
				valueTypes: [],
			};
			slices.push(current);
		} else if (!current || !el.path.startsWith("Extension.extension.")) {
			current = null;
		} else if (el.path === "Extension.extension.url" && el.fixedUri) {
			current.url = el.fixedUri;
		} else if (isValuePath(el.path, "Extension.extension")) {
			current.valueTypes = valueTypesOf(el, "Extension.extension");
			if (el.binding?.valueSet) current.binding = el.binding;
		}
	}
	return slices;
}

function analyzeExtensionSD(sd: StructureDefinition): ExtensionInfo | null {
	const elements = sd.differential?.element;
	if (!elements) return null;
	const valueEl = elements.find((e) => isValuePath(e.path, "Extension"));
	const isNested = valueEl?.max === "0";
	return {
		isNested,
		valueTypes: isNested || !valueEl ? [] : valueTypesOf(valueEl, "Extension"),
		binding: isNested ? undefined : valueEl?.binding,
		slices: extensionSlices(elements),
	};
}

// Url of the complex extension whose `extension` list holds the object at the
// cursor, when that object is a sub-extension
function parentExtensionUrl(ctx: DocumentContext): string | null {
	const path = ctx.fullPath;
	if (!isExtensionKey(path[path.length - 1])) return null;
	if (!isExtensionKey(path[path.length - 2])) return null;
	const url = ctx.getScope(1).getString("url");
	return url?.includes("/") ? url : null;
}

// ── Profile helpers ────────────────────────────────────────────────────

// Profiles from meta.profile, followed by the profiles they constrain
async function loadProfiles(
	profileUrls: string[],
	getSDs: GetStructureDefinitions,
): Promise<StructureDefinition[]> {
	const profiles: StructureDefinition[] = [];
	const visited = new Set<string>();
	for (const url of profileUrls) {
		let ref: string | undefined = url;
		let isBase = false;
		while (ref && !visited.has(ref)) {
			visited.add(ref);
			const sd = await getCachedSD(ref, getSDs);
			if (!sd?.differential?.element) break;
			if (isBase && sd.derivation !== "constraint") break;
			profiles.push(sd);
			isBase = true;
			ref = sd.derivation === "constraint" ? sd.baseDefinition : undefined;
		}
	}
	return profiles;
}

// Element path segment against a JSON key: `value[x]` matches `valueQuantity`
function segmentMatches(segment: string, key: string): boolean {
	if (segment === key) return true;
	if (!segment.endsWith("[x]")) return false;
	const base = segment.slice(0, -3);
	return key.length > base.length && key.startsWith(base);
}

// Element path (with its root type) against a JSON path below the resource
function matchesPath(elementPath: string, path: string[]): boolean {
	const segments = elementPath.split(".").slice(1);
	return (
		segments.length === path.length &&
		segments.every((segment, i) => segmentMatches(segment, path[i] ?? ""))
	);
}

interface ProfileValue {
	value: string;
	literal: boolean;
}

function constrainedValue(element: FhirElement): unknown {
	for (const [key, value] of Object.entries(element)) {
		if (/^(fixed|pattern)[A-Z]/.test(key)) return value;
	}
	return undefined;
}

function collectValues(
	value: unknown,
	path: string[],
	out: ProfileValue[],
): void {
	if (Array.isArray(value)) {
		for (const item of value) collectValues(item, path, out);
		return;
	}
	const [key, ...rest] = path;
	if (key === undefined) {
		if (typeof value === "string") out.push({ value, literal: false });
		else if (typeof value === "number" || typeof value === "boolean") {
			out.push({ value: String(value), literal: true });
		}
		return;
	}
	if (value && typeof value === "object") {
		collectValues((value as Record<string, unknown>)[key], rest, out);
	}
}

// Values profiles fix for `path.valueKey`: fixed[x] or pattern[x] on the
// element itself or on an ancestor (patternCodeableConcept → coding.code)
function profileValues(
	path: string[],
	valueKey: string,
	profiles: StructureDefinition[],
): ProfileValue[] {
	const target = [...path, valueKey];
	const values: ProfileValue[] = [];
	for (const sd of profiles) {
		for (const el of sd.differential?.element ?? []) {
			const depth = el.path.split(".").length - 1;
			if (depth === 0 || depth > target.length) continue;
			if (!matchesPath(el.path, target.slice(0, depth))) continue;
			const value = constrainedValue(el);
			if (value !== undefined)
				collectValues(value, target.slice(depth), values);
		}
	}
	const seen = new Set<string>();
	return values.filter(({ value }) => {
		if (seen.has(value)) return false;
		seen.add(value);
		return true;
	});
}

// ── Parameters slice helpers ────────────────────────────────────────────

const parametersTypeCache = new Map<string, boolean>();

async function isParametersType(
	resourceType: string,
	getSDs: GetStructureDefinitions,
): Promise<boolean> {
	if (resourceType === "Parameters") return true;
	const cached = parametersTypeCache.get(resourceType);
	if (cached !== undefined) return cached;

	let sd = await getCachedSD(resourceType, getSDs);
	const visited = new Set<string>();
	while (sd?.baseDefinition && !visited.has(sd.baseDefinition)) {
		const base: string = sd.baseDefinition;
		visited.add(base);
		if (splitCanonical(base).url.split("/").pop() === "Parameters") {
			parametersTypeCache.set(resourceType, true);
			return true;
		}
		sd = await getCachedSD(base, getSDs);
	}
	// A failed lookup is not remembered: it may succeed later
	if (sd) parametersTypeCache.set(resourceType, false);
	return false;
}

interface ParameterSlice {
	sliceName: string;
	fixedName: string;
	min: number;
	max: string;
	valueTypes: string[];
	short?: string;
}

function getParameterSlices(profiles: StructureDefinition[]): ParameterSlice[] {
	const slices: ParameterSlice[] = [];
	const names = new Set<string>();

	for (const sd of profiles) {
		const elements = sd.differential?.element;
		if (!elements) continue;

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
			// A derived profile comes first and overrides the slices it redefines
			if (current?.fixedName && !names.has(current.fixedName)) {
				names.add(current.fixedName);
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
			if (isValuePath(el.path, paramPath)) {
				current.valueTypes = valueTypesOf(el, paramPath);
			}
		}

		flush();
	}

	return slices;
}

/** @internal — exported for tests only */
export function buildParameterSnippet(
	name: string,
	valueTypes: string[],
	indent: string,
	format: ResourceFormat = "fhir",
): { text: string; cursorOffset: number } {
	const inner = `${indent}  `;
	const [type] = valueTypes;
	// Default to valueString when no value type constraint
	const valueType = valueTypes.length === 1 && type ? type : "string";
	const head = `{\n${inner}"name": "${name}",\n${inner}`;
	const value = valueMemberSnippet(valueType, inner, format);
	const text = `${head}${value.text}\n${indent}}`;
	if (name === "") {
		// Generic template: cursor in name
		return { text, cursorOffset: text.indexOf('""') + 1 };
	}
	return { text, cursorOffset: head.length + value.cursorOffset };
}

// ── Binding & Reference Resolution ─────────────────────────────────────

function findProfileBinding(
	profiles: StructureDefinition[],
	path: string[],
	valueKey: string,
): FhirBinding | null {
	const targets = [[...path, valueKey]];
	// A code inherits the binding of its Coding / CodeableConcept
	if (valueKey === "code") {
		for (let i = path.length; i > 0; i--) targets.push(path.slice(0, i));
	}
	for (const sd of profiles) {
		const elements = sd.differential?.element ?? [];
		for (const target of targets) {
			const el = elements.find(
				(e) => e.binding?.valueSet && matchesPath(e.path, target),
			);
			if (el?.binding) return el.binding;
		}
	}
	return null;
}

// Binding of an extension value. The url of the nearest enclosing extension
// identifies the extension; a url without "/" is a sub-extension of the
// complex extension around it.
async function findExtensionBinding(
	ctx: DocumentContext,
	valueKey: string,
	getSDs: GetStructureDefinitions,
): Promise<FhirBinding | null> {
	const path = ctx.fullPath;
	let index = path.length - 1;
	while (index >= 0 && !isExtensionKey(path[index])) index--;
	if (index < 0) return null;

	// Only the value itself, or the code of a coded value
	const inner = path.slice(index + 1);
	const valueName = inner[0] ?? valueKey;
	if (!valueName.startsWith("value")) return null;
	if (inner.length > 0 && valueKey !== "code") return null;

	const level = path.length - 1 - index;
	const url = ctx.getScope(level).getString("url");
	if (!url) return null;

	if (url.includes("/")) {
		const sd = await getCachedSD(url, getSDs);
		return (sd && analyzeExtensionSD(sd)?.binding) || null;
	}

	const parentUrl = ctx.getScope(level + 1).getString("url");
	if (!parentUrl?.includes("/")) return null;
	const parent = await getCachedSD(parentUrl, getSDs);
	const slice = extensionSlices(parent?.differential?.element ?? []).find(
		(s) => s.url === url || s.sliceName === url,
	);
	return slice?.binding ?? null;
}

// A JSON path written with FHIR keys, as profiles name elements: the Aidbox
// ["value", "Quantity", "code"] is ["valueQuantity", "code"]
async function fhirKeys(
	path: string[],
	resourceType: string,
	getSDs: GetStructureDefinitions,
	format: ResourceFormat,
): Promise<string[]> {
	if (format === "fhir") return path;
	return (await walkPath(path, resourceType, getSDs, format))?.fhirPath ?? path;
}

async function findBindingForValue(
	path: string[],
	valueKey: string,
	resourceType: string,
	getSDs: GetStructureDefinitions,
	profiles: StructureDefinition[] = [],
	ctx?: DocumentContext,
	format: ResourceFormat = "fhir",
): Promise<FhirBinding | null> {
	if (ctx && path.some(isExtensionKey)) {
		const extBinding = await findExtensionBinding(ctx, valueKey, getSDs);
		if (extBinding?.valueSet) return extBinding;
	}

	if (profiles.length > 0) {
		const keys = await fhirKeys(
			[...path, valueKey],
			resourceType,
			getSDs,
			format,
		);
		const profileBinding = findProfileBinding(
			profiles,
			keys.slice(0, -1),
			keys[keys.length - 1] ?? valueKey,
		);
		if (profileBinding) return profileBinding;
	}

	const elements = await resolveElements(path, resourceType, getSDs, format);
	const own = elements.find(
		(el) => fieldName(el) === valueKey && el.binding?.valueSet,
	);
	if (own?.binding) return own.binding;

	if (valueKey === "code") {
		for (let i = path.length; i > 0; i--) {
			const parentElements = await resolveElements(
				path.slice(0, i - 1),
				resourceType,
				getSDs,
				format,
			);
			const parent = parentElements.find(
				(el) => fieldName(el) === path[i - 1] && el.binding?.valueSet,
			);
			if (parent?.binding) return parent.binding;
		}
	}

	return null;
}

async function findCanonicalTargetType(
	path: string[],
	arrayKey: string,
	resourceType: string,
	getSDs: GetStructureDefinitions,
	format: ResourceFormat = "fhir",
): Promise<string | null> {
	const elements = await resolveElements(path, resourceType, getSDs, format);
	for (const el of elements) {
		if (fieldName(el) !== arrayKey) continue;
		if (el.max !== "*") continue;
		const t = el.type?.[0];
		if (t?.code !== "canonical" || !t.targetProfile?.length) continue;
		return t.targetProfile[0]?.split("/").pop() ?? null;
	}
	return null;
}

async function getResourceTypes(
	getSDs: GetStructureDefinitions,
): Promise<string[]> {
	const list = await getCachedSDList(RESOURCE_TYPES_QUERY, getSDs);
	// A custom type can be defined by several packages or versions
	return [...new Set(list.map((sd) => sd.type))];
}

async function resolveReferenceTargets(
	path: string[],
	resourceType: string,
	getSDs: GetStructureDefinitions,
	format: ResourceFormat = "fhir",
): Promise<string[] | null> {
	const element = (await walkPath(path, resourceType, getSDs, format))?.element;
	if (!element?.type) return null;

	const targets = new Set<string>();
	let anyResource = false;
	for (const t of element.type) {
		if (t.code !== "Reference") continue;
		if (!t.targetProfile?.length) anyResource = true;
		for (const profile of t.targetProfile ?? []) {
			const rt = splitCanonical(profile).url.split("/").pop();
			// Reference(Any) targets Resource
			if (rt === "Resource" || rt === "DomainResource") anyResource = true;
			else if (rt) targets.add(rt);
		}
	}
	if (anyResource) {
		for (const rt of await getResourceTypes(getSDs)) targets.add(rt);
	}
	return targets.size > 0 ? [...targets] : null;
}

// ── Unified completion handler ─────────────────────────────────────────

async function fhirComplete(
	ctx: DocumentContext,
	getSDs: GetStructureDefinitions,
	resourceTypeHint: string | undefined,
	expandValueSet: ExpandValueSet | undefined,
	completionContext: CompletionContext,
	defaultFormat: ResourceFormat,
): Promise<CompletionResult | null> {
	const { pos, doc } = ctx;
	// The request path of an HTTP document tells the format
	const format = requestFormat(doc) ?? defaultFormat;

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
	let profileUrls = rtScope.getStringArray("meta", "profile");

	// Descend into nested resources (contained, Bundle.entry.resource), level
	// by level: a contained resource of a Bundle entry is two levels deep
	while (resourceType && effectivePath.length > 0) {
		const boundaryIdx = await findResourceBoundary(
			effectivePath,
			resourceType,
			getSDs,
			format,
		);
		if (boundaryIdx === null) break;
		const innerPath = effectivePath.slice(boundaryIdx + 1);
		const innerScope = ctx.getScope(innerPath.length);
		const innerRT = innerScope.getString("resourceType");
		effectivePath = innerPath;
		resourceType = innerRT ?? "DomainResource";
		hasExplicitResourceType = innerRT !== null;
		profileUrls = innerScope.getStringArray("meta", "profile");
	}

	const profiles = await loadProfiles(profileUrls, getSDs);

	// 2. Handle cursor position kinds
	const cp = ctx.cursorPosition;

	if (cp.kind === "value") {
		return handleValueCompletion(
			cp.key,
			effectivePath,
			resourceType,
			profiles,
			pos,
			getSDs,
			expandValueSet,
			completionContext,
			ctx,
			format,
		);
	}

	if (cp.kind === "array-item") {
		return handleArrayItemCompletion(
			cp.parentKey,
			effectivePath,
			resourceType,
			pos,
			getSDs,
			expandValueSet,
			completionContext,
			profiles,
			ctx,
			format,
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
			format,
		);
	}

	return null;
}

// ── Value completion ───────────────────────────────────────────────────

async function expand(
	expandValueSet: ExpandValueSet,
	url: string,
	filter: string,
): Promise<{ codes: ExpandedCode[]; complete: boolean | undefined }> {
	try {
		const result = await expandValueSet(url, filter);
		return Array.isArray(result)
			? { codes: result, complete: undefined }
			: result;
	} catch {
		return { codes: [], complete: undefined };
	}
}

// Codes of a binding. An example binding only illustrates its codes: when its
// ValueSet is large (LOINC, SNOMED) and the expansion is cut, an arbitrary
// page of codes is noise, so the codes are searched once the user types.
async function bindingCompletions(
	binding: FhirBinding | null,
	typed: string,
	from: number,
	expandValueSet: ExpandValueSet,
): Promise<CompletionResult | null> {
	if (!binding?.valueSet) return null;
	const { codes, complete } = await expand(
		expandValueSet,
		binding.valueSet,
		typed,
	);
	if (binding.strength === "example" && !typed && complete === false) {
		return null;
	}
	if (codes.length === 0) return null;
	const options: Completion[] = codes.map((c) => ({
		label: c.code,
		...(c.display ? { info: c.display } : {}),
		type: "text",
		apply: (
			view: EditorView,
			_c: Completion,
			applyFrom: number,
			applyTo: number,
		) => insertStringValue(view, applyFrom, applyTo, c.code),
	}));
	return { from, options, filter: false };
}

async function handleValueCompletion(
	valueKey: string,
	effectivePath: string[],
	resourceType: string | undefined,
	profiles: StructureDefinition[],
	pos: number,
	getSDs: GetStructureDefinitions,
	expandValueSet: ExpandValueSet | undefined,
	completionContext: CompletionContext,
	ctx: DocumentContext,
	format: ResourceFormat = "fhir",
): Promise<CompletionResult | null> {
	const word = completionContext.matchBefore(VALUE_WORD);
	const from = word?.from ?? pos;
	const typed = word?.text ?? "";

	// resourceType value: of a resource, or the target of an Aidbox reference
	if (valueKey === "resourceType") {
		const targets =
			format === "aidbox" && resourceType && effectivePath.length > 0
				? await resolveReferenceTargets(
						effectivePath,
						resourceType,
						getSDs,
						format,
					)
				: null;
		const types = targets ?? (await getResourceTypes(getSDs));
		if (types.length === 0) return null;
		const options: Completion[] = types.map((type) => ({
			label: type,
			type: "type",
			apply: (
				view: EditorView,
				_c: Completion,
				applyFrom: number,
				applyTo: number,
			) => insertStringValue(view, applyFrom, applyTo, type),
		}));
		return { from, options, validFor: /^\w*$/ };
	}

	// Parameters.parameter.name → slice names from profile
	if (
		valueKey === "name" &&
		resourceType &&
		effectivePath[effectivePath.length - 1] === "parameter" &&
		(await isParametersType(resourceType, getSDs))
	) {
		const slices = getParameterSlices(profiles);
		if (slices.length > 0) {
			const options: Completion[] = slices.map((slice) => ({
				label: slice.fixedName,
				type: "text",
				detail: slice.min > 0 ? "required" : "optional",
				boost: slice.min > 0 ? 2 : 0,
				...(slice.short ? { info: slice.short } : {}),
				apply: (
					view: EditorView,
					_c: Completion,
					applyFrom: number,
					applyTo: number,
				) => {
					insertStringValue(view, applyFrom, applyTo, slice.fixedName);
					// Add the value[x] member the slice allows
					const valueTypes =
						slice.valueTypes.length > 0 ? slice.valueTypes : ["string"];
					setTimeout(() => appendValueMember(view, valueTypes, format), 10);
				},
			}));
			return { from, options, validFor: /^\w*$/ };
		}
	}

	// Values fixed by the profile (fixed[x], pattern[x])
	if (resourceType && profiles.length > 0) {
		const keys = await fhirKeys(
			[...effectivePath, valueKey],
			resourceType,
			getSDs,
			format,
		);
		const fixed = profileValues(
			keys.slice(0, -1),
			keys[keys.length - 1] ?? valueKey,
			profiles,
		);
		if (fixed.length > 0) {
			const options: Completion[] = fixed.map(({ value, literal }) => ({
				label: value,
				type: "text",
				boost: 10,
				apply: (
					view: EditorView,
					_c: Completion,
					applyFrom: number,
					applyTo: number,
				) =>
					literal
						? insertLiteral(view, applyFrom, applyTo, value)
						: insertStringValue(view, applyFrom, applyTo, value),
			}));
			return { from, options, validFor: VALUE_WORD_FULL };
		}
	}

	// reference value
	if (valueKey === "reference" && resourceType) {
		const targets = await resolveReferenceTargets(
			effectivePath,
			resourceType,
			getSDs,
			format,
		);
		if (targets) {
			const options: Completion[] = targets.map((rt) => ({
				label: `${rt}/`,
				type: "type",
				apply: (
					view: EditorView,
					_c: Completion,
					applyFrom: number,
					applyTo: number,
				) => insertStringValue(view, applyFrom, applyTo, `${rt}/`, true),
			}));
			return { from, options, validFor: /^[\w/.-]*$/ };
		}
	}

	// Extension URL value
	if (
		valueKey === "url" &&
		isExtensionKey(ctx.fullPath[ctx.fullPath.length - 1])
	) {
		return handleExtensionUrlCompletion(
			effectivePath,
			resourceType,
			profiles,
			from,
			getSDs,
			completionContext,
			ctx,
			format,
		);
	}

	if (!resourceType) return null;

	// Boolean value
	const elements = await resolveElements(
		effectivePath,
		resourceType,
		getSDs,
		format,
	);
	const el = elements.find((e) => fieldName(e) === valueKey);
	if (el?.type?.length === 1 && el.type[0]?.code === "boolean") {
		const options: Completion[] = ["true", "false"].map((v) => ({
			label: v,
			type: "keyword",
			apply: (
				view: EditorView,
				_c: Completion,
				applyFrom: number,
				applyTo: number,
			) => insertLiteral(view, applyFrom, applyTo, v),
		}));
		return { from, options, validFor: /^\w*$/ };
	}

	if (!expandValueSet || valueKey === "url") return null;

	// Coding.system → code systems of the binding on the coded element
	if (valueKey === "system") {
		const container = (
			await walkPath(effectivePath, resourceType, getSDs, format)
		)?.cursor?.path;
		if (container === "Coding") {
			const binding = await findBindingForValue(
				effectivePath,
				"code",
				resourceType,
				getSDs,
				profiles,
				ctx,
				format,
			);
			if (!binding?.valueSet) return null;
			const { codes } = await expand(expandValueSet, binding.valueSet, "");
			const systems = [
				...new Set(codes.flatMap((c) => (c.system ? [c.system] : []))),
			];
			if (systems.length === 0) return null;
			const options: Completion[] = systems.map((system) => ({
				label: system,
				type: "text",
				apply: (
					view: EditorView,
					_c: Completion,
					applyFrom: number,
					applyTo: number,
				) => insertStringValue(view, applyFrom, applyTo, system),
			}));
			return { from, options, validFor: VALUE_WORD_FULL };
		}
	}

	// Terminology binding
	if (valueKey === "reference") return null;
	const binding = await findBindingForValue(
		effectivePath,
		valueKey,
		resourceType,
		getSDs,
		profiles,
		ctx,
		format,
	);
	return bindingCompletions(binding, typed, from, expandValueSet);
}

// ── Extension URL completion ───────────────────────────────────────────

async function handleExtensionUrlCompletion(
	effectivePath: string[],
	resourceType: string | undefined,
	profiles: StructureDefinition[],
	from: number,
	getSDs: GetStructureDefinitions,
	completionContext: CompletionContext,
	ctx: DocumentContext,
	format: ResourceFormat = "fhir",
): Promise<CompletionResult | null> {
	// Nested extension (the enclosing extension has a url)
	const parentUrl = parentExtensionUrl(ctx);
	if (parentUrl) {
		return handleNestedExtensionSlices(
			parentUrl,
			from,
			getSDs,
			completionContext,
			format,
		);
	}

	if (!resourceType) return null;

	// Element the extension is attached to: the resource or a nested element
	const host = effectivePath.slice(0, -1);
	const extensionKey = effectivePath[effectivePath.length - 1] ?? "extension";
	const atResource = host.length === 0;
	let contextTypes: string[] = [
		resourceType,
		"DomainResource",
		"Resource",
		"Element",
	];
	if (!atResource) {
		const hostElement = (await walkPath(host, resourceType, getSDs, format))
			?.element;
		const hostType = hostElement?.contentReference
			? "BackboneElement"
			: (hostElement?.type?.[0]?.code ?? "Element");
		contextTypes = [hostType, "Element", `${resourceType}.${host.join(".")}`];
	}

	// Extensions the profiles declare at this element
	const profileExtUrls: string[] = [];
	for (const profile of profiles) {
		for (const el of profile.differential?.element ?? []) {
			if (!matchesPath(el.path, [...host, extensionKey])) continue;
			for (const t of el.type ?? []) {
				if (t.code !== "Extension") continue;
				for (const p of t.profile ?? []) {
					const url = splitCanonical(p).url;
					if (!profileExtUrls.includes(url)) profileExtUrls.push(url);
				}
			}
		}
	}

	const filter = completionContext.matchBefore(VALUE_WORD)?.text ?? "";
	const searchParams: StructureDefinitionSearchParams = {
		type: "Extension",
		derivation: "constraint",
		_elements: "url,context",
		_count: EXTENSIONS_COUNT,
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
	for (const u of profileExtUrls) {
		if (!seen.has(u)) {
			seen.add(u);
			allExts.push({ url: u, boost: 20 });
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
	if (filtered.length === 0) return null;

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
			insertStringValue(view, applyFrom, applyTo, ext.url);
			// Add the value[x] (or sub-extensions) the extension defines
			setTimeout(async () => {
				const fullSD = await getCachedSD(ext.url, getSDs);
				const extInfo = fullSD ? analyzeExtensionSD(fullSD) : null;
				if (!extInfo) return;
				if (extInfo.isNested) appendNestedExtensions(view);
				else appendValueMember(view, extInfo.valueTypes, format);
			}, 10);
		},
	}));
	return { from, options, filter: false };
}

async function handleNestedExtensionSlices(
	parentExtUrl: string,
	from: number,
	getSDs: GetStructureDefinitions,
	completionContext: CompletionContext,
	format: ResourceFormat = "fhir",
): Promise<CompletionResult | null> {
	const parentSD = await getCachedSD(parentExtUrl, getSDs);
	const slices = extensionSlices(parentSD?.differential?.element ?? []);
	if (slices.length === 0) return null;

	const filter = (
		completionContext.matchBefore(VALUE_WORD)?.text ?? ""
	).toLowerCase();
	const matching = filter
		? slices.filter(
				(s) =>
					s.url.toLowerCase().includes(filter) ||
					(s.short?.toLowerCase().includes(filter) ?? false),
			)
		: slices;

	const options: Completion[] = matching.map((slice) => ({
		label: slice.url,
		...(slice.short ? { info: slice.short } : {}),
		type: "text",
		apply: (
			view: EditorView,
			_c: Completion,
			applyFrom: number,
			applyTo: number,
		) => {
			insertStringValue(view, applyFrom, applyTo, slice.url);
			setTimeout(() => appendValueMember(view, slice.valueTypes, format), 10);
		},
	}));
	if (options.length > 0) return { from, options, filter: false };
	return null;
}

// ── Array item completion ──────────────────────────────────────────────

async function handleArrayItemCompletion(
	parentKey: string,
	effectivePath: string[],
	resourceType: string | undefined,
	pos: number,
	getSDs: GetStructureDefinitions,
	expandValueSet: ExpandValueSet | undefined,
	completionContext: CompletionContext,
	profiles: StructureDefinition[],
	ctx: DocumentContext,
	format: ResourceFormat = "fhir",
): Promise<CompletionResult | null> {
	if (!resourceType) return null;

	// Parameters.parameter or part → snippet completions from profile slices
	if (
		(parentKey === "parameter" || parentKey === "part") &&
		(await isParametersType(resourceType, getSDs))
	) {
		const slices =
			parentKey === "parameter" ? getParameterSlices(profiles) : [];

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
					const { text, cursorOffset } = buildParameterSnippet(
						slice.fixedName,
						slice.valueTypes,
						lineIndent(view, from),
						format,
					);
					insertEntry(view, from, to, text, cursorOffset);
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
				const { text, cursorOffset } = buildParameterSnippet(
					"",
					[],
					lineIndent(view, from),
					format,
				);
				insertEntry(view, from, to, text, cursorOffset);
				setTimeout(() => startCompletion(view), 0);
			},
		});

		const word = completionContext.matchBefore(/[\w]*/);
		return { from: word?.from ?? pos, options };
	}

	// The array is a member of the object at the cursor's path
	const arrayPath = [...effectivePath, parentKey];

	const targetType = await findCanonicalTargetType(
		effectivePath,
		parentKey,
		resourceType,
		getSDs,
		format,
	);
	if (targetType === "StructureDefinition") {
		const allSDs = await getCachedSDList(
			{
				type: `${resourceType},DomainResource,Resource`,
				derivation: "constraint",
				_elements: "url,name",
				_count: PROFILES_COUNT,
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
						const anchor = applyFrom + url.length + 2;
						view.dispatch({
							changes: { from: applyFrom, to: actualTo, insert: `"${url}"` },
							selection: { anchor },
						});
						revealInsertion(view, anchor, anchor);
					},
				};
			});
			if (options.length > 0) {
				return { from, options, filter: false };
			}
		}
		return null;
	}

	const element = (await walkPath(arrayPath, resourceType, getSDs, format))
		?.element;
	const typeCode = element?.type?.[0]?.code;
	if (!element) return null;

	// Items of a complex type: a new object, started with one of its members
	if (element.contentReference || (typeCode && !isPrimitiveType(typeCode))) {
		const members =
			typeCode === "Resource"
				? [
						{
							path: `${resourceType}.${parentKey}.resourceType`,
							type: [{ code: "string" }],
							short: "FHIR resource type",
						},
					]
				: await resolveElements(arrayPath, resourceType, getSDs, format);
		const offered = members.filter((member) => !member.hidden);
		if (offered.length === 0) return null;
		const word = completionContext.matchBefore(/"?\w*/);
		let from = word?.from ?? pos;
		if (ctx.doc[from] === '"') from++;
		return {
			from,
			options: offered.map((member) =>
				toObjectCompletion(member, true, format),
			),
			validFor: /^\w*$/,
		};
	}

	// Primitive items: codes of the binding
	if (!expandValueSet) return null;
	const word = completionContext.matchBefore(VALUE_WORD);
	const binding = await findBindingForValue(
		effectivePath,
		parentKey,
		resourceType,
		getSDs,
		profiles,
		ctx,
		format,
	);
	return bindingCompletions(
		binding,
		word?.text ?? "",
		word?.from ?? pos,
		expandValueSet,
	);
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
	format: ResourceFormat = "fhir",
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

	// Outside any object (an empty body) every option starts the resource object
	const topLevel = ctx.isTopLevel();
	const toOptions = (
		elements: FhirElement[],
		mapFn = (el: FhirElement) => toCompletion(el, format),
	) => {
		const offered = elements.filter((el) => !el.hidden);
		return topLevel
			? offered.map((el) => toObjectCompletion(el, false, format))
			: elementsToCompletions(offered, mapFn);
	};

	const makeJsonRtCompletion = (): Completion => {
		if (topLevel) {
			const c = toObjectCompletion(
				{
					path: "Resource.resourceType",
					type: [{ code: "string" }],
					short: "FHIR resource type",
				},
				false,
			);
			c.boost = 10;
			return c;
		}
		const c: Completion = {
			label: "resourceType",
			type: "property",
			detail: "string",
			boost: 10,
			apply: (view, _completion, from, to) => {
				applyProperty(view, from, to, "resourceType", () => {
					const text = '"resourceType": ""';
					return { text, cursorOffset: text.length - 1 };
				});
			},
		};
		c.info = "FHIR resource type";
		return c;
	};

	let completions: Completion[];
	if (resourceType) {
		const elements = await resolveElements(
			effectivePath,
			resourceType,
			getSDs,
			format,
		);
		const isParams = await isParametersType(resourceType, getSDs);
		completions = isParams
			? toOptions(elements, (el) => toParameterPropertyCompletion(el, format))
			: toOptions(elements);
		if (!hasExplicitResourceType && effectivePath.length === 0) {
			completions = [makeJsonRtCompletion(), ...completions];
		}
	} else if (effectivePath.length === 0) {
		const domainElements = await resolveElements(
			effectivePath,
			"DomainResource",
			getSDs,
			format,
		);
		completions = [makeJsonRtCompletion(), ...toOptions(domainElements)];
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
	resourceFormat: ResourceFormat = "fhir",
): CompletionSource {
	return async (cc: CompletionContext): Promise<CompletionResult | null> => {
		try {
			const ctx = buildJsonDocumentContext(cc.state.doc.toString(), cc.pos);
			return await fhirComplete(
				ctx,
				getSDs,
				resourceTypeHint,
				expandValueSet,
				cc,
				resourceFormat,
			);
		} catch (error) {
			// The editor swallows extension exceptions: keep failures visible
			console.error("FHIR completion failed:", error);
			return null;
		}
	};
}

// ── Validation ─────────────────────────────────────────────────────────

type FhirDiagnostic = {
	from: number;
	to: number;
	message: string;
};

// The resource holding an object, and the object's path within it: descends
// into nested resources (contained, Bundle.entry.resource) at elements of type
// Resource. An Aidbox reference {resourceType, id} is not a nested resource.
// null when a nested resource has no resourceType yet.
async function nestedResource(
	path: string[],
	resourceType: string,
	scopes: (string | null)[],
	getSDs: GetStructureDefinitions,
	format: ResourceFormat,
): Promise<{ resourceType: string; path: string[] } | null> {
	let current = { resourceType, path };
	let depth = 0;
	while (current.path.length > 0) {
		const boundary = await findResourceBoundary(
			current.path,
			current.resourceType,
			getSDs,
			format,
		);
		if (boundary === null) break;
		depth += boundary + 1;
		const inner = scopes[depth];
		if (!inner) return null;
		current = { resourceType: inner, path: current.path.slice(boundary + 1) };
	}
	return current;
}

/** @internal — exported for tests only */
export async function validateFhirProperties(
	properties: PropertyInfo[],
	getSDs: GetStructureDefinitions,
	format: ResourceFormat = "fhir",
): Promise<FhirDiagnostic[]> {
	const groups = new Map<
		string,
		{
			resourceType: string;
			path: string[];
			scopes: (string | null)[];
			props: PropertyInfo[];
		}
	>();
	for (const prop of properties) {
		const key = `${prop.resourceType}|${prop.scopes.join(",")}|${prop.path.join(".")}`;
		let group = groups.get(key);
		if (!group) {
			group = {
				resourceType: prop.resourceType,
				path: [...prop.path],
				scopes: prop.scopes,
				props: [],
			};
			groups.set(key, group);
		}
		group.props.push(prop);
	}

	const diagnostics: FhirDiagnostic[] = [];

	for (const group of groups.values()) {
		const target = await nestedResource(
			group.path,
			group.resourceType,
			group.scopes,
			getSDs,
			format,
		);
		if (!target) continue;
		const elements = await resolveElements(
			target.path,
			target.resourceType,
			getSDs,
			format,
		);
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
		if (target.path.length === 0) {
			validNames.add("resourceType");
		}

		for (const prop of group.props) {
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
	resourceFormat: ResourceFormat = "fhir",
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

			let rawDiags: FhirDiagnostic[];
			try {
				rawDiags = await validateFhirProperties(
					properties,
					getSDs,
					requestFormat(currentDoc) ?? resourceFormat,
				);
			} catch (error) {
				console.error("FHIR validation failed:", error);
				return;
			}
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
	resourceFormat: ResourceFormat = "fhir",
): Extension {
	const jsonSource = jsonCompletionSource(
		getSDs,
		resourceTypeHint,
		expandValueSet,
		resourceFormat,
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
		buildFhirValidationPlugin(getSDs, resourceTypeHint, resourceFormat),
	];
}
