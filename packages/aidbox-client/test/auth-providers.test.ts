import { BasicAuthProvider } from "src/auth-providers";
import { describe, expect, it, vi } from "vitest";

describe("BasicAuthProvider", () => {
	const baseUrl = "http://localhost:8080";

	it("should add Authorization header to requests", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
		});

		const provider = new BasicAuthProvider(baseUrl, "admin", "secret");
		await provider.fetch(`${baseUrl}/Patient`);

		expect(fetch).toHaveBeenCalledWith(
			`${baseUrl}/Patient`,
			expect.objectContaining({
				headers: expect.objectContaining({
					Authorization: `Basic ${btoa("admin:secret")}`,
				}),
			}),
		);
	});

	it("should throw error if URL does not start with baseUrl", async () => {
		const provider = new BasicAuthProvider(baseUrl, "admin", "secret");

		await expect(
			provider.fetch("http://other-server.com/Patient"),
		).rejects.toThrow("url of the request must start with baseUrl");
	});

	it("should preserve existing headers", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
		});

		const provider = new BasicAuthProvider(baseUrl, "admin", "secret");
		await provider.fetch(`${baseUrl}/Patient`, {
			headers: { "X-Custom-Header": "value" },
		});

		expect(fetch).toHaveBeenCalledWith(
			`${baseUrl}/Patient`,
			expect.objectContaining({
				headers: expect.objectContaining({
					Authorization: `Basic ${btoa("admin:secret")}`,
					"X-Custom-Header": "value",
				}),
			}),
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
