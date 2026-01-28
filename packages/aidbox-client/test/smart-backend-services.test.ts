import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import {
	generateKeyPair,
	SmartBackendServicesAuthProvider,
} from "../src/smart-backend-services";

// Generated in beforeAll
let TEST_PRIVATE_KEY: string;
let TEST_KEY_ID: string;

const TEST_CLIENT_ID = "test-backend-client";
const TEST_BASE_URL = "https://fhir.example.com";
const TEST_TOKEN_ENDPOINT = `${TEST_BASE_URL}/auth/token`;

/** Decode base64url to string */
function decodeBase64Url(input: string): string {
	return atob(input.replace(/-/g, "+").replace(/_/g, "/"));
}

/** Parse JWT and return header and payload */
function parseJwt(jwt: string): { header: unknown; payload: unknown } {
	const parts = jwt.split(".");
	if (parts.length !== 3) {
		throw new Error("Invalid JWT format");
	}
	return {
		header: JSON.parse(decodeBase64Url(parts[0] ?? "")),
		payload: JSON.parse(decodeBase64Url(parts[1] ?? "")),
	};
}

beforeAll(async () => {
	const keyPair = await generateKeyPair();
	TEST_PRIVATE_KEY = keyPair.privateKeyPem;
	TEST_KEY_ID = keyPair.keyId;
});

