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
	onChange,
}: {
	defaultValue?: string;
	onChange?: (value: string) => void;
}) {
	const editorRef = React.useRef(null);

	React.useEffect(() => {
		if (!editorRef.current) {
			return;
		}

		const view = new EditorView({
			parent: editorRef.current,
			state: EditorState.create({
				doc: defaultValue ?? "",
				extensions: [
					// Все расширения должны быть здесь
					lineNumbers(),
					foldGutter(),
					highlightSpecialChars(),
					history(),
					drawSelection(),
					dropCursor(),
					EditorState.allowMultipleSelections.of(true),
					indentOnInput(),
					json(), // JSON должен быть перед syntaxHighlighting
					syntaxHighlighting(customHighlightStyle),
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
					linter(jsonParseLinter(), { delay: 300 }),
					lintGutter(),
					// Listener для onChange
					EditorView.updateListener.of((update) => {
						if (update.docChanged && onChange) {
							onChange(update.view.state.doc.toString());
						}
					}),
				],
			}),
		});

		return () => view.destroy();
	}, [defaultValue, onChange]);

	return <div className="h-full w-full" ref={editorRef} />;
}
