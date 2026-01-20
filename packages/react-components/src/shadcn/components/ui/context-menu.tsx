import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Styles
const contextMenuContentBaseStyles = cn(
	// Background
	"bg-bg-primary",
	// Layout
	"z-50",
	"max-h-(--radix-context-menu-content-available-height)",
	"min-w-[8rem]",
	"origin-(--radix-context-menu-content-transform-origin)",
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

const contextMenuItemBaseStyles = cn(
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
	"text-text-primary",
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

const contextMenuItemVariants = cva(contextMenuItemBaseStyles, {
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

const contextMenuCheckboxItemBaseStyles = cn(
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
	"text-text-primary",
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

const contextMenuCheckboxIndicatorStyles = cn(
	// Layout
	"pointer-events-none",
	"absolute",
	"left-3",
	"flex",
	"size-3.5",
	"items-center",
	"justify-center",
);

const contextMenuRadioItemBaseStyles = cn(
	// Layout
	"relative",
	"flex",
	"items-center",
	"gap-2",
	"h-7",
	// Spacing
	"py-0",
	"pr-2",
	"pl-8",
	// Shape
	"rounded",
	// Typography
	"typo-body",
	// Colors
	"text-text-primary",
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

const contextMenuRadioIndicatorStyles = cn(
	// Layout
	"pointer-events-none",
	"absolute",
	"left-2",
	"flex",
	"size-3.5",
	"items-center",
	"justify-center",
);

const contextMenuLabelBaseStyles = cn(
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

const contextMenuSeparatorBaseStyles = cn(
	// Border
	"border-t",
	"border-border-separator",
	// Spacing
	"-mx-1",
	"my-1",
	// Size
	"h-1",
);

const contextMenuShortcutBaseStyles = cn(
	// Typography
	"text-xs",
	"tracking-widest",
	// Colors
	"text-text-secondary",
	// Spacing
	"ml-auto",
);

const contextMenuIconBaseStyles = cn(
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

const contextMenuSubTriggerBaseStyles = cn(
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
	"text-text-primary",
	// Interaction
	"cursor-default",
	"outline-hidden",
	"select-none",
	// Focus states
	"focus:bg-bg-secondary",
	"focus:text-text-primary",
	"data-[state=open]:bg-bg-secondary",
	"data-[state=open]:text-text-primary",
);

const contextMenuSubContentBaseStyles = cn(
	// Background
	"bg-bg-primary",
	// Layout
	"z-50",
	"min-w-[8rem]",
	"origin-(--radix-context-menu-content-transform-origin)",
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
function ContextMenu({
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Root>) {
	return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />;
}

function ContextMenuTrigger({
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>) {
	return (
		<ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />
	);
}

function ContextMenuGroup({
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Group>) {
	return (
		<ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />
	);
}

function ContextMenuPortal({
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Portal>) {
	return (
		<ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />
	);
}

function ContextMenuSub({
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Sub>) {
	return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />;
}

function ContextMenuRadioGroup({
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioGroup>) {
	return (
		<ContextMenuPrimitive.RadioGroup
			data-slot="context-menu-radio-group"
			{...props}
		/>
	);
}

function ContextMenuSubTrigger({
	className,
	inset,
	children,
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubTrigger> & {
	inset?: boolean;
}) {
	return (
		<ContextMenuPrimitive.SubTrigger
			data-slot="context-menu-sub-trigger"
			data-inset={inset}
			className={cn(contextMenuSubTriggerBaseStyles, className)}
			{...props}
		>
			{children}
			<ChevronRightIcon className="ml-auto size-4" />
		</ContextMenuPrimitive.SubTrigger>
	);
}

function ContextMenuSubContent({
	className,
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubContent>) {
	return (
		<ContextMenuPrimitive.SubContent
			data-slot="context-menu-sub-content"
			className={cn(contextMenuSubContentBaseStyles, className)}
			{...props}
		/>
	);
}

function ContextMenuContent({
	className,
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Content>) {
	return (
		<ContextMenuPrimitive.Portal>
			<ContextMenuPrimitive.Content
				data-slot="context-menu-content"
				className={cn(contextMenuContentBaseStyles, className)}
				{...props}
			/>
		</ContextMenuPrimitive.Portal>
	);
}

function ContextMenuItem({
	className,
	inset,
	variant = "default",
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> &
	VariantProps<typeof contextMenuItemVariants> & {
		inset?: boolean;
	}) {
	return (
		<ContextMenuPrimitive.Item
			data-slot="context-menu-item"
			data-inset={inset}
			data-variant={variant}
			className={cn(contextMenuItemVariants({ variant }), className)}
			{...props}
		/>
	);
}

function ContextMenuCheckboxItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.CheckboxItem>) {
	return (
		<ContextMenuPrimitive.CheckboxItem
			data-slot="context-menu-checkbox-item"
			className={cn(contextMenuCheckboxItemBaseStyles, className)}
			{...props}
		>
			<span className={contextMenuCheckboxIndicatorStyles}>
				<ContextMenuPrimitive.ItemIndicator>
					<CheckIcon className="size-4" />
				</ContextMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</ContextMenuPrimitive.CheckboxItem>
	);
}

function ContextMenuRadioItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioItem>) {
	return (
		<ContextMenuPrimitive.RadioItem
			data-slot="context-menu-radio-item"
			className={cn(contextMenuRadioItemBaseStyles, className)}
			{...props}
		>
			<span className={contextMenuRadioIndicatorStyles}>
				<ContextMenuPrimitive.ItemIndicator>
					<CircleIcon className="size-2 fill-current" />
				</ContextMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</ContextMenuPrimitive.RadioItem>
	);
}

function ContextMenuLabel({
	className,
	inset,
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Label> & {
	inset?: boolean;
}) {
	return (
		<ContextMenuPrimitive.Label
			data-slot="context-menu-label"
			data-inset={inset}
			className={cn(contextMenuLabelBaseStyles, className)}
			{...props}
		/>
	);
}

function ContextMenuSeparator({
	className,
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) {
	return (
		<ContextMenuPrimitive.Separator
			data-slot="context-menu-separator"
			className={cn(contextMenuSeparatorBaseStyles, className)}
			{...props}
		/>
	);
}

function ContextMenuShortcut({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="context-menu-shortcut"
			className={cn(contextMenuShortcutBaseStyles, className)}
			{...props}
		/>
	);
}

function ContextMenuIcon({
	className,
	children,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="context-menu-icon"
			className={cn(contextMenuIconBaseStyles, className)}
			{...props}
		>
			{children}
		</span>
	);
}

export {
	ContextMenu,
	ContextMenuTrigger,
	ContextMenuContent,
	ContextMenuItem,
	contextMenuItemVariants,
	ContextMenuCheckboxItem,
	ContextMenuRadioItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuIcon,
	ContextMenuGroup,
	ContextMenuPortal,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuRadioGroup,
};
