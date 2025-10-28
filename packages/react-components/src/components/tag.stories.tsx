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

const XIcon = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
		<title>Close icon</title>
		<path
			d="M12 4L4 12M4 4L12 12"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

const InfoIcon = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
		<title>Info icon</title>
		<path
			d="M8 12V8M8 4H8.01"
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

export const Default: Story = {
	args: {
		children: "authorization_code",
		type: "round",
		color: "green",
		subtle: false,
		icon: <CheckIcon />,
	},
};

export const Square: Story = {
	args: {
		children: "authorization_code",
		type: "square",
		color: "green",
		subtle: false,
		icon: <CheckIcon />,
	},
};

export const Subtle: Story = {
	args: {
		children: "encounter",
		type: "round",
		color: "green",
		subtle: true,
		icon: <CheckIcon />,
	},
};

export const GreenSolid: Story = {
	args: {
		children: "authorization_code",
		type: "round",
		color: "green",
		subtle: false,
		icon: <CheckIcon />,
	},
};

export const GreenSubtle: Story = {
	args: {
		children: "encounter",
		type: "round",
		color: "green",
		subtle: true,
		icon: <CheckIcon />,
	},
};

export const BlueSolid: Story = {
	args: {
		children: "offline_access",
		type: "round",
		color: "blue",
		subtle: false,
		icon: <CheckIcon />,
	},
};

export const RedSubtle: Story = {
	args: {
		children: "Missing",
		type: "round",
		color: "red",
		subtle: true,
		icon: <XIcon />,
	},
};

export const GraySolid: Story = {
	args: {
		children: "offline_access",
		type: "round",
		color: "gray",
		subtle: false,
		icon: <CheckIcon />,
	},
};

export const BrightSubtle: Story = {
	args: {
		children: "offline_access",
		type: "round",
		color: "bright",
		subtle: true,
		icon: <InfoIcon />,
	},
};

export const WithoutIcon: Story = {
	args: {
		children: "authorization_code",
		type: "round",
		color: "green",
		subtle: false,
		showIcon: false,
	},
};

export const IconToggle: Story = {
	args: {
		children: "encounter",
		type: "round",
		color: "green",
		subtle: true,
		icon: <CheckIcon />,
		showIcon: true,
	},
};

export const AllVariants: Story = {
	render: () => (
		<div className="flex flex-wrap gap-4">
			<Tag type="round" color="green" subtle={false} icon={<CheckIcon />}>
				authorization_code
			</Tag>
			<Tag type="round" color="green" subtle={true} icon={<CheckIcon />}>
				encounter
			</Tag>
			<Tag type="round" color="blue" subtle={false} icon={<CheckIcon />}>
				offline_access
			</Tag>
			<Tag type="round" color="red" subtle={true} icon={<XIcon />}>
				Missing
			</Tag>
			<Tag type="round" color="gray" subtle={false} icon={<CheckIcon />}>
				offline_access
			</Tag>
			<Tag type="round" color="bright" subtle={true} icon={<InfoIcon />}>
				offline_access
			</Tag>
			<Tag type="round" color="yellow" subtle={false} icon={<CheckIcon />}>
				Missing
			</Tag>
			<Tag type="round" color="yellow" subtle={true} icon={<CheckIcon />}>
				offline_access
			</Tag>
			<Tag type="square" color="green" subtle={false} icon={<CheckIcon />}>
				authorization_code
			</Tag>
			<Tag type="square" color="green" subtle={true} icon={<CheckIcon />}>
				authorization_code
			</Tag>
			<Tag type="square" color="blue" subtle={false} icon={<CheckIcon />}>
				offline_access
			</Tag>
			<Tag type="square" color="red" subtle={true} icon={<XIcon />}>
				Missing
			</Tag>
			<Tag type="square" color="gray" subtle={false} icon={<CheckIcon />}>
				offline_access
			</Tag>
			<Tag type="square" color="bright" subtle={true} icon={<InfoIcon />}>
				offline_access
			</Tag>
			<Tag type="square" color="yellow" subtle={false} icon={<CheckIcon />}>
				Missing
			</Tag>
			<Tag type="square" color="yellow" subtle={true} icon={<CheckIcon />}>
				offline_access
			</Tag>
		</div>
	),
};
