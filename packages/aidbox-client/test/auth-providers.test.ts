import { BasicAuthProvider, BrowserAuthProvider } from "src/auth-providers";
import { afterEach, describe, expect, it, vi } from "vitest";

// Helper to encode credentials the same way as BasicAuthProvider (RFC 7617: UTF-8)
function encodeBasicAuth(username: string, password: string): string {
	const credentials = `${username}:${password}`;
	const utf8Bytes = new TextEncoder().encode(credentials);
	return btoa(String.fromCharCode(...utf8Bytes));
}

describe("BasicAuthProvider", () => {
	const baseUrl = "http://localhost:8080";

	it("should add Authorization header to requests", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
		});
		globalThis.fetch = mockFetch;

		const provider = new BasicAuthProvider(baseUrl, "admin", "secret");
		await provider.fetch(`${baseUrl}/Patient`);

		expect(mockFetch).toHaveBeenCalledWith(
			`${baseUrl}/Patient`,
			expect.objectContaining({
				headers: expect.any(Headers),
			}),
		);

		const headers = mockFetch.mock.calls[0]?.[1].headers as Headers;
		expect(headers.get("Authorization")).toBe(
			`Basic ${encodeBasicAuth("admin", "secret")}`,
		);
	});

	it("should throw error if URL does not start with baseUrl", async () => {
		const provider = new BasicAuthProvider(baseUrl, "admin", "secret");

		await expect(
			provider.fetch("http://other-server.com/Patient"),
		).rejects.toThrow("URL of the request must start with baseUrl");
	});

	it("should preserve existing headers from init object", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
		});
		globalThis.fetch = mockFetch;

		const provider = new BasicAuthProvider(baseUrl, "admin", "secret");
		await provider.fetch(`${baseUrl}/Patient`, {
			headers: { "X-Custom-Header": "value" },
		});

		const headers = mockFetch.mock.calls[0]?.[1].headers as Headers;
		expect(headers.get("Authorization")).toBe(
			`Basic ${encodeBasicAuth("admin", "secret")}`,
		);
		expect(headers.get("X-Custom-Header")).toBe("value");
	});

	it("should preserve headers from Headers instance", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
		});
		globalThis.fetch = mockFetch;

		const provider = new BasicAuthProvider(baseUrl, "admin", "secret");
		const initHeaders = new Headers();
		initHeaders.set("X-Custom-Header", "value");
		initHeaders.set("Content-Type", "application/json");

		await provider.fetch(`${baseUrl}/Patient`, {
			headers: initHeaders,
		});

		const headers = mockFetch.mock.calls[0]?.[1].headers as Headers;
		expect(headers.get("Authorization")).toBe(
			`Basic ${encodeBasicAuth("admin", "secret")}`,
		);
		expect(headers.get("X-Custom-Header")).toBe("value");
		expect(headers.get("Content-Type")).toBe("application/json");
	});

	it("should preserve headers from Request object", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
		});
		globalThis.fetch = mockFetch;

		const provider = new BasicAuthProvider(baseUrl, "admin", "secret");
		const request = new Request(`${baseUrl}/Patient`, {
			headers: { "X-Request-Header": "request-value" },
		});

		await provider.fetch(request);

		const headers = mockFetch.mock.calls[0]?.[1].headers as Headers;
		expect(headers.get("Authorization")).toBe(
			`Basic ${encodeBasicAuth("admin", "secret")}`,
		);
		expect(headers.get("X-Request-Header")).toBe("request-value");
	});

	it("should merge headers from Request and init, with init taking precedence", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
		});
		globalThis.fetch = mockFetch;

		const provider = new BasicAuthProvider(baseUrl, "admin", "secret");
		const request = new Request(`${baseUrl}/Patient`, {
			headers: {
				"X-Request-Header": "request-value",
				"X-Shared-Header": "from-request",
			},
		});

		await provider.fetch(request, {
			headers: {
				"X-Init-Header": "init-value",
				"X-Shared-Header": "from-init",
			},
		});

		const headers = mockFetch.mock.calls[0]?.[1].headers as Headers;
		expect(headers.get("Authorization")).toBe(
			`Basic ${encodeBasicAuth("admin", "secret")}`,
		);
		expect(headers.get("X-Request-Header")).toBe("request-value");
		expect(headers.get("X-Init-Header")).toBe("init-value");
		expect(headers.get("X-Shared-Header")).toBe("from-init");
	});

	it("should handle non-ASCII characters in credentials", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
		});
		globalThis.fetch = mockFetch;

		const provider = new BasicAuthProvider(baseUrl, "user", "pässwörd");
		await provider.fetch(`${baseUrl}/Patient`);

		const headers = mockFetch.mock.calls[0]?.[1].headers as Headers;
		expect(headers.get("Authorization")).toBe(
			`Basic ${encodeBasicAuth("user", "pässwörd")}`,
		);
	});

	it("establishSession should be a no-op", async () => {
		const provider = new BasicAuthProvider(baseUrl, "admin", "secret");
		await expect(provider.establishSession()).resolves.toBeUndefined();
	});

	it("revokeSession should be a no-op", async () => {
		const provider = new BasicAuthProvider(baseUrl, "admin", "secret");
		await expect(provider.revokeSession()).resolves.toBeUndefined();
	});
});

