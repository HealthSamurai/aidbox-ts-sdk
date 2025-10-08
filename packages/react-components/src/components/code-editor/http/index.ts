import {
	foldInside,
	foldNodeProp,
	type Language,
	LanguageSupport,
	LRLanguage,
} from "@codemirror/language";
import { StateField, type Text } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { parseMixed } from "@lezer/common";
import { styleTags, tags } from "@lezer/highlight";
import type { LRParser } from "@lezer/lr";
import { parser } from "./lezer/http";

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

function isSpace(c: string | undefined) {
	return c === "\t" || c === " ";
}

type Component = {
	from: number;
	to: number;
	value: string;
};

type HttpLine = {
	method: Component;
	path: Component;
};

function extractHttpLine(doc: Text): HttpLine {
	const firstLine = doc.line(1);
	const firstLineString = firstLine.text;

	let methodFrom = 0;
	let methodTo = 0;

	for (methodTo = methodFrom; methodTo < firstLineString.length; ++methodTo) {
		const c = firstLineString[methodTo];
		if (isSpace(c)) {
			break;
		}
	}

	let pathFrom = methodTo;
	for (pathFrom = methodTo; pathFrom < firstLineString.length; ++pathFrom) {
		const c = firstLineString[pathFrom];
		if (!isSpace(c)) {
			break;
		}
	}

	// A bag of special cases to make behavior more pretty
	if (methodFrom === methodTo) {
		methodFrom = 0;
		methodTo = 0;
	}

	const pathValue = firstLineString.slice(pathFrom).trim();
	const pathTo = firstLineString.length;

	if (pathFrom === pathTo && pathFrom > methodTo + 1) {
		pathFrom = methodTo + 1;
	}

	return {
		method: {
			from: methodFrom,
			to: methodTo,
			value: firstLineString.slice(methodFrom, methodTo).trim(),
		},
		path: {
			from: pathFrom,
			to: firstLineString.length,
			value: pathValue,
		},
	};
}

const lineStateField = StateField.define<HttpLine>({
	create: (state) => {
		return extractHttpLine(state.doc);
	},

	update: (prev, transaction) => {
		if (transaction.docChanged) {
			return extractHttpLine(transaction.newDoc);
		} else {
			return prev;
		}
	},
});

function getMethod(view: EditorView): string {
	const currentLine = view.state.field(lineStateField);
	return currentLine.method.value;
}

function setMethod(view: EditorView, method: string) {
	const currentLine = view.state.field(lineStateField);
	view.dispatch({
		changes: {
			from: currentLine.method.from,
			to: currentLine.method.to,
			insert: method,
		},
	});
}

function getPath(view: EditorView): string {
	const currentLine = view.state.field(lineStateField);
	return currentLine.path.value;
}

function setPath(view: EditorView, path: string) {
	const currentLine = view.state.field(lineStateField);

	const shouldAddSpace = currentLine.method.to === currentLine.path.from;

	view.dispatch({
		changes: {
			from: currentLine.path.from,
			to: currentLine.path.to,
			insert: shouldAddSpace ? ` ${path}` : path,
		},
	});
}

function http(bodyLanguages: (contentType: string) => Language | null) {
	const parser = makeParser(bodyLanguages);
	const language = LRLanguage.define({ parser: parser });
	return new LanguageSupport(language, [lineStateField.extension]);
}

export { http, getMethod, setMethod, getPath, setPath };
