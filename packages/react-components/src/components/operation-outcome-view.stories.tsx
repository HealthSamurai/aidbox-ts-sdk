import type { Meta, StoryObj } from "@storybook/react-vite";
import { OperationOutcomeView } from "./operation-outcome-view";

const meta = {
	title: "Component/OperationOutcomeView",
	component: OperationOutcomeView,
	parameters: {
		layout: "padded",
	},
} satisfies Meta<typeof OperationOutcomeView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		resource: {
			resourceType: "OperationOutcome",
			issue: [
				{
					code: "invalid",
					severity: "error",
					diagnostics: "Unknown key:",
					expression: ['"communication"'],
				},
				{
					code: "invalid",
					severity: "error",
					diagnostics: "Unknown key:",
					expression: ['"address"'],
				},
				{
					code: "invalid",
					severity: "error",
					diagnostics: "Unknown key:",
					expression: ['"temp1"'],
				},
				{
					code: "invalid",
					severity: "error",
					diagnostics: "Unknown key:",
					expression: ['"temp2"'],
				},
			],
		},
	},
};

export const Demo: Story = {
	tags: ["!autodocs"],
	args: Default.args,
	render: () => (
		<div className="flex flex-col gap-6">
			<div>
				<h3 className="typo-h4 mb-2">Errors only</h3>
				<OperationOutcomeView
					resource={{
						resourceType: "OperationOutcome",
						issue: [
							{
								code: "invalid",
								severity: "error",
								diagnostics: "Unknown key:",
								expression: ['"communication"'],
							},
							{
								code: "invalid",
								severity: "error",
								diagnostics: "Unknown key:",
								expression: ['"address"'],
							},
						],
					}}
				/>
			</div>

			<div>
				<h3 className="typo-h4 mb-2">Warnings only</h3>
				<OperationOutcomeView
					resource={{
						resourceType: "OperationOutcome",
						issue: [
							{
								code: "business-rule",
								severity: "warning",
								diagnostics: "Resource has no narrative text",
								expression: ["Patient.text"],
							},
							{
								code: "informational",
								severity: "warning",
								diagnostics: "Best practice violation",
								expression: ["Patient.contact"],
							},
						],
					}}
				/>
			</div>

			<div>
				<h3 className="typo-h4 mb-2">Mixed severities</h3>
				<OperationOutcomeView
					resource={{
						resourceType: "OperationOutcome",
						issue: [
							{
								code: "structure",
								severity: "fatal",
								diagnostics: "Invalid JSON",
							},
							{
								code: "invalid",
								severity: "error",
								diagnostics: "Unknown key:",
								expression: ['"temp1"'],
							},
							{
								code: "invalid",
								severity: "error",
								diagnostics: "Unknown key:",
								expression: ['"temp2"'],
							},
							{
								code: "business-rule",
								severity: "warning",
								diagnostics: "Missing preferred field",
								expression: ["Patient.name.given"],
							},
							{
								code: "informational",
								severity: "information",
								diagnostics: "Validation completed with issues",
							},
						],
					}}
				/>
			</div>

			<div>
				<h3 className="typo-h4 mb-2">Long diagnostics</h3>
				<OperationOutcomeView
					className="max-w-xl"
					resource={{
						resourceType: "OperationOutcome",
						issue: [
							{
								code: "invalid",
								severity: "error",
								diagnostics:
									"Reference target Coverage/cov-8003 does not conform to any of the target profiles: http://example.org/StructureDefinition/vcov|1.0.0. The resource is missing the required element Coverage.beneficiary, and Coverage.status has the value 'draft', which is not in the bound value set.",
								expression: ["ServiceRequest.insurance[0]"],
								details: {
									coding: [
										{
											system:
												"http://aidbox.app/CodeSystem/operation-outcome-type",
											code: "invalid-target-profile",
										},
									],
								},
							},
						],
					}}
				/>
			</div>

			<div>
				<h3 className="typo-h4 mb-2">With multiple expressions</h3>
				<OperationOutcomeView
					resource={{
						resourceType: "OperationOutcome",
						issue: [
							{
								code: "required",
								severity: "error",
								diagnostics: "Missing required element",
								expression: ["Patient.identifier", "Patient.name"],
							},
							{
								code: "value",
								severity: "error",
								diagnostics: "Invalid date format",
								expression: ["Patient.birthDate"],
							},
						],
					}}
				/>
			</div>
		</div>
	),
};
