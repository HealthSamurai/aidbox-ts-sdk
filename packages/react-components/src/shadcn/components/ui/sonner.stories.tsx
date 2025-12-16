import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { Button } from "#shadcn/components/ui/button";
import { Toaster, toast } from "#shadcn/components/ui/sonner";

/* ==========================================================================
   Demo Component for Storybook Controls
   ========================================================================== */

interface ToastDemoProps {
	variant: "info" | "error";
	title: string;
	description: string;
	showCloseButton: boolean;
	showAction: boolean;
	actionLabel: string;
}

function ToastDemo({
	variant,
	title,
	description,
	showCloseButton,
	showAction,
	actionLabel,
}: ToastDemoProps) {
	// Показываем toast при изменении параметров
	useEffect(() => {
		toast.dismiss();

		const toastFn = variant === "error" ? toast.error : toast.info;

		const toastOptions: Parameters<typeof toastFn>[1] = {
			description,
			duration: Number.POSITIVE_INFINITY, // Не закрывать автоматически в docs
		};

		// Если showAction true, то показываем action, иначе показываем closeButton если он включен
		if (showAction && actionLabel) {
			toastOptions.action = {
				label: actionLabel,
				onClick: () => console.log("Action clicked"),
			};
		} else {
			toastOptions.closeButton = showCloseButton;
		}

		toastFn(title, toastOptions);
	}, [variant, title, description, showCloseButton, showAction, actionLabel]);

	return (
		<div className="min-h-[200px]">
			<Toaster position="top-center" />
		</div>
	);
}

/* ==========================================================================
   Meta
   ========================================================================== */

const meta: Meta<typeof ToastDemo> = {
	title: "Component/Sonner",
	component: ToastDemo,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: ["info", "error"],
			description: "Toast variant",
		},
		title: {
			control: "text",
			description: "Toast title",
		},
		description: {
			control: "text",
			description: "Toast description",
		},
		showCloseButton: {
			control: "boolean",
			description: "Show close button (ignored when action is shown)",
		},
		showAction: {
			control: "boolean",
			description: "Show action button (hides close button)",
			defaultValue: true,
		},
		actionLabel: {
			control: "text",
			description: "Action button label",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

/* ==========================================================================
   Stories
   ========================================================================== */

export const Default: Story = {
	args: {
		variant: "info",
		title: "Event has been created",
		description:
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
		showCloseButton: false,
		showAction: true,
		actionLabel: "Undo",
	},
};

export const ErrorVariant: Story = {
	args: {
		variant: "error",
		title: "Something went wrong",
		description:
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
		showCloseButton: false,
		showAction: true,
		actionLabel: "Retry",
	},
};

export const WithAction: Story = {
	args: {
		variant: "info",
		title: "Event has been created",
		description: "You can undo this action.",
		showCloseButton: false,
		showAction: true,
		actionLabel: "Undo",
	},
};

export const AllVariants: Story = {
	render: () => (
		<div className="flex flex-col gap-4">
			<div className="flex gap-2 flex-wrap">
				<Button
					variant="secondary"
					onClick={() => {
						toast.info("Info notification", {
							description: "This is an informational message.",
							closeButton: true,
						});
					}}
				>
					Info with close
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						toast.info("Info with action", {
							description: "Click the button to undo.",
							action: {
								label: "Undo",
								onClick: () => console.log("Undo clicked"),
							},
						});
					}}
				>
					Info with action
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
					Error with close
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						toast.error("Error with action", {
							description: "Click the button to retry.",
							action: {
								label: "Retry",
								onClick: () => console.log("Retry clicked"),
							},
						});
					}}
				>
					Error with action
				</Button>
			</div>
			<Toaster position="top-center" />
		</div>
	),
};
