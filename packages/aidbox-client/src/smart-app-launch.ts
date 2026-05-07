import type { AuthProvider, UserInfo } from "./types";
import { mergeHeaders, validateBaseUrl } from "./utils";

/// IMPORTANT:
///
/// PLEASE, use one sentence per line approach in the docstrings.
/// Don't use hard-wrapping, it makes git-diff a painfull experience.

/**
 * SMART configuration document fields read by this implementation.
 *
 * @see https://hl7.org/fhir/smart-app-launch/conformance.html#smart-configuration
 */
export type SmartConfiguration = {
	issuer?: string | undefined;
	authorization_endpoint: string;
	token_endpoint: string;
	revocation_endpoint?: string | undefined;
	code_challenge_methods_supported?: string[] | undefined;
	scopes_supported?: string[] | undefined;
	capabilities?: string[] | undefined;
	[key: string]: unknown;
};

/**
 * Token bundle returned by `exchangeCode`.
 *
 * SMART App Launch token responses extend OAuth 2.0 with launch context (`patient`, `encounter`, `id_token`).
 * Aidbox token responses may also include `userinfo`, containing the Aidbox `User` resource.
 *
 * `id_token` (when scope includes `openid`) is **not** validated by this library — callers that rely on id_token claims for authorization decisions must verify the JWT signature, `iss`, `aud`, and `exp` themselves.
 */
export type SmartTokenResponse<TUser = UserInfo> = {
	access_token: string;
	token_type?: string;
	refresh_token?: string;
	expires_in?: number;
	scope?: string;
	id_token?: string;
	patient?: string;
	encounter?: string;
	userinfo?: TUser;
	[key: string]: unknown;
};

/**
 * Token bundle returned by `refreshSession`.
 *
 * This implementation expects the core SMART/OAuth refresh fields.
 */
export type SmartRefreshTokenResponse = Required<
	Pick<SmartTokenResponse, "access_token">
> &
	Pick<SmartTokenResponse, "expires_in" | "scope" | "patient"> & {
		token_type: "Bearer";
	};

/**
 * The session established after a successful SMART App Launch.
 *
 * Hosts persist this object in their session store (cookie session, Redis, etc.).
 * `accessToken` is always present; `expiresAt` is an absolute Unix timestamp in milliseconds, computed locally on receipt.
 */
export type SmartSession<TUser = UserInfo> = {
	serverUrl: string;
	clientId: string;
	tokenUri: string;
	revocationUri?: string | undefined;
	clientSecret?: string | undefined;
	accessToken: string;
	refreshToken?: string | undefined;
	expiresAt?: number | undefined;
	scope?: string | undefined;
	patient?: string | undefined;
	encounter?: string | undefined;
	idToken?: string | undefined;
	userinfo?: TUser | undefined;
};

/**
 * In-flight authorization request — created by `authorize`, consumed by `exchangeCode`.
 *
 * Hosts persist this object briefly (typically in a server-side session, keyed by `stateNonce`) between the authorize redirect and the callback.
 * Lifetime is seconds-to-minutes; once `exchangeCode` succeeds it can be discarded.
 */
export type PendingAuthorization = {
	serverUrl: string;
	clientId: string;
	clientSecret?: string | undefined;
	redirectUri: string;
	scope: string;
	authorizationServerIssuer?: string | undefined;
	authorizeUri: string;
	tokenUri: string;
	revocationUri?: string | undefined;
	stateNonce: string;
	codeVerifier?: string | undefined;
	codeChallengeMethod?: "S256" | undefined;
};

/**
 * Configuration accepted by `authorize`.
 *
 * Standalone vs EHR launch is determined by inspecting `launchUrl`:
 * if it carries `iss` and `launch` query parameters the request is treated as an EHR launch and those values override `iss`/`launch` from config.
 */
