import type { AuthProvider } from "./types";
import { mergeHeaders, validateBaseUrl } from "./utils";

export interface SmartBackendServicesConfig {
	/** FHIR server base URL */
	baseUrl: string;
	/** OAuth 2.0 client ID */
	clientId: string;
	/** Private key in PEM format for signing JWTs */
	privateKey: string;
	/** Key ID (kid) - must match the kid in JWKS */
	keyId: string;
	/** OAuth 2.0 scopes (e.g., "system/*.read") */
	scope: string;
	/** Token endpoint (optional - defaults to baseUrl/auth/token) */
	tokenEndpoint?: string;
	/** Algorithm for signing (default: RS384). Only RS384 is supported per SMART Backend Services spec. */
	algorithm?: "RS384";
	/** Token expiration buffer in seconds (refresh token this many seconds before expiry, default: 30) */
	tokenExpirationBuffer?: number;
}

interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope?: string;
}

interface CachedToken {
	accessToken: string;
	expiresAt: number;
}

/** Convert Uint8Array to hex string */
function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

/**
 * SMART Backend Services authentication provider.
 *
 * Implements OAuth 2.0 client_credentials grant with JWT bearer assertion
 * for server-to-server authentication per SMART Backend Services spec.
 *
 * @see https://www.health-samurai.io/docs/aidbox/access-control/authorization/smart-on-fhir/smart-client-authorization/smart-backend-services
 */
export class SmartBackendServicesAuthProvider implements AuthProvider {
	public baseUrl: string;

	#config: Required<SmartBackendServicesConfig>;
	#cachedToken: CachedToken | null = null;
	#cryptoKey: CryptoKey | null = null;
	#pendingTokenRequest: Promise<string> | null = null;

