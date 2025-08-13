import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "#shadcn/components/ui/button";
import { Input } from "#shadcn/components/ui/input";
import { Label } from "#shadcn/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#shadcn/components/ui/popover";

const meta = {
	title: "Component/Popover",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="secondary">Open popover</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80">
				<div className="grid gap-4">
					<div className="space-y-2">
						<h4 className="leading-none font-medium">Dimensions</h4>
						<p className="text-muted-foreground text-sm">
							Set the dimensions for the layer.
						</p>
					</div>
					<div className="grid gap-2">
						<div className="grid grid-cols-3 items-center gap-4">
							<Label htmlFor="width">Width</Label>
							<Input
								id="width"
								defaultValue="100%"
								className="col-span-2 h-8"
							/>
						</div>
						<div className="grid grid-cols-3 items-center gap-4">
							<Label htmlFor="maxWidth">Max. width</Label>
							<Input
								id="maxWidth"
								defaultValue="300px"
								className="col-span-2 h-8"
							/>
						</div>
						<div className="grid grid-cols-3 items-center gap-4">
							<Label htmlFor="height">Height</Label>
							<Input
								id="height"
								defaultValue="25px"
								className="col-span-2 h-8"
							/>
						</div>
						<div className="grid grid-cols-3 items-center gap-4">
							<Label htmlFor="maxHeight">Max. height</Label>
							<Input
								id="maxHeight"
								defaultValue="none"
								className="col-span-2 h-8"
							/>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	),
} satisfies Story;
