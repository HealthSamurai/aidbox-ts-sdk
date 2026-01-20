"use client";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Popover content styles
const popoverContentStyles = cn(
	// Layout
	"z-50",
	"w-72",
	"origin-(--radix-popover-content-transform-origin)",
	"outline-hidden",
	// Shape
	"rounded-md",
	// Borders
	"border",
	"border-border-separator",
	// Background & Colors
	"bg-bg-primary",
	"text-text-primary",
	// Spacing
	"p-4",
	// Shadow
	"dropdown-menu-shadow",
	// Animations - open
	"data-[state=open]:animate-in",
	"data-[state=open]:fade-in-0",
	"data-[state=open]:zoom-in-95",
	// Animations - closed
	"data-[state=closed]:animate-out",
	"data-[state=closed]:fade-out-0",
	"data-[state=closed]:zoom-out-95",
	// Slide animations
	"data-[side=bottom]:slide-in-from-top-2",
	"data-[side=left]:slide-in-from-right-2",
	"data-[side=right]:slide-in-from-left-2",
	"data-[side=top]:slide-in-from-bottom-2",
);

function Popover({
	...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
	return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
	...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
	return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
	className,
	align = "center",
	sideOffset = 4,
	...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				data-slot="popover-content"
				align={align}
				sideOffset={sideOffset}
				className={cn(popoverContentStyles, className)}
				{...props}
			/>
		</PopoverPrimitive.Portal>
	);
}

function PopoverAnchor({
	...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
	return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
