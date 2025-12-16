import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Base toggle styles
const baseToggleStyles = cn(
	// Layout
	"inline-flex",
	"items-center",
	"justify-center",
	"gap-2",
	"whitespace-nowrap",
	// Shape
	"rounded",
	"h-6",
	"px-2",
	"border",
	"border-transparent",
	// Typography
	"typo-body",
	// Colors
	"bg-bg-primary",
	"text-text-secondary",
	// Interaction
	"outline-none",
	"transition-colors",
	"cursor-pointer",
	// Hover
	"hover:bg-bg-secondary",
	// SVG icons
	"[&_svg]:pointer-events-none",
	"[&_svg:not([class*='size-'])]:size-4",
	"[&_svg]:shrink-0",
	"[&_svg]:text-text-secondary",
	"data-[state=on]:[&_svg]:text-text-primary",
	// Disabled
	"disabled:pointer-events-none",
	"disabled:opacity-50",
	// Focus
	"focus-visible:ring-2",
	"focus-visible:ring-utility-blue/70",
	// Invalid
	"aria-invalid:ring-2",
	"aria-invalid:ring-utility-red/70",
);

const toggleVariants = cva(baseToggleStyles, {
	variants: {
		variant: {
			filled: cn("data-[state=on]:bg-bg-tertiary"),
			outline: cn("data-[state=on]:border-border-separator"),
		},
	},
	defaultVariants: {
		variant: "filled",
	},
});

// Рекурсивно проверяем наличие текста в children
function hasTextContent(children: React.ReactNode): boolean {
	const childArray = React.Children.toArray(children);

	for (const child of childArray) {
		// Проверяем строки и числа
		if (typeof child === "string" || typeof child === "number") {
			// Игнорируем пустые строки и пробелы
			if (String(child).trim()) {
				return true;
			}
		}

		// Проверяем React элементы (включая фрагменты)
		if (
			React.isValidElement(child) &&
			child.props &&
			typeof child.props === "object" &&
			"children" in child.props
		) {
			if (hasTextContent(child.props.children as React.ReactNode)) {
				return true;
			}
		}
	}

	return false;
}

function Toggle({
	className,
	variant,
	children,
	...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
	VariantProps<typeof toggleVariants>) {
	// Автоматически определяем, есть ли текст помимо иконки
	const hasText = hasTextContent(children);

	return (
		<TogglePrimitive.Root
			data-slot="toggle"
			className={cn(
				toggleVariants({ variant }),
				!hasText && "w-6 p-1",
				className,
			)}
			{...props}
		>
			{children}
		</TogglePrimitive.Root>
	);
}

export { Toggle, toggleVariants };
