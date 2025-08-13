import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "#shadcn/components/ui/slider";

const meta = {
	title: "Component/Slider",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<Slider defaultValue={[50]} max={100} step={1} className="w-[60%]" />
	),
} satisfies Story;
