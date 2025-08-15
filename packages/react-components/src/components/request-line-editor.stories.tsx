import type { Meta, StoryObj } from "@storybook/react-vite";
import { RequestLineEditor } from "./request-line-editor";

const meta: Meta<typeof RequestLineEditor> = {
	title: "Components/Request line editor",
	component: RequestLineEditor,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: { type: "select" },
			options: ["default", "compound"],
			defaultValue: "default",
		},
		size: {
			control: { type: "select" },
			options: ["regular", "small"],
			defaultValue: "regular",
		},
		disabled: {
			control: { type: "boolean" },
			defaultValue: false,
		},
	},
};

export default meta;
type Story = StoryObj<typeof RequestLineEditor>;

function RequestLineEditorWrapper({
	variant = "compound" as const,
	size = "regular" as const,
	disabled = false,
}: {
	variant?: "default" | "compound";
	size?: "regular" | "small";
	disabled?: boolean;
}) {
	return (
		<div className="w-full max-w-md">
			<RequestLineEditor variant={variant} size={size} disabled={disabled} />
		</div>
	);
}

export const Default: Story = {
	args: {
		variant: "compound",
		size: "regular",
		disabled: false,
	},
	render: (args) => <RequestLineEditorWrapper {...args} />,
};

export const DefaultVariant: Story = {
	args: {
		variant: "default",
		size: "regular",
		disabled: false,
	},
	render: (args) => <RequestLineEditorWrapper {...args} />,
};

export const SmallSize: Story = {
	args: {
		variant: "compound",
		size: "small",
		disabled: false,
	},
	render: (args) => <RequestLineEditorWrapper {...args} />,
};

export const Disabled: Story = {
	args: {
		variant: "compound",
		size: "regular",
		disabled: true,
	},
	render: (args) => <RequestLineEditorWrapper {...args} />,
};

// Interactive playground
export const Playground: Story = {
	args: {
		variant: "compound",
		size: "regular",
		disabled: false,
	},
	render: (args) => <RequestLineEditorWrapper {...args} />,
};
