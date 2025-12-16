import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";
import { cn } from "../shadcn/lib/utils";

const baseChipStyles = cn(
	"inline-flex",
	"items-center",
	"justify-center",
	"gap-1",
	"whitespace-nowrap",
	"shrink-0",
	"px-3",
	"py-1",
	"typo-body",
	"[&>svg]:size-4",
	"[&>svg]:pointer-events-none",
	"[&>svg]:shrink-0",
	"transition-colors",
	"duration-200",
);

const iconBaseClasses = cn(
	"flex",
	"items-center",
	"justify-center",
	"size-4",
	"shrink-0",
	"[&>svg]:size-4",
	"[&>svg]:pointer-events-none",
	"[&>svg]:shrink-0",
);

const tagVariants = cva(baseChipStyles, {
	variants: {
		type: {
			round: "rounded-full",
			square: "rounded",
		},
		color: {
			green: "",
			gray: "",
			red: "",
			bright: "",
			blue: "",
			yellow: "",
		},
		subtle: {
			true: "",
			false: "",
		},
	},
	compoundVariants: [
		// Green variants
		{
			color: "green",
			subtle: false,
			class: "bg-[var(--color-green-500)] text-text-primary_on-brand",
		},
		{
			color: "green",
			subtle: true,
			class: "bg-[var(--color-green-300)] text-[var(--color-green-700)]",
		},
		// Gray variants
		{
			color: "gray",
			subtle: false,
			class: "bg-[var(--color-grey-500)] text-text-primary_on-brand",
		},
		{
			color: "gray",
			subtle: true,
			class: "bg-[var(--color-grey-100)] text-text-primary",
		},
		// Red variants
		{
			color: "red",
			subtle: false,
			class: "bg-[var(--color-red-500)] text-text-primary_on-brand",
		},
		{
			color: "red",
			subtle: true,
			class: "bg-[var(--color-red-200)] text-[var(--color-red-700)]",
		},
		// Bright variants (removed, not in Figma)
		{
			color: "bright",
			subtle: false,
			class: "bg-bg-quaternary text-text-primary_on-brand",
		},
		{
			color: "bright",
			subtle: true,
			class: "bg-bg-tertiary text-text-tertiary",
		},
		// Blue variants
		{
			color: "blue",
			subtle: false,
			class: "bg-[var(--color-blue-500)] text-text-primary_on-brand",
		},
		{
			color: "blue",
			subtle: true,
			class: "bg-[var(--color-blue-300)] text-[var(--color-blue-600)]",
		},
		// Yellow variants
		{
			color: "yellow",
			subtle: false,
			class: "bg-[var(--color-yellow-500)] text-[var(--color-yellow-900)]",
		},
		{
			color: "yellow",
			subtle: true,
			class: "bg-[var(--color-yellow-300)] text-[var(--color-yellow-800)]",
		},
	],
	defaultVariants: {
		type: "round",
		color: "green",
		subtle: false,
	},
});

export type TagProps = {
	icon?: React.ReactNode;
	showIcon?: boolean;
} & Omit<React.ComponentProps<"div">, "color"> &
	VariantProps<typeof tagVariants>;

export function Tag({
	children,
	type,
	color,
	subtle,
	icon,
	showIcon = true,
	className,
	...props
}: TagProps) {
	const shouldShowIcon = showIcon && icon;

	return (
		<div
			data-slot="tag"
			className={cn(tagVariants({ type, color, subtle }), className)}
			{...props}
		>
			{shouldShowIcon && <div className={iconBaseClasses}>{icon}</div>}
			<span>{children}</span>
		</div>
	);
}
