import {
	authorize,
	exchangeCode,
	fetchSmartConfiguration,
	type PendingAuthorization,
	refreshSession,
	revokeSession,
	SmartAppLaunchAuthProvider,
	type SmartConfiguration,
	type SmartSession,
} from "src/smart-app-launch";
import { afterEach, describe, expect, it, vi } from "vitest";

const AIDBOX_BASE_URL = "http://localhost:8080";

const ISS = "https://fhir.example.com";
const AUTHORIZE_URL = "https://auth.example.com/authorize";
const TOKEN_URL = "https://auth.example.com/token";
const REVOCATION_URL = "https://auth.example.com/revoke";
const CLIENT_ID = "test-client";
const REDIRECT_URI = "https://app.example.com/callback";

const buildSmartConfig = (
	overrides: Partial<SmartConfiguration> = {},
): SmartConfiguration => ({
	authorization_endpoint: AUTHORIZE_URL,
	token_endpoint: TOKEN_URL,
	revocation_endpoint: REVOCATION_URL,
	code_challenge_methods_supported: ["S256"],
	...overrides,
});

const jsonResponse = (body: unknown, status = 200): Response =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" },
	});

const originalFetch = globalThis.fetch;

afterEach(() => {
	globalThis.fetch = originalFetch;
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("fetchSmartConfiguration", () => {
	it("should fetch and return the SMART configuration document", async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValue(jsonResponse(buildSmartConfig()));
		globalThis.fetch = mockFetch;

		const config = await fetchSmartConfiguration(ISS);

		expect(config.token_endpoint).toBe(TOKEN_URL);
		expect(mockFetch).toHaveBeenCalledOnce();
		expect(mockFetch.mock.calls[0]?.[0]).toBe(
			`${ISS}/.well-known/smart-configuration`,
		);
	});

	it("should strip trailing slash from iss before requesting", async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValue(jsonResponse(buildSmartConfig()));
		globalThis.fetch = mockFetch;

		await fetchSmartConfiguration(`${ISS}/`);

		expect(mockFetch.mock.calls[0]?.[0]).toBe(
			`${ISS}/.well-known/smart-configuration`,
		);
	});

	it("should throw on non-OK response", async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(new Response("not found", { status: 404 }));

		await expect(fetchSmartConfiguration(ISS)).rejects.toThrow(/404/);
	});

	it("should throw when required endpoints are missing", async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(jsonResponse({ token_endpoint: TOKEN_URL }));

		await expect(fetchSmartConfiguration(ISS)).rejects.toThrow(
			/missing required endpoints/,
		);
	});
});

