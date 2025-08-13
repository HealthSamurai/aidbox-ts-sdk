import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold } from "lucide-react";
import { Toggle } from "#shadcn/components/ui/toggle";

const meta = {
	title: "Component/Toggle",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<Toggle aria-label="Toggle italic">
			<Bold className="h-4 w-4" />
		</Toggle>
	),
} satisfies Story;
