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
}

export interface PropertyInfo {
	name: string;
	path: string[];
	resourceType: string;
	from: number;
	to: number;
}

export interface EmptyStringInfo {
	from: number;
	to: number;
}

// ── HTTP mode helper ───────────────────────────────────────────────────

const HTTP_METHOD_RE = /^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s/;

function detectJsonStart(doc: string): number {
	const firstLine = doc.slice(0, doc.indexOf("\n") >>> 0).trimStart();
	if (HTTP_METHOD_RE.test(firstLine)) {
		const bodyStart = doc.indexOf("\n\n");
		if (bodyStart === -1) return 0;
		return bodyStart + 2;
	}
	return 0;
}

// ── JSON path at cursor ────────────────────────────────────────────────

function getJsonPathAtCursor(doc: string, pos: number): string[] {
	const path: string[] = [];
	const arrayKeyStack: string[] = [];
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
		if (ch === "[") {
			arrayKeyStack.push(lastKey);
			lastKey = "";
		} else if (ch === "]") {
			arrayKeyStack.pop();
			lastKey = "";
		} else if (ch === "{") {
			const key =
				lastKey ||
				(arrayKeyStack.length > 0
					? (arrayKeyStack[arrayKeyStack.length - 1] ?? "")
					: "");
			if (key) path.push(key);
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

// ── Cursor position detection ──────────────────────────────────────────

function isJsonValuePosition(beforeCursor: string): string | null {
	// Don't match if a comma follows the value (value is complete)
	if (/,\s*$/.test(beforeCursor)) return null;
	const match = beforeCursor.match(/"?(\w+)"?\s*:\s*"?([^"]*)?$/);
	if (match) return match[1] ?? null;
	return null;
}