describe("authorize", () => {
	it("should build standalone authorize URL with PKCE when supported", async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(jsonResponse(buildSmartConfig()));

		const result = await authorize({
			iss: ISS,
			clientId: CLIENT_ID,
			scope: "openid fhirUser patient/*.read",
			redirectUri: REDIRECT_URI,
		});

		const url = new URL(result.redirectUrl);
		expect(`${url.origin}${url.pathname}`).toBe(AUTHORIZE_URL);
		expect(url.searchParams.get("response_type")).toBe("code");
		expect(url.searchParams.get("client_id")).toBe(CLIENT_ID);
		expect(url.searchParams.get("redirect_uri")).toBe(REDIRECT_URI);
		expect(url.searchParams.get("aud")).toBe(ISS);
		expect(url.searchParams.get("state")).toBe(result.pending.stateNonce);
		expect(url.searchParams.get("code_challenge_method")).toBe("S256");
		expect(url.searchParams.get("code_challenge")).toBeTruthy();
		expect(url.searchParams.get("launch")).toBeNull();

		expect(result.pending.codeVerifier).toBeTruthy();
		expect(result.pending.codeChallengeMethod).toBe("S256");
		expect(result.pending.serverUrl).toBe(ISS);
		expect(result.pending.tokenUri).toBe(TOKEN_URL);
		expect(result.pending.revocationUri).toBe(REVOCATION_URL);
	});

	it("should produce different stateNonce and codeVerifier on each call", async () => {
		globalThis.fetch = vi
			.fn()
			.mockImplementation(async () => jsonResponse(buildSmartConfig()));

		const a = await authorize({
			iss: ISS,
			clientId: CLIENT_ID,
			scope: "openid",
			redirectUri: REDIRECT_URI,
		});
		const b = await authorize({
			iss: ISS,
			clientId: CLIENT_ID,
			scope: "openid",
			redirectUri: REDIRECT_URI,
		});

		expect(a.pending.stateNonce).not.toBe(b.pending.stateNonce);
		expect(a.pending.codeVerifier).not.toBe(b.pending.codeVerifier);
		expect(a.pending.stateNonce.length).toBeGreaterThanOrEqual(16);
		expect(a.pending.codeVerifier?.length ?? 0).toBeGreaterThanOrEqual(43);
	});

	it("should extract iss and launch from launchUrl, overriding config", async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(jsonResponse(buildSmartConfig()));

		const launchUrl = `https://app.example.com/launch?iss=${encodeURIComponent(ISS)}&launch=abc123`;
		const result = await authorize({
			iss: "https://wrong.example.com",
			clientId: CLIENT_ID,
			scope: "openid fhirUser",
			redirectUri: REDIRECT_URI,
			launchUrl,
		});

		const url = new URL(result.redirectUrl);
		expect(url.searchParams.get("aud")).toBe(ISS);
		expect(url.searchParams.get("launch")).toBe("abc123");
		expect(url.searchParams.get("scope")).toContain("launch");
		expect(result.pending.serverUrl).toBe(ISS);
	});

	it("should not duplicate `launch` scope if already present", async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(jsonResponse(buildSmartConfig()));

		const result = await authorize({
			clientId: CLIENT_ID,
			scope: "launch openid",
			redirectUri: REDIRECT_URI,
			launchUrl: `https://x/launch?iss=${encodeURIComponent(ISS)}&launch=l1`,
		});
		const url = new URL(result.redirectUrl);
		const scopes = url.searchParams.get("scope")?.split(" ") ?? [];
		expect(scopes.filter((s) => s === "launch").length).toBe(1);
	});

	it("should append `launch` when only `launch/patient` scope is present", async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(jsonResponse(buildSmartConfig()));

		const result = await authorize({
			clientId: CLIENT_ID,
			scope: "launch/patient openid",
			redirectUri: REDIRECT_URI,
			launchUrl: `https://x/launch?iss=${encodeURIComponent(ISS)}&launch=l1`,
		});
		const url = new URL(result.redirectUrl);
		const scopes = url.searchParams.get("scope")?.split(" ") ?? [];
		expect(scopes).toContain("launch/patient");
		expect(scopes).toContain("launch");
	});

	it("should disable PKCE when pkceMode is 'disabled'", async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(jsonResponse(buildSmartConfig()));

		const result = await authorize({
			iss: ISS,
			clientId: CLIENT_ID,
			scope: "openid",
			redirectUri: REDIRECT_URI,
			pkceMode: "disabled",
		});

		const url = new URL(result.redirectUrl);
		expect(url.searchParams.get("code_challenge")).toBeNull();
		expect(result.pending.codeVerifier).toBeUndefined();
	});

	it("should throw when pkceMode is 'required' but server doesn't advertise S256", async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(
				jsonResponse(
					buildSmartConfig({ code_challenge_methods_supported: undefined }),
				),
			);

		await expect(
			authorize({
				iss: ISS,
				clientId: CLIENT_ID,
				scope: "openid",
				redirectUri: REDIRECT_URI,
				pkceMode: "required",
			}),
		).rejects.toThrow(/pkceMode=required/);
	});

	it("should disable PKCE when 'ifSupported' and server does not advertise S256", async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(
				jsonResponse(
					buildSmartConfig({ code_challenge_methods_supported: [] }),
				),
			);

		const result = await authorize({
			iss: ISS,
			clientId: CLIENT_ID,
			scope: "openid",
			redirectUri: REDIRECT_URI,
		});
		expect(result.pending.codeVerifier).toBeUndefined();
	});

	it("should require iss either in config or launchUrl", async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(jsonResponse(buildSmartConfig()));

		await expect(
			authorize({
				clientId: CLIENT_ID,
				scope: "openid",
				redirectUri: REDIRECT_URI,
			}),
		).rejects.toThrow(/requires `iss`/);
	});

	it("should reject iss not matching issMatch string", async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(jsonResponse(buildSmartConfig()));

		await expect(
			authorize({
				iss: "https://evil.example.com",
				clientId: CLIENT_ID,
				scope: "openid",
				redirectUri: REDIRECT_URI,
				issMatch: ISS,
			}),
		).rejects.toThrow(/issMatch rejected/);
	});

	it("should accept iss matching issMatch RegExp", async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(jsonResponse(buildSmartConfig()));

		await expect(
			authorize({
				iss: ISS,
				clientId: CLIENT_ID,
				scope: "openid",
				redirectUri: REDIRECT_URI,
				issMatch: /^https:\/\/fhir\./,
			}),
		).resolves.toBeDefined();
	});
});

