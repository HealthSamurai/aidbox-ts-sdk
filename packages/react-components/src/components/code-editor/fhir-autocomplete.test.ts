import {
	CompletionContext,
	type CompletionResult,
} from "@codemirror/autocomplete";
import { json } from "@codemirror/lang-json";
import { ensureSyntaxTree, syntaxTree } from "@codemirror/language";
import { EditorState, type TransactionSpec } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	buildParameterSnippet,
	type ExpandValueSet,
	type GetStructureDefinitions,
	jsonCompletionSource,
	validateFhirProperties,
} from "./fhir-autocomplete";
import { walkJsonProperties } from "./json-ast";

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
			{
				path: "Patient.maritalStatus",
				min: 0,
				max: "1",
				type: [{ code: "CodeableConcept" }],
				binding: {
					valueSet: "http://hl7.org/fhir/ValueSet/marital-status",
					strength: "extensible",
				},
			},
			{
				path: "Patient.contact",
				min: 0,
				max: "*",
				type: [{ code: "BackboneElement" }],
			},
			{
				path: "Patient.contact.name",
				min: 0,
				max: "1",
				type: [{ code: "HumanName" }],
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
				binding: {
					valueSet: "http://hl7.org/fhir/ValueSet/observation-codes",
					strength: "example",
				},
			},
			{
				path: "Observation.method",
				min: 0,
				max: "1",
				type: [{ code: "CodeableConcept" }],
				binding: {
					valueSet: "http://hl7.org/fhir/ValueSet/observation-methods",
					strength: "example",
				},
			},
			{
				path: "Observation.interpretation",
				min: 0,
				max: "*",
				type: [{ code: "CodeableConcept" }],
				binding: {
					valueSet: "http://hl7.org/fhir/ValueSet/observation-interpretation",
					strength: "example",
				},
			},
			{
				path: "Observation.effective[x]",
				min: 0,
				max: "1",
				type: [{ code: "dateTime" }, { code: "Timing" }],
			},
			{
				path: "Observation.focus",
				min: 0,
				max: "*",
				type: [
					{
						code: "Reference",
						targetProfile: ["http://hl7.org/fhir/StructureDefinition/Resource"],
					},
				],
			},
			{
				path: "Observation.referenceRange",
				min: 0,
				max: "*",
				type: [{ code: "BackboneElement" }],
			},
			{
				path: "Observation.referenceRange.text",
				min: 0,
				max: "1",
				type: [{ code: "string" }],
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

const NARRATIVE_SD = {
	type: "Narrative",
	url: "http://hl7.org/fhir/StructureDefinition/Narrative",
	differential: {
		element: [
			{ path: "Narrative", min: 0, max: "*" },
			{ path: "Narrative.status", min: 1, max: "1", type: [{ code: "code" }] },
			{ path: "Narrative.div", min: 1, max: "1", type: [{ code: "xhtml" }] },
		],
	},
};

const STRING_SD = {
	type: "string",
	url: "http://hl7.org/fhir/StructureDefinition/string",
	differential: {
		element: [
			{ path: "string", min: 0, max: "*" },
			{
				path: "string.value",
				min: 0,
				max: "1",
				type: [{ code: "http://hl7.org/fhirpath/System.String" }],
			},
		],
	},
};

const CODING_SD = {
	type: "Coding",
	url: "http://hl7.org/fhir/StructureDefinition/Coding",
	differential: {
		element: [
			{ path: "Coding", min: 0, max: "*" },
			{ path: "Coding.system", min: 0, max: "1", type: [{ code: "uri" }] },
			{ path: "Coding.code", min: 0, max: "1", type: [{ code: "code" }] },
			{ path: "Coding.display", min: 0, max: "1", type: [{ code: "string" }] },
		],
	},
};

const CODEABLE_CONCEPT_SD = {
	type: "CodeableConcept",
	url: "http://hl7.org/fhir/StructureDefinition/CodeableConcept",
	differential: {
		element: [
			{ path: "CodeableConcept", min: 0, max: "*" },
			{
				path: "CodeableConcept.coding",
				min: 0,
				max: "*",
				type: [{ code: "Coding" }],
			},
			{
				path: "CodeableConcept.text",
				min: 0,
				max: "1",
				type: [{ code: "string" }],
			},
		],
	},
};

const TIMING_SD = {
	type: "Timing",
	url: "http://hl7.org/fhir/StructureDefinition/Timing",
	differential: {
		element: [
			{ path: "Timing", min: 0, max: "*" },
			{ path: "Timing.repeat", min: 0, max: "1", type: [{ code: "Element" }] },
			{
				path: "Timing.repeat.frequency",
				min: 0,
				max: "1",
				type: [{ code: "positiveInt" }],
			},
		],
	},
};

const ELEMENT_SD = {
	type: "Element",
	url: "http://hl7.org/fhir/StructureDefinition/Element",
	differential: {
		element: [
			{ path: "Element", min: 0, max: "*" },
			{ path: "Element.id", min: 0, max: "1", type: [{ code: "string" }] },
			{
				path: "Element.extension",
				min: 0,
				max: "*",
				type: [{ code: "Extension" }],
			},
		],
	},
};

const EXTENSION_SD = {
	type: "Extension",
	url: "http://hl7.org/fhir/StructureDefinition/Extension",
	differential: {
		element: [
			{ path: "Extension", min: 0, max: "*" },
			{ path: "Extension.url", min: 1, max: "1", type: [{ code: "uri" }] },
			{
				path: "Extension.value[x]",
				min: 0,
				max: "1",
				type: [{ code: "string" }, { code: "code" }, { code: "Coding" }],
			},
		],
	},
};

// Extension constrained through a type-specific path (Extension.valueCode)
const BIRTHSEX_EXTENSION = {
	type: "Extension",
	url: "http://example.com/StructureDefinition/birthsex",
	differential: {
		element: [
			{ path: "Extension", min: 0, max: "1" },
			{
				path: "Extension.url",
				fixedUri: "http://example.com/StructureDefinition/birthsex",
			},
			{
				path: "Extension.valueCode",
				type: [{ code: "code" }],
				binding: {
					valueSet: "http://example.com/ValueSet/birthsex",
					strength: "required",
				},
			},
		],
	},
};

// Complex extension: a sub-extension with a type-specific value path
const RACE_EXTENSION = {
	type: "Extension",
	url: "http://example.com/StructureDefinition/race",
	differential: {
		element: [
			{ path: "Extension", min: 0, max: "1" },
			{
				path: "Extension.extension",
				sliceName: "ombCategory",
				type: [{ code: "Extension" }],
			},
			{ path: "Extension.extension.url", fixedUri: "ombCategory" },
			{
				path: "Extension.extension.valueCoding",
				type: [{ code: "Coding" }],
				binding: {
					valueSet: "http://example.com/ValueSet/omb-race",
					strength: "required",
				},
			},
			{
				path: "Extension.url",
				fixedUri: "http://example.com/StructureDefinition/race",
			},
			{ path: "Extension.value[x]", min: 0, max: "0" },
		],
	},
};

// Profile fixing codes with pattern[x], derived from another profile
const BP_PROFILE = {
	type: "Observation",
	url: "http://example.com/StructureDefinition/bp",
	derivation: "constraint",
	baseDefinition: "http://example.com/StructureDefinition/vitals",
	differential: {
		element: [
			{
				path: "Observation.code",
				patternCodeableConcept: {
					coding: [{ system: "http://loinc.org", code: "85354-9" }],
				},
			},
		],
	},
};

const VITALS_PROFILE = {
	type: "Observation",
	url: "http://example.com/StructureDefinition/vitals",
	derivation: "constraint",
	baseDefinition: "http://hl7.org/fhir/StructureDefinition/Observation",
	differential: {
		element: [{ path: "Observation.status", fixedCode: "final" }],
	},
};

// Two versions of one profile canonical
const VERSIONED_PROFILE_URL =
	"http://example.com/StructureDefinition/versioned";
const VERSIONED_PROFILES = ["1.0.0", "2.0.0"].map((version) => ({
	type: "Patient",
	url: VERSIONED_PROFILE_URL,
	version,
	derivation: "constraint",
	baseDefinition: "http://hl7.org/fhir/StructureDefinition/Patient",
	differential: {
		element: [{ path: "Patient.gender", fixedCode: `v${version}` }],
	},
}));

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
	Narrative: NARRATIVE_SD,
	string: STRING_SD,
	Coding: CODING_SD,
	CodeableConcept: CODEABLE_CONCEPT_SD,
	Timing: TIMING_SD,
	Element: ELEMENT_SD,
	Extension: EXTENSION_SD,
	"http://hl7.org/fhir/StructureDefinition/Narrative": NARRATIVE_SD,
	"http://hl7.org/fhir/StructureDefinition/Coding": CODING_SD,
	"http://hl7.org/fhir/StructureDefinition/CodeableConcept":
		CODEABLE_CONCEPT_SD,
	"http://hl7.org/fhir/StructureDefinition/Timing": TIMING_SD,
	"http://hl7.org/fhir/StructureDefinition/Element": ELEMENT_SD,
	"http://hl7.org/fhir/StructureDefinition/Extension": EXTENSION_SD,
	"http://example.com/StructureDefinition/birthsex": BIRTHSEX_EXTENSION,
	"http://example.com/StructureDefinition/race": RACE_EXTENSION,
	"http://example.com/StructureDefinition/bp": BP_PROFILE,
	"http://example.com/StructureDefinition/vitals": VITALS_PROFILE,
};

