import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import { Button } from "#shadcn/components/ui/button";

const meta = {
	title: "Component/Sonner",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<Button
			variant="outline"
			onClick={() =>
				toast("Event has been created", {
					description: "Sunday, December 03, 2023 at 9:00 AM",
					action: {
						label: "Undo",
						onClick: () => console.log("Undo"),
					},
				})
			}
		>
			Show Toast
		</Button>
	),
} satisfies Story;
