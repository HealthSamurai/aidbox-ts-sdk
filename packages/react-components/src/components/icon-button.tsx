import type React from "react";
import { buttonVariants } from "#shadcn/components/ui/button";
import { cn } from "#shadcn/lib/utils";

const iconButtonStyles = cn(
	// Size override for icon-only
	"size-6",
	"p-0",
	// SVG
	"[&>svg]:size-4",
	"[&>svg]:pointer-events-none",
	"[&>svg]:shrink-0",
);

export interface IconButtonProps
	extends Omit<React.ComponentProps<"button">, "children"> {
	icon: React.ReactNode;
	"aria-label": string;
	variant?: "ghost" | "link";
}

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
			className={cn(
				buttonVariants({ variant, size: "small" }),
				iconButtonStyles,
				className,
			)}
			{...props}
		>
			{icon}
		</button>
	);
}

export { IconButton };
