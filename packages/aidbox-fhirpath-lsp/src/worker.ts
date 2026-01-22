import { startServer } from "@atomic-ehr/fhirpath-lsp";
import type { NumberedMsg, RequestMsg, Resource, WireMsg } from "./messages";

let seq = 0;
let started = false;

const promises: Record<
	number,
	[(msg: WireMsg) => void, (reason: unknown) => void]
> = {};

function query(msg: RequestMsg): Promise<WireMsg> {
	const id = seq;
	seq += 1;

	const wireMsg: NumberedMsg = { id: id, ...msg };

	self.postMessage(wireMsg);

	return new Promise((resolve, reject) => {
		promises[id] = [resolve, reject];
	});
}

async function resolve(canonicalUrl: string): Promise<Resource | null> {
	const msg = await query({
		type: "resolveRequest",
		canonicalUrl: canonicalUrl,
	});

	if (msg.type !== "resolveResponse") {
		throw Error("resolve: unexpected response type");
	}

	return msg.resource;
}

async function search(
	kind: "primitive-type" | "complex-type" | "resource",
): Promise<Resource[]> {
	const msg = await query({
		type: "searchRequest",
		kind: kind,
	});

	if (msg.type !== "searchResponse") {
		throw Error("search: unexpected response type");
	}

	return msg.resources ?? [];
}

self.onmessage = (msg: MessageEvent<WireMsg>) => {
	if (msg.data.type === "start") {
		if (started) {
			throw Error("Already started");
		}
		started = true;

		startServer({
			port: msg.data.port,
			resolve: resolve,
			search: search,
		});
	} else if (msg.data.type === "setContextType") {
		// Context type is handled at the hooks.ts level via message transformation.
		// This message is received but no action is needed in the worker.
		// The actual prefix prepending/stripping happens in the transport layer.
	} else if (
		msg.data.type === "resolveResponse" ||
		msg.data.type === "searchResponse"
	) {
		const data = msg.data;
		const id = data.id;
		if (typeof id !== "number") {
			throw Error("Bad message: id must be a number");
		}

		const promData = promises[id];
		if (promData === undefined) {
			throw Error("LSP desync: got message with unknown id");
		}
		const [resolve, _reject] = promData;
		resolve(msg.data);
		delete promises[msg.data.id];
	} else if (
		msg.data.type === "resolveError" ||
		msg.data.type === "searchError"
	) {
		const data = msg.data;
		const id = data.id;
		if (typeof id !== "number") {
			throw Error("Bad message: id must be a number");
		}

		const promData = promises[id];
		if (promData === undefined) {
			throw Error("LSP desync: got message with unknown id");
		}
		const [_resolve, reject] = promData;
		reject(new Error("LSP external error: could not fetch type definition"));
		delete promises[msg.data.id];
	} else {
		throw Error("Bad message: unexpected type.");
	}
};
