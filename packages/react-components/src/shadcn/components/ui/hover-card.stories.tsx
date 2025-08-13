import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "#shadcn/components/ui/avatar";
import { Button } from "#shadcn/components/ui/button";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "#shadcn/components/ui/hover-card";

const meta = {
	title: "Component/Hover card",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<HoverCard>
			<HoverCardTrigger asChild>
				<Button variant="link">@nextjs</Button>
			</HoverCardTrigger>
			<HoverCardContent className="w-80">
				<div className="flex justify-between gap-4">
					<Avatar>
						<AvatarImage src="https://github.com/vercel.png" />
						<AvatarFallback>VC</AvatarFallback>
					</Avatar>
					<div className="space-y-1">
						<h4 className="text-sm font-semibold">@nextjs</h4>
						<p className="text-sm">
							The React Framework – created and maintained by @vercel.
						</p>
						<div className="text-muted-foreground text-xs">
							Joined December 2021
						</div>
					</div>
				</div>
			</HoverCardContent>
		</HoverCard>
	),
} satisfies Story;
