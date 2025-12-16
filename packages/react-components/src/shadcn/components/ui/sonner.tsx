"use client";

import type { VariantProps } from "class-variance-authority";
import { Info, TriangleAlert, X } from "lucide-react";
import { useTheme } from "next-themes";
import {
	Toaster as Sonner,
	toast as sonnerToast,
	type ToasterProps,
} from "sonner";
import { cn } from "#shadcn/lib/utils";
import { Button, type buttonVariants } from "./button";

/* ==========================================================================
   Styles
   ========================================================================== */

const toastBaseStyles = cn(
	// Layout
	"flex",
	"items-start",
	"gap-[var(--spacing-x1point5,12px)]",
	// Shape
	"rounded-[var(--corner-corner-m,6px)]",
	// Spacing
	"p-[var(--spacing-x2,16px)]",
	// Border
	"border",
);

const toastDefaultStyles = cn(
	toastBaseStyles,
	// Background
	"bg-bg-primary",
	// Border
	"border-border-separator",
);

const toastErrorStyles = cn(
	toastBaseStyles,
	// Background
	"bg-bg-error-secondary",
	// Border
	"border-border-error_inverse",
);

const iconContainerStyles = cn(
	// Layout
	"shrink-0",
	"size-5",
);

const contentContainerStyles = cn(
	// Layout
	"flex",
	"flex-col",
	"gap-[var(--spacing-x1,8px)]",
	"flex-1",
	"min-w-0",
);

const titleDefaultStyles = cn(
	// Typography
	"body14bold",
	"text-text-primary",
);

const titleErrorStyles = cn(
	// Typography
	"body14bold",
	"text-text-error-primary",
);

const descriptionDefaultStyles = cn(
	// Typography
	"body14",
	"text-text-secondary_hover",
);

const descriptionErrorStyles = cn(
	// Typography
	"body14",
	"text-[var(--color-red-800)]",
);

const closeButtonStyles = cn(
	// Layout
	"shrink-0",
	"size-5",
	// Interaction
	"cursor-pointer",
	"hover:opacity-70",
	"transition-opacity",
);

const closeButtonDefaultStyles = cn(
	closeButtonStyles,
	// Typography
	"text-text-primary",
);

const closeButtonErrorStyles = cn(
	closeButtonStyles,
	// Typography
	"text-[var(--color-red-800)]",
);

/* ==========================================================================
   Components
   ========================================================================== */

type ToastVariant = "default" | "error";

interface ToastContentProps {
	id: string | number;
	title: string;
	description?: string | undefined;
	variant?: ToastVariant;
	showCloseButton?: boolean;
	action?:
		| {
				label: string;
				onClick: () => void;
				variant?: VariantProps<typeof buttonVariants>["variant"];
		  }
		| undefined;
}

function ToastContent({
	id,
	title,
	description,
	variant = "default",
	showCloseButton = false,
	action,
}: ToastContentProps) {
	const isError = variant === "error";

	const Icon = isError ? TriangleAlert : Info;
	const iconColor = isError ? "text-text-error-primary" : "text-text-primary";

	return (
		<div className={isError ? toastErrorStyles : toastDefaultStyles}>
			{/* Icon */}
			<div className={cn(iconContainerStyles, iconColor)}>
				<Icon className="size-5" />
			</div>

			{/* Content */}
			<div className={contentContainerStyles}>
				<div className={isError ? titleErrorStyles : titleDefaultStyles}>
					{title}
				</div>
				{description && (
					<div
						className={
							isError ? descriptionErrorStyles : descriptionDefaultStyles
						}
					>
						{description}
					</div>
				)}
				{action ? (
					<div className="mt-1">
						<Button
							variant={action.variant || "secondary"}
							size="small"
							onClick={action.onClick}
						>
							{action.label}
						</Button>
					</div>
				) : null}
			</div>

			{/* Close button - only shown if no action */}
			{showCloseButton && (
				<button
					type="button"
					onClick={() => sonnerToast.dismiss(id)}
					className={
						isError ? closeButtonErrorStyles : closeButtonDefaultStyles
					}
					aria-label="Close"
				>
					<X className="size-5" />
				</button>
			)}
		</div>
	);
}

/* ==========================================================================
   Toaster
   ========================================================================== */

function Toaster({ ...props }: ToasterProps) {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={
				theme === "system" ? "system" : theme === "dark" ? "dark" : "light"
			}
			className="toaster group"
			toastOptions={{
				unstyled: true,
				classNames: {
					toast: "w-full max-w-[588px]",
				},
			}}
			{...props}
		/>
	);
}

/* ==========================================================================
   Toast API
   ========================================================================== */

interface ToastOptions {
	description?: string;
	action?:
		| {
				label: string;
				onClick: () => void;
				variant?: VariantProps<typeof buttonVariants>["variant"];
		  }
		| undefined;
	closeButton?: boolean;
	duration?: number;
}

function createToast(
	title: string,
	variant: ToastVariant,
	options?: ToastOptions,
) {
	// If action exists, no close button; otherwise respect closeButton option
	const hasAction = options?.action !== undefined && options?.action !== null;
	const showCloseButton = hasAction ? false : (options?.closeButton ?? false);

	return sonnerToast.custom(
		(id) => {
			const contentProps: Omit<ToastContentProps, "id"> = {
				title,
				description: options?.description,
				variant,
				showCloseButton,
			};

			// Добавляем action только если оно действительно есть
			if (hasAction && options.action) {
				contentProps.action = options.action;
			}

			return <ToastContent id={id} {...contentProps} />;
		},
		options?.duration !== undefined
			? { duration: options.duration }
			: undefined,
	);
}

const toast = {
	/**
	 * Default info toast
	 */
	info: (title: string, options?: ToastOptions) =>
		createToast(title, "default", options),

	/**
	 * Error/alert toast
	 */
	error: (title: string, options?: ToastOptions) =>
		createToast(title, "error", options),

	/**
	 * Dismiss a toast by id
	 */
	dismiss: sonnerToast.dismiss,
};

export { Toaster, toast };
