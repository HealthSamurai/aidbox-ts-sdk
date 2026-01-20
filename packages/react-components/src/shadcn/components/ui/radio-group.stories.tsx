import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup, RadioGroupItem } from "#shadcn/components/ui/radio-group";

const meta = {
	title: "Component/Radio group",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<div className="flex gap-12">
			{/* Regular size */}
			<div className="space-y-6">
				<RadioGroup defaultValue="checked">
					<RadioGroupItem value="default" id="r1" size="regular" />
					<RadioGroupItem value="checked" id="r2" size="regular" />
					<RadioGroupItem value="disabled" id="r3" size="regular" disabled />
				</RadioGroup>
				<RadioGroup defaultValue="disabled-checked">
					<RadioGroupItem
						value="disabled-checked"
						id="r4"
						size="regular"
						disabled
					/>
				</RadioGroup>
			</div>
			{/* Small size */}
			<div className="space-y-6">
				<RadioGroup defaultValue="checked-small">
					<RadioGroupItem value="default-small" id="r1-small" size="small" />
					<RadioGroupItem value="checked-small" id="r2-small" size="small" />
					<RadioGroupItem
						value="disabled-small"
						id="r3-small"
						size="small"
						disabled
					/>
				</RadioGroup>
				<RadioGroup defaultValue="disabled-checked-small">
					<RadioGroupItem
						value="disabled-checked-small"
						id="r4-small"
						size="small"
						disabled
					/>
				</RadioGroup>
			</div>
		</div>
	),
} satisfies Story;
