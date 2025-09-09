"use client";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Scroll area viewport styles
const scrollAreaViewportStyles = cn(
	"size-full",
	"rounded-[inherit]",
	"transition-[color,box-shadow]",
	"outline-none",
	"focus-visible:ring-2",
	"focus-visible:ring-utility-blue/70",
	"focus-visible:outline-1",
);

// Scroll bar base styles
const scrollBarBaseStyles = cn(
	"flex",
	"touch-none",
	"p-px",
	"transition-colors",
	"select-none",
);

// Scroll bar thumb styles
const scrollBarThumbStyles = cn(
	"bg-border-primary",
	"relative",
	"flex-1",
	"rounded-full",
);

function ScrollArea({
	className,
	children,
	...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
	return (
		<ScrollAreaPrimitive.Root
			data-slot="scroll-area"
			className={cn("relative", className)}
			{...props}
		>
			<ScrollAreaPrimitive.Viewport
				data-slot="scroll-area-viewport"
				className={scrollAreaViewportStyles}
			>
				{children}
			</ScrollAreaPrimitive.Viewport>
			<ScrollBar />
			<ScrollAreaPrimitive.Corner />
		</ScrollAreaPrimitive.Root>
	);
}

function ScrollBar({
	className,
	orientation = "vertical",
	...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
	return (
		<ScrollAreaPrimitive.ScrollAreaScrollbar
			data-slot="scroll-area-scrollbar"
			orientation={orientation}
			className={cn(
				scrollBarBaseStyles,
				orientation === "vertical" &&
					cn("h-full", "w-2.5", "border-l", "border-l-transparent"),
				orientation === "horizontal" &&
					cn("h-2.5", "flex-col", "border-t", "border-t-transparent"),
				className,
			)}
			{...props}
		>
			<ScrollAreaPrimitive.ScrollAreaThumb
				data-slot="scroll-area-thumb"
				className={scrollBarThumbStyles}
			/>
		</ScrollAreaPrimitive.ScrollAreaScrollbar>
	);
}

export { ScrollArea, ScrollBar };
