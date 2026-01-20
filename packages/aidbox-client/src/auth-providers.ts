import type { AuthProvider } from "./types";

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
		var url: string;

		if (input instanceof Request) url = input.url;
		else url = input.toString();

		if (!url.startsWith(this.baseUrl))
			throw Error("url of the request must start with baseUrl");

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
		// Create Base64-encoded credentials for Basic Auth header
		this.#authHeader = `Basic ${btoa(`${username}:${password}`)}`;
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
		let url: string;

		if (input instanceof Request) url = input.url;
		else url = input.toString();

		if (!url.startsWith(this.baseUrl))
			throw Error("url of the request must start with baseUrl");

		const i = init ?? {};

		// Merge headers from Request object (if any), init.headers, and Authorization
		const mergedHeaders = new Headers();

		// First, copy headers from Request object if input is a Request
		if (input instanceof Request) {
			input.headers.forEach((value, key) => {
				mergedHeaders.set(key, value);
			});
		}

		// Then, copy headers from init (overrides Request headers)
		if (i.headers) {
			const initHeaders = new Headers(i.headers);
			initHeaders.forEach((value, key) => {
				mergedHeaders.set(key, value);
			});
		}

		// Finally, set Authorization header
		mergedHeaders.set("Authorization", this.#authHeader);

		i.headers = mergedHeaders;

		return fetch(input, i);
	}
}