describe("exchangeCode", () => {
	const basePending = (): PendingAuthorization => ({
		serverUrl: ISS,
		clientId: CLIENT_ID,
		redirectUri: REDIRECT_URI,
		scope: "openid",
		authorizeUri: AUTHORIZE_URL,
		tokenUri: TOKEN_URL,
		revocationUri: REVOCATION_URL,
		stateNonce: "nonce-123",
		codeVerifier: "verifier-xyz",
		codeChallengeMethod: "S256",
	});

	it("should post code+verifier to token endpoint and return a session", async () => {
		const mockFetch = vi.fn().mockResolvedValue(
			jsonResponse({
				access_token: "access-1",
				refresh_token: "refresh-1",
				expires_in: 3600,
				token_type: "Bearer",
				patient: "Patient/123",
				scope: "openid fhirUser",
				userinfo: {
					resourceType: "User",
					id: "user-1",
					email: "user@example.com",
					fhirUser: { id: "abc", resourceType: "Practitioner" },
				},
			}),
		);
		globalThis.fetch = mockFetch;

		const session = await exchangeCode({
			url: `${REDIRECT_URI}?code=auth-code&state=nonce-123`,
			pending: basePending(),
		});

		expect(mockFetch).toHaveBeenCalledOnce();
		const [calledUrl, init] = mockFetch.mock.calls[0] ?? [];
		expect(calledUrl).toBe(TOKEN_URL);
		expect(init.method).toBe("POST");
		const body = new URLSearchParams(init.body as string);
		expect(body.get("grant_type")).toBe("authorization_code");
		expect(body.get("code")).toBe("auth-code");
		expect(body.get("code_verifier")).toBe("verifier-xyz");
		expect(body.get("client_id")).toBe(CLIENT_ID);
		expect(body.get("redirect_uri")).toBe(REDIRECT_URI);

		expect(session.accessToken).toBe("access-1");
		expect(session.refreshToken).toBe("refresh-1");
		expect(session.patient).toBe("Patient/123");
		expect(session.userinfo?.email).toBe("user@example.com");
		expect(session.userinfo?.fhirUser).toEqual({
			id: "abc",
			resourceType: "Practitioner",
		});
		expect(session.expiresAt).toBeGreaterThan(Date.now());
	});

	it("should use Basic auth when clientSecret is set, omit client_id from body", async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValue(jsonResponse({ access_token: "a", expires_in: 60 }));
		globalThis.fetch = mockFetch;

		await exchangeCode({
			url: `${REDIRECT_URI}?code=c&state=nonce-123`,
			pending: { ...basePending(), clientSecret: "secret" },
		});

		const init = mockFetch.mock.calls[0]?.[1];
		const headers = new Headers(init.headers);
		expect(headers.get("authorization")?.startsWith("Basic ")).toBe(true);
		const body = new URLSearchParams(init.body as string);
		expect(body.get("client_id")).toBeNull();
	});

	it("should accept callback iss matching the expected authorization server issuer", async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValue(jsonResponse({ access_token: "a", expires_in: 60 }));
		globalThis.fetch = mockFetch;

		await exchangeCode({
			url: `${REDIRECT_URI}?code=c&state=nonce-123&iss=${encodeURIComponent("https://auth.example.com")}`,
			pending: {
				...basePending(),
				authorizationServerIssuer: "https://auth.example.com",
			},
		});

		expect(mockFetch).toHaveBeenCalledOnce();
	});

	it("should reject callback iss that does not match the expected authorization server issuer", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({}));

		await expect(
			exchangeCode({
				url: `${REDIRECT_URI}?code=c&state=nonce-123&iss=${encodeURIComponent("https://evil.example.com")}`,
				pending: {
					...basePending(),
					authorizationServerIssuer: "https://auth.example.com",
				},
			}),
		).rejects.toThrow(/does not match expected authorization server issuer/);
	});

	it("should reject when state nonce does not match", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({}));

		await expect(
			exchangeCode({
				url: `${REDIRECT_URI}?code=c&state=wrong`,
				pending: basePending(),
			}),
		).rejects.toThrow(/state.*does not match/);
	});

	it("should reject when callback has no code", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({}));

		await expect(
			exchangeCode({
				url: `${REDIRECT_URI}?state=nonce-123`,
				pending: basePending(),
			}),
		).rejects.toThrow(/missing `code`/);
	});

	it("should surface OAuth error from callback URL", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({}));

		await expect(
			exchangeCode({
				url: `${REDIRECT_URI}?error=access_denied&error_description=user%20said%20no&state=nonce-123`,
				pending: basePending(),
			}),
		).rejects.toThrow(/access_denied.*user said no/);
	});

	it("should throw on non-OK token response", async () => {
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(new Response("invalid_grant", { status: 400 }));

		await expect(
			exchangeCode({
				url: `${REDIRECT_URI}?code=c&state=nonce-123`,
				pending: basePending(),
			}),
		).rejects.toThrow(/Token endpoint returned 400/);
	});
});

