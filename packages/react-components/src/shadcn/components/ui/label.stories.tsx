import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "#shadcn/components/ui/checkbox";
import { Label } from "#shadcn/components/ui/label";

const meta = {
	title: "Component/Label",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<div>
			<div className="flex items-center space-x-2">
				<Checkbox id="terms" />
				<Label htmlFor="terms">Accept terms and conditions</Label>
			</div>
		</div>
	),
} satisfies Story;
