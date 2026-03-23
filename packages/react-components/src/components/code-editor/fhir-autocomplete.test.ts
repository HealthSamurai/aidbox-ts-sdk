import { CompletionContext } from "@codemirror/autocomplete";
import { json } from "@codemirror/lang-json";
import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import {
	buildParameterSnippet,
	type ExpandValueSet,
	type GetStructureDefinitions,
	jsonCompletionSource,
} from "./fhir-autocomplete";

// ── Minimal mock SDs ───────────────────────────────────────────────────

const PATIENT_SD = {
	type: "Patient",
	url: "http://hl7.org/fhir/StructureDefinition/Patient",
	baseDefinition: "http://hl7.org/fhir/StructureDefinition/DomainResource",
	differential: {
		element: [
			{ path: "Patient", min: 0, max: "*" },
			{ path: "Patient.name", min: 0, max: "*", type: [{ code: "HumanName" }] },
			{
				path: "Patient.gender",
				min: 0,
				max: "1",
				type: [{ code: "code" }],
				binding: {
					valueSet: "http://hl7.org/fhir/ValueSet/administrative-gender",
					strength: "required",
				},
			},
			{ path: "Patient.birthDate", min: 0, max: "1", type: [{ code: "date" }] },
			{ path: "Patient.active", min: 0, max: "1", type: [{ code: "boolean" }] },
			{
				path: "Patient.managingOrganization",
				min: 0,
				max: "1",
				type: [
					{
						code: "Reference",
						targetProfile: [
							"http://hl7.org/fhir/StructureDefinition/Organization",
						],
					},
				],
			},
			{
				path: "Patient.contained",
				min: 0,
				max: "*",
				type: [{ code: "Resource" }],
			},
			{
				path: "Patient.meta",
				min: 0,
				max: "1",
				type: [{ code: "Meta" }],
			},
		],
	},
};

const OBSERVATION_SD = {
	type: "Observation",
	url: "http://hl7.org/fhir/StructureDefinition/Observation",
	baseDefinition: "http://hl7.org/fhir/StructureDefinition/DomainResource",
	differential: {
		element: [
			{ path: "Observation", min: 0, max: "*" },
			{
				path: "Observation.status",
				min: 1,
				max: "1",
				type: [{ code: "code" }],
			},
			{
				path: "Observation.code",
				min: 1,
				max: "1",
				type: [{ code: "CodeableConcept" }],
			},
			{
				path: "Observation.subject",
				min: 0,
				max: "1",
				type: [
					{
						code: "Reference",
						targetProfile: [
							"http://hl7.org/fhir/StructureDefinition/Patient",
							"http://hl7.org/fhir/StructureDefinition/Group",
						],
					},
				],
			},
		],
	},
};

const DOMAIN_RESOURCE_SD = {
	type: "DomainResource",
	url: "http://hl7.org/fhir/StructureDefinition/DomainResource",
	baseDefinition: "http://hl7.org/fhir/StructureDefinition/Resource",
	differential: {
		element: [
			{ path: "DomainResource", min: 0, max: "*" },
			{
				path: "DomainResource.text",
				min: 0,
				max: "1",
				type: [{ code: "Narrative" }],
			},
			{
				path: "DomainResource.contained",
				min: 0,
				max: "*",
				type: [{ code: "Resource" }],
			},
			{
				path: "DomainResource.extension",
				min: 0,
				max: "*",
				type: [{ code: "Extension" }],
			},
			{
				path: "DomainResource.modifierExtension",
				min: 0,
				max: "*",
				type: [{ code: "Extension" }],
			},
		],
	},
};

const RESOURCE_SD = {
	type: "Resource",
	url: "http://hl7.org/fhir/StructureDefinition/Resource",
	differential: {
		element: [
			{ path: "Resource", min: 0, max: "*" },
			{ path: "Resource.id", min: 0, max: "1", type: [{ code: "id" }] },
			{ path: "Resource.meta", min: 0, max: "1", type: [{ code: "Meta" }] },
		],
	},
};

