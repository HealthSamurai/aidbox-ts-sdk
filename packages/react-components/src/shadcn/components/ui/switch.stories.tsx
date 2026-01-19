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
		<div className="flex flex-col gap-6 p-4">
			<div className="flex flex-col gap-4">
				<h3 className="text-sm font-medium">Regular Size</h3>
				<div className="flex flex-col gap-3">
					<div className="flex items-center space-x-2">
						<Switch id="regular-unchecked" />
						<Label htmlFor="regular-unchecked">Unchecked</Label>
					</div>
					<div className="flex items-center space-x-2">
						<Switch id="regular-checked" defaultChecked />
						<Label htmlFor="regular-checked">Checked</Label>
					</div>
					<div className="flex items-center space-x-2">
						<Switch id="regular-disabled-unchecked" disabled />
						<Label htmlFor="regular-disabled-unchecked">
							Disabled Unchecked
						</Label>
					</div>
					<div className="flex items-center space-x-2">
						<Switch id="regular-disabled-checked" defaultChecked disabled />
						<Label htmlFor="regular-disabled-checked">Disabled Checked</Label>
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-4">
				<h3 className="text-sm font-medium">Small Size</h3>
				<div className="flex flex-col gap-3">
					<div className="flex items-center space-x-2">
						<Switch id="small-unchecked" size="small" />
						<Label htmlFor="small-unchecked">Unchecked</Label>
					</div>
					<div className="flex items-center space-x-2">
						<Switch id="small-checked" size="small" defaultChecked />
						<Label htmlFor="small-checked">Checked</Label>
					</div>
					<div className="flex items-center space-x-2">
						<Switch id="small-disabled-unchecked" size="small" disabled />
						<Label htmlFor="small-disabled-unchecked">Disabled Unchecked</Label>
					</div>
					<div className="flex items-center space-x-2">
						<Switch
							id="small-disabled-checked"
							size="small"
							defaultChecked
							disabled
						/>
						<Label htmlFor="small-disabled-checked">Disabled Checked</Label>
					</div>
				</div>
			</div>
		</div>
	),
} satisfies Story;
