import type { Meta, StoryObj } from "@storybook/react-vite";
import { BadgeCheckIcon } from "lucide-react";
import { Badge } from "#shadcn/components/ui/badge";

const meta = {
	title: "Component/Badge",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<div className="flex flex-col items-center gap-2">
			<div className="flex w-full flex-wrap gap-2">
				<Badge>Badge</Badge>
				<Badge variant="secondary">Secondary</Badge>
				<Badge variant="destructive">Destructive</Badge>
				<Badge variant="outline">Outline</Badge>
			</div>
			<div className="flex w-full flex-wrap gap-2">
				<Badge
					variant="secondary"
					className="bg-blue-500 text-white dark:bg-blue-600"
				>
					<BadgeCheckIcon />
					Verified
				</Badge>
				<Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums">
					8
				</Badge>
				<Badge
					className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums"
					variant="destructive"
				>
					99
				</Badge>
				<Badge
					className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums"
					variant="outline"
				>
					20+
				</Badge>
			</div>
		</div>
	),
} satisfies Story;
