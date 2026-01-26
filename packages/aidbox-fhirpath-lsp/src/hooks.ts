import {
	LSPClient,
	languageServerExtensions,
	type Transport,
} from "@codemirror/lsp-client";
import type { Extension } from "@codemirror/state";
import type { AidboxClient, Bundle } from "@health-samurai/aidbox-client";
import * as React from "react";
import type {
	CodeAction,
	CompletionItem,
	CompletionList,
	Diagnostic,
	DocumentSymbol,
	Hover,
	InsertReplaceEdit,
	Location,
	LocationLink,
	Position,
	Range,
	SymbolInformation,
	TextDocumentEdit,
	TextEdit,
	WorkspaceEdit,
} from "vscode-languageserver-types";
import { wrapCache } from "./idb-cache";
import type { Resource } from "./messages";
import { setContextType as setWorkerContextType, startServer } from "./wrapper";

// LSP Message types
interface LSPMessage {
	jsonrpc: "2.0";
	id?: number | string;
	method?: string;
	params?: unknown;
	result?: unknown;
	error?: { code: number; message: string; data?: unknown };
}

interface DidOpenTextDocumentParams {
	textDocument: {
		uri: string;
		languageId: string;
		version: number;
		text: string;
	};
}

interface TextDocumentContentChangeEvent {
	range?: Range;
	rangeLength?: number;
	text: string;
}

interface DidChangeTextDocumentParams {
	textDocument: { uri: string; version: number };
	contentChanges: TextDocumentContentChangeEvent[];
}

interface TextDocumentPositionParams {
	textDocument: { uri: string };
	position: Position;
}

interface CodeActionParams {
	textDocument: { uri: string };
	range: Range;
	context: { diagnostics: Diagnostic[] };
}

interface PublishDiagnosticsParams {
	uri: string;
	diagnostics: Diagnostic[];
}

type CreateCodeMirrorLspOpts = {
	debug?: boolean | undefined;
	contextType?: string | undefined;
};

type CreateResult = {
	extension: Extension;
	worker: Worker;
	setContextType: (contextType: string | null) => void;
	/** Create a plugin for a specific file URI - use this when you have multiple editors */
	createPlugin: (fileUri: string) => Extension;
};