describe("BrowserAuthProvider", () => {
	const baseUrl = "http://localhost:8080";

	function stubWindow(): { location: { href: string } } {
		const win = { location: { href: `${baseUrl}/u/rest` } };
		vi.stubGlobal("window", win);
		return win;
	}

	function mockResponse(url: string, redirected: boolean): Response {
		return {
			status: 200,
			url,
			redirected,
			headers: new Headers(),
		} as Response;
	}

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("navigates to the login page on 401", async () => {
		const win = stubWindow();
		// The request itself, then the /auth/userinfo session check.
		globalThis.fetch = vi.fn().mockResolvedValue({ status: 401 });

		const provider = new BrowserAuthProvider(baseUrl);
		await expect(provider.fetch(`${baseUrl}/fhir/Patient`)).rejects.toThrow(
			"unauthorized",
		);

		expect(win.location.href).toContain(`${baseUrl}/auth/login?redirect_to=`);
	});

	it("navigates to the gate page when a request is redirected to the instance root", async () => {
		const win = stubWindow();
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(mockResponse(`${baseUrl}/`, true));

		const provider = new BrowserAuthProvider(baseUrl);
		await expect(provider.fetch(`${baseUrl}/fhir/Patient`)).rejects.toThrow(
			"unauthorized",
		);

		expect(win.location.href).toBe(`${baseUrl}/`);
	});

	it("navigates to the gate page when a request is redirected under /auth/", async () => {
		const win = stubWindow();
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(mockResponse(`${baseUrl}/auth/login`, true));

		const provider = new BrowserAuthProvider(baseUrl);
		await expect(provider.fetch(`${baseUrl}/fhir/Patient`)).rejects.toThrow(
			"unauthorized",
		);

		expect(win.location.href).toBe(`${baseUrl}/auth/login`);
	});

	it("recognizes the gate page behind a base path", async () => {
		const win = stubWindow();
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(mockResponse("http://localhost:8080/tenant-1/", true));

		const provider = new BrowserAuthProvider(`${baseUrl}/tenant-1`);
		await expect(
			provider.fetch(`${baseUrl}/tenant-1/fhir/Patient`),
		).rejects.toThrow("unauthorized");

		expect(win.location.href).toBe("http://localhost:8080/tenant-1/");
	});

	it("leaves a request with an explicit Authorization header alone", async () => {
		const win = stubWindow();
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(mockResponse(`${baseUrl}/auth/login`, true));

		const provider = new BrowserAuthProvider(baseUrl);
		const response = await provider.fetch(`${baseUrl}/fhir/Patient`, {
			headers: { Authorization: "Bearer token" },
		});

		expect(response.status).toBe(200);
		expect(win.location.href).toBe(`${baseUrl}/u/rest`);
	});
});