const HUMAN_NAME_SD = {
	type: "HumanName",
	url: "http://hl7.org/fhir/StructureDefinition/HumanName",
	differential: {
		element: [
			{ path: "HumanName", min: 0, max: "*" },
			{
				path: "HumanName.family",
				min: 0,
				max: "1",
				type: [{ code: "string" }],
			},
			{ path: "HumanName.given", min: 0, max: "*", type: [{ code: "string" }] },
		],
	},
};

const REFERENCE_SD = {
	type: "Reference",
	url: "http://hl7.org/fhir/StructureDefinition/Reference",
	differential: {
		element: [
			{ path: "Reference", min: 0, max: "*" },
			{
				path: "Reference.reference",
				min: 0,
				max: "1",
				type: [{ code: "string" }],
			},
			{
				path: "Reference.display",
				min: 0,
				max: "1",
				type: [{ code: "string" }],
			},
		],
	},
};

const META_SD = {
	type: "Meta",
	url: "http://hl7.org/fhir/StructureDefinition/Meta",
	differential: {
		element: [
			{ path: "Meta", min: 0, max: "*" },
			{
				path: "Meta.profile",
				min: 0,
				max: "*",
				type: [
					{
						code: "canonical",
						targetProfile: [
							"http://hl7.org/fhir/StructureDefinition/StructureDefinition",
						],
					},
				],
			},
		],
	},
};

const BUNDLE_SD = {
	type: "Bundle",
	url: "http://hl7.org/fhir/StructureDefinition/Bundle",
	baseDefinition: "http://hl7.org/fhir/StructureDefinition/Resource",
	differential: {
		element: [
			{ path: "Bundle", min: 0, max: "*" },
			{ path: "Bundle.type", min: 1, max: "1", type: [{ code: "code" }] },
			{
				path: "Bundle.entry",
				min: 0,
				max: "*",
				type: [{ code: "BackboneElement" }],
			},
			{
				path: "Bundle.entry.resource",
				min: 0,
				max: "1",
				type: [{ code: "Resource" }],
			},
		],
	},
};

const PARAMETERS_SD = {
	type: "Parameters",
	url: "http://hl7.org/fhir/StructureDefinition/Parameters",
	baseDefinition: "http://hl7.org/fhir/StructureDefinition/Resource",
	differential: {
		element: [
			{ path: "Parameters", min: 0, max: "*" },
			{
				path: "Parameters.parameter",
				min: 0,
				max: "*",
				type: [{ code: "BackboneElement" }],
			},
			{
				path: "Parameters.parameter.name",
				min: 1,
				max: "1",
				type: [{ code: "string" }],
			},
			{
				path: "Parameters.parameter.value[x]",
				min: 0,
				max: "1",
				type: [
					{ code: "string" },
					{ code: "boolean" },
					{ code: "integer" },
					{ code: "code" },
					{ code: "Reference" },
					{ code: "CodeableConcept" },
				],
			},
			{
				path: "Parameters.parameter.resource",
				min: 0,
				max: "1",
				type: [{ code: "Resource" }],
			},
			{
				path: "Parameters.parameter.part",
				min: 0,
				max: "*",
				contentReference: "#Parameters.parameter",
			},
		],
	},
};

const INSTALL_PARAMS_PROFILE = {
	type: "Parameters",
	url: "http://health-samurai.io/fhir/core/StructureDefinition/fhir-package-install-parameters",
	baseDefinition: "http://hl7.org/fhir/StructureDefinition/Parameters",
	differential: {
		element: [
			{ path: "Parameters.parameter", min: 1 },
			{
				path: "Parameters.parameter",
				sliceName: "package",
				min: 1,
				max: "*",
			},
			{
				path: "Parameters.parameter.name",
				fixedString: "package",
			},
			{
				path: "Parameters.parameter",
				sliceName: "registry",
				min: 0,
				max: "1",
			},
			{
				path: "Parameters.parameter.name",
				fixedString: "registry",
			},
		],
	},
};

