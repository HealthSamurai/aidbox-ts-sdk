import {
	foldInside,
	foldNodeProp,
	type Language,
	LanguageSupport,
	LRLanguage,
} from "@codemirror/language";
import { parseMixed } from "@lezer/common";
import { styleTags, tags } from "@lezer/highlight";
import type { LRParser } from "@lezer/lr";
import { parser } from "./grammar/http";

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

function http(bodyLanguages: (contentType: string) => Language | null) {
	const parser = makeParser(bodyLanguages);
	const language = LRLanguage.define({ parser: parser });
	return new LanguageSupport(language, []);
}

export { http };
