import type { Meta, StoryObj } from "@storybook/react-vite";
import { AspectRatio } from "#shadcn/components/ui/aspect-ratio";

const meta = {
	title: "Component/Aspect ration",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<AspectRatio ratio={16 / 9} className="bg-muted rounded-lg">
			<img
				src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
				alt="Aspect Ration demonstraion image."
				className="h-full w-full rounded-lg object-cover dark:brightness-[0.2] dark:grayscale"
			/>
		</AspectRatio>
	),
} satisfies Story;
