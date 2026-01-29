import type { AuthProvider } from "./types";
import { mergeHeaders, validateBaseUrl } from "./utils";

export class BrowserAuthProvider implements AuthProvider {
	/** @ignore */
	public baseUrl: string;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	async #checkSession() {
		const response = await fetch(new URL("/auth/userinfo", this.baseUrl), {
			method: "GET",
			headers: {
				"content-type": "application/json",
				accept: "application/json",
			},
			credentials: "include",
		});
		return response.status !== 401;
	}

	/**
	 * Checks if the session is already authenticated, and if not, redirects to the login page.
	 */
	public async establishSession() {
		if (!(await this.#checkSession())) {
			const encodedLocation = encodeURIComponent(btoa(window.location.href));
			const redirectTo = `${this.baseUrl}/auth/login?redirect_to=${encodedLocation}`;
			window.location.href = redirectTo;
		}
	}

	/**
	 * Sends a POST request to `baseurl/auth/logout`.
	 */
	public async revokeSession() {
		await fetch(new URL("/auth/logout", this.baseUrl), {
			method: "POST",
			headers: {
				"content-type": "application/json",
				accept: "application/json",
			},
			credentials: "include",
		});
	}

	/**
	 * A thin wrapper around `fetch` function.
	 * Checks if the client is authorized to perform a request, and redirects to a login page if not.
	 *
	 * Accepts the same arguments as `fetch`.
	 */
	public async fetch(
		input: RequestInfo | URL,
		init?: RequestInit,
	): Promise<Response> {
		validateBaseUrl(input, this.baseUrl);

		const i = init ?? {};

		i.credentials = "include";

		const response = await fetch(input, i);

		if (response.status === 401) {
			await this.establishSession();
			throw new Error("unauthorized");
		} else {
			return response;
		}
	}
}

export class BasicAuthProvider implements AuthProvider {
	/** @ignore */
	public baseUrl: string;
	#authHeader: string;

	constructor(baseUrl: string, username: string, password: string) {
		this.baseUrl = baseUrl;
		// Create Base64-encoded credentials for Basic Auth header (RFC 7617: UTF-8 encoded)
		const credentials = `${username}:${password}`;
		const utf8Bytes = new TextEncoder().encode(credentials);
		const base64 = btoa(String.fromCharCode(...utf8Bytes));
		this.#authHeader = `Basic ${base64}`;
	}

	public async establishSession(): Promise<void> {
		// No-op for basic auth - credentials are sent with each request
	}

	public async revokeSession(): Promise<void> {
		// No-op for basic auth - stateless authentication
	}

	public async fetch(
		input: RequestInfo | URL,
		init?: RequestInit,
	): Promise<Response> {
		validateBaseUrl(input, this.baseUrl);

		const i = init ?? {};
		const headers = mergeHeaders(input, i);
		headers.set("Authorization", this.#authHeader);
		i.headers = headers;

		return fetch(input, i);
	}
}
