import { EditorState } from '@codemirror/state';
import { crosshairCursor, drawSelection, dropCursor, EditorView, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, keymap, lineNumbers, rectangularSelection } from '@codemirror/view';
import { bracketMatching, defaultHighlightStyle, foldGutter, foldKeymap, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { lintKeymap } from '@codemirror/lint';
import { startServer } from '../src/index';
import { languageServerExtensions, LSPClient, type Transport } from '@codemirror/lsp-client';

const initialText = `Patient
  .name
  .where( use = 'official' )
  .first()`;

const defaultLspHandler = (data: string) => { console.log("!!!", data) };

const lspHandlerWrapper: { handler: (value: string) => void } = {
  handler: defaultLspHandler
}

const channel = new MessageChannel();
const editorPort = channel.port1;
const lspPort = channel.port2;

const aidboxUrl = "http://localhost:8765"

editorPort.onmessage = (ev) => {
  lspHandlerWrapper.handler(JSON.stringify(ev.data))
}

startServer({
  resolve: async (canonicalUrl: string) => {
    return await fetch(
      `${aidboxUrl}/api/types/resolve-canonical?${new URLSearchParams({ url: canonicalUrl })}`,
    ).then(r => r.json())
  },
  search: async (kind) => {
    return await fetch(
      `${aidboxUrl}/api/types/canonicals-by-kind?${new URLSearchParams({ kind: kind })}`,
    ).then(r => r.json())
  },
  port: lspPort
});

const lspTransport: Transport = {
  send(message: string) {
    console.log(">>>", message)
    editorPort.postMessage(JSON.parse(message));
  },
  subscribe(handler: (value: string) => void) {
    lspHandlerWrapper.handler = (value: string) => {
      console.log("<<<", value);
      handler(value);
    };
  },
  unsubscribe(_handler: (value: string) => void) {
    lspHandlerWrapper.handler = defaultLspHandler;
  }
}
const lspClient = new LSPClient({
  extensions: languageServerExtensions()

}).connect(lspTransport);

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
      ...lintKeymap
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
    lspClient.plugin("file:///doc.fhirpath")
  ],
});

const editorView = new EditorView({
  state: editorState,
  parent: document.getElementById("cm")!
})
