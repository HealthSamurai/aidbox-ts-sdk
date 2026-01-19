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

export const Ghost: Story = {
	args: {
		icon: <Copy />,
		"aria-label": "Copy",
		variant: "ghost",
	},
};

export const Link: Story = {
	args: {
		icon: <Copy />,
		"aria-label": "Copy",
		variant: "link",
	},
};

export const Variants: Story = {
	args: {
		icon: <Copy />,
		"aria-label": "Copy",
	},
	render: () => (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-4">
				<span className="w-16 text-sm text-text-secondary">Ghost:</span>
				<IconButton icon={<Copy />} aria-label="Copy" variant="ghost" />
				<IconButton icon={<Edit />} aria-label="Edit" variant="ghost" />
				<IconButton icon={<Trash2 />} aria-label="Delete" variant="ghost" />
			</div>
			<div className="flex items-center gap-4">
				<span className="w-16 text-sm text-text-secondary">Link:</span>
				<IconButton icon={<Copy />} aria-label="Copy" variant="link" />
				<IconButton icon={<Edit />} aria-label="Edit" variant="link" />
				<IconButton icon={<Trash2 />} aria-label="Delete" variant="link" />
			</div>
		</div>
	),
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
