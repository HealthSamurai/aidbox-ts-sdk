import { BasicAuthProvider } from "src/auth-providers";
import { describe, expect, it, vi } from "vitest";

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

		const headers = mockFetch.mock.calls[0]![1].headers as Headers;
		expect(headers.get("Authorization")).toBe(
			`Basic ${btoa("admin:secret")}`,
		);
	});

	it("should throw error if URL does not start with baseUrl", async () => {
		const provider = new BasicAuthProvider(baseUrl, "admin", "secret");

		await expect(
			provider.fetch("http://other-server.com/Patient"),
		).rejects.toThrow("url of the request must start with baseUrl");
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

		const headers = mockFetch.mock.calls[0]![1].headers as Headers;
		expect(headers.get("Authorization")).toBe(
			`Basic ${btoa("admin:secret")}`,
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

		const headers = mockFetch.mock.calls[0]![1].headers as Headers;
		expect(headers.get("Authorization")).toBe(
			`Basic ${btoa("admin:secret")}`,
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

		const headers = mockFetch.mock.calls[0]![1].headers as Headers;
		expect(headers.get("Authorization")).toBe(
			`Basic ${btoa("admin:secret")}`,
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

		const headers = mockFetch.mock.calls[0]![1].headers as Headers;
		expect(headers.get("Authorization")).toBe(
			`Basic ${btoa("admin:secret")}`,
		);
		expect(headers.get("X-Request-Header")).toBe("request-value");
		expect(headers.get("X-Init-Header")).toBe("init-value");
		expect(headers.get("X-Shared-Header")).toBe("from-init");
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
