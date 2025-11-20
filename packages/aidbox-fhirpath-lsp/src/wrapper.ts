import type { ServerOptions } from "@atomic-ehr/fhirpath-lsp";
import type { Resource, WireMsg } from "./messages";

export function startServer(opts: ServerOptions): Worker {
	const worker = new Worker(new URL("./worker.js", import.meta.url), {
		type: "module",
	});

	try {
		worker.onmessage = (ev: MessageEvent<WireMsg>) => {
			const type = ev.data.type;
			if (type === "started") {
				// Do nothing
			} else if (type === "resolveRequest") {
				const msg = ev.data;
				const id = msg.id;

				const onFulfilled = (resource: Resource | null) => {
					const msg: WireMsg = {
						id: id,
						type: "resolveResponse",
						resource: resource,
					};
					worker.postMessage(msg);
				};

				const onRejected = (reason: unknown) => {
					console.error(reason);
					const msg: WireMsg = {
						id: id,
						type: "resolveError",
					};
					worker.postMessage(msg);
				};

				opts.resolve(msg.canonicalUrl).then(onFulfilled, onRejected);
			} else if (type === "searchRequest") {
				const msg = ev.data;
				const id = msg.id;

				const onFulfilled = (resources: Resource[]) => {
					const msg: WireMsg = {
						id: id,
						type: "searchResponse",
						resources: resources,
					};
					worker.postMessage(msg);
				};

				const onRejected = (reason: unknown) => {
					console.error(reason);
					const msg: WireMsg = {
						id: id,
						type: "searchError",
					};
					worker.postMessage(msg);
				};

				opts.search(msg.kind).then(onFulfilled, onRejected);
			}
		};

		const port = opts.port;
		const startCommand: WireMsg = {
			type: "start",
			port: port,
		};

		worker.postMessage(startCommand, [port]);
		return worker;
	} catch (e) {
		worker.terminate();
		throw e;
	}
}

export function terminateServer(worker: Worker): void {
	worker.terminate();
}
