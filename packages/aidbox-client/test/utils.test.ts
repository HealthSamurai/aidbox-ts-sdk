import { mergeHeaders, validateBaseUrl } from "src/utils";
import { describe, expect, it } from "vitest";

describe("mergeHeaders", () => {
	it("should return empty headers when no input has headers", () => {
		const result = mergeHeaders("http://localhost/test", undefined);
		expect([...result.entries()]).toEqual([]);
	});

	it("should copy headers from Request object", () => {
		const request = new Request("http://localhost/test", {
			headers: { "X-Custom": "value", "Content-Type": "application/json" },
		});
		const result = mergeHeaders(request, undefined);
		expect(result.get("X-Custom")).toBe("value");
		expect(result.get("Content-Type")).toBe("application/json");
	});

	it("should copy headers from init object (plain object)", () => {
		const result = mergeHeaders("http://localhost/test", {
			headers: { "X-Custom": "value" },
		});
		expect(result.get("X-Custom")).toBe("value");
	});

	it("should copy headers from init object (Headers instance)", () => {
		const headers = new Headers();
		headers.set("X-Custom", "value");
		const result = mergeHeaders("http://localhost/test", { headers });
		expect(result.get("X-Custom")).toBe("value");
	});

	it("should let init headers override Request headers", () => {
		const request = new Request("http://localhost/test", {
			headers: { "X-Shared": "from-request", "X-Only-Request": "req" },
		});
		const result = mergeHeaders(request, {
			headers: { "X-Shared": "from-init", "X-Only-Init": "init" },
		});
		expect(result.get("X-Shared")).toBe("from-init");
		expect(result.get("X-Only-Request")).toBe("req");
		expect(result.get("X-Only-Init")).toBe("init");
	});

	it("should handle URL input with init headers", () => {
		const url = new URL("http://localhost/test");
		const result = mergeHeaders(url, {
			headers: { "X-Custom": "value" },
		});
		expect(result.get("X-Custom")).toBe("value");
	});

	it("should handle string input with no init", () => {
		const result = mergeHeaders("http://localhost/test", undefined);
		expect([...result.entries()]).toEqual([]);
	});
});

describe("validateBaseUrl", () => {
	it("should not throw for valid string input", () => {
		expect(() =>
			validateBaseUrl(
				"http://localhost:8080/fhir/Patient",
				"http://localhost:8080",
			),
		).not.toThrow();
	});

	it("should not throw for valid Request input", () => {
		const request = new Request("http://localhost:8080/fhir/Patient");
		expect(() =>
			validateBaseUrl(request, "http://localhost:8080"),
		).not.toThrow();
	});

	it("should not throw for valid URL input", () => {
		expect(() =>
			validateBaseUrl(
				new URL("http://localhost:8080/fhir/Patient"),
				"http://localhost:8080",
			),
		).not.toThrow();
	});

	it("should throw if URL doesn't start with baseUrl", () => {
		expect(() =>
			validateBaseUrl(
				"http://other-host/fhir/Patient",
				"http://localhost:8080",
			),
		).toThrow("URL of the request must start with baseUrl");
	});
});
