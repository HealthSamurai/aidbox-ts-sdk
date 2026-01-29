import { BasicAuthProvider } from "src/auth-providers";
import { AidboxClient } from "src/client.js";
import type {
	Bundle,
	OperationOutcome,
	Patient,
} from "src/fhir-types/hl7-fhir-r4-core";
import type { User } from "src/types";
import { beforeAll, describe, expect, it } from "vitest";

const baseUrl = "http://localhost:8080";

const authProvider = new BasicAuthProvider(baseUrl, "basic", "Pa$$w0rd");

const client = new AidboxClient<Bundle, OperationOutcome, User>(
	baseUrl,
	authProvider,
);

// Helper to truncate tables
async function truncateTables(tables: string[]) {
	for (const table of tables) {
		await authProvider.fetch(`${baseUrl}/$sql`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify([`TRUNCATE ${table} CASCADE`]),
		});
	}
}

describe("Type Level Interaction", () => {
	const testPatientId = "type-level-test-patient";

	beforeAll(async () => {
		await truncateTables(["patient", "patient_history"]);
	});

	describe("create", () => {
		it("should create a Patient", async () => {
			const result = await client.create({
				type: "Patient",
				resource: {
					id: testPatientId,
					name: [
						{
							family: "Test",
							given: ["Patient"],
						},
					],
				},
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					id: testPatientId,
					resourceType: "Patient",
					name: [
						{
							family: "Test",
							given: ["Patient"],
						},
					],
				});
		});
	});

	describe("conditionalCreate", () => {
		it("should create new Patient", async () => {
			const result = await client.conditionalCreate({
				type: "Patient",
				searchParameters: [["given", "John"]],
				resource: {
					resourceType: "Patient",
					name: [
						{
							family: "Doe",
							given: ["John"],
						},
					],
				},
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					resourceType: "Patient",
				});
		});

		it("should not create a new Patient", async () => {
			const result = await client.conditionalCreate({
				type: "Patient",
				searchParameters: [["given", "John"]],
				resource: {
					resourceType: "Patient",
					name: [
						{
							family: "Smith",
							given: ["John"],
						},
					],
				},
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					resourceType: "Patient",
					name: [
						{
							family: "Doe",
							given: ["John"],
						},
					],
				});
		});
	});

	describe("search", () => {
		it("should find a Patient", async () => {
			const result = await client.searchType({
				query: [["given", "John"]],
				type: "Patient",
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					resourceType: "Bundle",
					entry: [
						{
							resource: {
								name: [
									{
										family: "Doe",
										given: ["John"],
									},
								],
								resourceType: "Patient",
							},
							search: {
								mode: "match",
							},
						},
					],
				});
		});

		it("should not find a Patient", async () => {
			const result = await client.searchType({
				query: [["family", "NonExistent"]],
				type: "Patient",
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					resourceType: "Bundle",
					total: 0,
					type: "searchset",
				});
		});
	});

	describe("conditionalDelete", () => {
		it("should delete a Patient", async () => {
			const result = await client.conditionalDelete({
				type: "Patient",
				searchParameters: [["given", "John"]],
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					name: [
						{
							family: "Doe",
							given: ["John"],
						},
					],
					resourceType: "Patient",
				});
		});
	});

	describe("history", () => {
		it("should retrieve type-level history", async () => {
			const result = await client.historyType({ type: "Patient" });
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					resourceType: "Bundle",
					type: "history",
				});
		});
	});
});

