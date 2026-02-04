"use client";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";
import { RadioGroupItem } from "./radio-group";

// Radio Button Group container styles
const radioButtonGroupStyles = cva("flex flex-col gap-2", {
	variants: {
		variant: {
			wrapped: "",
			unwrapped: "",
		},
		vertical: {
			true: "",
			false: "",
		},
	},
	defaultVariants: {
		variant: "wrapped",
		vertical: false,
	},
});

// Radio items container styles
const radioItemsContainerStyles = cva("flex", {
	variants: {
		variant: {
			wrapped: "",
			unwrapped: "",
		},
		vertical: {
			true: "flex-col",
			false: "flex-row gap-3",
		},
	},
	compoundVariants: [
		{
			variant: "unwrapped",
			vertical: true,
			class: "gap-2",
		},
	],
	defaultVariants: {
		variant: "wrapped",
		vertical: false,
	},
});

// Individual radio item wrapper styles
const radioItemWrapperStyles = cva(cn("flex cursor-pointer transition-all"), {
	variants: {
		variant: {
			wrapped: cn(
				"items-start",
				"gap-3",
				"p-4",
				"border",
				"border-border-primary",
				"bg-bg-primary",
				"hover:bg-bg-secondary",
				"[&:has([data-state=checked])]:bg-bg-tertiary",
			),
			unwrapped: "gap-2",
		},
		vertical: {
			true: "",
			false: "",
		},
	},
	compoundVariants: [
		{
			variant: "wrapped",
			vertical: false,
			class: "rounded-lg",
		},
		{
			variant: "wrapped",
			vertical: true,
			class: cn(
				"first:rounded-t-lg",
				"last:rounded-b-lg",
				"[&:not(:first-child)]:-mt-px",
			),
		},
	],
	defaultVariants: {
		variant: "wrapped",
		vertical: false,
	},
});

// Title styles
const titleStyles = cn("text-text-primary", "body16bold");

// Description styles
const descriptionStyles = cn("text-text-secondary", "body14");

// Label styles
const labelStyles = cn(
	"text-text-primary",
	"body14",
	"cursor-pointer",
	"select-none",
);

export interface RadioButtonGroupOption {
	value: string;
	label: string;
	description?: string;
	disabled?: boolean;
}

export interface RadioButtonGroupProps
	extends Omit<
			React.ComponentProps<typeof RadioGroupPrimitive.Root>,
			"children"
		>,
		VariantProps<typeof radioButtonGroupStyles> {
	title?: string;
	description?: string;
	options: RadioButtonGroupOption[];
}

function RadioButtonGroup({
	className,
	variant = "wrapped",
	vertical = false,
	title,
	description,
	options,
	...props
}: RadioButtonGroupProps) {
	return (
		<div
			className={cn(radioButtonGroupStyles({ variant, vertical }), className)}
		>
			{(title || description) && (
				<div className="flex flex-col gap-0.5 mb-2">
					{title && <span className={titleStyles}>{title}</span>}
					{description && (
						<span className={descriptionStyles}>{description}</span>
					)}
				</div>
			)}
			<RadioGroupPrimitive.Root
				data-slot="radio-button-group"
				className={radioItemsContainerStyles({ variant, vertical })}
				{...props}
			>
				{options.map((option) => {
					const radioId = `radio-${option.value}`;
					return (
						<label
							key={option.value}
							htmlFor={radioId}
							className={cn(
								radioItemWrapperStyles({ variant, vertical }),
								variant === "unwrapped" &&
									(option.description ? "items-start" : "items-center"),
							)}
						>
							<RadioGroupItem
								id={radioId}
								value={option.value}
								disabled={option.disabled}
								size="small"
								className={variant === "wrapped" ? "mt-0.5" : ""}
							/>
							<div className="flex flex-col gap-0.5">
								<span className={labelStyles}>{option.label}</span>
								{option.description && (
									<span className={descriptionStyles}>
										{option.description}
									</span>
								)}
							</div>
						</label>
					);
				})}
			</RadioGroupPrimitive.Root>
		</div>
	);
}

export { RadioButtonGroup };
