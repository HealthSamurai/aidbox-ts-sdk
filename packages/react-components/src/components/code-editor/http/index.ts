import {
	foldInside,
	foldNodeProp,
	type Language,
	LanguageSupport,
	LRLanguage,
	syntaxTree,
} from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
	Decoration,
	type DecorationSet,
	EditorView,
	ViewPlugin,
	type ViewUpdate,
} from "@codemirror/view";
import { parseMixed } from "@lezer/common";
import { styleTags, tags } from "@lezer/highlight";
import type { LRParser } from "@lezer/lr";
import { parser } from "./grammar/http";
import { HttpRequestMethod } from "./grammar/http.terms";

function makeParser(
	bodyLanguages: (contentType: string) => Language | null,
): LRParser {
	return parser.configure({
		props: [
			styleTags({
				HttpHeaderName: tags.variableName,
				HttpHeaderValue: tags.attributeValue,
			}),

			foldNodeProp.add({
				HttpHeaders: foldInside,
			}),
		],
		wrap: parseMixed((node, input) => {
			if (node.name !== "HttpBody") {
				return null;
			}

			const headers = node.node.prevSibling;
			if (headers?.name !== "HttpHeaders") {
				return null;
			}

			let contentType: string | null = null;

			for (
				let child = headers.firstChild;
				child !== null;
				child = child.nextSibling
			) {
				const headerNameNode = child.getChild("HttpHeaderName");
				if (headerNameNode === null) {
					continue;
				}

				const headerName = input.read(headerNameNode.from, headerNameNode.to);
				if (headerName.toLowerCase() !== "content-type") {
					continue;
				}

				if (contentType !== null) {
					// Disallow multiple content types
					return null;
				}

				const headerValueNode = child.getChild("HttpHeaderValue");
				if (headerValueNode === null) {
					continue;
				}

				contentType = input.read(headerValueNode.from, headerValueNode.to);
			}

			if (contentType === null) {
				return null;
			}

			const language = bodyLanguages(contentType);
			if (language === null) {
				return null;
			}

			return { parser: language.parser };
		}),
	});
}

const methodDecorations: Record<string, Decoration> = {
	GET: Decoration.mark({ class: "cm-http-method-get" }),
	POST: Decoration.mark({ class: "cm-http-method-post" }),
	PUT: Decoration.mark({ class: "cm-http-method-put" }),
	PATCH: Decoration.mark({ class: "cm-http-method-patch" }),
	DELETE: Decoration.mark({ class: "cm-http-method-delete" }),
};

function buildMethodDecorations(view: EditorView): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();
	const tree = syntaxTree(view.state);
	tree.iterate({
		enter(node) {
			if (node.type.id === HttpRequestMethod) {
				const text = view.state.sliceDoc(node.from, node.to).toUpperCase();
				const deco = methodDecorations[text];
				if (deco) {
					builder.add(node.from, node.to, deco);
				}
			}
		},
	});
	return builder.finish();
}

const httpMethodHighlighter = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;
		constructor(view: EditorView) {
			this.decorations = buildMethodDecorations(view);
		}
		update(update: ViewUpdate) {
			if (update.docChanged || update.viewportChanged) {
				this.decorations = buildMethodDecorations(update.view);
			}
		}
	},
	{ decorations: (v) => v.decorations },
);

const httpMethodTheme = EditorView.baseTheme({
	".cm-http-method-get": {
		color: "var(--color-utility-green)",
	},
	".cm-http-method-post": {
		color: "var(--color-utility-yellow)",
	},
	".cm-http-method-put": {
		color: "var(--color-utility-blue)",
	},
	".cm-http-method-patch": {
		color: "var(--color-utility-violet)",
	},
	".cm-http-method-delete": {
		color: "var(--color-utility-red)",
	},
});

// ── HTTP header autocomplete ────────────────────────────────────────────

import type {
	Completion,
	CompletionContext,
	CompletionResult,
} from "@codemirror/autocomplete";
import {
	HttpHeaderName,
	HttpHeaders,
	HttpHeaderValue,
	HttpRequestPath,
} from "./grammar/http.terms";

