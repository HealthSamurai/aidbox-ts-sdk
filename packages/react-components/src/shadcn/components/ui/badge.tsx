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
	// Typography
	"font-medium",
	// SVG
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
		// `regular` reproduces the previous hard-coded spacing and type, so
		// existing usages render identically. `large` is for badges that sit
		// beside a heading or carry a page-level status, where text-xs is too
		// quiet to read as a peer of the title next to it.
		size: {
			regular: cn("px-2", "py-0.5", "text-xs", "[&>svg]:size-3"),
			large: cn("px-2.5", "py-1", "text-sm", "[&>svg]:size-3.5"),
		},
	},
	defaultVariants: {
		variant: "default",
		size: "regular",
	},
});

function Badge({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"span"> &
	VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : "span";

	return (
		<Comp
			data-slot="badge"
			className={cn(badgeVariants({ variant, size }), className)}
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
