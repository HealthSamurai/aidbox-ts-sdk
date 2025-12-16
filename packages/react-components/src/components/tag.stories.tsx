import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tag } from "./tag";

const CheckIcon = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
		<title>Check icon</title>
		<path
			d="M13.5 4.5L6 12L2.5 8.5"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);
const meta: Meta<typeof Tag> = {
	title: "Component/Tag",
	component: Tag,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		type: {
			control: "select",
			options: ["square", "round"],
		},
		color: {
			control: "select",
			options: ["green", "gray", "red", "bright", "blue", "yellow"],
		},
		subtle: {
			control: "boolean",
		},
		showIcon: {
			control: "boolean",
		},
		icon: {
			control: false,
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
	render: () => (
		<div className="flex flex-col gap-6">
			{/* Vivid variants */}
			<div className="flex flex-col gap-2">
				<h3 className="text-sm font-medium">Vivid (Solid)</h3>
				<div className="flex flex-wrap gap-4">
					<Tag type="round" color="red" subtle={false} icon={<CheckIcon />}>
						Tag label
					</Tag>
					<Tag type="round" color="yellow" subtle={false} icon={<CheckIcon />}>
						Tag label
					</Tag>
					<Tag type="round" color="green" subtle={false} icon={<CheckIcon />}>
						Tag label
					</Tag>
					<Tag type="round" color="blue" subtle={false} icon={<CheckIcon />}>
						Tag label
					</Tag>
					<Tag type="round" color="gray" subtle={false} icon={<CheckIcon />}>
						Tag label
					</Tag>
				</div>
			</div>

			{/* Subtle variants */}
			<div className="flex flex-col gap-2">
				<h3 className="text-sm font-medium">Subtle</h3>
				<div className="flex flex-wrap gap-4">
					<Tag type="round" color="red" subtle={true} icon={<CheckIcon />}>
						Tag label
					</Tag>
					<Tag type="round" color="yellow" subtle={true} icon={<CheckIcon />}>
						Tag label
					</Tag>
					<Tag type="round" color="green" subtle={true} icon={<CheckIcon />}>
						Tag label
					</Tag>
					<Tag type="round" color="blue" subtle={true} icon={<CheckIcon />}>
						Tag label
					</Tag>
					<Tag type="round" color="gray" subtle={true} icon={<CheckIcon />}>
						Tag label
					</Tag>
				</div>
			</div>

			{/* Square Vivid variants */}
			<div className="flex flex-col gap-2">
				<h3 className="text-sm font-medium">Square Shape (Vivid)</h3>
				<div className="flex flex-wrap gap-4">
					<Tag type="square" color="red" subtle={false} icon={<CheckIcon />}>
						Tag label
					</Tag>
					<Tag type="square" color="yellow" subtle={false} icon={<CheckIcon />}>
						Tag label
					</Tag>
					<Tag type="square" color="green" subtle={false} icon={<CheckIcon />}>
						Tag label
					</Tag>
					<Tag type="square" color="blue" subtle={false} icon={<CheckIcon />}>
						Tag label
					</Tag>
					<Tag type="square" color="gray" subtle={false} icon={<CheckIcon />}>
						Tag label
					</Tag>
				</div>
			</div>

			{/* Square Subtle variants */}
			<div className="flex flex-col gap-2">
				<h3 className="text-sm font-medium">Square Shape (Subtle)</h3>
				<div className="flex flex-wrap gap-4">
					<Tag type="square" color="red" subtle={true} icon={<CheckIcon />}>
						Tag label
					</Tag>
					<Tag type="square" color="yellow" subtle={true} icon={<CheckIcon />}>
						Tag label
					</Tag>
					<Tag type="square" color="green" subtle={true} icon={<CheckIcon />}>
						Tag label
					</Tag>
					<Tag type="square" color="blue" subtle={true} icon={<CheckIcon />}>
						Tag label
					</Tag>
					<Tag type="square" color="gray" subtle={true} icon={<CheckIcon />}>
						Tag label
					</Tag>
				</div>
			</div>
		</div>
	),
};
