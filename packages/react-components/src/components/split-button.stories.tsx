import type { StoryObj } from "@storybook/react-vite";
import { ChevronDown, Plus, Save } from "lucide-react";
import { Button } from "#shadcn/components/ui/button.js";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#shadcn/components/ui/dropdown-menu.js";
import { SplitButton } from "./split-button";

const meta = {
	title: "Component/SplitButton",
	component: SplitButton,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		size: {
			control: "select",
			options: ["regular", "small"],
			description: "Size of the split button",
		},
		disabled: {
			control: "boolean",
			description: "Disabled state of the split button",
		},
	},
};

export default meta;

type Story = StoryObj<typeof SplitButton>;

export const Default: Story = {
	args: {
		size: "regular",
		disabled: false,
	},
	render: (args) => (
		<SplitButton {...args}>
			<Button variant="secondary" disabled={args.disabled ?? false}>
				<Save />
				Save
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="secondary" disabled={args.disabled ?? false}>
						<ChevronDown />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuLabel>Save to collection:</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem disabled>No collections</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem>
						<Plus className="text-fg-link" />
						New collection
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</SplitButton>
	),
};
