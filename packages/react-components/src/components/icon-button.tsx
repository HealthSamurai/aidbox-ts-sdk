import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";
import { buttonVariants } from "#shadcn/components/ui/button";
import { cn } from "#shadcn/lib/utils";

// Styles
const iconButtonBaseStyles = cn(
	// Size
	"size-6",
	// Spacing
	"p-0",
	// SVG
	"[&>svg]:size-4",
	"[&>svg]:pointer-events-none",
	"[&>svg]:shrink-0",
);

const iconButtonVariants = cva(iconButtonBaseStyles, {
	variants: {
		variant: {
			ghost: buttonVariants({ variant: "ghost", size: "small" }),
			link: buttonVariants({ variant: "link", size: "small" }),
		},
	},
	defaultVariants: {
		variant: "ghost",
	},
});

// Interface
export interface IconButtonProps
	extends Omit<React.ComponentProps<"button">, "children">,
		VariantProps<typeof iconButtonVariants> {
	icon: React.ReactNode;
	"aria-label": string;
}

// Component
function IconButton({
	icon,
	className,
	variant = "ghost",
	...props
}: IconButtonProps) {
	return (
		<button
			type="button"
			data-slot="icon-button"
			className={cn(iconButtonVariants({ variant }), className)}
			{...props}
		>
			{icon}
		</button>
	);
}

export { IconButton, iconButtonVariants };
