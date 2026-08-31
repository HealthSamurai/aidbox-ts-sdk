import { AidboxClient } from "src/client";
import type { Bundle, OperationOutcome } from "src/fhir-types/hl7-fhir-r4-core";
import type { AuthProvider, User } from "src/types";
import { ErrorResponse, RequestError } from "src/types";
import { describe, expect, it } from "vitest";

const baseUrl = "http://localhost:8080";

type RecordedCall = {
	url: string;
	method: string;
	headers: Record<string, string>;
	body: unknown;
};

type Stub = {
	client: AidboxClient<Bundle, OperationOutcome, User>;
	calls: RecordedCall[];
};

/** Build a client backed by a stub `AuthProvider` that replays the given responses in order. */
function stubClient(responses: Response[], clientBaseUrl = baseUrl): Stub {
	const calls: RecordedCall[] = [];
	const queue = [...responses];

	const authProvider: AuthProvider = {
		baseUrl: clientBaseUrl,
		revokeSession: () => {},
		establishSession: () => {},
		fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
			const rawBody = init?.body;
			calls.push({
				url: String(input),
				method: init?.method ?? "GET",
				headers: (init?.headers ?? {}) as Record<string, string>,
				body: typeof rawBody === "string" ? JSON.parse(rawBody) : undefined,
			});
			const response = queue.shift();
			if (!response) throw new Error("unexpected request: no response queued");
			return response;
		},
	};

	return {
		client: new AidboxClient<Bundle, OperationOutcome, User>(
			clientBaseUrl,
			authProvider,
		),
		calls,
	};
}

/** Build a JSON response the way Aidbox returns it. */
function jsonResponse(
	status: number,
	body: unknown,
	headers: Record<string, string> = {},
): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json", ...headers },
	});
}

const summaryFixture = {
	resourceType: "Parameters",
	parameter: [
		{ name: "task-id", valueString: "90239d1d-4df7-4599-9caa-72188558e114" },
		{ name: "validated", valueUnsignedInt: 2 },
		{ name: "valid", valueUnsignedInt: 1 },
		{ name: "invalid", valueUnsignedInt: 1 },
		{ name: "bytes", valueDecimal: 233 },
		{
			name: "invalid-resources",
			valueUrl:
				"http://localhost:8080/fhir/$batch-validate/90239d1d-4df7-4599-9caa-72188558e114/invalid-resources",
		},
		{
			name: "issue",
			part: [
				{ name: "id", valueString: "7809a723232eecba055729af1049e127" },
				{
					name: "invalid-resources",
					valueUrl:
						"http://localhost:8080/fhir/$batch-validate/90239d1d-4df7-4599-9caa-72188558e114/invalid-resources?_issue=7809a723232eecba055729af1049e127",
				},
				{ name: "code", valueCode: "unknown-key" },
				{ name: "expression", valueString: "ups" },
				{ name: "count", valueUnsignedInt: 1 },
				{
					name: "diagnostics",
					valueString: "Patient.ups: element is not allowed by the profile",
				},
			],
		},
	],
};

