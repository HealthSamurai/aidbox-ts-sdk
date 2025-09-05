import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "#shadcn/components/ui/button";
import { Toaster, toast } from "#shadcn/components/ui/sonner";

const meta = {
	title: "Component/Sonner",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<div>
			<Button
				variant="secondary"
				onClick={() =>
					toast("Event has been created", {
						description: "Sunday, December 03, 2023 at 9:00 AM",
						action: {
							label: "Undo",
							variant: "primary",
							onClick: () => console.log("Undo"),
						},
					})
				}
			>
				Show Toast
			</Button>
			<Toaster position="top-center" />
		</div>
	),
} satisfies Story;
