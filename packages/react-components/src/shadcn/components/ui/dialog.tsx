import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Dialog overlay styles
const dialogOverlayStyles = cn(
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

// Dialog content styles
const dialogContentStyles = cn(
	// Layout
	"fixed",
	"top-[50%]",
	"left-[50%]",
	"z-50",
	"grid",
	"w-full",
	"max-w-[calc(100%-2rem)]",
	"translate-x-[-50%]",
	"translate-y-[-50%]",
	"gap-4",
	// Shape
	"rounded-lg",
	// Borders
	"border",
	"border-border-primary",
	// Background & Colors
	"bg-bg-primary",
	// Spacing
	"p-6",
	// Shadow
	"shadow-lg",
	// Animation duration
	"duration-200",
	// Responsive
	"sm:max-w-lg",
	// Animations - open
	"data-[state=open]:animate-in",
	"data-[state=open]:fade-in-0",
	"data-[state=open]:zoom-in-95",
	// Animations - closed
	"data-[state=closed]:animate-out",
	"data-[state=closed]:fade-out-0",
	"data-[state=closed]:zoom-out-95",
);

// Dialog close button styles
const dialogCloseButtonStyles = cn(
	// Layout
	"absolute",
	"top-4",
	"right-4",
	// Shape
	"rounded-xs",
	// Opacity
	"opacity-70",
	"hover:opacity-100",
	// Transitions
	"transition-opacity",
	// Focus
	"focus:ring-2",
	"focus:ring-utility-blue/70",
	"focus:ring-offset-2",
	"focus:outline-hidden",
	// Disabled
	"disabled:pointer-events-none",
	// SVG styles
	"[&_svg]:pointer-events-none",
	"[&_svg]:shrink-0",
	"[&_svg:not([class*='size-'])]:size-4",
	// States
	"data-[state=open]:bg-bg-secondary",
	"data-[state=open]:text-text-secondary",
);

function Dialog({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
	return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
	return (
		<DialogPrimitive.Overlay
			data-slot="dialog-overlay"
			className={cn(dialogOverlayStyles, className)}
			{...props}
		/>
	);
}

function DialogContent({
	className,
	children,
	showCloseButton = true,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
	showCloseButton?: boolean;
}) {
	return (
		<DialogPortal data-slot="dialog-portal">
			<DialogOverlay />
			<DialogPrimitive.Content
				data-slot="dialog-content"
				className={cn(dialogContentStyles, className)}
				{...props}
			>
				{children}
				{showCloseButton && (
					<DialogPrimitive.Close
						data-slot="dialog-close"
						className={dialogCloseButtonStyles}
					>
						<XIcon />
						<span className="sr-only">Close</span>
					</DialogPrimitive.Close>
				)}
			</DialogPrimitive.Content>
		</DialogPortal>
	);
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="dialog-header"
			className={cn(
				"flex",
				"flex-col",
				"gap-2",
				"text-center",
				"sm:text-left",
				className,
			)}
			{...props}
		/>
	);
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="dialog-footer"
			className={cn(
				"flex",
				"flex-col-reverse",
				"gap-2",
				"sm:flex-row",
				"sm:justify-end",
				className,
			)}
			{...props}
		/>
	);
}

function DialogTitle({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			data-slot="dialog-title"
			className={cn("text-lg", "leading-none", "font-semibold", className)}
			{...props}
		/>
	);
}

function DialogDescription({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			data-slot="dialog-description"
			className={cn("text-text-secondary", "text-sm", className)}
			{...props}
		/>
	);
}

export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
};
