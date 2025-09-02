import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Menubar styles
const menubarStyles = cn(
	"bg-background",
	"flex",
	"h-9",
	"items-center",
	"gap-1",
	"rounded-md",
	"border",
	"p-1",
	"shadow-xs",
);

// Menubar trigger styles
const menubarTriggerStyles = cn(
	"focus:bg-accent",
	"focus:text-accent-foreground",
	"data-[state=open]:bg-accent",
	"data-[state=open]:text-accent-foreground",
	"flex",
	"items-center",
	"rounded-sm",
	"px-2",
	"py-1",
	"text-sm",
	"font-medium",
	"outline-hidden",
	"select-none",
);

// Menubar content styles
const menubarContentStyles = cn(
	"bg-popover",
	"text-popover-foreground",
	"data-[state=open]:animate-in",
	"data-[state=closed]:fade-out-0",
	"data-[state=open]:fade-in-0",
	"data-[state=closed]:zoom-out-95",
	"data-[state=open]:zoom-in-95",
	"data-[side=bottom]:slide-in-from-top-2",
	"data-[side=left]:slide-in-from-right-2",
	"data-[side=right]:slide-in-from-left-2",
	"data-[side=top]:slide-in-from-bottom-2",
	"z-50",
	"min-w-[12rem]",
	"origin-(--radix-menubar-content-transform-origin)",
	"overflow-hidden",
	"rounded-md",
	"border",
	"p-1",
	"shadow-md",
);

// Menubar item styles
const menubarItemStyles = cn(
	"focus:bg-accent",
	"focus:text-accent-foreground",
	"data-[variant=destructive]:text-destructive",
	"data-[variant=destructive]:focus:bg-destructive/10",
	"dark:data-[variant=destructive]:focus:bg-destructive/20",
	"data-[variant=destructive]:focus:text-destructive",
	"data-[variant=destructive]:*:[svg]:!text-destructive",
	"[&_svg:not([class*='text-'])]:text-muted-foreground",
	"relative",
	"flex",
	"cursor-default",
	"items-center",
	"gap-2",
	"rounded-sm",
	"px-2",
	"py-1.5",
	"text-sm",
	"outline-hidden",
	"select-none",
	"data-[disabled]:pointer-events-none",
	"data-[disabled]:opacity-50",
	"data-[inset]:pl-8",
	"[&_svg]:pointer-events-none",
	"[&_svg]:shrink-0",
	"[&_svg:not([class*='size-'])]:size-4",
);

// Menubar checkbox/radio item styles
const menubarCheckboxRadioItemStyles = cn(
	"focus:bg-accent",
	"focus:text-accent-foreground",
	"relative",
	"flex",
	"cursor-default",
	"items-center",
	"gap-2",
	"rounded-xs",
	"py-1.5",
	"pr-2",
	"pl-8",
	"text-sm",
	"outline-hidden",
	"select-none",
	"data-[disabled]:pointer-events-none",
	"data-[disabled]:opacity-50",
	"[&_svg]:pointer-events-none",
	"[&_svg]:shrink-0",
	"[&_svg:not([class*='size-'])]:size-4",
);

// Menubar indicator styles
const menubarIndicatorStyles = cn(
	"pointer-events-none",
	"absolute",
	"left-2",
	"flex",
	"size-3.5",
	"items-center",
	"justify-center",
);

// Menubar label styles
const menubarLabelStyles = cn(
	"px-2",
	"py-1.5",
	"text-sm",
	"font-medium",
	"data-[inset]:pl-8",
);

// Menubar separator styles
const menubarSeparatorStyles = cn("bg-border", "-mx-1", "my-1", "h-px");

// Menubar shortcut styles
const menubarShortcutStyles = cn(
	"text-muted-foreground",
	"ml-auto",
	"text-xs",
	"tracking-widest",
);

// Menubar sub trigger styles
const menubarSubTriggerStyles = cn(
	"focus:bg-(--color-surface-1)",
	"data-[state=open]:bg-(--color-surface-1)",
	"flex",
	"items-center",
	"rounded-sm",
	"px-2",
	"py-1",
	"text-sm",
	"font-medium",
	"outline-hidden",
	"select-none",
);

// Menubar sub content styles
const menubarSubContentStyles = cn(
	"bg-popover",
	"text-popover-foreground",
	"data-[state=open]:animate-in",
	"data-[state=closed]:animate-out",
	"data-[state=closed]:fade-out-0",
	"data-[state=open]:fade-in-0",
	"data-[state=closed]:zoom-out-95",
	"data-[state=open]:zoom-in-95",
	"data-[side=bottom]:slide-in-from-top-2",
	"data-[side=left]:slide-in-from-right-2",
	"data-[side=right]:slide-in-from-left-2",
	"data-[side=top]:slide-in-from-bottom-2",
	"z-50",
	"min-w-[8rem]",
	"origin-(--radix-menubar-content-transform-origin)",
	"overflow-hidden",
	"rounded-md",
	"border",
	"p-1",
	"shadow-lg",
);