const COMMON_HEADERS: Completion[] = [
	// Standard HTTP
	{ label: "Accept", type: "header", apply: "Accept: " },
	{ label: "Accept-Encoding", type: "header", apply: "Accept-Encoding: " },
	{ label: "Accept-Language", type: "header", apply: "Accept-Language: " },
	{ label: "Authorization", type: "header", apply: "Authorization: " },
	{ label: "Cache-Control", type: "header", apply: "Cache-Control: " },
	{ label: "Content-Type", type: "header", apply: "Content-Type: " },
	{ label: "Cookie", type: "header", apply: "Cookie: " },
	{ label: "Host", type: "header", apply: "Host: " },
	{ label: "If-Match", type: "header", apply: "If-Match: " },
	{ label: "If-Modified-Since", type: "header", apply: "If-Modified-Since: " },
	{ label: "If-None-Match", type: "header", apply: "If-None-Match: " },
	{ label: "Origin", type: "header", apply: "Origin: " },
	{ label: "Prefer", type: "header", apply: "Prefer: " },
	// Aidbox-specific
	{ label: "x-audit", type: "header", apply: "x-audit: " },
	{ label: "x-correlation-id", type: "header", apply: "x-correlation-id: " },
	{ label: "x-debug", type: "header", apply: "x-debug: " },
	{
		label: "x-external-user-id",
		type: "header",
		apply: "x-external-user-id: ",
	},
	{
		label: "x-max-isolation-level",
		type: "header",
		apply: "x-max-isolation-level: ",
	},
	{ label: "x-original-uri", type: "header", apply: "x-original-uri: " },
	{ label: "x-request-id", type: "header", apply: "x-request-id: " },
	{ label: "x-use-ro-replica", type: "header", apply: "x-use-ro-replica: " },
	{ label: "su", type: "header", apply: "su: " },
	{ label: "traceparent", type: "header", apply: "traceparent: " },
];

// Header value completions by header name
const HEADER_VALUES: Record<string, Completion[]> = {
	"content-type": [
		{ label: "application/json", type: "text" },
		{ label: "application/fhir+json", type: "text" },
		{ label: "text/yaml", type: "text" },
		{ label: "application/ndjson", type: "text" },
		{ label: "application/gzip", type: "text" },
		{ label: "text/csv", type: "text" },
	],
	accept: [
		{ label: "application/json", type: "text" },
		{ label: "application/yaml", type: "text" },
		{ label: "text/yaml", type: "text" },
	],
	prefer: [
		{ label: "respond-async", type: "text" },
		{ label: "return=minimal", type: "text" },
		{ label: "return=representation", type: "text" },
		{ label: "return=OperationOutcome", type: "text" },
	],
	"x-debug": [{ label: "policy", type: "text" }],
	"x-max-isolation-level": [
		{ label: "read-committed", type: "text" },
		{ label: "repeatable-read", type: "text" },
		{ label: "serializable", type: "text" },
	],
	"cache-control": [
		{ label: "no-cache", type: "text" },
		{ label: "no-store", type: "text" },
		{ label: "max-age=0", type: "text" },
	],
	authorization: [
		{ label: "Bearer ", type: "text" },
		{ label: "Basic ", type: "text" },
	],
};

const HTTP_METHODS: Completion[] = [
	{ label: "GET", type: "keyword", apply: "GET /" },
	{ label: "POST", type: "keyword", apply: "POST /" },
	{ label: "PUT", type: "keyword", apply: "PUT /" },
	{ label: "PATCH", type: "keyword", apply: "PATCH /" },
	{ label: "DELETE", type: "keyword", apply: "DELETE /" },
];

