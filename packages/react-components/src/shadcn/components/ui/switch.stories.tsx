import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "#shadcn/components/ui/label";
import { Switch } from "#shadcn/components/ui/switch";

const meta = {
	title: "Component/Switch",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<div className="flex items-center space-x-2">
			<Switch id="airplane-mode" />
			<Label htmlFor="airplane-mode">Airplane Mode</Label>
		</div>
	),
} satisfies Story;