describe("batchValidate request", () => {
	it("sends exactly one POST to the type-level $batch-validate path with a Parameters body", async () => {
		const { client, calls } = stubClient([jsonResponse(200, summaryFixture)]);

		await client.batchValidate({
			type: "Patient",
			since: "2020-01-01T00:00:00Z",
		});

		expect(calls).toHaveLength(1);
		expect(calls[0]?.url).toBe(
			"http://localhost:8080/fhir/Patient/%24batch-validate",
		);
		expect(calls[0]?.method).toBe("POST");
		expect(calls[0]?.body).toEqual({
			resourceType: "Parameters",
			parameter: [{ name: "_since", valueInstant: "2020-01-01T00:00:00Z" }],
		});
		expect(calls[0]?.headers.prefer).toBeUndefined();
	});

	it("encodes _until, repeated profile canonicals and raw pass-through parameters", async () => {
		const { client, calls } = stubClient([jsonResponse(200, summaryFixture)]);

		await client.batchValidate({
			type: "Observation",
			since: "2020-01-01T00:00:00Z",
			until: "2030-01-01T00:00:00Z",
			profiles: [
				"http://hl7.org/fhir/StructureDefinition/Observation",
				"http://example.org/StructureDefinition/vitals",
			],
			parameters: [{ name: "future-option", valueString: "on" }],
		});

		expect(calls).toHaveLength(1);
		expect(calls[0]?.url).toBe(
			"http://localhost:8080/fhir/Observation/%24batch-validate",
		);
		expect(calls[0]?.body).toEqual({
			resourceType: "Parameters",
			parameter: [
				{ name: "_since", valueInstant: "2020-01-01T00:00:00Z" },
				{ name: "_until", valueInstant: "2030-01-01T00:00:00Z" },
				{
					name: "profile",
					valueCanonical: "http://hl7.org/fhir/StructureDefinition/Observation",
				},
				{
					name: "profile",
					valueCanonical: "http://example.org/StructureDefinition/vitals",
				},
				{ name: "future-option", valueString: "on" },
			],
		});
	});

	it("sets the Prefer: respond-async header only when asynchronous execution is requested", async () => {
		const { client, calls } = stubClient([jsonResponse(200, summaryFixture)]);

		await client.batchValidate({
			type: "Patient",
			since: "2020-01-01T00:00:00Z",
			respondAsync: true,
		});

		expect(calls).toHaveLength(1);
		expect(calls[0]?.headers.prefer).toBe("respond-async");
	});

	it("refuses an empty since before any transport", async () => {
		const { client, calls } = stubClient([]);

		await expect(
			client.batchValidate({ type: "Patient", since: "" }),
		).rejects.toBeInstanceOf(RequestError);
		expect(calls).toHaveLength(0);
	});
});

const outcomeFixture = {
	resourceType: "OperationOutcome",
	text: {
		status: "generated",
		div: '<div xmlns="http://www.w3.org/1999/xhtml"><p>Invalid resource</p></div>',
	},
	issue: [
		{
			severity: "fatal",
			code: "invalid",
			expression: ["Parameters.parameter"],
			details: {
				coding: [
					{
						system: "http://aidbox.app/CodeSystem/operation-outcome-type",
						code: "empty-value",
					},
					{
						system: "http://aidbox.app/CodeSystem/schema-id",
						code: "Parameters",
					},
				],
			},
			diagnostics: "The property's value cannot be empty",
		},
	],
};

const acceptedFixture = {
	resourceType: "OperationOutcome",
	id: "informational",
	issue: [
		{
			severity: "information",
			code: "informational",
			diagnostics: "Batch validation of Patient accepted for async processing",
		},
	],
};

const taskId = "01a0574f-2641-72ce-8fb1-bac83fd66459";
const contentLocation = `http://localhost:8080/fhir/%24batch-validate/${taskId}`;

