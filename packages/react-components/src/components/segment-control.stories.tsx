import type { Meta, StoryObj } from "@storybook/react-vite";

import { SegmentControl, SegmentControlItem } from "./segment-control";

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
	render: () => {
		return (
			<SegmentControl
				defaultValue="yaml"
				onValueChange={(value) => console.log("Selected:", value)}
			>
				<SegmentControlItem value="yaml">YAML</SegmentControlItem>
				<SegmentControlItem value="json">JSON</SegmentControlItem>
			</SegmentControl>
		);
	},
};
