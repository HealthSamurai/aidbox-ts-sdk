import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Toolbar } from "./toolbar";

const meta = {
	title: "Component/Toolbar",
	component: Toolbar,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		segmentControlValue: "json",
		onSegmentControlChange: () => {},
		segmentControlItems: [
			{ value: "json", label: "JSON" },
			{ value: "yaml", label: "YAML" },
		],
		showCopy: true,
		showAlignLeft: true,
		showDownload: true,
	},
	render: (args) => {
		const [value, setValue] = useState(args.segmentControlValue || "json");

		return (
			<Toolbar
				{...args}
				segmentControlValue={value}
				onSegmentControlChange={setValue}
			/>
		);
	},
};

export const WithCustomActions: Story = {
	args: {
		segmentControlValue: "json",
		segmentControlItems: [
			{ value: "json", label: "JSON" },
			{ value: "yaml", label: "YAML" },
		],
		showCopy: true,
		showAlignLeft: false,
		showDownload: true,
	},
	render: (args) => {
		const [value, setValue] = useState(args.segmentControlValue || "json");

		return (
			<Toolbar
				{...args}
				segmentControlValue={value}
				onSegmentControlChange={setValue}
			/>
		);
	},
};
