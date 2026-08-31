import { AidboxClient } from "src/client";
import type { OperationOutcome } from "src/fhir-types/hl7-fhir-r4-core";
import type {
	AuthProvider,
	BulkImportHandle,
	BulkImportRequest,
	BulkImportStatus,
} from "src/types";
import { ErrorResponse, RequestError } from "src/types";
import { describe, expect, it } from "vitest";

const baseUrl = "http://localhost:8080";

type FetchCall = {
	url: string;
	method: string;
	body: unknown;
};

const jsonResponse = (
	status: number,
	body: unknown,
	headers: Record<string, string> = {},
): Response =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json", ...headers },
	});

/** Build a client whose auth provider records every call and replays queued responses. */
const makeClient = (responses: Response[], clientBaseUrl: string = baseUrl) => {
	const calls: FetchCall[] = [];
	const queue = [...responses];
	const authProvider: AuthProvider = {
		baseUrl: clientBaseUrl,
		revokeSession: () => {},
		establishSession: () => {},
		fetch: async (input, init) => {
			const body = init?.body;
			calls.push({
				url: input.toString(),
				method: init?.method ?? "GET",
				body: typeof body === "string" && body ? JSON.parse(body) : undefined,
			});
			const next = queue.shift();
			if (!next) throw new Error("unexpected extra request");
			return next;
		},
	};
	return { calls, client: new AidboxClient(clientBaseUrl, authProvider) };
};

const plainRequest: BulkImportRequest = {
	contentEncoding: "plain",
	inputs: [
		{
			resourceType: "Patient",
			url: "https://storage.example.com/patients.ndjson",
		},
	],
};

describe("bulkImport", () => {
	it("sends exactly one POST to /v2/fhir/$import and returns a confined handle", async () => {
		const { client, calls } = makeClient([
			jsonResponse(200, {}, { "content-location": "/v2/$import/abc-123" }),
		]);

		const result = await client.bulkImport(plainRequest);

		expect(calls).toEqual([
			{
				url: "http://localhost:8080/v2/fhir/$import",
				method: "POST",
				body: {
					contentEncoding: "plain",
					inputs: [
						{
							resourceType: "Patient",
							url: "https://storage.example.com/patients.ndjson",
						},
					],
				},
			},
		]);
		expect(result.isOk()).toBe(true);
		if (!result.isOk()) return;
		expect(result.value.id).toBe("abc-123");
		expect(result.value.statusUrl).toBe(
			"http://localhost:8080/v2/$import/abc-123",
		);
		expect(result.value.response.status).toBe(200);
		expect(result.value.responseHeaders["content-location"]).toBe(
			"/v2/$import/abc-123",
		);
		expect(result.value.request.method).toBe("POST");
		expect(typeof result.value.duration).toBe("number");
	});

	it("sends only the fields supplied by the caller", async () => {
		const { client, calls } = makeClient([
			jsonResponse(200, {}, { "content-location": "/v2/$import/full-1" }),
		]);

		await client.bulkImport({
			id: "full-1",
			contentEncoding: "gzip",
			inputs: [{ resourceType: "Observation", url: "s3://bucket/obs.ndjson" }],
			update: true,
			allowedRetryCount: 0,
		});

		expect(calls[0]?.body).toEqual({
			id: "full-1",
			contentEncoding: "gzip",
			inputs: [{ resourceType: "Observation", url: "s3://bucket/obs.ndjson" }],
			update: true,
			allowedRetryCount: 0,
		});
	});

	it("accepts an absolute same-origin content-location", async () => {
		const { client } = makeClient([
			jsonResponse(
				200,
				{},
				{ "content-location": "http://localhost:8080/v2/$import/abs-1" },
			),
		]);

		const result = await client.bulkImport(plainRequest);

		expect(result.isOk()).toBe(true);
		if (!result.isOk()) return;
		expect(result.value.id).toBe("abs-1");
		expect(result.value.statusUrl).toBe(
			"http://localhost:8080/v2/$import/abs-1",
		);
	});

	it("accepts a percent-encoded content-location", async () => {
		const { client } = makeClient([
			jsonResponse(200, {}, { "content-location": "/v2/%24import/enc-1" }),
		]);

		const result = await client.bulkImport(plainRequest);

		expect(result.isOk()).toBe(true);
		if (!result.isOk()) return;
		expect(result.value.id).toBe("enc-1");
		expect(result.value.statusUrl).toBe(
			"http://localhost:8080/v2/$import/enc-1",
		);
	});
});

