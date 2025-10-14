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
	"px-2",
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
		},
		subtle: {
			true: "",
			false: "",
		},
	},
	compoundVariants: [
		{
			color: "green",
			subtle: false,
			class: "bg-bg-success-primary_inverse text-text-primary_on-brand",
		},
		{
			color: "green",
			subtle: true,
			class: "bg-bg-success-secondary text-text-success-primary",
		},
		{
			color: "gray",
			subtle: false,
			class: "bg-fg-secondary text-text-primary_on-brand",
		},
		{
			color: "gray",
			subtle: true,
			class: "bg-bg-tertiary text-text-secondary",
		},
		{
			color: "red",
			subtle: false,
			class: "bg-bg-error-primary_inverse text-text-primary_on-brand",
		},
		{
			color: "red",
			subtle: true,
			class: "bg-bg-error-tertiary text-text-error-primary",
		},
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
		{
			color: "blue",
			subtle: false,
			class: "bg-bg-link text-text-primary_on-brand",
		},
		{
			color: "blue",
			subtle: true,
			class: "bg-bg-brand-secondary text-text-link",
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