export function createCodeMirrorLsp(
	client: AidboxClient,
	{ debug, contextType: initialContextType }: CreateCodeMirrorLspOpts,
): CreateResult {
	const defaultLspHandler = (data: string) => {
		if (debug) {
			console.log("!!!", data);
		}
	};

	let onLspMessageReceive: (value: string) => void = defaultLspHandler;
	let currentContextType: string | null = initialContextType ?? null;

	function getPrefix(): string {
		return currentContextType ? `${currentContextType}.` : "";
	}

	function adjustPositionForward(
		position: Position,
		prefixLength: number,
	): Position {
		return {
			line: position.line,
			character: position.character + (position.line === 0 ? prefixLength : 0),
		};
	}

	function adjustRangeForward(range: Range, prefixLength: number): Range {
		return {
			start: adjustPositionForward(range.start, prefixLength),
			end: adjustPositionForward(range.end, prefixLength),
		};
	}

	function transformOutgoingMessage(msg: LSPMessage): LSPMessage {
		// Prepend context type to document content before sending to LSP and adjust positions
		const prefix = getPrefix();
		const prefixLength = prefix.length;

		if (!prefix) return msg;

		if (msg.method === "textDocument/didOpen") {
			const params = msg.params as DidOpenTextDocumentParams;
			if (params?.textDocument?.text !== undefined) {
				return {
					...msg,
					params: {
						...params,
						textDocument: {
							...params.textDocument,
							text: prefix + params.textDocument.text,
						},
					},
				};
			}
		}

		if (msg.method === "textDocument/didChange") {
			const params = msg.params as DidChangeTextDocumentParams;
			if (params?.contentChanges) {
				return {
					...msg,
					params: {
						...params,
						contentChanges: params.contentChanges.map(
							(change: TextDocumentContentChangeEvent) => {
								// Full document sync
								if (change.text !== undefined && change.range === undefined) {
									return { ...change, text: prefix + change.text };
								}
								// Incremental sync - adjust range
								if (change.range) {
									return {
										...change,
										range: adjustRangeForward(change.range, prefixLength),
									};
								}
								return change;
							},
						),
					},
				};
			}
		}

		const positionMethods = [
			"textDocument/completion",
			"textDocument/hover",
			"textDocument/definition",
			"textDocument/references",
		];
		if (msg.method && positionMethods.includes(msg.method)) {
			const params = msg.params as TextDocumentPositionParams;
			if (params?.position) {
				return {
					...msg,
					params: {
						...params,
						position: adjustPositionForward(params.position, prefixLength),
					},
				};
			}
		}

		if (msg.method === "textDocument/codeAction") {
			const params = msg.params as CodeActionParams;
			if (params?.range) {
				return {
					...msg,
					params: {
						...params,
						range: adjustRangeForward(params.range, prefixLength),
						context: {
							...params.context,
							diagnostics: params.context.diagnostics.map((diag) => ({
								...diag,
								range: adjustRangeForward(diag.range, prefixLength),
							})),
						},
					},
				};
			}
		}

		return msg;
	}

	function adjustPositionBackward(
		position: Position,
		prefixLength: number,
	): Position {
		return {
			line: position.line,
			character: Math.max(
				0,
				position.character - (position.line === 0 ? prefixLength : 0),
			),
		};
	}

	function adjustRangeBackward(range: Range, prefixLength: number): Range {
		return {
			start: adjustPositionBackward(range.start, prefixLength),
			end: adjustPositionBackward(range.end, prefixLength),
		};
	}

	function adjustLocation(loc: Location, prefixLength: number): Location {
		return { ...loc, range: adjustRangeBackward(loc.range, prefixLength) };
	}

	function adjustTextEdit(edit: TextEdit, prefixLength: number): TextEdit {
		return { ...edit, range: adjustRangeBackward(edit.range, prefixLength) };
	}

	function adjustInsertReplaceEdit(
		edit: InsertReplaceEdit,
		prefixLength: number,
	): InsertReplaceEdit {
		return {
			...edit,
			insert: adjustRangeBackward(edit.insert, prefixLength),
			replace: adjustRangeBackward(edit.replace, prefixLength),
		};
	}

	function adjustLocationLink(
		link: LocationLink,
		prefixLength: number,
	): LocationLink {
		const adjusted: LocationLink = {
			...link,
			targetRange: adjustRangeBackward(link.targetRange, prefixLength),
			targetSelectionRange: adjustRangeBackward(
				link.targetSelectionRange,
				prefixLength,
			),
		};
		if (link.originSelectionRange) {
			adjusted.originSelectionRange = adjustRangeBackward(
				link.originSelectionRange,
				prefixLength,
			);
		}
		return adjusted;
	}

	function adjustCompletionItem(
		item: CompletionItem,
		prefixLength: number,
	): CompletionItem {
		const adjusted: CompletionItem = { ...item };

		if (item.textEdit) {
			if ("range" in item.textEdit) {
				// TextEdit
				adjusted.textEdit = adjustTextEdit(
					item.textEdit as TextEdit,
					prefixLength,
				);
			} else if ("insert" in item.textEdit && "replace" in item.textEdit) {
				// InsertReplaceEdit
				adjusted.textEdit = adjustInsertReplaceEdit(
					item.textEdit as InsertReplaceEdit,
					prefixLength,
				);
			}
		}

		if (item.additionalTextEdits) {
			adjusted.additionalTextEdits = item.additionalTextEdits.map((edit) =>
				adjustTextEdit(edit, prefixLength),
			);
		}

		return adjusted;
	}

	function isDiagnosticInPrefix(
		diag: Diagnostic,
		prefixLength: number,
	): boolean {
		return (
			diag.range.start.line === 0 &&
			diag.range.end.line === 0 &&
			diag.range.start.character < prefixLength &&
			diag.range.end.character <= prefixLength
		);
	}

	function adjustDocumentSymbol(
		sym: DocumentSymbol,
		prefixLength: number,
	): DocumentSymbol {
		const adjusted: DocumentSymbol = {
			...sym,
			range: adjustRangeBackward(sym.range, prefixLength),
			selectionRange: adjustRangeBackward(sym.selectionRange, prefixLength),
		};
		if (sym.children) {
			adjusted.children = sym.children.map((child) =>
				adjustDocumentSymbol(child, prefixLength),
			);
		}
		return adjusted;
	}

	function adjustSymbolInformation(
		sym: SymbolInformation,
		prefixLength: number,
	): SymbolInformation {
		return {
			...sym,
			location: adjustLocation(sym.location, prefixLength),
		};
	}

	function adjustWorkspaceEdit(
		edit: WorkspaceEdit,
		prefixLength: number,
	): WorkspaceEdit {
		const adjusted: WorkspaceEdit = { ...edit };

		if (edit.changes) {
			adjusted.changes = Object.fromEntries(
				Object.entries(edit.changes).map(([uri, edits]) => [
					uri,
					edits.map((e) => adjustTextEdit(e, prefixLength)),
				]),
			);
		}

		if (edit.documentChanges) {
			adjusted.documentChanges = edit.documentChanges.map((change) => {
				if (
					"edits" in change &&
					Array.isArray((change as TextDocumentEdit).edits)
				) {
					const docEdit = change as TextDocumentEdit;
					return {
						...docEdit,
						edits: docEdit.edits.map((e) =>
							adjustTextEdit(e as TextEdit, prefixLength),
						),
					};
				}
				return change;
			});
		}

		return adjusted;
	}

	function adjustCodeAction(
		action: CodeAction,
		prefixLength: number,
	): CodeAction {
		const adjusted: CodeAction = { ...action };
		if (action.edit) {
			adjusted.edit = adjustWorkspaceEdit(action.edit, prefixLength);
		}
		if (action.diagnostics) {
			adjusted.diagnostics = action.diagnostics.map((diag) => ({
				...diag,
				range: adjustRangeBackward(diag.range, prefixLength),
			}));
		}
		return adjusted;
	}

	function isObject(value: unknown): value is Record<string, unknown> {
		return typeof value === "object" && value !== null;
	}

	function isLocationResult(result: unknown): result is Location {
		return isObject(result) && "uri" in result && "range" in result;
	}

	function isLocationArray(result: unknown): result is Location[] {
		return (
			Array.isArray(result) && result.length > 0 && isLocationResult(result[0])
		);
	}

	function isLocationLink(result: unknown): result is LocationLink {
		return (
			isObject(result) &&
			"targetUri" in result &&
			"targetRange" in result &&
			"targetSelectionRange" in result
		);
	}

	function isLocationLinkArray(result: unknown): result is LocationLink[] {
		return (
			Array.isArray(result) && result.length > 0 && isLocationLink(result[0])
		);
	}

	function isCompletionItem(result: unknown): result is CompletionItem {
		return isObject(result) && "label" in result;
	}

	function isCompletionItemArray(result: unknown): result is CompletionItem[] {
		return (
			Array.isArray(result) && result.length > 0 && isCompletionItem(result[0])
		);
	}

	function isCompletionList(result: unknown): result is CompletionList {
		return (
			isObject(result) &&
			"items" in result &&
			Array.isArray((result as CompletionList).items) &&
			"isIncomplete" in result
		);
	}

	function isDocumentSymbol(result: unknown): result is DocumentSymbol {
		return isObject(result) && "selectionRange" in result;
	}

	function isDocumentSymbolArray(result: unknown): result is DocumentSymbol[] {
		return (
			Array.isArray(result) && result.length > 0 && isDocumentSymbol(result[0])
		);
	}

	function isSymbolInformation(result: unknown): result is SymbolInformation {
		return (
			isObject(result) && "location" in result && !("selectionRange" in result)
		);
	}

	function isSymbolInformationArray(
		result: unknown,
	): result is SymbolInformation[] {
		return (
			Array.isArray(result) &&
			result.length > 0 &&
			isSymbolInformation(result[0])
		);
	}

	function isCodeAction(result: unknown): result is CodeAction {
		return isObject(result) && "title" in result;
	}

	function isCodeActionArray(result: unknown): result is CodeAction[] {
		return (
			Array.isArray(result) && result.length > 0 && isCodeAction(result[0])
		);
	}

	function isTextEdit(result: unknown): result is TextEdit {
		return isObject(result) && "range" in result && "newText" in result;
	}

	function isTextEditArray(result: unknown): result is TextEdit[] {
		return Array.isArray(result) && result.length > 0 && isTextEdit(result[0]);
	}

	function isHoverResult(result: unknown): result is Hover {
		return (
			typeof result === "object" && result !== null && "contents" in result
		);
	}

	function transformIncomingMessage(msg: LSPMessage): LSPMessage {
		// Adjust positions in incoming messages (diagnostics,
		// completions, etc). to account for removed prefix
		const prefix = getPrefix();
		const prefixLength = prefix.length;

		if (!prefix) return msg;

		if (msg.method === "textDocument/publishDiagnostics") {
			const params = msg.params as PublishDiagnosticsParams;
			if (params?.diagnostics) {
				return {
					...msg,
					params: {
						...params,
						diagnostics: params.diagnostics
							.filter((diag) => !isDiagnosticInPrefix(diag, prefixLength))
							.map((diag) => ({
								...diag,
								range: adjustRangeBackward(diag.range, prefixLength),
							})),
					},
				};
			}
		}

		if (msg.id !== undefined && msg.result !== undefined) {
			const result = msg.result;

			if (isHoverResult(result) && result.range) {
				return {
					...msg,
					result: {
						...result,
						range: adjustRangeBackward(result.range, prefixLength),
					},
				};
			}

			if (isLocationResult(result)) {
				return {
					...msg,
					result: adjustLocation(result, prefixLength),
				};
			}

			if (isLocationArray(result)) {
				return {
					...msg,
					result: result.map((loc) => adjustLocation(loc, prefixLength)),
				};
			}

			if (isLocationLink(result)) {
				return {
					...msg,
					result: adjustLocationLink(result, prefixLength),
				};
			}

			if (isLocationLinkArray(result)) {
				return {
					...msg,
					result: result.map((link) => adjustLocationLink(link, prefixLength)),
				};
			}

			if (isDocumentSymbolArray(result)) {
				return {
					...msg,
					result: result.map((sym) => adjustDocumentSymbol(sym, prefixLength)),
				};
			}

			if (isSymbolInformationArray(result)) {
				return {
					...msg,
					result: result.map((sym) =>
						adjustSymbolInformation(sym, prefixLength),
					),
				};
			}

			if (isCodeActionArray(result)) {
				return {
					...msg,
					result: result.map((action) =>
						adjustCodeAction(action, prefixLength),
					),
				};
			}

			if (isCodeAction(result)) {
				return {
					...msg,
					result: adjustCodeAction(result, prefixLength),
				};
			}

			if (isTextEditArray(result)) {
				return {
					...msg,
					result: result.map((edit) => adjustTextEdit(edit, prefixLength)),
				};
			}

			if (isCompletionItemArray(result)) {
				return {
					...msg,
					result: result.map((item) =>
						adjustCompletionItem(item, prefixLength),
					),
				};
			}

			if (isCompletionList(result)) {
				return {
					...msg,
					result: {
						...result,
						items: result.items.map((item) =>
							adjustCompletionItem(item, prefixLength),
						),
					},
				};
			}

			if (isCompletionItem(result)) {
				return {
					...msg,
					result: adjustCompletionItem(result, prefixLength),
				};
			}
		}

		return msg;
	}

	const channel = new MessageChannel();
	const editorPort = channel.port1;
	const lspPort = channel.port2;

	editorPort.onmessage = (ev) => {
		const transformed = transformIncomingMessage(ev.data);
		onLspMessageReceive(JSON.stringify(transformed));
	};

	async function resolve(canonicalUrl: string): Promise<Resource | null> {
		const response = await client.request<Bundle>({
			method: "GET",
			url: "/fhir/StructureDefinition",
			params: [["url", canonicalUrl]],
		});

		if (!response.ok) {
			return null;
		} else {
			// There is type conflict between aidbox client and atomic
			// id of the StructureDefinition is not checked,
			// so we can safely cast here.
			return (response.value.resource.entry?.[0]?.resource ??
				null) as Resource | null;
		}
	}

	async function search(
		kind: "primitive-type" | "complex-type" | "resource",
	): Promise<Resource[]> {
		const response = await client.request<Bundle>({
			method: "GET",
			url: "/fhir/StructureDefinition",
			params: [["kind", kind]],
		});

		if (!response.ok) {
			return [];
		} else {
			return (
				response.value.resource.entry
					// There is type conflict between aidbox client and atomic
					// id of the StructureDefinition is not checked,
					// so we can safely cast here.
					?.map((entry) => entry.resource as Resource | undefined)
					.filter((resource) => resource !== undefined) ?? []
			);
		}
	}

	const lspTransport: Transport = {
		send(message: string) {
			const parsed = JSON.parse(message);
			const transformed = transformOutgoingMessage(parsed);
			if (debug) {
				console.log(">>>", JSON.stringify(transformed));
			}
			editorPort.postMessage(transformed);
		},
		subscribe(handler: (value: string) => void) {
			onLspMessageReceive = (value: string) => {
				if (debug) {
					console.log("<<<", value);
				}
				handler(value);
			};
		},
		unsubscribe(_handler: (value: string) => void) {
			onLspMessageReceive = defaultLspHandler;
		},
	};
	const lspClient = new LSPClient({
		extensions: languageServerExtensions(),
	}).connect(lspTransport);

	const worker = startServer(
		wrapCache({
			resolve: async (canonicalUrl: string) => {
				return await resolve(canonicalUrl);
			},
			search: async (kind) => {
				return await search(kind);
			},
			port: lspPort,
		}),
	);

	function setContextType(newContextType: string | null): void {
		currentContextType = newContextType;
		setWorkerContextType(worker, newContextType);
	}

	return {
		extension: lspClient.plugin("file:///doc.fhirpath"),
		worker: worker,
		setContextType,
		/** Create a plugin for a specific file URI - use this when you have multiple editors */
		createPlugin: (fileUri: string) => lspClient.plugin(fileUri),
	};
}