describe("bulkImport failures", () => {
	const duplicateIdOutcome: OperationOutcome = {
		resourceType: "OperationOutcome",
		id: "exception",
		text: {
			status: "generated",
			div: '<div xmlns="http://www.w3.org/1999/xhtml"><p>Error while AidboxWorkflow creation: ERROR: duplicate key value violates unique constraint &quot;aidboxworkflow_pkey&quot;\n  Detail: Key (id)=(import-1) already exists.</p></div>',
		},
		issue: [
			{
				severity: "fatal",
				code: "exception",
				diagnostics:
					'Error while AidboxWorkflow creation: ERROR: duplicate key value violates unique constraint "aidboxworkflow_pkey"\n  Detail: Key (id)=(import-1) already exists.',
			},
		],
	};

	it("returns the OperationOutcome and response metadata for a rejected submission", async () => {
		const { client, calls } = makeClient([
			jsonResponse(500, duplicateIdOutcome),
		]);

		const result = await client.bulkImport({ ...plainRequest, id: "import-1" });

		expect(result.isErr()).toBe(true);
		if (!result.isErr()) return;
		expect(result.value.resource).toEqual(duplicateIdOutcome);
		expect(result.value.response.status).toBe(500);
		expect(result.value.request.url).toBe("/v2/fhir/$import");
		expect(calls).toHaveLength(1);
	});

	it("throws ErrorResponse for a server error without an OperationOutcome body", async () => {
		const { client, calls } = makeClient([
			jsonResponse(500, { message: "boom" }),
		]);

		await expect(client.bulkImport(plainRequest)).rejects.toBeInstanceOf(
			ErrorResponse,
		);
		expect(calls).toHaveLength(1);
	});
});

describe("bulkImport status location confinement", () => {
	const rejectedLocations: [string, Record<string, string>][] = [
		["missing content-location header", {}],
		["empty operation id", { "content-location": "/v2/$import/" }],
		["extra path segment", { "content-location": "/v2/$import/abc/extra" }],
		["different operation", { "content-location": "/v2/$export/abc" }],
		["a different path prefix", { "content-location": "/fhir/$import/abc" }],
		[
			"foreign origin",
			{ "content-location": "https://evil.example/v2/$import/abc" },
		],
		[
			"credential-bearing authority",
			{ "content-location": "http://user:pw@localhost:8080/v2/$import/abc" },
		],
		[
			"a foreign host smuggled into the authority",
			{
				"content-location": "http://localhost:8080@evil.example/v2/$import/abc",
			},
		],
		[
			"same host on a different port",
			{ "content-location": "http://localhost:8081/v2/$import/abc" },
		],
		["non-http scheme", { "content-location": "file:///v2/$import/abc" }],
		["a query string", { "content-location": "/v2/$import/abc?x=1" }],
		["a fragment", { "content-location": "/v2/$import/abc#frag" }],
		[
			"an encoded path separator in the operation id",
			{ "content-location": "/v2/$import/a%2Fb" },
		],
	];

	it.each(
		rejectedLocations,
	)("rejects an accepted submission with %s and keeps the server evidence", async (_name, headers) => {
		const { client, calls } = makeClient([jsonResponse(200, {}, headers)]);

		const error = await client.bulkImport(plainRequest).then(
			() => undefined,
			(e: unknown) => e,
		);

		expect(error).toBeInstanceOf(ErrorResponse);
		expect((error as ErrorResponse).responseWithMeta.response.status).toBe(200);
		expect((error as ErrorResponse).responseWithMeta.request.url).toBe(
			"/v2/fhir/$import",
		);
		expect(calls).toHaveLength(1);
	});

	it("rejects a same-origin location with a non-http scheme", async () => {
		const ftpBaseUrl = "ftp://localhost:8080";
		const { client, calls } = makeClient(
			[
				jsonResponse(
					200,
					{},
					{ "content-location": "ftp://localhost:8080/v2/$import/abc" },
				),
			],
			ftpBaseUrl,
		);

		const error = await client.bulkImport(plainRequest).then(
			() => undefined,
			(e: unknown) => e,
		);

		expect(new URL("ftp://localhost:8080/v2/$import/abc").origin).toBe(
			new URL(ftpBaseUrl).origin,
		);
		expect(error).toBeInstanceOf(ErrorResponse);
		expect(calls).toHaveLength(1);
	});

	it("rejects a location whose operation id differs from the supplied id", async () => {
		const { client, calls } = makeClient([
			jsonResponse(200, {}, { "content-location": "/v2/$import/other-1" }),
		]);

		const error = await client
			.bulkImport({ ...plainRequest, id: "wanted-1" })
			.then(
				() => undefined,
				(e: unknown) => e,
			);

		expect(error).toBeInstanceOf(ErrorResponse);
		expect(calls).toHaveLength(1);
	});

	it("rejects a location truncated at a query separator in the supplied id", async () => {
		const { client, calls } = makeClient([
			jsonResponse(200, {}, { "content-location": "/v2/$import/rev-q?b-1" }),
		]);

		const error = await client
			.bulkImport({ ...plainRequest, id: "rev-q?b-1" })
			.then(
				() => undefined,
				(e: unknown) => e,
			);

		expect(error).toBeInstanceOf(ErrorResponse);
		expect(calls).toHaveLength(1);
	});
});

