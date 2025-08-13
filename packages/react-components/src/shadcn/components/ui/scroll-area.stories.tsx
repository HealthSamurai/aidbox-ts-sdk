import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { ScrollArea } from "#shadcn/components/ui/scroll-area";
import { Separator } from "#shadcn/components/ui/separator";

const tags = Array.from({ length: 50 }).map(
	(_, i, a) => `v1.2.0-beta.${a.length - i}`,
);

const meta = {
	title: "Component/Scroll area",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<ScrollArea className="h-72 w-48 rounded-md border">
			<div className="p-4">
				<h4 className="mb-4 text-sm leading-none font-medium">Tags</h4>
				{tags.map((tag) => (
					<React.Fragment key={tag}>
						<div className="text-sm">{tag}</div>
						<Separator className="my-2" />
					</React.Fragment>
				))}
			</div>
		</ScrollArea>
	),
} satisfies Story;