describe("SmartBackendServicesAuthProvider", () => {
	let originalFetch: typeof global.fetch;

	beforeEach(() => {
		originalFetch = global.fetch;
	});

	afterEach(() => {
		global.fetch = originalFetch;
		vi.restoreAllMocks();
	});

	describe("constructor", () => {
		it("should set baseUrl from config", () => {
			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: TEST_BASE_URL,
				clientId: TEST_CLIENT_ID,
				privateKey: TEST_PRIVATE_KEY,
				keyId: TEST_KEY_ID,
				scope: "system/*.read",
			});

			expect(provider.baseUrl).toBe(TEST_BASE_URL);
		});

		it("should default tokenEndpoint to baseUrl/auth/token", () => {
			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: TEST_BASE_URL,
				clientId: TEST_CLIENT_ID,
				privateKey: TEST_PRIVATE_KEY,
				keyId: TEST_KEY_ID,
				scope: "system/*.read",
			});

			expect(provider.baseUrl).toBe(TEST_BASE_URL);
		});

		it("should accept custom tokenEndpoint", () => {
			const customEndpoint = "https://auth.example.com/oauth/token";
			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: TEST_BASE_URL,
				clientId: TEST_CLIENT_ID,
				privateKey: TEST_PRIVATE_KEY,
				keyId: TEST_KEY_ID,
				scope: "system/*.read",
				tokenEndpoint: customEndpoint,
			});

			expect(provider.baseUrl).toBe(TEST_BASE_URL);
		});
	});

	describe("token acquisition", () => {
		it("should request token with correct parameters", async () => {
			const mockTokenResponse = {
				access_token: "test-access-token",
				token_type: "Bearer",
				expires_in: 300,
				scope: "system/*.read",
			};

			let capturedBody: string | undefined;

			global.fetch = vi.fn().mockImplementation(async (url, options) => {
				if (url === TEST_TOKEN_ENDPOINT) {
					capturedBody = options?.body as string;
					return new Response(JSON.stringify(mockTokenResponse), {
						status: 200,
						headers: { "content-type": "application/json" },
					});
				}
				throw new Error(`Unexpected fetch to ${url}`);
			});

			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: TEST_BASE_URL,
				clientId: TEST_CLIENT_ID,
				privateKey: TEST_PRIVATE_KEY,
				keyId: TEST_KEY_ID,
				scope: "system/*.read",
			});

			await provider.establishSession();

			expect(capturedBody).toBeDefined();
			if (!capturedBody) throw new Error("capturedBody is undefined");

			const params = new URLSearchParams(capturedBody);
			expect(params.get("grant_type")).toBe("client_credentials");
			expect(params.get("client_assertion_type")).toBe(
				"urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
			);
			expect(params.get("scope")).toBe("system/*.read");
			expect(params.get("client_assertion")).toBeTruthy();
		});

		it("should create valid JWT structure", async () => {
			let capturedJwt: string | undefined;

			global.fetch = vi.fn().mockImplementation(async (url, options) => {
				if (url === TEST_TOKEN_ENDPOINT) {
					const body = options?.body as string;
					const params = new URLSearchParams(body);
					capturedJwt = params.get("client_assertion") ?? undefined;
					return new Response(
						JSON.stringify({
							access_token: "test-token",
							token_type: "Bearer",
							expires_in: 300,
						}),
						{ status: 200 },
					);
				}
				throw new Error(`Unexpected fetch to ${url}`);
			});

			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: TEST_BASE_URL,
				clientId: TEST_CLIENT_ID,
				privateKey: TEST_PRIVATE_KEY,
				keyId: TEST_KEY_ID,
				scope: "system/*.read",
			});

			await provider.establishSession();

			expect(capturedJwt).toBeTruthy();
			if (!capturedJwt) throw new Error("capturedJwt is undefined");

			const { header, payload } = parseJwt(capturedJwt);
			const h = header as { alg: string; typ: string; kid: string };
			const p = payload as {
				iss: string;
				sub: string;
				aud: string;
				exp: number;
				jti: string;
			};

			expect(h.alg).toBe("RS384");
			expect(h.typ).toBe("JWT");
			expect(h.kid).toBe(TEST_KEY_ID);

			expect(p.iss).toBe(TEST_CLIENT_ID);
			expect(p.sub).toBe(TEST_CLIENT_ID);
			expect(p.aud).toBe(TEST_TOKEN_ENDPOINT);
			expect(p.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
			expect(p.jti).toBeTruthy();
		});

		it("should throw on token request failure", async () => {
			global.fetch = vi.fn().mockImplementation(async () => {
				return new Response("Invalid client", { status: 401 });
			});

			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: TEST_BASE_URL,
				clientId: TEST_CLIENT_ID,
				privateKey: TEST_PRIVATE_KEY,
				keyId: TEST_KEY_ID,
				scope: "system/*.read",
			});

			await expect(provider.establishSession()).rejects.toThrow(
				"Token request failed: 401",
			);
		});
	});

	describe("token caching", () => {
		it("should cache token and reuse it", async () => {
			let fetchCount = 0;

			global.fetch = vi.fn().mockImplementation(async (url) => {
				if (url === TEST_TOKEN_ENDPOINT) {
					fetchCount++;
					return new Response(
						JSON.stringify({
							access_token: `token-${fetchCount}`,
							token_type: "Bearer",
							expires_in: 300,
						}),
						{ status: 200 },
					);
				}
				if (url.startsWith(TEST_BASE_URL)) {
					return new Response(JSON.stringify({ data: "test" }), {
						status: 200,
					});
				}
				throw new Error(`Unexpected fetch to ${url}`);
			});

			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: TEST_BASE_URL,
				clientId: TEST_CLIENT_ID,
				privateKey: TEST_PRIVATE_KEY,
				keyId: TEST_KEY_ID,
				scope: "system/*.read",
			});

			// First request - should get token
			await provider.fetch(`${TEST_BASE_URL}/fhir/Patient`);
			expect(fetchCount).toBe(1);

			// Second request - should reuse cached token
			await provider.fetch(`${TEST_BASE_URL}/fhir/Observation`);
			expect(fetchCount).toBe(1);
		});

		it("should refresh token when expired", async () => {
			let fetchCount = 0;

			global.fetch = vi.fn().mockImplementation(async (url) => {
				if (url === TEST_TOKEN_ENDPOINT) {
					fetchCount++;
					return new Response(
						JSON.stringify({
							access_token: `token-${fetchCount}`,
							token_type: "Bearer",
							expires_in: 1, // 1 second expiry
						}),
						{ status: 200 },
					);
				}
				if (url.startsWith(TEST_BASE_URL)) {
					return new Response(JSON.stringify({ data: "test" }), {
						status: 200,
					});
				}
				throw new Error(`Unexpected fetch to ${url}`);
			});

			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: TEST_BASE_URL,
				clientId: TEST_CLIENT_ID,
				privateKey: TEST_PRIVATE_KEY,
				keyId: TEST_KEY_ID,
				scope: "system/*.read",
				tokenExpirationBuffer: 30, // 30 second buffer
			});

			// First request - token will be "expired" due to buffer
			await provider.fetch(`${TEST_BASE_URL}/fhir/Patient`);
			expect(fetchCount).toBe(1);

			// Second request - should refresh because expires_in(1) < buffer(30)
			await provider.fetch(`${TEST_BASE_URL}/fhir/Observation`);
			expect(fetchCount).toBe(2);
		});
	});

	describe("fetch", () => {
		it("should add Authorization header to requests", async () => {
			let capturedHeaders: Headers | undefined;

			global.fetch = vi.fn().mockImplementation(async (url, options) => {
				if (url === TEST_TOKEN_ENDPOINT) {
					return new Response(
						JSON.stringify({
							access_token: "my-access-token",
							token_type: "Bearer",
							expires_in: 300,
						}),
						{ status: 200 },
					);
				}
				if (url.startsWith(TEST_BASE_URL)) {
					capturedHeaders = options?.headers as Headers;
					return new Response(JSON.stringify({ data: "test" }), {
						status: 200,
					});
				}
				throw new Error(`Unexpected fetch to ${url}`);
			});

			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: TEST_BASE_URL,
				clientId: TEST_CLIENT_ID,
				privateKey: TEST_PRIVATE_KEY,
				keyId: TEST_KEY_ID,
				scope: "system/*.read",
			});

			await provider.fetch(`${TEST_BASE_URL}/fhir/Patient`);

			expect(capturedHeaders).toBeDefined();
			if (!capturedHeaders) throw new Error("capturedHeaders is undefined");
			expect(capturedHeaders.get("Authorization")).toBe(
				"Bearer my-access-token",
			);
		});

		it("should reject requests to different baseUrl", async () => {
			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: TEST_BASE_URL,
				clientId: TEST_CLIENT_ID,
				privateKey: TEST_PRIVATE_KEY,
				keyId: TEST_KEY_ID,
				scope: "system/*.read",
			});

			await expect(
				provider.fetch("https://other-server.com/fhir/Patient"),
			).rejects.toThrow("URL of the request must start with baseUrl");
		});

		it("should retry on 401 with fresh token", async () => {
			let tokenRequestCount = 0;
			let resourceRequestCount = 0;

			global.fetch = vi.fn().mockImplementation(async (url) => {
				if (url === TEST_TOKEN_ENDPOINT) {
					tokenRequestCount++;
					return new Response(
						JSON.stringify({
							access_token: `token-${tokenRequestCount}`,
							token_type: "Bearer",
							expires_in: 300,
						}),
						{ status: 200 },
					);
				}
				if (url.startsWith(TEST_BASE_URL)) {
					resourceRequestCount++;
					// First resource request returns 401, second succeeds
					if (resourceRequestCount === 1) {
						return new Response("Unauthorized", { status: 401 });
					}
					return new Response(JSON.stringify({ data: "test" }), {
						status: 200,
					});
				}
				throw new Error(`Unexpected fetch to ${url}`);
			});

			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: TEST_BASE_URL,
				clientId: TEST_CLIENT_ID,
				privateKey: TEST_PRIVATE_KEY,
				keyId: TEST_KEY_ID,
				scope: "system/*.read",
			});

			const response = await provider.fetch(`${TEST_BASE_URL}/fhir/Patient`);

			expect(response.status).toBe(200);
			expect(tokenRequestCount).toBe(2); // Initial + retry
			expect(resourceRequestCount).toBe(2); // Initial + retry
		});
	});

	describe("session management", () => {
		it("should report isAuthenticated correctly", async () => {
			global.fetch = vi.fn().mockImplementation(async () => {
				return new Response(
					JSON.stringify({
						access_token: "test-token",
						token_type: "Bearer",
						expires_in: 300,
					}),
					{ status: 200 },
				);
			});

			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: TEST_BASE_URL,
				clientId: TEST_CLIENT_ID,
				privateKey: TEST_PRIVATE_KEY,
				keyId: TEST_KEY_ID,
				scope: "system/*.read",
			});

			expect(await provider.isAuthenticated()).toBe(false);

			await provider.establishSession();

			expect(await provider.isAuthenticated()).toBe(true);
		});

		it("should clear token on revokeSession", async () => {
			global.fetch = vi.fn().mockImplementation(async () => {
				return new Response(
					JSON.stringify({
						access_token: "test-token",
						token_type: "Bearer",
						expires_in: 300,
					}),
					{ status: 200 },
				);
			});

			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: TEST_BASE_URL,
				clientId: TEST_CLIENT_ID,
				privateKey: TEST_PRIVATE_KEY,
				keyId: TEST_KEY_ID,
				scope: "system/*.read",
			});

			await provider.establishSession();
			expect(await provider.isAuthenticated()).toBe(true);

			await provider.revokeSession();
			expect(await provider.isAuthenticated()).toBe(false);
		});
	});

	describe("algorithm support", () => {
		it("should use RS384 (per SMART Backend Services spec)", async () => {
			let capturedJwt: string | undefined;

			global.fetch = vi.fn().mockImplementation(async (url, options) => {
				if (url === TEST_TOKEN_ENDPOINT) {
					const body = options?.body as string;
					const params = new URLSearchParams(body);
					capturedJwt = params.get("client_assertion") ?? undefined;
					return new Response(
						JSON.stringify({
							access_token: "test-token",
							token_type: "Bearer",
							expires_in: 300,
						}),
						{ status: 200 },
					);
				}
				throw new Error(`Unexpected fetch to ${url}`);
			});

			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: TEST_BASE_URL,
				clientId: TEST_CLIENT_ID,
				privateKey: TEST_PRIVATE_KEY,
				keyId: TEST_KEY_ID,
				scope: "system/*.read",
			});

			await provider.establishSession();

			expect(capturedJwt).toBeTruthy();
			if (!capturedJwt) throw new Error("capturedJwt is undefined");

			const { header } = parseJwt(capturedJwt);
			expect((header as { alg: string }).alg).toBe("RS384");
		});
	});
});

describe("generateKeyPair", () => {
	it("should generate valid RSA key pair", async () => {
		const { privateKeyPem, publicKeyJwk, keyId } = await generateKeyPair();

		// Check private key format
		expect(privateKeyPem).toContain("-----BEGIN PRIVATE KEY-----");
		expect(privateKeyPem).toContain("-----END PRIVATE KEY-----");

		// Check public key JWK
		expect(publicKeyJwk.kty).toBe("RSA");
		expect(publicKeyJwk.n).toBeTruthy();
		expect(publicKeyJwk.e).toBeTruthy();
		expect(publicKeyJwk.kid).toBe(keyId);

		// Check key ID format
		expect(keyId).toMatch(/^[a-f0-9]{32}$/);
	});

	it("should generate unique key IDs", async () => {
		const result1 = await generateKeyPair();
		const result2 = await generateKeyPair();

		expect(result1.keyId).not.toBe(result2.keyId);
	});
});