const TYPED_PARAMS_PROFILE = {
	type: "Parameters",
	url: "http://example.com/StructureDefinition/typed-params",
	baseDefinition: "http://hl7.org/fhir/StructureDefinition/Parameters",
	differential: {
		element: [
			{
				path: "Parameters.parameter",
				sliceName: "count",
				min: 1,
				max: "1",
			},
			{
				path: "Parameters.parameter.name",
				fixedString: "count",
			},
			{
				path: "Parameters.parameter.value[x]",
				type: [{ code: "integer" }],
			},
			{
				path: "Parameters.parameter",
				sliceName: "label",
				min: 0,
				max: "1",
			},
			{
				path: "Parameters.parameter.name",
				fixedString: "label",
			},
			{
				path: "Parameters.parameter.value[x]",
				type: [{ code: "string" }],
			},
		],
	},
};

const TOPIC_DEST_SD = {
	type: "AidboxTopicDestination",
	url: "http://aidbox.app/StructureDefinition/AidboxTopicDestination",
	baseDefinition: "http://hl7.org/fhir/StructureDefinition/Parameters",
	differential: {
		element: [
			{ path: "AidboxTopicDestination", min: 0, max: "*" },
			{
				path: "AidboxTopicDestination.kind",
				min: 0,
				max: "1",
				type: [{ code: "string" }],
			},
		],
	},
};

const TOPIC_DEST_KAFKA_PROFILE = {
	type: "AidboxTopicDestination",
	url: "http://aidbox.app/StructureDefinition/aidboxtopicdestination-kafka-best-effort",
	baseDefinition:
		"http://aidbox.app/StructureDefinition/AidboxTopicDestination",
	differential: {
		element: [
			{
				path: "AidboxTopicDestination.kind",
				fixedString: "kafka-best-effort",
			},
			{
				path: "AidboxTopicDestination.parameter",
				sliceName: "kafkaTopic",
				min: 1,
				max: "1",
			},
			{
				path: "AidboxTopicDestination.parameter.name",
				fixedString: "kafkaTopic",
			},
			{
				path: "AidboxTopicDestination.parameter.value[x]",
				type: [{ code: "string" }],
			},
			{
				path: "AidboxTopicDestination.parameter",
				sliceName: "bootstrapServers",
				min: 1,
				max: "1",
			},
			{
				path: "AidboxTopicDestination.parameter.name",
				fixedString: "bootstrapServers",
			},
			{
				path: "AidboxTopicDestination.parameter.value[x]",
				type: [{ code: "string" }],
			},
			{
				path: "AidboxTopicDestination.parameter",
				sliceName: "batchSize",
				min: 0,
				max: "1",
			},
			{
				path: "AidboxTopicDestination.parameter.name",
				fixedString: "batchSize",
			},
			{
				path: "AidboxTopicDestination.parameter.value[x]",
				type: [{ code: "integer" }],
			},
		],
	},
};

const RESOURCE_TYPE_LIST = [
	{ type: "Patient" },
	{ type: "Observation" },
	{ type: "Organization" },
	{ type: "Bundle" },
	{ type: "Parameters" },
	{ type: "AidboxTopicDestination" },
];

const ALL_SDS: Record<string, typeof PATIENT_SD> = {
	Patient: PATIENT_SD,
	Observation: OBSERVATION_SD,
	DomainResource: DOMAIN_RESOURCE_SD,
	Resource: RESOURCE_SD,
	HumanName: HUMAN_NAME_SD,
	Reference: REFERENCE_SD,
	Meta: META_SD,
	Bundle: BUNDLE_SD,
	Parameters: PARAMETERS_SD,
	"http://hl7.org/fhir/StructureDefinition/Patient": PATIENT_SD,
	"http://hl7.org/fhir/StructureDefinition/Observation": OBSERVATION_SD,
	"http://hl7.org/fhir/StructureDefinition/DomainResource": DOMAIN_RESOURCE_SD,
	"http://hl7.org/fhir/StructureDefinition/Resource": RESOURCE_SD,
	"http://hl7.org/fhir/StructureDefinition/HumanName": HUMAN_NAME_SD,
	"http://hl7.org/fhir/StructureDefinition/Reference": REFERENCE_SD,
	"http://hl7.org/fhir/StructureDefinition/Meta": META_SD,
	"http://hl7.org/fhir/StructureDefinition/Bundle": BUNDLE_SD,
	"http://hl7.org/fhir/StructureDefinition/Parameters": PARAMETERS_SD,
	"http://health-samurai.io/fhir/core/StructureDefinition/fhir-package-install-parameters":
		INSTALL_PARAMS_PROFILE,
	"http://example.com/StructureDefinition/typed-params": TYPED_PARAMS_PROFILE,
	AidboxTopicDestination: TOPIC_DEST_SD,
	"http://aidbox.app/StructureDefinition/AidboxTopicDestination": TOPIC_DEST_SD,
	"http://aidbox.app/StructureDefinition/aidboxtopicdestination-kafka-best-effort":
		TOPIC_DEST_KAFKA_PROFILE,
};

