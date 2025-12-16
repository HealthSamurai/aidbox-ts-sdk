import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Textarea styles
const textareaStyles = cn(
	// Layout
	"flex",
	"w-full",
	"min-h-16",
	"field-sizing-content",
	// Shape
	"rounded-md",
	// Borders
	"border",
	"border-border-primary",
	// Background & Colors
	"bg-transparent",
	"text-base",
	// Spacing
	"px-3",
	"py-2",
	// Typography
	"md:text-sm",
	// Placeholder
	"placeholder:text-text-tertiary",
	// Transitions
	"transition-all",
	"duration-300",
	"outline-none",
	// Hover
	"hover:border-border-primary_hover",
	// Focus
	"focus-visible:border-border-link",
	// Invalid
	"aria-invalid:border-border-error",
	"aria-invalid:ring-2",
	"aria-invalid:ring-utility-red/70",
	// Disabled
	"disabled:cursor-not-allowed",
	"disabled:opacity-50",
	"disabled:border-border-disabled",
);

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(textareaStyles, className)}
			{...props}
		/>
	);
}

export { Textarea };
