import { BasicAuthProvider } from "src/auth-providers";
import { AidboxClient } from "src/client";
import type {
	Bundle,
	OperationOutcome,
	Patient,
} from "src/fhir-types/hl7-fhir-r4-core";
import {
	generateKeyPair,
	SmartBackendServicesAuthProvider,
} from "src/smart-backend-services";
import type { User } from "src/types";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const AIDBOX_BASE_URL = "http://localhost:8080";
const SMART_CLIENT_ID = "smart-backend-test";

describe("generateKeyPair", () => {
	it("should generate valid RSA key pair", async () => {
		const { privateKeyPem, publicKeyJwk, keyId } = await generateKeyPair();

		expect(privateKeyPem).toContain("-----BEGIN PRIVATE KEY-----");
		expect(privateKeyPem).toContain("-----END PRIVATE KEY-----");

		expect(publicKeyJwk.kty).toBe("RSA");
		expect(publicKeyJwk.n).toBeTruthy();
		expect(publicKeyJwk.e).toBeTruthy();
		expect(publicKeyJwk.kid).toBe(keyId);

		expect(keyId).toMatch(/^[a-f0-9]{32}$/);
	});

	it("should generate unique key IDs", async () => {
		const result1 = await generateKeyPair();
		const result2 = await generateKeyPair();

		expect(result1.keyId).not.toBe(result2.keyId);
	});
});