// ── Mock getSDs ────────────────────────────────────────────────────────

const mockGetSDs: GetStructureDefinitions = async (params) => {
	if (params.kind === "resource" && params.derivation === "specialization") {
		return RESOURCE_TYPE_LIST as (typeof PATIENT_SD)[];
	}
	if (params.url) {
		const sd = ALL_SDS[params.url];
		return sd ? [sd] : [];
	}
	if (params.type && params.derivation === "specialization") {
		const sd = ALL_SDS[params.type];
		return sd ? [sd] : [];
	}
	if (params.type && params["derivation:missing"] === "true") {
		const sd = ALL_SDS[params.type];
		return sd ? [sd] : [];
	}
	if (params.type === "Extension") {
		return [];
	}
	return [];
};

const mockExpandValueSet: ExpandValueSet = async (url, _filter) => {
	if (url === "http://hl7.org/fhir/ValueSet/administrative-gender") {
		return [
			{ code: "male", display: "Male" },
			{ code: "female", display: "Female" },
			{ code: "other", display: "Other" },
			{ code: "unknown", display: "Unknown" },
		];
	}
	return [];
};

// ── Test helpers ───────────────────────────────────────────────────────

function completionAt(doc: string, marker = "|") {
	const pos = doc.indexOf(marker);
	const text = doc.slice(0, pos) + doc.slice(pos + 1);
	const state = EditorState.create({ doc: text, extensions: [json()] });
	const cc = new CompletionContext(state, pos, true);
	return { state, cc, pos };
}

function labels(result: { options: { label: string }[] } | null): string[] {
	return result?.options.map((o) => o.label) ?? [];
}

// ── Caches persist across tests — clear between describes ──────────────

// The SD cache is module-level in fhir-autocomplete.ts.
// Since we use consistent mock data, the cache doesn't cause issues.

// ── Tests ──────────────────────────────────────────────────────────────

