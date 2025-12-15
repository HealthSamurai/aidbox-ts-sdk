import type React from "react";
import { cn } from "#shadcn/lib/utils";

// Styles
const iconButtonBaseStyles = cn(
	// Layout
	"flex",
	"items-center",
	"justify-center",
	// Spacing
	"p-1",
	// Size
	"size-8",
	// Shape
	"rounded",
	// Interaction
	"cursor-pointer",
	"transition-colors",
	"duration-200",
	// Colors
	"text-text-tertiary",
	"hover:text-text-secondary",
	"hover:bg-bg-secondary",
	// SVG
	"[&>svg]:size-4",
	"[&>svg]:pointer-events-none",
	"[&>svg]:shrink-0",
);

export interface IconButtonProps
	extends Omit<React.ComponentProps<"button">, "children"> {
	icon: React.ReactNode;
	"aria-label": string;
}

function IconButton({ icon, className, ...props }: IconButtonProps) {
	return (
		<button
			type="button"
			data-slot="icon-button"
			className={cn(iconButtonBaseStyles, className)}
			{...props}
		>
			{icon}
		</button>
	);
}

export { IconButton };
