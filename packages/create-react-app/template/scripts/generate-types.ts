import { APIBuilder } from "@atomic-ehr/codegen";

console.log("Generating FHIR R5 types...");

const builder = new APIBuilder()
	.throwException()
	.fromPackage("hl7.fhir.r5.core", "5.0.0")
	.typescript({
		withDebugComment: false,
		generateProfile: false,
		openResourceTypeSet: true,
	})
	.outputTo("./src/fhir-types")
	.cleanOutput(true);

const report = await builder.generate();

if (report.success) {
	console.log("FHIR types generated successfully!");
} else {
	console.error("FHIR types generation failed.");
	process.exit(1);
}
