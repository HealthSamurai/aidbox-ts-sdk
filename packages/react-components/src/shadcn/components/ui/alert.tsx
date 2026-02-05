import * as React from "react";

import { cn } from "#shadcn/lib/utils";

const baseAlertStyles = cn(
	// Layout
	"relative",
	"w-full",
	"flex",
	"items-start",
	"gap-[var(--spacing-x1,8px)]",
	// Shape
	"rounded-[var(--corner-corner-m,6px)]",
	// Spacing
	"p-[var(--spacing-x2,16px)]",
	// Typography
	"typo-body",
	// SVG styles
	"[&>svg]:size-5",
	"[&>svg]:shrink-0",
);

const alertContentStyles = cn(
	// Layout
	"flex",
	"flex-col",
	"gap-[var(--spacing-x1,8px)]",
	"flex-1",
	"min-w-0",
);

const variantStyles = {
	critical: {
		default: cn(
			"bg-bg-error-primary",
			"text-text-error-primary",
			"[&>svg]:text-fg-error-primary",
		),
		vivid: cn(
			"bg-bg-error-primary_inverse",
			"text-text-primary_on-brand",
			"[&>svg]:text-fg-primary_on-brand",
		),
	},
	warning: {
		default: cn(
			"bg-bg-warning-primary",
			"text-text-warning-primary",
			"[&>svg]:text-fg-warning-primary",
		),
		vivid: cn(
			"bg-bg-warning-primary_inverse",
			"text-text-warning-primary",
			"[&>svg]:text-fg-warning-primary",
		),
	},
	info: {
		default: cn(
			"bg-bg-info-primary",
			"text-text-info-primary",
			"[&>svg]:text-fg-info-primary",
		),
		vivid: cn(
			"bg-bg-info-primary_inverse",
			"text-text-primary_on-brand",
			"[&>svg]:text-fg-primary_on-brand",
		),
	},
	neutral: {
		default: cn(
			"bg-bg-neutral-primary",
			"text-text-primary",
			"[&>svg]:text-fg-neutral-primary",
		),
		vivid: cn(
			"bg-bg-neutral-primary_inverse",
			"text-text-primary_on-brand",
			"[&>svg]:text-fg-primary_on-brand",
		),
	},
	success: {
		default: cn(
			"bg-bg-success-secondary",
			"text-text-primary",
			"[&>svg]:text-fg-success-primary",
		),
		vivid: cn(
			"bg-bg-success-primary_inverse",
			"text-text-primary_on-brand",
			"[&>svg]:text-fg-primary_on-brand",
		),
	},
} as const;

type AlertVariant = keyof typeof variantStyles;

function Alert({
	className,
	variant = "info",
	vivid = false,
	icon = true,
	children,
	...props
}: React.ComponentProps<"div"> & {
	variant?: AlertVariant | undefined;
	vivid?: boolean | undefined;
	icon?: boolean | undefined;
}) {
	const childrenArray = React.Children.toArray(children);

	// Find first child that is not AlertTitle or AlertDescription (assumed to be icon)
	const iconIndex = childrenArray.findIndex(
		(child) =>
			React.isValidElement(child) &&
			child.type !== AlertTitle &&
			child.type !== AlertDescription,
	);

	const hasIcon = icon && iconIndex !== -1;
	const iconElement = hasIcon ? childrenArray[iconIndex] : null;
	const content = hasIcon
		? childrenArray.filter((_, index) => index !== iconIndex)
		: childrenArray;

	const variantStyle = variantStyles[variant][vivid ? "vivid" : "default"];

	return (
		<div
			data-slot="alert"
			role="alert"
			className={cn(baseAlertStyles, variantStyle, className)}
			{...props}
		>
			{iconElement}
			<div className={alertContentStyles}>{content}</div>
		</div>
	);
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-title"
			className={cn("typo-body", "font-medium", className)}
			{...props}
		/>
	);
}

function AlertDescription({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-description"
			className={cn("typo-body", className)}
			{...props}
		/>
	);
}

export { Alert, AlertTitle, AlertDescription };