describe("batchValidate response discrimination", () => {
	it("maps a synchronous 200 Parameters body to a summary", async () => {
		const { client } = stubClient([jsonResponse(200, summaryFixture)]);

		const result = await client.batchValidate({
			type: "Patient",
			since: "2020-01-01T00:00:00Z",
		});

		expect(result.isOk()).toBe(true);
		if (!result.isOk()) return;
		if (result.value.kind !== "summary") throw new Error("expected a summary");

		const { summary } = result.value;
		expect(summary.taskId).toBe("90239d1d-4df7-4599-9caa-72188558e114");
		expect(summary.validated).toBe(2);
		expect(summary.valid).toBe(1);
		expect(summary.invalid).toBe(1);
		expect(summary.bytes).toBe(233);
		expect(summary.invalidResourcesUrl).toBe(
			"http://localhost:8080/fhir/$batch-validate/90239d1d-4df7-4599-9caa-72188558e114/invalid-resources",
		);
		expect(summary.issues).toEqual([
			{
				id: "7809a723232eecba055729af1049e127",
				invalidResourcesUrl:
					"http://localhost:8080/fhir/$batch-validate/90239d1d-4df7-4599-9caa-72188558e114/invalid-resources?_issue=7809a723232eecba055729af1049e127",
				code: "unknown-key",
				expression: "ups",
				count: 1,
				diagnostics: "Patient.ups: element is not allowed by the profile",
			},
		]);
		expect(summary.parameters).toEqual(summaryFixture);
	});

	it("maps a 202 with a Content-Location header to a confined task handle", async () => {
		const { client, calls } = stubClient([
			jsonResponse(202, acceptedFixture, {
				"Content-Location": contentLocation,
			}),
		]);

		const result = await client.batchValidate({
			type: "Patient",
			since: "2020-01-01T00:00:00Z",
			respondAsync: true,
		});

		expect(calls).toHaveLength(1);
		expect(result.isOk()).toBe(true);
		if (!result.isOk()) return;
		if (result.value.kind !== "task") throw new Error("expected a task handle");

		expect(result.value.handle).toEqual({
			taskId,
			statusUrl: `http://localhost:8080/fhir/%24batch-validate/${taskId}`,
		});
	});

	it("returns Err for an OperationOutcome failure body", async () => {
		const { client } = stubClient([jsonResponse(422, outcomeFixture)]);

		const result = await client.batchValidate({
			type: "Patient",
			since: "2020-01-01T00:00:00Z",
		});

		expect(result.isErr()).toBe(true);
		if (!result.isErr()) return;
		expect(result.value.resource).toEqual(outcomeFixture);
		expect(result.value.response.status).toBe(422);
	});

	it("rejects a 200 summary without a task-id parameter", async () => {
		const { client } = stubClient([
			jsonResponse(200, { resourceType: "Parameters", parameter: [] }),
		]);

		await expect(
			client.batchValidate({ type: "Patient", since: "2020-01-01T00:00:00Z" }),
		).rejects.toBeInstanceOf(ErrorResponse);
	});

	it.each([
		["a missing header", undefined],
		[
			"a foreign origin",
			`https://evil.example/fhir/%24batch-validate/${taskId}`,
		],
		[
			"embedded credentials",
			`http://user:pass@localhost:8080/fhir/%24batch-validate/${taskId}`,
		],
		["another operation", `http://localhost:8080/fhir/%24export/${taskId}`],
		[
			"an escaped base path",
			`http://localhost:8080/other/%24batch-validate/${taskId}`,
		],
		["a missing task id", "http://localhost:8080/fhir/%24batch-validate"],
		["an empty task id", "http://localhost:8080/fhir/%24batch-validate/"],
		[
			"an extra path segment",
			`http://localhost:8080/fhir/%24batch-validate/${taskId}/extra`,
		],
	])("throws ErrorResponse after exactly one POST when the 202 location has %s", async (_name, location) => {
		const { client, calls } = stubClient([
			jsonResponse(
				202,
				acceptedFixture,
				location === undefined ? {} : { "content-location": location },
			),
		]);

		const started = client.batchValidate({
			type: "Patient",
			since: "2020-01-01T00:00:00Z",
			respondAsync: true,
		});

		await expect(started).rejects.toBeInstanceOf(ErrorResponse);
		await expect(started).rejects.toThrow(/Content-Location/);
		expect(calls).toHaveLength(1);
	});
});

const cancelledFixture = {
	resourceType: "OperationOutcome",
	id: "informational",
	issue: [
		{
			severity: "information",
			code: "informational",
			diagnostics: "Batch validation task cancelled",
		},
	],
};

const notFoundFixture = {
	resourceType: "OperationOutcome",
	id: "not-found",
	issue: [
		{
			severity: "fatal",
			code: "not-found",
			diagnostics: "No batch validation task 'does-not-exist-123'",
		},
	],
};

const handle = {
	taskId: "90239d1d-4df7-4599-9caa-72188558e114",
	statusUrl:
		"http://localhost:8080/fhir/%24batch-validate/90239d1d-4df7-4599-9caa-72188558e114",
};

const tamperedStatusUrls: [string, string][] = [
	["a foreign origin", "https://evil.example/fhir/$batch-validate/x"],
	[
		"embedded credentials",
		"http://user:pass@localhost:8080/fhir/$batch-validate/x",
	],
	["another operation", "http://localhost:8080/fhir/$export/x"],
	[
		"an extra path segment",
		"http://localhost:8080/fhir/$batch-validate/x/extra",
	],
	["an empty task id", "http://localhost:8080/fhir/$batch-validate/"],
	["an escaped base path", "http://localhost:8080/other/$batch-validate/x"],
	["a foreign scheme", "ftp://localhost:8080/fhir/$batch-validate/x"],
	[
		"a percent-encoded slash in the task id",
		"http://localhost:8080/fhir/$batch-validate/a%2Fb",
	],
];

