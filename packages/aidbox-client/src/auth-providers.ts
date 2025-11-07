import type { AuthProvider } from "./types";

export class BrowserAuthProvider implements AuthProvider {
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

	public async establishSession() {
		if (!(await this.#checkSession())) {
			const encodedLocation = encodeURIComponent(btoa(window.location.href));
			const redirectTo = `${this.baseUrl}/auth/login?redirect_to=${encodedLocation}`;
			window.location.href = redirectTo;
		}
	}

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
