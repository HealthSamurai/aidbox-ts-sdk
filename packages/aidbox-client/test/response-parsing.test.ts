import { AidboxClient } from "src/client";
import type { AuthProvider } from "src/types";
import { describe, expect, it } from "vitest";

const baseUrl = "http://localhost:8080";

const clientAnswering = (make: () => Response) =>
	new AidboxClient(baseUrl, {
		baseUrl,
		fetch: async () => make(),
		establishSession: () => {},
		revokeSession: () => {},
	} as AuthProvider);

// Aidbox really does label its empty responses `text/html`.
const noContent = () =>
	new Response(null, {
		status: 204,
		statusText: "No Content",
		headers: { "content-type": "text/html" },
	});

describe("empty response bodies", () => {
	it("resolves delete of an already deleted resource to Ok(undefined)", async () => {
		const result = await clientAnswering(noContent).delete({
			type: "Patient",
			id: "gone",
		});

		expect(result.isOk()).toBe(true);
		if (result.isOk()) expect(result.value.resource).toBeUndefined();
	});

	it("resolves conditionalDelete without matches to Ok(undefined)", async () => {
		const result = await clientAnswering(noContent).conditionalDelete({
			type: "Patient",
			searchParameters: [["family", "NoSuchFamily"]],
		});

		expect(result.isOk()).toBe(true);
		if (result.isOk()) expect(result.value.resource).toBeUndefined();
	});

	it("treats an empty response without a content type the same way", async () => {
		const result = await clientAnswering(
			() => new Response(null, { status: 204 }),
		).delete({ type: "Patient", id: "gone" });

		expect(result.isOk()).toBe(true);
		if (result.isOk()) expect(result.value.resource).toBeUndefined();
	});
});

describe("bodies the server did not encode as FHIR", () => {
	it("still surfaces a coercion failure for an unparseable success", async () => {
		const request = clientAnswering(
			() =>
				new Response("not fhir", {
					status: 200,
					headers: { "content-type": "text/html" },
				}),
		).read({ type: "Patient", id: "p1" });

		await expect(request).rejects.toThrow("unknown content-type");
	});
});

describe("content types carrying FHIR payloads", () => {
	const patient = { resourceType: "Patient", id: "p1" };

	it.each([
		"application/json",
		"application/fhir+json",
		"application/fhir+json;charset=utf-8",
	])("parses %s", async (contentType) => {
		const result = await clientAnswering(
			() =>
				new Response(JSON.stringify(patient), {
					status: 200,
					headers: { "content-type": contentType },
				}),
		).read<typeof patient>({ type: "Patient", id: "p1" });

		expect(result.isOk()).toBe(true);
		if (result.isOk()) expect(result.value.resource).toMatchObject(patient);
	});

	it.each([
		"text/yaml",
		"application/yaml",
	])("parses %s", async (contentType) => {
		const result = await clientAnswering(
			() =>
				new Response("resourceType: Patient\nid: p1\n", {
					status: 200,
					headers: { "content-type": contentType },
				}),
		).read<typeof patient>({ type: "Patient", id: "p1" });

		expect(result.isOk()).toBe(true);
		if (result.isOk()) expect(result.value.resource).toMatchObject(patient);
	});
});
