"use client";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Separator styles
const separatorStyles = cn(
	// Background
	"bg-border-separator",
	// Layout
	"shrink-0",
	// Horizontal orientation
	"data-[orientation=horizontal]:h-px",
	"data-[orientation=horizontal]:w-full",
	// Vertical orientation
	"data-[orientation=vertical]:h-full",
	"data-[orientation=vertical]:w-px",
);

function Separator({
	className,
	orientation = "horizontal",
	decorative = true,
	...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
	return (
		<SeparatorPrimitive.Root
			data-slot="separator"
			decorative={decorative}
			orientation={orientation}
			className={cn(separatorStyles, className)}
			{...props}
		/>
	);
}

export { Separator };
