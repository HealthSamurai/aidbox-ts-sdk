import { Controls, Primary, Title } from "@storybook/addon-docs/blocks";
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
		docs: {
			page: () => (
				<>
					<Title />
					<Primary />
					<Controls />
				</>
			),
		},
	},
	argTypes: {
		variant: {
			control: "select",
			options: ["ghost", "link"],
		},
		disabled: {
			control: "boolean",
		},
	},
	args: {
		icon: <Copy />,
		"aria-label": "Copy",
		variant: "ghost",
		disabled: false,
	},
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	tags: ["!dev"],
	render: (args) => <IconButton {...args} />,
};

export const Demo: Story = {
	tags: ["!autodocs"],
	render: () => (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-4">
				<span className="w-16 typo-body text-text-secondary">Ghost:</span>
				<IconButton icon={<Copy />} aria-label="Copy" variant="ghost" />
				<IconButton icon={<Edit />} aria-label="Edit" variant="ghost" />
				<IconButton icon={<Trash2 />} aria-label="Delete" variant="ghost" />
				<IconButton icon={<Download />} aria-label="Download" variant="ghost" />
				<IconButton icon={<Settings />} aria-label="Settings" variant="ghost" />
				<IconButton icon={<AlignLeft />} aria-label="Align" variant="ghost" />
			</div>
			<div className="flex items-center gap-4">
				<span className="w-16 typo-body text-text-secondary">Link:</span>
				<IconButton icon={<Copy />} aria-label="Copy" variant="link" />
				<IconButton icon={<Edit />} aria-label="Edit" variant="link" />
				<IconButton icon={<Trash2 />} aria-label="Delete" variant="link" />
				<IconButton icon={<Download />} aria-label="Download" variant="link" />
				<IconButton icon={<Settings />} aria-label="Settings" variant="link" />
				<IconButton icon={<AlignLeft />} aria-label="Align" variant="link" />
			</div>
			<div className="flex items-center gap-4">
				<span className="w-16 typo-body text-text-secondary">Disabled:</span>
				<IconButton
					icon={<Copy />}
					aria-label="Copy"
					variant="ghost"
					disabled
				/>
				<IconButton icon={<Copy />} aria-label="Copy" variant="link" disabled />
			</div>
		</div>
	),
};