/**
 * Build a handle for a tampered status URL.
 *
 * The task id is taken from the URL itself, so that the handle stays self-consistent and only the URL confinement can refuse it.
 */
function tamperedHandle(statusUrl: string) {
	const lastSegment = statusUrl.split("/").pop() ?? "";
	let taskId = lastSegment;
	try {
		taskId = decodeURIComponent(lastSegment);
	} catch {
		taskId = lastSegment;
	}
	return { taskId, statusUrl };
}

describe("batchValidateStatus", () => {
	it("polls the confined status path and maps the summary", async () => {
		const { client, calls } = stubClient([jsonResponse(200, summaryFixture)]);

		const result = await client.batchValidateStatus(handle);

		expect(calls).toHaveLength(1);
		expect(calls[0]?.method).toBe("GET");
		expect(calls[0]?.url).toBe(
			"http://localhost:8080/fhir/%24batch-validate/90239d1d-4df7-4599-9caa-72188558e114",
		);
		expect(result.isOk()).toBe(true);
		if (!result.isOk()) return;
		expect(result.value.kind).toBe("summary");
		if (result.value.kind !== "summary") return;
		expect(result.value.summary.taskId).toBe(
			"90239d1d-4df7-4599-9caa-72188558e114",
		);
		expect(result.value.summary.invalid).toBe(1);
		expect(result.value.summary.issues).toHaveLength(1);
		expect(result.value.summary.parameters).toEqual(summaryFixture);
	});

	it("returns Err for an OperationOutcome failure body", async () => {
		const { client } = stubClient([jsonResponse(404, notFoundFixture)]);

		const result = await client.batchValidateStatus(handle);

		expect(result.isErr()).toBe(true);
		if (!result.isErr()) return;
		expect(result.value.resource).toEqual(notFoundFixture);
	});

	it.each(
		tamperedStatusUrls,
	)("refuses a handle with %s before any transport", async (_name, statusUrl) => {
		const { client, calls } = stubClient([]);

		await expect(
			client.batchValidateStatus(tamperedHandle(statusUrl)),
		).rejects.toBeInstanceOf(RequestError);
		expect(calls).toHaveLength(0);
	});
});

describe("batchValidateCancel", () => {
	it("deletes the confined status path and preserves the outcome body", async () => {
		const { client, calls } = stubClient([jsonResponse(202, cancelledFixture)]);

		const result = await client.batchValidateCancel(handle);

		expect(calls).toHaveLength(1);
		expect(calls[0]?.method).toBe("DELETE");
		expect(calls[0]?.url).toBe(
			"http://localhost:8080/fhir/%24batch-validate/90239d1d-4df7-4599-9caa-72188558e114",
		);
		expect(result.isOk()).toBe(true);
		if (!result.isOk()) return;
		expect(result.value.response.status).toBe(202);
		expect(result.value.outcome).toEqual(cancelledFixture);
	});

	it("returns Err for an OperationOutcome failure body", async () => {
		const { client } = stubClient([jsonResponse(404, notFoundFixture)]);

		const result = await client.batchValidateCancel(handle);

		expect(result.isErr()).toBe(true);
		if (!result.isErr()) return;
		expect(result.value.resource).toEqual(notFoundFixture);
	});

	it.each(
		tamperedStatusUrls,
	)("refuses a handle with %s before any transport", async (_name, statusUrl) => {
		const { client, calls } = stubClient([]);

		await expect(
			client.batchValidateCancel(tamperedHandle(statusUrl)),
		).rejects.toBeInstanceOf(RequestError);
		expect(calls).toHaveLength(0);
	});
});

