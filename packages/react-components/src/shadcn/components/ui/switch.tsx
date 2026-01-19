"use client";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Switch root base styles
const baseSwitchRootStyles = cn(
	// Layout
	"peer",
	"inline-flex",
	"items-center",
	"shrink-0",
	// Shape
	"rounded-full",
	"border",
	"border-transparent",
	// Interaction
	"transition-all",
	"outline-none",
	"cursor-pointer",
	// States
	"data-[state=unchecked]:bg-bg-quaternary",
	"data-[state=checked]:bg-bg-link",
	"hover:data-[state=unchecked]:bg-bg-disabled/70",
	"hover:data-[state=checked]:bg-bg-link_hover",
	// Focus
	"focus-visible:ring-2",
	"focus-visible:ring-utility-blue/70",
	// Disabled
	"disabled:cursor-not-allowed",
	"disabled:hover:data-[state=unchecked]:bg-bg-disabled",
	"disabled:hover:data-[state=checked]:bg-bg-link_disabled",
	"disabled:data-[state=checked]:bg-bg-link_disabled",
	"disabled:data-[state=unchecked]:bg-bg-disabled",
);

const switchRootVariants = cva(baseSwitchRootStyles, {
	variants: {
		size: {
			regular: cn("h-5", "w-9"),
			small: cn("h-4", "w-7"),
		},
	},
	defaultVariants: {
		size: "regular",
	},
});

// Switch thumb base styles
const baseSwitchThumbStyles = cn(
	// Layout
	"pointer-events-none",
	"block",
	// Shape
	"rounded-full",
	"ring-0",
	// Color
	"bg-bg-primary",
	// Animation
	"transition-transform",
	"data-[state=unchecked]:translate-x-0.5",
	// Border for unchecked state
	"border",
	"border-transparent",
	"data-[state=unchecked]:border-border-secondary",
);

const switchThumbVariants = cva(baseSwitchThumbStyles, {
	variants: {
		size: {
			regular: cn("size-4", "data-[state=checked]:translate-x-[1.125rem]"),
			small: cn("size-3", "data-[state=checked]:translate-x-[0.875rem]"),
		},
	},
	defaultVariants: {
		size: "regular",
	},
});

function Switch({
	className,
	size,
	disabled,
	...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> &
	VariantProps<typeof switchRootVariants>) {
	return (
		<SwitchPrimitive.Root
			data-slot="switch"
			className={cn(switchRootVariants({ size }), className)}
			disabled={disabled}
			{...props}
		>
			<SwitchPrimitive.Thumb
				data-slot="switch-thumb"
				className={switchThumbVariants({ size })}
			/>
		</SwitchPrimitive.Root>
	);
}

export { Switch };