describe("Instance Level Interaction", () => {
	const patientId = "instance-level-test-patient";

	beforeAll(async () => {
		await truncateTables(["patient", "patient_history"]);
		// Create the patient that all instance-level tests will use
		const createResult = await client.create({
			type: "Patient",
			resource: {
				id: patientId,
				name: [
					{
						family: "Initial",
						given: ["Name"],
					},
				],
			},
		});
		if (!createResult.isOk()) {
			throw new Error("Failed to create test patient for instance level tests");
		}
	});

	describe("read", () => {
		it("should read Patient", async () => {
			const result = await client.read({ type: "Patient", id: patientId });
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					id: patientId,
					resourceType: "Patient",
				});
		});
	});

	describe("update", () => {
		it("should update Patient", async () => {
			const result = await client.update({
				type: "Patient",
				id: patientId,
				resource: {
					resourceType: "Patient",
					name: [
						{
							family: "Smith",
							given: ["John"],
						},
					],
				},
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					id: patientId,
					name: [
						{
							family: "Smith",
							given: ["John"],
						},
					],
					resourceType: "Patient",
				});
		});
	});

	describe("vread", () => {
		it("should read specific version", async () => {
			const versions = await client.historyInstance({
				id: patientId,
				type: "Patient",
			});
			expect(versions.isOk()).toBeTruthy();
			if (versions.isOk()) {
				const entries = versions.value.resource.entry ?? [];
				expect(entries).not.toHaveLength(0);
				for (const entry of entries) {
					expect(entry?.resource).not.toBeUndefined();
					if (entry.resource) {
						const vid = entry.resource?.meta?.versionId;
						expect(vid).not.toBeUndefined();
						if (vid) {
							const result = await client.vread({
								id: patientId,
								type: "Patient",
								vid: vid,
							});

							expect(result.isOk()).toBeTruthy();

							if (result.isOk())
								expect(result.value.resource).toMatchObject(entry.resource);
						}
					}
				}
			}
		});
	});

	describe("conditionalUpdate", () => {
		it("should update patient by query", async () => {
			const result = await client.conditionalUpdate({
				type: "Patient",
				searchParameters: [["family", "Smith"]],
				resource: {
					resourceType: "Patient",
					name: [
						{
							family: "Smith",
							given: ["Bob"],
						},
					],
				},
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					id: patientId,
					resourceType: "Patient",
					name: [
						{
							family: "Smith",
							given: ["Bob"],
						},
					],
				});
		});

		it("should not update patient by query", async () => {
			const result = await client.conditionalUpdate({
				type: "Patient",
				searchParameters: [["family", "NonExistent"]],
				resource: {
					resourceType: "Patient",
					name: [
						{
							family: "Unknown",
							given: ["Patient"],
						},
					],
				},
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk()) {
				expect(result.value.resource).not.toMatchObject({ id: patientId });
				expect(result.value.resource).toMatchObject({
					resourceType: "Patient",
					name: [
						{
							family: "Unknown",
							given: ["Patient"],
						},
					],
				});
			}
		});
	});

	describe("patch", () => {
		it("should patch patient", async () => {
			const result = await client.patch({
				id: patientId,
				type: "Patient",
				patch: [
					{
						op: "replace",
						path: "/name/0/given/0",
						value: "NewGivenName",
					},
					{
						op: "replace",
						path: "/name/0/family",
						value: "NewFamilyName",
					},
				],
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					id: patientId,
					resourceType: "Patient",
					name: [
						{
							family: "NewFamilyName",
							given: ["NewGivenName"],
						},
					],
				});
		});
	});

	describe("conditionalPatch", () => {
		it("should patch patient by query", async () => {
			const result = await client.conditionalPatch({
				searchParameters: [["family", "NewFamilyName"]],
				type: "Patient",
				patch: [
					{
						op: "replace",
						path: "/name/0/given/0",
						value: "Patient",
					},
					{
						op: "replace",
						path: "/name/0/family",
						value: "Test",
					},
				],
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					id: patientId,
					resourceType: "Patient",
					name: [
						{
							family: "Test",
							given: ["Patient"],
						},
					],
				});
		});

		it("should not patch patient by query", async () => {
			const result = await client.conditionalPatch({
				searchParameters: [["family", "NewFamilyName"]],
				type: "Patient",
				patch: [
					{
						op: "replace",
						path: "/name/0/given/0",
						value: "OtherName",
					},
					{
						op: "replace",
						path: "/name/0/family",
						value: "OtherFamily",
					},
				],
			});
			expect(result.isErr()).toBeTruthy();
			if (result.isErr())
				expect(result.value.resource).toMatchObject({
					issue: [
						{
							code: "not-found",
							severity: "fatal",
						},
					],
					resourceType: "OperationOutcome",
				});
		});
	});

	describe("delete", () => {
		it("should delete the Patient", async () => {
			// First search for Unknown patient created by conditionalUpdate
			const searchResult = await client.searchType({
				query: [["family", "Unknown"]],
				type: "Patient",
			});
			expect(searchResult.isOk()).toBeTruthy();
			let id: string | undefined;
			if (searchResult.isOk()) {
				expect(searchResult.value.resource).toMatchObject({
					resourceType: "Bundle",
					total: 1,
				});
				const bundle: Bundle = searchResult.value.resource;
				id = bundle?.entry?.at(0)?.resource?.id;
			}
			expect(id).not.toBeUndefined();
			if (id) {
				const result = await client.delete({
					type: "Patient",
					id: id,
				});
				expect(result.isOk()).toBeTruthy();
				if (result.isOk())
					expect(result.value.resource).toMatchObject({
						id: id,
						resourceType: "Patient",
						name: [
							{
								family: "Unknown",
								given: ["Patient"],
							},
						],
					});
				const secondResult = await client.delete({
					type: "Patient",
					id: id,
				});
				expect(secondResult.isOk()).toBeTruthy();
				if (secondResult.isOk())
					expect(secondResult.value.resource).toBeUndefined();
			}
		});
	});

	describe("history", () => {
		it("should retrieve specific patient history", async () => {
			const result = await client.historyInstance({
				id: patientId,
				type: "Patient",
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk()) {
				expect(result.value.resource.resourceType).toBe("Bundle");
				expect(result.value.resource.total).toBeGreaterThanOrEqual(1);
			}
		});

		it("should retrieve patient resource history", async () => {
			const result = await client.historyType({ type: "Patient" });
			expect(result.isOk()).toBeTruthy();
			if (result.isOk()) {
				expect(result.value.resource.resourceType).toBe("Bundle");
				expect(result.value.resource.total).toBeGreaterThanOrEqual(1);
			}
		});
	});

	// TODO: need server support for DELETE /base/type/id/_history
	describe("deleteHistoryVersion", () => {
		it.skip("should delete history version", async () => {
			const result = await client.deleteHistoryVersion({
				type: "Patient",
				id: patientId,
				vid: "8",
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					resourceType: "Bundle",
				});
		});
	});

	describe("deleteHistory", () => {
		it.skip("should delete history for patient", async () => {
			const result = await client.deleteHistory({
				type: "Patient",
				id: patientId,
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					resourceType: "Bundle",
				});
		});
	});
});