describe("refreshSession", () => {
	const sessionWithRefresh = (): SmartSession => ({
		serverUrl: ISS,
		clientId: CLIENT_ID,
		tokenUri: TOKEN_URL,
		revocationUri: REVOCATION_URL,
		accessToken: "old-access",
		refreshToken: "old-refresh",
		expiresAt: Date.now() + 3_600_000,
		scope: "openid",
		patient: "patient-1",
		encounter: "encounter-1",
		idToken: "id-token-1",
		userinfo: {
			resourceType: "User",
			id: "user-1",
			email: "user@example.com",
			fhirUser: { id: "1", resourceType: "Practitioner" },
		},
	});

	it("should post refresh_token grant and return a fresh session", async () => {
		const mockFetch = vi.fn().mockResolvedValue(
			jsonResponse({
				access_token: "new-access",
				token_type: "Bearer",
				expires_in: 3600,
				scope: "openid",
				patient: "patient-1",
			}),
		);
		globalThis.fetch = mockFetch;

		const next = await refreshSession(sessionWithRefresh());

		const init = mockFetch.mock.calls[0]?.[1];
		const body = new URLSearchParams(init.body as string);
		expect(body.get("grant_type")).toBe("refresh_token");
		expect(body.get("refresh_token")).toBe("old-refresh");
		expect(body.get("client_id")).toBe(CLIENT_ID);

		expect(next.accessToken).toBe("new-access");
		expect(next.refreshToken).toBe("old-refresh");
	});

	it("should preserve previous refreshToken if response omits it", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue(
			jsonResponse({
				access_token: "new-access",
				token_type: "Bearer",
				expires_in: 60,
				scope: "openid",
				patient: "patient-1",
			}),
		);

		const next = await refreshSession(sessionWithRefresh());
		expect(next.refreshToken).toBe("old-refresh");
	});

	it("should clear expiresAt if refresh response omits expires_in", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue(
			jsonResponse({
				access_token: "new-access",
				token_type: "Bearer",
				scope: "openid",
				patient: "patient-1",
			}),
		);

		const next = await refreshSession(sessionWithRefresh());
		expect(next.expiresAt).toBeUndefined();
	});

	it("should preserve launch context fields omitted by refresh response", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue(
			jsonResponse({
				access_token: "new-access",
				token_type: "Bearer",
				expires_in: 60,
				scope: "openid",
				patient: "patient-1",
			}),
		);

		const next = await refreshSession(sessionWithRefresh());
		expect(next.scope).toBe("openid");
		expect(next.patient).toBe("patient-1");
		expect(next.encounter).toBe("encounter-1");
		expect(next.idToken).toBe("id-token-1");
		expect(next.userinfo?.fhirUser).toEqual({
			id: "1",
			resourceType: "Practitioner",
		});
	});

	it("should throw when no refreshToken is present", async () => {
		const session = sessionWithRefresh();
		session.refreshToken = undefined;

		await expect(refreshSession(session)).rejects.toThrow(/no refreshToken/);
	});
});