function Menubar({
	className,
	...props
}: React.ComponentProps<typeof MenubarPrimitive.Root>) {
	return (
		<MenubarPrimitive.Root
			data-slot="menubar"
			className={cn(menubarStyles, className)}
			{...props}
		/>
	);
}

function MenubarMenu({
	...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
	return <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />;
}

function MenubarGroup({
	...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
	return <MenubarPrimitive.Group data-slot="menubar-group" {...props} />;
}

function MenubarPortal({
	...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
	return <MenubarPrimitive.Portal data-slot="menubar-portal" {...props} />;
}

function MenubarRadioGroup({
	...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
	return (
		<MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />
	);
}

function MenubarTrigger({
	className,
	...props
}: React.ComponentProps<typeof MenubarPrimitive.Trigger>) {
	return (
		<MenubarPrimitive.Trigger
			data-slot="menubar-trigger"
			className={cn(menubarTriggerStyles, className)}
			{...props}
		/>
	);
}

function MenubarContent({
	className,
	align = "start",
	alignOffset = -4,
	sideOffset = 8,
	...props
}: React.ComponentProps<typeof MenubarPrimitive.Content>) {
	return (
		<MenubarPortal>
			<MenubarPrimitive.Content
				data-slot="menubar-content"
				align={align}
				alignOffset={alignOffset}
				sideOffset={sideOffset}
				className={cn(menubarContentStyles, className)}
				{...props}
			/>
		</MenubarPortal>
	);
}

function MenubarItem({
	className,
	inset,
	variant = "default",
	...props
}: React.ComponentProps<typeof MenubarPrimitive.Item> & {
	inset?: boolean;
	variant?: "default" | "destructive";
}) {
	return (
		<MenubarPrimitive.Item
			data-slot="menubar-item"
			data-inset={inset}
			data-variant={variant}
			className={cn(menubarItemStyles, className)}
			{...props}
		/>
	);
}

function MenubarCheckboxItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof MenubarPrimitive.CheckboxItem>) {
	return (
		<MenubarPrimitive.CheckboxItem
			data-slot="menubar-checkbox-item"
			className={cn(menubarCheckboxRadioItemStyles, className)}
			{...props}
		>
			<span className={menubarIndicatorStyles}>
				<MenubarPrimitive.ItemIndicator>
					<CheckIcon className="size-4" />
				</MenubarPrimitive.ItemIndicator>
			</span>
			{children}
		</MenubarPrimitive.CheckboxItem>
	);
}

function MenubarRadioItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioItem>) {
	return (
		<MenubarPrimitive.RadioItem
			data-slot="menubar-radio-item"
			className={cn(menubarCheckboxRadioItemStyles, className)}
			{...props}
		>
			<span className={menubarIndicatorStyles}>
				<MenubarPrimitive.ItemIndicator>
					<CircleIcon className="size-2 fill-current" />
				</MenubarPrimitive.ItemIndicator>
			</span>
			{children}
		</MenubarPrimitive.RadioItem>
	);
}

function MenubarLabel({
	className,
	inset,
	...props
}: React.ComponentProps<typeof MenubarPrimitive.Label> & {
	inset?: boolean;
}) {
	return (
		<MenubarPrimitive.Label
			data-slot="menubar-label"
			data-inset={inset}
			className={cn(menubarLabelStyles, className)}
			{...props}
		/>
	);
}

function MenubarSeparator({
	className,
	...props
}: React.ComponentProps<typeof MenubarPrimitive.Separator>) {
	return (
		<MenubarPrimitive.Separator
			data-slot="menubar-separator"
			className={cn(menubarSeparatorStyles, className)}
			{...props}
		/>
	);
}

function MenubarShortcut({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="menubar-shortcut"
			className={cn(menubarShortcutStyles, className)}
			{...props}
		/>
	);
}

function MenubarSub({
	...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
	return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />;
}

function MenubarSubTrigger({
	className,
	inset,
	children,
	...props
}: React.ComponentProps<typeof MenubarPrimitive.SubTrigger> & {
	inset?: boolean;
}) {
	return (
		<MenubarPrimitive.SubTrigger
			data-slot="menubar-sub-trigger"
			data-inset={inset}
			className={cn(menubarSubTriggerStyles, className)}
			{...props}
		>
			{children}
			<ChevronRightIcon className="ml-auto h-4 w-4" />
		</MenubarPrimitive.SubTrigger>
	);
}

function MenubarSubContent({
	className,
	...props
}: React.ComponentProps<typeof MenubarPrimitive.SubContent>) {
	return (
		<MenubarPrimitive.SubContent
			data-slot="menubar-sub-content"
			className={cn(menubarSubContentStyles, className)}
			{...props}
		/>
	);
}

export {
	Menubar,
	MenubarPortal,
	MenubarMenu,
	MenubarTrigger,
	MenubarContent,
	MenubarGroup,
	MenubarSeparator,
	MenubarLabel,
	MenubarItem,
	MenubarShortcut,
	MenubarCheckboxItem,
	MenubarRadioGroup,
	MenubarRadioItem,
	MenubarSub,
	MenubarSubTrigger,
	MenubarSubContent,
};
