import type { AuthProvider } from "./types";
import { mergeHeaders, validateBaseUrl } from "./utils";

/// IMPORTANT:
///
/// PLEASE, use one sentence per line approach in the docstrings.
/// Don't use hard-wrapping, it makes git-diff a painfull experience.

/** How the client authenticates itself at the token endpoint. */
export type ClientAuthenticationMethod = "basic" | "body";

/** Configuration accepted by `ClientCredentialsAuthProvider`. */
export type ClientCredentialsConfig = {
	/** FHIR server base URL. */
	baseUrl: string;
	/** OAuth 2.0 client identifier. */
	clientId: string;
	/** Shared client secret. */
	clientSecret: string;
	/** Space-separated scope string, sent only when supplied. */
	scope?: string | undefined;
	/** Absolute token endpoint URL (default: `<baseUrl>/auth/token`). Must be `https:` without userinfo or fragment unless `allowInsecureRequests` is set. */
	tokenEndpoint?: string | undefined;
	/** Client authentication method (default: `basic`). */
	clientAuthentication?: ClientAuthenticationMethod | undefined;
	/** Allow a plain http token endpoint (for development only, default: false). */
	allowInsecureRequests?: boolean | undefined;
	/** Refresh the token this many seconds before expiry (default: 30). */
	tokenExpirationBuffer?: number | undefined;
};

type InternalConfig = {
	clientId: string;
	clientSecret: string;
	scope: string | undefined;
	tokenEndpoint: string;
	clientAuthentication: ClientAuthenticationMethod;
	tokenExpirationBuffer: number;
};

type CachedToken = {
	accessToken: string;
	expiresAt: number;
};

/** Token lifetime assumed when the server omits `expires_in`. */
const DEFAULT_TOKEN_LIFETIME_SECONDS = 300;

type ClientCredentialsTokenResponse = {
	access_token: string;
	token_type?: string;
	expires_in?: number;
	scope?: string;
};

/**
 * Build the `Authorization` value for HTTP Basic client authentication.
 *
 * The credentials are base64-encoded as raw UTF-8, matching `BasicAuthProvider`.
 */
const buildBasicAuth = (clientId: string, clientSecret: string): string => {
	const utf8 = new TextEncoder().encode(`${clientId}:${clientSecret}`);
	return `Basic ${btoa(String.fromCharCode(...utf8))}`;
};

/** Report whether a status code asks the client to repeat the request elsewhere. */
const isRedirect = (status: number): boolean => status >= 300 && status <= 399;

/** Upper bound for the token endpoint failure description carried in an error message. */
const MAX_FAILURE_DESCRIPTION_LENGTH = 500;

/**
 * Summarize a token endpoint failure body.
 *
 * Prefers the RFC 6749 `error`/`error_description` fields and falls back to the raw payload for servers that answer with another shape.
 */
const describeTokenFailure = (bodyText: string): string => {
	try {
		const parsed = JSON.parse(bodyText) as Record<string, unknown>;
		const error = typeof parsed.error === "string" ? parsed.error : undefined;
		const description =
			typeof parsed.error_description === "string"
				? parsed.error_description
				: undefined;
		if (error !== undefined || description !== undefined) {
			return [error, description].filter(Boolean).join(" - ");
		}
	} catch {
		// Not a JSON body - fall back to the raw payload.
	}
	return bodyText;
};

/**
 * Reject a credential that cannot identify the client.
 */
const requireNonEmptyString = (value: string, name: string): string => {
	if (typeof value !== "string" || value === "") {
		throw new Error(`${name} must be a non-empty string`);
	}
	return value;
};

/**
 * Reject an expiration buffer that would make the cache lifetime undefined.
 */
const resolveExpirationBuffer = (buffer: number | undefined): number => {
	if (buffer === undefined) return 30;
	if (!Number.isFinite(buffer) || buffer < 0) {
		throw new Error(
			"tokenExpirationBuffer must be a finite number of seconds and cannot be negative",
		);
	}
	return buffer;
};

/**
 * Resolve the token endpoint, defaulting to the documented Aidbox endpoint.
 *
 * This URL receives the client credentials, so its origin has to be explicit and its scheme is checked.
 */
