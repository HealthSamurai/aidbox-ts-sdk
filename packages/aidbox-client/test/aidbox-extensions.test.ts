import { BasicAuthProvider } from "src/auth-providers";
import { AidboxClient } from "src/client";
import type { Bundle, OperationOutcome } from "src/fhir-types/hl7-fhir-r4-core";
import type { User } from "src/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalFetch = globalThis.fetch;

function mockFetch(response: unknown, status = 200) {
	return vi.fn().mockResolvedValue({
		ok: status >= 200 && status < 300,
		status,
		statusText: status === 200 ? "OK" : "Error",
		headers: new Headers({ "content-type": "application/json" }),
		json: async () => response,
		clone: () => ({ json: async () => response }),
	});
}

describe("Aidbox extensions", () => {
	let client: AidboxClient<Bundle, OperationOutcome, User>;
	const baseUrl = "http://localhost:8080";

	beforeEach(() => {
		client = new AidboxClient<Bundle, OperationOutcome, User>(
			baseUrl,
			new BasicAuthProvider(baseUrl, "admin", "secret"),
		);
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	describe("sql", () => {
		it("should execute a SQL query", async () => {
			const mockRows = [{ cnt: 42 }];
			globalThis.fetch = mockFetch(mockRows);

			const result = await client.sql<{ cnt: number }>(
				"SELECT count(*) as cnt FROM patient",
			);

			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				expect(result.value.resource).toEqual([{ cnt: 42 }]);
			}

			expect(fetch).toHaveBeenCalledWith(
				`${baseUrl}/$sql`,
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify(["SELECT count(*) as cnt FROM patient"]),
				}),
			);
		});

		it("should pass parameters", async () => {
			const mockRows = [{ id: "pt-1", name: "Test" }];
			globalThis.fetch = mockFetch(mockRows);

			await client.sql("SELECT * FROM patient WHERE id = ?", ["pt-1"]);

			expect(fetch).toHaveBeenCalledWith(
				`${baseUrl}/$sql`,
				expect.objectContaining({
					body: JSON.stringify(["SELECT * FROM patient WHERE id = ?", "pt-1"]),
				}),
			);
		});

		it("should handle empty params array", async () => {
			const mockRows = [{ cnt: 0 }];
			globalThis.fetch = mockFetch(mockRows);

			await client.sql("SELECT 1", []);

			expect(fetch).toHaveBeenCalledWith(
				`${baseUrl}/$sql`,
				expect.objectContaining({
					body: JSON.stringify(["SELECT 1"]),
				}),
			);
		});

		it("should return Err on server error", async () => {
			const outcome: OperationOutcome = {
				resourceType: "OperationOutcome",
				issue: [
					{ severity: "error", code: "exception", diagnostics: "SQL error" },
				],
			};
			globalThis.fetch = mockFetch(outcome, 500);

			const result = await client.sql("INVALID SQL");

			expect(result.isErr()).toBe(true);
		});
	});

	describe("materialize", () => {
		it("should materialize a ViewDefinition", async () => {
			const mockResult = {
				resourceType: "Parameters",
				parameter: [
					{ name: "viewName", valueString: "mira_backend.encounter_flat" },
				],
			};
			globalThis.fetch = mockFetch(mockResult);

			const result = await client.materialize("vd-encounter-flat");

			expect(result.isOk()).toBe(true);

			expect(fetch).toHaveBeenCalledWith(
				`${baseUrl}/fhir/ViewDefinition/vd-encounter-flat/%24materialize`,
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({
						resourceType: "Parameters",
						parameter: [{ name: "type", valueCode: "materialized-view" }],
					}),
				}),
			);
		});

		it("should support different materialization types", async () => {
			globalThis.fetch = mockFetch({});

			await client.materialize("vd-test", "table");

			expect(fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: JSON.stringify({
						resourceType: "Parameters",
						parameter: [{ name: "type", valueCode: "table" }],
					}),
				}),
			);
		});
	});

	describe("operation (flexible)", () => {
		it("should allow custom operation names", async () => {
			globalThis.fetch = mockFetch({ result: "ok" });

			const result = await client.operation({
				type: "Patient",
				id: "pt-1",
				operation: "$everything",
			});

			expect(result.isOk()).toBe(true);
			expect(fetch).toHaveBeenCalledWith(
				`${baseUrl}/fhir/Patient/pt-1/%24everything`,
				expect.objectContaining({ method: "POST" }),
			);
		});

		it("should allow operation without resource body", async () => {
			globalThis.fetch = mockFetch({ resourceType: "Parameters" });

			const result = await client.operation({
				type: "ValueSet",
				operation: "$expand",
			});

			expect(result.isOk()).toBe(true);
			// body should not be set when resource is undefined
			expect(fetch).toHaveBeenCalledWith(
				`${baseUrl}/fhir/ValueSet/%24expand`,
				expect.objectContaining({
					method: "POST",
					body: null,
				}),
			);
		});
	});
});