describe("fhir-autocomplete: jsonCompletionSource", () => {
	const source = jsonCompletionSource(
		mockGetSDs,
		undefined,
		mockExpandValueSet,
	);

	describe("resourceType value completions", () => {
		it("offers resource types in empty resourceType value", async () => {
			const { cc } = completionAt('{\n  "resourceType": "|\n}');
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("Patient");
			expect(l).toContain("Observation");
			expect(l).toContain("Organization");
		});
	});

	describe("property completions", () => {
		it("offers Patient fields when resourceType is set", async () => {
			const { cc } = completionAt('{\n  "resourceType": "Patient",\n  |\n}');
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("name");
			expect(l).toContain("gender");
			expect(l).toContain("birthDate");
			expect(l).toContain("managingOrganization");
		});

		it("offers resourceType when no resourceType is set", async () => {
			const { cc } = completionAt("{\n  |\n}");
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("resourceType");
		});

		it("offers primitive extensions (_birthDate)", async () => {
			const { cc } = completionAt('{\n  "resourceType": "Patient",\n  |\n}');
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("_birthDate");
			expect(l).toContain("_gender");
		});

		it("excludes properties already present in object", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "Patient",\n  "gender": "male",\n  |\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("name");
			expect(l).toContain("birthDate");
			expect(l).not.toContain("gender");
			expect(l).not.toContain("resourceType");
		});

		it("does not offer property completions inside arrays", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "Patient",\n  "name": [\n    |\n  ]\n}',
			);
			const result = await source(cc);
			expect(result).toBe(null);
		});
	});

	describe("property completions with resourceTypeHint", () => {
		const hintSource = jsonCompletionSource(
			mockGetSDs,
			"Patient",
			mockExpandValueSet,
		);

		it("uses hint when resourceType is not in document", async () => {
			const { cc } = completionAt("{\n  |\n}");
			const result = await hintSource(cc);
			const l = labels(result);
			expect(l).toContain("name");
			expect(l).toContain("gender");
		});
	});

	describe("terminology binding completions", () => {
		it("offers gender codes for Patient.gender", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "Patient",\n  "gender": "|\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("male");
			expect(l).toContain("female");
			expect(l).toContain("other");
			expect(l).toContain("unknown");
		});
	});

	describe("boolean value completions", () => {
		it("offers true and false for boolean fields", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "Patient",\n  "active": |\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("true");
			expect(l).toContain("false");
			expect(l).toHaveLength(2);
		});

		it("offers property completions (not booleans) on new line after boolean value", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "Patient",\n  "active": true,\n  |\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).not.toContain("true");
			expect(l).not.toContain("false");
			expect(l).toContain("name");
			expect(l).toContain("gender");
		});
	});

	describe("reference target completions", () => {
		it("offers Organization/ for Patient.managingOrganization.reference", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "Patient",\n  "managingOrganization": {\n    "reference": "|\n  }\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("Organization/");
		});

		it("offers Patient/ and Group/ for Observation.subject.reference", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "Observation",\n  "subject": {\n    "reference": "|\n  }\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("Patient/");
			expect(l).toContain("Group/");
		});
	});

	describe("contained resource completions", () => {
		it("offers resourceType inside contained array item", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "Patient",\n  "contained": [\n    {\n      |\n    }\n  ]\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("resourceType");
		});

		it("offers inner resource fields when contained has resourceType", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "Patient",\n  "contained": [\n    {\n      "resourceType": "Observation",\n      |\n    }\n  ]\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("status");
			expect(l).toContain("code");
			expect(l).toContain("subject");
			// Should NOT contain Patient fields
			expect(l).not.toContain("gender");
			expect(l).not.toContain("birthDate");
		});

		it("offers correct reference targets for contained Observation.subject", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "Patient",\n  "contained": [\n    {\n      "resourceType": "Observation",\n      "subject": {\n        "reference": "|\n      }\n    }\n  ]\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("Patient/");
			expect(l).toContain("Group/");
			// Should NOT contain Organization/ (that's from Patient.managingOrganization)
			expect(l).not.toContain("Organization/");
		});
	});

	describe("Bundle.entry.resource completions", () => {
		it("offers Observation fields inside entry.resource with explicit Bundle resourceType", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "Bundle",\n  "entry": [\n    {\n      "resource": {\n        "resourceType": "Observation",\n        |\n      }\n    }\n  ]\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("status");
			expect(l).toContain("code");
			expect(l).toContain("subject");
			expect(l).not.toContain("type");
		});

		it("offers Observation fields when Bundle resourceType comes from hint (URL)", async () => {
			const hintSource = jsonCompletionSource(
				mockGetSDs,
				"Bundle",
				mockExpandValueSet,
			);
			const { cc } = completionAt(
				'{\n  "entry": [\n    {\n      "resource": {\n        "resourceType": "Observation",\n        |\n      }\n    }\n  ]\n}',
			);
			const result = await hintSource(cc);
			const l = labels(result);
			expect(l).toContain("status");
			expect(l).toContain("code");
			expect(l).toContain("subject");
			expect(l).not.toContain("type");
		});
	});

	describe("nested object completions", () => {
		it("offers HumanName fields inside name array item", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "Patient",\n  "name": [\n    {\n      |\n    }\n  ]\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("family");
			expect(l).toContain("given");
		});

		it("offers Reference fields inside managingOrganization", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "Patient",\n  "managingOrganization": {\n    |\n  }\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("reference");
			expect(l).toContain("display");
		});
	});

	describe("Parameters completions", () => {
		it("offers parameter fields inside parameter array item object", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "Parameters",\n  "parameter": [\n    {\n      |\n    }\n  ]\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("name");
			expect(l).toContain("valueString");
			expect(l).toContain("valueBoolean");
			expect(l).toContain("resource");
			expect(l).toContain("part");
		});

		it("offers slice names for parameter.name from profile", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "Parameters",\n  "meta": {\n    "profile": ["http://health-samurai.io/fhir/core/StructureDefinition/fhir-package-install-parameters"]\n  },\n  "parameter": [\n    {\n      "name": "|\n    }\n  ]\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("package");
			expect(l).toContain("registry");
		});

		it("offers parameter snippets in array-item position from profile", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "Parameters",\n  "meta": {\n    "profile": ["http://health-samurai.io/fhir/core/StructureDefinition/fhir-package-install-parameters"]\n  },\n  "parameter": [\n    |\n  ]\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("package");
			expect(l).toContain("registry");
			expect(l).toContain("parameter");
		});

		it("offers generic parameter template without profile", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "Parameters",\n  "parameter": [\n    |\n  ]\n}',
			);
			const result = await source(cc);
			expect(result).not.toBe(null);
			const l = labels(result);
			expect(l).toContain("parameter");
		});

		it("offers parameter fields for second array item", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "Parameters",\n  "parameter": [\n    {"name": "a", "valueString": "1"},\n    {\n      |\n    }\n  ]\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("name");
			expect(l).toContain("valueString");
			expect(l).not.toContain("parameter");
		});

		it("offers slice names for second array item name value", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "AidboxTopicDestination",\n  "meta": {\n    "profile": ["http://aidbox.app/StructureDefinition/aidboxtopicdestination-kafka-best-effort"]\n  },\n  "parameter": [\n    {"name": "kafkaTopic", "valueString": "1"},\n    {\n      "name": "|\n    }\n  ]\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("bootstrapServers");
			expect(l).toContain("batchSize");
		});

		it("offers part fields via contentReference", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "Parameters",\n  "parameter": [\n    {\n      "name": "result",\n      "part": [\n        {\n          |\n        }\n      ]\n    }\n  ]\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("name");
			expect(l).toContain("valueString");
			expect(l).toContain("part");
		});

		it("offers typed snippet for profile with value[x] constraint", async () => {
			const typedSource = jsonCompletionSource(
				mockGetSDs,
				undefined,
				mockExpandValueSet,
			);
			const { cc } = completionAt(
				'{\n  "resourceType": "Parameters",\n  "meta": {\n    "profile": ["http://example.com/StructureDefinition/typed-params"]\n  },\n  "parameter": [\n    |\n  ]\n}',
			);
			const result = await typedSource(cc);
			const l = labels(result);
			expect(l).toContain("count");
			expect(l).toContain("label");
		});

		it("works for Parameters-derived types (AidboxTopicDestination)", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "AidboxTopicDestination",\n  "meta": {\n    "profile": ["http://aidbox.app/StructureDefinition/aidboxtopicdestination-kafka-best-effort"]\n  },\n  "parameter": [\n    |\n  ]\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("kafkaTopic");
			expect(l).toContain("bootstrapServers");
			expect(l).toContain("batchSize");
		});

		it("offers slice names for derived type parameter.name", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "AidboxTopicDestination",\n  "meta": {\n    "profile": ["http://aidbox.app/StructureDefinition/aidboxtopicdestination-kafka-best-effort"]\n  },\n  "parameter": [\n    {\n      "name": "|\n    }\n  ]\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("kafkaTopic");
			expect(l).toContain("bootstrapServers");
			expect(l).toContain("batchSize");
		});

		it("offers fixed value for profiled field", async () => {
			const { cc } = completionAt(
				'{\n  "resourceType": "AidboxTopicDestination",\n  "meta": {\n    "profile": ["http://aidbox.app/StructureDefinition/aidboxtopicdestination-kafka-best-effort"]\n  },\n  "kind": "|\n}',
			);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("kafka-best-effort");
		});

		it("generic parameter snippet is offered with lowest boost", async () => {
			const doc =
				'{\n  "resourceType": "Parameters",\n  "parameter": [\n    |\n  ]\n}';
			const { cc } = completionAt(doc);
			const result = await source(cc);
			const option = result?.options.find((o) => o.label === "parameter");
			expect(option).toBeDefined();
			expect(option?.boost).toBe(-1);
			expect(option?.info).toBe("Custom parameter");
		});
	});

	describe("HTTP mode", () => {
		it("offers Patient fields in HTTP mode body", async () => {
			const doc =
				'POST /fhir/Patient\nContent-Type: application/json\n\n{\n  "resourceType": "Patient",\n  |\n}';
			const { cc } = completionAt(doc);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("name");
			expect(l).toContain("gender");
		});

		it("offers gender codes in HTTP mode body", async () => {
			const doc =
				'PUT /fhir/Patient/1\n\n{\n  "resourceType": "Patient",\n  "gender": "|\n}';
			const { cc } = completionAt(doc);
			const result = await source(cc);
			const l = labels(result);
			expect(l).toContain("male");
			expect(l).toContain("female");
		});

		it("offers Observation fields inside Bundle entry.resource via hint", async () => {
			const hintSource = jsonCompletionSource(
				mockGetSDs,
				"Bundle",
				mockExpandValueSet,
			);
			const doc =
				'POST /fhir/Bundle\nContent-Type: application/json\n\n{\n  "entry": [\n    {\n      "resource": {\n        "resourceType": "Observation",\n        |\n      }\n    }\n  ]\n}';
			const { cc } = completionAt(doc);
			const result = await hintSource(cc);
			const l = labels(result);
			expect(l).toContain("status");
			expect(l).toContain("code");
			expect(l).toContain("subject");
			expect(l).not.toContain("type");
		});
	});
});

