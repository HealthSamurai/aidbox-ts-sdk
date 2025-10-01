import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { ButtonDropdown } from "./button-dropdown";

const meta = {
	title: "Component/ButtonDropdown",
	component: ButtonDropdownDemo,
	argTypes: {},
} satisfies Meta;
export default meta;

// Demo component for Storybook
const demoOptions = [
	{ value: "next.js", label: "Next.js" },
	{ value: "sveltekit", label: "SvelteKit" },
	{ value: "nuxt.js", label: "Nuxt.js" },
	{ value: "remix", label: "Remix" },
	{ value: "astro", label: "Astro" },
];

function ButtonDropdownDemo() {
	const [value, setValue] = React.useState("next.js");

	return (
		<ButtonDropdown
			options={demoOptions}
			selectedValue={value}
			onSelectItem={setValue}
		/>
	);
}

type Story = StoryObj<typeof meta>;

export const Default = {
	render: () => (
		<div className="w-[560px]">
			<ButtonDropdownDemo />
		</div>
	),
} satisfies Story;
