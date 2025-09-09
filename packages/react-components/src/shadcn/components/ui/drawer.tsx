"use client";
import type * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "#shadcn/lib/utils";

// Drawer overlay styles
const drawerOverlayStyles = cn(
	// Layout
	"fixed",
	"inset-0",
	"z-50",
	// Background
	"bg-black/50",
	// Animations - open
	"data-[state=open]:animate-in",
	"data-[state=open]:fade-in-0",
	// Animations - closed
	"data-[state=closed]:animate-out",
	"data-[state=closed]:fade-out-0",
);

// Drawer content styles
const drawerContentStyles = cn(
	// Group
	"group/drawer-content",
	// Background
	"bg-bg-primary",
	// Layout
	"fixed",
	"z-50",
	"flex",
	"h-auto",
	"flex-col",
	// Top direction
	"data-[vaul-drawer-direction=top]:inset-x-0",
	"data-[vaul-drawer-direction=top]:top-0",
	"data-[vaul-drawer-direction=top]:mb-24",
	"data-[vaul-drawer-direction=top]:max-h-[80vh]",
	"data-[vaul-drawer-direction=top]:rounded-b-lg",
	"data-[vaul-drawer-direction=top]:border-b",
	"data-[vaul-drawer-direction=top]:border-border-primary",
	// Bottom direction
	"data-[vaul-drawer-direction=bottom]:inset-x-0",
	"data-[vaul-drawer-direction=bottom]:bottom-0",
	"data-[vaul-drawer-direction=bottom]:mt-24",
	"data-[vaul-drawer-direction=bottom]:max-h-[80vh]",
	"data-[vaul-drawer-direction=bottom]:rounded-t-lg",
	"data-[vaul-drawer-direction=bottom]:border-t",
	"data-[vaul-drawer-direction=bottom]:border-border-primary",
	// Right direction
	"data-[vaul-drawer-direction=right]:inset-y-0",
	"data-[vaul-drawer-direction=right]:right-0",
	"data-[vaul-drawer-direction=right]:w-3/4",
	"data-[vaul-drawer-direction=right]:border-l",
	"data-[vaul-drawer-direction=right]:border-border-primary",
	"data-[vaul-drawer-direction=right]:sm:max-w-sm",
	// Left direction
	"data-[vaul-drawer-direction=left]:inset-y-0",
	"data-[vaul-drawer-direction=left]:left-0",
	"data-[vaul-drawer-direction=left]:w-3/4",
	"data-[vaul-drawer-direction=left]:border-r",
	"data-[vaul-drawer-direction=left]:border-border-primary",
	"data-[vaul-drawer-direction=left]:sm:max-w-sm",
);

// Drawer handle styles
const drawerHandleStyles = cn(
	"bg-bg-tertiary",
	"mx-auto",
	"mt-4",
	"hidden",
	"h-2",
	"w-[100px]",
	"shrink-0",
	"rounded-full",
	"group-data-[vaul-drawer-direction=bottom]/drawer-content:block",
);

// Drawer header styles
const drawerHeaderStyles = cn(
	"flex",
	"flex-col",
	"gap-0.5",
	"p-4",
	"group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center",
	"group-data-[vaul-drawer-direction=top]/drawer-content:text-center",
	"md:gap-1.5",
	"md:text-left",
);

// Drawer footer styles
const drawerFooterStyles = cn("mt-auto", "flex", "flex-col", "gap-2", "p-4");

function Drawer({
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
	return <DrawerPrimitive.Root data-slot="drawer" {...props} />;
}

function DrawerTrigger({
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
	return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
	return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
	return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
	className,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
	return (
		<DrawerPrimitive.Overlay
			data-slot="drawer-overlay"
			className={cn(drawerOverlayStyles, className)}
			{...props}
		/>
	);
}

function DrawerContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
	return (
		<DrawerPortal data-slot="drawer-portal">
			<DrawerOverlay />
			<DrawerPrimitive.Content
				data-slot="drawer-content"
				className={cn(drawerContentStyles, className)}
				{...props}
			>
				<div className={drawerHandleStyles} />
				{children}
			</DrawerPrimitive.Content>
		</DrawerPortal>
	);
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="drawer-header"
			className={cn(drawerHeaderStyles, className)}
			{...props}
		/>
	);
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="drawer-footer"
			className={cn(drawerFooterStyles, className)}
			{...props}
		/>
	);
}

function DrawerTitle({
	className,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
	return (
		<DrawerPrimitive.Title
			data-slot="drawer-title"
			className={cn("text-foreground font-semibold", className)}
			{...props}
		/>
	);
}

function DrawerDescription({
	className,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
	return (
		<DrawerPrimitive.Description
			data-slot="drawer-description"
			className={cn("text-muted-foreground text-sm", className)}
			{...props}
		/>
	);
}

export {
	Drawer,
	DrawerPortal,
	DrawerOverlay,
	DrawerTrigger,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerFooter,
	DrawerTitle,
	DrawerDescription,
};