// Captured from a live Aidbox report, plus a synthetic `next` parameter: the
// observed build supplies `total` and `self` only.
const invalidResourcesFixture = {
	resourceType: "Parameters",
	parameter: [
		{ name: "total", valueUnsignedInt: 1 },
		{
			name: "self",
			valueUrl:
				"http://localhost:8080/fhir/$batch-validate/90239d1d-4df7-4599-9caa-72188558e114/invalid-resources?_count=5&_page=1",
		},
		{
			name: "next",
			valueUrl:
				"http://localhost:8080/fhir/$batch-validate/90239d1d-4df7-4599-9caa-72188558e114/invalid-resources?_count=5&_page=2",
		},
		{
			name: "resource",
			part: [
				{
					name: "fullUrl",
					valueUrl:
						"http://localhost:8080/Patient/ls7-probe-1788171170/_history/8113",
				},
				{
					name: "resource",
					resource: {
						ups: "extra",
						name: [{ family: "Probe" }],
						id: "ls7-probe-1788171170",
						resourceType: "Patient",
						meta: {
							lastUpdated: "2026-08-31T10:12:50.342381Z",
							createdAt: "2026-08-31T10:12:50.342381Z",
							versionId: "8113",
						},
					},
				},
				{
					name: "outcome",
					resource: {
						resourceType: "OperationOutcome",
						issue: [
							{
								severity: "fatal",
								code: "invalid",
								expression: ["Patient.ups"],
								diagnostics:
									"Patient.ups: element is not allowed by the profile",
								details: {
									coding: [
										{
											system:
												"http://aidbox.app/CodeSystem/operation-outcome-type",
											code: "unknown-key",
										},
									],
								},
							},
						],
					},
				},
			],
		},
	],
};

describe("batchValidateInvalidResources", () => {
	it("builds the drill-down query from a task handle", async () => {
		const { client, calls } = stubClient([
			jsonResponse(200, invalidResourcesFixture),
		]);

		await client.batchValidateInvalidResources({
			handle,
			count: 5,
			page: 1,
			issues: ["7809a723232eecba055729af1049e127", "other-issue"],
		});

		expect(calls).toHaveLength(1);
		expect(calls[0]?.method).toBe("GET");
		expect(calls[0]?.url).toBe(
			"http://localhost:8080/fhir/%24batch-validate/90239d1d-4df7-4599-9caa-72188558e114/invalid-resources?_count=5&_page=1&_issue=7809a723232eecba055729af1049e127&_issue=other-issue",
		);
	});

	it("omits paging parameters that were not requested", async () => {
		const { client, calls } = stubClient([
			jsonResponse(200, invalidResourcesFixture),
		]);

		await client.batchValidateInvalidResources({ handle });

		expect(calls[0]?.url).toBe(
			"http://localhost:8080/fhir/%24batch-validate/90239d1d-4df7-4599-9caa-72188558e114/invalid-resources",
		);
	});

	it("preserves total, links, versioned offender URLs, resources and outcomes", async () => {
		const { client } = stubClient([jsonResponse(200, invalidResourcesFixture)]);

		const result = await client.batchValidateInvalidResources({ handle });

		expect(result.isOk()).toBe(true);
		if (!result.isOk()) return;
		const report = result.value.resource;
		expect(report.total).toBe(1);
		expect(report.selfUrl).toBe(
			"http://localhost:8080/fhir/$batch-validate/90239d1d-4df7-4599-9caa-72188558e114/invalid-resources?_count=5&_page=1",
		);
		expect(report.nextUrl).toBe(
			"http://localhost:8080/fhir/$batch-validate/90239d1d-4df7-4599-9caa-72188558e114/invalid-resources?_count=5&_page=2",
		);
		expect(report.resources).toHaveLength(1);
		expect(report.resources[0]?.fullUrl).toBe(
			"http://localhost:8080/Patient/ls7-probe-1788171170/_history/8113",
		);
		expect(report.resources[0]?.resource).toEqual(
			invalidResourcesFixture.parameter[3]?.part?.[1]?.resource,
		);
		expect(report.resources[0]?.outcome).toEqual(
			invalidResourcesFixture.parameter[3]?.part?.[2]?.resource,
		);
		expect(report.parameters).toEqual(invalidResourcesFixture);
	});

	it("follows a report link and passes its query through verbatim", async () => {
		const { client, calls } = stubClient([
			jsonResponse(200, invalidResourcesFixture),
		]);

		const result = await client.batchValidateInvalidResources({
			url: "http://localhost:8080/fhir/$batch-validate/90239d1d-4df7-4599-9caa-72188558e114/invalid-resources?_count=5&_page=2",
		});

		expect(calls).toHaveLength(1);
		expect(calls[0]?.url).toBe(
			"http://localhost:8080/fhir/%24batch-validate/90239d1d-4df7-4599-9caa-72188558e114/invalid-resources?_count=5&_page=2",
		);
		expect(result.isOk()).toBe(true);
	});

	it("returns Err for an OperationOutcome failure body", async () => {
		const { client } = stubClient([jsonResponse(404, notFoundFixture)]);

		const result = await client.batchValidateInvalidResources({ handle });

		expect(result.isErr()).toBe(true);
		if (!result.isErr()) return;
		expect(result.value.resource).toEqual(notFoundFixture);
	});

	it.each([
		[
			"a foreign origin",
			"https://evil.example/fhir/$batch-validate/x/invalid-resources",
		],
		[
			"embedded credentials",
			"http://user:pass@localhost:8080/fhir/$batch-validate/x/invalid-resources",
		],
		[
			"another operation",
			"http://localhost:8080/fhir/$export/x/invalid-resources",
		],
		[
			"a missing task id",
			"http://localhost:8080/fhir/$batch-validate/invalid-resources",
		],
		[
			"an escaped base path",
			"http://localhost:8080/other/$batch-validate/x/invalid-resources",
		],
		[
			"a foreign scheme",
			"ftp://localhost:8080/fhir/$batch-validate/x/invalid-resources",
		],
		["a status path", "http://localhost:8080/fhir/$batch-validate/x"],
		[
			"an extra path segment",
			"http://localhost:8080/fhir/$batch-validate/x/invalid-resources/extra",
		],
		[
			"another tail segment",
			"http://localhost:8080/fhir/$batch-validate/x/other",
		],
	])("refuses a link with %s before any transport", async (_name, url) => {
		const { client, calls } = stubClient([]);

		await expect(
			client.batchValidateInvalidResources({ url }),
		).rejects.toBeInstanceOf(RequestError);
		expect(calls).toHaveLength(0);
	});

	it.each(
		tamperedStatusUrls,
	)("refuses a handle with %s before any transport", async (_name, statusUrl) => {
		const { client, calls } = stubClient([]);

		await expect(
			client.batchValidateInvalidResources({
				handle: tamperedHandle(statusUrl),
			}),
		).rejects.toBeInstanceOf(RequestError);
		expect(calls).toHaveLength(0);
	});
});

