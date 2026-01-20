import { Controls, Primary, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "#shadcn/components/ui/avatar";

interface AvatarWrapperProps {
	shape?: "circle" | "square";
	hasImage?: boolean;
	fallback?: string;
}

function AvatarWrapper({
	shape = "circle",
	hasImage = true,
	fallback = "CN",
}: AvatarWrapperProps) {
	return (
		<Avatar
			key={`${hasImage}`}
			className={shape === "square" ? "rounded-lg" : undefined}
		>
			{hasImage && (
				<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
			)}
			<AvatarFallback>{fallback}</AvatarFallback>
		</Avatar>
	);
}

const meta = {
	title: "Component/Avatar",
	component: AvatarWrapper,
	parameters: {
		layout: "centered",
		docs: {
			page: () => (
				<>
					<Title />
					<Primary />
					<Controls />
				</>
			),
		},
	},
	argTypes: {
		shape: {
			control: "select",
			options: ["circle", "square"],
		},
		hasImage: {
			control: "boolean",
		},
		fallback: {
			control: "text",
		},
	},
	args: {
		shape: "circle",
		hasImage: true,
		fallback: "CN",
	},
} satisfies Meta<typeof AvatarWrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
	tags: ["!dev"],
	render: ({ shape = "circle", hasImage = true, fallback = "CN" }) => (
		<AvatarWrapper shape={shape} hasImage={hasImage} fallback={fallback} />
	),
} satisfies Story;

export const Demo = {
	tags: ["!autodocs"],
	render: () => (
		<div className="flex flex-row flex-wrap items-center gap-12">
			{/* With image - circle */}
			<Avatar>
				<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
				<AvatarFallback>CN</AvatarFallback>
			</Avatar>

			{/* With image - square */}
			<Avatar className="rounded-lg">
				<AvatarImage
					src="https://github.com/evilrabbit.png"
					alt="@evilrabbit"
				/>
				<AvatarFallback>ER</AvatarFallback>
			</Avatar>

			{/* Fallback only */}
			<Avatar>
				<AvatarFallback>KB</AvatarFallback>
			</Avatar>

			{/* Stacked avatars */}
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
