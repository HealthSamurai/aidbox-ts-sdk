import * as SelectPrimitive from "@radix-ui/react-select";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "#shadcn/lib/utils";

// Base select trigger styles
const baseSelectTriggerStyles = cn(
	// Layout
	"flex",
	"w-full",
	"items-center",
	"justify-between",
	"gap-2",
	"whitespace-nowrap",
	// Shape
	"rounded-md",
	// Borders
	"border",
	"border-border-primary",
	// Background & Colors
	"bg-transparent",
	"text-sm",
	// Spacing
	"px-3",
	"py-2",
	// Transitions
	"transition-colors",
	"duration-300",
	"outline-none",
	// Hover
	"hover:border-border-primary_hover",
	// Focus
	"focus-visible:ring-2",
	"focus-visible:ring-utility-blue/70",
	// Placeholder
	"data-[placeholder]:text-text-tertiary",
	// Selection
	"selection:bg-selection",
	"selection:text-text-primary",
	// SVG icons
	"[&_svg:not([class*='text-'])]:text-text-tertiary",
	"[&_svg]:pointer-events-none",
	"[&_svg]:shrink-0",
	"[&_svg:not([class*='size-'])]:size-4",
	// Value styles
	"*:data-[slot=select-value]:line-clamp-1",
	"*:data-[slot=select-value]:flex",
	"*:data-[slot=select-value]:items-center",
	"*:data-[slot=select-value]:gap-2",
	// Cursor
	"cursor-pointer",
	// Disabled
	"disabled:pointer-events-none",
	"disabled:cursor-not-allowed",
	"disabled:text-text-disabled",
	"disabled:bg-bg-disabled",
	"disabled:border-border-disabled",
	// Invalid
	"aria-invalid:text-text-error-primary",
	"aria-invalid:border-border-error",
	"aria-invalid:ring-2",
	"aria-invalid:ring-utility-red/70",
);

const selectTriggerVariants = cva(baseSelectTriggerStyles, {
	variants: {
		size: {
			regular: cn("h-9"),
			small: cn("h-8"),
		},
		variant: {
			default: cn(""),
			compound: cn("border-r-0", "typo-label"),
		},
	},
	defaultVariants: {
		size: "regular",
		variant: "default",
	},
});

