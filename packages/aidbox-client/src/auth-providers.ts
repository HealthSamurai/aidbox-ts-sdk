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

// TODO: backend auth provider