describe("Whole System Interaction", () => {
	describe("capabilities", () => {
		it("should retrieve full capabilities", async () => {
			const result = await client.capabilities({
				mode: "full",
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					resourceType: "CapabilityStatement",
					status: "active",
					kind: "instance",
				});
		});

		it("should retrieve normative capabilities", async () => {
			const result = await client.capabilities({
				mode: "normative",
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					resourceType: "CapabilityStatement",
					status: "active",
					kind: "instance",
				});
		});

		it("should retrieve terminology capabilities", async () => {
			const result = await client.capabilities({
				mode: "terminology",
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					resourceType: "TerminologyCapabilities",
					status: "active",
					kind: "capability",
				});
		});
	});

	describe("batch", () => {
		it("should", async () => {
			const result = await client.batch({
				format: "application/json",
				bundle: {
					resourceType: "Bundle",
					type: "batch",
					entry: [
						{
							request: {
								method: "POST",
								url: "Patient",
							},
							resource: {
								resourceType: "Patient",
								name: [
									{
										family: "Doe",
										given: ["John"],
									},
								],
								gender: "male",
								birthDate: "1980-01-01",
							} as Patient,
						},
						{
							request: {
								method: "DELETE",
								url: "Patient/{{createdPatientId}}",
							},
						},
					],
				},
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					type: "batch-response",
					resourceType: "Bundle",
					entry: [
						{
							resource: {
								name: [
									{
										given: ["John"],
										family: "Doe",
									},
								],
								gender: "male",
								birthDate: "1980-01-01",
								resourceType: "Patient",
							},
							response: { status: "201" },
						},
						{
							response: { status: "204" },
						},
					],
				});
		});
	});

	describe("transaction", () => {
		it("should", async () => {
			const result = await client.transaction({
				format: "application/json",
				bundle: {
					resourceType: "Bundle",
					type: "transaction",
					entry: [
						{
							request: {
								method: "POST",
								url: "Patient",
							},
							resource: {
								resourceType: "Patient",
								name: [
									{
										family: "Doe",
										given: ["John"],
									},
								],
								gender: "male",
								birthDate: "1980-01-01",
							} as Patient,
						},
						{
							request: {
								method: "DELETE",
								url: "Patient/{{createdPatientId}}",
							},
						},
					],
				},
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					type: "transaction-response",
					resourceType: "Bundle",
					entry: [
						{
							resource: {
								name: [
									{
										given: ["John"],
										family: "Doe",
									},
								],
								gender: "male",
								birthDate: "1980-01-01",
								resourceType: "Patient",
							},
							response: { status: "201" },
						},
						{
							response: { status: "204" },
						},
					],
				});
		});
	});

	describe("conditionalDelete", () => {
		// TODO need server support for conditional DELETE /base
		it.skip("should delete by search", async () => {
			const result = await client.conditionalDelete({
				searchParameters: [
					["ResourceType", "Patient"],
					["family", "Test"],
				],
			});
			console.log(result.value);
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					name: [
						{
							family: "Test",
							given: ["Patient"],
						},
					],
					resourceType: "Patient",
				});
		});
	});

	describe("search", () => {
		// TODO: need server support for GET /base/
		it.skip("should", async () => {
			const result = await client.searchSystem({
				query: [
					["ResourceType", "Patient"],
					["family", "Test"],
				],
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					resourceType: "Bundle",
					total: 1,
					type: "searchset",
				});
		});
	});

	describe("history", () => {
		// TODO: need server support for GET /base/_history
		it.skip("should retrieve system history", async () => {
			const result = await client.historySystem({});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					resourceType: "Bundle",
					total: 9,
				});
		});
	});
});

