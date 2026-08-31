import { ClientCredentialsAuthProvider } from "src/client-credentials";
import { ClientCredentialsAuthProvider as PublicClientCredentialsAuthProvider } from "src/index";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BASE_URL = "http://localhost:8080";
const DEFAULT_TOKEN_URL = "http://localhost:8080/auth/token";
const CLIENT_ID = "cc-client";
/** Contains characters that differ between raw UTF-8 and form-urlencoded Basic credentials. */
const CLIENT_SECRET = "s3cret-P@$$w0rd-ünïcode";

/**
 * Snapshot of one outgoing request.
 *
 * The provider mutates a single `RequestInit` across the initial send and the retry, so headers and body are captured at call time.
 */
type RecordedCall = {
	url: string;
	method: string | undefined;
	redirect: RequestRedirect | undefined;
	headers: Headers;
	body: BodyInit | null | undefined;
};

let calls: RecordedCall[] = [];

const urlOf = (input: RequestInfo | URL): string =>
	input instanceof Request ? input.url : input.toString();

const jsonResponse = (body: unknown, status = 200): Response =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" },
	});

const installFetch = (
	handler: (call: RecordedCall) => Response | Promise<Response>,
): void => {
	const mock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const requestHeaders =
			init?.headers ?? (input instanceof Request ? input.headers : undefined);
		const call: RecordedCall = {
			url: urlOf(input),
			method: init?.method,
			redirect: init?.redirect,
			headers: new Headers(requestHeaders),
			body: init?.body,
		};
		calls.push(call);
		return handler(call);
	});
	vi.stubGlobal("fetch", mock);
};

/** Default stub: token endpoint issues a fresh token per call, everything else is a Bundle. */
const installDefaultFetch = (tokenUrl = DEFAULT_TOKEN_URL): void => {
	let issued = 0;
	installFetch((call) => {
		if (call.url === tokenUrl) {
			issued += 1;
			return jsonResponse({
				access_token: `access-token-${issued}`,
				token_type: "Bearer",
				expires_in: 3600,
			});
		}
		return jsonResponse({ resourceType: "Bundle" });
	});
};

const tokenCalls = (tokenUrl = DEFAULT_TOKEN_URL): RecordedCall[] =>
	calls.filter((call) => call.url === tokenUrl);

const otherCalls = (tokenUrl = DEFAULT_TOKEN_URL): RecordedCall[] =>
	calls.filter((call) => call.url !== tokenUrl);

const bodyParams = (call: RecordedCall): URLSearchParams =>
	new URLSearchParams(String(call.body ?? ""));

const headerOf = (call: RecordedCall, name: string): string | null =>
	call.headers.get(name);

const expectedBasicHeader = (id: string, secret: string): string => {
	const utf8 = new TextEncoder().encode(`${id}:${secret}`);
	return `Basic ${btoa(String.fromCharCode(...utf8))}`;
};