const inProgressFixture = {
	resourceType: "OperationOutcome",
	id: "informational",
	text: {
		status: "generated",
		div: '<div xmlns="http://www.w3.org/1999/xhtml"><p>Batch validation is in progress: 0%</p></div>',
	},
	issue: [
		{
			severity: "information",
			code: "informational",
			diagnostics: "Batch validation is in progress: 0%",
		},
	],
};

describe("batchValidateStatus of an unfinished task", () => {
	it("reports progress instead of inventing a summary", async () => {
		const { client, calls } = stubClient([
			jsonResponse(202, inProgressFixture),
		]);

		const result = await client.batchValidateStatus(handle);

		expect(calls).toHaveLength(1);
		expect(result.isOk()).toBe(true);
		if (!result.isOk()) return;
		expect(result.value.kind).toBe("in-progress");
		if (result.value.kind !== "in-progress") return;
		expect(result.value.outcome).toEqual(inProgressFixture);
		expect(result.value.response.status).toBe(202);
	});
});

describe("$batch-validate URL confinement is root-relative", () => {
	it("accepts the server's root-relative task path when the base URL carries a path", async () => {
		const { client } = stubClient(
			[
				jsonResponse(202, acceptedFixture, {
					"content-location": "http://localhost:8080/fhir/$batch-validate/x",
				}),
			],
			"http://localhost:8080/api",
		);

		const result = await client.batchValidate({
			type: "Patient",
			since: "2020-01-01T00:00:00Z",
			respondAsync: true,
		});

		expect(result.isOk()).toBe(true);
		if (!result.isOk()) return;
		if (result.value.kind !== "task") throw new Error("expected a task handle");
		expect(result.value.handle.taskId).toBe("x");
	});

	it("rejects a task path below the base URL's own path", async () => {
		const { client, calls } = stubClient(
			[
				jsonResponse(202, acceptedFixture, {
					"content-location":
						"http://localhost:8080/api/fhir/$batch-validate/x",
				}),
			],
			"http://localhost:8080/api",
		);

		await expect(
			client.batchValidate({
				type: "Patient",
				since: "2020-01-01T00:00:00Z",
				respondAsync: true,
			}),
		).rejects.toBeInstanceOf(ErrorResponse);
		expect(calls).toHaveLength(1);
	});
});

