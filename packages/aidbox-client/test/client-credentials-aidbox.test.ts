import { BasicAuthProvider } from "src/auth-providers";
import { AidboxClient } from "src/client";
import { ClientCredentialsAuthProvider } from "src/client-credentials";
import type { Bundle, OperationOutcome } from "src/fhir-types/hl7-fhir-r4-core";
import type { User } from "src/types";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const AIDBOX_BASE_URL = "http://localhost:8080";
const CLIENT_ID = "client-credentials-test";
/** Contains characters that are form-urlencoded differently than raw UTF-8. */
const CLIENT_SECRET = "cc-S$cret-P@ssw0rd";
const POLICY_ID = "client-credentials-test-policy";

describe("ClientCredentialsAuthProvider against Aidbox", () => {
	// Setup client with basic auth (has full access from the init bundle).
	const setupProvider = new BasicAuthProvider(
		AIDBOX_BASE_URL,
		"basic",
		"Pa$$w0rd",
	);

	beforeAll(async () => {
		const clientResponse = await setupProvider.fetch(
			`${AIDBOX_BASE_URL}/Client/${CLIENT_ID}`,
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					resourceType: "Client",
					id: CLIENT_ID,
					secret: CLIENT_SECRET,
					grant_types: ["client_credentials"],
					auth: { client_credentials: { access_token_expiration: 300 } },
				}),
			},
		);

		if (!clientResponse.ok) {
			throw new Error(
				`Failed to create Client: ${await clientResponse.text()}`,
			);
		}

		const policyResponse = await setupProvider.fetch(
			`${AIDBOX_BASE_URL}/AccessPolicy/${POLICY_ID}`,
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					resourceType: "AccessPolicy",
					id: POLICY_ID,
					engine: "allow",
					link: [{ id: CLIENT_ID, resourceType: "Client" }],
				}),
			},
		);

		if (!policyResponse.ok) {
			throw new Error(
				`Failed to create AccessPolicy: ${await policyResponse.text()}`,
			);
		}
	});

	afterAll(async () => {
		await setupProvider.fetch(`${AIDBOX_BASE_URL}/AccessPolicy/${POLICY_ID}`, {
			method: "DELETE",
		});
		await setupProvider.fetch(`${AIDBOX_BASE_URL}/Client/${CLIENT_ID}`, {
			method: "DELETE",
		});
	});

	it("reads FHIR resources with HTTP Basic client authentication", async () => {
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: AIDBOX_BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});

		const response = await provider.fetch(`${AIDBOX_BASE_URL}/fhir/Patient`);

		expect(response.status).toBe(200);
		const bundle = (await response.json()) as Bundle;
		expect(bundle.resourceType).toBe("Bundle");
	});

	it("reads FHIR resources with client credentials in the request body", async () => {
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: AIDBOX_BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
			clientAuthentication: "body",
		});

		const response = await provider.fetch(`${AIDBOX_BASE_URL}/fhir/Patient`);

		expect(response.status).toBe(200);
		const bundle = (await response.json()) as Bundle;
		expect(bundle.resourceType).toBe("Bundle");
	});

	it("searches through AidboxClient", async () => {
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: AIDBOX_BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			allowInsecureRequests: true,
		});
		const client = new AidboxClient<Bundle, OperationOutcome, User>(
			AIDBOX_BASE_URL,
			provider,
		);

		const result = await client.searchType({ type: "Patient", query: [] });

		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value.resource.resourceType).toBe("Bundle");
		}
	});

	it("rejects a wrong client secret without exposing it", async () => {
		const provider = new ClientCredentialsAuthProvider({
			baseUrl: AIDBOX_BASE_URL,
			clientId: CLIENT_ID,
			clientSecret: "wrong-secret",
			allowInsecureRequests: true,
		});

		const error = await provider.establishSession().catch((e: unknown) => e);

		expect(error).toBeInstanceOf(Error);
		expect(String(error)).not.toContain("wrong-secret");
	});
});
