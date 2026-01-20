import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

const baseButtonStyles = cn(
	// Layout
	"inline-flex",
	"items-center",
	"justify-center",
	"gap-2",
	"whitespace-nowrap",
	"shrink-0",
	// Shape
	"rounded-lg",
	// Interaction
	"transition-all",
	"outline-none",
	"cursor-pointer",
	// Disabled states
	"disabled:cursor-not-allowed",
	// Icon styles
	"[&_svg]:pointer-events-none",
	"[&_svg:not([class*='size-'])]:size-4",
	"[&_svg]:shrink-0",
	// Focus states
	// Invalid states
	"aria-invalid:ring-2",
	"aria-invalid:ring-utility-red/70",
);

const buttonVariants = cva(baseButtonStyles, {
	variants: {
		variant: {
			primary: cn(
				"bg-bg-link",
				"text-text-primary_on-brand",
				"hover:bg-bg-link_hover",
				"active:bg-bg-link",
			),
			secondary: cn(
				"border",
				"border-border-primary",
				"bg-bg-primary",
				"text-text-secondary",
				"hover:text-text-primary",
				"hover:bg-bg-secondary",
				"active:bg-bg-primary",
				"active:text-text-tertiary",
			),
			link: cn("text-text-secondary", "hover:text-text-primary", "rounded"),
			ghost: cn(
				"text-text-secondary",
				"hover:text-text-primary",
				"hover:bg-bg-secondary",
				"active:bg-bg-tertiary",
			),
		},
		size: {
			regular: cn("h-9", "px-4", "typo-label"),
			small: cn("h-6", "px-2", "gap-1", "typo-button-label-xs"),
		},
		danger: {
			true: "",
			false: "",
		},
	},
	compoundVariants: [
		// Primary disabled
		{
			variant: "primary",
			class: cn("disabled:bg-bg-disabled", "disabled:text-text-white"),
		},
		// Secondary disabled
		{
			variant: "secondary",
			class: cn(
				"disabled:bg-bg-primary",
				"disabled:text-text-disabled",
				"disabled:border-border-disabled",
			),
		},
		// Link disabled
		{
			variant: "link",
			class: cn("disabled:text-text-disabled"),
		},
		// Ghost disabled
		{
			variant: "ghost",
			class: cn("disabled:text-text-disabled"),
		},
		// Primary danger
		{
			variant: "primary",
			danger: true,
			class: cn(
				"bg-bg-error-primary_inverse",
				"text-text-primary_on-brand",
				"hover:bg-bg-error-primary_inverse_hover",
				"active:bg-bg-error-primary_inverse",
			),
		},
		// Secondary danger
		{
			variant: "secondary",
			danger: true,
			class: cn(
				"border-border-error",
				"text-text-error-primary",
				"hover:text-text-error-primary",
				"hover:bg-bg-error-secondary",
				"active:bg-bg-primary",
				"active:text-text-error-primary",
			),
		},
		// Link danger
		{
			variant: "link",
			danger: true,
			class: cn("text-text-error-secondary", "hover:text-text-error-primary"),
		},
		// Ghost danger
		{
			variant: "ghost",
			danger: true,
			class: cn(
				"text-text-error-secondary",
				"hover:text-text-error-primary",
				"hover:bg-bg-error-secondary",
				"active:bg-bg-error-tertiary",
			),
		},
		// Focus ring for regular size
		{
			size: "regular",
			danger: false,
			class: cn("focus-visible:ring-4", "focus-visible:ring-ring-blue"),
		},
		{
			size: "regular",
			danger: true,
			class: cn("focus-visible:ring-4", "focus-visible:ring-ring-red"),
		},
		// Focus ring for small size
		{
			size: "small",
			danger: false,
			class: cn("focus-visible:ring-3", "focus-visible:ring-ring-blue"),
		},
		{
			size: "small",
			danger: true,
			class: cn("focus-visible:ring-3", "focus-visible:ring-ring-red"),
		},
	],
	defaultVariants: {
		variant: "primary",
		size: "regular",
		danger: false,
	},
});

function Button({
	className,
	variant,
	size,
	danger = false,
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
		danger?: boolean;
	}) {
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size, danger, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
