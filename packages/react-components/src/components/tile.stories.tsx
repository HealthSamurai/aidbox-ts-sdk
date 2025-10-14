import type { Meta, StoryObj } from "@storybook/react-vite";
import { Activity, BarChart3, Settings, Users } from "lucide-react";
import { Tile } from "./tile";

const meta: Meta<typeof Tile> = {
	title: "Component/Tile",
	component: Tile,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		size: {
			control: { type: "select" },
			options: ["auto", "free"],
		},
		showIcon: {
			control: { type: "boolean" },
		},
		icon: {
			control: { type: "select" },
			options: ["Activity", "Users", "Settings", "BarChart"],
			mapping: {
				Activity: <Activity />,
				Users: <Users />,
				Settings: <Settings />,
				BarChart: <BarChart3 />,
			},
		},
		width: {
			control: { type: "text" },
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const ActivityIcon = () => <Activity />;
const UsersIcon = () => <Users />;
const SettingsIcon = () => <Settings />;
const BarChartIcon = () => <BarChart3 />;

export const Default: Story = {
	args: {
		label: "Active Apps",
		value: "0",
		icon: <ActivityIcon />,
		showIcon: true,
	},
};

export const WithIcon: Story = {
	args: {
		label: "Active Apps",
		value: "0",
		icon: <ActivityIcon />,
		showIcon: true,
	},
};

export const AutoSize: Story = {
	args: {
		label: "Users",
		value: "1,234",
		icon: <UsersIcon />,
		showIcon: true,
		size: "auto",
	},
};

export const FreeSize: Story = {
	args: {
		label: "Total Revenue",
		value: "$12,345",
		icon: <BarChartIcon />,
		showIcon: true,
		size: "free",
	},
};

export const CustomWidth: Story = {
	args: {
		label: "Settings",
		value: "Configured",
		icon: <SettingsIcon />,
		showIcon: true,
		width: "200px",
	},
};

export const WithoutIcon: Story = {
	args: {
		label: "Simple Tile",
		value: "No Icon",
		showIcon: false,
	},
};

export const OnlyLabel: Story = {
	args: {
		label: "Status",
		showIcon: false,
	},
};

export const OnlyValue: Story = {
	args: {
		value: "42",
		showIcon: false,
	},
};

export const Grid: Story = {
	render: () => (
		<div className="grid grid-cols-3 gap-4 w-full max-w-4xl">
			<Tile
				label="Active Apps"
				value="0"
				icon={<ActivityIcon />}
				showIcon={true}
				size="free"
			/>
			<Tile
				label="Users"
				value="1,234"
				icon={<UsersIcon />}
				showIcon={true}
				size="free"
			/>
			<Tile
				label="Revenue"
				value="$12,345"
				icon={<BarChartIcon />}
				showIcon={true}
				size="free"
			/>
			<Tile
				label="Settings"
				value="Configured"
				icon={<SettingsIcon />}
				showIcon={true}
				size="free"
			/>
			<Tile label="Simple" value="No Icon" showIcon={false} size="free" />
			<Tile label="Status" value="Online" showIcon={false} size="free" />
		</div>
	),
};
