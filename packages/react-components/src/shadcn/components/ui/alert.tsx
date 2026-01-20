import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "#shadcn/lib/utils";

const baseAlertStyles = cn(
	// Layout
	"relative",
	"w-full",
	"flex",
	"items-start",
	"gap-[var(--spacing-x2,16px)]",
	// Shape
	"rounded-[var(--corner-corner-m,6px)]",
	// Spacing
	"p-[var(--spacing-x2,16px)]",
	// Typography
	"typo-body",
	// SVG styles
	"[&>svg]:size-5",
	"[&>svg]:shrink-0",
	"[&>svg]:text-current",
);

const alertContentStyles = cn(
	// Layout
	"flex",
	"flex-col",
	"gap-[var(--spacing-x1,8px)]",
	"flex-1",
	"min-w-0",
);

const alertVariants = cva(baseAlertStyles, {
	variants: {
		variant: {
			default: cn(
				"bg-bg-primary",
				"text-text-primary",
				"border",
				"border-border-primary",
			),
			danger: cn(
				"text-[var(--color-text-error-primary)]",
				"bg-[var(--color-red-100)]",
				"[&>svg]:text-current",
				"[&_[data-slot=alert-description]]:text-[var(--color-text-error-primary)]",
			),
			warning: cn(
				"text-[var(--color-yellow-700)]",
				"bg-[var(--color-yellow-100)]",
				"[&>svg]:text-current",
				"[&_[data-slot=alert-description]]:text-[var(--color-yellow-700)]",
			),
			info: cn(
				"text-[var(--color-blue-600)]",
				"bg-[var(--color-blue-100)]",
				"[&>svg]:text-current",
				"[&_[data-slot=alert-description]]:text-[var(--color-blue-600)]",
			),
			success: cn(
				"text-[var(--color-green-700)]",
				"bg-[var(--color-green-100)]",
				"[&>svg]:text-current",
				"[&_[data-slot=alert-description]]:text-[var(--color-green-700)]",
			),
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

function Alert({
	className,
	variant,
	icon = true,
	children,
	...props
}: React.ComponentProps<"div"> &
	VariantProps<typeof alertVariants> & {
		icon?: boolean;
	}) {
	const childrenArray = React.Children.toArray(children);

	// Find first child that is not AlertTitle or AlertDescription (assumed to be icon)
	const iconIndex = childrenArray.findIndex(
		(child) =>
			React.isValidElement(child) &&
			(child.type as { displayName?: string })?.displayName !== "AlertTitle" &&
			(child.type as { displayName?: string })?.displayName !==
				"AlertDescription",
	);

	const hasIcon = icon && iconIndex !== -1;
	const iconElement = hasIcon ? childrenArray[iconIndex] : null;
	const content =
		iconIndex !== -1
			? childrenArray.filter((_, index) => index !== iconIndex)
			: childrenArray;

	return (
		<div
			data-slot="alert"
			role="alert"
			className={cn(alertVariants({ variant }), className)}
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