export type AuthorizeConfig = {
	/** FHIR server base URL. Required for standalone launch; ignored if present in `launchUrl` query. */
	iss?: string;
	/** EHR launch parameter. Usually comes from `launchUrl` query, not config. */
	launch?: string;
	/** OAuth 2.0 client identifier. */
	clientId: string;
	/** Space-separated scope string. `launch` scope is auto-appended for EHR launches if missing. */
	scope: string;
	/** Absolute redirect URI registered with the authorization server. */
	redirectUri: string;
	/** Confidential client secret (server-side only). When set, token requests use HTTP Basic client auth. */
	clientSecret?: string;
	/**
	 * PKCE behavior.
	 *
	 * `ifSupported` (default) — enable PKCE iff server advertises `S256` in `code_challenge_methods_supported`.
	 * `required` — throw if `S256` is not advertised.
	 * `disabled` — never use PKCE.
	 */
	pkceMode?: "ifSupported" | "required" | "disabled";
	/** Optional allow-list for the resolved `iss`, guarding against arbitrary-iss CSRF. */
	issMatch?: string | RegExp | ((iss: string) => boolean);
	/** Full URL of the current launch request — used to extract `iss` and `launch` from query parameters. */
	launchUrl?: string | URL;
	/** Pass-through `RequestInit` for the discovery request. */
	wellKnownRequestOptions?: RequestInit;
};

/** Result of `authorize`. */
export type AuthorizeResult = {
	/** URL the host should redirect the user-agent to. */
	redirectUrl: string;
	/** Pending authorization to persist before redirecting; looked up by `stateNonce` on callback. */
	pending: PendingAuthorization;
};

const SMART_CONFIG_PATH = "/.well-known/smart-configuration";

const checkIssMatch = (
	iss: string,
	matcher: AuthorizeConfig["issMatch"],
): void => {
	if (matcher === undefined) return;
	let ok = false;
	if (typeof matcher === "string") ok = iss === matcher;
	else if (matcher instanceof RegExp) ok = matcher.test(iss);
	else if (typeof matcher === "function") ok = matcher(iss);
	if (!ok) {
		throw new Error(`SMART issMatch rejected iss: ${iss}`);
	}
};

