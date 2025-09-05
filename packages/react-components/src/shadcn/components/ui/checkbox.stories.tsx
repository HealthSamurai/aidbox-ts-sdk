import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "#shadcn/components/ui/checkbox";
import { Label } from "#shadcn/components/ui/label";

const meta = {
	title: "Component/Checkbox",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-3">
				<Checkbox id="terms" />
				<Label htmlFor="terms">Unchecked</Label>
			</div>
			<div className="flex items-center gap-3">
				<Checkbox id="terms-2" defaultChecked />
				<Label htmlFor="terms-2">Checked</Label>
			</div>
			<div className="flex items-center gap-3">
				<Checkbox id="indeterminate" checked="indeterminate" />
				<Label htmlFor="indeterminate">Indeterminate</Label>
			</div>
			<div className="flex items-center gap-3">
				<Checkbox id="disabled" disabled />
				<Label htmlFor="disabled">Disabled unchecked</Label>
			</div>
			<div className="flex items-center gap-3">
				<Checkbox id="disabled-checked" disabled defaultChecked />
				<Label htmlFor="disabled-checked">Disabled checked</Label>
			</div>
			<div className="flex items-center gap-3">
				<Checkbox
					id="disabled-indeterminate"
					disabled
					checked="indeterminate"
				/>
				<Label htmlFor="disabled-indeterminate">Disabled indeterminate</Label>
			</div>
		</div>
	),
} satisfies Story;
