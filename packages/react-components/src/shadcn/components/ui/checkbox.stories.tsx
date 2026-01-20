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
		<div className="flex gap-12">
			{/* Regular size */}
			<div className="flex flex-col gap-6">
				<div className="flex items-center gap-3">
					<Checkbox id="terms" size="regular" />
					<Label htmlFor="terms">Unchecked</Label>
				</div>
				<div className="flex items-center gap-3">
					<Checkbox id="terms-2" size="regular" defaultChecked />
					<Label htmlFor="terms-2">Checked</Label>
				</div>
				<div className="flex items-center gap-3">
					<Checkbox id="indeterminate" size="regular" checked="indeterminate" />
					<Label htmlFor="indeterminate">Indeterminate</Label>
				</div>
				<div className="flex items-center gap-3">
					<Checkbox id="disabled" size="regular" disabled />
					<Label htmlFor="disabled">Disabled unchecked</Label>
				</div>
				<div className="flex items-center gap-3">
					<Checkbox
						id="disabled-checked"
						size="regular"
						disabled
						defaultChecked
					/>
					<Label htmlFor="disabled-checked">Disabled checked</Label>
				</div>
				<div className="flex items-center gap-3">
					<Checkbox
						id="disabled-indeterminate"
						size="regular"
						disabled
						checked="indeterminate"
					/>
					<Label htmlFor="disabled-indeterminate">Disabled indeterminate</Label>
				</div>
			</div>
			{/* Small size */}
			<div className="flex flex-col gap-6">
				<div className="flex items-center gap-3">
					<Checkbox id="terms-small" size="small" />
					<Label htmlFor="terms-small">Unchecked</Label>
				</div>
				<div className="flex items-center gap-3">
					<Checkbox id="terms-2-small" size="small" defaultChecked />
					<Label htmlFor="terms-2-small">Checked</Label>
				</div>
				<div className="flex items-center gap-3">
					<Checkbox
						id="indeterminate-small"
						size="small"
						checked="indeterminate"
					/>
					<Label htmlFor="indeterminate-small">Indeterminate</Label>
				</div>
				<div className="flex items-center gap-3">
					<Checkbox id="disabled-small" size="small" disabled />
					<Label htmlFor="disabled-small">Disabled unchecked</Label>
				</div>
				<div className="flex items-center gap-3">
					<Checkbox
						id="disabled-checked-small"
						size="small"
						disabled
						defaultChecked
					/>
					<Label htmlFor="disabled-checked-small">Disabled checked</Label>
				</div>
				<div className="flex items-center gap-3">
					<Checkbox
						id="disabled-indeterminate-small"
						size="small"
						disabled
						checked="indeterminate"
					/>
					<Label htmlFor="disabled-indeterminate-small">
						Disabled indeterminate
					</Label>
				</div>
			</div>
		</div>
	),
} satisfies Story;
