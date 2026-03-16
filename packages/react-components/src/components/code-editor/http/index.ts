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

function http(bodyLanguages: (contentType: string) => Language | null) {
	const parser = makeParser(bodyLanguages);
	const language = LRLanguage.define({ parser: parser });
	return new LanguageSupport(language, [
		httpMethodHighlighter,
		httpMethodTheme,
	]);
}

export { http };
