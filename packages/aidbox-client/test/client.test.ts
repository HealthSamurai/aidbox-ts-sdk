import { BrowserAuthProvider } from "src/auth-providers";
import { AidboxClient } from "src/client";
import type { Bundle, OperationOutcome } from "src/fhir-types/hl7-fhir-r4-core";
import type { Result } from "src/result";
import type { ResourceResponse, User } from "src/types";
import { describe, expect, it, vi } from "vitest";

describe("AidboxClient", () => {
	describe("GET request", () => {
		it("should successfully fetch a resource", async () => {
			const mockResponse: Bundle = {
				resourceType: "Bundle",
				id: "foo",
				type: "searchset",
				total: 2,
				entry: [
					{
						resource: {
							resourceType: "Resource",
							id: "patient-1",
						},
					},
					{
						resource: {
							resourceType: "Resource",
							id: "patient-2",
						},
					},
				],
			};

			globalThis.fetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				statusText: "OK",
				headers: new Headers({
					"content-type": "application/json",
				}),
				json: async () => mockResponse,
				clone: () => ({
					json: async () => mockResponse,
				}),
			});

			const baseUrl = "http://localhost:8080";

			const client = new AidboxClient<Bundle, OperationOutcome, User>(
				baseUrl,
				new BrowserAuthProvider(baseUrl),
			);

			const result: Result<
				ResourceResponse<Bundle>,
				ResourceResponse<OperationOutcome>
			> = await client.request<Bundle>({
				method: "GET",
				url: "/Bundle/foo",
			});

			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				const { resource, response } = result.value;
				expect(response.status).toBe(200);
				expect(resource).toEqual(mockResponse);
				expect(fetch).toHaveBeenCalledWith(
					"http://localhost:8080/Bundle/foo",
					expect.objectContaining({
						method: "GET",
						headers: expect.objectContaining({
							"content-type": "application/json",
							accept: "application/json",
						}),
						credentials: "include",
					}),
				);
			}
		});
	});
	describe("redirect mode", () => {
		const baseUrl = "http://localhost:8080";

		function client() {
			return new AidboxClient<Bundle, OperationOutcome, User>(
				baseUrl,
				new BrowserAuthProvider(baseUrl),
			);
		}

		it("follows redirects by default", async () => {
			globalThis.fetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				statusText: "OK",
				redirected: false,
				headers: new Headers(),
				text: async () => "",
			});

			await client().rawRequest({ method: "GET", url: "/Patient" });

			expect(fetch).toHaveBeenCalledWith(
				`${baseUrl}/Patient`,
				expect.objectContaining({ redirect: "follow" }),
			);
		});

		it("passes the requested redirect mode to fetch", async () => {
			globalThis.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 0,
				statusText: "",
				type: "opaqueredirect",
				redirected: false,
				headers: new Headers(),
				text: async () => "",
			});

			await expect(
				client().rawRequest({
					method: "GET",
					url: "/",
					redirect: "manual",
				}),
			).rejects.toThrow("HTTP 0");

			expect(fetch).toHaveBeenCalledWith(
				`${baseUrl}/`,
				expect.objectContaining({ redirect: "manual" }),
			);
		});

		it("leaves the page alone when an unfollowed redirect comes back opaque", async () => {
			const win = { location: { href: `${baseUrl}/u/rest` } };
			vi.stubGlobal("window", win);
			globalThis.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 0,
				statusText: "",
				type: "opaqueredirect",
				redirected: false,
				url: "",
				headers: new Headers(),
				text: async () => "",
			});

			await expect(
				client().rawRequest({ method: "GET", url: "/", redirect: "manual" }),
			).rejects.toThrow("HTTP 0");

			expect(win.location.href).toBe(`${baseUrl}/u/rest`);
			vi.unstubAllGlobals();
		});
	});
});
