import { mergeHeaders, validateBaseUrl } from "src/utils";
import { describe, expect, it } from "vitest";

describe("mergeHeaders", () => {
	it("should return empty headers when both inputs are undefined", () => {
		const result = mergeHeaders(undefined, undefined);
		expect([...result.entries()]).toEqual([]);
	});

	it("should copy headers from base", () => {
		const base = new Headers({
			"X-Custom": "value",
			"Content-Type": "application/json",
		});
		const result = mergeHeaders(base, undefined);
		expect(result.get("X-Custom")).toBe("value");
		expect(result.get("Content-Type")).toBe("application/json");
	});

	it("should copy headers from override", () => {
		const override = new Headers({ "X-Custom": "value" });
		const result = mergeHeaders(undefined, override);
		expect(result.get("X-Custom")).toBe("value");
	});

	it("should let override headers take precedence over base headers", () => {
		const base = new Headers({
			"X-Shared": "from-base",
			"X-Only-Base": "base",
		});
		const override = new Headers({
			"X-Shared": "from-override",
			"X-Only-Override": "override",
		});
		const result = mergeHeaders(base, override);
		expect(result.get("X-Shared")).toBe("from-override");
		expect(result.get("X-Only-Base")).toBe("base");
		expect(result.get("X-Only-Override")).toBe("override");
	});

	it("should handle only base headers", () => {
		const base = new Headers({ "X-Custom": "value" });
		const result = mergeHeaders(base, undefined);
		expect(result.get("X-Custom")).toBe("value");
	});

	it("should handle only override headers", () => {
		const override = new Headers({ "X-Custom": "value" });
		const result = mergeHeaders(undefined, override);
		expect(result.get("X-Custom")).toBe("value");
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

	it("should throw when userinfo makes the request target another host", () => {
		expect(() =>
			validateBaseUrl(
				"http://localhost:8080@evil.example/fhir/Patient",
				"http://localhost:8080",
			),
		).toThrow("URL of the request must start with baseUrl");
	});

	it("should throw for a URL instance whose userinfo targets another host", () => {
		expect(() =>
			validateBaseUrl(
				new URL("http://localhost:8080@evil.example/fhir/Patient"),
				"http://localhost:8080",
			),
		).toThrow("URL of the request must start with baseUrl");
	});

	it("should throw when the request carries userinfo on the base origin", () => {
		expect(() =>
			validateBaseUrl(
				"http://admin:secret@localhost:8080/fhir/Patient",
				"http://localhost:8080",
			),
		).toThrow("URL of the request must start with baseUrl");
	});

	it("should throw when the request host only has the base host as a suffix", () => {
		expect(() =>
			validateBaseUrl(
				"https://example.com.evil.example/fhir/Patient",
				"https://example.com",
			),
		).toThrow("URL of the request must start with baseUrl");
	});

	it("should throw for a Request whose host only has the base host as a suffix", () => {
		const request = new Request(
			"https://example.com.evil.example/fhir/Patient",
		);
		expect(() => validateBaseUrl(request, "https://example.com")).toThrow(
			"URL of the request must start with baseUrl",
		);
	});

	it("should throw when the port differs from the base URL port", () => {
		expect(() =>
			validateBaseUrl("http://localhost:8081/fhir", "http://localhost:8080"),
		).toThrow("URL of the request must start with baseUrl");
	});

	it("should throw when the scheme differs from the base URL scheme", () => {
		expect(() =>
			validateBaseUrl("https://localhost:8080/fhir", "http://localhost:8080"),
		).toThrow("URL of the request must start with baseUrl");
	});

	it("should throw for a relative URL", () => {
		expect(() =>
			validateBaseUrl("/fhir/Patient", "http://localhost:8080"),
		).toThrow("URL of the request must start with baseUrl");
	});

	it("should not throw when the base URL has a trailing slash", () => {
		expect(() =>
			validateBaseUrl(
				"http://localhost:8080/fhir/Patient",
				"http://localhost:8080/",
			),
		).not.toThrow();
	});

	it("should not throw when the request states the default port explicitly", () => {
		expect(() =>
			validateBaseUrl("https://example.com:443/fhir", "https://example.com"),
		).not.toThrow();
	});

	it("should not throw when the request host differs only in case", () => {
		expect(() =>
			validateBaseUrl(
				"HTTP://LOCALHOST:8080/fhir/Patient",
				"http://localhost:8080",
			),
		).not.toThrow();
	});

	it("should throw when the path only has the base path as a textual prefix", () => {
		expect(() =>
			validateBaseUrl(
				"https://example.com/fhir-evil/Patient",
				"https://example.com/fhir",
			),
		).toThrow("URL of the request must start with baseUrl");
	});

	it("should throw when the path leaves the base path", () => {
		expect(() =>
			validateBaseUrl(
				"https://example.com/Patient",
				"https://example.com/fhir",
			),
		).toThrow("URL of the request must start with baseUrl");
	});

	it("should not throw when the request path equals the base path", () => {
		expect(() =>
			validateBaseUrl("https://example.com/fhir", "https://example.com/fhir"),
		).not.toThrow();
	});

	it("should not throw for a sub-path with a query string", () => {
		expect(() =>
			validateBaseUrl(
				"https://example.com/fhir/Patient?name=x",
				"https://example.com/fhir",
			),
		).not.toThrow();
	});

	it("should not throw when the base path has a trailing slash", () => {
		expect(() =>
			validateBaseUrl(
				"https://example.com/fhir/Patient",
				"https://example.com/fhir/",
			),
		).not.toThrow();
	});

	it("should throw for a blob URL that inherits the base origin", () => {
		expect(() =>
			validateBaseUrl(
				"blob:https://example.com/some-id",
				"https://example.com",
			),
		).toThrow("URL of the request must start with baseUrl");
	});

	it("should throw for opaque origins even when both sides use the same scheme", () => {
		expect(() =>
			validateBaseUrl("foo://evil/fhir", "foo://server/fhir"),
		).toThrow("URL of the request must start with baseUrl");
	});
});