function Select({
	...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
	return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
	...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
	return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
	...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
	return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
	className,
	size,
	variant,
	children,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> &
	VariantProps<typeof selectTriggerVariants>) {
	return (
		<SelectPrimitive.Trigger
			data-slot="select-trigger"
			className={cn(selectTriggerVariants({ variant, size, className }))}
			{...props}
		>
			{children}
			<SelectPrimitive.Icon asChild>
				<ChevronDownIcon />
			</SelectPrimitive.Icon>
		</SelectPrimitive.Trigger>
	);
}

function SelectContent({
	className,
	children,
	position = "popper",
	...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
	return (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Content
				data-slot="select-content"
				className={cn(
					// Layout
					"relative",
					"z-50",
					"group",
					"min-w-[8rem]",
					"max-h-(--radix-select-content-available-height)",
					"origin-(--radix-select-content-transform-origin)",
					"overflow-x-hidden",
					"overflow-y-auto",
					// Shape
					"rounded-md",
					// Borders
					"border",
					"border-border-primary",
					// Background & Colors
					"bg-bg-primary",
					"text-text-primary",
					// Spacing
					"py-1",
					// Shadow
					"shadow-lg",
					// Animations - open
					"data-[state=open]:animate-in",
					"data-[state=open]:fade-in-0",
					"data-[state=open]:zoom-in-95",
					// Animations - closed
					"data-[state=closed]:animate-out",
					"data-[state=closed]:fade-out-0",
					"data-[state=closed]:zoom-out-95",
					// Slide animations
					"data-[side=bottom]:slide-in-from-top-2",
					"data-[side=left]:slide-in-from-right-2",
					"data-[side=right]:slide-in-from-left-2",
					"data-[side=top]:slide-in-from-bottom-2",
					position === "popper" &&
						cn(
							"data-[side=bottom]:translate-y-1",
							"data-[side=left]:-translate-x-1",
							"data-[side=right]:translate-x-1",
							"data-[side=top]:-translate-y-1",
						),
					className,
				)}
				position={position}
				{...props}
			>
				<SelectScrollUpButton />
				<SelectPrimitive.Viewport
					className={cn(
						"p-1",
						position === "popper" &&
							cn(
								"h-[var(--radix-select-trigger-height)]",
								"w-full",
								"min-w-[var(--radix-select-trigger-width)]",
								"scroll-my-1",
							),
					)}
				>
					{children}
				</SelectPrimitive.Viewport>
				<SelectScrollDownButton />
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	);
}

function SelectLabel({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
	return (
		<SelectPrimitive.Label
			data-slot="select-label"
			className={cn(
				"text-text-tertiary",
				"px-2",
				"py-1.5",
				"typo-label",
				className,
			)}
			{...props}
		/>
	);
}

function SelectItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
	return (
		<SelectPrimitive.Item
			data-slot="select-item"
			className={cn(
				// Layout
				"relative",
				"flex",
				"w-full",
				"items-center",
				"cursor-pointer",
				"select-none",
				// Shape
				"rounded-md",
				// Spacing
				"py-1.5",
				"pl-3",
				"pr-8",
				"mb-0.5",
				"last:mb-0",
				// Typography
				"text-sm",
				"text-text-primary",
				// Interaction
				"outline-hidden",
				// Hover
				"hover:bg-bg-tertiary",
				// Active
				"active:text-text-primary",
				// Focus
				"focus-visible:bg-bg-tertiary",
				// Checked state
				"data-[state=checked]:bg-bg-tertiary",
				"data-[state=checked]:text-text-primary",
				"group-hover:data-[state=checked]:bg-transparent",
				// Disabled
				"data-[disabled]:pointer-events-none",
				"data-[disabled]:opacity-50",
				// SVG icons
				"[&_svg:not([class*='text-'])]:text-text-tertiary",
				"[&_svg]:pointer-events-none",
				"[&_svg]:shrink-0",
				"[&_svg:not([class*='size-'])]:size-4",
				// Span styles
				"*:[span]:last:flex",
				"*:[span]:last:items-center",
				"*:[span]:last:gap-2",
				className,
			)}
			{...props}
		>
			<span
				className={cn(
					"absolute",
					"right-2",
					"flex",
					"size-3.5",
					"items-center",
					"justify-center",
				)}
			>
				<SelectPrimitive.ItemIndicator>
					<CheckIcon className="size-4" />
				</SelectPrimitive.ItemIndicator>
			</span>
			<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
		</SelectPrimitive.Item>
	);
}

function SelectSeparator({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
	return (
		<SelectPrimitive.Separator
			data-slot="select-separator"
			className={cn(
				"bg-border-separator",
				"pointer-events-none",
				"-mx-1",
				"my-1",
				"h-px",
				className,
			)}
			{...props}
		/>
	);
}

function SelectScrollUpButton({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
	return (
		<SelectPrimitive.ScrollUpButton
			data-slot="select-scroll-up-button"
			className={cn(
				"flex cursor-default items-center justify-center py-1",
				className,
			)}
			{...props}
		>
			<ChevronUpIcon className="size-4" />
		</SelectPrimitive.ScrollUpButton>
	);
}

function SelectScrollDownButton({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
	return (
		<SelectPrimitive.ScrollDownButton
			data-slot="select-scroll-down-button"
			className={cn(
				"flex cursor-default items-center justify-center py-1",
				className,
			)}
			{...props}
		>
			<ChevronDownIcon className="size-4" />
		</SelectPrimitive.ScrollDownButton>
	);
}

export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectScrollDownButton,
	SelectScrollUpButton,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
};
