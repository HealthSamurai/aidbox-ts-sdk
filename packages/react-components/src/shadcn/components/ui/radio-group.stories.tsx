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
		<RadioGroup defaultValue="comfortable">
			<div className="flex items-center gap-3">
				<RadioGroupItem value="default" id="r1" />
				<Label htmlFor="r1">Default</Label>
			</div>
			<div className="flex items-center gap-3">
				<RadioGroupItem value="comfortable" id="r2" />
				<Label htmlFor="r2">Comfortable</Label>
			</div>
			<div className="flex items-center gap-3">
				<RadioGroupItem value="compact" id="r3" />
				<Label htmlFor="r3">Compact</Label>
			</div>
		</RadioGroup>
	),
} satisfies Story;
