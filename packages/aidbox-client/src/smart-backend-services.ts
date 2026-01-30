import * as oauth from "oauth4webapi";
import type { AuthProvider } from "./types";
import { mergeHeaders, validateBaseUrl } from "./utils";

export type SmartBackendServicesConfig = {
	/** FHIR server base URL */
	baseUrl: string;
	/** OAuth 2.0 client ID */
	clientId: string;
	/** Private key for signing JWTs (CryptoKey from Web Crypto API) */
	privateKey: CryptoKey;
	/** Key ID (kid) - must match the kid in JWKS registered on the server */
	keyId: string;
	/** OAuth 2.0 scopes (e.g., "system/*.read") */
	scope: string;
	/** Token expiration buffer in seconds (refresh token this many seconds before expiry, default: 30) */
	tokenExpirationBuffer?: number;
	/** Allow insecure HTTP requests (for testing only, default: false) */
	allowInsecureRequests?: boolean;
};

type CachedToken = {
	accessToken: string;
	expiresAt: number;
};

type InternalConfig = {
	baseUrl: string;
	clientId: string;
	privateKey: CryptoKey;
	keyId: string;
	scope: string;
	tokenExpirationBuffer: number;
	allowInsecureRequests: boolean;
};

/**
 * SMART Backend Services authentication provider.
 *
 * Implements OAuth 2.0 client_credentials grant with JWT bearer assertion
 * for server-to-server authentication per SMART Backend Services spec.
 *
 * @see https://hl7.org/fhir/smart-app-launch/backend-services.html
 */
export class SmartBackendServicesAuthProvider implements AuthProvider {
	public baseUrl: string;

	#config: InternalConfig;
	#cachedToken: CachedToken | null = null;
	#pendingTokenRequest: Promise<string> | null = null;

	constructor(config: SmartBackendServicesConfig) {
		this.baseUrl = config.baseUrl;
		this.#config = {
			baseUrl: config.baseUrl,
			clientId: config.clientId,
			privateKey: config.privateKey,
			keyId: config.keyId,
			scope: config.scope,
			tokenExpirationBuffer: config.tokenExpirationBuffer ?? 30,
			allowInsecureRequests: config.allowInsecureRequests ?? false,
		};
	}

	async #discoverAuthServer(): Promise<oauth.AuthorizationServer> {
		const url = new URL(this.#config.baseUrl);
		const response = await oauth.discoveryRequest(url, {
			algorithm: "oauth2",
			[oauth.allowInsecureRequests]: this.#config.allowInsecureRequests,
		});
		const metadata = await oauth.processDiscoveryResponse(url, response);

		if (!metadata.token_endpoint) {
			throw new Error("Discovery response missing token_endpoint");
		}

		return metadata;
	}

	/**
	 * Request access token from token endpoint using client_credentials grant.
	 */
	async #requestToken(): Promise<oauth.TokenEndpointResponse> {
		const as = await this.#discoverAuthServer();

		const client: oauth.Client = {
			client_id: this.#config.clientId,
		};

		const privateKey = {
			key: this.#config.privateKey,
			kid: this.#config.keyId,
		};

		// Aidbox requires typ: "JWT" in the client assertion JWT header.
		// oauth.modifyAssertion is a Symbol that allows customizing the JWT before signing.
		const clientAuth = oauth.PrivateKeyJwt(privateKey, {
			[oauth.modifyAssertion]: (header) => {
				header.typ = "JWT";
			},
		});

		// Request parameters
		const params = new URLSearchParams();
		params.set("scope", this.#config.scope);

		const response = await oauth.clientCredentialsGrantRequest(
			as,
			client,
			clientAuth,
			params,
			{
				[oauth.allowInsecureRequests]: this.#config.allowInsecureRequests,
			},
		);

		// Some servers (e.g., Aidbox) return "refresh_token": null which is
		// non-conforming to RFC 6749. oauth4webapi strictly validates this and throws exception
		// We intercept the response and remove null fields before processing.
		const sanitizedResponse = await this.#sanitizeTokenResponse(response);

		return oauth.processClientCredentialsResponse(
			as,
			client,
			sanitizedResponse,
		);
	}

	/**
	 * Fixes "refresh_token" = null which does not work with oauth4webapi
	 * Fixed in Aidbox 2601, but kept for backwards compatibility.
	 */
	async #sanitizeTokenResponse(response: Response): Promise<Response> {
		const cloned = response.clone();
		const body = await cloned.json();

		if (!("refresh_token" in body) || body.refresh_token !== null) {
			return response;
		}

		const { refresh_token: _, ...sanitized } = body;

		return new Response(JSON.stringify(sanitized), {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		});
	}

	/**
	 * Get valid cached token if not expired, or null if needs refresh.
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
	 * Get a valid access token, refreshing if necessary.
	 * Deduplicates concurrent requests to prevent thundering herd.
	 */
	async #getAccessToken(): Promise<string> {
		const validToken = this.#getValidCachedToken();
		if (validToken) {
			return validToken;
		}

		// If a token request is already in progress, wait for it
		if (this.#pendingTokenRequest) {
			return this.#pendingTokenRequest;
		}

		// Request new token, storing the promise to deduplicate concurrent calls
		this.#pendingTokenRequest = this.#fetchAndCacheToken();

		try {
			return await this.#pendingTokenRequest;
		} finally {
			this.#pendingTokenRequest = null;
		}
	}

	/**
	 * Fetch token from server and cache it.
	 */
	async #fetchAndCacheToken(): Promise<string> {
		const tokenResponse = await this.#requestToken();
		const now = Date.now();

		this.#cachedToken = {
			accessToken: tokenResponse.access_token,
			expiresAt: now + (tokenResponse.expires_in ?? 300) * 1000,
		};

		return this.#cachedToken.accessToken;
	}

	/**
	 * Establish session - for Backend Services this means getting a token.
	 */
	public async establishSession(): Promise<void> {
		await this.#getAccessToken();
	}

	/**
	 * Revoke session - clear cached token.
	 */
	public async revokeSession(): Promise<void> {
		// Wait for any pending token request to settle before clearing
		const pending = this.#pendingTokenRequest;
		if (pending) {
			try {
				await pending;
			} catch {
				// Ignore errors - we're revoking anyway
			}
		}
		this.#cachedToken = null;
	}

	/**
	 * Fetch wrapper that adds Bearer token authorization.
	 * Automatically obtains token on first request and retries once on 401.
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

		// Clone input/body to preserve for potential retry
		const clonedInput = input instanceof Request ? input.clone() : input;
		let retryBody: BodyInit | null | undefined = requestInit.body;

		// If body is a ReadableStream, tee it for potential retry
		if (requestInit.body instanceof ReadableStream) {
			const [stream1, stream2] = requestInit.body.tee();
			requestInit.body = stream1;
			retryBody = stream2;
		}

		let response = await fetch(clonedInput, requestInit);

		// If 401, try to get a new token and retry once
		if (response.status === 401) {
			this.#cachedToken = null;
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