function httpCompletionSource(
	context: CompletionContext,
): CompletionResult | null {
	const { state, pos } = context;
	const tree = syntaxTree(state);
	const node = tree.resolveInner(pos, -1);

	const line = state.doc.lineAt(pos);
	const beforeCursor = line.text.slice(0, pos - line.from);

	// Request method completion — first line, typing method
	if (
		node.type.id === HttpRequestMethod ||
		(line.number === 1 && /^\s*[a-zA-Z]*$/.test(beforeCursor))
	) {
		const word = context.matchBefore(/[a-zA-Z]*/);
		return {
			from: word?.from ?? pos,
			options: HTTP_METHODS,
			validFor: /^[a-zA-Z]*$/i,
		};
	}

	// Header value completion — after colon
	const colonIdx = beforeCursor.indexOf(":");
	if (colonIdx >= 0) {
		const inHeaderValue = node.type.id === HttpHeaderValue;
		const parentIsHeaders = node.parent?.type.id === HttpHeaders;
		if (
			!inHeaderValue &&
			!parentIsHeaders &&
			node.parent?.parent?.type.id !== HttpHeaders
		)
			return null;

		const headerName = beforeCursor.slice(0, colonIdx).trim().toLowerCase();
		const values = HEADER_VALUES[headerName];
		if (!values) return null;

		const word = context.matchBefore(/\S*/);
		return {
			from: word?.from ?? pos,
			options: values,
			validFor: /^\S*$/,
		};
	}

	// Header name completion — before colon
	const inHeaderName = node.type.id === HttpHeaderName;
	const inHeaders = node.type.id === HttpHeaders;
	const parentIsHeaders = node.parent?.type.id === HttpHeaders;

	if (!inHeaderName && !inHeaders && !parentIsHeaders) return null;

	const word = context.matchBefore(/[\w-]*/);
	return {
		from: word?.from ?? pos,
		options: COMMON_HEADERS,
		validFor: /^[\w-]*$/,
	};
}

export interface UrlSuggestion {
	label: string;
	value: string;
	type?: string;
	description?: string;
	expression?: string;
}

export type GetUrlSuggestions = (
	path: string,
	method: string,
) => UrlSuggestion[] | Promise<UrlSuggestion[]>;

function httpUrlCompletionSource(
	getUrlSuggestions: GetUrlSuggestions,
): (context: CompletionContext) => Promise<CompletionResult | null> {
	return async (context: CompletionContext): Promise<CompletionResult | null> => {
		const { state, pos } = context;
		const tree = syntaxTree(state);
		const node = tree.resolveInner(pos, -1);

		if (node.type.id !== HttpRequestPath) return null;

		const line = state.doc.lineAt(pos);
		const lineText = line.text;
		// Extract method from the beginning of the line
		const methodMatch = lineText.match(/^\s*(\w+)\s+/);
		if (!methodMatch?.[1]) return null;
		const method = methodMatch[1].toUpperCase();

		const pathStart = line.from + methodMatch[0].length;
		const currentPath = state.sliceDoc(pathStart, pos);

		const suggestions = await getUrlSuggestions(currentPath, method);
		if (suggestions.length === 0) return null;

		const options: Completion[] = suggestions.map((s) => {
			const c: Completion = {
				label: s.label,
				type:
					s.type === "resource-type"
						? "type"
						: s.type === "operation"
							? "function"
							: s.type === "search-param"
								? "search-param"
								: "text",
			};
			if (s.type === "search-param") c.apply = `${s.label}=`;
			if (s.description) c.detail = s.description.toUpperCase();
			if (s.expression) c.info = s.expression;
			return c;
		});

		// Match from the last segment separator (/ or ? or &)
		const hasQuery = currentPath.includes("?");
		let from: number;
		if (hasQuery) {
			const lastSep = Math.max(currentPath.lastIndexOf("?"), currentPath.lastIndexOf("&"));
			from = pathStart + lastSep + 1;
		} else {
			const lastSlash = currentPath.lastIndexOf("/");
			from = pathStart + lastSlash + 1;
		}

		return {
			from,
			options,
			validFor: /^[^\s&=]*/,
		};
	};
}

function http(
	bodyLanguages: (contentType: string) => Language | null,
	getUrlSuggestions?: GetUrlSuggestions,
) {
	const parser = makeParser(bodyLanguages);
	const language = LRLanguage.define({ parser: parser });
	const extensions = [
		httpMethodHighlighter,
		httpMethodTheme,
		language.data.of({ autocomplete: httpCompletionSource }),
	];
	if (getUrlSuggestions) {
		extensions.push(
			language.data.of({
				autocomplete: httpUrlCompletionSource(getUrlSuggestions),
			}),
		);
	}
	return new LanguageSupport(language, extensions);
}

export { http };
