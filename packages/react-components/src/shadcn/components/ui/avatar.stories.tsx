import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "#shadcn/components/ui/avatar";

const meta = {
	title: "Component/Avatar",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<div className="flex flex-row flex-wrap items-center gap-12">
			<Avatar>
				<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
				<AvatarFallback>CN</AvatarFallback>
			</Avatar>
			<Avatar className="rounded-lg">
				<AvatarImage
					src="https://github.com/evilrabbit.png"
					alt="@evilrabbit"
				/>
				<AvatarFallback>ER</AvatarFallback>
			</Avatar>
			<div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
				<Avatar>
					<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<Avatar>
					<AvatarImage src="https://github.com/leerob.png" alt="@leerob" />
					<AvatarFallback>LR</AvatarFallback>
				</Avatar>
				<Avatar>
					<AvatarImage
						src="https://github.com/evilrabbit.png"
						alt="@evilrabbit"
					/>
					<AvatarFallback>ER</AvatarFallback>
				</Avatar>
			</div>
		</div>
	),
} satisfies Story;

export const TwoLetterAvatars = {
	render: () => (
		<div className="flex flex-col items-center gap-8">
			<div className="flex flex-row flex-wrap items-center gap-12">
				<Avatar>
					<AvatarFallback>KB</AvatarFallback>
				</Avatar>
			</div>
		</div>
	),
} satisfies Story;
