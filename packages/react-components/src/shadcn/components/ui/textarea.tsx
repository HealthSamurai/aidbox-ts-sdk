import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

const textareaVariants = cva(
	cn(
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
		// Disabled
		"disabled:cursor-not-allowed",
		"disabled:bg-bg-secondary",
		"disabled:border-border-primary",
		"disabled:text-text-disabled",
		"disabled:placeholder:text-text-disabled",
	),
	{
		variants: {
			invalid: {
				true: cn(
					// Invalid border colors
					"border-border-error",
					"hover:border-border-error_inverse",
					// Invalid focus states
					"focus-visible:ring-4",
					"focus-visible:ring-ring-red",
					"focus-visible:border-border-error",
					// Transitions
					"transition-all",
					"duration-300",
				),
			},
		},
		defaultVariants: {
			invalid: false,
		},
	},
);

interface TextareaProps
	extends React.ComponentProps<"textarea">,
		VariantProps<typeof textareaVariants> {
	invalid?: boolean;
}

function Textarea({ className, invalid, ...props }: TextareaProps) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(textareaVariants({ invalid }), className)}
			aria-invalid={invalid}
			{...props}
		/>
	);
}

export { Textarea };
