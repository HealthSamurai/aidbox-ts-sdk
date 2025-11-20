import {
	autocompletion,
	closeBrackets,
	closeBracketsKeymap,
	completionKeymap,
} from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
	bracketMatching,
	defaultHighlightStyle,
	foldGutter,
	foldKeymap,
	indentOnInput,
	syntaxHighlighting,
} from "@codemirror/language";
import { lintKeymap } from "@codemirror/lint";
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
import {
	type AidboxClient,
	type AuthProvider,
	BrowserAuthProvider,
	makeClient,
} from "@health-samurai/aidbox-client";
import { createCodeMirrorLsp } from "../src/index";

const initialText = `Patient
  .name
  .where( use = 'official' )
  .first()`;

const aidboxUrl = "http://localhost:8080";
const authProvider: AuthProvider = new BrowserAuthProvider(aidboxUrl);
const client: AidboxClient = makeClient({
	baseUrl: aidboxUrl,
	authProvider: authProvider,
});
const { extension: lspExtension } = createCodeMirrorLsp(client, {
	debug: true,
});

const editorState = EditorState.create({
	doc: initialText,
	extensions: [
		lineNumbers(),
		highlightActiveLineGutter(),
		highlightSpecialChars(),
		history(),
		foldGutter(),
		drawSelection(),
		dropCursor(),
		EditorState.allowMultipleSelections.of(true),
		indentOnInput(),
		syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
		bracketMatching(),
		closeBrackets(),
		autocompletion(),
		rectangularSelection(),
		crosshairCursor(),
		highlightActiveLine(),
		highlightSelectionMatches(),
		keymap.of([
			...closeBracketsKeymap,
			...defaultKeymap,
			...searchKeymap,
			...historyKeymap,
			...foldKeymap,
			...completionKeymap,
			...lintKeymap,
		]),
		// Theme for better visibility
		EditorView.theme({
			"&": {
				fontSize: "14px",
			},
			".cm-tooltip.cm-tooltip-autocomplete": {
				"& > ul": {
					fontFamily: "monospace",
					maxHeight: "200px",
					maxWidth: "400px",
				},
			},
		}),
		// autocompletion({
		//   activateOnTyping: true,
		//   activateOnTypingDelay: 0, // No delay for triggers
		//   selectOnOpen: true, // Auto-select first item
		//   closeOnBlur: true, // Close on blur
		//   maxRenderedOptions: 100, // Max items to render
		//   defaultKeymap: true, // Use default keybindings
		//   icons: true, // Add icons for completion types
		// }),
		// syntaxHighlighting(defaultHighlightStyle),
		lspExtension,
	],
});

const cmElement = document.getElementById("cm");
if (cmElement === null) {
	throw Error("No #cm element");
}

const _editorView = new EditorView({
	state: editorState,
	parent: cmElement,
});