beforeEach(() => {
	calls = [];
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("ClientCredentialsAuthProvider token request", () => {
	it("posts exactly one client_credentials request to the default Aidbox token endpoint", async () => {
		installDefaultFetch();
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		await provider.establishSession();

		expect(calls).toHaveLength(1);
		const call = calls[0] as RecordedCall;
		expect(call.url).toBe(DEFAULT_TOKEN_URL);
		expect(call.method).toBe("POST");
		expect(headerOf(call, "content-type")).toBe(
			"application/x-www-form-urlencoded",
		);
		expect(call.redirect).toBe("manual");
		expect(bodyParams(call).get("grant_type")).toBe("client_credentials");
	});

	it("authenticates with raw UTF-8 HTTP Basic credentials and keeps the secret out of body and URL", async () => {
		installDefaultFetch();
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		await provider.establishSession();

		const call = tokenCalls()[0] as RecordedCall;
		expect(headerOf(call, "authorization")).toBe(
			expectedBasicHeader(CLIENT_ID, CLIENT_SECRET),
		);
		expect(bodyParams(call).has("client_secret")).toBe(false);
		expect(String(call.body ?? "")).not.toContain(CLIENT_SECRET);
		expect(call.url).not.toContain(CLIENT_SECRET);
		expect(call.url).not.toContain(CLIENT_ID);
	});

	it("sends client_id and client_secret in the form body in body mode", async () => {
		installDefaultFetch();
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
			clientAuthentication: "body",
		});

		await provider.establishSession();

		const call = tokenCalls()[0] as RecordedCall;
		expect(headerOf(call, "authorization")).toBeNull();
		const params = bodyParams(call);
		expect(params.get("client_id")).toBe(CLIENT_ID);
		expect(params.get("client_secret")).toBe(CLIENT_SECRET);
		expect(call.url).not.toContain(CLIENT_SECRET);
	});

	it("omits scope when it is not configured", async () => {
		installDefaultFetch();
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		await provider.establishSession();

		expect(bodyParams(tokenCalls()[0] as RecordedCall).has("scope")).toBe(
			false,
		);
	});

	it("sends scope when it is configured", async () => {
		installDefaultFetch();
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
			scope: "system/*.read",
		});

		await provider.establishSession();

		expect(bodyParams(tokenCalls()[0] as RecordedCall).get("scope")).toBe(
			"system/*.read",
		);
	});

	it("honors a custom absolute token endpoint", async () => {
		const customTokenUrl = "http://localhost:8080/auth/custom-token";
		installDefaultFetch(customTokenUrl);
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
			tokenEndpoint: customTokenUrl,
		});

		await provider.establishSession();

		expect(calls).toHaveLength(1);
		expect((calls[0] as RecordedCall).url).toBe(customTokenUrl);
	});

	it("sends the issued access token as a Bearer credential on requests", async () => {
		installDefaultFetch();
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		const response = await provider.fetch(`${BASE_URL}/fhir/Patient`);

		expect(response.status).toBe(200);
		const apiCall = otherCalls()[0] as RecordedCall;
		expect(headerOf(apiCall, "authorization")).toBe("Bearer access-token-1");
	});
});

describe("ClientCredentialsAuthProvider token caching", () => {
	it("reuses an unexpired cached token for later requests", async () => {
		installDefaultFetch();
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		await provider.fetch(`${BASE_URL}/fhir/Patient`);
		await provider.fetch(`${BASE_URL}/fhir/Observation`);

		expect(tokenCalls()).toHaveLength(1);
		expect(headerOf(otherCalls()[0] as RecordedCall, "authorization")).toBe(
			"Bearer access-token-1",
		);
		expect(headerOf(otherCalls()[1] as RecordedCall, "authorization")).toBe(
			"Bearer access-token-1",
		);
	});

	it("caches tokens when the server omits expires_in", async () => {
		let issued = 0;
		installFetch((call) => {
			if (call.url === DEFAULT_TOKEN_URL) {
				issued += 1;
				return jsonResponse({
					access_token: `access-token-${issued}`,
					token_type: "Bearer",
				});
			}
			return jsonResponse({ resourceType: "Bundle" });
		});
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		await provider.fetch(`${BASE_URL}/fhir/Patient`);
		await provider.fetch(`${BASE_URL}/fhir/Observation`);

		expect(tokenCalls()).toHaveLength(1);
	});

	it("refreshes a token whose remaining lifetime falls inside the expiration buffer", async () => {
		let issued = 0;
		installFetch((call) => {
			if (call.url === DEFAULT_TOKEN_URL) {
				issued += 1;
				return jsonResponse({
					access_token: `access-token-${issued}`,
					token_type: "Bearer",
					expires_in: 20,
				});
			}
			return jsonResponse({ resourceType: "Bundle" });
		});
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
			tokenExpirationBuffer: 30,
		});

		await provider.fetch(`${BASE_URL}/fhir/Patient`);
		await provider.fetch(`${BASE_URL}/fhir/Observation`);

		expect(tokenCalls()).toHaveLength(2);
		expect(headerOf(otherCalls()[1] as RecordedCall, "authorization")).toBe(
			"Bearer access-token-2",
		);
	});

	it("keeps a token that outlives a smaller expiration buffer", async () => {
		let issued = 0;
		installFetch((call) => {
			if (call.url === DEFAULT_TOKEN_URL) {
				issued += 1;
				return jsonResponse({
					access_token: `access-token-${issued}`,
					token_type: "Bearer",
					expires_in: 20,
				});
			}
			return jsonResponse({ resourceType: "Bundle" });
		});
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
			tokenExpirationBuffer: 0,
		});

		await provider.fetch(`${BASE_URL}/fhir/Patient`);
		await provider.fetch(`${BASE_URL}/fhir/Observation`);

		expect(tokenCalls()).toHaveLength(1);
	});

	it("obtains a new token after revokeSession cleared the cached one", async () => {
		installDefaultFetch();
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		await provider.establishSession();
		await provider.revokeSession();
		await provider.fetch(`${BASE_URL}/fhir/Patient`);

		expect(tokenCalls()).toHaveLength(2);
		expect(headerOf(otherCalls()[0] as RecordedCall, "authorization")).toBe(
			"Bearer access-token-2",
		);
	});
});

