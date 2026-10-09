import { json } from "@codemirror/lang-json";
import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { bodyFormat, http } from "./index";

describe("bodyFormat", () => {
	it("treats application/json and +json types as JSON", () => {
		expect(bodyFormat("application/json")).toBe("json");
		expect(bodyFormat("application/fhir+json")).toBe("json");
		expect(bodyFormat("application/json-patch+json")).toBe("json");
	});

	it("ignores parameters and case", () => {
		expect(bodyFormat("application/json; charset=utf-8")).toBe("json");
		expect(bodyFormat("Application/FHIR+JSON; fhirVersion=4.0")).toBe("json");
	});

	it("recognizes YAML", () => {
		expect(bodyFormat("text/yaml")).toBe("yaml");
		expect(bodyFormat("application/x-yaml")).toBe("yaml");
	});

	it("leaves other bodies as plain text", () => {
		expect(bodyFormat("application/ndjson")).toBe(null);
		expect(bodyFormat("text/csv")).toBe(null);
	});
});

describe("http body language", () => {
	it("activates JSON completion in an application/fhir+json body", () => {
		const jsonLanguage = json().language;
		const source = () => null;
		const doc =
			'POST /fhir/Patient\nContent-Type: application/fhir+json\n\n{\n  "gender": "male"\n}';
		const state = EditorState.create({
			doc,
			extensions: [
				http((contentType) =>
					bodyFormat(contentType) === "json" ? jsonLanguage : null,
				),
				jsonLanguage.data.of({ autocomplete: source }),
			],
		});
		const pos = doc.indexOf('"gender"') + 1;
		expect(state.languageDataAt("autocomplete", pos)).toContain(source);
	});
});
