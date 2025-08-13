import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "#shadcn/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#shadcn/components/ui/tooltip";

const meta = {
	title: "Component/Tooltip",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button variant="outline">Hover</Button>
			</TooltipTrigger>
			<TooltipContent>
				<p>Add to library</p>
			</TooltipContent>
		</Tooltip>
	),
} satisfies Story;
