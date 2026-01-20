import { BasicAuthProvider } from "src/auth-providers";
import { AidboxClient } from "src/client.js";
import type { Bundle, OperationOutcome } from "src/fhir-types/hl7-fhir-r4-core";
import type { User } from "src/types";
import { describe, expect, it } from "vitest";

const baseUrl = "http://localhost:8080";

describe("BasicAuthProvider", () => {

	describe("restricted access policy", () => {
		const restrictedClient = new AidboxClient<Bundle, OperationOutcome, User>(
			baseUrl,
			new BasicAuthProvider(baseUrl, "basic-restricted", "Pa$$w0rd"),
		);

		it("should successfully search for Patient resources", async () => {
			const result = await restrictedClient.searchType({
				type: "Patient",
				query: [],
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk()) {
				expect(result.value.resource).toMatchObject({
					resourceType: "Bundle",
					type: "searchset",
				});
			}
		});

		it("should fail to create Observation (not allowed by access policy) with 403", async () => {
			const result = await restrictedClient.create({
				type: "Observation",
				resource: {
					resourceType: "Observation",
					status: "final",
					code: {
						text: "Test observation",
					},
				},
			});
			expect(result.isErr()).toBeTruthy();
			if (result.isErr()) {
				expect(result.value.response.status).toBe(403);
			}
		});
	});

	describe("invalid credentials", () => {
		const client = new AidboxClient<Bundle, OperationOutcome, User>(
			baseUrl,
			new BasicAuthProvider(baseUrl, "basic", "wrong-password"),
		);

		it("should fail to read a resource with 401", async () => {
			const result = await client.searchType({
				type: "Patient",
				query: [],
			});
			expect(result.isErr()).toBeTruthy();
			if (result.isErr()) {
				expect(result.value.response.status).toBe(401);
			}
		});

		it("should fail to create a resource with 401", async () => {
			const result = await client.create({
				type: "Patient",
				resource: {
					name: [
						{
							family: "ShouldNotBeCreated",
							given: ["Patient"],
						},
					],
				},
			});
			expect(result.isErr()).toBeTruthy();
			if (result.isErr()) {
				expect(result.value.response.status).toBe(401);
			}
		});
	});

	describe("non-existent user", () => {
		const client = new AidboxClient<Bundle, OperationOutcome, User>(
			baseUrl,
			new BasicAuthProvider(baseUrl, "non-existent-user", "password"),
		);

		it("should fail with 401", async () => {
			const result = await client.searchType({
				type: "Patient",
				query: [],
			});
			expect(result.isErr()).toBeTruthy();
			if (result.isErr()) {
				expect(result.value.response.status).toBe(401);
			}
		});
	});
});
