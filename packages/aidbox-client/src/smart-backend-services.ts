import type { AuthProvider } from "./types";
import { mergeHeaders, validateBaseUrl } from "./utils";

/** Supported signing algorithms per SMART Backend Services spec */
export type SmartAlgorithm = "RS384" | "ES384";

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
	/**
	 * Token endpoint URL (optional).
	 * If not provided, will be discovered from .well-known/smart-configuration.
	 */
	tokenEndpoint?: string;
	/**
	 * Algorithm for signing (default: RS384).
	 * Per SMART spec, clients MUST support both RS384 and ES384.
	 */
	algorithm?: SmartAlgorithm;
	/** Token expiration buffer in seconds (refresh token this many seconds before expiry, default: 30) */
	tokenExpirationBuffer?: number;
	/** Skip discovery and use provided/default tokenEndpoint (default: false) */
	skipDiscovery?: boolean;
}

/** SMART configuration metadata from .well-known/smart-configuration */
export interface SmartConfiguration {
	token_endpoint: string;
	token_endpoint_auth_methods_supported?: string[];
	token_endpoint_auth_signing_alg_values_supported?: string[];
	scopes_supported?: string[];
	capabilities?: string[];
	issuer?: string;
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
 * @see https://hl7.org/fhir/smart-app-launch/backend-services.html
 */
export class SmartBackendServicesAuthProvider implements AuthProvider {
	public baseUrl: string;

	#config: Omit<SmartBackendServicesConfig, "tokenEndpoint" | "skipDiscovery"> &
		Required<
			Pick<
				SmartBackendServicesConfig,
				"algorithm" | "tokenExpirationBuffer" | "skipDiscovery"
			>
		> & { tokenEndpoint?: string };
	#cachedToken: CachedToken | null = null;
	#cryptoKey: CryptoKey | null = null;
	#pendingTokenRequest: Promise<string> | null = null;
	#smartConfiguration: SmartConfiguration | null = null;
	#pendingDiscovery: Promise<SmartConfiguration> | null = null;

	constructor(config: SmartBackendServicesConfig) {
		this.baseUrl = config.baseUrl;
		this.#config = {
			baseUrl: config.baseUrl,
			clientId: config.clientId,
			privateKey: config.privateKey,
			keyId: config.keyId,
			scope: config.scope,
			algorithm: config.algorithm ?? "RS384",
			tokenExpirationBuffer: config.tokenExpirationBuffer ?? 30,
			skipDiscovery: config.skipDiscovery ?? false,
			...(config.tokenEndpoint !== undefined && {
				tokenEndpoint: config.tokenEndpoint,
			}),
		};
	}

	/**
	 * Discover SMART configuration from .well-known/smart-configuration.
	 * Caches the result and deduplicates concurrent requests.
	 */
	async #discoverConfiguration(): Promise<SmartConfiguration> {
		// Return cached configuration
		if (this.#smartConfiguration) {
			return this.#smartConfiguration;
		}

		// If discovery is already in progress, wait for it
		if (this.#pendingDiscovery) {
			return this.#pendingDiscovery;
		}

		// Start discovery
		this.#pendingDiscovery = this.#fetchSmartConfiguration();

