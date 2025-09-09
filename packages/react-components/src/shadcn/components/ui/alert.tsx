import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

const baseAlertStyles = cn(
	// Layout
	"relative",
	"w-full",
	"grid",
	"items-start",
	"grid-cols-[0_1fr]",
	"has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr]",
	"gap-y-0.5",
	"has-[>svg]:gap-x-3",
	// Shape
	"rounded-lg",
	// Borders
	"border",
	"border-border-primary",
	// Spacing
	"px-4",
	"py-3",
	// Typography
	"text-sm",
	// SVG styles
	"[&>svg]:size-4",
	"[&>svg]:translate-y-0.5",
	"[&>svg]:text-current",
);

const alertVariants = cva(baseAlertStyles, {
	variants: {
		variant: {
			default: cn("bg-bg-primary", "text-text-primary"),
			destructive: cn(
				"text-text-error-primary",
				"bg-bg-error-primary",
				"border-border-error",
				"[&>svg]:text-current",
				"*:data-[slot=alert-description]:text-fg-error-secondary",
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
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
	return (
		<div
			data-slot="alert"
			role="alert"
			className={cn(alertVariants({ variant }), className)}
			{...props}
		/>
	);
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-title"
			className={cn(
				"col-start-2",
				"line-clamp-1",
				"min-h-4",
				"font-medium",
				"tracking-tight",
				className,
			)}
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
			className={cn(
				"text-text-secondary",
				"col-start-2",
				"grid",
				"justify-items-start",
				"gap-1",
				"text-sm",
				"[&_p]:leading-relaxed",
				className,
			)}
			{...props}
		/>
	);
}

export { Alert, AlertTitle, AlertDescription };
