import {
	autocompletion,
	closeBrackets,
	closeBracketsKeymap,
	completionKeymap,
} from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { SQLDialect, sql } from "@codemirror/lang-sql";
import { yaml } from "@codemirror/lang-yaml";
import {
	bracketMatching,
	foldGutter,
	foldKeymap,
	HighlightStyle,
	indentOnInput,
	syntaxHighlighting,
} from "@codemirror/language";
import { linter, lintGutter, lintKeymap } from "@codemirror/lint";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { Compartment, EditorState } from "@codemirror/state";
import {
	crosshairCursor,
	drawSelection,
	dropCursor,
	EditorView,
	highlightActiveLine,
	highlightActiveLineGutter,
	highlightSpecialChars,
	keymap,
	lineNumbers,
	rectangularSelection,
	type ViewUpdate,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";
import * as React from "react";

import { http } from "./http";

const baseTheme = EditorView.baseTheme({
	"&": {
		backgroundColor: "var(--color-bg-primary)",
		height: "100%",
		width: "100%",
		fontSize: "14px",
		paddingTop: "8px",
		paddingBottom: "8px",
	},
	".cm-scroller": {
		overflow: "auto",
	},
	".cm-content": {
		fontFamily: "var(--font-family-mono)",
		padding: "0",
	},
	"&.cm-focused": {
		outline: "none",
	},
	".cm-gutter": {
		fontFamily: "var(--font-family-mono)",
	},
	".cm-gutters": {
		backgroundColor: "var(--color-bg-primary)",
		border: "none",
	},
	".cm-lineNumbers": {
		paddingLeft: "16px",
	},
	".cm-activeLineGutter": {
		backgroundColor: "var(--color-bg-primary)",
		color: "var(--color-text-primary)",
	},
	".cm-activeLine": {
		backgroundColor: "rgba(255, 255, 255, 0)",
	},
});

const readOnlyTheme = EditorView.theme({
	"&": {
		backgroundColor: "var(--color-bg-secondary)",
		height: "100%",
		width: "100%",
		fontSize: "14px",
		paddingTop: "8px",
		paddingBottom: "8px",
	},
	".cm-scroller": {
		overflow: "auto",
	},
	".cm-content": {
		fontFamily: "var(--font-family-mono)",
		padding: "0",
	},
	"&.cm-focused": {
		outline: "none",
	},
	".cm-gutter": {
		fontFamily: "var(--font-family-mono)",
	},
	".cm-gutters": {
		backgroundColor: "var(--color-bg-secondary)",
		border: "none",
	},
	".cm-lineNumbers": {
		paddingLeft: "16px",
	},
	".cm-activeLineGutter": {
		backgroundColor: "var(--color-bg-secondary)",
		color: "var(--color-text-primary)",
	},
	".cm-activeLine": {
		backgroundColor: "rgba(255, 255, 255, 0)",
	},
});

const customHighlightStyle = HighlightStyle.define([
	{ tag: tags.propertyName, color: "#EA4A35" },
	{ tag: tags.string, color: "#405CBF" },
	{ tag: tags.number, color: "#00A984" },
	{ tag: tags.bool, color: "#569cd6" },
	{ tag: tags.null, color: "#569cd6" },
	{ tag: tags.keyword, color: "#569cd6" },
	{ tag: tags.operatorKeyword, color: "#405CBF" },
	{ tag: tags.controlKeyword, color: "#EA4A35" },
	{ tag: tags.typeName, color: "#00A984" },
	{ tag: tags.variableName, color: "#EA4A35" },
	{ tag: tags.operator, color: "#405CBF" },
	{ tag: tags.comment, color: "#00A984" },
	{ tag: tags.lineComment, color: "#00A984" },
	{ tag: tags.blockComment, color: "#00A984" },
]);

const SQL_KEYWORDS = [
	"select",
	"from",
	"where",
	"and",
	"or",
	"not",
	"in",
	"between",
	"like",
	"insert",
	"update",
	"delete",
	"create",
	"drop",
	"alter",
	"table",
	"index",
	"join",
	"inner",
	"left",
	"right",
	"outer",
	"on",
	"as",
	"order",
	"by",
	"group",
	"having",
	"limit",
	"offset",
	"union",
	"intersect",
	"except",
	"distinct",
	"all",
	"exists",
	"case",
	"when",
	"then",
	"else",
	"end",
	"null",
	"true",
	"false",
	"is",
	"asc",
	"desc",
];

const SQL_BUILTIN = [
	"varchar",
	"char",
	"text",
	"integer",
	"int",
	"bigint",
	"decimal",
	"numeric",
	"float",
	"real",
	"boolean",
	"date",
	"time",
	"timestamp",
	"uuid",
	"count",
	"sum",
	"avg",
	"min",
	"max",
	"coalesce",
	"concat",
	"substring",
	"upper",
	"lower",
	"trim",
	"length",
	"now",
	"current_date",
	"current_time",
];

const customSQLDialect = SQLDialect.define({
	keywords: SQL_KEYWORDS.join(" "),
	builtin: SQL_BUILTIN.join(" "),
});

type LanguageMode = "json" | "http" | "sql" | "yaml";

function languageExtensions(mode: LanguageMode) {
	if (mode === "http") {
		const jsonLang = json();
		const yamlLang = yaml();
		return [
			http((ct) =>
				ct === "application/json"
					? jsonLang.language
					: ct === "text/yaml"
						? yamlLang.language
						: null,
			),
			syntaxHighlighting(customHighlightStyle),
		];
	} else if (mode === "sql") {
		return [
			sql({ dialect: customSQLDialect }),
			syntaxHighlighting(customHighlightStyle),
		];
	} else if (mode === "yaml") {
		return [yaml(), syntaxHighlighting(customHighlightStyle)];
	} else {
		return [
			json(),
			linter(jsonParseLinter(), { delay: 300 }),
			syntaxHighlighting(customHighlightStyle),
		];
	}
}

type CodeEditorProps = {
	readOnly?: boolean;
	defaultValue?: string;
	currentValue?: string;
	onChange?: (value: string) => void;
	onUpdate?: (update: ViewUpdate) => void;
	id?: string;
	mode?: LanguageMode;
	viewCallback?: (view: EditorView) => void;
};

export type CodeEditorView = EditorView;

export function CodeEditor({
	defaultValue,
	currentValue,
	onChange,
	onUpdate,
	viewCallback,
	readOnly = false,
	id,
	mode = "json",
}: CodeEditorProps) {
	const domRef = React.useRef(null);
	const [view, setView] = React.useState<EditorView | null>(null);

	const initialValue = React.useRef(defaultValue ?? "");

	const onChangeComparment = React.useRef(new Compartment());
	const onUpdateComparment = React.useRef(new Compartment());
	const languageCompartment = React.useRef(new Compartment());
	const readOnlyCompartment = React.useRef(new Compartment());
	const themeCompartment = React.useRef(new Compartment());

	React.useEffect(() => {
		if (!domRef.current) {
			return;
		}

		const view = new EditorView({
			parent: domRef.current,
			state: EditorState.create({
				doc: initialValue.current,
				extensions: [
					EditorView.contentAttributes.of({ "data-gramm": "false" }),
					readOnlyCompartment.current.of(EditorState.readOnly.of(false)),
					lineNumbers(),
					foldGutter(),
					highlightSpecialChars(),
					history(),
					drawSelection(),
					dropCursor(),
					EditorState.allowMultipleSelections.of(true),
					indentOnInput(),
					languageCompartment.current.of([]),
					bracketMatching(),
					closeBrackets(),
					autocompletion(),
					rectangularSelection(),
					crosshairCursor(),
					highlightActiveLine(),
					highlightActiveLineGutter(),
					highlightSelectionMatches(),
					themeCompartment.current.of(baseTheme),
					keymap.of([
						...closeBracketsKeymap,
						...defaultKeymap,
						...searchKeymap,
						...historyKeymap,
						...foldKeymap,
						...completionKeymap,
						...lintKeymap,
					]),
					lintGutter(),
					onChangeComparment.current.of([]),
					onUpdateComparment.current.of([]),
				],
			}),
		});

		setView(() => view);

		return () => {
			view.destroy();
			setView(() => null);
		};
	}, []);

	React.useEffect(() => {
		if (viewCallback && view) {
			viewCallback(view);
		}
	}, [view, viewCallback]);

	React.useEffect(() => {
		view?.dispatch({
			effects: onChangeComparment.current.reconfigure([
				EditorView.updateListener.of((update) => {
					if (update.docChanged && onChange) {
						onChange(update.view.state.doc.toString());
					}
				}),
			]),
		});
	}, [view, onChange]);

	React.useEffect(() => {
		view?.dispatch({
			effects: onUpdateComparment.current.reconfigure([
				EditorView.updateListener.of((update) => {
					if (onUpdate) {
						onUpdate(update);
					}
				}),
			]),
		});
	}, [view, onUpdate]);

	// FIXME: it is probably better to have CM manage its state.
	React.useEffect(() => {
		if (!view || currentValue === undefined) {
			return;
		}

		const currentDoc = view.state.doc.toString();
		if (currentDoc !== currentValue) {
			view.dispatch({
				changes: {
					from: 0,
					to: currentDoc.length,
					insert: currentValue,
				},
			});
		}
	}, [currentValue, view]);

	React.useEffect(() => {
		if (view === null) {
			return;
		}
		view.dispatch({
			effects: languageCompartment.current.reconfigure(
				languageExtensions(mode),
			),
		});
	}, [mode, view]);

	React.useEffect(() => {
		if (view === null) {
			return;
		}
		view.dispatch({
			effects: [
				readOnlyCompartment.current.reconfigure(
					EditorState.readOnly.of(readOnly),
				),
				themeCompartment.current.reconfigure(
					readOnly ? readOnlyTheme : baseTheme,
				),
			],
		});
	}, [readOnly, view]);

	return <div className="h-full w-full" ref={domRef} id={id} />;
}
