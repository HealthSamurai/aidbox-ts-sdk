import { APIBuilder } from "@atomic-ehr/codegen";

console.log("📦 Generating FHIR R4 Core Types...");

const builder = new APIBuilder()
	.verbose()
	.throwException()
	.fromPackage("hl7.fhir.r4.core", "4.0.1")
	.typescript({ withDebugComment: false, generateProfile: false })
	.outputTo("./src/fhir-types")
	.treeShake({
		"hl7.fhir.r4.core": {
			"http://hl7.org/fhir/StructureDefinition/Patient": {
				ignoreFields: [
					"contact",
					"communication",
					"photo",
					"telecom",
					"address",
					"link",
				],
			},
			"http://hl7.org/fhir/StructureDefinition/Resource": {},
			"http://hl7.org/fhir/StructureDefinition/Bundle": {},
			"http://hl7.org/fhir/StructureDefinition/OperationOutcome": {},
			"http://hl7.org/fhir/StructureDefinition/DomainResource": {
				ignoreFields: ["extension", "modifierExtension"],
			},
			"http://hl7.org/fhir/StructureDefinition/BackboneElement": {
				ignoreFields: ["modifierExtension"],
			},
			"http://hl7.org/fhir/StructureDefinition/Element": {
				ignoreFields: ["extension"],
			},
		},
	})
	.cleanOutput(true);

const report = await builder.generate();

console.log(report);

if (report.success) {
	console.log("✅ FHIR types generated successfully!");
} else {
	console.error("❌ FHIR types generation failed.");
	process.exit(1);
}