		try {
			this.#smartConfiguration = await this.#pendingDiscovery;
			return this.#smartConfiguration;
		} finally {
			this.#pendingDiscovery = null;
		}
	}

	/**
	 * Fetch SMART configuration from the well-known endpoint.
	 */
	async #fetchSmartConfiguration(): Promise<SmartConfiguration> {
		const url = `${this.#config.baseUrl}/.well-known/smart-configuration`;
		const response = await fetch(url, {
			headers: {
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(
				`Failed to fetch SMART configuration from ${url}: ${response.status} ${response.statusText}`,
			);
		}

		const config = (await response.json()) as SmartConfiguration;

		if (!config.token_endpoint) {
			throw new Error(
				"SMART configuration missing required token_endpoint field",
			);
		}

		return config;
	}

	/**
	 * Get the token endpoint URL, either from config or via discovery.
	 */
	async #getTokenEndpoint(): Promise<string> {
		// If explicitly provided, use it
		if (this.#config.tokenEndpoint) {
			return this.#config.tokenEndpoint;
		}

		// If skipDiscovery is true, use default
		if (this.#config.skipDiscovery) {
			return `${this.#config.baseUrl}/auth/token`;
		}

		// Discover from .well-known/smart-configuration
		const smartConfig = await this.#discoverConfiguration();
		return smartConfig.token_endpoint;
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

		// Check for EC PRIVATE KEY format (also needs conversion)
		if (pem.includes("-----BEGIN EC PRIVATE KEY-----")) {
			throw new Error(
				"SEC1 EC format (BEGIN EC PRIVATE KEY) is not supported. " +
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

		const algorithmParams = this.#getImportAlgorithmParams();

		this.#cryptoKey = await crypto.subtle.importKey(
			"pkcs8",
			binaryKey,
			algorithmParams,
			false,
			["sign"],
		);

		return this.#cryptoKey;
	}

	/**
	 * Get algorithm parameters for key import based on configured algorithm.
	 */
	#getImportAlgorithmParams(): RsaHashedImportParams | EcKeyImportParams {
		if (this.#config.algorithm === "ES384") {
			return {
				name: "ECDSA",
				namedCurve: "P-384",
			};
		}
		// RS384 (default)
		return {
			name: "RSASSA-PKCS1-v1_5",
			hash: "SHA-384",
		};
	}

	/**
	 * Get algorithm parameters for signing based on configured algorithm.
	 */
	#getSignAlgorithmParams(): AlgorithmIdentifier | RsaPssParams | EcdsaParams {
		if (this.#config.algorithm === "ES384") {
			return {
				name: "ECDSA",
				hash: "SHA-384",
			};
		}
		// RS384 (default)
		return { name: "RSASSA-PKCS1-v1_5" };
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
	async #createClientAssertion(tokenEndpoint: string): Promise<string> {
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
			aud: tokenEndpoint,
			exp,
			jti: this.#generateJti(),
		};

		const encodedHeader = this.#base64UrlEncode(JSON.stringify(header));
		const encodedPayload = this.#base64UrlEncode(JSON.stringify(payload));
		const signingInput = `${encodedHeader}.${encodedPayload}`;

		const privateKey = await this.#getPrivateKey();
		const signParams = this.#getSignAlgorithmParams();
		const signature = await crypto.subtle.sign(
			signParams,
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
		const tokenEndpoint = await this.#getTokenEndpoint();
		const clientAssertion = await this.#createClientAssertion(tokenEndpoint);

		const body = new URLSearchParams();
		body.set("grant_type", "client_credentials");
		body.set(
			"client_assertion_type",
			"urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
		);
		body.set("client_assertion", clientAssertion);
		body.set("scope", this.#config.scope);

		const response = await fetch(tokenEndpoint, {
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
		// Wait for any pending token request to settle before clearing
		// This prevents race condition where in-flight request overwrites cleared state
		const pending = this.#pendingTokenRequest;
		if (pending) {
			try {
				await pending;
			} catch {
				// Ignore errors - we're revoking anyway
			}
		}
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

	/**
	 * Get the discovered SMART configuration.
	 * Useful for inspecting server capabilities.
	 */
	public async getSmartConfiguration(): Promise<SmartConfiguration> {
		return this.#discoverConfiguration();
	}
}

/** RSA public key JWK for RS384 */
export interface RsaPublicKeyJwk {
	kty: "RSA";
	n: string;
	e: string;
	kid: string;
	alg: "RS384";
	use: "sig";
}

/** EC public key JWK for ES384 */
export interface EcPublicKeyJwk {
	kty: "EC";
	crv: "P-384";
	x: string;
	y: string;
	kid: string;
	alg: "ES384";
	use: "sig";
}

/** Result of generateKeyPair for RS384 */
export interface RsaKeyPairResult {
	privateKeyPem: string;
	publicKeyJwk: RsaPublicKeyJwk;
	keyId: string;
	algorithm: "RS384";
}

/** Result of generateKeyPair for ES384 */
export interface EcKeyPairResult {
	privateKeyPem: string;
	publicKeyJwk: EcPublicKeyJwk;
	keyId: string;
	algorithm: "ES384";
}

/**
 * Generate key pair for SMART Backend Services.
 *
 * Per SMART spec, clients MUST support both RS384 and ES384.
 *
 * @param algorithm - "RS384" (RSA) or "ES384" (ECDSA P-384). Default: "RS384"
 * @returns Object containing private key (PEM), public key (JWK), and key ID
 */
export async function generateKeyPair(
	algorithm?: "RS384",
): Promise<RsaKeyPairResult>;
export async function generateKeyPair(
	algorithm: "ES384",
): Promise<EcKeyPairResult>;
export async function generateKeyPair(
	algorithm: SmartAlgorithm = "RS384",
): Promise<RsaKeyPairResult | EcKeyPairResult> {
	// Generate key ID
	const keyIdBytes = new Uint8Array(16);
	crypto.getRandomValues(keyIdBytes);
	const keyId = bytesToHex(keyIdBytes);

	if (algorithm === "ES384") {
		return generateEcKeyPair(keyId);
	}
	return generateRsaKeyPair(keyId);
}

/**
 * Generate RSA key pair for RS384
 */
async function generateRsaKeyPair(keyId: string): Promise<RsaKeyPairResult> {
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

	return {
		privateKeyPem,
		publicKeyJwk: {
			kty: "RSA",
			n: publicKeyJwk.n as string,
			e: publicKeyJwk.e as string,
			kid: keyId,
			alg: "RS384",
			use: "sig",
		},
		keyId,
		algorithm: "RS384",
	};
}

/**
 * Generate EC key pair for ES384 (P-384 curve)
 */
async function generateEcKeyPair(keyId: string): Promise<EcKeyPairResult> {
	const keyPair = await crypto.subtle.generateKey(
		{
			name: "ECDSA",
			namedCurve: "P-384",
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

	return {
		privateKeyPem,
		publicKeyJwk: {
			kty: "EC",
			crv: "P-384",
			x: publicKeyJwk.x as string,
			y: publicKeyJwk.y as string,
			kid: keyId,
			alg: "ES384",
			use: "sig",
		},
		keyId,
		algorithm: "ES384",
	};
}
