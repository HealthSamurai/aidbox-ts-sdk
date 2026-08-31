import { BasicAuthProvider } from "src/auth-providers";
import { AidboxClient } from "src/client";
import type { Bundle, OperationOutcome } from "src/fhir-types/hl7-fhir-r4-core";
import type { BatchValidateTaskHandle, User } from "src/types";
import { RequestError } from "src/types";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const baseUrl = "http://localhost:8080";

const client = new AidboxClient<Bundle, OperationOutcome, User>(
	baseUrl,
	new BasicAuthProvider(baseUrl, "basic", "Pa$$w0rd"),
);

const patientId = `ls7-batch-validate-${Date.now()}`;
const since = "2020-01-01T00:00:00Z";

/** Build a task handle for a task id returned by a synchronous summary. */
function handleOf(taskId: string): BatchValidateTaskHandle {
	return { taskId, statusUrl: `${baseUrl}/fhir/$batch-validate/${taskId}` };
}

describe("$batch-validate against a live Aidbox", () => {
	beforeAll(async () => {
		const created = await client.update({
			type: "Patient",
			id: patientId,
			resource: {
				resourceType: "Patient",
				id: patientId,
				name: [{ family: "BatchValidate" }],
			},
		});
		expect(created.isOk()).toBe(true);

		// Introduce an element the profile does not allow, bypassing validation on write.
		const corrupted = await client.sql(
			`update patient set resource = resource || '{"ups":"extra"}' where id = '${patientId}'`,
		);
		expect(corrupted.isOk()).toBe(true);
	});

	afterAll(async () => {
		await client.delete({ type: "Patient", id: patientId });
	});

	it("returns a synchronous summary with the invalid resource counted", async () => {
		const result = await client.batchValidate({ type: "Patient", since });

		expect(result.isOk()).toBe(true);
		if (!result.isOk()) return;
		expect(result.value.kind).toBe("summary");
		if (result.value.kind !== "summary") return;

		const { summary } = result.value;
		expect(summary.taskId).not.toBe("");
		expect(summary.invalid ?? 0).toBeGreaterThanOrEqual(1);
		expect(summary.issues.length).toBeGreaterThanOrEqual(1);
		expect(summary.invalidResourcesUrl).toContain("/invalid-resources");

		const report = await client.batchValidateInvalidResources({
			handle: handleOf(summary.taskId),
		});
		expect(report.isOk()).toBe(true);
		if (!report.isOk()) return;
		const offenders = report.value.resource.resources.filter((resource) =>
			resource.fullUrl?.includes(patientId),
		);
		expect(offenders.length).toBeGreaterThanOrEqual(1);
		expect(offenders[0]?.fullUrl).toContain("/_history/");
		expect(offenders[0]?.resource).toMatchObject({ id: patientId });
		expect(offenders[0]?.outcome).toMatchObject({
			resourceType: "OperationOutcome",
		});

		// The server's own report link is followed with its query string unchanged.
		const followed = await client.batchValidateInvalidResources({
			url: report.value.resource.selfUrl ?? summary.invalidResourcesUrl ?? "",
		});
		expect(followed.isOk()).toBe(true);
	});

	it("refuses a start without a window before contacting the server", async () => {
		await expect(
			client.batchValidate({ type: "Patient", since: "" }),
		).rejects.toBeInstanceOf(RequestError);
	});

	it("starts, polls and cancels an asynchronous task", async () => {
		const started = await client.batchValidate({
			type: "Patient",
			since,
			respondAsync: true,
		});

		expect(started.isOk()).toBe(true);
		if (!started.isOk()) return;
		expect(started.value.kind).toBe("task");
		if (started.value.kind !== "task") return;

		const { handle } = started.value;
		expect(handle.statusUrl).toContain(handle.taskId);

		const status = await client.batchValidateStatus(handle);
		expect(status.isOk()).toBe(true);
		if (!status.isOk()) return;
		// An unfinished task reports progress; a finished one reports the summary.
		expect(["summary", "in-progress"]).toContain(status.value.kind);
		if (status.value.kind === "summary")
			expect(status.value.summary.taskId).toBe(handle.taskId);
		else
			expect(status.value.outcome).toMatchObject({
				resourceType: "OperationOutcome",
			});

		const cancelled = await client.batchValidateCancel(handle);
		expect(cancelled.isOk()).toBe(true);
		if (!cancelled.isOk()) return;
		expect(cancelled.value.outcome).toMatchObject({
			resourceType: "OperationOutcome",
		});
	});
});