describe("ClientCredentialsAuthProvider concurrent acquisition", () => {
	it("collapses concurrent requests on a cold provider into one token request", async () => {
		installDefaultFetch();
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		await Promise.all([
			provider.fetch(`${BASE_URL}/fhir/Patient`),
			provider.fetch(`${BASE_URL}/fhir/Observation`),
			provider.fetch(`${BASE_URL}/fhir/Encounter`),
			provider.fetch(`${BASE_URL}/fhir/Condition`),
			provider.fetch(`${BASE_URL}/fhir/Practitioner`),
		]);

		expect(tokenCalls()).toHaveLength(1);
		expect(otherCalls()).toHaveLength(5);
		for (const call of otherCalls()) {
			expect(headerOf(call, "authorization")).toBe("Bearer access-token-1");
		}
	});

	it("waits for a pending acquisition before revokeSession clears the cache", async () => {
		installDefaultFetch();
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		const pending = provider.establishSession();
		await provider.revokeSession();
		await pending;

		await provider.fetch(`${BASE_URL}/fhir/Patient`);

		expect(tokenCalls()).toHaveLength(2);
		expect(headerOf(otherCalls()[0] as RecordedCall, "authorization")).toBe(
			"Bearer access-token-2",
		);
	});
});

describe("ClientCredentialsAuthProvider header handling", () => {
	it("preserves caller headers supplied on init", async () => {
		installDefaultFetch();
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		await provider.fetch(`${BASE_URL}/fhir/Patient`, {
			method: "POST",
			headers: {
				"content-type": "application/fhir+json",
				"x-request-id": "req-42",
			},
			body: "{}",
		});

		const call = otherCalls()[0] as RecordedCall;
		expect(headerOf(call, "content-type")).toBe("application/fhir+json");
		expect(headerOf(call, "x-request-id")).toBe("req-42");
		expect(headerOf(call, "authorization")).toBe("Bearer access-token-1");
	});

	it("preserves headers supplied on a Request input", async () => {
		installDefaultFetch();
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		const request = new Request(`${BASE_URL}/fhir/Patient`, {
			headers: { accept: "application/fhir+json", "x-trace": "trace-7" },
		});
		await provider.fetch(request);

		const call = otherCalls()[0] as RecordedCall;
		expect(headerOf(call, "accept")).toBe("application/fhir+json");
		expect(headerOf(call, "x-trace")).toBe("trace-7");
		expect(headerOf(call, "authorization")).toBe("Bearer access-token-1");
	});

	it("replaces a caller-supplied Authorization header with the Bearer token", async () => {
		installDefaultFetch();
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		await provider.fetch(`${BASE_URL}/fhir/Patient`, {
			headers: { authorization: "Basic stale" },
		});

		expect(headerOf(otherCalls()[0] as RecordedCall, "authorization")).toBe(
			"Bearer access-token-1",
		);
	});
});

describe("ClientCredentialsAuthProvider base URL confinement", () => {
	it("rejects a URL outside baseUrl before any network call", async () => {
		installDefaultFetch();
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		await expect(
			provider.fetch("https://other-server.example.com/fhir/Patient"),
		).rejects.toThrow("URL of the request must start with baseUrl");
		expect(calls).toHaveLength(0);
	});

	it("rejects a Request input outside baseUrl before any network call", async () => {
		installDefaultFetch();
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		await expect(
			provider.fetch(new Request("https://other-server.example.com/fhir")),
		).rejects.toThrow("URL of the request must start with baseUrl");
		expect(calls).toHaveLength(0);
	});
});