describe("bulkImportStatus", () => {
	const handle = {
		id: "abc-123",
		statusUrl: "http://localhost:8080/v2/$import/abc-123",
	};
	const inputUrl = "https://storage.example.com/patients.ndjson";

	const inProgressStatus = {
		type: "fhir",
		inputs: [
			{ url: inputUrl, resourceType: "Patient", status: "waiting" },
			{ url: inputUrl, resourceType: "Patient", status: "in-progress" },
		],
		contentEncoding: "plain",
		allowedRetryCount: 0,
		status: "in-progress",
	};

	const succeededStatus = {
		type: "fhir",
		inputs: [
			{
				url: inputUrl,
				resourceType: "Patient",
				status: "done",
				outcome: "succeeded",
				result: { "imported-resources": 3 },
			},
		],
		contentEncoding: "plain",
		allowedRetryCount: 0,
		status: "done",
		outcome: "succeeded",
		result: {
			message: "Import completed",
			"total-files": 1,
			"total-imported-resources": 3,
		},
	};

	const failedStatus = {
		type: "fhir",
		inputs: [
			{
				url: inputUrl,
				resourceType: "Patient",
				status: "done",
				outcome: "failed",
				error: { message: "Failed to download file" },
			},
			{
				url: "https://storage.example.com/observations.ndjson",
				resourceType: "Observation",
				status: "done",
				outcome: "succeeded",
				result: { "imported-resources": 7 },
			},
		],
		contentEncoding: "plain",
		allowedRetryCount: 0,
		status: "done",
		outcome: "failed",
		error: { message: "Some files failed to import" },
		result: {
			message: "Import completed with errors",
			"total-files": 2,
			"total-imported-resources": 7,
		},
	};

	it.each([
		["queued and in-progress work", inProgressStatus],
		["terminal success with per-input counts", succeededStatus],
		["per-input failure beside a succeeded input", failedStatus],
	])("preserves every server field for %s", async (_name, fixture) => {
		const { client, calls } = makeClient([jsonResponse(200, fixture)]);

		const result = await client.bulkImportStatus(handle);

		expect(calls).toEqual([
			{
				url: "http://localhost:8080/v2/$import/abc-123",
				method: "GET",
				body: undefined,
			},
		]);
		expect(result.isOk()).toBe(true);
		if (!result.isOk()) return;
		expect(result.value.resource).toEqual(fixture);
	});

	it("exposes forward-compatible unknown server fields", async () => {
		const fixture = {
			...inProgressStatus,
			"future-field": { nested: true },
			inputs: [{ ...inProgressStatus.inputs[0], "future-input-field": 42 }],
		};
		const { client } = makeClient([jsonResponse(200, fixture)]);

		const result = await client.bulkImportStatus(handle);

		expect(result.isOk()).toBe(true);
		if (!result.isOk()) return;
		expect(result.value.resource).toEqual(fixture);
		expect(result.value.resource["future-field"]).toEqual({ nested: true });
		expect(result.value.resource.inputs[0]?.["future-input-field"]).toBe(42);
	});

	it("accepts an input the server has not assigned a status to yet", async () => {
		const fixture: BulkImportStatus = {
			type: "fhir",
			inputs: [{ url: inputUrl, resourceType: "Patient" }],
			contentEncoding: "plain",
			allowedRetryCount: 0,
			status: "in-progress",
		};
		const { client } = makeClient([jsonResponse(200, fixture)]);

		const result = await client.bulkImportStatus(handle);

		expect(result.isOk()).toBe(true);
		if (!result.isOk()) return;
		expect(result.value.resource).toEqual(fixture);
		expect(result.value.resource.inputs[0]?.status).toBeUndefined();
	});

	it("preserves server states beyond the documented ones", async () => {
		const fixture: BulkImportStatus = {
			type: "fhir",
			inputs: [{ url: inputUrl, resourceType: "Patient", status: "ready" }],
			contentEncoding: "plain",
			allowedRetryCount: 0,
			status: "requested",
		};
		const { client } = makeClient([jsonResponse(200, fixture)]);

		const result = await client.bulkImportStatus(handle);

		expect(result.isOk()).toBe(true);
		if (!result.isOk()) return;
		expect(result.value.resource.status).toBe("requested");
		expect(result.value.resource.inputs[0]?.status).toBe("ready");
	});

	it("returns the OperationOutcome for an unknown operation id", async () => {
		const notFoundOutcome: OperationOutcome = {
			resourceType: "OperationOutcome",
			id: "exception",
			text: {
				status: "generated",
				div: '<div xmlns="http://www.w3.org/1999/xhtml"><p>Workflow abc-123 not found</p></div>',
			},
			issue: [
				{
					severity: "fatal",
					code: "exception",
					diagnostics: "Workflow abc-123 not found",
				},
			],
		};
		const { client, calls } = makeClient([jsonResponse(500, notFoundOutcome)]);

		const result = await client.bulkImportStatus(handle);

		expect(result.isErr()).toBe(true);
		if (!result.isErr()) return;
		expect(result.value.resource).toEqual(notFoundOutcome);
		expect(result.value.response.status).toBe(500);
		expect(calls).toHaveLength(1);
	});
});

