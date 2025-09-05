"use client";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon, MinusIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

function Checkbox({
	className,
	...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
	return (
		<CheckboxPrimitive.Root
			data-slot="checkbox"
			className={cn(
				// Base styles
				"peer",
				"size-5",
				"shrink-0",
				"rounded-md",
				"border-[1.5px]",
				"transition-all",
				"duration-200",
				"outline-none",
				"cursor-pointer",
				"text-white",
				// Click animation
				"active:scale-90",
				"active:duration-75",
				// Default state
				"border-border-primary",
				"bg-transparent",
				"hover:bg-bg-tertiary",
				// Checked state
				"data-[state=checked]:bg-bg-link",
				"data-[state=checked]:border-border-link",
				"data-[state=checked]:text-white",
				// Indeterminate state
				"data-[state=indeterminate]:bg-fg-link",
				"data-[state=indeterminate]:border-fg-link",
				"data-[state=indeterminate]:text-white",
				// Disabled states
				"disabled:cursor-not-allowed",
				"disabled:active:scale-100",
				"disabled:border-border-secondary",
				"disabled:bg-transparent",
				"disabled:data-[state=checked]:bg-fg-tertiary",
				"disabled:data-[state=checked]:border-fg-tertiary",
				"disabled:data-[state=indeterminate]:bg-fg-tertiary",
				"disabled:data-[state=indeterminate]:border-fg-tertiary",
				// Focus state
				"focus-visible:ring-2",
				"focus-visible:ring-utility-blue/70",
				className,
			)}
			{...props}
		>
			<CheckboxPrimitive.Indicator
				data-slot="checkbox-indicator"
				className="flex items-center justify-center text-white"
			>
				{props.checked === "indeterminate" ? (
					<MinusIcon className="size-3.5" style={{ strokeWidth: 3 }} />
				) : (
					<CheckIcon className="size-3.5" style={{ strokeWidth: 3 }} />
				)}
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}

export { Checkbox };
