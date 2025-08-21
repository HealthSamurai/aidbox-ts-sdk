import type { Meta, StoryObj } from "@storybook/react-vite";
import { ComboboxDemo } from "./combobox";

const meta = {
	title: "Component/Combobox",
	component: ComboboxDemo,
	argTypes: {},
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
	render: () => (
		<div className="w-[560px]">
			<ComboboxDemo />
		</div>
	),
} satisfies Story;
