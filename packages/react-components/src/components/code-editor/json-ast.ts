import type { syntaxTree } from "@codemirror/language";
import type { SyntaxNode } from "@lezer/common";

// ── Types ──────────────────────────────────────────────────────────────

export interface ScopeView {
	getString(key: string): string | null;
	getStringArray(parentKey: string, arrayKey: string): string[];
	getKeys(): string[];
}

export interface DocumentContext {
	fullPath: string[];
	pos: number;
	doc: string;
	cursorPosition:
		| { kind: "property"; prefix: string }
		| { kind: "value"; key: string; prefix: string }
		| { kind: "array-item"; parentKey: string; prefix: string }
		| { kind: "none" };
	getScope(levelsUp: number): ScopeView;
	isInsideArray(): boolean;
	// The cursor is outside any object or array (an empty document or body)
	isTopLevel(): boolean;
}

export interface PropertyInfo {
	name: string;
	// Keys leading from the root object to the property's object
	path: string[];
	// resourceType of the root object, or the hint
	resourceType: string;
	// resourceType of each object on the path, the root first (null if none);
	// nested resources are told apart by element types, not by this key alone
	scopes: (string | null)[];
	from: number;
	to: number;
}

export interface EmptyStringInfo {
	from: number;
	to: number;
}

// ── HTTP mode helper ───────────────────────────────────────────────────

const HTTP_METHOD_RE = /^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s/;

// Format of a request's resources: FHIR JSON under /fhir (also behind an
// OrgBAC prefix, /Organization/<id>/fhir), the Aidbox format in the rest of
// the Aidbox API. null when the document is not a request.
const FHIR_API_PATH = /^\/?(Organization\/[^/?]+\/)?fhir(\/|\?|$)/;

