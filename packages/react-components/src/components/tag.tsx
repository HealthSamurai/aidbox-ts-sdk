import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";
import { cn } from "../shadcn/lib/utils";

const baseChipStyles = cn(
	"inline-flex",
	"items-center",
	"justify-center",
	"whitespace-nowrap",
	"shrink-0",
	"[&>svg]:pointer-events-none",
	"[&>svg]:shrink-0",
	"transition-colors",
	"duration-200",
);

const iconBaseClasses = cn(
	"flex",
	"items-center",
	"justify-center",
	"shrink-0",
	"[&>svg]:pointer-events-none",
	"[&>svg]:shrink-0",
);

const iconSizeClasses = {
	big: cn("[&>svg]:size-4"),
	small: cn("[&>svg]:w-3", "[&>svg]:h-3"),
};

const tagVariants = cva(baseChipStyles, {
	variants: {
		shape: {
			round: "rounded-full",
			square: "rounded",
		},
		size: {
			big: cn("gap-1", "px-3", "py-1", "typo-body"),
			small: cn("gap-1", "px-2", "h-[22px]", "typo-body-xs"),
		},
		vibrance: {
			vivid: "",
			subtle: "",
		},
		color: {
			green: "",
			gray: "",
			red: "",
			bright: "",
			blue: "",
			yellow: "",
		},
	},
	compoundVariants: [
		// Green variants
		{
			color: "green",
			vibrance: "vivid",
			class: "bg-[var(--color-tag-green-vivid-bg)] text-text-primary_on-brand",
		},
		{
			color: "green",
			vibrance: "subtle",
			class:
				"bg-[var(--color-tag-green-subtle-bg)] text-[var(--color-tag-green-subtle-text)]",
		},
		// Gray variants
		{
			color: "gray",
			vibrance: "vivid",
			class: "bg-[var(--color-tag-gray-vivid-bg)] text-text-primary_on-brand",
		},
		{
			color: "gray",
			vibrance: "subtle",
			class: "bg-[var(--color-tag-gray-subtle-bg)] text-text-primary",
		},
		// Red variants
		{
			color: "red",
			vibrance: "vivid",
			class: "bg-[var(--color-tag-red-vivid-bg)] text-text-primary_on-brand",
		},
		{
			color: "red",
			vibrance: "subtle",
			class:
				"bg-[var(--color-tag-red-subtle-bg)] text-[var(--color-tag-red-subtle-text)]",
		},
		// Bright variants (removed, not in Figma)
		{
			color: "bright",
			vibrance: "vivid",
			class: "bg-bg-quaternary text-text-primary_on-brand",
		},
		{
			color: "bright",
			vibrance: "subtle",
			class: "bg-bg-tertiary text-text-tertiary",
		},
		// Blue variants
		{
			color: "blue",
			vibrance: "vivid",
			class: "bg-[var(--color-tag-blue-vivid-bg)] text-text-primary_on-brand",
		},
		{
			color: "blue",
			vibrance: "subtle",
			class:
				"bg-[var(--color-tag-blue-subtle-bg)] text-[var(--color-tag-blue-subtle-text)]",
		},
		// Yellow variants
		{
			color: "yellow",
			vibrance: "vivid",
			class:
				"bg-[var(--color-tag-yellow-vivid-bg)] text-[var(--color-tag-yellow-vivid-text)]",
		},
		{
			color: "yellow",
			vibrance: "subtle",
			class:
				"bg-[var(--color-tag-yellow-subtle-bg)] text-[var(--color-tag-yellow-subtle-text)]",
		},
	],
	defaultVariants: {
		shape: "round",
		size: "big",
		vibrance: "vivid",
		color: "green",
	},
});

export type TagProps = {
	icon?: React.ReactNode;
	showIcon?: boolean;
} & Omit<React.ComponentProps<"div">, "color"> &
	VariantProps<typeof tagVariants>;

export function Tag({
	children,
	shape,
	size = "big",
	vibrance = "vivid",
	color,
	icon,
	showIcon = true,
	className,
	...props
}: TagProps) {
	const shouldShowIcon = showIcon && icon;
	const currentSize: "big" | "small" = size ?? "big";

	return (
		<div
			data-slot="tag"
			className={cn(tagVariants({ shape, size, vibrance, color }), className)}
			{...props}
		>
			{shouldShowIcon && (
				<div className={cn(iconBaseClasses, iconSizeClasses[currentSize])}>
					{icon}
				</div>
			)}
			<span>{children}</span>
		</div>
	);
}
