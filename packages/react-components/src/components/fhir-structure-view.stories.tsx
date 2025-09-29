import type { Meta, StoryObj } from "@storybook/react-vite";
import { type FhirStructure, FhirStructureView } from "./fhir-structure-view";
import type { TreeViewItem } from "./tree-view";

const meta: Meta<typeof FhirStructureView> = {
	title: "Component/FHIRStructureView",
	component: FhirStructureView,
};

export default meta;

type Story = StoryObj<typeof FhirStructureView>;

const tree: Record<string, TreeViewItem<FhirStructure>> = {
	root: {
		name: "Root",
		children: ["Patient"],
	},
	Patient: {
		name: "Patient",
		meta: {
			type: "Resource",
			min: "0",
			max: "*",
			desc: "Information about an individual or animal receiving health care services",
		},
		children: [
			"Patient.id",
			"Patient.meta",
			"Patient.implicitRules",
			"Patient.language",
			"Patient.text",
			"Patient.contained",
			"Patient.extension",
			"Patient.modifierExtension",
			"Patient.identifier",
			"Patient.active",
			"Patient.name",
			"Patient.telecom",
			"Patient.gender",
			"Patient.birthDate",
			"Patient.deceased",
			"Patient.address",
			"Patient.maritalStatus",
			"Patient.multipleBirth",
			"Patient.photo",
			"Patient.contact",
			"Patient.communication",
			"Patient.generalPractitioner",
			"Patient.managingOrganization",
			"Patient.link",
		],
	},
	"Patient.id": {
		name: "id",
		meta: {
			type: "id",
			min: "0",
			max: "1",
			isSummary: true,
			desc: "Logical id of this artifact",
		},
	},
	"Patient.meta": {
		name: "meta",
		meta: {
			type: "Meta",
			min: "0",
			max: "1",
			isSummary: true,
			desc: "Metadata about the resource",
		},
	},
	"Patient.implicitRules": {
		name: "implicitRules",
		meta: {
			type: "uri",
			min: "0",
			max: "1",
			isSummary: true,
			isModifier: true,
			desc: "A set of rules under which this content was created",
		},
	},
	"Patient.language": {
		name: "language",
		meta: {
			type: "code",
			min: "0",
			max: "1",
			desc: "Language of the resource content",
		},
	},
	"Patient.text": {
		name: "text",
		meta: {
			type: "Narrative",
			min: "0",
			max: "1",
			desc: "Text summary of the resource, for human interpretation",
		},
	},
	"Patient.contained": {
		name: "contained",
		meta: {
			type: "Resource",
			min: "0",
			max: "*",
			desc: "Contained, inline Resources",
		},
	},
	"Patient.extension": {
		name: "extension",
		meta: {
			type: "Extension",
			min: "0",
			max: "*",
			desc: "Additional content defined by implementations",
		},
	},
	"Patient.modifierExtension": {
		name: "modifierExtension",
		meta: {
			type: "Extension",
			min: "0",
			max: "*",
			isSummary: true,
			isModifier: true,
			desc: "Extensions that cannot be ignored",
		},
	},
	"Patient.identifier": {
		name: "identifier",
		meta: {
			type: "Identifier",
			min: "0",
			max: "*",
			isSummary: true,
			desc: "An identifier for this patient",
		},
	},
	"Patient.active": {
		name: "active",
		meta: {
			type: "boolean",
			min: "0",
			max: "1",
			isSummary: true,
			isModifier: true,
			desc: "Whether this patient's record is in active use",
		},
	},
	"Patient.name": {
		name: "name",
		meta: {
			type: "HumanName",
			min: "0",
			max: "*",
			isSummary: true,
			desc: "A name associated with the patient",
		},
	},
	"Patient.telecom": {
		name: "telecom",
		meta: {
			type: "ContactPoint",
			min: "0",
			max: "*",
			isSummary: true,
			desc: "A contact detail for the individual",
		},
	},
	"Patient.gender": {
		name: "gender",
		meta: {
			type: "code",
			min: "0",
			max: "1",
			isSummary: true,
			desc: "male | female | other | unknown",
		},
	},
	"Patient.birthDate": {
		name: "birthDate",
		meta: {
			type: "date",
			min: "0",
			max: "1",
			isSummary: true,
			desc: "The date of birth for the individual",
		},
	},
	"Patient.deceased": {
		name: "deceased[x]",
		meta: {
			type: "union",
			min: "0",
			max: "1",
			isSummary: true,
			isModifier: true,
			desc: "Indicates if the individual is deceased or not",
		},
		children: ["Patient.deceasedBoolean", "Patient.deceasedDateTime"],
	},
	"Patient.deceasedBoolean": {
		name: "deceasedBoolean",
		meta: {
			type: "boolean",
		},
	},
	"Patient.deceasedDateTime": {
		name: "deceasedDateTime",
		meta: {
			type: "dateTime",
			lastNode: true,
		},
	},
	"Patient.address": {
		name: "address",
		meta: {
			type: "Address",
			min: "0",
			max: "*",
			isSummary: true,
			desc: "An address for the individual",
		},
	},
	"Patient.maritalStatus": {
		name: "maritalStatus",
		meta: {
			type: "CodeableConcept",
			min: "0",
			max: "1",
			desc: "Marital (civil) status of a patient",
		},
	},
	"Patient.multipleBirth": {
		name: "multipleBirth[x]",
		meta: {
			type: "union",
			min: "0",
			max: "1",
			desc: "Whether patient is part of a multiple birth",
		},
		children: ["Patient.multipleBirthBoolean", "Patient.multipleBirthInteger"],
	},
	"Patient.multipleBirthBoolean": {
		name: "multipleBirthBoolean",
		meta: {
			type: "boolean",
		},
	},
	"Patient.multipleBirthInteger": {
		name: "multipleBirthInteger",
		meta: {
			type: "integer",
			lastNode: true,
		},
	},
	"Patient.photo": {
		name: "photo",
		meta: {
			type: "Attachment",
			min: "0",
			max: "*",
			desc: "Image of the patient",
		},
	},
	"Patient.contact": {
		name: "contact",
		meta: {
			type: "BackboneElement",
			min: "0",
			max: "*",
			desc: "A contact party (e.g. guardian, partner, friend) for the patient",
		},
		children: [
			"Patient.contact.relationship",
			"Patient.contact.name",
			"Patient.contact.telecom",
			"Patient.contact.address",
			"Patient.contact.gender",
			"Patient.contact.organization",
			"Patient.contact.period",
		],
	},
	"Patient.contact.relationship": {
		name: "relationship",
		meta: {
			type: "CodeableConcept",
			min: "0",
			max: "*",
			desc: "The kind of relationship",
		},
	},
	"Patient.contact.name": {
		name: "name",
		meta: {
			type: "HumanName",
			min: "0",
			max: "1",
			desc: "A name associated with the contact person",
		},
	},
	"Patient.contact.telecom": {
		name: "telecom",
		meta: {
			type: "ContactPoint",
			min: "0",
			max: "*",
			desc: "A contact detail for the person",
		},
	},
	"Patient.contact.address": {
		name: "address",
		meta: {
			type: "Address",
			min: "0",
			max: "1",
			desc: "Address for the contact person",
		},
	},
	"Patient.contact.gender": {
		name: "gender",
		meta: {
			type: "code",
			min: "0",
			max: "1",
			desc: "male | female | other | unknown",
		},
	},
	"Patient.contact.organization": {
		name: "organization",
		meta: {
			type: "Reference",
			min: "0",
			max: "1",
			desc: "Organization that is associated with the contact",
		},
	},
	"Patient.contact.period": {
		name: "period",
		meta: {
			type: "Period",
			min: "0",
			max: "1",
			lastNode: true,
			desc: "The period during which this contact person or organization is valid to be contacted relating to this patient",
		},
	},
	"Patient.communication": {
		name: "communication",
		meta: {
			type: "BackboneElement",
			min: "0",
			max: "*",
			desc: "A language which may be used to communicate with the patient about his or her health",
		},
		children: [
			"Patient.communication.language",
			"Patient.communication.preferred",
		],
	},
	"Patient.communication.language": {
		name: "language",
		meta: {
			type: "CodeableConcept",
			min: "1",
			max: "1",
			desc: "The language which can be used to communicate with the patient about his or her health",
		},
	},
	"Patient.communication.preferred": {
		name: "preferred",
		meta: {
			type: "boolean",
			min: "0",
			max: "1",
			lastNode: true,
			desc: "Language preference indicator",
		},
	},
	"Patient.generalPractitioner": {
		name: "generalPractitioner",
		meta: {
			type: "Reference",
			min: "0",
			max: "*",
			desc: "Patient's nominated primary care provider",
		},
	},
	"Patient.managingOrganization": {
		name: "managingOrganization",
		meta: {
			type: "Reference",
			min: "0",
			max: "1",
			isSummary: true,
			desc: "Organization that is the custodian of the patient record",
		},
	},
	"Patient.link": {
		name: "link",
		meta: {
			type: "BackboneElement",
			min: "0",
			max: "*",
			isSummary: true,
			isModifier: true,
			desc: "Link to a Patient or RelatedPerson resource that concerns the same actual individual",
		},
		children: ["Patient.link.other", "Patient.link.type"],
	},
	"Patient.link.other": {
		name: "other",
		meta: {
			type: "Reference",
			min: "1",
			max: "1",
			isSummary: true,
			desc: "The other patient or related person resource that the link refers to",
		},
	},
	"Patient.link.type": {
		name: "type",
		meta: {
			type: "code",
			min: "1",
			max: "1",
			isSummary: true,
			lastNode: true,
			desc: "replaced-by | replaces | refer | seealso",
		},
	},
};

export const Default: Story = {
	render: () => <FhirStructureView tree={tree} />,
};
