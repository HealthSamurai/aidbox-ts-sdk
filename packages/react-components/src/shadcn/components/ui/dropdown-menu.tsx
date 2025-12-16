import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Styles
const dropdownMenuContentBaseStyles = cn(
	// Background
	"bg-bg-primary",
	// Layout
	"z-50",
	"max-h-(--radix-dropdown-menu-content-available-height)",
	"min-w-[8rem]",
	"origin-(--radix-dropdown-menu-content-transform-origin)",
	"overflow-x-hidden",
	"overflow-y-auto",
	// Shape
	"rounded-md",
	// Border
	"border",
	"border-border-separator",
	// Spacing
	"p-2",
	"gap-1",
	"flex",
	"flex-col",
	// Shadow
	"dropdown-menu-shadow",
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
);

const dropdownMenuItemBaseStyles = cn(
	// Layout
	"flex",
	"items-center",
	"justify-between",
	"gap-2",
	"h-7",
	// Spacing
	"px-3",
	"py-0",
	// Shape
	"rounded",
	// Typography
	"typo-body",
	// Colors
	"text-text-secondary",
	// Interaction
	"cursor-pointer",
	"outline-hidden",
	"select-none",
	// Focus states
	"focus:bg-bg-tertiary",
	"focus:text-text-primary",
	"focus:rounded",
	// Disabled states
	"data-[disabled]:pointer-events-none",
	"data-[disabled]:opacity-50",
	// Inset spacing
	"data-[inset]:pl-8",
	// SVG
	"[&_svg]:pointer-events-none",
	"[&_svg]:shrink-0",
	"[&_svg:not([class*='size-'])]:size-4",
	"[&_svg:not([class*='text-'])]:text-fg-secondary",
);

