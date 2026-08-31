import { BasicAuthProvider } from "src/auth-providers";
import { AidboxClient } from "src/client";
import type { Bundle, OperationOutcome } from "src/fhir-types/hl7-fhir-r4-core";
import type { User } from "src/types";
import { describe, expect, it } from "vitest";

const baseUrl = "http://localhost:8080";

const client = new AidboxClient<Bundle, OperationOutcome, User>(
	baseUrl,
	new BasicAuthProvider(baseUrl, "basic", "Pa$$w0rd"),
);

// The input is deliberately unreachable: the test observes the submission and
// status protocol, not a completed import.
const inputUrl = "https://example.invalid/patients.ndjson";

describe("bulk import against Aidbox", () => {
	it("submits an import and reads back its typed status", async () => {
		const id = `sdk-import-test-${crypto.randomUUID()}`;

		const submission = await client.bulkImport({
			id,
			contentEncoding: "plain",
			allowedRetryCount: 0,
			inputs: [{ resourceType: "Patient", url: inputUrl }],
		});

		expect(submission.isOk()).toBeTruthy();
		if (!submission.isOk()) return;
		expect(submission.value.id).toBe(id);
		expect(submission.value.statusUrl).toBe(`${baseUrl}/v2/$import/${id}`);

		const status = await client.bulkImportStatus(submission.value);

		expect(status.isOk()).toBeTruthy();
		if (!status.isOk()) return;
		expect(status.value.resource.inputs[0]?.url).toBe(inputUrl);
		expect(typeof status.value.resource.status).toBe("string");
	});

	it("returns an OperationOutcome for an unknown operation id", async () => {
		const status = await client.bulkImportStatus({
			id: `sdk-import-missing-${crypto.randomUUID()}`,
		});

		expect(status.isErr()).toBeTruthy();
		if (!status.isErr()) return;
		expect(status.value.resource.resourceType).toBe("OperationOutcome");
	});
});
