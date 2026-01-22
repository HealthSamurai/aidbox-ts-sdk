import {
	LSPClient,
	languageServerExtensions,
	type Transport,
} from "@codemirror/lsp-client";
import type { Extension } from "@codemirror/state";
import type { AidboxClient, Bundle } from "@health-samurai/aidbox-client";
import * as React from "react";
import { wrapCache } from "./idb-cache";
import type { Resource } from "./messages";
import { setContextType as setWorkerContextType, startServer } from "./wrapper";

type CreateCodeMirrorLspOpts = {
	debug?: boolean;
	contextType?: string;
};

type CreateResult = {
	extension: Extension;
	worker: Worker;
	setContextType: (contextType: string | null) => void;
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

	function transformOutgoingMessage(msg: any): any {
		// Prepend context type to document content before sending to LSP and adjust positions

		const prefix = getPrefix();
		const prefixLength = prefix.length;

		if (!prefix) return msg;

		if (
			msg.method === "textDocument/didOpen" &&
			msg.params?.textDocument?.text !== undefined
		) {
			return {
				...msg,
				params: {
					...msg.params,
					textDocument: {
						...msg.params.textDocument,
						text: prefix + msg.params.textDocument.text,
					},
				},
			};
		}

		if (msg.method === "textDocument/didChange" && msg.params?.contentChanges) {
			return {
				...msg,
				params: {
					...msg.params,
					contentChanges: msg.params.contentChanges.map((change: any) => {
						if (change.text !== undefined && change.range === undefined) {
							return { ...change, text: prefix + change.text };
						}
						if (change.range) {
							return {
								...change,
								text: change.text,
								range: {
									start: {
										line: change.range.start.line,
										character:
											change.range.start.character +
											(change.range.start.line === 0 ? prefixLength : 0),
									},
									end: {
										line: change.range.end.line,
										character:
											change.range.end.character +
											(change.range.end.line === 0 ? prefixLength : 0),
									},
								},
							};
						}
						return change;
					}),
				},
			};
		}

		if (msg.method === "textDocument/completion" && msg.params?.position) {
			return {
				...msg,
				params: {
					...msg.params,
					position: {
						line: msg.params.position.line,
						character:
							msg.params.position.character +
							(msg.params.position.line === 0 ? prefixLength : 0),
					},
				},
			};
		}

		if (msg.method === "textDocument/hover" && msg.params?.position) {
			return {
				...msg,
				params: {
					...msg.params,
					position: {
						line: msg.params.position.line,
						character:
							msg.params.position.character +
							(msg.params.position.line === 0 ? prefixLength : 0),
					},
				},
			};
		}

		if (msg.method === "textDocument/definition" && msg.params?.position) {
			return {
				...msg,
				params: {
					...msg.params,
					position: {
						line: msg.params.position.line,
						character:
							msg.params.position.character +
							(msg.params.position.line === 0 ? prefixLength : 0),
					},
				},
			};
		}

		if (msg.method === "textDocument/references" && msg.params?.position) {
			return {
				...msg,
				params: {
					...msg.params,
					position: {
						line: msg.params.position.line,
						character:
							msg.params.position.character +
							(msg.params.position.line === 0 ? prefixLength : 0),
					},
				},
			};
		}

		if (msg.method === "textDocument/codeAction" && msg.params?.range) {
			return {
				...msg,
				params: {
					...msg.params,
					range: {
						start: {
							line: msg.params.range.start.line,
							character:
								msg.params.range.start.character +
								(msg.params.range.start.line === 0 ? prefixLength : 0),
						},
						end: {
							line: msg.params.range.end.line,
							character:
								msg.params.range.end.character +
								(msg.params.range.end.line === 0 ? prefixLength : 0),
						},
					},
				},
			};
		}

		return msg;
	}

	function transformIncomingMessage(msg: any): any {
		// Adjust positions in incoming messages (diagnostics,
		// completions, etc). to account for removed prefix
		const prefix = getPrefix();
		const prefixLength = prefix.length;

		if (!prefix) return msg;

		if (
			msg.method === "textDocument/publishDiagnostics" &&
			msg.params?.diagnostics
		) {
			return {
				...msg,
				params: {
					...msg.params,
					diagnostics: msg.params.diagnostics
						.filter((diag: any) => {
							if (
								diag.range.start.line === 0 &&
								diag.range.end.line === 0 &&
								diag.range.start.character < prefixLength &&
								diag.range.end.character <= prefixLength
							) {
								return false;
							}
							return true;
						})
						.map((diag: any) => ({
							...diag,
							range: {
								start: {
									line: diag.range.start.line,
									character: Math.max(
										0,
										diag.range.start.character -
											(diag.range.start.line === 0 ? prefixLength : 0),
									),
								},
								end: {
									line: diag.range.end.line,
									character: Math.max(
										0,
										diag.range.end.character -
											(diag.range.end.line === 0 ? prefixLength : 0),
									),
								},
							},
						})),
				},
			};
		}

		function adjustRangeBackward(range: any): any {
			return {
				start: {
					line: range.start.line,
					character: Math.max(
						0,
						range.start.character - (range.start.line === 0 ? prefixLength : 0),
					),
				},
				end: {
					line: range.end.line,
					character: Math.max(
						0,
						range.end.character - (range.end.line === 0 ? prefixLength : 0),
					),
				},
			};
		}

		function adjustLocation(loc: any): any {
			if (loc?.range) {
				return { ...loc, range: adjustRangeBackward(loc.range) };
			}
			return loc;
		}

		if (msg.id !== undefined && msg.result && Array.isArray(msg.result)) {
			return {
				...msg,
				result: msg.result.map((item: any) => {
					if (item.textEdit?.range) {
						return {
							...item,
							textEdit: {
								...item.textEdit,
								range: adjustRangeBackward(item.textEdit.range),
							},
						};
					}
					return item;
				}),
			};
		}

		if (msg.id !== undefined && msg.result?.range) {
			return {
				...msg,
				result: {
					...msg.result,
					range: adjustRangeBackward(msg.result.range),
				},
			};
		}

		if (msg.id !== undefined && msg.result) {
			if (msg.result.range && msg.result.uri) {
				return {
					...msg,
					result: adjustLocation(msg.result),
				};
			}
			if (
				Array.isArray(msg.result) &&
				msg.result.length > 0 &&
				msg.result[0]?.range
			) {
				return {
					...msg,
					result: msg.result.map(adjustLocation),
				};
			}
		}

		if (msg.id !== undefined && msg.result && Array.isArray(msg.result)) {
			const hasSymbolRange =
				msg.result.length > 0 &&
				(msg.result[0]?.range || msg.result[0]?.location?.range);
			if (hasSymbolRange) {
				const adjustSymbol = (sym: any): any => {
					const adjusted = { ...sym };
					if (adjusted.range) {
						adjusted.range = adjustRangeBackward(adjusted.range);
					}
					if (adjusted.selectionRange) {
						adjusted.selectionRange = adjustRangeBackward(
							adjusted.selectionRange,
						);
					}
					if (adjusted.location?.range) {
						adjusted.location = adjustLocation(adjusted.location);
					}
					if (adjusted.children) {
						adjusted.children = adjusted.children.map(adjustSymbol);
					}
					return adjusted;
				};
				return {
					...msg,
					result: msg.result.map(adjustSymbol),
				};
			}
		}

		if (msg.id !== undefined && msg.result && Array.isArray(msg.result)) {
			const hasCodeAction =
				msg.result.length > 0 &&
				(msg.result[0]?.edit || msg.result[0]?.command);
			if (hasCodeAction) {
				return {
					...msg,
					result: msg.result.map((action: any) => {
						if (!action.edit?.changes && !action.edit?.documentChanges) {
							return action;
						}
						const adjusted = { ...action, edit: { ...action.edit } };
						if (adjusted.edit.changes) {
							adjusted.edit.changes = Object.fromEntries(
								Object.entries(adjusted.edit.changes).map(
									([uri, edits]: [string, any]) => [
										uri,
										edits.map((edit: any) => ({
											...edit,
											range: adjustRangeBackward(edit.range),
										})),
									],
								),
							);
						}
						if (adjusted.edit.documentChanges) {
							adjusted.edit.documentChanges = adjusted.edit.documentChanges.map(
								(change: any) => {
									if (change.edits) {
										return {
											...change,
											edits: change.edits.map((edit: any) => ({
												...edit,
												range: adjustRangeBackward(edit.range),
											})),
										};
									}
									return change;
								},
							);
						}
						return adjusted;
					}),
				};
			}
		}

		if (msg.id !== undefined && msg.result && Array.isArray(msg.result)) {
			const hasTextEdit =
				msg.result.length > 0 &&
				msg.result[0]?.range &&
				msg.result[0]?.newText !== undefined;
			if (hasTextEdit) {
				return {
					...msg,
					result: msg.result.map((edit: any) => ({
						...edit,
						range: adjustRangeBackward(edit.range),
					})),
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
	};
}

export type UseCodeMirrorLspResult = {
	extension: Extension;
	setContextType: (contextType: string | null) => void;
};

export function useCodeMirrorLsp(
	client: AidboxClient,
	opts: CreateCodeMirrorLspOpts,
): UseCodeMirrorLspResult {
	const [lspExtension, setLspExtension] = React.useState<Extension>([]);
	const ref = React.useRef<CreateResult | null>(null);

	const { debug, contextType } = opts;

	React.useEffect(() => {
		const result = createCodeMirrorLsp(client, { debug, contextType });
		ref.current = result;
		setLspExtension([result.extension]);

		return () => {
			result.worker.terminate();
		};
	}, [client, debug, contextType]);

	const setContextType = React.useCallback((newContextType: string | null) => {
		ref.current?.setContextType(newContextType);
	}, []);

	return {
		extension: lspExtension,
		setContextType,
	};
}