/** Read a recorded request body, including teed streams, back into a string. */
const readBody = async (body: BodyInit | null | undefined): Promise<string> => {
	if (body === null || body === undefined) return "";
	return new Response(body).text();
};

describe("ClientCredentialsAuthProvider 401 handling", () => {
	it("clears the token and retries once with a fresh token after a 401", async () => {
		let issued = 0;
		let apiAttempts = 0;
		installFetch((call) => {
			if (call.url === DEFAULT_TOKEN_URL) {
				issued += 1;
				return jsonResponse({
					access_token: `access-token-${issued}`,
					token_type: "Bearer",
					expires_in: 3600,
				});
			}
			apiAttempts += 1;
			return apiAttempts === 1
				? jsonResponse({ resourceType: "OperationOutcome" }, 401)
				: jsonResponse({ resourceType: "Bundle" });
		});
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		const response = await provider.fetch(`${BASE_URL}/fhir/Patient`, {
			method: "POST",
			body: "payload",
		});

		expect(response.status).toBe(200);
		expect(calls.map((call) => call.url)).toEqual([
			DEFAULT_TOKEN_URL,
			`${BASE_URL}/fhir/Patient`,
			DEFAULT_TOKEN_URL,
			`${BASE_URL}/fhir/Patient`,
		]);
		expect(headerOf(otherCalls()[0] as RecordedCall, "authorization")).toBe(
			"Bearer access-token-1",
		);
		expect(headerOf(otherCalls()[1] as RecordedCall, "authorization")).toBe(
			"Bearer access-token-2",
		);
		await expect(
			readBody((otherCalls()[1] as RecordedCall).body),
		).resolves.toBe("payload");
	});

	it("returns a second 401 without a third attempt", async () => {
		let issued = 0;
		installFetch((call) => {
			if (call.url === DEFAULT_TOKEN_URL) {
				issued += 1;
				return jsonResponse({
					access_token: `access-token-${issued}`,
					token_type: "Bearer",
					expires_in: 3600,
				});
			}
			return jsonResponse({ resourceType: "OperationOutcome" }, 401);
		});
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		const response = await provider.fetch(`${BASE_URL}/fhir/Patient`);

		expect(response.status).toBe(401);
		expect(otherCalls()).toHaveLength(2);
		expect(tokenCalls()).toHaveLength(2);
	});

	it("replays a ReadableStream body on the retry", async () => {
		let issued = 0;
		let apiAttempts = 0;
		installFetch((call) => {
			if (call.url === DEFAULT_TOKEN_URL) {
				issued += 1;
				return jsonResponse({
					access_token: `access-token-${issued}`,
					token_type: "Bearer",
					expires_in: 3600,
				});
			}
			apiAttempts += 1;
			return apiAttempts === 1
				? jsonResponse({ resourceType: "OperationOutcome" }, 401)
				: jsonResponse({ resourceType: "Bundle" });
		});
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(new TextEncoder().encode("streamed-body"));
				controller.close();
			},
		});

		const response = await provider.fetch(`${BASE_URL}/fhir/Patient`, {
			method: "POST",
			body: stream,
			// @ts-expect-error `duplex` is required by Node for streaming bodies but missing from lib.dom types.
			duplex: "half",
		});

		expect(response.status).toBe(200);
		expect(otherCalls()).toHaveLength(2);
		await expect(
			readBody((otherCalls()[0] as RecordedCall).body),
		).resolves.toBe("streamed-body");
		await expect(
			readBody((otherCalls()[1] as RecordedCall).body),
		).resolves.toBe("streamed-body");
	});

	it("returns the original 401 when the request body cannot be replayed", async () => {
		installFetch((call) => {
			if (call.url === DEFAULT_TOKEN_URL) {
				return jsonResponse({
					access_token: "access-token-1",
					token_type: "Bearer",
					expires_in: 3600,
				});
			}
			return jsonResponse({ resourceType: "OperationOutcome" }, 401);
		});
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		const nonReplayableBody = (async function* () {
			yield new TextEncoder().encode("chunk");
		})() as unknown as BodyInit;

		const response = await provider.fetch(`${BASE_URL}/fhir/Patient`, {
			method: "POST",
			body: nonReplayableBody,
			// @ts-expect-error `duplex` is required by Node for streaming bodies but missing from lib.dom types.
			duplex: "half",
		});

		expect(response.status).toBe(401);
		expect(otherCalls()).toHaveLength(1);
		expect(tokenCalls()).toHaveLength(1);
	});
});

