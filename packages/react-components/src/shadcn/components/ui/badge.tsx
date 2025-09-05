import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Base badge styles
const baseBadgeStyles = cn(
	// Layout
	"inline-flex",
	"items-center",
	"justify-center",
	"w-fit",
	"whitespace-nowrap",
	"shrink-0",
	"gap-1",
	"overflow-hidden",
	// Shape
	"rounded-md",
	// Borders
	"border",
	// Spacing
	"px-2",
	"py-0.5",
	// Typography
	"text-xs",
	"font-medium",
	// SVG
	"[&>svg]:size-3",
	"[&>svg]:pointer-events-none",
	// Transitions
	"transition-[color,box-shadow]",
	// Focus
	"focus-visible:ring-2",
	"focus-visible:ring-utility-blue/70",
	// Invalid
	"aria-invalid:ring-2",
	"aria-invalid:ring-utility-red/70",
	"aria-invalid:border-border-error",
);

const badgeVariants = cva(baseBadgeStyles, {
	variants: {
		variant: {
			default: cn(
				"border-transparent",
				"bg-bg-link",
				"text-text-primary_on-brand",
				"[a&]:hover:bg-bg-link_hover",
			),
			secondary: cn(
				"border-transparent",
				"bg-bg-secondary",
				"text-text-secondary",
				"[a&]:hover:bg-bg-tertiary",
			),
			destructive: cn(
				"border-transparent",
				"bg-bg-error-primary_inverse",
				"text-text-primary_on-brand",
				"[a&]:hover:bg-bg-error-primary_inverse_hover",
				"focus-visible:ring-utility-red/70",
			),
			outline: cn(
				"text-text-primary",
				"border-border-primary",
				"[a&]:hover:bg-bg-secondary",
				"[a&]:hover:text-text-primary",
			),
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

function Badge({
	className,
	variant,
	asChild = false,
	...props
}: React.ComponentProps<"span"> &
	VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : "span";

	return (
		<Comp
			data-slot="badge"
			className={cn(badgeVariants({ variant }), className)}
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
