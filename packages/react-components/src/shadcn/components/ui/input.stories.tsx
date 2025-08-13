import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "#shadcn/components/ui/input";

const meta = {
	title: "Component/Input",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => <Input type="email" placeholder="Email" />,
} satisfies Story;
