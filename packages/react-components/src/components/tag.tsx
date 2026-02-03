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
			big: cn("gap-1", "typo-body"),
			small: cn("gap-1", "typo-body-xs"),
		},
		type: {
			filled: "",
			outlined: "border bg-transparent",
		},
		vibrance: {
			vivid: "",
			subtle: "",
		},
		color: {
			green: "",
			gray: "",
			red: "",
			blue: "",
			yellow: "",
			contrast: "",
		},
	},
	compoundVariants: [
		// ============ SIZE + TYPE (padding compensation for border) ============
		{
			size: "big",
			type: "filled",
			class: "px-3 py-1",
		},
		{
			size: "big",
			type: "outlined",
			class: "px-[11px] py-[3px]",
		},
		{
			size: "small",
			type: "filled",
			class: "px-2 h-[22px]",
		},
		{
			size: "small",
			type: "outlined",
			class: "px-[7px] h-[22px]",
		},

		// ============ FILLED VIVID ============
		{
			type: "filled",
			color: "red",
			vibrance: "vivid",
			class: "bg-bg-error-primary_inverse text-fg-primary_on-brand",
		},
		{
			type: "filled",
			color: "yellow",
			vibrance: "vivid",
			class: "bg-bg-warning-primary_inverse text-fg-warning-primary",
		},
		{
			type: "filled",
			color: "green",
			vibrance: "vivid",
			class: "bg-fg-success-primary text-fg-primary_on-brand",
		},
		{
			type: "filled",
			color: "blue",
			vibrance: "vivid",
			class: "bg-bg-link text-fg-primary_on-brand",
		},
		{
			type: "filled",
			color: "gray",
			vibrance: "vivid",
			class: "bg-fg-tertiary text-fg-primary_on-brand",
		},
		{
			type: "filled",
			color: "contrast",
			vibrance: "vivid",
			class: "bg-bg-primary_inverse text-fg-primary_on-brand",
		},

		// ============ FILLED SUBTLE ============
		{
			type: "filled",
			color: "red",
			vibrance: "subtle",
			class: "bg-bg-error-tertiary text-fg-error-primary",
		},
		{
			type: "filled",
			color: "yellow",
			vibrance: "subtle",
			class: "bg-bg-warning-secondary text-fg-warning-primary",
		},
		{
			type: "filled",
			color: "green",
			vibrance: "subtle",
			class: "bg-bg-success-secondary text-fg-success-primary",
		},
		{
			type: "filled",
			color: "blue",
			vibrance: "subtle",
			class: "bg-bg-info-primary text-fg-info-primary",
		},
		{
			type: "filled",
			color: "gray",
			vibrance: "subtle",
			class: "bg-bg-tertiary text-text-secondary",
		},
		{
			type: "filled",
			color: "contrast",
			vibrance: "subtle",
			class: "bg-bg-tertiary text-fg-primary",
		},

		// ============ OUTLINED (only vivid) ============
		{
			type: "outlined",
			color: "red",
			class: "border-border-error text-text-error-primary",
		},
		{
			type: "outlined",
			color: "yellow",
			class: "border-fg-warning-primary text-text-warning-primary",
		},
		{
			type: "outlined",
			color: "green",
			class: "border-border-success text-text-success-primary",
		},
		{
			type: "outlined",
			color: "blue",
			class: "border-border-link text-text-link",
		},
		{
			type: "outlined",
			color: "gray",
			class: "border-border-primary_hover text-fg-secondary",
		},
		{
			type: "outlined",
			color: "contrast",
			class: "border-border-primary_hover text-fg-primary",
		},
	],
	defaultVariants: {
		shape: "round",
		size: "big",
		type: "filled",
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
	type = "filled",
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
			className={cn(
				tagVariants({ shape, size, type, vibrance, color }),
				className,
			)}
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
