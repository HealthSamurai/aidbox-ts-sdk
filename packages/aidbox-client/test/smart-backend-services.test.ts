import { BasicAuthProvider } from "src/auth-providers";
import { AidboxClient } from "src/client";
import type {
	Bundle,
	OperationOutcome,
	Patient,
} from "src/fhir-types/hl7-fhir-r4-core";
import { SmartBackendServicesAuthProvider } from "src/smart-backend-services";
import type { User } from "src/types";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const AIDBOX_BASE_URL = "http://localhost:8080";
const SMART_CLIENT_ID = "smart-backend-test";

/**
 * Generate RSA key pair for testing.
 * Returns CryptoKey for provider and JWK for registering in Aidbox.
 */
async function generateTestKeyPair(): Promise<{
	privateKey: CryptoKey;
	publicKeyJwk: {
		kty: string;
		n: string;
		e: string;
		kid: string;
		alg: string;
		use: string;
	};
	keyId: string;
}> {
	const keyPair = await crypto.subtle.generateKey(
		{
			name: "RSASSA-PKCS1-v1_5",
			modulusLength: 2048,
			publicExponent: new Uint8Array([1, 0, 1]),
			hash: "SHA-384",
		},
		true,
		["sign", "verify"],
	);

	const keyId = crypto.randomUUID();

	const exportedJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

	// Extract only the fields Aidbox expects (remove key_ops, ext)
	const publicKeyJwk = {
		kty: exportedJwk.kty as string,
		n: exportedJwk.n as string,
		e: exportedJwk.e as string,
		kid: keyId,
		alg: "RS384",
		use: "sig",
	};

	return {
		privateKey: keyPair.privateKey,
		publicKeyJwk,
		keyId,
	};
}

describe("SmartBackendServicesAuthProvider", () => {
	// Setup client with basic auth (has full access from init bundle)
	const setupProvider = new BasicAuthProvider(
		AIDBOX_BASE_URL,
		"basic",
		"Pa$$w0rd",
	);

	// Generated credentials - populated in beforeAll
	let generatedPrivateKey: CryptoKey;
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

		// Generate key pair dynamically
		const { privateKey, publicKeyJwk, keyId } = await generateTestKeyPair();
		generatedPrivateKey = privateKey;
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
	});

	describe("token acquisition", () => {
		it("should obtain access token from Aidbox", async () => {
			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: AIDBOX_BASE_URL,
				clientId: SMART_CLIENT_ID,
				privateKey: generatedPrivateKey,
				keyId: generatedKeyId,
				scope: "system/*.read system/*.write",
				allowInsecureRequests: true,
			});

			// establishSession should complete without error
			await expect(provider.establishSession()).resolves.toBeUndefined();
		});

		it("should fail with invalid client credentials", async () => {
			const invalidProvider = new SmartBackendServicesAuthProvider({
				baseUrl: AIDBOX_BASE_URL,
				clientId: "non-existent-client",
				privateKey: generatedPrivateKey,
				keyId: generatedKeyId,
				scope: "system/*.read",
				allowInsecureRequests: true,
			});

			await expect(invalidProvider.establishSession()).rejects.toThrow();
		});

		it("should fail with wrong private key", async () => {
			// Generate a different key pair
			const { privateKey, keyId } = await generateTestKeyPair();

			const wrongKeyProvider = new SmartBackendServicesAuthProvider({
				baseUrl: AIDBOX_BASE_URL,
				clientId: SMART_CLIENT_ID,
				privateKey: privateKey,
				keyId: keyId,
				scope: "system/*.read",
				allowInsecureRequests: true,
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
				allowInsecureRequests: true,
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
				allowInsecureRequests: true,
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
				allowInsecureRequests: true,
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
		it("should obtain token via establishSession", async () => {
			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: AIDBOX_BASE_URL,
				clientId: SMART_CLIENT_ID,
				privateKey: generatedPrivateKey,
				keyId: generatedKeyId,
				scope: "system/*.read system/*.write",
				allowInsecureRequests: true,
			});

			// establishSession should obtain token without error
			await provider.establishSession();

			// Subsequent fetch should work
			const response = await provider.fetch(`${AIDBOX_BASE_URL}/fhir/Patient`);
			expect(response.ok).toBe(true);
		});

		it("should clear token on revokeSession and re-obtain on next fetch", async () => {
			const provider = new SmartBackendServicesAuthProvider({
				baseUrl: AIDBOX_BASE_URL,
				clientId: SMART_CLIENT_ID,
				privateKey: generatedPrivateKey,
				keyId: generatedKeyId,
				scope: "system/*.read system/*.write",
				allowInsecureRequests: true,
			});

			// Get initial token
			await provider.establishSession();

			// Revoke clears cached token
			await provider.revokeSession();

			// Next fetch should automatically obtain new token
			const response = await provider.fetch(`${AIDBOX_BASE_URL}/fhir/Patient`);
			expect(response.ok).toBe(true);
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
				allowInsecureRequests: true,
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
				allowInsecureRequests: true,
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
				allowInsecureRequests: true,
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