describe("Compartment Interaction", () => {
	const patientId = "compartment-test-patient";

	beforeAll(async () => {
		await truncateTables([
			"patient",
			"patient_history",
			"observation",
			"observation_history",
		]);
		// Create patient for compartment test
		await client.create({
			type: "Patient",
			resource: {
				id: patientId,
				name: [{ family: "Compartment", given: ["Test"] }],
			},
		});
	});

	describe("searchCompartment", () => {
		it("should find Observation", async () => {
			const obsResult = await client.create({
				type: "Observation",
				resource: {
					resourceType: "Observation",
					id: "obs-compartment-test-001",
					status: "final",
					code: {
						text: "Body temperature",
					},
					subject: {
						reference: `Patient/${patientId}`,
					},
				},
			});
			expect(obsResult.isOk()).toBeTruthy();
			const result = await client.searchCompartment({
				compartment: "Patient",
				compartmentId: patientId,
				type: "Observation",
				query: [["status", "final"]],
			});
			expect(result.isOk()).toBeTruthy();
			if (result.isOk())
				expect(result.value.resource).toMatchObject({
					type: "searchset",
					entry: [
						{
							resource: {
								resourceType: "Observation",
								id: "obs-compartment-test-001",
								status: "final",
								code: {
									text: "Body temperature",
								},
								subject: {
									reference: `Patient/${patientId}`,
								},
							},
						},
					],
				});
		});
	});
});
