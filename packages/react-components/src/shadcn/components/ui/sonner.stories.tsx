import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bug, Play } from "lucide-react";
import { Button } from "#shadcn/components/ui/button";
import { Toaster, toast } from "#shadcn/components/ui/sonner";

/* ==========================================================================
   Meta
   ========================================================================== */

const meta = {
	title: "Component/Sonner",
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* ==========================================================================
   Stories
   ========================================================================== */

export const AllVariants: Story = {
	render: () => (
		<div className="flex flex-col gap-4">
			<div className="flex gap-2 flex-wrap">
				<Button
					variant="secondary"
					onClick={() => {
						toast.info("Info notification", {
							description: "This is an informational message.",
							closeButton: false,
						});
					}}
				>
					Info without buttons
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						toast.info("Info notification", {
							description: "This is an informational message.",
							closeButton: true,
						});
					}}
				>
					Info with close button
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						toast.info("Info with action", {
							description: "Click the button to undo.",
							actionSlot: (
								<Button variant="primary" size="small">
									<Play className="size-4" />
									Button
								</Button>
							),
							closeButton: false,
						});
					}}
				>
					Info with one button
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						toast.info("Info with action", {
							description: "Click the button to undo.",
							actionSlot: (
								<Button variant="primary" size="small">
									<Play className="size-4" />
									Button
								</Button>
							),
							closeButton: true,
						});
					}}
				>
					Info with button and close
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						toast.info("Info with actions", {
							description:
								"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
							actionSlot: (
								<Button variant="primary" size="small">
									<Play className="size-4" />
									Button
								</Button>
							),
							secondaryActionSlot: (
								<Button variant="ghost" size="small">
									<Bug className="size-4" />
									Report a bug
								</Button>
							),
							closeButton: false,
						});
					}}
				>
					Info with two buttons
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						toast.info("Info with actions", {
							description:
								"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
							actionSlot: (
								<Button variant="primary" size="small">
									<Play className="size-4" />
									Button
								</Button>
							),
							secondaryActionSlot: (
								<Button variant="ghost" size="small">
									<Bug className="size-4" />
									Report a bug
								</Button>
							),
							closeButton: true,
						});
					}}
				>
					Info with two buttons and close
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						toast.error("Error notification", {
							description: "This is an error message.",
							closeButton: false,
						});
					}}
				>
					Error without buttons
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						toast.error("Error notification", {
							description: "This is an error message.",
							closeButton: true,
						});
					}}
				>
					Error with close button
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						toast.error("Error with action", {
							description: "Click the button to retry.",
							actionSlot: (
								<Button variant="primary" size="small" danger>
									Retry
								</Button>
							),
							closeButton: false,
						});
					}}
				>
					Error with one button
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						toast.error("Error with action", {
							description: "Click the button to retry.",
							actionSlot: (
								<Button variant="primary" size="small" danger>
									Retry
								</Button>
							),
							closeButton: true,
						});
					}}
				>
					Error with button and close
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						toast.error("Error with actions", {
							description:
								"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
							actionSlot: (
								<Button variant="primary" size="small" danger>
									Retry
								</Button>
							),
							secondaryActionSlot: (
								<Button variant="ghost" size="small" danger>
									<Bug className="size-4" />
									Report a bug
								</Button>
							),
							closeButton: false,
						});
					}}
				>
					Error with two buttons
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						toast.error("Error with actions", {
							description:
								"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
							actionSlot: (
								<Button variant="primary" size="small" danger>
									Retry
								</Button>
							),
							secondaryActionSlot: (
								<Button variant="ghost" size="small" danger>
									<Bug className="size-4" />
									Report a bug
								</Button>
							),
							closeButton: true,
						});
					}}
				>
					Error with two buttons and close
				</Button>
			</div>
			<Toaster position="top-center" />
		</div>
	),
};
