/// <reference types="node" />
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const packageDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const COMPOSE_PROJECT = "aidbox-client-tests";

const FIXTURE_MARKER = "/AccessPolicy/basic-restricted-policy";

function compose(...args: string[]) {
	return execFileAsync("docker", ["compose", "-p", COMPOSE_PROJECT, ...args], {
		cwd: packageDir,
		maxBuffer: 64 * 1024 * 1024,
	});
}

function freePort(): Promise<number> {
	return new Promise((resolve, reject) => {
		const server = createServer();
		server.on("error", reject);
		server.listen(0, "127.0.0.1", () => {
			const address = server.address();
			if (address === null || typeof address === "string") {
				server.close();
				reject(new Error("could not determine a free port"));
				return;
			}
			server.close(() => resolve(address.port));
		});
	});
}

async function fixtureCredentials(): Promise<string> {
	const bundle = JSON.parse(
		await readFile(join(packageDir, "resources/bundle.json"), "utf8"),
	) as { entry: { request: { url: string }; resource: { secret?: string } }[] };
	const client = bundle.entry.find((e) => e.request.url === "/Client/basic");
	if (!client?.resource.secret) {
		throw new Error("resources/bundle.json no longer seeds Client/basic");
	}
	return `Basic ${btoa(`basic:${client.resource.secret}`)}`;
}

async function fetchMarker(baseUrl: string): Promise<Response> {
	try {
		return await fetch(`${baseUrl}${FIXTURE_MARKER}`, {
			headers: { authorization: await fixtureCredentials() },
			signal: AbortSignal.timeout(10_000),
		});
	} catch (cause) {
		throw new Error(`No Aidbox answering at ${baseUrl}`, { cause });
	}
}

export default async function setup() {
	const supplied = process.env.AIDBOX_BASE_URL;
	if (supplied) {
		const response = await fetchMarker(supplied);
		if (!response.ok) {
			throw new Error(
				`The Aidbox at ${supplied} was not seeded by packages/aidbox-client/resources/bundle.json ` +
					`(${FIXTURE_MARKER} returned ${response.status}). These tests truncate tables, so they refuse ` +
					`to touch an instance they do not recognise. Unset AIDBOX_BASE_URL to let them start their own.`,
			);
		}
		return;
	}

	const port = process.env.AIDBOX_PORT || String(await freePort());
	process.env.AIDBOX_PORT = port;
	const baseUrl = `http://localhost:${port}`;
	const teardown = async () => {
		await compose("down", "--volumes");
	};

	try {
		await compose("up", "--wait");
		const response = await fetchMarker(baseUrl);
		if (!response.ok) {
			throw new Error(
				`The instance at ${baseUrl} did not load resources/bundle.json (${FIXTURE_MARKER} returned ` +
					`${response.status}). An Aidbox without a licence reports itself healthy while serving nothing ` +
					`but its activation screen, so check BOX_LICENSE.`,
			);
		}
	} catch (error) {
		await teardown();
		throw error;
	}

	process.env.AIDBOX_BASE_URL = baseUrl;
	return teardown;
}
