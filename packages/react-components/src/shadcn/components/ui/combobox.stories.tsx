import { Controls, Primary, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Combobox, MultiCombobox } from "./combobox";

const demoOptions = [
	{ value: "next.js", label: "Next.js" },
	{ value: "sveltekit", label: "SvelteKit" },
	{ value: "nuxt.js", label: "Nuxt.js" },
	{ value: "remix", label: "Remix" },
	{ value: "astro", label: "Astro" },
];

interface ComboboxWrapperProps {
	multi?: boolean;
	disabled?: boolean;
}

function ComboboxWrapper({
	multi = false,
	disabled = false,
}: ComboboxWrapperProps) {
	const [value, setValue] = useState("");
	const [multiValue, setMultiValue] = useState<string[]>([]);

	if (multi) {
		return (
			<MultiCombobox
				options={demoOptions}
				value={multiValue}
				onValueChange={setMultiValue}
				placeholder="Select frameworks..."
				searchPlaceholder="Search framework..."
				disabled={disabled}
			/>
		);
	}

	return (
		<Combobox
			options={demoOptions}
			value={value}
			onValueChange={setValue}
			placeholder="Select framework..."
			searchPlaceholder="Search framework..."
			disabled={disabled}
		/>
	);
}

const meta = {
	title: "Component/Combobox",
	component: ComboboxWrapper,
	parameters: {
		layout: "centered",
		docs: {
			page: () => (
				<>
					<Title />
					<p className="sbdocs-p">
						Combobox is a searchable select component. When the dropdown opens,
						it displays a <strong>Command</strong> component for search and
						selection. See the Command component for all available styling
						options.
					</p>
					<Primary />
					<Controls />
				</>
			),
		},
	},
	argTypes: {
		multi: {
			control: "boolean",
		},
		disabled: {
			control: "boolean",
		},
	},
	args: {
		multi: false,
		disabled: false,
	},
} satisfies Meta<typeof ComboboxWrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
	tags: ["!dev"],
	render: ({ multi = false, disabled = false }) => (
		<div className="w-[300px]">
			<ComboboxWrapper multi={multi} disabled={disabled} />
		</div>
	),
} satisfies Story;

export const Demo = {
	tags: ["!autodocs"],
	render: () => {
		const [value, setValue] = useState("");
		const [multiValue, setMultiValue] = useState<string[]>([]);

		return (
			<div className="space-y-8">
				{/* Single */}
				<div>
					<h3 className="typo-label mb-4">Single select</h3>
					<div className="w-[300px]">
						<Combobox
							options={demoOptions}
							value={value}
							onValueChange={setValue}
							placeholder="Select framework..."
							searchPlaceholder="Search framework..."
						/>
					</div>
				</div>

				{/* Multi */}
				<div>
					<h3 className="typo-label mb-4">Multi select</h3>
					<div className="w-[300px]">
						<MultiCombobox
							options={demoOptions}
							value={multiValue}
							onValueChange={setMultiValue}
							placeholder="Select frameworks..."
							searchPlaceholder="Search framework..."
						/>
					</div>
				</div>

				{/* Disabled */}
				<div>
					<h3 className="typo-label mb-4">Disabled</h3>
					<div className="w-[300px]">
						<Combobox
							options={demoOptions}
							placeholder="Select framework..."
							disabled
						/>
					</div>
				</div>
			</div>
		);
	},
} satisfies Story;
