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
});
