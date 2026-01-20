import { Controls, Primary, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bug, Play } from "lucide-react";
import { useEffect } from "react";
import { Button } from "#shadcn/components/ui/button";
import { Toaster, toast } from "#shadcn/components/ui/sonner";

interface ToastWrapperProps {
	variant?: "info" | "error";
	closeButton?: boolean;
	hasAction?: boolean;
	hasSecondaryAction?: boolean;
}

function ToastWrapper({
	variant = "info",
	closeButton = false,
	hasAction = false,
	hasSecondaryAction = false,
}: ToastWrapperProps) {
	const isError = variant === "error";

	const showToast = () => {
		const toastFn = isError ? toast.error : toast.info;
		toastFn(isError ? "Error notification" : "Info notification", {
			description: "This is a toast message with description.",
			closeButton,
			actionSlot: hasAction ? (
				<Button variant="primary" size="small" danger={isError}>
					<Play className="size-4" />
					Action
				</Button>
			) : undefined,
			secondaryActionSlot: hasSecondaryAction ? (
				<Button variant="ghost" size="small" danger={isError}>
					<Bug className="size-4" />
					Report
				</Button>
			) : undefined,
		});
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: trigger on prop change
	useEffect(() => {
		showToast();
	}, [variant, closeButton, hasAction, hasSecondaryAction]);

	return (
		<div className="flex flex-col items-center gap-4">
			<Button variant="secondary" onClick={showToast}>
				Show Toast
			</Button>
			<Toaster position="top-center" />
		</div>
	);
}

const meta = {
	title: "Component/Sonner",
	component: ToastWrapper,
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
		variant: {
			control: "select",
			options: ["info", "error"],
		},
		closeButton: {
			control: "boolean",
		},
		hasAction: {
			control: "boolean",
		},
		hasSecondaryAction: {
			control: "boolean",
		},
	},
	args: {
		variant: "info",
		closeButton: false,
		hasAction: false,
		hasSecondaryAction: false,
	},
} satisfies Meta<typeof ToastWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {
	tags: ["!dev"],
	render: ({
		variant = "info",
		closeButton = false,
		hasAction = false,
		hasSecondaryAction = false,
	}) => (
		<ToastWrapper
			variant={variant}
			closeButton={closeButton}
			hasAction={hasAction}
			hasSecondaryAction={hasSecondaryAction}
		/>
	),
} satisfies Story;

export const Demo = {
	tags: ["!autodocs"],
	render: () => (
		<div className="flex flex-col gap-4">
			<div className="flex gap-2 flex-wrap">
				<Button
					variant="secondary"
					onClick={() => {
						toast.info("Info notification", {
							description: "This is an informational message.",
						});
					}}
				>
					Info
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						toast.info("Info with close", {
							description: "This toast has a close button.",
							closeButton: true,
						});
					}}
				>
					Info + Close
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						toast.info("Info with action", {
							description: "Click the button to perform action.",
							actionSlot: (
								<Button variant="primary" size="small">
									<Play className="size-4" />
									Action
								</Button>
							),
						});
					}}
				>
					Info + Action
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						toast.info("Info with actions", {
							description: "Multiple actions available.",
							actionSlot: (
								<Button variant="primary" size="small">
									<Play className="size-4" />
									Action
								</Button>
							),
							secondaryActionSlot: (
								<Button variant="ghost" size="small">
									<Bug className="size-4" />
									Report
								</Button>
							),
							closeButton: true,
						});
					}}
				>
					Info + All
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						toast.error("Error notification", {
							description: "Something went wrong.",
						});
					}}
				>
					Error
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						toast.error("Error with close", {
							description: "This error has a close button.",
							closeButton: true,
						});
					}}
				>
					Error + Close
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						toast.error("Error with action", {
							description: "Click to retry the operation.",
							actionSlot: (
								<Button variant="primary" size="small" danger>
									Retry
								</Button>
							),
						});
					}}
				>
					Error + Action
				</Button>

				<Button
					variant="secondary"
					onClick={() => {
						toast.error("Error with actions", {
							description: "Multiple actions available.",
							actionSlot: (
								<Button variant="primary" size="small" danger>
									Retry
								</Button>
							),
							secondaryActionSlot: (
								<Button variant="ghost" size="small" danger>
									<Bug className="size-4" />
									Report
								</Button>
							),
							closeButton: true,
						});
					}}
				>
					Error + All
				</Button>
			</div>
			<Toaster position="top-center" />
		</div>
	),
} satisfies Story;
