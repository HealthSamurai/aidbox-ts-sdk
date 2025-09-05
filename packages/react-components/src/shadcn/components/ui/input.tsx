import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Base icon styles
const iconBaseClasses = cn(
	// Positioning
	"absolute",
	"top-1/2",
	"-translate-y-1/2",
	"z-10",

	// Layout & Flexbox
	"flex",
	"items-center",
	"justify-center",

	// Cursor & Interactions
	"cursor-default",
	"[&_svg]:pointer-events-none",

	// Sizing
	"[&_svg:not([class*='size-'])]:size-4",
	"shrink-0",
	"[&_svg]:shrink-0",
);

// Left icon positioning
const iconLeftPosition = cn(
	// Positioning
	"left-3",

	// Transitions
	"transition-colors",
	"duration-300",
);

// Right icon container
const iconRightContainer = cn(
	// Positioning
	"absolute",
	"right-3",
	"top-1/2",
	"-translate-y-1/2",

	// Layout & Flexbox
	"flex",
	"gap-2",

	// Z-index
	"z-10",
);

// Icon color states
const iconNormalColor = cn(
	// Colors
	"text-text-tertiary",

	// Transitions
	"transition-colors",
	"duration-300",
);

const iconInvalidColor = cn(
	// Colors
	"text-text-tertiary",

	// Transitions
	"transition-colors",
	"duration-300",
);

const iconDisabledColor = cn(
	// Colors
	"text-text-disabled",

	// Cursor & Interactions
	"hover:cursor-not-allowed",

	// Transitions
	"transition-colors",
	"duration-300",
);

// Icon wrapper styles
const iconWrapperClasses = cn(
	// Sizing
	"flex",
	"items-center",
	"[&>svg]:w-full",
	"[&>svg]:h-full",
	"[&>svg]:stroke-[1.5]",
);

// Right icon item styles
const iconRightItemClasses = cn(
	// Layout & Flexbox
	"flex",
	"items-center",
	"justify-center",

	// Transitions
	"transition-colors",
	"duration-300",
);

// Suffix styles
const suffixClasses = cn(
	// Borders
	"border-border-primary",
	"border",

	// Background & Colors
	"bg-bg-tertiary",
	"text-text-tertiary",

	// Layout & Flexbox
	"flex",
	"items-center",

	// Spacing & Sizing
	"rounded-r-md",
	"px-3",
	"py-1",

	// Typography
	"typo-body",

	// Cursor & Interactions
	"cursor-default",

	// Transitions
	"transition-colors",
	"duration-300",
);

// Disabled suffix styles
const suffixDisabledClasses = cn(
	// Borders
	"border-border-primary",
	"border",

	// Background & Colors
	"bg-bg-tertiary",
	"text-text-disabled",

	// Layout & Flexbox
	"flex",
	"items-center",

	// Spacing & Sizing
	"rounded-r-md",
	"px-3",
	"py-1",

	// Typography
	"typo-body",

	// Cursor & Interactions
	"hover:cursor-not-allowed",

	// Transitions
	"transition-colors",
	"duration-300",
);

// Invalid suffix styles
const suffixInvalidClasses = cn(
	// Borders
	"border-border-error",
	"border",

	// Background & Colors
	"bg-bg-secondary",
	"text-text-tertiary",

	// Layout & Flexbox
	"flex",
	"items-center",

	// Spacing & Sizing
	"rounded-r-md",
	"px-3",
	"py-1",

	// Typography
	"typo-body",

	// Cursor & Interactions
	"cursor-default",

	// Transitions
	"transition-colors",
	"duration-300",
);

const inputVariants = cva(
	cn(
		// Sizing & Layout
		"h-9",
		"flex",
		"w-full",
		"min-w-0",

		// Spacing & Padding
		"px-3",
		"py-2",

		// Borders
		"border",
		"border-border-primary",

		// Background & Colors
		"bg-transparent",
		"text-base",

		// Typography
		"typo-body",
		"md:text-md",

		// File input styles
		"file:text-text-primary",
		"file:inline-flex",
		"file:h-7",
		"file:border-0",
		"file:bg-transparent",
		"file:text-md",
		"file:font-medium",

		// Placeholder styles
		"placeholder:text-text-quternary",

		// Selection styles
		"selection:bg-bg-primary",
		"selection:text-text-primary-foreground",
		"selection:bg-selection",

		// Hover states
		"hover:border-border-primary_hover",

		// Focus states

		"focus-visible:border-border-link",

		// Invalid states
		"aria-invalid:ring-destructive",
		"aria-invalid:text-text-error-primary",
		"aria-invalid:border-border-error-primary",

		// Disabled states
		"disabled:bg-bg-secondary",
		"disabled:cursor-not-allowed",
		"disabled:border-border-primary",
		"disabled:text-text-disabled",
		"disabled:placeholder:text-text-disabled",

		// Transitions
		"transition-all",
		"duration-300",

		// Outline
		"outline-none",

		// Border radius
		"rounded-md",
	),
	{
		variants: {
			hasLeftSlot: {
				true: cn(
					// Left padding for icon
					"pl-9",
				),
			},
			hasRightSlot: {
				true: cn(
					// Right padding for icon
					"pr-9",
				),
			},
			hasSuffix: {
				true: cn(
					// Border adjustments for suffix
					"border-r-0",
					"rounded-l-md",
					"rounded-r-none",

					// Focus adjustments
					"focus-visible:ring-offset-0",
					"focus-visible:border-r-1",
				),
			},
			invalid: {
				true: cn(
					// Invalid border colors
					"border-border-error",
					"hover:border-border-error_inverse",

					// Invalid focus states
					"focus-visible:ring-4",
					"focus-visible:ring-ring-red",
					"focus-visible:border-border-error",

					// Transitions
					"transition-all",
					"duration-300",
				),
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