/** Collect the message of an error and of every error in its `cause` chain. */
const errorChainText = (error: unknown): string => {
	const parts: string[] = [];
	let current: unknown = error;
	while (current !== undefined && current !== null) {
		parts.push(String(current));
		if (current instanceof Error) {
			parts.push(JSON.stringify(current, Object.getOwnPropertyNames(current)));
			current = current.cause;
		} else {
			break;
		}
	}
	return parts.join(" ");
};

describe("ClientCredentialsAuthProvider credential hygiene", () => {
	it("keeps the secret and the access token out of the serialized provider", async () => {
		installDefaultFetch();
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		await provider.establishSession();

		const serialized = JSON.stringify(provider);
		expect(serialized).not.toContain(CLIENT_SECRET);
		expect(serialized).not.toContain("access-token-1");
		expect(JSON.stringify(Object.keys(provider))).not.toContain("clientSecret");
	});

	it("redacts the secret from a token endpoint error that echoes it", async () => {
		installFetch(() =>
			jsonResponse(
				{
					error: "invalid_client",
					error_description: `client secret ${CLIENT_SECRET} was rejected`,
				},
				400,
			),
		);
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		const error = await provider.establishSession().catch((e: unknown) => e);

		expect(error).toBeInstanceOf(Error);
		const text = errorChainText(error);
		expect(text).not.toContain(CLIENT_SECRET);
		expect(text).toContain("400");
		expect(text).toContain("invalid_client");
	});

	it("reports the status and diagnostics of a non-OAuth token endpoint error", async () => {
		installFetch(() =>
			jsonResponse(
				{
					resourceType: "OperationOutcome",
					issue: [
						{
							severity: "fatal",
							code: "security",
							diagnostics: "Client [cc-client] is not found",
						},
					],
				},
				401,
			),
		);
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		const error = await provider.establishSession().catch((e: unknown) => e);

		const text = errorChainText(error);
		expect(text).toContain("401");
		expect(text).toContain("Client [cc-client] is not found");
		expect(text).not.toContain(CLIENT_SECRET);
	});

	it("rejects a token response without an access token", async () => {
		installFetch(() =>
			jsonResponse({ token_type: "Bearer", expires_in: 3600 }),
		);
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		await expect(provider.establishSession()).rejects.toThrow(
			"Token endpoint response is missing access_token",
		);
	});

	it("never writes the secret to the console", async () => {
		const consoleSinks = (
			["debug", "error", "info", "log", "warn"] as const
		).map((level) => vi.spyOn(console, level).mockImplementation(() => {}));

		let issued = 0;
		let apiAttempts = 0;
		installFetch((call) => {
			if (call.url === DEFAULT_TOKEN_URL) {
				issued += 1;
				if (issued > 2) {
					return jsonResponse(
						{ error: "invalid_client", error_description: CLIENT_SECRET },
						400,
					);
				}
				return jsonResponse({
					access_token: `access-token-${issued}`,
					token_type: "Bearer",
					expires_in: 3600,
				});
			}
			apiAttempts += 1;
			return apiAttempts === 1
				? jsonResponse({ resourceType: "OperationOutcome" }, 401)
				: jsonResponse({ resourceType: "Bundle" });
		});

		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		await provider.fetch(`${BASE_URL}/fhir/Patient`);
		await provider.revokeSession();
		await provider.establishSession().catch(() => undefined);

		for (const sink of consoleSinks) {
			for (const args of sink.mock.calls) {
				expect(JSON.stringify(args)).not.toContain(CLIENT_SECRET);
			}
		}
	});
});

describe("ClientCredentialsAuthProvider public API", () => {
	it("is exported from the package entry point", () => {
		expect(PublicClientCredentialsAuthProvider).toBe(
			ClientCredentialsAuthProvider,
		);
	});
});