// ── Mock getSDs ────────────────────────────────────────────────────────

const mockGetSDs: GetStructureDefinitions = async (params) => {
	if (params.kind === "resource" && params.derivation === "specialization") {
		return RESOURCE_TYPE_LIST as (typeof PATIENT_SD)[];
	}
	if (params.url === VERSIONED_PROFILE_URL) {
		return VERSIONED_PROFILES.filter(
			(sd) => !params.version || sd.version === params.version,
		) as (typeof PATIENT_SD)[];
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

const mockExpandValueSet: ExpandValueSet = async (url, filter) => {
	if (url === "http://hl7.org/fhir/ValueSet/marital-status") {
		return [
			{
				code: "M",
				system: "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
			},
			{
				code: "UNK",
				system: "http://terminology.hl7.org/CodeSystem/v3-NullFlavor",
			},
		];
	}
	if (url === "http://hl7.org/fhir/ValueSet/observation-codes") {
		// A large ValueSet: the unfiltered expansion is cut to a page
		const codes = [{ code: "8480-6" }, { code: "8462-4" }].filter((c) =>
			c.code.includes(filter),
		);
		return { codes, complete: filter !== "" };
	}
	if (url === "http://hl7.org/fhir/ValueSet/observation-methods") {
		return { codes: [{ code: "auscultation" }], complete: true };
	}
	if (url === "http://hl7.org/fhir/ValueSet/observation-interpretation") {
		// A plain list: completeness unknown
		return [{ code: "H" }, { code: "L" }];
	}
	if (url === "http://example.com/ValueSet/birthsex") {
		return [{ code: "M" }, { code: "F" }];
	}
	if (url === "http://example.com/ValueSet/omb-race") {
		return [{ code: "2106-3" }];
	}
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

// Apply an option the way CodeMirror does; returns the document with "|" at
// the cursor
async function applyOption(
	doc: string,
	label: string,
	source = jsonCompletionSource(mockGetSDs, undefined, mockExpandValueSet),
): Promise<string> {
	const { state: initial, cc, pos } = completionAt(doc);
	const result: CompletionResult | null = await source(cc);
	const option = result?.options.find((o) => o.label === label);
	if (!result || !option) throw new Error(`No option ${label}`);
	let state = initial;
	const view = {
		get state() {
			return state;
		},
		defaultLineHeight: 20,
		dispatch(spec: TransactionSpec) {
			state = state.update(spec).state;
		},
	} as unknown as EditorView;
	const to = result.to ?? pos;
	if (typeof option.apply === "function") {
		option.apply(view, option, result.from, to);
	} else {
		view.dispatch({
			changes: { from: result.from, to, insert: option.apply ?? option.label },
		});
	}
	// Follow-up insertions (value[x] after a url) run on a timer
	await new Promise((resolve) => setTimeout(resolve, 30));
	const text = state.doc.toString();
	const head = state.selection.main.head;
	return `${text.slice(0, head)}|${text.slice(head)}`;
}

async function unknownProperties(
	resource: unknown,
	format: "fhir" | "aidbox" = "fhir",
): Promise<string[]> {
	const doc = JSON.stringify(resource, null, 2);
	const state = EditorState.create({ doc, extensions: [json()] });
	const tree =
		ensureSyntaxTree(state, state.doc.length, 5000) ?? syntaxTree(state);
	const { properties } = walkJsonProperties(doc, tree, null);
	const diagnostics = await validateFhirProperties(
		properties,
		mockGetSDs,
		format,
	);
	return diagnostics.map((d) => doc.slice(d.from + 1, d.to - 1));
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

		it("offers new items, not bare properties, inside arrays", async () => {
			const doc = '{\n  "resourceType": "Patient",\n  "name": [\n    |\n  ]\n}';
			const { cc } = completionAt(doc);
			const l = labels(await source(cc));
			expect(l).toContain("family");
			expect(l).not.toContain("_family");
			expect(await applyOption(doc, "family")).toBe(
				'{\n  "resourceType": "Patient",\n  "name": [\n    {\n      "family": "|"\n    }\n  ]\n}',
			);
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

describe("fhir-autocomplete: regressions", () => {
	const source = jsonCompletionSource(
		mockGetSDs,
		undefined,
		mockExpandValueSet,
	);
	const complete = async (doc: string) =>
		labels(await source(completionAt(doc).cc));

	describe("element paths", () => {
		it("resolves a key to the direct child, not a deeper namesake", async () => {
			// Observation.text is the inherited Narrative, not referenceRange.text
			const l = await complete(
				'{\n  "resourceType": "Observation",\n  "text": {\n    |\n  }\n}',
			);
			expect(l).toContain("status");
			expect(l).toContain("div");
		});

		it("follows the extension of a backbone element", async () => {
			const l = await complete(
				'{\n  "resourceType": "Patient",\n  "contact": [\n    {\n      "extension": [\n        {\n          |\n        }\n      ]\n    }\n  ]\n}',
			);
			expect(l).toContain("url");
			expect(l).toContain("valueString");
		});

		it("follows choice types and inline elements (effectiveTiming.repeat)", async () => {
			const l = await complete(
				'{\n  "resourceType": "Observation",\n  "effectiveTiming": {\n    "repeat": {\n      |\n    }\n  }\n}',
			);
			expect(l).toContain("frequency");
		});

		it("offers id and extension inside _primitive", async () => {
			const l = await complete(
				'{\n  "resourceType": "Patient",\n  "_birthDate": {\n    |\n  }\n}',
			);
			expect(l).toEqual(expect.arrayContaining(["id", "extension"]));
		});

		it("does not offer extension at the root of Bundle", async () => {
			const l = await complete('{\n  "resourceType": "Bundle",\n  |\n}');
			expect(l).toContain("entry");
			expect(l).not.toContain("extension");
		});

		it("descends into a contained resource of a Bundle entry", async () => {
			const l = await complete(
				'{\n  "resourceType": "Bundle",\n  "entry": [\n    {\n      "resource": {\n        "resourceType": "Patient",\n        "contained": [\n          {\n            "resourceType": "Observation",\n            |\n          }\n        ]\n      }\n    }\n  ]\n}',
			);
			expect(l).toContain("status");
			expect(l).not.toContain("gender");
		});
	});

	describe("object boundaries", () => {
		it("does not hide keys present in a sibling item", async () => {
			const l = await complete(
				'{\n  "resourceType": "Patient",\n  "name": [\n    {\n      |\n    },\n    {\n      "family": "Smith"\n    }\n  ]\n}',
			);
			expect(l).toContain("family");
		});

		it("does not take resourceType from the next Bundle entry", async () => {
			const l = await complete(
				'{\n  "resourceType": "Bundle",\n  "entry": [\n    {\n      "resource": {\n        |\n      }\n    },\n    {\n      "resource": {\n        "resourceType": "Observation",\n        "status": "final"\n      }\n    }\n  ]\n}',
			);
			expect(l).toContain("resourceType");
			expect(l).not.toContain("status");
		});

		it("completes inside a one-line object", async () => {
			const l = await complete('{"resourceType": "Patient", "name": [{ | }]}');
			expect(l).toContain("family");
		});
	});

	describe("insertion", () => {
		it("adds the comma before the next member", async () => {
			expect(
				await applyOption(
					'{\n  "resourceType": "Patient",\n  |\n  "gender": "male"\n}',
					"birthDate",
				),
			).toBe(
				'{\n  "resourceType": "Patient",\n  "birthDate": "|",\n  "gender": "male"\n}',
			);
		});

		it("adds the comma after a value on the previous line", async () => {
			expect(
				await applyOption(
					'{\n  "resourceType": "Patient",\n  "active": true\n  |\n}',
					"birthDate",
				),
			).toBe(
				'{\n  "resourceType": "Patient",\n  "active": true,\n  "birthDate": "|"\n}',
			);
		});

		it("quotes a value typed without quotes", async () => {
			expect(await applyOption('{\n  "resourceType": |\n}', "Patient")).toBe(
				'{\n  "resourceType": "Patient"|\n}',
			);
		});

		it("reveals the inserted snippet with room around it", async () => {
			const {
				state: initial,
				cc,
				pos,
			} = completionAt('{\n  "resourceType": "Patient",\n  |\n}');
			const result = await source(cc);
			const option = result?.options.find((o) => o.label === "name");
			let state = initial;
			let target: {
				range: { from: number; to: number };
				yMargin: number;
			} | null = null;
			const view = {
				get state() {
					return state;
				},
				defaultLineHeight: 20,
				dispatch(spec: TransactionSpec) {
					const tr = state.update(spec);
					state = tr.state;
					target = tr.effects[0]?.value ?? target;
				},
			} as unknown as EditorView;
			if (typeof option?.apply !== "function") throw new Error("No apply");
			option.apply(view, option, result?.from ?? pos, result?.to ?? pos);
			// Three lines of room around the whole snippet, up to its closing "]"
			expect(target?.yMargin).toBe(60);
			const doc = state.doc.toString();
			expect(doc.slice(0, target?.range.to)).toMatch(/\n {4}\}\n {2}\]$/);
		});

		it("wraps a member chosen in an empty body into an object", async () => {
			const head =
				"GET /\nContent-Type: application/json\nAccept: application/fhir+json\n\n";
			expect(await applyOption(`${head}"|"`, "id")).toBe(
				`${head}{\n  "id": "|"\n}`,
			);
			expect(await applyOption(`${head}re|`, "resourceType")).toBe(
				`${head}{\n  "resourceType": "|"\n}`,
			);
		});

		it("inserts _primitive as an object", async () => {
			expect(
				await applyOption(
					'{\n  "resourceType": "Patient",\n  "birthDate": "1970",\n  |\n}',
					"_birthDate",
				),
			).toBe(
				'{\n  "resourceType": "Patient",\n  "birthDate": "1970",\n  "_birthDate": {\n    |\n  }\n}',
			);
		});

		it("separates a new array item from the previous one", async () => {
			expect(
				await applyOption(
					'{\n  "resourceType": "Patient",\n  "name": [\n    {"family": "A"}\n    |\n  ]\n}',
					"family",
				),
			).toBe(
				'{\n  "resourceType": "Patient",\n  "name": [\n    {"family": "A"},\n    {\n      "family": "|"\n    }\n  ]\n}',
			);
		});

		it("starts a contained resource with its resourceType", async () => {
			expect(
				await applyOption(
					'{\n  "resourceType": "Patient",\n  "contained": [\n    |\n  ]\n}',
					"resourceType",
				),
			).toBe(
				'{\n  "resourceType": "Patient",\n  "contained": [\n    {\n      "resourceType": "|"\n    }\n  ]\n}',
			);
		});
	});

	describe("extensions", () => {
		it("binds a type-specific extension value (Extension.valueCode)", async () => {
			const l = await complete(
				'{\n  "resourceType": "Patient",\n  "extension": [\n    {\n      "url": "http://example.com/StructureDefinition/birthsex",\n      "valueCode": "|"\n    }\n  ]\n}',
			);
			expect(l).toEqual(["M", "F"]);
		});

		it("binds the value of a sub-extension", async () => {
			const l = await complete(
				'{\n  "resourceType": "Patient",\n  "extension": [\n    {\n      "url": "http://example.com/StructureDefinition/race",\n      "extension": [\n        {\n          "url": "ombCategory",\n          "valueCoding": {\n            "code": "|"\n          }\n        }\n      ]\n    }\n  ]\n}',
			);
			expect(l).toEqual(["2106-3"]);
		});

		it("adds the value member after choosing a sub-extension", async () => {
			expect(
				await applyOption(
					'{\n  "resourceType": "Patient",\n  "extension": [\n    {\n      "url": "http://example.com/StructureDefinition/race",\n      "extension": [\n        {\n          "url": "omb|"\n        }\n      ]\n    }\n  ]\n}',
					"ombCategory",
				),
			).toBe(
				'{\n  "resourceType": "Patient",\n  "extension": [\n    {\n      "url": "http://example.com/StructureDefinition/race",\n      "extension": [\n        {\n          "url": "ombCategory",\n          "valueCoding": {\n            |\n          }\n        }\n      ]\n    }\n  ]\n}',
			);
		});
	});

	describe("values", () => {
		it("offers all resource types for Reference(Any)", async () => {
			const l = await complete(
				'{\n  "resourceType": "Observation",\n  "focus": [\n    {\n      "reference": "|"\n    }\n  ]\n}',
			);
			expect(l).toContain("Patient/");
			expect(l).toContain("Organization/");
			expect(l).not.toContain("Resource/");
		});

		it("lists the codes of a small example ValueSet without typing", async () => {
			const doc = (member: string) =>
				`{\n  "resourceType": "Observation",\n  "${member}": {\n    "coding": [{"code": "|"}]\n  }\n}`;
			expect(await complete(doc("method"))).toEqual(["auscultation"]);
			expect(await complete(doc("interpretation"))).toEqual(["H", "L"]);
		});

		it("searches a large example ValueSet only after typing", async () => {
			const doc = (code: string) =>
				`{\n  "resourceType": "Observation",\n  "code": {\n    "coding": [\n      {\n        "code": "${code}|"\n      }\n    ]\n  }\n}`;
			expect(await complete(doc(""))).toEqual([]);
			expect(await complete(doc("8480"))).toEqual(["8480-6"]);
		});

		it("offers the code systems of the binding for Coding.system", async () => {
			const l = await complete(
				'{\n  "resourceType": "Patient",\n  "maritalStatus": {\n    "coding": [\n      {\n        "system": "|"\n      }\n    ]\n  }\n}',
			);
			expect(l).toEqual([
				"http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
				"http://terminology.hl7.org/CodeSystem/v3-NullFlavor",
			]);
		});

		it("offers values fixed by pattern[x] of a profile and of its base", async () => {
			const doc = (member: string) =>
				`{\n  "resourceType": "Observation",\n  "meta": {"profile": ["http://example.com/StructureDefinition/bp"]},\n${member}\n}`;
			expect(
				await complete(doc('  "code": {"coding": [{"system": "|"}]}')),
			).toEqual(["http://loinc.org"]);
			expect(
				await complete(doc('  "code": {"coding": [{"code": "|"}]}')),
			).toEqual(["85354-9"]);
			expect(await complete(doc('  "status": "|"'))).toEqual(["final"]);
		});

		it("uses the requested profile version, else the latest one", async () => {
			const run = async (profile: string) => {
				const doc = `{\n  "resourceType": "Patient",\n  "meta": {"profile": ["${profile}"]},\n  "gender": "‸"\n}`;
				return labels(await source(completionAt(doc, "‸").cc));
			};
			expect(await run(VERSIONED_PROFILE_URL)).toEqual(["v2.0.0"]);
			expect(await run(`${VERSIONED_PROFILE_URL}|1.0.0`)).toEqual(["v1.0.0"]);
		});
	});

	describe("arrays", () => {
		it("offers profile slices for a parameter after a filled one", async () => {
			const l = await complete(
				'{\n  "resourceType": "AidboxTopicDestination",\n  "meta": {\n    "profile": ["http://aidbox.app/StructureDefinition/aidboxtopicdestination-kafka-best-effort"]\n  },\n  "parameter": [\n    {"name": "kafkaTopic", "valueString": "t"},\n    |\n  ]\n}',
			);
			expect(l).toContain("bootstrapServers");
		});
	});

	describe("validation", () => {
		it("accepts an inherited Narrative when a nested element shares its name", async () => {
			expect(
				await unknownProperties({
					resourceType: "Observation",
					status: "final",
					code: { text: "x" },
					text: { status: "generated", div: "<div/>" },
				}),
			).toEqual([]);
		});

		it("reports unknown properties inside extensions of backbone elements", async () => {
			expect(
				await unknownProperties({
					resourceType: "Patient",
					contact: [
						{ extension: [{ url: "http://e/x", valueString: "y", bogus: 1 }] },
					],
				}),
			).toEqual(["bogus"]);
		});

		it("reports extension at the root of Bundle", async () => {
			expect(
				await unknownProperties({
					resourceType: "Bundle",
					type: "collection",
					extension: [],
				}),
			).toEqual(["extension"]);
		});
	});

	describe("lookup failures", () => {
		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("retries a failed definition lookup once it expires", async () => {
			let online = false;
			// Like useGetStructureDefinitions: a failed request yields []
			const flaky: GetStructureDefinitions = async (params) => {
				if (!online) return [];
				return mockGetSDs(
					params.type === "FlakyPatient"
						? { ...params, type: "Patient" }
						: params,
				);
			};
			const flakySource = jsonCompletionSource(flaky);
			const { cc } = completionAt(
				'{\n  "resourceType": "FlakyPatient",\n  |\n}',
			);
			expect(await flakySource(cc)).toBe(null);
			online = true;
			expect(await flakySource(cc)).toBe(null);
			const now = Date.now();
			vi.spyOn(Date, "now").mockReturnValue(now + 31_000);
			expect(labels(await flakySource(cc))).toContain("gender");
		});
	});
});

describe("fhir-autocomplete: Aidbox format", () => {
	const aidbox = jsonCompletionSource(
		mockGetSDs,
		undefined,
		mockExpandValueSet,
		"aidbox",
	);
	const complete = async (doc: string, source = aidbox) =>
		labels(await source(completionAt(doc).cc));

	it("offers a polymorphic element by its own name", async () => {
		const l = await complete('{\n  "resourceType": "Observation",\n  |\n}');
		expect(l).toContain("effective");
		expect(l).not.toContain("effectiveDateTime");
	});

	it("offers the types of a polymorphic value", async () => {
		const l = await complete(
			'{\n  "resourceType": "Observation",\n  "effective": {\n    |\n  }\n}',
		);
		expect(l).toEqual(["dateTime", "Timing"]);
	});

	it("follows a polymorphic value into its type", async () => {
		const l = await complete(
			'{\n  "resourceType": "Observation",\n  "effective": {\n    "Timing": {\n      "repeat": {\n        |\n      }\n    }\n  }\n}',
		);
		expect(l).toContain("frequency");
	});

	it("offers the keys of an Aidbox reference", async () => {
		const l = await complete(
			'{\n  "resourceType": "Observation",\n  "subject": {\n    |\n  }\n}',
		);
		expect(l).toEqual(
			expect.arrayContaining(["resourceType", "id", "display"]),
		);
		expect(l).not.toContain("reference");
	});

	it("offers the reference targets as its resourceType", async () => {
		const l = await complete(
			'{\n  "resourceType": "Observation",\n  "subject": {\n    "resourceType": "|"\n  }\n}',
		);
		expect(l).toEqual(["Patient", "Group"]);
	});

	it("starts a reference with its resourceType", async () => {
		expect(
			await applyOption(
				'{\n  "resourceType": "Observation",\n  |\n}',
				"subject",
				aidbox,
			),
		).toBe(
			'{\n  "resourceType": "Observation",\n  "subject": {\n    "resourceType": "|"\n  }\n}',
		);
	});

	it("inserts a polymorphic element as an object", async () => {
		expect(
			await applyOption(
				'{\n  "resourceType": "Observation",\n  |\n}',
				"effective",
				aidbox,
			),
		).toBe(
			'{\n  "resourceType": "Observation",\n  "effective": {\n    |\n  }\n}',
		);
	});

	it("binds the typed value of an extension", async () => {
		const l = await complete(
			'{\n  "resourceType": "Patient",\n  "extension": [\n    {\n      "url": "http://example.com/StructureDefinition/birthsex",\n      "value": {\n        "code": "|"\n      }\n    }\n  ]\n}',
		);
		expect(l).toEqual(["M", "F"]);
	});

	it("adds the typed value after choosing a sub-extension", async () => {
		expect(
			await applyOption(
				'{\n  "resourceType": "Patient",\n  "extension": [\n    {\n      "url": "http://example.com/StructureDefinition/race",\n      "extension": [\n        {\n          "url": "omb|"\n        }\n      ]\n    }\n  ]\n}',
				"ombCategory",
				aidbox,
			),
		).toBe(
			'{\n  "resourceType": "Patient",\n  "extension": [\n    {\n      "url": "http://example.com/StructureDefinition/race",\n      "extension": [\n        {\n          "url": "ombCategory",\n          "value": {\n            "Coding": {\n              |\n            }\n          }\n        }\n      ]\n    }\n  ]\n}',
		);
	});

	it("tells the format by the request path", async () => {
		const fhir = jsonCompletionSource(
			mockGetSDs,
			undefined,
			mockExpandValueSet,
		);
		const body = '{\n  "resourceType": "Observation",\n  |\n}';
		expect(await complete(`POST /Observation\n\n${body}`, fhir)).toContain(
			"effective",
		);
		expect(
			await complete(`POST /fhir/Observation\n\n${body}`, aidbox),
		).toContain("effectiveDateTime");
	});

	it("accepts Aidbox references and polymorphic values", async () => {
		const resource = {
			resourceType: "Observation",
			status: "final",
			code: { text: "x" },
			effective: { dateTime: "2020" },
			subject: { resourceType: "Patient", id: "p1", display: "P" },
		};
		expect(await unknownProperties(resource, "aidbox")).toEqual([]);
		// FHIR JSON has no such keys
		expect(await unknownProperties(resource)).toEqual([
			"effective",
			"resourceType",
		]);
	});

	it("accepts FHIR keys in the Aidbox format", async () => {
		expect(
			await unknownProperties(
				{
					resourceType: "Observation",
					status: "final",
					code: { text: "x" },
					effectiveDateTime: "2020",
					subject: { reference: "Patient/p1" },
				},
				"aidbox",
			),
		).toEqual([]);
	});

	it("reports a type a polymorphic value does not allow", async () => {
		expect(
			await unknownProperties(
				{
					resourceType: "Observation",
					status: "final",
					code: { text: "x" },
					effective: { Quantity: {} },
				},
				"aidbox",
			),
		).toEqual(["Quantity"]);
	});
});
