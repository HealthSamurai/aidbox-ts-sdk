import { AidboxClient } from "src/client";
import type { Bundle, OperationOutcome } from "src/fhir-types/hl7-fhir-r4-core";
import { type AuthProvider, RequestError, type User } from "src/types";
import { describe, expect, it } from "vitest";

type FetchCall = { url: string; init?: RequestInit | undefined };

const jsonResponse = (body: unknown, status = 200): Response =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" },
	});

/** An AuthProvider that records every fetch call instead of hitting the network. */
class StubAuthProvider implements AuthProvider {
	public baseUrl: string;
	public calls: FetchCall[] = [];
	#respond: (url: string) => Response;

	constructor(
		baseUrl: string,
		respond: (url: string) => Response = () =>
			jsonResponse({ resourceType: "Bundle", type: "searchset" }),
	) {
		this.baseUrl = baseUrl;
		this.#respond = respond;
	}

	public async establishSession(): Promise<void> {}

	public async revokeSession(): Promise<void> {}

	public fetch = async (
		input: RequestInfo | URL,
		init?: RequestInit,
	): Promise<Response> => {
		const url = input instanceof Request ? input.url : String(input);
		this.calls.push({ url, init });
		return this.#respond(url);
	};

	public get urls(): string[] {
		return this.calls.map((call) => call.url);
	}
}

const makeClient = (
	provider: StubAuthProvider,
	baseUrl: string = provider.baseUrl,
) => new AidboxClient<Bundle, OperationOutcome, User>(baseUrl, provider);