const dropdownMenuItemVariants = cva(dropdownMenuItemBaseStyles, {
	variants: {
		variant: {
			default: "",
			destructive: cn(
				"data-[variant=destructive]:text-text-error-primary",
				"data-[variant=destructive]:focus:bg-bg-error-tertiary",
				"data-[variant=destructive]:focus:text-text-error-primary",
				"data-[variant=destructive]:*:[svg]:!text-text-error-primary",
			),
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

const dropdownMenuCheckboxItemBaseStyles = cn(
	// Layout
	"relative",
	"flex",
	"items-center",
	"gap-2",
	"h-7",
	// Spacing
	"py-0",
	"pr-2",
	"pl-9",
	// Shape
	"rounded",
	// Typography
	"typo-body",
	// Colors
	"text-text-secondary",
	// Interaction
	"cursor-default",
	"outline-hidden",
	"select-none",
	// Focus states
	"focus:bg-bg-secondary",
	"focus:text-text-primary",
	// Disabled states
	"data-[disabled]:pointer-events-none",
	"data-[disabled]:opacity-50",
	// SVG
	"[&_svg]:pointer-events-none",
	"[&_svg]:shrink-0",
	"[&_svg:not([class*='size-'])]:size-4",
	"[&_svg]:text-text-link",
);

const dropdownMenuCheckboxIndicatorStyles = cn(
	// Layout
	"pointer-events-none",
	"absolute",
	"left-3",
	"flex",
	"size-3.5",
	"items-center",
	"justify-center",
);

const dropdownMenuRadioItemBaseStyles = cn(
	// Layout
	"relative",
	"flex",
	"items-center",
	"gap-2",
	"h-7",
	// Spacing
	"py-0",
	"pr-2",
	// Shape
	"rounded",
	// Typography
	"typo-body",
	// Colors
	"text-text-secondary",
	// Interaction
	"cursor-pointer",
	"outline-hidden",
	"select-none",
	// Focus states
	"focus:bg-bg-secondary",
	"focus:text-text-primary",
	// Disabled states
	"data-[disabled]:pointer-events-none",
	"data-[disabled]:opacity-50",
	// SVG
	"[&_svg]:pointer-events-none",
	"[&_svg]:shrink-0",
	"[&_svg:not([class*='size-'])]:size-4",
);

const dropdownMenuRadioIndicatorStyles = cn(
	// Layout
	"pointer-events-none",
	"absolute",
	"left-2",
	"flex",
	"size-3.5",
	"items-center",
	"justify-center",
);

const dropdownMenuLabelBaseStyles = cn(
	// Layout
	"flex",
	"items-center",
	"h-7",
	// Spacing
	"px-3",
	"py-0",
	"data-[inset]:pl-10",
	// Typography
	"typo-label-tiny",
	// Colors
	"text-text-secondary",
);

const dropdownMenuSeparatorBaseStyles = cn(
	// Border
	"border-t",
	"border-border-separator",
	// Spacing
	"-mx-1",
	"my-1",
	// Size
	"h-1",
);

const dropdownMenuShortcutBaseStyles = cn(
	// Typography
	"text-xs",
	"tracking-widest",
	// Colors
	"text-text-secondary",
	// Spacing
	"ml-auto",
);

const dropdownMenuIconBaseStyles = cn(
	// Layout
	"flex",
	"items-center",
	"justify-center",
	// Size
	"size-6",
	// Spacing
	"p-1",
	// SVG
	"[&_svg]:pointer-events-none",
	"[&_svg]:shrink-0",
	"[&_svg:not([class*='size-'])]:size-4",
	"[&_svg:not([class*='text-'])]:text-fg-tertiary",
	// Hover states
	"hover:[&_svg:not([class*='text-'])]:text-fg-tertiary_hover",
);

const dropdownMenuSubTriggerBaseStyles = cn(
	// Layout
	"flex",
	"items-center",
	"h-7",
	// Spacing
	"px-3",
	"py-0",
	"data-[inset]:pl-8",
	// Shape
	"rounded",
	// Typography
	"typo-body",
	// Colors
	"text-text-secondary",
	// Interaction
	"cursor-default",
	"outline-hidden",
	"select-none",
	// Focus states
	"focus:bg-bg-secondary",
	"focus:text-text-primary",
	"data-[state=open]:bg-accent",
	"data-[state=open]:text-accent-foreground",
);

const dropdownMenuSubContentBaseStyles = cn(
	// Background
	"bg-bg-primary",
	// Layout
	"z-50",
	"min-w-[8rem]",
	"origin-(--radix-dropdown-menu-content-transform-origin)",
	"overflow-hidden",
	// Shape
	"rounded-md",
	// Border
	"border",
	"border-border-separator",
	// Spacing
	"p-2",
	"gap-1",
	"flex",
	"flex-col",
	// Colors
	"text-text-primary",
	// Shadow
	"dropdown-menu-shadow",
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
);

// Components
function DropdownMenu({
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
	return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
	return (
		<DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
	);
}

function DropdownMenuTrigger({
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
	return (
		<DropdownMenuPrimitive.Trigger
			data-slot="dropdown-menu-trigger"
			{...props}
		/>
	);
}

function DropdownMenuContent({
	className,
	sideOffset = 4,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content
				data-slot="dropdown-menu-content"
				sideOffset={sideOffset}
				className={cn(dropdownMenuContentBaseStyles, className)}
				{...props}
			/>
		</DropdownMenuPrimitive.Portal>
	);
}

function DropdownMenuGroup({
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
	return (
		<DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
	);
}

function DropdownMenuItem({
	className,
	inset,
	variant = "default",
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> &
	VariantProps<typeof dropdownMenuItemVariants> & {
		inset?: boolean;
	}) {
	return (
		<DropdownMenuPrimitive.Item
			data-slot="dropdown-menu-item"
			data-inset={inset}
			data-variant={variant}
			className={cn(dropdownMenuItemVariants({ variant }), className)}
			{...props}
		/>
	);
}

function DropdownMenuCheckboxItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
	return (
		<DropdownMenuPrimitive.CheckboxItem
			data-slot="dropdown-menu-checkbox-item"
			className={cn(dropdownMenuCheckboxItemBaseStyles, className)}
			{...props}
		>
			<span className={dropdownMenuCheckboxIndicatorStyles}>
				<DropdownMenuPrimitive.ItemIndicator>
					<CheckIcon className="size-4" />
				</DropdownMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</DropdownMenuPrimitive.CheckboxItem>
	);
}

function DropdownMenuRadioGroup({
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
	return (
		<DropdownMenuPrimitive.RadioGroup
			data-slot="dropdown-menu-radio-group"
			{...props}
		/>
	);
}

function DropdownMenuRadioItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
	return (
		<DropdownMenuPrimitive.RadioItem
			data-slot="dropdown-menu-radio-item"
			className={cn(dropdownMenuRadioItemBaseStyles, className)}
			{...props}
		>
			<span className={dropdownMenuRadioIndicatorStyles}>
				<DropdownMenuPrimitive.ItemIndicator>
					<CircleIcon className="size-2 fill-current" />
				</DropdownMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</DropdownMenuPrimitive.RadioItem>
	);
}

function DropdownMenuLabel({
	className,
	inset,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
	inset?: boolean;
}) {
	return (
		<DropdownMenuPrimitive.Label
			data-slot="dropdown-menu-label"
			data-inset={inset}
			className={cn(dropdownMenuLabelBaseStyles, className)}
			{...props}
		/>
	);
}

function DropdownMenuSeparator({
	className,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
	return (
		<DropdownMenuPrimitive.Separator
			data-slot="dropdown-menu-separator"
			className={cn(dropdownMenuSeparatorBaseStyles, className)}
			{...props}
		/>
	);
}

function DropdownMenuShortcut({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="dropdown-menu-shortcut"
			className={cn(dropdownMenuShortcutBaseStyles, className)}
			{...props}
		/>
	);
}

function DropdownMenuIcon({
	className,
	children,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="dropdown-menu-icon"
			className={cn(dropdownMenuIconBaseStyles, className)}
			{...props}
		>
			{children}
		</span>
	);
}

function DropdownMenuSub({
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
	return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
	className,
	inset,
	children,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
	inset?: boolean;
}) {
	return (
		<DropdownMenuPrimitive.SubTrigger
			data-slot="dropdown-menu-sub-trigger"
			data-inset={inset}
			className={cn(dropdownMenuSubTriggerBaseStyles, className)}
			{...props}
		>
			{children}
			<ChevronRightIcon className="ml-auto size-4" />
		</DropdownMenuPrimitive.SubTrigger>
	);
}

function DropdownMenuSubContent({
	className,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
	return (
		<DropdownMenuPrimitive.SubContent
			data-slot="dropdown-menu-sub-content"
			className={cn(dropdownMenuSubContentBaseStyles, className)}
			{...props}
		/>
	);
}

export {
	DropdownMenu,
	DropdownMenuPortal,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuItem,
	dropdownMenuItemVariants,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuIcon,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuSubContent,
};