export function requestFormat(doc: string): "fhir" | "aidbox" | null {
	const firstLine = doc.slice(0, doc.indexOf("\n") >>> 0).trim();
	const match = /^(?:GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+(\S+)/.exec(
		firstLine,
	);
	if (!match?.[1]) return null;
	const path = match[1].replace(/^[a-z]+:\/\/[^/]*/i, "");
	return FHIR_API_PATH.test(path) ? "fhir" : "aidbox";
}

function detectJsonStart(doc: string): number {
	const firstLine = doc.slice(0, doc.indexOf("\n") >>> 0).trimStart();
	if (HTTP_METHOD_RE.test(firstLine)) {
		const bodyStart = doc.indexOf("\n\n");
		if (bodyStart === -1) return 0;
		return bodyStart + 2;
	}
	return 0;
}

// ── Tokens ─────────────────────────────────────────────────────────────

const DELIMITER = /[\s"{}[\]:,]/;
const WHITESPACE = /\s/;

function lineEnd(text: string, from: number): number {
	const end = text.indexOf("\n", from);
	return end === -1 ? text.length : end;
}

// JSON strings cannot span lines, so an unterminated string stops at the line
// break instead of swallowing the rest of the document.
function stringEnd(text: string, start: number): number {
	for (let i = start + 1; i < text.length; i++) {
		const ch = text[i];
		if (ch === "\\") i++;
		else if (ch === '"') return i;
		else if (ch === "\n") return -1;
	}
	return -1;
}

// Offset right after the string, container or literal starting at `start`.
function skipValue(text: string, start: number): number {
	const ch = text[start];
	if (ch === '"') {
		const end = stringEnd(text, start);
		return end === -1 ? lineEnd(text, start) : end + 1;
	}
	if (ch === "{" || ch === "[") {
		let depth = 0;
		for (let i = start; i < text.length; i++) {
			const c = text[i];
			if (c === '"') {
				i = skipValue(text, i) - 1;
			} else if (c === "{" || c === "[") {
				depth++;
			} else if (c === "}" || c === "]") {
				depth--;
				if (depth === 0) return i + 1;
			}
		}
		return text.length;
	}
	let end = start;
	while (end < text.length && !DELIMITER.test(text[end] ?? "")) end++;
	return end;
}

function tokenText(text: string, start: number, end: number): string {
	if (text[start] !== '"') return text.slice(start, end);
	const close = stringEnd(text, start);
	return text.slice(start + 1, close === -1 ? end : close);
}

// ── Cursor scan ────────────────────────────────────────────────────────

type Expect = "key" | "colon" | "value" | "comma";

interface Frame {
	kind: "object" | "array";
	start: number;
	// Property the container is the value of; array items share the array's key
	key: string;
	expect: Expect;
	// Property whose value is being read (objects only)
	member: string;
	// Offset right after the last complete value
	valueEnd: number;
}

interface CursorScan {
	// Containers enclosing the cursor, outermost first
	frames: Frame[];
	// Unfinished string or literal the cursor is in
	token: { start: number; isString: boolean } | null;
}

function completeValue(frame: Frame | undefined, end: number): void {
	if (!frame) return;
	frame.expect = "comma";
	frame.valueEnd = end;
}

function completeToken(frame: Frame | undefined, text: string, end: number) {
	if (frame?.kind === "object" && frame.expect === "key") {
		frame.member = text;
		frame.expect = "colon";
	} else {
		completeValue(frame, end);
	}
}

function scanToCursor(text: string, pos: number): CursorScan {
	const frames: Frame[] = [];
	const top = () => frames[frames.length - 1];
	let i = 0;
	while (i < pos) {
		const ch = text[i] ?? "";
		if (WHITESPACE.test(ch)) {
			i++;
		} else if (ch === "{" || ch === "[") {
			const parent = top();
			let key = "";
			if (parent?.kind === "object" && parent.expect === "value") {
				key = parent.member;
			} else if (parent?.kind === "array" && ch === "{") {
				key = parent.key;
			}
			frames.push({
				kind: ch === "{" ? "object" : "array",
				start: i,
				key,
				expect: ch === "{" ? "key" : "value",
				member: "",
				valueEnd: -1,
			});
			i++;
		} else if (ch === "}" || ch === "]") {
			frames.pop();
			completeValue(top(), i + 1);
			i++;
		} else if (ch === ":") {
			const frame = top();
			if (frame?.kind === "object" && frame.expect === "colon") {
				frame.expect = "value";
			}
			i++;
		} else if (ch === ",") {
			const frame = top();
			if (frame) {
				frame.expect = frame.kind === "object" ? "key" : "value";
				frame.member = "";
			}
			i++;
		} else {
			const isString = ch === '"';
			const close = isString ? stringEnd(text, i) : -1;
			const end = skipValue(text, i);
			const containsCursor =
				isString && close !== -1 ? close >= pos : end >= pos;
			if (containsCursor) return { frames, token: { start: i, isString } };
			completeToken(top(), tokenText(text, i, end), end);
			i = end;
		}
	}
	return { frames, token: null };
}

function cursorPositionOf(
	text: string,
	pos: number,
	{ frames, token }: CursorScan,
): DocumentContext["cursorPosition"] {
	const tokenStart = token?.start ?? pos;
	const prefix = token
		? text.slice(token.isString ? token.start + 1 : token.start, pos)
		: "";
	const frame = frames[frames.length - 1];
	if (!frame) {
		// Empty document: the members of the resource object to create. Nothing
		// is offered next to existing content (e.g. before an object).
		const tokenEnd = token ? skipValue(text, token.start) : pos;
		const empty =
			text.slice(0, tokenStart).trim() === "" &&
			text.slice(tokenEnd).trim() === "";
		return empty ? { kind: "property", prefix } : { kind: "none" };
	}
	// A complete value followed by a line break: the comma is missing, but the
	// user is starting the next entry.
	const nextEntry =
		frame.expect === "comma" &&
		text.slice(frame.valueEnd, tokenStart).includes("\n");
	if (frame.kind === "object") {
		if (frame.expect === "key" || nextEntry)
			return { kind: "property", prefix };
		if (frame.expect === "value") {
			return { kind: "value", key: frame.member, prefix };
		}
		return { kind: "none" };
	}
	if (frame.expect === "value" || nextEntry) {
		return { kind: "array-item", parentKey: frame.key, prefix };
	}
	return { kind: "none" };
}

// ── Scope view (values of an enclosing object) ─────────────────────────

interface Member {
	key: string;
	// Key token range, quotes included
	from: number;
	to: number;
	// Offset of the value, -1 when missing
	valueAt: number;
}

// Members of the object opening at `start`, up to its closing brace.
function readMembers(text: string, start: number): Member[] {
	const members: Member[] = [];
	let expect: Expect = "key";
	let member: Member | null = null;
	let i = start + 1;
	while (i < text.length) {
		const ch = text[i] ?? "";
		if (ch === "}" || ch === "]") break;
		if (WHITESPACE.test(ch)) {
			i++;
		} else if (ch === ":") {
			if (expect === "colon") expect = "value";
			i++;
		} else if (ch === ",") {
			expect = "key";
			member = null;
			i++;
		} else {
			const end = skipValue(text, i);
			if (expect === "key") {
				member = {
					key: tokenText(text, i, end),
					from: i,
					to: end,
					valueAt: -1,
				};
				members.push(member);
				expect = "colon";
			} else {
				if (expect === "value" && member) member.valueAt = i;
				expect = "comma";
			}
			i = Math.max(end, i + 1);
		}
	}
	return members;
}

function readStrings(text: string, start: number): string[] {
	const values: string[] = [];
	let i = start + 1;
	while (i < text.length) {
		const ch = text[i] ?? "";
		if (ch === "]" || ch === "}") break;
		const end = skipValue(text, i);
		if (ch === '"') {
			const value = tokenText(text, i, end);
			if (value) values.push(value);
		}
		i = Math.max(end, i + 1);
	}
	return values;
}

const EMPTY_SCOPE: ScopeView = {
	getString: () => null,
	getStringArray: () => [],
	getKeys: () => [],
};

function objectScope(text: string, start: number, cursor: number): ScopeView {
	let cached: Member[] | undefined;
	const members = () => {
		cached ??= readMembers(text, start);
		return cached;
	};
	const memberWith = (from: Member[], key: string, opening: string) =>
		from.find((m) => m.key === key && text[m.valueAt] === opening);
	return {
		getString(key: string): string | null {
			const member = memberWith(members(), key, '"');
			return member
				? tokenText(text, member.valueAt, skipValue(text, member.valueAt))
				: null;
		},
		getStringArray(parentKey: string, arrayKey: string): string[] {
			let owner = members();
			if (parentKey) {
				const parent = memberWith(owner, parentKey, "{");
				if (!parent) return [];
				owner = readMembers(text, parent.valueAt);
			}
			const array = memberWith(owner, arrayKey, "[");
			return array ? readStrings(text, array.valueAt) : [];
		},
		getKeys(): string[] {
			// The key being typed at the cursor is not an existing property
			return members()
				.filter((m) => cursor < m.from || cursor > m.to)
				.map((m) => m.key);
		},
	};
}

// ── buildJsonDocumentContext ────────────────────────────────────────────

export function buildJsonDocumentContext(
	doc: string,
	pos: number,
): DocumentContext {
	const jsonStart = detectJsonStart(doc);
	const body = doc.slice(jsonStart);
	const cursor = pos - jsonStart;
	const scan: CursorScan =
		cursor >= 0 ? scanToCursor(body, cursor) : { frames: [], token: null };
	const objects = scan.frames.filter((f) => f.kind === "object");

	return {
		fullPath: objects.filter((f) => f.key !== "").map((f) => f.key),
		pos,
		doc,
		cursorPosition:
			cursor >= 0 ? cursorPositionOf(body, cursor, scan) : { kind: "none" },
		getScope(levelsUp: number): ScopeView {
			const frame = objects[objects.length - 1 - levelsUp];
			return frame ? objectScope(body, frame.start, cursor) : EMPTY_SCOPE;
		},
		isInsideArray(): boolean {
			return scan.frames[scan.frames.length - 1]?.kind === "array";
		},
		isTopLevel(): boolean {
			return cursor >= 0 && scan.frames.length === 0;
		},
	};
}

// ── Validation helpers ─────────────────────────────────────────────────

export function walkJsonProperties(
	doc: string,
	tree: ReturnType<typeof syntaxTree>,
	resourceTypeHint: string | null,
): { properties: PropertyInfo[]; emptyStrings: EmptyStringInfo[] } {
	const properties: PropertyInfo[] = [];
	const emptyStrings: EmptyStringInfo[] = [];

	const rootObj = findRootJsonObject(doc, tree);
	const resourceType = rootObj
		? (ownResourceType(rootObj, doc) ?? resourceTypeHint)
		: null;
	if (rootObj && resourceType) {
		walkJsonObject(
			rootObj,
			[],
			[],
			resourceType,
			doc,
			properties,
			emptyStrings,
		);
	}

	return { properties, emptyStrings };
}

export function findRootJsonObject(
	doc: string,
	tree: ReturnType<typeof syntaxTree>,
): SyntaxNode | null {
	const direct = tree.topNode.getChild("Object");
	if (direct) return direct;

	const bodyStart = doc.indexOf("\n\n");
	if (bodyStart === -1) return null;

	const jsonStart = bodyStart + 2;
	if (jsonStart >= doc.length) return null;

	const innerNode = tree.resolveInner(jsonStart, 1);
	if (!innerNode) return null;

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

function ownResourceType(node: SyntaxNode, doc: string): string | null {
	for (let child = node.firstChild; child; child = child.nextSibling) {
		if (child.name !== "Property") continue;
		const nameNode = child.getChild("PropertyName");
		if (!nameNode) continue;
		const keyName = doc.slice(nameNode.from, nameNode.to).replace(/^"|"$/g, "");
		if (keyName !== "resourceType") continue;
		for (let v = child.firstChild; v; v = v.nextSibling) {
			if (v.name === "String") {
				return doc.slice(v.from, v.to).replace(/^"|"$/g, "");
			}
		}
		return null;
	}
	return null;
}

function walkJsonObject(
	node: SyntaxNode,
	path: string[],
	parentScopes: (string | null)[],
	resourceType: string,
	doc: string,
	result: PropertyInfo[],
	emptyStrings?: EmptyStringInfo[],
): void {
	const scopes = [...parentScopes, ownResourceType(node, doc)];

	for (let child = node.firstChild; child; child = child.nextSibling) {
		if (child.name !== "Property") continue;
		const nameNode = child.getChild("PropertyName");
		if (!nameNode) continue;
		const name = doc.slice(nameNode.from, nameNode.to).replace(/^"|"$/g, "");

		result.push({
			name,
			path: [...path],
			resourceType,
			scopes,
			from: nameNode.from,
			to: nameNode.to,
		});

		for (let v = child.firstChild; v; v = v.nextSibling) {
			if (v.name === "Object") {
				walkJsonObject(
					v,
					[...path, name],
					scopes,
					resourceType,
					doc,
					result,
					emptyStrings,
				);
			} else if (v.name === "Array") {
				for (let item = v.firstChild; item; item = item.nextSibling) {
					if (item.name === "Object") {
						walkJsonObject(
							item,
							[...path, name],
							scopes,
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
