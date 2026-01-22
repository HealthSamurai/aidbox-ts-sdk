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
import {
	type AidboxClient,
	type AuthProvider,
	BrowserAuthProvider,
} from "@health-samurai/aidbox-client";
import { createCodeMirrorLsp } from "../src/index";

// Initial example - without the resource type prefix since we're using contextType
const initialText = `name
  .where( use = 'official' )
  .first()`;

// Get the initial context type from the dropdown
const contextTypeSelect = document.getElementById(
	"context-type",
) as HTMLSelectElement;
const initialContextType = contextTypeSelect?.value || "Patient";

const aidboxUrl = "http://localhost:8080";
const authProvider: AuthProvider = new BrowserAuthProvider(aidboxUrl);
const client: AidboxClient = new AidboxClient(aidboxUrl, authProvider);

// Create LSP with initial context type
const { extension: lspExtension, setContextType } = createCodeMirrorLsp(
	client,
	{
		debug: true,
		contextType: initialContextType,
	},
);

// Use a compartment to allow dynamic extension updates
const lspCompartment = new Compartment();

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
		lspCompartment.of(lspExtension),
	],
});

const cmElement = document.getElementById("cm");
if (cmElement === null) {
	throw Error("No #cm element");
}

const editorView = new EditorView({
	state: editorState,
	parent: cmElement,
});

// Handle context type dropdown changes
if (contextTypeSelect) {
	contextTypeSelect.addEventListener("change", (event) => {
		const target = event.target as HTMLSelectElement;
		const newContextType = target.value || null;
		console.log("Context type changed to:", newContextType);
		setContextType(newContextType);

		// Force re-validation by triggering a document change
		// This is a workaround to make the LSP re-analyze with the new context
		const currentDoc = editorView.state.doc.toString();
		editorView.dispatch({
			changes: { from: 0, to: currentDoc.length, insert: `${currentDoc} ` },
		});
		editorView.dispatch({
			changes: {
				from: currentDoc.length,
				to: currentDoc.length + 1,
				insert: "",
			},
		});
	});
}
