import { describe, expect, it } from "vitest";
import { buildJsonDocumentContext } from "./json-ast";

// Helpers
const at = (doc: string, marker = "|") => {
	const pos = doc.indexOf(marker);
	return { doc: doc.slice(0, pos) + doc.slice(pos + 1), pos };
};

describe("buildJsonDocumentContext", () => {
	describe("fullPath", () => {
		it("empty object root", () => {
			const { doc, pos } = at("{\n  |\n}");
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.fullPath).toEqual([]);
		});

		it("one level deep", () => {
			const { doc, pos } = at('{\n  "name": [\n    {\n      |\n    }\n  ]\n}');
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.fullPath).toEqual(["name"]);
		});

		it("two levels deep", () => {
			const { doc, pos } = at(
				'{\n  "address": [\n    {\n      "period": {\n        |\n      }\n    }\n  ]\n}',
			);
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.fullPath).toEqual(["address", "period"]);
		});

		it("second object in array has correct path", () => {
			const { doc, pos } = at(
				'{\n  "parameter": [\n    {"name": "a"},\n    {\n      |\n    }\n  ]\n}',
			);
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.fullPath).toEqual(["parameter"]);
		});

		it("third object in array has correct path", () => {
			const { doc, pos } = at(
				'{\n  "parameter": [\n    {"name": "a"},\n    {"name": "b"},\n    {\n      |\n    }\n  ]\n}',
			);
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.fullPath).toEqual(["parameter"]);
		});

		it("nested array second item", () => {
			const { doc, pos } = at(
				'{\n  "entry": [\n    {"resource": {}},\n    {\n      "resource": {\n        |\n      }\n    }\n  ]\n}',
			);
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.fullPath).toEqual(["entry", "resource"]);
		});

		it("inside contained resource", () => {
			const { doc, pos } = at(
				'{\n  "resourceType": "Bundle",\n  "entry": [\n    {\n      "resource": {\n        "resourceType": "Patient",\n        |\n      }\n    }\n  ]\n}',
			);
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.fullPath).toEqual(["entry", "resource"]);
		});
	});

	describe("fullPath in HTTP mode", () => {
		it("skips HTTP header", () => {
			const { doc, pos } = at(
				"POST /fhir/Patient\nContent-Type: application/json\n\n{\n  |\n}",
			);
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.fullPath).toEqual([]);
		});

		it("nested path in HTTP mode", () => {
			const { doc, pos } = at(
				'PUT /fhir/Patient/1\n\n{\n  "name": [\n    {\n      |\n    }\n  ]\n}',
			);
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.fullPath).toEqual(["name"]);
		});
	});

	describe("cursorPosition", () => {
		it("property on empty line", () => {
			const { doc, pos } = at("{\n  |\n}");
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.cursorPosition.kind).toBe("property");
		});

		it("property with partial word", () => {
			const { doc, pos } = at('{\n  "nam|\n}');
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.cursorPosition.kind).toBe("property");
		});

		it("value after colon with string", () => {
			const { doc, pos } = at('{\n  "gender": "|\n}');
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.cursorPosition).toEqual({
				kind: "value",
				key: "gender",
				prefix: "",
			});
		});

		it("value with partial text", () => {
			const { doc, pos } = at('{\n  "gender": "mal|\n}');
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.cursorPosition).toEqual({
				kind: "value",
				key: "gender",
				prefix: "mal",
			});
		});

		it("value for resourceType", () => {
			const { doc, pos } = at('{\n  "resourceType": "|\n}');
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.cursorPosition).toEqual({
				kind: "value",
				key: "resourceType",
				prefix: "",
			});
		});

		it("array-item inside canonical array", () => {
			const { doc, pos } = at('{\n  "profile": [\n    "|\n  ]\n}');
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.cursorPosition.kind).toBe("array-item");
			if (ctx.cursorPosition.kind === "array-item") {
				expect(ctx.cursorPosition.parentKey).toBe("profile");
			}
		});

		it("property after comma in object", () => {
			const { doc, pos } = at('{\n  "a": 1,\n  |\n}');
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.cursorPosition.kind).toBe("property");
		});
	});

	describe("isInsideArray", () => {
		it("false at object root", () => {
			const { doc, pos } = at("{\n  |\n}");
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.isInsideArray()).toBe(false);
		});

		it("true inside array", () => {
			const { doc, pos } = at('{\n  "name": [\n    |\n  ]\n}');
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.isInsideArray()).toBe(true);
		});

		it("false inside object inside array", () => {
			const { doc, pos } = at('{\n  "name": [\n    {\n      |\n    }\n  ]\n}');
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.isInsideArray()).toBe(false);
		});
	});

	describe("getScope", () => {
		it("getString finds resourceType at level 0", () => {
			const { doc, pos } = at('{\n  "resourceType": "Patient",\n  |\n}');
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.getScope(0).getString("resourceType")).toBe("Patient");
		});

		it("getString finds resourceType in parent object (levelsUp=1)", () => {
			const { doc, pos } = at(
				'{\n  "resourceType": "Patient",\n  "name": [\n    {\n      |\n    }\n  ]\n}',
			);
			const ctx = buildJsonDocumentContext(doc, pos);
			// level 0 is the inner {} (no resourceType)
			expect(ctx.getScope(0).getString("resourceType")).toBe(null);
			// level 1 is the outer {} with "Patient"
			expect(ctx.getScope(1).getString("resourceType")).toBe("Patient");
		});

		it("getString finds inner resourceType for contained", () => {
			const doc = [
				"{",
				'  "resourceType": "Bundle",',
				'  "entry": [',
				"    {",
				'      "resource": {',
				'        "resourceType": "Patient",',
				'        "name": [',
				"          {",
				"            |",
				"          }",
				"        ]",
				"      }",
				"    }",
				"  ]",
				"}",
			].join("\n");
			const { doc: d, pos } = at(doc);
			const ctx = buildJsonDocumentContext(d, pos);
			// level 0 = inner { } (name array item)
			expect(ctx.getScope(0).getString("resourceType")).toBe(null);
			// level 1 = resource { "resourceType": "Patient" }
			expect(ctx.getScope(1).getString("resourceType")).toBe("Patient");
		});

		it("getStringArray finds meta.profile", () => {
			const { doc, pos } = at(
				'{\n  "resourceType": "Patient",\n  "meta": {\n    "profile": ["http://example.com/Patient"]\n  },\n  |\n}',
			);
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.getScope(0).getStringArray("meta", "profile")).toEqual([
				"http://example.com/Patient",
			]);
		});

		it("getStringArray returns empty for missing profile", () => {
			const { doc, pos } = at('{\n  "resourceType": "Patient",\n  |\n}');
			const ctx = buildJsonDocumentContext(doc, pos);
			expect(ctx.getScope(0).getStringArray("meta", "profile")).toEqual([]);
		});
	});
});
