import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "#shadcn/components/ui/textarea";

const meta = {
	title: "Component/Textarea",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => <Textarea placeholder="Type your message here." />,
} satisfies Story;
