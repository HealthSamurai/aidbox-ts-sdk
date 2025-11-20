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
import { startServer } from "./wrapper";

type CreateCodeMirrorLspOpts = {
	debug?: boolean;
};

type CreateResult = {
	extension: Extension;
	worker: Worker;
};

export function createCodeMirrorLsp(
	client: AidboxClient,
	{ debug }: CreateCodeMirrorLspOpts,
): CreateResult {
	const defaultLspHandler = (data: string) => {
		if (debug) {
			console.log("!!!", data);
		}
	};

	let onLspMessageReceive: (value: string) => void = defaultLspHandler;

	const channel = new MessageChannel();
	const editorPort = channel.port1;
	const lspPort = channel.port2;

	editorPort.onmessage = (ev) => {
		onLspMessageReceive(JSON.stringify(ev.data));
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
			if (debug) {
				console.log(">>>", message);
			}
			editorPort.postMessage(JSON.parse(message));
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

	return {
		extension: lspClient.plugin("file:///doc.fhirpath"),
		worker: worker,
	};
}

export function useCodeMirrorLsp(
	client: AidboxClient,
	opts: CreateCodeMirrorLspOpts,
): Extension {
	const [lspExtension, setLspExtension] = React.useState<Extension>([]);
	const ref = React.useRef<CreateResult | null>(null);

	const { debug } = opts;

	React.useEffect(() => {
		const result = createCodeMirrorLsp(client, debug ? { debug: true } : {});
		ref.current = result;
		setLspExtension([result.extension]);

		return () => {
			result.worker.terminate();
		};
	}, [client, debug]);

	return lspExtension;
}
