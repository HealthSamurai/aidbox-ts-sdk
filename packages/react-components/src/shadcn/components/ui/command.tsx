import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";
import type * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#shadcn/components/ui/dialog";
import { cn } from "#shadcn/lib/utils";

// Command Root
const commandStyles = cn(
	// Layout
	"flex",
	"h-full",
	"w-full",
	"flex-col",
	"overflow-hidden",
	"rounded-md",
	// Colors
	"bg-bg-primary",
	"text-text-primary",
	// Group heading styles
	"[&_*[cmdk-group-heading]]:flex",
	"[&_*[cmdk-group-heading]]:items-center",
	"[&_*[cmdk-group-heading]]:h-7",
	"[&_*[cmdk-group-heading]]:px-3",
	"[&_*[cmdk-group-heading]]:py-0",
	"[&_*[cmdk-group-heading]]:typo-label-tiny",
	"[&_*[cmdk-group-heading]]:text-[color:var(--color-text-secondary)]",
);

// Command Dialog
const commandDialogContentStyles = cn(
	// Layout
	"overflow-hidden",
	"p-0",
);

const commandDialogCommandStyles = cn(
	// Group headings
	"[&_[cmdk-group-heading]]:flex",
	"[&_[cmdk-group-heading]]:items-center",
	"[&_[cmdk-group-heading]]:h-7",
	"[&_[cmdk-group-heading]]:px-3",
	"[&_[cmdk-group-heading]]:py-0",
	"[&_[cmdk-group-heading]]:typo-label-tiny",
	"[&_[cmdk-group-heading]]:text-text-secondary",
	// Groups
	"[&_[cmdk-group]]:p-2",
	"[&_[cmdk-group]]:gap-1",
	"[&_[cmdk-group]]:flex",
	"[&_[cmdk-group]]:flex-col",
	"[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0",
	// Input wrapper
	"[&_[cmdk-input-wrapper]]:h-12",
	"**:data-[slot=command-input-wrapper]:h-12",
	// Input wrapper SVG
	"[&_[cmdk-input-wrapper]_svg]:h-5",
	"[&_[cmdk-input-wrapper]_svg]:w-5",
	// Input
	"[&_[cmdk-input]]:h-12",
	// Items
	"[&_[cmdk-item]]:px-2",
	"[&_[cmdk-item]]:py-3",
	// Item SVG
	"[&_[cmdk-item]_svg]:h-5",
	"[&_[cmdk-item]_svg]:w-5",
);

// Command Input Wrapper
const commandInputWrapperStyles = cn(
	// Layout
	"flex",
	"h-9",
	"items-center",
	"gap-2",
	"px-3",
	// Border
	"border-b",
	"border-border-separator",
	// Animation
	"transition-colors",
	"duration-300",
);

// Command Input Icon
const commandInputIconStyles = cn(
	// Size
	"size-4",
	"shrink-0",
	// Colors
	"text-text-tertiary",
);

// Command Input
const commandInputStyles = cn(
	// Layout
	"flex",
	"h-10",
	"w-full",
	"rounded-md",
	"py-3",
	// Background
	"bg-transparent",
	// Typography
	"typo-body",
	// Colors
	"text-text-primary",
	"placeholder:text-text-quternary",
	"file:text-text-primary",
	// States
	"outline-hidden",
	"disabled:cursor-not-allowed",
	"disabled:opacity-50",
);

// Command List
const commandListStyles = cn(
	// Layout
	"max-h-[300px]",
	"scroll-py-1",
	// Overflow
	"overflow-x-hidden",
	"overflow-y-auto",
	"p-2",
);

// Command Empty
const commandEmptyStyles = cn(
	// Layout
	"py-6",
	"text-center",
	// Typography
	"typo-body",
	// Colors
	"text-text-tertiary",
);