const resolveTokenEndpoint = (
	baseUrl: string,
	tokenEndpoint: string | undefined,
	allowInsecureRequests: boolean,
): string => {
	let url: URL;
	try {
		url =
			tokenEndpoint === undefined
				? new URL("/auth/token", baseUrl)
				: new URL(tokenEndpoint);
	} catch {
		throw new Error("tokenEndpoint must be an absolute URL");
	}

	if (url.protocol !== "https:" && url.protocol !== "http:") {
		throw new Error("tokenEndpoint must use http: or https:");
	}

	if (url.username !== "" || url.password !== "") {
		throw new Error("tokenEndpoint must not contain userinfo");
	}

	if (url.hash !== "") {
		throw new Error("tokenEndpoint must not contain a fragment");
	}

	if (url.protocol === "http:" && !allowInsecureRequests) {
		throw new Error(
			"tokenEndpoint must use https: unless allowInsecureRequests is enabled",
		);
	}

	return url.toString();
};

/**
 * Report whether a request body can be sent a second time.
 *
 * A `ReadableStream` qualifies because it is teed before the first send.
 */
const isReplayableBody = (body: BodyInit | null | undefined): boolean => {
	if (body === null || body === undefined) return true;
	if (typeof body === "string") return true;
	if (body instanceof URLSearchParams) return true;
	if (body instanceof ReadableStream) return true;
	if (body instanceof FormData) return true;
	if (body instanceof Blob) return true;
	if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) return true;
	return false;
};

/**
 * Shared-secret OAuth 2.0 client-credentials authentication provider.
 *
 * Intended for confidential server applications holding a client ID and secret.
 */
export class ClientCredentialsAuthProvider implements AuthProvider {
	/** @ignore */
	public baseUrl: string;

	#config: InternalConfig;
	#cachedToken: CachedToken | null = null;
	#pendingTokenRequest: Promise<string> | null = null;

