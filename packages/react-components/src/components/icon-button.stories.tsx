import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	AlignLeft,
	Copy,
	Download,
	Edit,
	Settings,
	Trash2,
} from "lucide-react";
import { IconButton } from "./icon-button";

const meta = {
	title: "Component/IconButton",
	component: IconButton,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		icon: <Copy />,
		"aria-label": "Copy",
	},
};

export const WithDifferentIcons: Story = {
	args: {
		icon: <Copy />,
		"aria-label": "Copy",
	},
	render: () => (
		<div className="flex items-center gap-2">
			<IconButton icon={<Copy />} aria-label="Copy" />
			<IconButton icon={<AlignLeft />} aria-label="Align left" />
			<IconButton icon={<Download />} aria-label="Download" />
			<IconButton icon={<Settings />} aria-label="Settings" />
			<IconButton icon={<Edit />} aria-label="Edit" />
			<IconButton icon={<Trash2 />} aria-label="Delete" />
		</div>
	),
};

export const WithClickHandler: Story = {
	args: {
		icon: <Copy />,
		"aria-label": "Copy",
		onClick: () => {},
	},
};
