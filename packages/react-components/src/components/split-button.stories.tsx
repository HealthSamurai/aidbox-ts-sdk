import type { Meta, StoryObj } from "@storybook/react-vite";
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

const meta: Meta<typeof SplitButton> = {
	title: "Component/SplitButton",
	component: SplitButton,
};

export default meta;

type Story = StoryObj<typeof SplitButton>;

export const Default: Story = {
	render: () => (
		<SplitButton>
			<Button variant="secondary">
				<Save />
				Save
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="secondary">
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
