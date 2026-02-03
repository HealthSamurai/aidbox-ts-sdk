"use client";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Radio group root styles
const radioGroupStyles = cn(
	// Layout
	"grid",
	"gap-3",
);

// Radio group item base styles
const baseRadioGroupItemStyles = cn(
	// Layout
	"aspect-square",
	"shrink-0",
	"relative",
	// Shape
	"rounded-full",
	"overflow-hidden",
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
	"border-[1.5px]",
	"border-solid",
	"border-border-primary",
	// Checked state
	"data-[state=checked]:bg-bg-link",
	"data-[state=checked]:border-bg-link",
	// Disabled states
	"disabled:cursor-not-allowed",
	"disabled:active:scale-100",
	"disabled:bg-white",
	"disabled:border-border-secondary",
	"disabled:data-[state=checked]:bg-border-secondary",
	"disabled:data-[state=checked]:border-border-secondary",
	// Focus styles
	"focus-visible:ring-4",
	"focus-visible:ring-ring-blue",
	"focus-visible:data-[state=unchecked]:border-bg-link",
);

const radioGroupItemVariants = cva(baseRadioGroupItemStyles, {
	variants: {
		size: {
			regular: "size-5",
			small: "size-4",
		},
	},
	defaultVariants: {
		size: "regular",
	},
});

// Radio group indicator styles
const radioGroupIndicatorStyles = cn(
	// Layout
	"absolute",
	"inset-0",
	"flex",
	"items-center",
	"justify-center",
);

function RadioGroup({
	className,
	...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
	return (
		<RadioGroupPrimitive.Root
			data-slot="radio-group"
			className={cn(radioGroupStyles, className)}
			{...props}
		/>
	);
}

function RadioGroupItem({
	className,
	size,
	...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> &
	VariantProps<typeof radioGroupItemVariants>) {
	return (
		<RadioGroupPrimitive.Item
			data-slot="radio-group-item"
			className={cn(radioGroupItemVariants({ size }), className)}
			{...props}
		>
			<RadioGroupPrimitive.Indicator
				data-slot="radio-group-indicator"
				className={radioGroupIndicatorStyles}
			>
				<div
					className={cn(
						// Shape
						"rounded-full",
						// Colors
						"bg-white",
						// Size based on variant
						size === "small" ? "size-1.5" : "size-2",
					)}
				/>
			</RadioGroupPrimitive.Indicator>
		</RadioGroupPrimitive.Item>
	);
}

export { RadioGroup, RadioGroupItem };
