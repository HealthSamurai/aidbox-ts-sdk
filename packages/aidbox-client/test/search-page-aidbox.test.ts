import { BasicAuthProvider } from "src/auth-providers";
import { AidboxClient } from "src/client";
import type { Bundle, OperationOutcome } from "src/fhir-types/hl7-fhir-r4-core";
import type { User } from "src/types";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const baseUrl = "http://localhost:8080";

const client = new AidboxClient<Bundle, OperationOutcome, User>(
	baseUrl,
	new BasicAuthProvider(baseUrl, "basic", "Pa$$w0rd"),
);

const family = "SearchPageContinuation";
const patientIds = [
	"search-page-continuation-1",
	"search-page-continuation-2",
	"search-page-continuation-3",
];

describe("searchPage against a live server", () => {
	beforeAll(async () => {
		for (const id of patientIds) {
			const result = await client.update({
				type: "Patient",
				id,
				resource: {
					resourceType: "Patient",
					id,
					name: [{ family, given: ["Continuation"] }],
				},
			});
			expect(result.isOk()).toBe(true);
		}
	});

	afterAll(async () => {
		for (const id of patientIds) {
			await client.delete({ type: "Patient", id });
		}
	});

	it("reads the next page of a paged search", async () => {
		const firstPage = await client.searchType({
			type: "Patient",
			query: [
				["family", family],
				["_count", "1"],
			],
		});

		expect(firstPage.isOk()).toBe(true);
		if (!firstPage.isOk()) return;

		const bundle = firstPage.value.resource;
		expect(bundle.entry).toHaveLength(1);
		expect(bundle.link?.map((link) => link.relation)).toContain("next");

		const secondPage = await client.searchPage({ bundle, relation: "next" });

		expect(secondPage.isOk()).toBe(true);
		if (!secondPage.isOk()) return;

		const nextBundle = secondPage.value.resource;
		expect(nextBundle.resourceType).toBe("Bundle");
		expect(nextBundle.entry).toHaveLength(1);
		expect(
			nextBundle.link?.find((link) => link.relation === "self")?.url,
		).toContain("_page=2");
		expect(nextBundle.entry?.[0]?.resource?.id).not.toBe(
			bundle.entry?.[0]?.resource?.id,
		);
	});
});
