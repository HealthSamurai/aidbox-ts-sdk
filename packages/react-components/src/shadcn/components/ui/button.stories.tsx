import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "#shadcn/components/ui/button";

const meta = {
	title: "Component/Button",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<div className="flex flex-wrap items-center gap-2 md:flex-row">
			<Button>Button</Button>
		</div>
	),
} satisfies Story;
