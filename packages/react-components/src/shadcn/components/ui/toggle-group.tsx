"use client";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { toggleVariants } from "#shadcn/components/ui/toggle";
import { cn } from "#shadcn/lib/utils";

// Toggle group styles
const toggleGroupStyles = cn(
	"group/toggle-group",
	"flex",
	"w-fit",
	"items-center",
	"rounded-md",
	"bg-bg-primary",
	"border",
	"border-border-primary",
);

// Toggle group item styles
const toggleGroupItemStyles = cn(
	"min-w-0",
	"flex-1",
	"shrink-0",
	"rounded-none",
	"shadow-none",
	"first:rounded-l-md",
	"last:rounded-r-md",
	"focus:z-10",
	"focus-visible:z-10",
	// Убираем все границы у элементов внутри группы
	"data-[variant=outline]:border-0",
	// Добавляем правую границу как разделитель (кроме последнего элемента)
	"data-[variant=outline]:[&:not(:last-child)]:border-r",
	"data-[variant=outline]:[&:not(:last-child)]:border-r-border-primary",
);

const ToggleGroupContext = React.createContext<
	VariantProps<typeof toggleVariants>
>({
	variant: "filled",
});

function ToggleGroup({
	className,
	variant,
	children,
	...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
	VariantProps<typeof toggleVariants>) {
	return (
		<ToggleGroupPrimitive.Root
			data-slot="toggle-group"
			data-variant={variant}
			className={cn(toggleGroupStyles, className)}
			{...props}
		>
			<ToggleGroupContext.Provider value={{ variant }}>
				{children}
			</ToggleGroupContext.Provider>
		</ToggleGroupPrimitive.Root>
	);
}

function ToggleGroupItem({
	className,
	children,
	variant,
	...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
	VariantProps<typeof toggleVariants>) {
	const context = React.useContext(ToggleGroupContext);

	return (
		<ToggleGroupPrimitive.Item
			data-slot="toggle-group-item"
			data-variant={context.variant || variant}
			className={cn(
				toggleVariants({
					variant: context.variant || variant,
				}),
				toggleGroupItemStyles,
				className,
			)}
			{...props}
		>
			{children}
		</ToggleGroupPrimitive.Item>
	);
}

export { ToggleGroup, ToggleGroupItem };