describe("buildParameterSnippet", () => {
	it("inserts valueString by default when no value types", () => {
		const { text, cursorOffset } = buildParameterSnippet("package", [], "    ");
		expect(text).toContain('"name": "package"');
		expect(text).toContain('"valueString": ""');
		// Cursor should be inside the empty valueString quotes
		expect(text[cursorOffset - 1]).toBe('"');
		expect(text[cursorOffset]).toBe('"');
	});

	it("inserts valueString for string-constrained type", () => {
		const { text } = buildParameterSnippet("label", ["string"], "    ");
		expect(text).toContain('"name": "label"');
		expect(text).toContain('"valueString": ""');
	});

	it("inserts valueCode for code-constrained type", () => {
		const { text } = buildParameterSnippet("status", ["code"], "    ");
		expect(text).toContain('"name": "status"');
		expect(text).toContain('"valueCode": ""');
	});

	it("inserts valueInteger for integer-constrained type", () => {
		const { text, cursorOffset } = buildParameterSnippet(
			"count",
			["integer"],
			"    ",
		);
		expect(text).toContain('"name": "count"');
		expect(text).toContain('"valueInteger": ');
		expect(text).not.toContain('"valueString"');
		// Cursor should be after ": "
		expect(text.slice(cursorOffset - 2, cursorOffset)).toBe(": ");
	});

	it("inserts valueBoolean for boolean-constrained type", () => {
		const { text } = buildParameterSnippet("active", ["boolean"], "    ");
		expect(text).toContain('"name": "active"');
		expect(text).toContain('"valueBoolean": ');
	});

	it("inserts complex object for CodeableConcept type", () => {
		const { text } = buildParameterSnippet("code", ["CodeableConcept"], "    ");
		expect(text).toContain('"name": "code"');
		expect(text).toContain('"valueCodeableConcept": {');
		expect(text).toContain("}");
	});

	it("uses correct indentation", () => {
		const { text } = buildParameterSnippet("test", [], "  ");
		const lines = text.split("\n");
		// Line 0: {
		expect(lines[0]).toBe("{");
		// Line 1: inner indent + "name"
		expect(lines[1]).toMatch(/^ {4}"name": "test",$/);
		// Line 2: inner indent + "valueString"
		expect(lines[2]).toMatch(/^ {4}"valueString": ""$/);
		// Line 3: outer indent + }
		expect(lines[3]).toBe("  }");
	});

	it("inserts empty name for generic template with cursor in name", () => {
		const { text, cursorOffset } = buildParameterSnippet("", [], "    ");
		expect(text).toContain('"name": ""');
		expect(text).toContain('"valueString": ""');
		// Cursor should be inside the name quotes (first ""), not valueString
		const nameQuoteIdx = text.indexOf('"name": ""') + '"name": "'.length;
		expect(cursorOffset).toBe(nameQuoteIdx);
	});
});
