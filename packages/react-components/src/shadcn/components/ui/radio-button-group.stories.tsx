import { Controls, Primary, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	RadioButtonGroup,
	type RadioButtonGroupOption,
} from "#shadcn/components/ui/radio-button-group";

const optionsWithDescription: RadioButtonGroupOption[] = [
	{
		value: "option-1",
		label: "First option",
		description: "This is a helpful description for the first option",
	},
	{
		value: "option-2",
		label: "Second option",
		description: "This is a helpful description for the second option",
	},
];

const optionsWithoutDescription: RadioButtonGroupOption[] = [
	{ value: "option-1", label: "First option" },
	{ value: "option-2", label: "Second option" },
];

const threeOptionsWithDescription: RadioButtonGroupOption[] = [
	{
		value: "option-1",
		label: "Basic plan",
		description: "Perfect for individuals and small projects",
	},
	{
		value: "option-2",
		label: "Pro plan",
		description: "Best for growing teams and businesses",
	},
	{
		value: "option-3",
		label: "Enterprise",
		description: "Custom solutions for large organizations",
	},
];

const threeOptionsWithoutDescription: RadioButtonGroupOption[] = [
	{ value: "option-1", label: "Basic plan" },
	{ value: "option-2", label: "Pro plan" },
	{ value: "option-3", label: "Enterprise" },
];

interface RadioButtonGroupWrapperProps {
	variant?: "wrapped" | "unwrapped";
	vertical?: boolean;
	title?: string;
	description?: string;
	disabled?: boolean;
	optionDescription?: boolean;
	defaultValue?: string;
}

function RadioButtonGroupWrapper({
	variant = "wrapped",
	vertical = false,
	title,
	description,
	disabled = false,
	optionDescription = true,
	defaultValue = "option-1",
}: RadioButtonGroupWrapperProps) {
	const options = optionDescription
		? optionsWithDescription
		: optionsWithoutDescription;

	return (
		<RadioButtonGroup
			variant={variant}
			vertical={vertical}
			{...(title && { title })}
			{...(description && { description })}
			disabled={disabled}
			options={options}
			defaultValue={defaultValue}
		/>
	);
}

const meta = {
	title: "Component/Radio Button Group",
	component: RadioButtonGroupWrapper,
	parameters: {
		docs: {
			page: () => (
				<>
					<Title />
					<Primary />
					<Controls />
				</>
			),
		},
	},
	argTypes: {
		variant: {
			control: "select",
			options: ["wrapped", "unwrapped"],
		},
		vertical: {
			control: "boolean",
		},
		disabled: {
			control: "boolean",
		},
		optionDescription: {
			control: "boolean",
		},
		title: {
			control: "text",
		},
		description: {
			control: "text",
		},
	},
	args: {
		variant: "wrapped",
		vertical: false,
		disabled: false,
		optionDescription: true,
		title: "Select an option",
		description: "Choose the option that best fits your needs",
		defaultValue: "option-1",
	},
} satisfies Meta<typeof RadioButtonGroupWrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
	tags: ["!dev"],
	render: (args) => <RadioButtonGroupWrapper {...args} />,
} satisfies Story;

export const Demo = {
	tags: ["!autodocs"],
	render: () => (
		<div className="flex flex-col gap-12 p-6">
			{/* Wrapped Style with Description */}
			<div className="space-y-8">
				<h2 className="text-lg font-semibold text-text-primary">
					Style: Wrapped (with description)
				</h2>

				<div className="space-y-4">
					<h3 className="text-sm text-text-secondary">Horizontal</h3>
					<RadioButtonGroup
						variant="wrapped"
						vertical={false}
						title="Select an option"
						description="Choose the option that best fits your needs"
						options={optionsWithDescription}
						defaultValue="option-1"
					/>
				</div>

				<div className="space-y-4">
					<h3 className="text-sm text-text-secondary">Vertical</h3>
					<RadioButtonGroup
						variant="wrapped"
						vertical={true}
						title="Select a plan"
						description="Choose the plan that best fits your needs"
						options={threeOptionsWithDescription}
						defaultValue="option-1"
					/>
				</div>
			</div>

			{/* Wrapped Style without Description */}
			<div className="space-y-8">
				<h2 className="text-lg font-semibold text-text-primary">
					Style: Wrapped (without description)
				</h2>

				<div className="space-y-4">
					<h3 className="text-sm text-text-secondary">Horizontal</h3>
					<RadioButtonGroup
						variant="wrapped"
						vertical={false}
						title="Select an option"
						options={optionsWithoutDescription}
						defaultValue="option-1"
					/>
				</div>

				<div className="space-y-4">
					<h3 className="text-sm text-text-secondary">Vertical</h3>
					<RadioButtonGroup
						variant="wrapped"
						vertical={true}
						title="Select a plan"
						options={threeOptionsWithoutDescription}
						defaultValue="option-2"
					/>
				</div>
			</div>

			{/* Unwrapped Style */}
			<div className="space-y-8">
				<h2 className="text-lg font-semibold text-text-primary">
					Style: Unwrapped
				</h2>

				<div className="space-y-4">
					<h3 className="text-sm text-text-secondary">Horizontal</h3>
					<RadioButtonGroup
						variant="unwrapped"
						vertical={false}
						title="Select an option"
						options={optionsWithoutDescription}
						defaultValue="option-1"
					/>
				</div>

				<div className="space-y-4">
					<h3 className="text-sm text-text-secondary">Vertical</h3>
					<RadioButtonGroup
						variant="unwrapped"
						vertical={true}
						title="Select a plan"
						options={threeOptionsWithoutDescription}
						defaultValue="option-2"
					/>
				</div>
			</div>

			{/* Disabled */}
			<div className="space-y-8">
				<h2 className="text-lg font-semibold text-text-primary">Disabled</h2>
				<RadioButtonGroup
					variant="wrapped"
					vertical={false}
					title="Disabled group"
					options={optionsWithDescription}
					defaultValue="option-1"
					disabled
				/>
			</div>
		</div>
	),
} satisfies Story;
