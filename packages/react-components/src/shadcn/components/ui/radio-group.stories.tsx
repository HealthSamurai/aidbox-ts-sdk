import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "#shadcn/components/ui/label";
import { RadioGroup, RadioGroupItem } from "#shadcn/components/ui/radio-group";

const meta = {
	title: "Component/Radio group",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<div className="space-y-6">
			<RadioGroup defaultValue="checked">
				<div className="flex items-center gap-3">
					<RadioGroupItem value="default" id="r1" />
					<Label htmlFor="r1">Default</Label>
				</div>
				<div className="flex items-center gap-3">
					<RadioGroupItem value="checked" id="r2" />
					<Label htmlFor="r2">Checked</Label>
				</div>
				<div className="flex items-center gap-3">
					<RadioGroupItem value="disabled" id="r3" disabled />
					<Label htmlFor="r3">Disabled</Label>
				</div>
			</RadioGroup>
			<RadioGroup defaultValue="disabled-checked">
				<div className="flex items-center gap-3">
					<RadioGroupItem value="disabled-checked" id="r4" disabled />
					<Label htmlFor="r4">Disabled Checked</Label>
				</div>
			</RadioGroup>
		</div>
	),
} satisfies Story;
