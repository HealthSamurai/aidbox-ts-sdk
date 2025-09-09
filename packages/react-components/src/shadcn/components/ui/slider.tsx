"use client";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Slider root styles
const sliderRootStyles = cn(
	// Layout
	"relative",
	"flex",
	"w-full",
	"items-center",
	// Interaction
	"touch-none",
	"select-none",
	// Disabled
	"data-[disabled]:opacity-50",
	// Vertical orientation
	"data-[orientation=vertical]:h-full",
	"data-[orientation=vertical]:min-h-44",
	"data-[orientation=vertical]:w-auto",
	"data-[orientation=vertical]:flex-col",
);

// Slider track styles
const sliderTrackStyles = cn(
	// Background
	"bg-bg-quaternary",
	// Layout
	"relative",
	"grow",
	"overflow-hidden",
	// Shape
	"rounded-full",
	// Horizontal orientation
	"data-[orientation=horizontal]:h-1.5",
	"data-[orientation=horizontal]:w-full",
	// Vertical orientation
	"data-[orientation=vertical]:h-full",
	"data-[orientation=vertical]:w-1.5",
);

// Slider range styles
const sliderRangeStyles = cn(
	// Background
	"bg-bg-link",
	// Layout
	"absolute",
	// Horizontal orientation
	"data-[orientation=horizontal]:h-full",
	// Vertical orientation
	"data-[orientation=vertical]:w-full",
);

// Slider thumb styles
const sliderThumbStyles = cn(
	// Layout
	"block",
	"size-4",
	"shrink-0",
	// Shape
	"rounded-full",
	// Borders
	"border",
	"border-border-link",
	// Background
	"bg-bg-primary",
	// Shadow
	"shadow-sm",
	// Transitions
	"transition-[color,box-shadow]",
	// Hover
	"hover:ring-4",
	"hover:ring-utility-blue/70",
	// Focus
	"focus-visible:ring-4",
	"focus-visible:ring-utility-blue/70",
	"focus-visible:outline-hidden",
	// Disabled
	"disabled:pointer-events-none",
	"disabled:opacity-50",
);

function Slider({
	className,
	defaultValue,
	value,
	min = 0,
	max = 100,
	...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
	const _values = React.useMemo(
		() =>
			Array.isArray(value)
				? value
				: Array.isArray(defaultValue)
					? defaultValue
					: [min, max],
		[value, defaultValue, min, max],
	);

	return (
		<SliderPrimitive.Root
			data-slot="slider"
			{...(defaultValue !== undefined ? { defaultValue } : {})}
			{...(value !== undefined ? { value } : {})}
			min={min}
			max={max}
			className={cn(sliderRootStyles, className)}
			{...props}
		>
			<SliderPrimitive.Track
				data-slot="slider-track"
				className={sliderTrackStyles}
			>
				<SliderPrimitive.Range
					data-slot="slider-range"
					className={sliderRangeStyles}
				/>
			</SliderPrimitive.Track>
			{Array.from({ length: _values.length }, (_, index) => (
				<SliderPrimitive.Thumb
					data-slot="slider-thumb"
					// biome-ignore lint/suspicious/noArrayIndexKey: FIXME: unchanged shadcn
					key={index}
					className={sliderThumbStyles}
				/>
			))}
		</SliderPrimitive.Root>
	);
}

export { Slider };
