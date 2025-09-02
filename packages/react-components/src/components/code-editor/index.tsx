import {
	autocompletion,
	closeBrackets,
	closeBracketsKeymap,
	completionKeymap,
} from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { json, jsonParseLinter } from "@codemirror/lang-json";
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
} from "@codemirror/view";
import { tags } from "@lezer/highlight";
import * as React from "react";
import { httpHighlightStyle, httpLanguage } from "./http-mode";

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

const customHighlightStyle = HighlightStyle.define([
	{ tag: tags.propertyName, color: "#EA4A35" },
	{ tag: tags.string, color: "#405CBF" },
	{ tag: tags.number, color: "#00A984" },
	{ tag: tags.bool, color: "#569cd6" },
	{ tag: tags.null, color: "#569cd6" },
]);

type LanguageMode = "json" | "http";

function languageExtensions(mode: LanguageMode) {
	if (mode === "http") {
		return [
			httpLanguage,
			syntaxHighlighting(HighlightStyle.define(httpHighlightStyle)),
		];
	} else {
		return [
			json(),
			linter(jsonParseLinter(), { delay: 300 }),
			syntaxHighlighting(customHighlightStyle),
		];
	}
}

type CodeEditorProps = {
	defaultValue?: string;
	currentValue?: string;
	onChange?: (value: string) => void;
	id?: string;
	mode?: LanguageMode;
	viewCallback?: (view: EditorView) => void;
};

export type CodeEditorView = EditorView;

export function CodeEditor({
	defaultValue,
	currentValue,
	onChange,
	viewCallback,
	id,
	mode = "json",
}: CodeEditorProps) {
	const domRef = React.useRef(null);
	const [view, setView] = React.useState<EditorView | null>(null);

	const initialValue = React.useRef(defaultValue ?? "");

	const onChangeComparment = React.useRef(new Compartment());
	const languageCompartment = React.useRef(new Compartment());

	React.useEffect(() => {
		if (!domRef.current) {
			return;
		}

		const view = new EditorView({
			parent: domRef.current,
			state: EditorState.create({
				doc: initialValue.current,
				extensions: [
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
					baseTheme,
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
		console.log("Update");
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

	return <div className="h-full w-full" ref={domRef} id={id} />;
}