describe("ClientCredentialsAuthProvider configuration validation", () => {
	it("rejects a relative token endpoint at construction time", () => {
		expect(
			() =>
				new ClientCredentialsAuthProvider({
					baseUrl: BASE_URL,
					clientId: CLIENT_ID,
					clientSecret: CLIENT_SECRET,
					tokenEndpoint: "/auth/token",
				}),
		).toThrow("tokenEndpoint must be an absolute URL");
	});
});

describe("ClientCredentialsAuthProvider staggered 401 refresh", () => {
	it("keeps a token that another request already refreshed", async () => {
		let issued = 0;
		const attempts = new Map<string, number>();
		let releaseHeldRequest: (() => void) | undefined;
		const heldRequest = new Promise<void>((resolve) => {
			releaseHeldRequest = resolve;
		});

		installFetch(async (call) => {
			if (call.url === DEFAULT_TOKEN_URL) {
				issued += 1;
				return jsonResponse({
					access_token: `access-token-${issued}`,
					token_type: "Bearer",
					expires_in: 3600,
				});
			}

			const attempt = (attempts.get(call.url) ?? 0) + 1;
			attempts.set(call.url, attempt);
			const isHeldRequest = call.url.endsWith("/Observation");

			if (attempt === 1) {
				// Hold the second request's 401 until the first one refreshed the token.
				if (isHeldRequest) await heldRequest;
				return jsonResponse({ resourceType: "OperationOutcome" }, 401);
			}

			if (!isHeldRequest) releaseHeldRequest?.();
			return jsonResponse({ resourceType: "Bundle" });
		});

		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		const responses = await Promise.all([
			provider.fetch(`${BASE_URL}/fhir/Patient`),
			provider.fetch(`${BASE_URL}/fhir/Observation`),
		]);

		expect(responses.map((response) => response.status)).toEqual([200, 200]);
		expect(tokenCalls()).toHaveLength(2);
		expect(otherCalls()).toHaveLength(4);
		expect(headerOf(otherCalls()[2] as RecordedCall, "authorization")).toBe(
			"Bearer access-token-2",
		);
		expect(headerOf(otherCalls()[3] as RecordedCall, "authorization")).toBe(
			"Bearer access-token-2",
		);
	});
});

describe("ClientCredentialsAuthProvider failure redaction", () => {
	it("redacts the secret reflected in a status text with an empty body", async () => {
		installFetch(
			() =>
				new Response("", {
					status: 400,
					statusText: `rejected ${CLIENT_SECRET}`,
				}),
		);
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		const error = await provider.establishSession().catch((e: unknown) => e);

		const text = errorChainText(error);
		expect(text).toContain("400");
		expect(text).not.toContain(CLIENT_SECRET);
	});

	it("wraps a rejected token request without attaching an unsanitized cause", async () => {
		installFetch(() => {
			throw new Error(`connect ECONNREFUSED while sending ${CLIENT_SECRET}`);
		});
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		const error = await provider.establishSession().catch((e: unknown) => e);

		expect(error).toBeInstanceOf(Error);
		expect((error as Error).message).toContain(
			"Token endpoint request failed:",
		);
		expect((error as Error).cause).toBeUndefined();
		expect(errorChainText(error)).not.toContain(CLIENT_SECRET);
	});

	it("redacts a form-encoded client_secret echoed by the token endpoint", async () => {
		const encodedSecret = encodeURIComponent(CLIENT_SECRET);
		installFetch(() =>
			jsonResponse(
				{
					error: "invalid_request",
					error_description: `unparsable form: grant_type=client_credentials&client_secret=${encodedSecret}`,
				},
				400,
			),
		);
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
			clientAuthentication: "body",
		});

		const error = await provider.establishSession().catch((e: unknown) => e);

		const text = errorChainText(error);
		expect(text).toContain("client_secret=[REDACTED]");
		expect(text).not.toContain(encodedSecret);
	});

	it("redacts an echoed Basic authorization header", async () => {
		const basicHeader = expectedBasicHeader(CLIENT_ID, CLIENT_SECRET);
		const encodedCredentials = basicHeader.slice("Basic ".length);
		installFetch(() =>
			jsonResponse(
				{
					error: "invalid_client",
					error_description: `unknown credentials in header Authorization: ${basicHeader}`,
				},
				401,
			),
		);
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		const error = await provider.establishSession().catch((e: unknown) => e);

		const text = errorChainText(error);
		expect(text).toContain("Basic [REDACTED]");
		expect(text).not.toContain(encodedCredentials);
	});
});

