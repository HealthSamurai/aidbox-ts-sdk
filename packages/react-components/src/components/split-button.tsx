import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";
import { cn } from "#shadcn/lib/utils";

const splitButtonBaseStyles = cn(
	"flex",
	"*:data-[slot=button]:rounded-r-none",
	"*:data-[slot=dropdown-menu-trigger]:rounded-l-none",
	"*:data-[slot=dropdown-menu-trigger]:border-l-0",
);

const splitButtonVariants = cva(splitButtonBaseStyles, {
	variants: {
		size: {
			regular: cn(
				"*:data-[slot=button]:h-9",
				"*:data-[slot=button]:px-4",
				"*:data-[slot=button]:typo-label",
				"*:data-[slot=dropdown-menu-trigger]:h-9",
				"*:data-[slot=dropdown-menu-trigger]:px-1",
				"*:data-[slot=dropdown-menu-trigger]:py-2",
			),
			small: cn(
				"*:data-[slot=button]:h-6",
				"*:data-[slot=button]:px-2",
				"*:data-[slot=button]:gap-1",
				"*:data-[slot=button]:typo-button-label-xs",
				"*:data-[slot=dropdown-menu-trigger]:h-6",
				"*:data-[slot=dropdown-menu-trigger]:px-1",
				"*:data-[slot=dropdown-menu-trigger]:py-1",
			),
		},
		disabled: {
			true: cn(
				"*:data-[slot=button]:disabled:bg-bg-primary",
				"*:data-[slot=button]:disabled:text-text-disabled",
				"*:data-[slot=button]:disabled:border-border-disabled",
				"*:data-[slot=dropdown-menu-trigger]:disabled:bg-bg-primary",
				"*:data-[slot=dropdown-menu-trigger]:disabled:text-text-disabled",
				"*:data-[slot=dropdown-menu-trigger]:disabled:border-border-disabled",
			),
			false: "",
		},
	},
	defaultVariants: {
		size: "regular",
		disabled: false,
	},
});

export interface SplitButtonProps
	extends Omit<React.ComponentProps<"div">, "children">,
		VariantProps<typeof splitButtonVariants> {
	children: React.ReactNode;
}

function SplitButton({
	children,
	size,
	disabled,
	className,
	...props
}: SplitButtonProps) {
	return (
		<div
			className={cn(splitButtonVariants({ size, disabled }), className)}
			{...props}
		>
			{children}
		</div>
	);
}

export { SplitButton };
