import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Dropdown menu content styles
const dropdownMenuContentStyles = cn(
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
	// Borders
	"border",
	"border-border-separator",
	// Spacing
	"p-2",
	"space-y-0.5",
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
);

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
				className={cn(dropdownMenuContentStyles, className)}
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
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
	inset?: boolean;
	variant?: "default" | "destructive";
}) {
	return (
		<DropdownMenuPrimitive.Item
			data-slot="dropdown-menu-item"
			data-inset={inset}
			data-variant={variant}
			className={cn(
				"cursor-pointer items-center flex gap-2 h-8 px-3 py-1.5 relativerounded-md",
				"outline-hidden select-none typo-body text-text-secondary",
				"focus:bg-bg-secondary focus:text-text-primary",
				"data-[variant=destructive]:text-text-error-primary",
				"data-[variant=destructive]:focus:bg-bg-error-tertiary",
				"dark:data-[variant=destructive]:focus:bg-bg-error-tertiary",
				"data-[variant=destructive]:focus:text-text-error-primary",
				"data-[variant=destructive]:*:[svg]:!text-text-error-primary",
				"[&_svg:not([class*='text-'])]:fg-fg-secondary",
				"data-[disabled]:pointer-events-none",
				"data-[disabled]:opacity-50",
				"data-[inset]:pl-8",
				"[&_svg]:pointer-events-none",
				"[&_svg]:shrink-0",
				"[&_svg:not([class*='size-'])]:size-4",
				className,
			)}
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
			className={cn(
				"focus:bg-bg-secondary focus:text-text-primary relative flex cursor-default items-center gap-2 rounded-lg py-1 pr-2 pl-9",
				"outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none",
				"[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:text-text-link h-8 typo-body text-text-secondary",
				className,
			)}
			{...props}
		>
			<span className="pointer-events-none absolute left-3 flex size-3.5 items-center justify-center">
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
			className={cn(
				"focus:bg-bg-secondary focus:text-text-primary relative flex cursor-pointer items-center gap-2 rounded-md py-1.5 pr-2",
				"outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none",
				"[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 h-8 typo-body text-text-secondary",
				className,
			)}
			{...props}
		>
			<span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
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
			className={cn(
				"px-3 py-1.5 data-[inset]:pl-10 typo-body text-text-secondary",
				className,
			)}
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
			className={cn("bg-bg-quaternary -mx-1 my-1 h-px", className)}
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
			className={cn(
				"text-text-secondary ml-auto text-xs tracking-widest",
				className,
			)}
			{...props}
		/>
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
			className={cn(
				"focus:bg-bg-secondary focus:text-text-primary data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex",
				"cursor-default items-center rounded-md px-3 py-1.5 outline-hidden select-none data-[inset]:pl-8 h-8 typo-body text-text-secondary",
				className,
			)}
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
			className={cn(
				"bg-bg-primary text-text-primary data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
				"data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
				"data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50",
				"min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border border-border-separator",
				"p-2 shadow-lg",
				className,
			)}
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
	DropdownMenuCheckboxItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuSubContent,
};
