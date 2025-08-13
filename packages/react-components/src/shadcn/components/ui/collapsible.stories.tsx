import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { Button } from "#shadcn/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#shadcn/components/ui/collapsible";

const meta = {
	title: "Component/Collapsible",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => {
		const [isOpen, setIsOpen] = React.useState(false);

		return (
			<Collapsible
				open={isOpen}
				onOpenChange={setIsOpen}
				className="flex w-[350px] flex-col gap-2"
			>
				<div className="flex items-center justify-between gap-4 px-4">
					<h4 className="text-sm font-semibold">
						@peduarte starred 3 repositories
					</h4>
					<CollapsibleTrigger asChild>
						<Button variant="ghost" size="small" className="size-8">
							<ChevronsUpDown />
							<span className="sr-only">Toggle</span>
						</Button>
					</CollapsibleTrigger>
				</div>
				<div className="rounded-md border px-4 py-2 font-mono text-sm">
					@radix-ui/primitives
				</div>
				<CollapsibleContent className="flex flex-col gap-2">
					<div className="rounded-md border px-4 py-2 font-mono text-sm">
						@radix-ui/colors
					</div>
					<div className="rounded-md border px-4 py-2 font-mono text-sm">
						@stitches/react
					</div>
				</CollapsibleContent>
			</Collapsible>
		);
	},
} satisfies Story;