// Command Group
const commandGroupStyles = cn(
	// Layout
	"overflow-hidden",
	"p-2",
	"gap-1",
	"flex",
	"flex-col",
	"group",
	// Colors
	"text-text-tertiary",
	// Group heading styles
	"[&_*[cmdk-group-heading]]:flex",
	"[&_*[cmdk-group-heading]]:items-center",
	"[&_*[cmdk-group-heading]]:h-7",
	"[&_*[cmdk-group-heading]]:px-3",
	"[&_*[cmdk-group-heading]]:py-0",
	"[&_*[cmdk-group-heading]]:typo-label-tiny",
	"[&_*[cmdk-group-heading]]:text-[var(--color-text-secondary)]",
);

// Command Separator
const commandSeparatorStyles = cn(
	// Layout
	"-mx-1",
	"h-px",
	// Colors
	"bg-border-separator",
);

// Command Item
const commandItemStyles = cn(
	// Layout
	"relative",
	"flex",
	"cursor-pointer",
	"items-center",
	"gap-2",
	"rounded",
	"px-2",
	"py-1.5",
	"select-none",
	// Typography
	"typo-body",
	// Colors
	"text-text-primary",
	// States
	"outline-hidden",
	"data-[state=checked]:bg-bg-tertiary",
	"data-[state=checked]:hover:bg-bg-secondary",
	"hover:bg-bg-secondary",
	"hover:text-text-primary",
	"data-[state=checked]:text-text-primary",
	"data-[disabled=true]:pointer-events-none",
	"data-[disabled=true]:opacity-50",
	// SVG styles
	"[&_svg:not([class*='text-'])]:text-text-quaternary",
	"[&_svg]:pointer-events-none",
	"[&_svg]:shrink-0",
	"[&_svg:not([class*='size-'])]:size-4",
);

// Command Shortcut
const commandShortcutStyles = cn(
	// Layout
	"ml-auto",
	// Typography
	"typo-body",
	"tracking-widest",
	// Colors
	"text-text-quaternary",
);

function Command({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive>) {
	return (
		<CommandPrimitive
			data-slot="command"
			className={cn(commandStyles, className)}
			{...props}
		/>
	);
}

function CommandDialog({
	title = "Command Palette",
	description = "Search for a command to run...",
	children,
	className,
	showCloseButton = true,
	...props
}: React.ComponentProps<typeof Dialog> & {
	title?: string;
	description?: string;
	className?: string;
	showCloseButton?: boolean;
}) {
	return (
		<Dialog {...props}>
			<DialogHeader className="sr-only">
				<DialogTitle>{title}</DialogTitle>
				<DialogDescription>{description}</DialogDescription>
			</DialogHeader>
			<DialogContent
				className={cn(commandDialogContentStyles, className)}
				showCloseButton={showCloseButton}
			>
				<Command className={commandDialogCommandStyles}>{children}</Command>
			</DialogContent>
		</Dialog>
	);
}

function CommandInput({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
	return (
		<div
			data-slot="command-input-wrapper"
			className={commandInputWrapperStyles}
		>
			<SearchIcon className={commandInputIconStyles} />
			<CommandPrimitive.Input
				data-slot="command-input"
				className={cn(commandInputStyles, className)}
				{...props}
			/>
		</div>
	);
}

function CommandList({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
	return (
		<CommandPrimitive.List
			data-slot="command-list"
			className={cn(commandListStyles, className)}
			{...props}
		/>
	);
}

function CommandEmpty({
	...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
	return (
		<CommandPrimitive.Empty
			data-slot="command-empty"
			className={commandEmptyStyles}
			{...props}
		/>
	);
}

function CommandGroup({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
	return (
		<CommandPrimitive.Group
			data-slot="command-group"
			className={cn(commandGroupStyles, className)}
			{...props}
		/>
	);
}

function CommandSeparator({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
	return (
		<CommandPrimitive.Separator
			data-slot="command-separator"
			className={cn(commandSeparatorStyles, className)}
			{...props}
		/>
	);
}

function CommandItem({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
	return (
		<CommandPrimitive.Item
			data-slot="command-item"
			className={cn(commandItemStyles, className)}
			{...props}
		/>
	);
}

function CommandShortcut({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="command-shortcut"
			className={cn(commandShortcutStyles, className)}
			{...props}
		/>
	);
}

export {
	Command,
	CommandDialog,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandShortcut,
	CommandSeparator,
};
