import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "#shadcn/components/ui/label";
import { Textarea } from "#shadcn/components/ui/textarea";

interface TextareaWithLabelProps {
	label?: string;
	description?: string;
	invalid?: boolean;
	disabled?: boolean;
	placeholder?: string;
	focused?: boolean;
}

function TextareaWithLabel({
	label = "Description",
	description = "This is a hint text to help user.",
	invalid = false,
	disabled = false,
	placeholder = "Enter a description...",
	focused = false,
}: TextareaWithLabelProps) {
	const descriptionColor = invalid
		? "text-text-error-primary"
		: disabled
			? "text-text-disabled"
			: "text-text-secondary";

	return (
		<div className="flex w-full">
			<div className="space-y-2 w-full">
				<Label>{label}</Label>
				<Textarea
					placeholder={placeholder}
					invalid={invalid}
					disabled={disabled}
					autoFocus={focused}
				/>
				<p className={`typo-body-xs ${descriptionColor}`}>{description}</p>
			</div>
		</div>
	);
}

const meta = {
	title: "Component/Textarea",
	component: Textarea,
} satisfies Meta<typeof Textarea>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
	args: {
		placeholder: "Enter a description...",
	},
} satisfies Story;

export const Demo = {
	render: () => (
		<div className="p-6 space-y-6">
			{/* Default */}
			<TextareaWithLabel />

			{/* Focused */}
			<TextareaWithLabel focused />

			{/* Disabled */}
			<TextareaWithLabel disabled />

			{/* Error */}
			<TextareaWithLabel invalid />

			{/* Error + Focused */}
			<TextareaWithLabel invalid focused />
		</div>
	),
} satisfies Story;
