"use client";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Switch root styles
const switchRootStyles = cn(
	// Layout
	"peer",
	"inline-flex",
	"items-center",
	"shrink-0",
	// Size
	"h-[1.15rem]",
	"w-8",
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
	"hover:data-[state=unchecked]:bg-bg-tertiary",
	"hover:data-[state=checked]:bg-bg-link_hover",
	// Focus
	"focus-visible:ring-2",
	"focus-visible:ring-utility-blue/70",
	// Disabled
	"disabled:cursor-not-allowed",
	"disabled:opacity-50",
	"disabled:data-[state=checked]:bg-bg-disabled",
	"disabled:data-[state=unchecked]:bg-bg-disabled",
);

// Switch thumb styles
const switchThumbStyles = cn(
	// Layout
	"pointer-events-none",
	"block",
	// Size
	"size-4",
	// Shape
	"rounded-full",
	"ring-0",
	// Color
	"bg-bg-primary",
	// Animation
	"transition-transform",
	"data-[state=checked]:translate-x-[calc(100%-2px)]",
	"data-[state=unchecked]:translate-x-0",
);

function Switch({
	className,
	...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
	return (
		<SwitchPrimitive.Root
			data-slot="switch"
			className={cn(switchRootStyles, className)}
			{...props}
		>
			<SwitchPrimitive.Thumb
				data-slot="switch-thumb"
				className={switchThumbStyles}
			/>
		</SwitchPrimitive.Root>
	);
}

export { Switch };