	constructor(config: SmartBackendServicesConfig) {
		this.baseUrl = config.baseUrl;
		this.#config = {
			baseUrl: config.baseUrl,
			clientId: config.clientId,
			privateKey: config.privateKey,
			keyId: config.keyId,
			scope: config.scope,
			tokenEndpoint: config.tokenEndpoint ?? `${config.baseUrl}/auth/token`,
			algorithm: config.algorithm ?? "RS384",
			tokenExpirationBuffer: config.tokenExpirationBuffer ?? 30,
		};
	}

	/**
	 * Import PEM private key for signing.
	 * Only PKCS#8 format is supported (-----BEGIN PRIVATE KEY-----).
	 */
	async #getPrivateKey(): Promise<CryptoKey> {
		if (this.#cryptoKey) return this.#cryptoKey;

		const pem = this.#config.privateKey;

		// Check for unsupported PKCS#1 format
		if (pem.includes("-----BEGIN RSA PRIVATE KEY-----")) {
			throw new Error(
				"PKCS#1 format (BEGIN RSA PRIVATE KEY) is not supported. " +
					"Please convert to PKCS#8 format (BEGIN PRIVATE KEY) using: " +
					"openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in key.pem -out key-pkcs8.pem",
			);
		}

		const pemContents = pem
			.replace(/-----BEGIN PRIVATE KEY-----/, "")
			.replace(/-----END PRIVATE KEY-----/, "")
			.replace(/\s/g, "");

		const binaryKey = Uint8Array.from(atob(pemContents), (c) =>
			c.charCodeAt(0),
		);

		const algorithmParams = this.#getAlgorithmParams();

		this.#cryptoKey = await crypto.subtle.importKey(
			"pkcs8",
			binaryKey,
			algorithmParams,
			false,
			["sign"],
		);

		return this.#cryptoKey;
	}

	#getAlgorithmParams(): RsaHashedImportParams {
		// RS384 per SMART Backend Services spec
		return {
			name: "RSASSA-PKCS1-v1_5",
			hash: "SHA-384",
		};
	}

	#base64UrlEncode(data: Uint8Array | string): string {
		const bytes =
			typeof data === "string" ? new TextEncoder().encode(data) : data;
		const base64 = btoa(String.fromCharCode(...bytes));
		return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
	}

	/**
	 * Generate a cryptographically random JTI
	 */
	#generateJti(): string {
		const bytes = new Uint8Array(32);
		crypto.getRandomValues(bytes);
		return bytesToHex(bytes);
	}

	/**
	 * Create and sign a JWT for client assertion
	 */
	async #createClientAssertion(): Promise<string> {
		const now = Math.floor(Date.now() / 1000);
		const exp = now + 300; // 5 minutes max per spec

		const header = {
			alg: this.#config.algorithm,
			typ: "JWT",
			kid: this.#config.keyId,
		};

		const payload = {
			iss: this.#config.clientId,
			sub: this.#config.clientId,
			aud: this.#config.tokenEndpoint,
			exp,
			iat: now,
			jti: this.#generateJti(),
		};

		const encodedHeader = this.#base64UrlEncode(JSON.stringify(header));
		const encodedPayload = this.#base64UrlEncode(JSON.stringify(payload));
		const signingInput = `${encodedHeader}.${encodedPayload}`;

		const privateKey = await this.#getPrivateKey();
		const signature = await crypto.subtle.sign(
			{ name: "RSASSA-PKCS1-v1_5" },
			privateKey,
			new TextEncoder().encode(signingInput),
		);

		const encodedSignature = this.#base64UrlEncode(new Uint8Array(signature));

		return `${signingInput}.${encodedSignature}`;
	}

	/**
	 * Request access token from token endpoint
	 */
	async #requestToken(): Promise<TokenResponse> {
		const clientAssertion = await this.#createClientAssertion();

		const body = new URLSearchParams();
		body.set("grant_type", "client_credentials");
		body.set(
			"client_assertion_type",
			"urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
		);
		body.set("client_assertion", clientAssertion);
		body.set("scope", this.#config.scope);

		const response = await fetch(this.#config.tokenEndpoint, {
			method: "POST",
			headers: {
				"content-type": "application/x-www-form-urlencoded",
			},
			body: body.toString(),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Token request failed: ${response.status} - ${error}`);
		}

		return response.json();
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
		// Return cached token if still valid
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
	 * Fetch token from server and cache it
	 */
	async #fetchAndCacheToken(): Promise<string> {
		const tokenResponse = await this.#requestToken();
		const now = Date.now();

		this.#cachedToken = {
			accessToken: tokenResponse.access_token,
			expiresAt: now + tokenResponse.expires_in * 1000,
		};

		return this.#cachedToken.accessToken;
	}

	/**
	 * Establish session - for Backend Services this means getting a token
	 */
	public async establishSession(): Promise<void> {
		await this.#getAccessToken();
	}

	/**
	 * Revoke session - clear cached token
	 */
	public async revokeSession(): Promise<void> {
		this.#cachedToken = null;
		this.#cryptoKey = null;
	}

	/**
	 * Check if we have a valid cached token
	 */
	async isAuthenticated(): Promise<boolean> {
		return this.#getValidCachedToken() !== null;
	}

	/**
	 * Fetch wrapper that adds Bearer token authorization
	 */
	public async fetch(
		input: RequestInfo | URL,
		init?: RequestInit,
	): Promise<Response> {
		validateBaseUrl(input, this.baseUrl);

		const accessToken = await this.#getAccessToken();

		const i = init ?? {};
		const mergedHeaders = mergeHeaders(input, i);
		mergedHeaders.set("Authorization", `Bearer ${accessToken}`);
		i.headers = mergedHeaders;

		// Clone input/body to preserve for potential retry
		const clonedInput = input instanceof Request ? input.clone() : input;
		let retryBody: BodyInit | null | undefined = i.body;

		// If body is a ReadableStream, tee it for potential retry
		if (i.body instanceof ReadableStream) {
			const [stream1, stream2] = i.body.tee();
			i.body = stream1;
			retryBody = stream2;
		}

		let response = await fetch(clonedInput, i);

		// If 401, try to get a new token and retry once
		if (response.status === 401) {
			this.#cachedToken = null;
			const newToken = await this.#getAccessToken();
			mergedHeaders.set("Authorization", `Bearer ${newToken}`);
			if (retryBody !== undefined) {
				i.body = retryBody;
			}
			response = await fetch(input, i);
		}

		return response;
	}
}

/**
 * Generate RSA key pair for SMART Backend Services
 *
 * @returns Object containing private key (PEM), public key (JWK), and key ID
 */
export async function generateKeyPair(): Promise<{
	privateKeyPem: string;
	publicKeyJwk: JsonWebKey & { kid: string };
	keyId: string;
}> {
	const keyPair = await crypto.subtle.generateKey(
		{
			name: "RSASSA-PKCS1-v1_5",
			modulusLength: 2048,
			publicExponent: new Uint8Array([1, 0, 1]),
			hash: "SHA-384",
		},
		true,
		["sign", "verify"],
	);

	// Export private key as PKCS8 PEM
	const privateKeyBuffer = await crypto.subtle.exportKey(
		"pkcs8",
		keyPair.privateKey,
	);
	const privateKeyBase64 = btoa(
		String.fromCharCode(...new Uint8Array(privateKeyBuffer)),
	);
	const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64.match(/.{1,64}/g)?.join("\n")}\n-----END PRIVATE KEY-----`;

	// Export public key as JWK
	const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

	// Generate key ID
	const keyIdBytes = new Uint8Array(16);
	crypto.getRandomValues(keyIdBytes);
	const keyId = bytesToHex(keyIdBytes);

	return {
		privateKeyPem,
		publicKeyJwk: {
			...publicKeyJwk,
			kid: keyId,
		},
		keyId,
	};
}