describe("ClientCredentialsAuthProvider token endpoint transport safety", () => {
	it("refuses a plain http token endpoint unless insecure requests are allowed", () => {
		expect(
			() =>
				new ClientCredentialsAuthProvider({
					baseUrl: BASE_URL,
					clientId: CLIENT_ID,
					clientSecret: CLIENT_SECRET,
				}),
		).toThrow("allowInsecureRequests");
	});

	it("refuses a token endpoint carrying userinfo", () => {
		expect(
			() =>
				new ClientCredentialsAuthProvider({
					baseUrl: "https://fhir.example.com",
					clientId: CLIENT_ID,
					clientSecret: CLIENT_SECRET,
					tokenEndpoint: `https://${CLIENT_ID}:secret@fhir.example.com/auth/token`,
				}),
		).toThrow("tokenEndpoint must not contain userinfo");
	});

	it("refuses a token endpoint carrying a fragment", () => {
		expect(
			() =>
				new ClientCredentialsAuthProvider({
					baseUrl: "https://fhir.example.com",
					clientId: CLIENT_ID,
					clientSecret: CLIENT_SECRET,
					tokenEndpoint: "https://fhir.example.com/auth/token#fragment",
				}),
		).toThrow("tokenEndpoint must not contain a fragment");
	});

	it("refuses a token endpoint with a non-http scheme", () => {
		expect(
			() =>
				new ClientCredentialsAuthProvider({
					baseUrl: "https://fhir.example.com",
					clientId: CLIENT_ID,
					clientSecret: CLIENT_SECRET,
					tokenEndpoint: "ftp://fhir.example.com/auth/token",
				}),
		).toThrow("tokenEndpoint must use http: or https:");
	});

	it("does not follow a redirect away from the token endpoint", async () => {
		installFetch(
			() =>
				new Response("", {
					status: 307,
					headers: { location: "https://attacker.example.com/token" },
				}),
		);
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		const error = await provider.establishSession().catch((e: unknown) => e);

		const text = errorChainText(error);
		expect(text).toContain("307");
		expect(text).toContain("redirect not followed");
		expect(text).not.toContain(CLIENT_SECRET);
		expect(calls).toHaveLength(1);
		expect((calls[0] as RecordedCall).redirect).toBe("manual");
	});
});

describe("ClientCredentialsAuthProvider credential validation", () => {
	it("refuses an empty clientId", () => {
		expect(
			() =>
				new ClientCredentialsAuthProvider({
					baseUrl: BASE_URL,
					clientId: "",
					clientSecret: CLIENT_SECRET,
					allowInsecureRequests: true,
				}),
		).toThrow("clientId must be a non-empty string");
	});

	it("refuses an empty clientSecret", () => {
		expect(
			() =>
				new ClientCredentialsAuthProvider({
					baseUrl: BASE_URL,
					clientId: CLIENT_ID,
					clientSecret: "",
					allowInsecureRequests: true,
				}),
		).toThrow("clientSecret must be a non-empty string");
	});

	it("refuses a negative token expiration buffer", () => {
		expect(
			() =>
				new ClientCredentialsAuthProvider({
					baseUrl: BASE_URL,
					clientId: CLIENT_ID,
					clientSecret: CLIENT_SECRET,
					allowInsecureRequests: true,
					tokenExpirationBuffer: -1,
				}),
		).toThrow("tokenExpirationBuffer must be a finite number of seconds");
	});

	it("refuses a non-finite token expiration buffer", () => {
		expect(
			() =>
				new ClientCredentialsAuthProvider({
					baseUrl: BASE_URL,
					clientId: CLIENT_ID,
					clientSecret: CLIENT_SECRET,
					allowInsecureRequests: true,
					tokenExpirationBuffer: Number.POSITIVE_INFINITY,
				}),
		).toThrow("tokenExpirationBuffer must be a finite number of seconds");
	});
});
