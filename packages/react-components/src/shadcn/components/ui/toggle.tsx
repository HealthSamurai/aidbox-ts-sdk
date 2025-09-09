import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Base toggle styles
const baseToggleStyles = cn(
	// Layout
	"inline-flex",
	"items-center",
	"justify-center",
	"gap-2",
	"whitespace-nowrap",
	// Shape
	"rounded-md",
	// Typography
	"text-sm",
	"font-medium",
	// Interaction
	"outline-none",
	"transition-[color,box-shadow]",
	// Hover
	"hover:bg-bg-tertiary",
	"hover:text-text-secondary",
	// Pressed/On state
	"data-[state=on]:bg-bg-secondary",
	"data-[state=on]:text-text-primary",
	// Disabled
	"disabled:pointer-events-none",
	"disabled:opacity-50",
	// SVG icons
	"[&_svg]:pointer-events-none",
	"[&_svg:not([class*='size-'])]:size-4",
	"[&_svg]:shrink-0",
	// Focus
	"focus-visible:ring-2",
	"focus-visible:ring-utility-blue/70",
	// Invalid
	"aria-invalid:ring-2",
	"aria-invalid:ring-utility-red/70",
	"aria-invalid:border-border-error",
);

const toggleVariants = cva(baseToggleStyles, {
	variants: {
		variant: {
			default: cn("bg-transparent"),
			outline: cn(
				"border",
				"border-border-primary",
				"bg-transparent",
				"shadow-xs",
				"hover:bg-bg-secondary",
				"hover:text-text-primary",
			),
		},
		size: {
			default: cn("h-9", "px-2", "min-w-9"),
			sm: cn("h-8", "px-1.5", "min-w-8"),
			lg: cn("h-10", "px-2.5", "min-w-10"),
		},
	},
	defaultVariants: {
		variant: "default",
		size: "default",
	},
});

function Toggle({
	className,
	variant,
	size,
	...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
	VariantProps<typeof toggleVariants>) {
	return (
		<TogglePrimitive.Root
			data-slot="toggle"
			className={cn(toggleVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Toggle, toggleVariants };