export type UseCodeMirrorLspResult = {
	extension: Extension;
	setContextType: (contextType: string | null) => void;
	/** Create a plugin for a specific file URI - use this when you have multiple editors */
	createPlugin: (fileUri: string) => Extension;
};

export function useCodeMirrorLsp(
	client: AidboxClient,
	opts: CreateCodeMirrorLspOpts,
): UseCodeMirrorLspResult {
	const [lspExtension, setLspExtension] = React.useState<Extension>([]);
	const [lspResult, setLspResult] = React.useState<CreateResult | null>(null);

	const { debug, contextType } = opts;

	React.useEffect(() => {
		const result = createCodeMirrorLsp(client, { debug, contextType });
		setLspResult(result);
		setLspExtension([result.extension]);

		return () => {
			result.worker.terminate();
			setLspResult(null);
		};
	}, [client, debug, contextType]);

	const setContextType = React.useCallback(
		(newContextType: string | null) => {
			lspResult?.setContextType(newContextType);
		},
		[lspResult],
	);

	const createPlugin = React.useCallback(
		(fileUri: string) => {
			if (!lspResult) {
				return [];
			}
			return lspResult.createPlugin(fileUri);
		},
		[lspResult],
	);

	return {
		extension: lspExtension,
		setContextType,
		createPlugin,
	};
}
