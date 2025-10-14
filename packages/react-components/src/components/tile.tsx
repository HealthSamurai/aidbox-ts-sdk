import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";
import { cn } from "../shadcn/lib/utils";

const baseTileStyles = cn(
	"flex",
	"flex-col",
	"items-start",
	"gap-2",
	"p-6",
	"bg-bg-primary",
	"rounded-lg",
	"border",
	"border-border-default",
	"transition-colors",
	"duration-200",
);

const tileSizeVariants = cva("", {
	variants: {
		size: {
			auto: "w-auto",
			free: "w-full",
		},
	},
	defaultVariants: {
		size: "auto",
	},
});

const contentStyles = cn("flex", "flex-col", "items-start", "w-full");

const labelStyles = cn("typo-body", "text-text-secondary");

const valueStyles = cn("typo-page-header", "text-text-primary");

const iconStyles = cn(
	"flex",
	"items-center",
	"justify-center",
	"size-12",
	"shrink-0",
	"rounded-full",
	"bg-bg-tertiary",
	"text-fg-secondary",
	"[&>svg]:size-6",
	"[&>svg]:pointer-events-none",
	"[&>svg]:shrink-0",
);

const iconContainerStyles = cn("flex", "items-center", "gap-3", "w-full");

export type TileProps = {
	label?: string;
	value?: string | number;
	icon?: React.ReactNode;
	showIcon?: boolean;
	width?: string | number;
} & Omit<React.ComponentProps<"div">, "size"> &
	VariantProps<typeof tileSizeVariants>;

export function Tile({
	children,
	label,
	value,
	icon,
	showIcon = false,
	size = "auto",
	width,
	className,
	style,
	...props
}: TileProps) {
	const shouldShowIcon = showIcon && icon;
	const tileStyle = width ? { ...style, width } : style;

	return (
		<div
			data-slot="tile"
			className={cn(baseTileStyles, tileSizeVariants({ size }), className)}
			style={tileStyle}
			{...props}
		>
			<div className={contentStyles}>
				{shouldShowIcon ? (
					<div className={iconContainerStyles}>
						<div className={iconStyles}>{icon}</div>
						<div className="flex flex-col items-start w-full">
							{label && <div className={labelStyles}>{label}</div>}
							{value !== undefined && (
								<div className={valueStyles}>{value}</div>
							)}
						</div>
					</div>
				) : (
					<>
						{label && <div className={labelStyles}>{label}</div>}
						{value !== undefined && <div className={valueStyles}>{value}</div>}
					</>
				)}
				{children}
			</div>
		</div>
	);
}
