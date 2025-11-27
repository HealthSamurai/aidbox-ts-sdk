import type { ServerOptions } from "minimal-lsp-server";
import type { WireMsg } from "./messages";

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

				opts
					.resolve(msg.canonicalUrl)
					.then((resource) => {
						const msg: WireMsg = {
							id: id,
							type: "resolveResponse",
							resource: resource,
						};
						worker.postMessage(msg);
					})
					.catch((reason) => {
						console.error(reason);
					});
			} else if (type === "searchRequest") {
				const msg = ev.data;
				const id = msg.id;

				opts
					.search(msg.kind)
					.then((resources) => {
						const msg: WireMsg = {
							id: id,
							type: "searchResponse",
							resources: resources,
						};
						worker.postMessage(msg);
					})
					.catch((reason) => {
						console.error(reason);
					});
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