function isJsonPropertyPosition(beforeCursor: string): boolean {
	if (beforeCursor === "" || beforeCursor === '"') return true;
	if (/^"?[\w]*$/.test(beforeCursor)) return true;
	if (/[{,]\s*"?[\w]*$/.test(beforeCursor)) return true;
	return false;
}

function isInsideJsonArray(doc: string, pos: number): boolean {
	let depth = 0;
	let inStr = false;
	let escaped = false;
	for (let i = pos - 1; i >= 0; i--) {
		const ch = doc[i];
		if (escaped) {
			escaped = false;
			continue;
		}
		if (ch === "\\") {
			escaped = true;
			continue;
		}
		if (ch === '"') {
			inStr = !inStr;
			continue;
		}
		if (inStr) continue;
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

// ── Array-item detection ───────────────────────────────────────────────

function detectArrayItemContext(
	doc: string,
	pos: number,
): { parentKey: string; prefix: string } | null {
	const textBefore = doc.slice(0, pos);
	const arrayMatch = textBefore.match(
		/"(\w+)"\s*:\s*\[\s*(?:"[^"]*"\s*,\s*)*"?([^"]*)$/s,
	);
	if (!arrayMatch) return null;
	// If there are unmatched { after [, cursor is inside a nested object, not directly in array
	const afterBracket = arrayMatch[2] ?? "";
	let braceDepth = 0;
	for (const ch of afterBracket) {
		if (ch === "{") braceDepth++;
		else if (ch === "}") braceDepth--;
	}
	if (braceDepth > 0) return null;
	return { parentKey: arrayMatch[1]!, prefix: afterBracket };
}

// ── Scope view (find values in ancestor objects) ───────────────────────

function findStringValueInObject(
	doc: string,
	objStart: number,
	limit: number,
	targetKey: string,
): string | null {
	let fd = 0;
	let fs = false;
	let fe = false;
	let lastKey = "";
	let collecting = false;
	let current = "";
	let afterColon = false;

	for (let i = objStart + 1; i < limit; i++) {
		const ch = doc[i];
		if (fe) {
			if (collecting) current += ch;
			fe = false;
			continue;
		}
		if (ch === "\\") {
			fe = true;
			if (collecting) current += ch;
			continue;
		}
		if (ch === '"') {
			if (!fs) {
				fs = true;
				if (fd === 0) {
					collecting = true;
					current = "";
				}
			} else {
				fs = false;
				if (collecting) {
					if (afterColon) {
						if (lastKey === targetKey) return current;
						afterColon = false;
					} else {
						lastKey = current;
					}
					collecting = false;
				}
			}
			continue;
		}
		if (fs) {
			if (collecting) current += ch;
			continue;
		}
		if (ch === "{" || ch === "[") fd++;
		else if (ch === "}" || ch === "]") fd--;
		else if (ch === ":" && fd === 0) afterColon = true;
		else if (ch === "," && fd === 0) {
			afterColon = false;
			lastKey = "";
		}
	}
	return null;
}

function findStringArrayInObject(
	doc: string,
	objStart: number,
	limit: number,
	parentKey: string,
	arrayKey: string,
): string[] {
	// Find "parentKey": { ... "arrayKey": ["v1", "v2"] ... }
	// or if parentKey is empty, find "arrayKey": [...] at top level
	const searchDoc = doc.slice(objStart, limit);
	let pattern: RegExp;
	if (parentKey) {
		pattern = new RegExp(
			`"${parentKey}"\\s*:\\s*\\{[\\s\\S]*?"${arrayKey}"\\s*:\\s*\\[([\\s\\S]*?)\\]`,
		);
	} else {
		pattern = new RegExp(`"${arrayKey}"\\s*:\\s*\\[([\\s\\S]*?)\\]`);
	}
	const match = searchDoc.match(pattern);
	if (!match?.[1]) return [];
	const urls: string[] = [];
	const re = /"([^"]+)"/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(match[1])) !== null) {
		if (m[1]) urls.push(m[1]);
	}
	return urls;
}

function findKeysInObject(
	doc: string,
	objStart: number,
	limit: number,
): string[] {
	const keys: string[] = [];
	let fd = 0;
	let fs = false;
	let fe = false;
	let collecting = false;
	let current = "";
	let afterColon = false;

	for (let i = objStart + 1; i < limit; i++) {
		const ch = doc[i];
		if (fe) {
			if (collecting) current += ch;
			fe = false;
			continue;
		}
		if (ch === "\\") {
			fe = true;
			if (collecting) current += ch;
			continue;
		}
		if (ch === '"') {
			if (!fs) {
				fs = true;
				if (fd === 0) {
					collecting = true;
					current = "";
				}
			} else {
				fs = false;
				if (collecting) {
					if (!afterColon) {
						keys.push(current);
					}
					collecting = false;
				}
			}
			continue;
		}
		if (fs) {
			if (collecting) current += ch;
			continue;
		}
		if (ch === "{" || ch === "[") fd++;
		else if (ch === "}" || ch === "]") fd--;
		else if (ch === ":" && fd === 0) afterColon = true;
		else if (ch === "," && fd === 0) {
			afterColon = false;
		}
	}
	return keys;
}

function buildScopeView(doc: string, pos: number, levelsUp: number): ScopeView {
	// Forward scan to find enclosing objects — avoids string-tracking bugs
	// from backward scanning when cursor is inside an unclosed string.
	const objectStack: number[] = [];
	let inString = false;
	let isEscaped = false;

	for (let i = 0; i < pos; i++) {
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
		if (ch === "{") {
			objectStack.push(i);
		} else if (ch === "}") {
			objectStack.pop();
		}
	}

	// objectStack[last] is innermost, objectStack[last - levelsUp] is target
	const targetIdx = objectStack.length - 1 - levelsUp;
	if (targetIdx < 0) {
		return {
			getString() {
				return null;
			},
			getStringArray() {
				return [];
			},
			getKeys() {
				return [];
			},
		};
	}

	const objStart = objectStack[targetIdx]!;
	const scopeEnd = doc.length;

	return {
		getString(key: string): string | null {
			return findStringValueInObject(doc, objStart, scopeEnd, key);
		},
		getStringArray(parentKey: string, arrayKey: string): string[] {
			return findStringArrayInObject(
				doc,
				objStart,
				scopeEnd,
				parentKey,
				arrayKey,
			);
		},
		getKeys(): string[] {
			return findKeysInObject(doc, objStart, scopeEnd);
		},
	};
}

// ── buildJsonDocumentContext ────────────────────────────────────────────

export function buildJsonDocumentContext(
	doc: string,
	pos: number,
): DocumentContext {
	const jsonStart = detectJsonStart(doc);
	const jsonBody = doc.slice(jsonStart);
	const posInBody = pos - jsonStart;

	const fullPath = getJsonPathAtCursor(jsonBody, posInBody);

	// Determine cursor position kind
	const lineStart = doc.lastIndexOf("\n", pos - 1) + 1;
	const beforeCursor = doc.slice(lineStart, pos).trimStart();

	let cursorPosition: DocumentContext["cursorPosition"];

	const valueKey = isJsonValuePosition(beforeCursor);
	if (valueKey) {
		cursorPosition = { kind: "value", key: valueKey, prefix: "" };
		const wordMatch = beforeCursor.match(/"?(\w+)"?\s*:\s*"?([^"]*)?$/);
		if (wordMatch?.[2] != null) {
			cursorPosition.prefix = wordMatch[2];
		}
	} else {
		const arrayItem = detectArrayItemContext(doc.slice(jsonStart), posInBody);
		if (arrayItem) {
			cursorPosition = {
				kind: "array-item",
				parentKey: arrayItem.parentKey,
				prefix: arrayItem.prefix,
			};
		} else if (isJsonPropertyPosition(beforeCursor)) {
			const wordMatch = beforeCursor.match(/"?(\w*)$/);
			cursorPosition = { kind: "property", prefix: wordMatch?.[1] ?? "" };
		} else {
			cursorPosition = { kind: "none" };
		}
	}

	return {
		fullPath,
		pos,
		doc,
		cursorPosition,
		getScope(levelsUp: number): ScopeView {
			return buildScopeView(jsonBody, posInBody, levelsUp);
		},
		isInsideArray(): boolean {
			return isInsideJsonArray(jsonBody, posInBody);
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
	if (rootObj) {
		walkJsonObject(
			rootObj,
			[],
			resourceTypeHint,
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

function walkJsonObject(
	node: SyntaxNode,
	parentPath: string[],
	parentResourceType: string | null,
	doc: string,
	result: PropertyInfo[],
	emptyStrings?: EmptyStringInfo[],
): void {
	let ownResourceType: string | null = null;
	for (let child = node.firstChild; child; child = child.nextSibling) {
		if (child.name !== "Property") continue;
		const nameNode = child.getChild("PropertyName");
		if (!nameNode) continue;
		const keyName = doc.slice(nameNode.from, nameNode.to).replace(/^"|"$/g, "");
		if (keyName === "resourceType") {
			for (let v = child.firstChild; v; v = v.nextSibling) {
				if (v.name === "String") {
					ownResourceType = doc.slice(v.from, v.to).replace(/^"|"$/g, "");
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
		const name = doc.slice(nameNode.from, nameNode.to).replace(/^"|"$/g, "");

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
				for (let item = v.firstChild; item; item = item.nextSibling) {
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