describe("bulkImportStatus handle confinement", () => {
	const tamperedHandles: [string, BulkImportHandle][] = [
		[
			"foreign origin",
			{ id: "x", statusUrl: "https://evil.example/v2/$import/x" },
		],
		[
			"credential-bearing authority",
			{ id: "x", statusUrl: "http://user:pw@localhost:8080/v2/$import/x" },
		],
		[
			"a foreign host smuggled into the authority",
			{ id: "x", statusUrl: "http://localhost:8080@evil.example/v2/$import/x" },
		],
		[
			"same host on a different port",
			{ id: "x", statusUrl: "http://localhost:8081/v2/$import/x" },
		],
		["different operation", { id: "x", statusUrl: "/v2/$export/x" }],
		["extra path segment", { id: "x", statusUrl: "/v2/$import/x/cancel" }],
		["empty operation id", { id: "x", statusUrl: "/v2/$import/" }],
		[
			"an encoded traversal in the operation id",
			{ id: "x", statusUrl: "/v2/$import/..%2F..%2Fauth%2Fuserinfo" },
		],
	];

	it.each(
		tamperedHandles,
	)("refuses a handle with %s before any request is sent", async (_name, tampered) => {
		const { client, calls } = makeClient([]);

		const error = await client.bulkImportStatus(tampered).then(
			() => undefined,
			(e: unknown) => e,
		);

		expect(error).toBeInstanceOf(RequestError);
		expect(calls).toHaveLength(0);
	});

	it("refuses a handle whose status location addresses another operation", async () => {
		const { client, calls } = makeClient([]);

		const error = await client
			.bulkImportStatus({
				id: "x",
				statusUrl: "http://localhost:8080/v2/$import/y",
			})
			.then(
				() => undefined,
				(e: unknown) => e,
			);

		expect(error).toBeInstanceOf(RequestError);
		expect(calls).toHaveLength(0);
	});

	it("refuses an empty operation id before any request is sent", async () => {
		const { client, calls } = makeClient([]);

		const error = await client.bulkImportStatus({ id: "" }).then(
			() => undefined,
			(e: unknown) => e,
		);

		expect(error).toBeInstanceOf(RequestError);
		expect(calls).toHaveLength(0);
	});

	it("builds the same-origin status path from a bare operation id", async () => {
		const { client, calls } = makeClient([
			jsonResponse(200, { inputs: [], status: "in-progress" }),
		]);

		const result = await client.bulkImportStatus({ id: "abc-123" });

		expect(result.isOk()).toBe(true);
		expect(calls).toEqual([
			{
				url: "http://localhost:8080/v2/$import/abc-123",
				method: "GET",
				body: undefined,
			},
		]);
	});

	it.each([
		["a/b"],
		["a\\b"],
		["../../auth/userinfo"],
	])("refuses the operation id %j because a path separator cannot address an import", async (id) => {
		const { client, calls } = makeClient([]);

		const error = await client.bulkImportStatus({ id }).then(
			() => undefined,
			(e: unknown) => e,
		);

		expect(error).toBeInstanceOf(RequestError);
		expect(calls).toHaveLength(0);
	});
});
