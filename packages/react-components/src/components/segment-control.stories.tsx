import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { SegmentControl } from "./segment-control";

const meta = {
	title: "Component/SegmentControl",
	component: SegmentControl,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof SegmentControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		value: "yaml",
		onValueChange: () => {},
		items: [
			{ value: "yaml", label: "YAML" },
			{ value: "json", label: "JSON" },
		],
	},
	render: (args) => {
		const [value, setValue] = useState(args.value);

		return (
			<SegmentControl
				value={value}
				onValueChange={setValue}
				items={args.items}
			/>
		);
	},
};
