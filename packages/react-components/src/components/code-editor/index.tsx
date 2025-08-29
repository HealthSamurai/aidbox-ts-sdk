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
import { EditorState } from "@codemirror/state";
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

export function CodeEditor({
	defaultValue,
	currentValue,
	onChange,
	id,
	mode = "json",
}: {
	defaultValue?: string;
	currentValue?: string;
	onChange?: (value: string) => void;
	id?: string;
	mode?: "json" | "http";
}) {
	const editorRef = React.useRef(null);
	const viewRef = React.useRef<EditorView | null>(null);

	const getLanguageExtensions = (mode: "json" | "http") => {
		if (mode === "http") {
			return [httpLanguage];
		} else {
			return [json(), linter(jsonParseLinter(), { delay: 300 })];
		}
	};

	const getSyntaxHighlighting = (mode: "json" | "http") => {
		if (mode === "http") {
			return syntaxHighlighting(HighlightStyle.define(httpHighlightStyle));
		} else {
			return syntaxHighlighting(customHighlightStyle);
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: we don't want to re-render the editor when the defaultValue or onChange changes
	React.useEffect(() => {
		if (!editorRef.current) {
			return;
		}

		const initialValue = currentValue ?? defaultValue ?? "";
		const view = new EditorView({
			parent: editorRef.current,
			state: EditorState.create({
				doc: initialValue,
				extensions: [
					lineNumbers(),
					foldGutter(),
					highlightSpecialChars(),
					history(),
					drawSelection(),
					dropCursor(),
					EditorState.allowMultipleSelections.of(true),
					indentOnInput(),
					...getLanguageExtensions(mode),
					getSyntaxHighlighting(mode),
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
					EditorView.updateListener.of((update) => {
						if (update.docChanged && onChange) {
							onChange(update.view.state.doc.toString());
						}
					}),
				],
			}),
		});

		viewRef.current = view;

		return () => {
			view.destroy();
			viewRef.current = null;
		};
	}, []);

	// Handle currentValue updates
	React.useEffect(() => {
		if (!viewRef.current || currentValue === undefined) {
			return;
		}

		const currentDoc = viewRef.current.state.doc.toString();
		if (currentDoc !== currentValue) {
			viewRef.current.dispatch({
				changes: {
					from: 0,
					to: currentDoc.length,
					insert: currentValue,
				},
			});
		}
	}, [currentValue]);

	return <div className="h-full w-full" ref={editorRef} id={id} />;
}