	constructor(config: ClientCredentialsConfig) {
		this.baseUrl = config.baseUrl;
		this.#config = {
			clientId: requireNonEmptyString(config.clientId, "clientId"),
			clientSecret: requireNonEmptyString(config.clientSecret, "clientSecret"),
			scope: config.scope,
			tokenEndpoint: resolveTokenEndpoint(
				config.baseUrl,
				config.tokenEndpoint,
				config.allowInsecureRequests ?? false,
			),
			clientAuthentication: config.clientAuthentication ?? "basic",
			tokenExpirationBuffer: resolveExpirationBuffer(
				config.tokenExpirationBuffer,
			),
		};
	}

	/**
	 * Remove credential material from text that is about to leave the provider.
	 */
	#redact(text: string): string {
		return text
			.split(this.#config.clientSecret)
			.join("[REDACTED]")
			.replace(/client_secret=[^&\s"]+/gi, "client_secret=[REDACTED]")
			.replace(/Basic\s+[A-Za-z0-9+/=]+/g, "Basic [REDACTED]");
	}

	/**
	 * Wrap a transport or parsing failure of the token request.
	 *
	 * The original error is not attached as `cause` so that no unsanitized object escapes the provider.
	 */
	#transportError(error: unknown): Error {
		const message = error instanceof Error ? error.message : String(error);
		return new Error(`Token endpoint request failed: ${this.#redact(message)}`);
	}

	/**
	 * Request an access token with the client-credentials grant.
	 */
	async #requestToken(): Promise<ClientCredentialsTokenResponse> {
		const body = new URLSearchParams();
		body.set("grant_type", "client_credentials");
		if (this.#config.scope !== undefined) {
			body.set("scope", this.#config.scope);
		}

		const headers: Record<string, string> = {
			"content-type": "application/x-www-form-urlencoded",
			accept: "application/json",
		};

		if (this.#config.clientAuthentication === "basic") {
			headers.authorization = buildBasicAuth(
				this.#config.clientId,
				this.#config.clientSecret,
			);
		} else {
			body.set("client_id", this.#config.clientId);
			body.set("client_secret", this.#config.clientSecret);
		}

		let response: Response;
		try {
			response = await fetch(this.#config.tokenEndpoint, {
				method: "POST",
				headers,
				body: body.toString(),
				// Never replay the credentials to a redirect target.
				redirect: "manual",
			});
		} catch (error) {
			throw this.#transportError(error);
		}

		if (isRedirect(response.status)) {
			throw new Error(
				`Token endpoint returned ${response.status}: redirect not followed`,
			);
		}

		if (!response.ok) {
			let bodyText: string;
			try {
				bodyText = await response.text();
			} catch (error) {
				throw this.#transportError(error);
			}
			const safeDescription = this.#redact(
				describeTokenFailure(bodyText),
			).slice(0, MAX_FAILURE_DESCRIPTION_LENGTH);
			const safeStatusText = this.#redact(response.statusText);
			throw new Error(
				`Token endpoint returned ${response.status}: ${safeDescription || safeStatusText}`,
			);
		}

		let token: ClientCredentialsTokenResponse;
		try {
			token = (await response.json()) as ClientCredentialsTokenResponse;
		} catch (error) {
			throw this.#transportError(error);
		}

		if (typeof token.access_token !== "string" || token.access_token === "") {
			throw new Error("Token endpoint response is missing access_token");
		}

		return token;
	}

	/**
	 * Return the cached access token while it is outside the expiration buffer.
	 */
	#getValidCachedToken(): string | null {
		if (!this.#cachedToken) return null;
		const bufferMs = this.#config.tokenExpirationBuffer * 1000;
		if (this.#cachedToken.expiresAt > Date.now() + bufferMs) {
			return this.#cachedToken.accessToken;
		}
		return null;
	}

	/**
	 * Get a valid access token, requesting a new one when the cache is cold or stale.
	 *
	 * Concurrent callers share one in-flight token request.
	 */
	async #getAccessToken(): Promise<string> {
		const cached = this.#getValidCachedToken();
		if (cached) return cached;

		if (this.#pendingTokenRequest) {
			return this.#pendingTokenRequest;
		}

		this.#pendingTokenRequest = this.#fetchAndCacheToken();

		try {
			return await this.#pendingTokenRequest;
		} finally {
			this.#pendingTokenRequest = null;
		}
	}

	/**
	 * Request a token from the token endpoint and cache it.
	 */
	async #fetchAndCacheToken(): Promise<string> {
		const token = await this.#requestToken();
		this.#cachedToken = {
			accessToken: token.access_token,
			expiresAt:
				Date.now() +
				(token.expires_in ?? DEFAULT_TOKEN_LIFETIME_SECONDS) * 1000,
		};
		return this.#cachedToken.accessToken;
	}

	/**
	 * Establish session - obtain an access token.
	 */
	public async establishSession(): Promise<void> {
		await this.#getAccessToken();
	}

	/**
	 * Revoke session - drop the cached access token.
	 */
	public async revokeSession(): Promise<void> {
		const pending = this.#pendingTokenRequest;
		if (pending) {
			try {
				await pending;
			} catch {
				// Ignore errors - the session is being revoked anyway.
			}
		}
		this.#cachedToken = null;
	}

	/**
	 * Fetch wrapper that adds Bearer token authorization.
	 *
	 * Obtains a token on the first request and retries once after HTTP 401 when the request body is replayable.
	 */
	public async fetch(
		input: RequestInfo | URL,
		init?: RequestInit,
	): Promise<Response> {
		validateBaseUrl(input, this.baseUrl);

		const accessToken = await this.#getAccessToken();

		const requestInit = init ?? {};
		const baseHeaders = input instanceof Request ? input.headers : undefined;
		const initHeaders = requestInit.headers
			? new Headers(requestInit.headers)
			: undefined;
		const mergedHeaders = mergeHeaders(baseHeaders, initHeaders);
		mergedHeaders.set("Authorization", `Bearer ${accessToken}`);
		requestInit.headers = mergedHeaders;

		// Clone input/body to preserve for a potential retry.
		const clonedInput = input instanceof Request ? input.clone() : input;
		let retryBody: BodyInit | null | undefined = requestInit.body;
		const bodyIsReplayable = isReplayableBody(requestInit.body);

		// If body is a ReadableStream, tee it for the potential retry.
		if (requestInit.body instanceof ReadableStream) {
			const [stream1, stream2] = requestInit.body.tee();
			requestInit.body = stream1;
			retryBody = stream2;
		}

		let response = await fetch(clonedInput, requestInit);

		// If 401, get a fresh token and retry once, but only with a replayable body.
		if (response.status === 401 && bodyIsReplayable) {
			// Only drop the token this request actually used, so a token that a
			// concurrent request already refreshed survives.
			if (this.#cachedToken?.accessToken === accessToken) {
				this.#cachedToken = null;
			}
			const newToken = await this.#getAccessToken();
			mergedHeaders.set("Authorization", `Bearer ${newToken}`);
			if (retryBody !== undefined) {
				requestInit.body = retryBody;
			}
			response = await fetch(input, requestInit);
		}

		return response;
	}
}
