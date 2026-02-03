"use client";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon, MinusIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Checkbox root styles
const baseCheckboxStyles = cn(
	// Layout
	"peer",
	"shrink-0",
	// Shape
	"rounded-[4px]",
	// Interaction
	"outline-none",
	"cursor-pointer",
	// Animation
	"transition-all",
	"duration-200",
	"active:scale-90",
	"active:duration-75",
	// Default state
	"bg-white",
	"border-border-dark",
	// Checked state
	"data-[state=checked]:bg-[var(--color-fg-link)]",
	"data-[state=checked]:border-[var(--color-fg-link)]",
	"data-[state=checked]:text-white",
	// Indeterminate state
	"data-[state=indeterminate]:bg-[var(--color-fg-link)]",
	"data-[state=indeterminate]:border-[var(--color-fg-link)]",
	"data-[state=indeterminate]:text-white",
	// Disabled states
	"disabled:cursor-not-allowed",
	"disabled:active:scale-100",
	"disabled:bg-white",
	"disabled:border-[var(--color-fg-disabled)]",
	"disabled:data-[state=checked]:bg-[var(--color-fg-disabled)]",
	"disabled:data-[state=checked]:border-[var(--color-fg-disabled)]",
	"disabled:data-[state=checked]:text-[var(--color-fg-secondary)]",
	"disabled:data-[state=indeterminate]:bg-[var(--color-fg-disabled)]",
	"disabled:data-[state=indeterminate]:border-[var(--color-fg-disabled)]",
	"disabled:data-[state=indeterminate]:text-[var(--color-fg-secondary)]",
	// Focus styles
	"focus-visible:ring-4",
	"focus-visible:ring-ring-blue",
	"focus-visible:border-border-link",
	// Hover styles
	"disabled:hover:ring-0",
);

const checkboxVariants = cva(baseCheckboxStyles, {
	variants: {
		size: {
			regular: "size-5 border-2",
			small: "size-4 border",
		},
	},
	defaultVariants: {
		size: "regular",
	},
});

// Checkbox indicator styles
const checkboxIndicatorStyles = cn(
	// Layout
	"flex",
	"items-center",
	"justify-center",
	// Colors
	"text-white",
	"disabled:text-[var(--color-fg-secondary)]",
);

function Checkbox({
	className,
	size,
	...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> &
	VariantProps<typeof checkboxVariants>) {
	return (
		<CheckboxPrimitive.Root
			data-slot="checkbox"
			className={cn(checkboxVariants({ size }), className)}
			{...props}
		>
			<CheckboxPrimitive.Indicator
				data-slot="checkbox-indicator"
				className={checkboxIndicatorStyles}
			>
				{props.checked === "indeterminate" ? (
					<MinusIcon
						className={cn(size === "small" ? "size-2.5" : "size-3.5")}
						style={{ strokeWidth: 3 }}
					/>
				) : (
					<CheckIcon
						className={cn(size === "small" ? "size-2.5" : "size-3.5")}
						style={{ strokeWidth: 3 }}
					/>
				)}
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}

export { Checkbox };
