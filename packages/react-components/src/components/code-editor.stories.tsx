import type { Meta, StoryObj } from "@storybook/react-vite";
import { CodeEditor } from "./code-editor";

const meta: Meta<typeof CodeEditor> = {
	title: "Component/Editor",
	component: CodeEditor,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CodeEditor>;

export const Default: Story = {
	args: {
		defaultValue: JSON.stringify(
			{
				resourceType: "Patient",
				meta: { versionId: 10 },
				gender: "male",
				name: [{ family: "Doe", given: ["John"] }],
			},
			null,
			2,
		),
	},
	render: () => (
		<div className="h-[500px] w-[500px]">
			<CodeEditor />
		</div>
	),
};
