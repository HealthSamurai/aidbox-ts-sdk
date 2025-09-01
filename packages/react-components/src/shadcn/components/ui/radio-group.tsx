import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

function RadioGroup({
	className,
	...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
	return (
		<RadioGroupPrimitive.Root
			data-slot="radio-group"
			className={cn("grid gap-3", className)}
			{...props}
		/>
	);
}

function RadioGroupItem({
	className,
	...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
	return (
		<RadioGroupPrimitive.Item
			data-slot="radio-group-item"
			className={cn(
				// Base styles - размер и форма
				"aspect-square size-4 shrink-0 rounded-full overflow-hidden relative outline-none cursor-pointer",
				// Animations
				"transition-all duration-200",
				"active:scale-90 active:duration-75",
				// Default state: белый фон с серой границей
				"bg-white border-[1.6px] border-solid border-border-dark",
				// Checked state: синий фон без границы
				"data-[state=checked]:bg-bg-link data-[state=checked]:border-bg-link",
				// Disabled states
				"disabled:cursor-not-allowed disabled:active:scale-100",
				"disabled:bg-white disabled:border-border-primary", // disabled unchecked
				"disabled:data-[state=checked]:bg-border-primary disabled:data-[state=checked]:border-border-primary", // disabled checked
				// Focus styles
				"focus-visible:ring-2 focus-visible:ring-bg-link focus-visible:ring-offset-2",
				className,
			)}
			{...props}
		>
			<RadioGroupPrimitive.Indicator
				data-slot="radio-group-indicator"
				className="absolute inset-0 flex items-center justify-center"
			>
				<div className="size-1.5 rounded-full bg-white" />
			</RadioGroupPrimitive.Indicator>
		</RadioGroupPrimitive.Item>
	);
}

export { RadioGroup, RadioGroupItem };