const base64url = (bytes: Uint8Array): string => {
	let str = "";
	for (const b of bytes) str += String.fromCharCode(b);
	return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const generateRandomString = (bytes = 32): string => {
	const buf = new Uint8Array(bytes);
	crypto.getRandomValues(buf);
	return base64url(buf);
};

const calculatePkceChallenge = async (verifier: string): Promise<string> => {
	const data = new TextEncoder().encode(verifier);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return base64url(new Uint8Array(digest));
};

/**
 * Fetch the SMART configuration document from `{iss}/.well-known/smart-configuration`.
 *
 * Throws if the document is missing or lacks required endpoints.
 */
export async function fetchSmartConfiguration(
	iss: string,
	requestInit?: RequestInit,
): Promise<SmartConfiguration> {
	const base = iss.endsWith("/") ? iss.slice(0, -1) : iss;
	const url = `${base}${SMART_CONFIG_PATH}`;
	const response = await fetch(url, {
		...requestInit,
		headers: {
			accept: "application/json",
			...(requestInit?.headers as Record<string, string> | undefined),
		},
	});
	if (!response.ok) {
		throw new Error(
			`Failed to fetch SMART configuration from ${url}: ${response.status} ${response.statusText}`,
		);
	}
	const config = (await response.json()) as SmartConfiguration;
	if (!config.authorization_endpoint || !config.token_endpoint) {
		throw new Error(
			`SMART configuration at ${url} is missing required endpoints`,
		);
	}
	return config;
}

const resolvePkce = (
	mode: AuthorizeConfig["pkceMode"],
	supported: string[] | undefined,
): boolean => {
	const has256 = supported?.includes("S256") ?? false;
	switch (mode ?? "ifSupported") {
		case "disabled":
			return false;
		case "required":
			if (!has256) {
				throw new Error(
					"pkceMode=required but server does not advertise S256 in code_challenge_methods_supported",
				);
			}
			return true;
		case "ifSupported":
			return has256;
	}
};

/**
 * Build an authorization redirect URL and prepare the pending authorization.
 *
 * The host must persist `result.pending` (typically keyed by `result.pending.stateNonce`) before redirecting.
 * On callback, the `state` query parameter equals `stateNonce`, allowing the host to look up the pending authorization and pass it to `exchangeCode`.
 */
export async function authorize(
	config: AuthorizeConfig,
): Promise<AuthorizeResult> {
	let iss = config.iss;
	let launch = config.launch;

	if (config.launchUrl !== undefined) {
		const url = new URL(config.launchUrl);
		const queryIss = url.searchParams.get("iss");
		const queryLaunch = url.searchParams.get("launch");
		if (queryIss) iss = queryIss;
		if (queryLaunch) launch = queryLaunch;
	}

	if (!iss) {
		throw new Error(
			"authorize() requires `iss` (either via config or as a query param in `launchUrl`)",
		);
	}

	checkIssMatch(iss, config.issMatch);

	const smartConfig = await fetchSmartConfiguration(
		iss,
		config.wellKnownRequestOptions,
	);

	const usePkce = resolvePkce(
		config.pkceMode,
		smartConfig.code_challenge_methods_supported,
	);

	let scope = config.scope;
	if (launch && !scope.split(/\s+/).includes("launch")) {
		scope = `${scope} launch`.trim();
	}

	const stateNonce = generateRandomString(16);

	let codeVerifier: string | undefined;
	let codeChallenge: string | undefined;
	if (usePkce) {
		codeVerifier = generateRandomString(32);
		codeChallenge = await calculatePkceChallenge(codeVerifier);
	}

	const authorizeUrl = new URL(smartConfig.authorization_endpoint);
	authorizeUrl.searchParams.set("response_type", "code");
	authorizeUrl.searchParams.set("client_id", config.clientId);
	authorizeUrl.searchParams.set("redirect_uri", config.redirectUri);
	authorizeUrl.searchParams.set("scope", scope);
	authorizeUrl.searchParams.set("state", stateNonce);
	authorizeUrl.searchParams.set("aud", iss);
	if (launch) authorizeUrl.searchParams.set("launch", launch);
	if (codeChallenge) {
		authorizeUrl.searchParams.set("code_challenge", codeChallenge);
		authorizeUrl.searchParams.set("code_challenge_method", "S256");
	}

	const pending: PendingAuthorization = {
		serverUrl: iss,
		clientId: config.clientId,
		clientSecret: config.clientSecret,
		redirectUri: config.redirectUri,
		scope,
		authorizationServerIssuer: smartConfig.issuer,
		authorizeUri: smartConfig.authorization_endpoint,
		tokenUri: smartConfig.token_endpoint,
		revocationUri: smartConfig.revocation_endpoint,
		stateNonce,
		codeVerifier,
		codeChallengeMethod: usePkce ? "S256" : undefined,
	};

	return {
		redirectUrl: authorizeUrl.toString(),
		pending,
	};
}

const validateAuthorizationResponseIssuer = (
	url: URL,
	pending: Pick<PendingAuthorization, "authorizationServerIssuer">,
): void => {
	const responseIss = url.searchParams.get("iss");
	if (!responseIss) return;
	if (
		pending.authorizationServerIssuer &&
		responseIss !== pending.authorizationServerIssuer
	) {
		throw new Error(
			`Callback \`iss\` does not match expected authorization server issuer: ${responseIss}`,
		);
	}
};

const buildBasicAuth = (clientId: string, clientSecret: string): string => {
	const creds = `${encodeURIComponent(clientId)}:${encodeURIComponent(clientSecret)}`;
	const utf8 = new TextEncoder().encode(creds);
	const base64 = btoa(String.fromCharCode(...utf8));
	return `Basic ${base64}`;
};

const sessionFromTokenResponse = <TUser = UserInfo>(
	pending: Pick<
		PendingAuthorization,
		"serverUrl" | "clientId" | "clientSecret" | "tokenUri" | "revocationUri"
	>,
	token: SmartTokenResponse<TUser>,
): SmartSession<TUser> => {
	const expiresAt =
		token.expires_in !== undefined
			? Date.now() + token.expires_in * 1000
			: undefined;
	return {
		serverUrl: pending.serverUrl,
		clientId: pending.clientId,
		clientSecret: pending.clientSecret,
		tokenUri: pending.tokenUri,
		revocationUri: pending.revocationUri,
		accessToken: token.access_token,
		refreshToken: token.refresh_token,
		expiresAt,
		scope: token.scope,
		patient: token.patient,
		encounter: token.encounter,
		idToken: token.id_token,
		userinfo: token.userinfo,
	};
};

/** Parameters for `exchangeCode`. */
export type ExchangeCodeParams = {
	/** Full callback URL with `?code=...&state=...` query parameters. */
	url: string | URL;
	/** Pending authorization previously persisted by the host, looked up via the callback `state` query parameter. */
	pending: PendingAuthorization;
};

/**
 * Exchange the authorization code from the callback URL for an established `SmartSession`.
 *
 * Validates the `state` query parameter against `pending.stateNonce`.
 * Surfaces `error`/`error_description` from the callback URL as a thrown `Error`.
 */
export async function exchangeCode<TUser = UserInfo>(
	params: ExchangeCodeParams,
): Promise<SmartSession<TUser>> {
	const url = new URL(params.url);
	const returnedState = url.searchParams.get("state");
	if (!returnedState || returnedState !== params.pending.stateNonce) {
		throw new Error("Callback `state` does not match pending authorization");
	}
	validateAuthorizationResponseIssuer(url, params.pending);

	const oauthError = url.searchParams.get("error");
	if (oauthError) {
		const description = url.searchParams.get("error_description");
		throw new Error(
			`SMART authorization error: ${oauthError}${description ? ` — ${description}` : ""}`,
		);
	}

	const code = url.searchParams.get("code");
	if (!code) {
		throw new Error("Callback URL is missing `code` query parameter");
	}

	const body = new URLSearchParams();
	body.set("grant_type", "authorization_code");
	body.set("code", code);
	body.set("redirect_uri", params.pending.redirectUri);
	if (params.pending.codeVerifier) {
		body.set("code_verifier", params.pending.codeVerifier);
	}

	const headers: Record<string, string> = {
		"content-type": "application/x-www-form-urlencoded",
		accept: "application/json",
	};

	if (params.pending.clientSecret) {
		headers.authorization = buildBasicAuth(
			params.pending.clientId,
			params.pending.clientSecret,
		);
	} else {
		body.set("client_id", params.pending.clientId);
	}

	const response = await fetch(params.pending.tokenUri, {
		method: "POST",
		headers,
		body: body.toString(),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(
			`Token endpoint returned ${response.status}: ${text || response.statusText}`,
		);
	}

	const token = (await response.json()) as SmartTokenResponse<TUser>;
	return sessionFromTokenResponse(params.pending, token);
}

/**
 * Use the session's refresh token to obtain a fresh access token.
 *
 * Throws if the session has no `refreshToken`.
 * Returns a new session — the original is not mutated.
 * If the server omits `refresh_token` in the response, the previous one is preserved.
 */
export async function refreshSession<TUser = UserInfo>(
	session: SmartSession<TUser>,
): Promise<SmartSession<TUser>> {
	if (!session.refreshToken) {
		throw new Error("Cannot refresh — no refreshToken in session");
	}

	const body = new URLSearchParams();
	body.set("grant_type", "refresh_token");
	body.set("refresh_token", session.refreshToken);
	if (session.scope) body.set("scope", session.scope);

	const headers: Record<string, string> = {
		"content-type": "application/x-www-form-urlencoded",
		accept: "application/json",
	};

	if (session.clientSecret) {
		headers.authorization = buildBasicAuth(
			session.clientId,
			session.clientSecret,
		);
	} else {
		body.set("client_id", session.clientId);
	}

	const response = await fetch(session.tokenUri, {
		method: "POST",
		headers,
		body: body.toString(),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(
			`Token refresh failed (${response.status}): ${text || response.statusText}`,
		);
	}

	const token = (await response.json()) as SmartRefreshTokenResponse;
	const refreshToken = session.refreshToken;
	const expiresAt =
		token.expires_in !== undefined
			? Date.now() + token.expires_in * 1000
			: undefined;
	const scope = token.scope ?? session.scope;
	const patient = token.patient ?? session.patient;
	return {
		...session,
		accessToken: token.access_token,
		refreshToken,
		expiresAt,
		scope,
		patient,
	};
}

/**
 * Best-effort revocation of the session's tokens at the server's revocation endpoint.
 *
 * No-op if the session has no `revocationUri`.
 * Errors are swallowed — revocation is best-effort.
 */
export async function revokeSession<TUser = UserInfo>(
	session: SmartSession<TUser>,
): Promise<void> {
	if (!session.revocationUri) return;

	const body = new URLSearchParams();
	body.set("token", session.refreshToken ?? session.accessToken);

	const headers: Record<string, string> = {
		"content-type": "application/x-www-form-urlencoded",
	};
	if (session.clientSecret) {
		headers.authorization = buildBasicAuth(
			session.clientId,
			session.clientSecret,
		);
	} else {
		body.set("client_id", session.clientId);
	}

	try {
		await fetch(session.revocationUri, {
			method: "POST",
			headers,
			body: body.toString(),
		});
	} catch {
		// Best-effort.
	}
}

/**
 * Configuration for `SmartAppLaunchAuthProvider`.
 *
 * The provider holds no session state of its own — it asks the host for the current session on every request via `getSession`, and reports refreshed sessions back via `setSession`.
 * This makes the host's session store the single source of truth and avoids cache-coherence bugs across multiple provider instances or processes.
 */
export type SmartAppLaunchAuthProviderConfig<TUser = UserInfo> = {
	/** FHIR server base URL — used for `validateBaseUrl` and exposed as `provider.baseUrl`. */
	baseUrl: string;
	/** Called on every request to retrieve the current session. */
	getSession: () => SmartSession<TUser> | Promise<SmartSession<TUser>>;
	/** Called whenever the provider obtains a new session (after refresh). The host must persist it. */
	setSession: (session: SmartSession<TUser>) => void | Promise<void>;
	/** Refresh the token this many seconds before expiry (default: 30). */
	tokenExpirationBuffer?: number;
};

/**
 * `AuthProvider` backed by a host-managed `SmartSession`.
 *
 * Adds `Authorization: Bearer ...` to outgoing requests, refreshes proactively before expiry, retries once on 401, and deduplicates concurrent refreshes.
 * The provider never caches the session — the host's `getSession`/`setSession` callbacks are the single source of truth.
 */
export class SmartAppLaunchAuthProvider<TUser = UserInfo>
	implements AuthProvider
{
	public baseUrl: string;

	#getSession: () => SmartSession<TUser> | Promise<SmartSession<TUser>>;
	#setSession: (session: SmartSession<TUser>) => void | Promise<void>;
	#expirationBuffer: number;
	#pendingRefresh: Promise<SmartSession<TUser>> | null = null;

	constructor(config: SmartAppLaunchAuthProviderConfig<TUser>) {
		this.baseUrl = config.baseUrl;
		this.#getSession = config.getSession;
		this.#setSession = config.setSession;
		this.#expirationBuffer = config.tokenExpirationBuffer ?? 30;
	}

	#isFresh(session: SmartSession<TUser>): boolean {
		if (session.expiresAt === undefined) return true;
		return session.expiresAt > Date.now() + this.#expirationBuffer * 1000;
	}

	async #refresh(session: SmartSession<TUser>): Promise<SmartSession<TUser>> {
		if (this.#pendingRefresh) return this.#pendingRefresh;
		this.#pendingRefresh = (async () => {
			const next = await refreshSession(session);
			await this.#setSession(next);
			return next;
		})();
		try {
			return await this.#pendingRefresh;
		} finally {
			this.#pendingRefresh = null;
		}
	}

	/**
	 * Ensure the current session has a valid access token, refreshing if necessary.
	 */
	async establishSession(): Promise<void> {
		const session = await this.#getSession();
		if (this.#isFresh(session)) return;
		if (!session.refreshToken) {
			throw new Error(
				"SmartAppLaunchAuthProvider: session is expired and has no refreshToken",
			);
		}
		await this.#refresh(session);
	}

	/**
	 * Best-effort revocation of the current session's tokens.
	 */
	async revokeSession(): Promise<void> {
		const session = await this.#getSession();
		await revokeSession(session);
	}

	async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
		validateBaseUrl(input, this.baseUrl);

		let session = await this.#getSession();
		if (!this.#isFresh(session) && session.refreshToken) {
			session = await this.#refresh(session);
		}

		const requestInit = init ?? {};
		const baseHeaders = input instanceof Request ? input.headers : undefined;
		const initHeaders = requestInit.headers
			? new Headers(requestInit.headers)
			: undefined;
		const merged = mergeHeaders(baseHeaders, initHeaders);
		merged.set("Authorization", `Bearer ${session.accessToken}`);
		requestInit.headers = merged;

		const clonedInput = input instanceof Request ? input.clone() : input;
		let retryBody: BodyInit | null | undefined = requestInit.body;
		if (requestInit.body instanceof ReadableStream) {
			const [s1, s2] = requestInit.body.tee();
			requestInit.body = s1;
			retryBody = s2;
		}

		let response = await fetch(clonedInput, requestInit);

		if (response.status === 401 && session.refreshToken) {
			const refreshed = await this.#refresh(session);
			merged.set("Authorization", `Bearer ${refreshed.accessToken}`);
			if (retryBody !== undefined) requestInit.body = retryBody;
			response = await fetch(input, requestInit);
		}

		return response;
	}
}
