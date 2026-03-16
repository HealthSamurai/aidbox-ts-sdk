import type {
	Completion,
	CompletionContext,
	CompletionResult,
	CompletionSource,
} from "@codemirror/autocomplete";
import { jsonLanguage } from "@codemirror/lang-json";
import type { Extension } from "@codemirror/state";

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

export type GetStructureDefinition = (
	type: string,
) => Promise<StructureDefinition | null>;

// ── Cache ──────────────────────────────────────────────────────────────

const sdCache = new Map<string, StructureDefinition | null>();
const pendingRequests = new Map<string, Promise<StructureDefinition | null>>();

async function getCachedSD(
	type: string,
	getSD: GetStructureDefinition,
): Promise<StructureDefinition | null> {
	if (sdCache.has(type)) return sdCache.get(type) ?? null;

	let pending = pendingRequests.get(type);
	if (!pending) {
		pending = getSD(type)
			.then((sd) => {
				sdCache.set(type, sd);
				pendingRequests.delete(type);
				return sd;
			})
			.catch(() => {
				pendingRequests.delete(type);
				sdCache.set(type, null);
				return null;
			});
		pendingRequests.set(type, pending);
	}
	return pending;
}

// ── JSON path at cursor ────────────────────────────────────────────────

function getJsonPathAtCursor(doc: string, pos: number): string[] {
	const path: string[] = [];
	let inString = false;
	let escape = false;
	let currentKey = "";
	let collectingKey = false;
	let lastKey = "";

	for (let i = 0; i < pos; i++) {
		const ch = doc[i];

		if (escape) {
			if (collectingKey) currentKey += ch;
			escape = false;
			continue;
		}
		if (ch === "\\") {
			escape = true;
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
	getSD: GetStructureDefinition,
): Promise<{ elements: FhirElement[]; basePath: string } | null> {
	const sd = await getCachedSD(type, getSD);
	if (!sd?.differential?.element) return null;

	const elements = [...sd.differential.element];

	// Recursively load base definition elements
	if (sd.baseDefinition) {
		const base = await collectAllElements(sd.baseDefinition, getSD);
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

async function resolveCompletions(
	path: string[],
	resourceType: string,
	getSD: GetStructureDefinition,
): Promise<Completion[]> {
	const result = await collectAllElements(resourceType, getSD);
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

		// Complex type — load with inheritance
		const typeResult = await collectAllElements(typeCode, getSD);
		if (!typeResult) return [];
		currentPath = typeResult.basePath;
		currentElements = typeResult.elements;
	}

	const children = directChildren(currentElements, currentPath);
	const completions: Completion[] = [];

	for (const el of children) {
		const name = fieldName(el);
		const isChoiceType = el.path.endsWith("[x]");

		if (isChoiceType && el.type && el.type.length > 0) {
			// Expand choice type into concrete FHIR variants
			for (const t of el.type) {
				const expanded: FhirElement = {
					...el,
					path: el.path.replace("[x]", t.code.charAt(0).toUpperCase() + t.code.slice(1)),
					type: [t],
				};
				completions.push(toCompletion(expanded));
			}
		} else {
			completions.push(toCompletion(el));
		}

		// Add primitive extension (_field) for primitive types
		const firstTypeCode = el.type?.[0]?.code;
		if (!isChoiceType && el.type?.length === 1 && firstTypeCode && PRIMITIVE_TYPES.has(firstTypeCode)) {
			const extCompletion: Completion = {
				label: `_${name}`,
				type: "property",
				detail: "Element [0..1]",
				boost: -1,
			};
			extCompletion.info = "Primitive element extension";
			completions.push(extCompletion);
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

function applySnippet(element: FhirElement): string {
	const name = fieldName(element);
	const isArray = element.max === "*";
	const typeCode = element.type?.[0]?.code;

	if (!typeCode) return `"${name}": `;

	if (isArray) {
		if (PRIMITIVE_TYPES.has(typeCode)) {
			return `"${name}": []`;
		}
		return `"${name}": [{}]`;
	}

	if (typeCode === "boolean") return `"${name}": `;
	if (
		typeCode === "integer" ||
		typeCode === "decimal" ||
		typeCode === "positiveInt" ||
		typeCode === "unsignedInt"
	) {
		return `"${name}": `;
	}
	if (PRIMITIVE_TYPES.has(typeCode)) return `"${name}": ""`;
	// Complex type — object
	return `"${name}": {}`;
}

function toCompletion(element: FhirElement): Completion {
	const name = fieldName(element);
	const types = element.type?.map((t) => t.code).join(" | ") ?? "";

	const snippet = applySnippet(element);
	const completion: Completion = {
		label: name,
		type: "property",
		detail: types,
		boost: element.min && element.min > 0 ? 2 : 0,
		apply: (view, _completion, from, to) => {
			// Expand range to include surrounding quotes
			const doc = view.state.doc.toString();
			let actualFrom = from;
			let actualTo = to;
			if (actualFrom > 0 && doc[actualFrom - 1] === '"') actualFrom--;
			if (actualTo < doc.length && doc[actualTo] === '"') actualTo++;

			// Find cursor position (inside {} or [] or at end of value)
			const cursorOffset = snippet.includes("{}")
				? snippet.indexOf("{}") + 1
				: snippet.includes("[]")
					? snippet.indexOf("[]") + 1
					: snippet.includes('""')
						? snippet.indexOf('""') + 1
						: snippet.length;

			view.dispatch({
				changes: { from: actualFrom, to: actualTo, insert: snippet },
				selection: { anchor: actualFrom + cursorOffset },
			});
		},
	};
	if (element.short) completion.info = element.short;
	return completion;
}

// ── Completion source ──────────────────────────────────────────────────

export function fhirCompletionSource(
	getSD: GetStructureDefinition,
): CompletionSource {
	return async (
		context: CompletionContext,
	): Promise<CompletionResult | null> => {
		const { state, pos } = context;
		const doc = state.doc.toString();

		console.log("[fhir-completion] source called, pos:", pos);

		const rtMatch = doc.match(/"resourceType"\s*:\s*"([^"]+)"/);
		if (!rtMatch?.[1]) {
			console.log("[fhir-completion] no resourceType found");
			return null;
		}

		const line = state.doc.lineAt(pos);
		const beforeCursor = line.text.slice(0, pos - line.from).trimStart();

		const isPropertyPosition =
			beforeCursor === "" ||
			beforeCursor === '"' ||
			/^"[\w]*$/.test(beforeCursor);

		console.log("[fhir-completion] beforeCursor:", JSON.stringify(beforeCursor), "isProperty:", isPropertyPosition);

		if (!isPropertyPosition) return null;

		const path = getJsonPathAtCursor(doc, pos);
		console.log("[fhir-completion] path:", path, "resourceType:", rtMatch[1]);
		const completions = await resolveCompletions(path, rtMatch[1], getSD);
		console.log("[fhir-completion] completions:", completions.length);
		if (completions.length === 0) return null;

		// Match word being typed, skip opening quote for label matching
		const word = context.matchBefore(/"?\w*/);
		let from = word?.from ?? pos;
		if (from < doc.length && doc[from] === '"') from++;

		return {
			from,
			options: completions,
			validFor: /^\w*$/,
		};
	};
}

// ── Public API ─────────────────────────────────────────────────────────

export function buildFhirCompletionExtension(
	getSD: GetStructureDefinition,
): Extension {
	const source = fhirCompletionSource(getSD);
	return jsonLanguage.data.of({ autocomplete: source });
}
