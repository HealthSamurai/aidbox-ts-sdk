"use client";
import * as LabelPrimitive from "@radix-ui/react-label";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Label styles
const labelStyles = cn(
	// Layout
	"flex",
	"items-center",
	"gap-2",
	// Typography
	"text-text-primary",
	"body14",
	"leading-none",
	// Interaction
	"select-none",
	// Group disabled states
	"group-data-[disabled=true]:pointer-events-none",
	"group-data-[disabled=true]:opacity-50",
	// Peer disabled states
	"peer-disabled:cursor-not-allowed",
	"peer-disabled:opacity-50",
);

function Label({
	className,
	...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
	return (
		<LabelPrimitive.Root
			data-slot="label"
			className={cn(labelStyles, className)}
			{...props}
		/>
	);
}

export { Label };