describe("revokeSession", () => {
	const baseSession = (): SmartSession => ({
		serverUrl: ISS,
		clientId: CLIENT_ID,
		tokenUri: TOKEN_URL,
		revocationUri: REVOCATION_URL,
		accessToken: "a",
		refreshToken: "r",
		expiresAt: Date.now() + 3_600_000,
	});

	it("should POST refresh token to revocation endpoint", async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValue(new Response("", { status: 200 }));
		globalThis.fetch = mockFetch;

		await revokeSession(baseSession());

		const [url, init] = mockFetch.mock.calls[0] ?? [];
		expect(url).toBe(REVOCATION_URL);
		const body = new URLSearchParams(init.body as string);
		expect(body.get("token")).toBe("r");
	});

	it("should be a no-op when revocationUri is missing", async () => {
		const mockFetch = vi.fn();
		globalThis.fetch = mockFetch;

		const session = baseSession();
		session.revocationUri = undefined;
		await revokeSession(session);
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("should swallow network errors", async () => {
		globalThis.fetch = vi.fn().mockRejectedValue(new Error("network down"));
		await expect(revokeSession(baseSession())).resolves.toBeUndefined();
	});
});

describe("SmartAppLaunchAuthProvider", () => {
	const freshSession = (): SmartSession => ({
		serverUrl: ISS,
		clientId: CLIENT_ID,
		tokenUri: TOKEN_URL,
		revocationUri: REVOCATION_URL,
		accessToken: "access-fresh",
		refreshToken: "refresh-1",
		expiresAt: Date.now() + 3_600_000,
	});

	const makeStore = (initial: SmartSession) => {
		let session = initial;
		return {
			getSession: vi.fn(() => session),
			setSession: vi.fn((s: SmartSession) => {
				session = s;
			}),
			current: () => session,
		};
	};

	it("should attach Bearer header to outgoing requests", async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValue(new Response("{}", { status: 200 }));
		globalThis.fetch = mockFetch;

		const store = makeStore(freshSession());
		const provider = new SmartAppLaunchAuthProvider({
			baseUrl: ISS,
			getSession: store.getSession,
			setSession: store.setSession,
		});
		const response = await provider.fetch(`${ISS}/Patient`);

		expect(response.ok).toBe(true);
		const headers = mockFetch.mock.calls[0]?.[1].headers as Headers;
		expect(headers.get("Authorization")).toBe("Bearer access-fresh");
		expect(store.getSession).toHaveBeenCalled();
	});

	it("should reject requests not starting with baseUrl", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue(new Response("{}"));

		const store = makeStore(freshSession());
		const provider = new SmartAppLaunchAuthProvider({
			baseUrl: ISS,
			getSession: store.getSession,
			setSession: store.setSession,
		});
		await expect(
			provider.fetch("https://other.example.com/Patient"),
		).rejects.toThrow(/must start with baseUrl/);
	});

	it("should auto-refresh when token is near expiry and call setSession", async () => {
		const stale: SmartSession = {
			...freshSession(),
			expiresAt: Date.now() + 1_000,
		};

		const mockFetch = vi.fn().mockImplementation(async (input) => {
			const url = typeof input === "string" ? input : input.toString();
			if (url === TOKEN_URL) {
				return jsonResponse({
					access_token: "fresh-after-refresh",
					token_type: "Bearer",
					expires_in: 3600,
				});
			}
			return new Response("{}", { status: 200 });
		});
		globalThis.fetch = mockFetch;

		const store = makeStore(stale);
		const provider = new SmartAppLaunchAuthProvider({
			baseUrl: ISS,
			getSession: store.getSession,
			setSession: store.setSession,
		});
		const r = await provider.fetch(`${ISS}/Patient`);

		expect(r.ok).toBe(true);
		expect(mockFetch).toHaveBeenCalledTimes(2);
		expect(store.setSession).toHaveBeenCalledOnce();
		expect(store.current().accessToken).toBe("fresh-after-refresh");
		expect(store.current().refreshToken).toBe("refresh-1");

		const fhirCall = mockFetch.mock.calls.find(
			(c) => (typeof c[0] === "string" ? c[0] : c[0].toString()) !== TOKEN_URL,
		);
		const headers = fhirCall?.[1].headers as Headers;
		expect(headers.get("Authorization")).toBe("Bearer fresh-after-refresh");
	});

	it("should retry once after 401 with refreshed token", async () => {
		let callsToFhir = 0;
		const mockFetch = vi.fn().mockImplementation(async (input) => {
			const url = typeof input === "string" ? input : input.toString();
			if (url === TOKEN_URL) {
				return jsonResponse({
					access_token: "post-401-token",
					token_type: "Bearer",
					expires_in: 3600,
				});
			}
			callsToFhir++;
			if (callsToFhir === 1) {
				return new Response("unauthorized", { status: 401 });
			}
			return new Response("{}", { status: 200 });
		});
		globalThis.fetch = mockFetch;

		const store = makeStore(freshSession());
		const provider = new SmartAppLaunchAuthProvider({
			baseUrl: ISS,
			getSession: store.getSession,
			setSession: store.setSession,
		});
		const r = await provider.fetch(`${ISS}/Patient`);

		expect(r.ok).toBe(true);
		expect(callsToFhir).toBe(2);
		expect(store.current().accessToken).toBe("post-401-token");
		expect(store.current().refreshToken).toBe("refresh-1");
	});

	it("should not retry after 401 if no refresh token is available", async () => {
		const session: SmartSession = {
			...freshSession(),
			refreshToken: undefined,
		};

		const mockFetch = vi
			.fn()
			.mockResolvedValue(new Response("unauthorized", { status: 401 }));
		globalThis.fetch = mockFetch;

		const store = makeStore(session);
		const provider = new SmartAppLaunchAuthProvider({
			baseUrl: ISS,
			getSession: store.getSession,
			setSession: store.setSession,
		});
		const r = await provider.fetch(`${ISS}/Patient`);

		expect(r.status).toBe(401);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it("should deduplicate concurrent refreshes", async () => {
		const stale: SmartSession = {
			...freshSession(),
			expiresAt: Date.now() + 1_000,
		};

		let tokenCalls = 0;
		const mockFetch = vi.fn().mockImplementation(async (input) => {
			const url = typeof input === "string" ? input : input.toString();
			if (url === TOKEN_URL) {
				tokenCalls++;
				return new Promise<Response>((resolve) =>
					setTimeout(
						() =>
							resolve(
								jsonResponse({
									access_token: "new",
									token_type: "Bearer",
									expires_in: 3600,
								}),
							),
						10,
					),
				);
			}
			return new Response("{}", { status: 200 });
		});
		globalThis.fetch = mockFetch;

		const store = makeStore(stale);
		const provider = new SmartAppLaunchAuthProvider({
			baseUrl: ISS,
			getSession: store.getSession,
			setSession: store.setSession,
		});
		await Promise.all([
			provider.fetch(`${ISS}/A`),
			provider.fetch(`${ISS}/B`),
			provider.fetch(`${ISS}/C`),
		]);

		expect(tokenCalls).toBe(1);
	});

	it("should be a no-op for establishSession when token is fresh", async () => {
		const mockFetch = vi.fn();
		globalThis.fetch = mockFetch;

		const store = makeStore(freshSession());
		const provider = new SmartAppLaunchAuthProvider({
			baseUrl: ISS,
			getSession: store.getSession,
			setSession: store.setSession,
		});
		await provider.establishSession();

		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("should refresh on establishSession when token is stale", async () => {
		const stale: SmartSession = {
			...freshSession(),
			expiresAt: Date.now() + 1_000,
		};
		globalThis.fetch = vi.fn().mockResolvedValue(
			jsonResponse({
				access_token: "via-establish",
				token_type: "Bearer",
				expires_in: 3600,
			}),
		);

		const store = makeStore(stale);
		const provider = new SmartAppLaunchAuthProvider({
			baseUrl: ISS,
			getSession: store.getSession,
			setSession: store.setSession,
		});
		await provider.establishSession();

		expect(store.current().accessToken).toBe("via-establish");
	});

	it("should throw on establishSession when session is expired and has no refreshToken", async () => {
		const expired: SmartSession = {
			...freshSession(),
			expiresAt: Date.now() - 1_000,
			refreshToken: undefined,
		};

		const store = makeStore(expired);
		const provider = new SmartAppLaunchAuthProvider({
			baseUrl: ISS,
			getSession: store.getSession,
			setSession: store.setSession,
		});
		await expect(provider.establishSession()).rejects.toThrow(
			/expired and has no refreshToken/,
		);
	});

	it("should call revocation endpoint on revokeSession", async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValue(new Response("", { status: 200 }));
		globalThis.fetch = mockFetch;

		const store = makeStore(freshSession());
		const provider = new SmartAppLaunchAuthProvider({
			baseUrl: ISS,
			getSession: store.getSession,
			setSession: store.setSession,
		});
		await provider.revokeSession();

		expect(mockFetch).toHaveBeenCalledOnce();
		expect(mockFetch.mock.calls[0]?.[0]).toBe(REVOCATION_URL);
	});
});

describe("SMART discovery against live Aidbox", () => {
	it("should fetch the SMART configuration document from Aidbox", async () => {
		const config = await fetchSmartConfiguration(AIDBOX_BASE_URL);

		expect(typeof config.authorization_endpoint).toBe("string");
		expect(config.authorization_endpoint.length).toBeGreaterThan(0);
		expect(typeof config.token_endpoint).toBe("string");
		expect(config.token_endpoint.length).toBeGreaterThan(0);
	});
});
