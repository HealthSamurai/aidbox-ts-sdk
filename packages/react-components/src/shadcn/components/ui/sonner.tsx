"use client";

import type { VariantProps } from "class-variance-authority";
import { useTheme } from "next-themes";
import {
	Toaster as Sonner,
	toast as sonnerToast,
	type ToasterProps,
} from "sonner";
import { Button, type buttonVariants } from "./button";

function Toaster({ ...props }: ToasterProps) {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={
				theme === "system" ? "system" : theme === "dark" ? "dark" : "light"
			}
			className="toaster group"
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
				} as React.CSSProperties
			}
			{...props}
		/>
	);
}

// Custom toast wrapper with our buttons
function toast(
	message: string,
	options?: {
		description?: string;
		action?: {
			label: string;
			onClick: () => void;
			variant?: VariantProps<typeof buttonVariants>["variant"];
		};
		cancel?: {
			label: string;
			onClick: () => void;
			variant?: VariantProps<typeof buttonVariants>["variant"];
		};
	},
) {
	return sonnerToast(message, {
		...options,
		action: options?.action ? (
			<Button
				variant={options.action.variant || "secondary"}
				size="small"
				onClick={options.action.onClick}
			>
				{options.action.label}
			</Button>
		) : undefined,
		cancel: options?.cancel ? (
			<Button
				variant={options.cancel.variant || "ghost"}
				size="small"
				onClick={options.cancel.onClick}
			>
				{options.cancel.label}
			</Button>
		) : undefined,
	});
}

export { Toaster, toast };