describe("$batch-validate task handles must be self-consistent", () => {
	const mismatched = {
		taskId: "task-a",
		statusUrl: "http://localhost:8080/fhir/$batch-validate/task-b",
	};

	it("refuses a status poll whose task id and status URL disagree", async () => {
		const { client, calls } = stubClient([]);

		await expect(client.batchValidateStatus(mismatched)).rejects.toBeInstanceOf(
			RequestError,
		);
		expect(calls).toHaveLength(0);
	});

	it("refuses a cancellation whose task id and status URL disagree", async () => {
		const { client, calls } = stubClient([]);

		await expect(client.batchValidateCancel(mismatched)).rejects.toBeInstanceOf(
			RequestError,
		);
		expect(calls).toHaveLength(0);
	});

	it("refuses a drill-down whose task id and status URL disagree", async () => {
		const { client, calls } = stubClient([]);

		await expect(
			client.batchValidateInvalidResources({ handle: mismatched }),
		).rejects.toBeInstanceOf(RequestError);
		expect(calls).toHaveLength(0);
	});

	it("rejects a summary that reports a different task id than the polled one", async () => {
		const { client, calls } = stubClient([
			jsonResponse(200, {
				resourceType: "Parameters",
				parameter: [{ name: "task-id", valueString: "another-task" }],
			}),
		]);

		await expect(
			client.batchValidateStatus({
				taskId: "task-b",
				statusUrl: "http://localhost:8080/fhir/$batch-validate/task-b",
			}),
		).rejects.toBeInstanceOf(ErrorResponse);
		expect(calls).toHaveLength(1);
	});
});

describe("$batch-validate accepts only its documented success states", () => {
	it("rejects an unexpected 2xx from a start", async () => {
		const { client } = stubClient([jsonResponse(201, summaryFixture)]);

		await expect(
			client.batchValidate({ type: "Patient", since: "2020-01-01T00:00:00Z" }),
		).rejects.toBeInstanceOf(ErrorResponse);
	});

	it("rejects an unexpected 2xx from a status poll", async () => {
		const { client } = stubClient([jsonResponse(201, summaryFixture)]);

		await expect(client.batchValidateStatus(handle)).rejects.toBeInstanceOf(
			ErrorResponse,
		);
	});
});

describe("$batch-validate keeps a successful OperationOutcome as a diagnosis", () => {
	it("returns Err when a start answers 200 with an OperationOutcome", async () => {
		const { client } = stubClient([jsonResponse(200, outcomeFixture)]);

		const result = await client.batchValidate({
			type: "Patient",
			since: "2020-01-01T00:00:00Z",
		});

		expect(result.isErr()).toBe(true);
		if (!result.isErr()) return;
		expect(result.value.resource).toEqual(outcomeFixture);
		expect(result.value.response.status).toBe(200);
	});

	it("returns Err when a status poll answers 200 with an OperationOutcome", async () => {
		const { client } = stubClient([jsonResponse(200, outcomeFixture)]);

		const result = await client.batchValidateStatus(handle);

		expect(result.isErr()).toBe(true);
		if (!result.isErr()) return;
		expect(result.value.resource).toEqual(outcomeFixture);
	});

	it("returns Err when a drill-down answers 200 with an OperationOutcome", async () => {
		const { client } = stubClient([jsonResponse(200, outcomeFixture)]);

		const result = await client.batchValidateInvalidResources({ handle });

		expect(result.isErr()).toBe(true);
		if (!result.isErr()) return;
		expect(result.value.resource).toEqual(outcomeFixture);
	});
});