describe("searchPage", () => {
	it("follows an absolute same-origin next link exactly once", async () => {
		const baseUrl = "http://localhost:8080";
		const nextUrl = "http://localhost:8080/fhir/Patient?_count=1&_page=2";

		const secondPage: Bundle = {
			resourceType: "Bundle",
			type: "searchset",
			link: [{ relation: "self", url: nextUrl }],
			entry: [{ resource: { resourceType: "Patient", id: "patient-2" } }],
		};

		const provider = new StubAuthProvider(baseUrl, () =>
			jsonResponse(secondPage),
		);
		const client = makeClient(provider);

		const firstPage: Bundle = {
			resourceType: "Bundle",
			type: "searchset",
			link: [
				{
					relation: "self",
					url: "http://localhost:8080/fhir/Patient?_count=1&_page=1",
				},
				{ relation: "next", url: nextUrl },
			],
		};

		const result = await client.searchPage({
			bundle: firstPage,
			relation: "next",
		});

		expect(provider.urls).toEqual([nextUrl]);
		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value.resource).toEqual(secondPage);
			expect(result.value.request.url).toBe("/fhir/Patient?_count=1&_page=2");
			expect(result.value.request.method).toBe("GET");
			expect(typeof result.value.duration).toBe("number");
			expect(result.value.responseHeaders["content-type"]).toContain(
				"application/json",
			);
		}
	});

	it.each([
		["relative to the FHIR base", "Patient?_page=3"],
		["absolute path", "/fhir/Patient?_page=3"],
	])("resolves an explicitly selected %s continuation", async (_name, url) => {
		const baseUrl = "http://localhost:8080";
		const provider = new StubAuthProvider(baseUrl);
		const client = makeClient(provider);

		const result = await client.searchPage({ url });

		expect(provider.urls).toEqual([
			"http://localhost:8080/fhir/Patient?_page=3",
		]);
		expect(result.isOk()).toBe(true);
	});

	it("defaults to the next relation", async () => {
		const baseUrl = "http://localhost:8080";
		const provider = new StubAuthProvider(baseUrl);
		const client = makeClient(provider);

		const bundle: Bundle = {
			resourceType: "Bundle",
			type: "searchset",
			link: [
				{ relation: "self", url: "/fhir/Patient?_page=1" },
				{ relation: "next", url: "/fhir/Patient?_page=2" },
			],
		};

		const result = await client.searchPage({ bundle });

		expect(provider.urls).toEqual([
			"http://localhost:8080/fhir/Patient?_page=2",
		]);
		expect(result.isOk()).toBe(true);
	});

	it.each([
		"previous",
		"prev",
		"first",
		"last",
	] as const)("selects the %s relation when requested", async (relation) => {
		const baseUrl = "http://localhost:8080";
		const provider = new StubAuthProvider(baseUrl);
		const client = makeClient(provider);

		const bundle: Bundle = {
			resourceType: "Bundle",
			type: "searchset",
			link: [
				{ relation: "next", url: "/fhir/Patient?_page=9" },
				{ relation, url: `/fhir/Patient?_page=${relation}` },
			],
		};

		await client.searchPage({ bundle, relation });

		expect(provider.urls).toEqual([
			`http://localhost:8080/fhir/Patient?_page=${relation}`,
		]);
	});

	it("refuses a missing relation without touching the transport", async () => {
		const baseUrl = "http://localhost:8080";
		const provider = new StubAuthProvider(baseUrl);
		const client = makeClient(provider);

		const bundle: Bundle = {
			resourceType: "Bundle",
			type: "searchset",
			link: [{ relation: "self", url: "/fhir/Patient?_page=1" }],
		};

		await expect(client.searchPage({ bundle })).rejects.toBeInstanceOf(
			RequestError,
		);
		await expect(
			client.searchPage({ bundle, relation: "previous" }),
		).rejects.toThrow(/previous/);
		expect(provider.calls).toHaveLength(0);
	});

	it("returns the OperationOutcome when the server rejects the page", async () => {
		const baseUrl = "http://localhost:8080";
		const outcome: OperationOutcome = {
			resourceType: "OperationOutcome",
			issue: [
				{
					severity: "error",
					code: "invalid",
					diagnostics: "page not found",
				},
			],
		};

		const provider = new StubAuthProvider(baseUrl, () =>
			jsonResponse(outcome, 400),
		);
		const client = makeClient(provider);

		const result = await client.searchPage({ url: "/fhir/Patient?_page=99" });

		expect(result.isErr()).toBe(true);
		if (result.isErr()) {
			expect(result.value.resource).toEqual(outcome);
			expect(result.value.response.status).toBe(400);
		}
	});

	it("reports the self link when the requested relation is missing", async () => {
		const baseUrl = "http://localhost:8080";
		const provider = new StubAuthProvider(baseUrl);
		const client = makeClient(provider);

		const selfUrl = "http://localhost:8080/fhir/Patient?_count=1&_page=9";
		const withSelf: Bundle = {
			resourceType: "Bundle",
			type: "searchset",
			link: [{ relation: "self", url: selfUrl }],
		};
		const withoutLinks: Bundle = {
			resourceType: "Bundle",
			type: "searchset",
		};

		await expect(
			client.searchPage({ bundle: withSelf }),
		).rejects.toHaveProperty("request.url", selfUrl);
		await expect(
			client.searchPage({ bundle: withoutLinks }),
		).rejects.toHaveProperty("request.url", "");
		expect(provider.calls).toHaveLength(0);
	});

	describe("confinement", () => {
		const baseUrl = "http://localhost:8080";

		it.each([
			["a foreign origin", "https://evil.example/fhir/Patient"],
			["a protocol-relative foreign origin", "//evil.example/fhir/Patient"],
			[
				"an origin hidden behind userinfo",
				"http://localhost:8080@evil.example/fhir/Patient",
			],
			["embedded credentials", "http://user:pw@localhost:8080/fhir/Patient"],
			[
				"a host with the base URL as a prefix",
				"http://localhost:8080.evil.example/fhir/Patient",
			],
			["a sibling path", "http://localhost:8080/fhir-evil/Patient"],
			["a path outside the FHIR base", "http://localhost:8080/other/Patient"],
			["the origin root", "http://localhost:8080/Patient"],
			["a traversal out of the FHIR base", "../other/Patient"],
			["an encoded path separator hiding a traversal", "/fhir/..%2f..%2frpc"],
			["a fully encoded traversal", "/fhir/%2e%2e%2f%2e%2e%2frpc"],
			["an encoded backslash separator", "/fhir/Patient%5c..%5cother"],
			["an encoded dot-segment traversal", "/fhir/%2e%2e/other"],
			["another port", "http://localhost:8081/fhir/Patient"],
			["another scheme", "https://localhost:8080/fhir/Patient"],
			["an unsupported scheme", "ftp://localhost:8080/fhir/Patient"],
			["an unparsable URL", "http://[bad"],
		])("rejects %s before any request is sent", async (_name, url) => {
			const provider = new StubAuthProvider(baseUrl);
			const client = makeClient(provider);

			await expect(client.searchPage({ url })).rejects.toBeInstanceOf(
				RequestError,
			);
			expect(provider.calls).toHaveLength(0);
		});

		it("rejects an untrusted link taken from a bundle", async () => {
			const provider = new StubAuthProvider(baseUrl);
			const client = makeClient(provider);

			const bundle: Bundle = {
				resourceType: "Bundle",
				type: "searchset",
				link: [{ relation: "next", url: "https://evil.example/fhir/Patient" }],
			};

			await expect(client.searchPage({ bundle })).rejects.toBeInstanceOf(
				RequestError,
			);
			expect(provider.calls).toHaveLength(0);
		});

		it("rejects a pathname that would be read as a network-path reference", async () => {
			const doubleSlashBase = "http://localhost:8080//";
			const provider = new StubAuthProvider(doubleSlashBase);
			const client = makeClient(provider);

			await expect(
				client.searchPage({
					url: "http://localhost:8080//fhir/Patient?_page=2",
				}),
			).rejects.toBeInstanceOf(RequestError);
			expect(provider.calls).toHaveLength(0);
		});

		it("rejects a continuation whose origin is a non-http scheme", async () => {
			// The origin matches the configured base URL here, so only the scheme
			// check can refuse this continuation.
			const ftpBase = "ftp://localhost:8080";
			const provider = new StubAuthProvider(ftpBase);
			const client = makeClient(provider);

			await expect(
				client.searchPage({ url: "ftp://localhost:8080/fhir/Patient" }),
			).rejects.toBeInstanceOf(RequestError);
			expect(provider.calls).toHaveLength(0);
		});

		it("accepts the FHIR base itself and drops a fragment", async () => {
			const provider = new StubAuthProvider(baseUrl);
			const client = makeClient(provider);

			await client.searchPage({
				url: "http://localhost:8080/fhir?_page=2#fragment",
			});

			expect(provider.urls).toEqual(["http://localhost:8080/fhir?_page=2"]);
		});
	});

	describe("with a base URL below a path prefix", () => {
		const baseUrl = "http://localhost:8080/aidbox";

		it("follows a continuation on the configured base path", async () => {
			const provider = new StubAuthProvider(baseUrl);
			const client = makeClient(provider);

			const result = await client.searchPage({
				url: "http://localhost:8080/aidbox/fhir/Patient?_page=2",
			});

			expect(provider.urls).toEqual([
				"http://localhost:8080/aidbox/fhir/Patient?_page=2",
			]);
			expect(result.isOk()).toBe(true);
		});

		it("rejects a continuation that drops the configured path prefix", async () => {
			const provider = new StubAuthProvider(baseUrl);
			const client = makeClient(provider);

			await expect(
				client.searchPage({
					url: "http://localhost:8080/fhir/Patient?_page=2",
				}),
			).rejects.toBeInstanceOf(RequestError);
			expect(provider.calls).toHaveLength(0);
		});
	});
});
