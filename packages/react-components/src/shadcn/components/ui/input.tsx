import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

const iconBaseClasses =
	"absolute top-1/2 -translate-y-1/2 cursor-pointer z-10 flex items-center justify-center [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0";

const iconLeftPosition =
	"left-3 hover:text-text-tertiary hover:cursor-default transition-colors duration-300";

const iconRightContainer =
	"absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 z-10";

const iconNormalColor =
	"text-text-tertiary hover:text-fg-secondary transition-colors duration-300";
const iconInvalidColor =
	"text-fg-tertiary hover:text-fg-secondary transition-colors duration-300";
const iconDisabledColor =
	"text-text-disabled hover:cursor-not-allowed transition-colors duration-300";

const iconWrapperClasses = "[&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-[1.5]";

const iconRightItemClasses =
	"cursor-pointer flex items-center justify-center transition-colors duration-300";

const suffixClasses =
	"border-border-primary bg-bg-tertiary text-text-tertiary flex items-center rounded-r-md border px-3 py-1 typo-body cursor-default transition-colors duration-300";

const suffixDisabledClasses =
	"border-border-primary bg-bg-tertiary text-text-disabled flex items-center rounded-r-md border px-3 py-1 typo-body hover:cursor-not-allowed transition-colors duration-300";

const suffixInvalidClasses =
	"border-border-error bg-bg-secondary flex items-center rounded-r-md border px-3 py-1 text-text-tertiary typo-body cursor-default transition-colors duration-300";

const inputVariants = cva(
	cn(
		"h-9 file:text-text-primary placeholder:text-text-quternary disabled:placeholder:text-text-disabled selection:bg-bg-primary selection:text-text-primary-foreground border-border-primary hover:border-border-primary_hover flex w-full min-w-0 border bg-transparent px-3 py-2 typo-body text-base transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-md file:font-medium disabled:bg-bg-secondary disabled:cursor-not-allowed disabled:border-border-primary md:text-md selection:bg-selection",
		"focus-visible:ring-4 focus-visible:ring-ring-blue focus-visible:border-border-link",
		"aria-invalid:ring-destructive aria-invalid:text-text-error-primary aria-invalid:border-border-error-primary",
		"",
		"rounded-md",
	),
	{
		variants: {
			hasLeftSlot: {
				true: "pl-9",
			},
			hasRightSlot: {
				true: "pr-9",
			},
			hasSuffix: {
				true: "border-r-0 focus-visible:ring-offset-0 rounded-l-md rounded-r-none focus-visible:border-r-1",
			},
			invalid: {
				true: "border-border-error focus-visible:ring-4 focus-visible:ring-ring-red focus-visible:border-border-error hover:border-border-error_inverse transition-all duration-300",
			},
		},
		defaultVariants: {
			hasSuffix: false,
			invalid: false,
		},
	},
);

interface InputProps
	extends React.ComponentProps<"input">,
		VariantProps<typeof inputVariants> {
	type?: "text" | "password";
	suffix?: string;
	invalid?: boolean;
	leftSlot?: React.ReactNode;
	rightSlot?: React.ReactNode;
}

function Input({
	className,
	type,
	invalid,
	suffix,
	leftSlot,
	rightSlot,
	...props
}: InputProps) {
	const processedLeftSlot = leftSlot === "None" ? undefined : leftSlot;
	const processedRightSlot = rightSlot === "None" ? undefined : rightSlot;

	const hasLeftIcon =
		processedLeftSlot &&
		processedLeftSlot !== null &&
		processedLeftSlot !== undefined;
	const hasRightIcon =
		processedRightSlot &&
		processedRightSlot !== null &&
		processedRightSlot !== undefined;

	const renderLeftSlot = () => {
		if (!hasLeftIcon) return null;
		const colorClasses = props.disabled
			? iconDisabledColor
			: invalid
				? iconInvalidColor
				: iconNormalColor;
		return (
			<div className={`${iconBaseClasses} ${iconLeftPosition} ${colorClasses}`}>
				<div className={iconWrapperClasses}>{processedLeftSlot}</div>
			</div>
		);
	};

	const renderRightSlot = () => {
		if (!hasRightIcon) return null;

		const colorClasses = props.disabled
			? iconDisabledColor
			: invalid
				? iconInvalidColor
				: iconNormalColor;

		return (
			<div className={`${iconRightContainer} ${iconBaseClasses}`}>
				{hasRightIcon && (
					<div className={`${iconRightItemClasses} ${colorClasses}`}>
						<div className={iconWrapperClasses}>{processedRightSlot}</div>
					</div>
				)}
			</div>
		);
	};

	// Input tag
	const inputElement = (
		<input
			type={type}
			data-slot="input"
			className={cn(
				inputVariants({
					invalid,
					hasLeftSlot: !!leftSlot,
					hasRightSlot: !!rightSlot,
					hasSuffix: !!suffix,
					className,
				}),
			)}
			{...props}
		/>
	);

	return (
		<div className="flex w-full min-w-0">
			<div className="flex-1 relative">
				{renderLeftSlot()}
				{inputElement}
				{renderRightSlot()}
			</div>
			{suffix && (
				<div
					className={
						props.disabled
							? suffixDisabledClasses
							: invalid
								? suffixInvalidClasses
								: suffixClasses
					}
				>
					{suffix}
				</div>
			)}
		</div>
	);
}

export { Input, inputVariants };