describe("SmartBackendServicesAuthProvider", () => {
	// Setup client with basic auth (has full access from init bundle)
	const setupProvider = new BasicAuthProvider(
		AIDBOX_BASE_URL,
		"basic",
		"Pa$$w0rd",
	);

	// Generated credentials - populated in beforeAll
	let generatedPrivateKey: string;
	let generatedKeyId: string;

	// Create SMART client resources before all tests
	beforeAll(async () => {
		// Truncate tables to ensure clean state
		const tables = ["patient", "patient_history"];
		for (const table of tables) {
			await setupProvider.fetch(`${AIDBOX_BASE_URL}/$sql`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify([`TRUNCATE ${table} CASCADE`]),
			});
		}

		// Generate key pair dynamically (includes alg and use fields)
		const { privateKeyPem, publicKeyJwk, keyId } = await generateKeyPair();
		generatedPrivateKey = privateKeyPem;
		generatedKeyId = keyId;

		// Create the SMART Backend Client with generated public key
		const clientResponse = await setupProvider.fetch(
			`${AIDBOX_BASE_URL}/Client/${SMART_CLIENT_ID}`,
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					resourceType: "Client",
					id: SMART_CLIENT_ID,
					type: "bulk-api-client",
					active: true,
					auth: {
						client_credentials: {
							client_assertion_types: [
								"urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
							],
							access_token_expiration: 300,
						},
					},
					scope: ["system/*.read", "system/*.write"],
					grant_types: ["client_credentials"],
					jwks: [publicKeyJwk],
				}),
			},
		);

		if (!clientResponse.ok) {
			const error = await clientResponse.text();
			throw new Error(`Failed to create SMART client: ${error}`);
		}

		// Create AccessPolicy for the SMART client
		const policyResponse = await setupProvider.fetch(
			`${AIDBOX_BASE_URL}/AccessPolicy/smart-backend-policy`,
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					resourceType: "AccessPolicy",
					id: "smart-backend-policy",
					engine: "allow",
					link: [{ id: SMART_CLIENT_ID, resourceType: "Client" }],
				}),
			},
		);

		if (!policyResponse.ok) {
			const error = await policyResponse.text();
			throw new Error(`Failed to create AccessPolicy: ${error}`);
		}
	});

	// Clean up SMART client resources after all tests
	afterAll(async () => {
		await setupProvider.fetch(
			`${AIDBOX_BASE_URL}/AccessPolicy/smart-backend-policy`,
			{ method: "DELETE" },
		);

		await setupProvider.fetch(`${AIDBOX_BASE_URL}/Client/${SMART_CLIENT_ID}`, {
			method: "DELETE",
		});
	});

	describe("constructor", () => {
		it("should set baseUrl from config", () => {
			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: AIDBOX_BASE_URL,
				clientId: SMART_CLIENT_ID,
				privateKey: generatedPrivateKey,
				keyId: generatedKeyId,
				scope: "system/*.read",
			});

			expect(provider.baseUrl).toBe(AIDBOX_BASE_URL);
		});

		it("should accept custom tokenEndpoint", () => {
			const customEndpoint = "https://auth.example.com/oauth/token";
			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: AIDBOX_BASE_URL,
				clientId: SMART_CLIENT_ID,
				privateKey: generatedPrivateKey,
				keyId: generatedKeyId,
				scope: "system/*.read",
				tokenEndpoint: customEndpoint,
			});

			expect(provider.baseUrl).toBe(AIDBOX_BASE_URL);
		});
	});

	describe("token acquisition", () => {
		it("should obtain access token from Aidbox", async () => {
			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: AIDBOX_BASE_URL,
				clientId: SMART_CLIENT_ID,
				privateKey: generatedPrivateKey,
				keyId: generatedKeyId,
				scope: "system/*.read system/*.write",
			});

			await provider.establishSession();
			expect(await provider.isAuthenticated()).toBe(true);
		});

		it("should fail with invalid client credentials", async () => {
			const invalidProvider = new SmartBackendServicesAuthProvider({
				baseUrl: AIDBOX_BASE_URL,
				clientId: "non-existent-client",
				privateKey: generatedPrivateKey,
				keyId: generatedKeyId,
				scope: "system/*.read",
			});

			await expect(invalidProvider.establishSession()).rejects.toThrow();
		});

		it("should fail with wrong private key", async () => {
			// Generate a different key pair
			const { privateKeyPem, keyId } = await generateKeyPair();

			const wrongKeyProvider = new SmartBackendServicesAuthProvider({
				baseUrl: AIDBOX_BASE_URL,
				clientId: SMART_CLIENT_ID,
				privateKey: privateKeyPem,
				keyId: keyId,
				scope: "system/*.read",
			});

			await expect(wrongKeyProvider.establishSession()).rejects.toThrow();
		});
	});

	describe("fetch", () => {
		it("should make authenticated request to FHIR endpoint", async () => {
			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: AIDBOX_BASE_URL,
				clientId: SMART_CLIENT_ID,
				privateKey: generatedPrivateKey,
				keyId: generatedKeyId,
				scope: "system/*.read system/*.write",
			});

			const response = await provider.fetch(`${AIDBOX_BASE_URL}/fhir/Patient`);
			expect(response.ok).toBe(true);

			const data = await response.json();
			expect(data.resourceType).toBe("Bundle");
		});

		it("should reject requests to different baseUrl", async () => {
			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: AIDBOX_BASE_URL,
				clientId: SMART_CLIENT_ID,
				privateKey: generatedPrivateKey,
				keyId: generatedKeyId,
				scope: "system/*.read",
			});

			await expect(
				provider.fetch("https://other-server.com/fhir/Patient"),
			).rejects.toThrow("URL of the request must start with baseUrl");
		});

		it("should cache token and reuse for multiple requests", async () => {
			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: AIDBOX_BASE_URL,
				clientId: SMART_CLIENT_ID,
				privateKey: generatedPrivateKey,
				keyId: generatedKeyId,
				scope: "system/*.read system/*.write",
			});

			const response1 = await provider.fetch(`${AIDBOX_BASE_URL}/fhir/Patient`);
			expect(response1.ok).toBe(true);

			const response2 = await provider.fetch(
				`${AIDBOX_BASE_URL}/fhir/Observation`,
			);
			expect(response2.ok).toBe(true);
		});
	});

	describe("session management", () => {
		it("should report isAuthenticated correctly", async () => {
			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: AIDBOX_BASE_URL,
				clientId: SMART_CLIENT_ID,
				privateKey: generatedPrivateKey,
				keyId: generatedKeyId,
				scope: "system/*.read",
			});

			expect(await provider.isAuthenticated()).toBe(false);

			await provider.establishSession();

			expect(await provider.isAuthenticated()).toBe(true);
		});

		it("should clear token on revokeSession", async () => {
			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: AIDBOX_BASE_URL,
				clientId: SMART_CLIENT_ID,
				privateKey: generatedPrivateKey,
				keyId: generatedKeyId,
				scope: "system/*.read",
			});

			await provider.establishSession();
			expect(await provider.isAuthenticated()).toBe(true);

			await provider.revokeSession();
			expect(await provider.isAuthenticated()).toBe(false);
		});
	});

	describe("FHIR operations via AidboxClient", () => {
		it("should search for patients", async () => {
			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: AIDBOX_BASE_URL,
				clientId: SMART_CLIENT_ID,
				privateKey: generatedPrivateKey,
				keyId: generatedKeyId,
				scope: "system/*.read system/*.write",
			});

			const client = new AidboxClient<Bundle, OperationOutcome, User>(
				AIDBOX_BASE_URL,
				provider,
			);
			const result = await client.searchType({
				type: "Patient",
				query: [],
			});

			expect(result.isOk()).toBe(true);
			if (result.isOk()) {
				expect(result.value.resource.resourceType).toBe("Bundle");
			}
		});

		it("should create and delete a patient", async () => {
			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: AIDBOX_BASE_URL,
				clientId: SMART_CLIENT_ID,
				privateKey: generatedPrivateKey,
				keyId: generatedKeyId,
				scope: "system/*.read system/*.write",
			});

			const client = new AidboxClient<Bundle, OperationOutcome, User>(
				AIDBOX_BASE_URL,
				provider,
			);

			// Create
			const createResult = await client.create({
				type: "Patient",
				resource: {
					resourceType: "Patient",
					name: [{ given: ["SMART"], family: "Test" }],
				},
			});

			expect(createResult.isOk()).toBe(true);
			if (!createResult.isOk()) return;

			const patient = createResult.value.resource as Patient;
			const patientId = patient.id as string;
			expect(patientId).toBeTruthy();

			// Read back
			const readResult = await client.read({
				type: "Patient",
				id: patientId,
			});
			expect(readResult.isOk()).toBe(true);
			if (readResult.isOk()) {
				const readPatient = readResult.value.resource as Patient;
				expect(readPatient.name?.[0]?.family).toBe("Test");
			}

			// Delete
			const deleteResult = await client.delete({
				type: "Patient",
				id: patientId,
			});
			expect(deleteResult.isOk()).toBe(true);
		});

		it("should perform a transaction bundle", async () => {
			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: AIDBOX_BASE_URL,
				clientId: SMART_CLIENT_ID,
				privateKey: generatedPrivateKey,
				keyId: generatedKeyId,
				scope: "system/*.read system/*.write",
			});

			const client = new AidboxClient<Bundle, OperationOutcome, User>(
				AIDBOX_BASE_URL,
				provider,
			);

			const transactionResult = await client.transaction({
				format: "application/json",
				bundle: {
					resourceType: "Bundle",
					type: "transaction",
					entry: [
						{
							request: { method: "POST", url: "Patient" },
							resource: {
								resourceType: "Patient",
								name: [{ given: ["Transaction"], family: "Test" }],
							} as Patient,
						},
					],
				},
			});

			expect(transactionResult.isOk()).toBe(true);
			if (transactionResult.isOk()) {
				const responseBundle = transactionResult.value.resource as Bundle;
				expect(responseBundle.type).toBe("transaction-response");
			}
		});
	});
});
