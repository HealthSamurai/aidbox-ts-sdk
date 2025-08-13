import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "#shadcn/components/ui/separator";

const meta = {
	title: "Component/Separator",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<div>
			<div className="space-y-1">
				<h4 className="text-sm leading-none font-medium">Radix Primitives</h4>
				<p className="text-muted-foreground text-sm">
					An open-source UI component library.
				</p>
			</div>
			<Separator className="my-4" />
			<div className="flex h-5 items-center space-x-4 text-sm">
				<div>Blog</div>
				<Separator orientation="vertical" />
				<div>Docs</div>
				<Separator orientation="vertical" />
				<div>Source</div>
			</div>
		</div>
	),
} satisfies Story;
