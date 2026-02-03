import { Controls, Primary, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Switch } from "#shadcn/components/ui/switch";

const meta = {
	title: "Component/Switch",
	component: Switch,
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
		size: {
			control: "select",
			options: ["regular", "small"],
		},
		disabled: {
			control: "boolean",
		},
	},
	args: {
		size: "regular",
		disabled: false,
	},
} satisfies Meta<typeof Switch>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
	tags: ["!dev"],
	render: (args) => {
		const [checked, setChecked] = useState(false);
		return <Switch {...args} checked={checked} onCheckedChange={setChecked} />;
	},
} satisfies Story;

export const Demo = {
	tags: ["!autodocs"],
	render: () => (
		<div className="flex gap-12">
			{/* Regular size */}
			<div className="space-y-3">
				<Switch />
				<Switch defaultChecked />
				<Switch disabled />
				<Switch defaultChecked disabled />
			</div>
			{/* Small size */}
			<div className="space-y-3">
				<Switch size="small" />
				<Switch size="small" defaultChecked />
				<Switch size="small" disabled />
				<Switch size="small" defaultChecked disabled />
			</div>
		</div>
	),
} satisfies Story;
