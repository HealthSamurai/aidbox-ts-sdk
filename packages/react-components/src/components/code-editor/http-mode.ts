import { StreamLanguage } from "@codemirror/language";
import { Tag } from "@lezer/highlight";

const httpMethodPost = Tag.define();
const httpMethodGet = Tag.define();
const httpMethodPut = Tag.define();
const httpMethodDelete = Tag.define();
const httpMethodPatch = Tag.define();
const httpMethodOther = Tag.define();
const httpUrl = Tag.define();
const httpHeaderKey = Tag.define();
const httpHeaderValue = Tag.define();

interface HTTPState {
	mode: "start" | "headers" | "body";
}

const httpStreamLanguage = StreamLanguage.define<HTTPState>({
	name: "http",

	tokenTable: {
		"http-method-post": httpMethodPost,
		"http-method-get": httpMethodGet,
		"http-method-put": httpMethodPut,
		"http-method-delete": httpMethodDelete,
		"http-method-patch": httpMethodPatch,
		"http-method-other": httpMethodOther,
		"http-url": httpUrl,
		"http-header-key": httpHeaderKey,
		"http-header-value": httpHeaderValue,
	},

	startState(): HTTPState {
		return {
			mode: "start",
		};
	},

	blankLine(state) {
		state.mode = "body";
	},

	token(stream, state) {
		if (state.mode === "body") {
			stream.skipToEnd();
			return null;
		}

		if (!(state.mode === "headers" && stream.sol()) && stream.eatSpace()) {
			return null;
		}

		if (state.mode === "start") {
			if (stream.match(/^POST\b/i)) {
				state.mode = "headers";
				return "http-method-post";
			}
			if (stream.match(/^GET\b/i)) {
				state.mode = "headers";
				return "http-method-get";
			}
			if (stream.match(/^PUT\b/i)) {
				state.mode = "headers";
				return "http-method-put";
			}
			if (stream.match(/^DELETE\b/i)) {
				state.mode = "headers";
				return "http-method-delete";
			}
			if (stream.match(/^PATCH\b/i)) {
				state.mode = "headers";
				return "http-method-patch";
			}
			if (stream.match(/^[A-Z]+\b/)) {
				state.mode = "headers";
				return "http-method-other";
			}

			if (stream.match(/^[^\n\r]+/)) {
				return "http-url";
			}

			stream.next();
			return null;
		}

		if (state.mode === "headers") {
			if (stream.sol()) {
				if (stream.match(/^[^:\n\r]+(?=:)/)) {
					return "http-header-key";
				}
				stream.skipToEnd();
				return null;
			}

			if (stream.match(/^:/)) {
				return null;
			}

			stream.skipToEnd();
			return "http-header-value";
		}

		stream.next();
		return null;
	},
});

export const httpLanguage = httpStreamLanguage;
export const httpHighlightStyle = [
	{ tag: httpMethodPost, color: "var(--color-utility-yellow)" },
	{ tag: httpMethodGet, color: "var(--color-utility-green)" },
	{ tag: httpMethodPut, color: "var(--color-utility-blue)" },
	{ tag: httpMethodDelete, color: "var(--color-utility-red)" },
	{ tag: httpMethodPatch, color: "var(--color-utility-violet)" },
	{ tag: httpMethodOther, color: "var(--foreground)" },
	{ tag: httpUrl, color: "var(--color-utility-violet)" },
	{ tag: httpHeaderKey, color: "#EA4A35" },
	{ tag: httpHeaderValue, color: "#405CBF" },
];
