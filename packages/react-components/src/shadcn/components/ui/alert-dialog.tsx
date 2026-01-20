import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type { VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";
import * as React from "react";
import type { buttonVariants } from "#shadcn/components/ui/button";
import { Button } from "#shadcn/components/ui/button";
import { cn } from "#shadcn/lib/utils";

function AlertDialog({
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
	return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
	return (
		<AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
	);
}

function AlertDialogPortal({
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
	return (
		<AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
	);
}

// AlertDialog overlay styles
const alertDialogOverlayStyles = cn(
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

function AlertDialogOverlay({
	className,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
	return (
		<AlertDialogPrimitive.Overlay
			data-slot="alert-dialog-overlay"
			className={cn(alertDialogOverlayStyles, className)}
			{...props}
		/>
	);
}

// AlertDialog content styles
const alertDialogContentStyles = cn(
	// Layout
	"fixed",
	"top-[50%]",
	"left-[50%]",
	"z-50",
	"flex",
	"flex-col",
	"w-full",
	"max-w-[calc(100%-2rem)]",
	"translate-x-[-50%]",
	"translate-y-[-50%]",
	// Shape
	"rounded-lg",
	// Borders
	"border",
	"border-border-primary",
	// Background & Colors
	"bg-bg-primary",
	// Shadow
	"dropdown-menu-shadow",
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

// AlertDialog close button styles
const alertDialogCloseButtonStyles = cn(
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
	// Cursor
	"cursor-pointer",
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

function AlertDialogContent({
	className,
	children,
	showCloseButton = true,
	onOpenAutoFocus,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & {
	showCloseButton?: boolean;
}) {
	const contentRef = React.useRef<HTMLDivElement>(null);

	const handleOpenAutoFocus = React.useCallback(
		(event: Event) => {
			// Prevent default focus behavior
			event.preventDefault();

			// Find first focusable element (usually a button in footer)
			if (contentRef.current) {
				const firstFocusable = contentRef.current.querySelector<HTMLElement>(
					'button:not([tabindex="-1"]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
				);

				// Focus on first focusable element, or fallback to content itself
				if (firstFocusable) {
					firstFocusable.focus();
				} else {
					contentRef.current.focus();
				}
			}

			// Call user-provided handler if exists
			if (onOpenAutoFocus) {
				onOpenAutoFocus(event);
			}
		},
		[onOpenAutoFocus],
	);

	return (
		<AlertDialogPortal>
			<AlertDialogOverlay />
			<AlertDialogPrimitive.Content
				ref={contentRef}
				data-slot="alert-dialog-content"
				className={cn(alertDialogContentStyles, className)}
				onOpenAutoFocus={handleOpenAutoFocus}
				{...props}
			>
				{children}
				{showCloseButton && (
					<AlertDialogPrimitive.Cancel
						data-slot="alert-dialog-close"
						className={alertDialogCloseButtonStyles}
						tabIndex={-1}
					>
						<XIcon />
						<span className="sr-only">Close</span>
					</AlertDialogPrimitive.Cancel>
				)}
			</AlertDialogPrimitive.Content>
		</AlertDialogPortal>
	);
}

function AlertDialogHeader({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-dialog-header"
			className={cn(
				// Layout
				"flex",
				"items-center",
				"justify-between",
				"h-[60px]",
				// Spacing
				"px-6",
				// Borders
				"border-b",
				"border-border-separator",
				className,
			)}
			{...props}
		/>
	);
}

function AlertDialogFooter({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-dialog-footer"
			className={cn(
				// Layout
				"flex",
				"items-center",
				"justify-between",
				"h-[60px]",
				// Spacing
				"px-4",
				"py-3",
				// Borders
				"border-t",
				"border-border-separator",
				className,
			)}
			{...props}
		/>
	);
}

function AlertDialogTitle({
	className,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
	return (
		<AlertDialogPrimitive.Title
			data-slot="alert-dialog-title"
			className={cn("typo-page-header", className)}
			{...props}
		/>
	);
}

function AlertDialogDescription({
	className,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
	return (
		<AlertDialogPrimitive.Description
			data-slot="alert-dialog-description"
			className={cn(
				// Typography
				"body14",
				"text-text-secondary_hover",
				// Spacing
				"px-6",
				"pt-3",
				"pb-4",
				className,
			)}
			{...props}
		/>
	);
}

function AlertDialogAction({
	className,
	variant,
	danger,
	asChild = false,
	children,
	...props
}: Omit<React.ComponentProps<typeof AlertDialogPrimitive.Action>, "asChild"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	if (asChild) {
		return (
			<AlertDialogPrimitive.Action asChild {...props}>
				{children}
			</AlertDialogPrimitive.Action>
		);
	}
	// Extract asChild from props to avoid type conflicts
	const { asChild: _asChild, ...restProps } = props as typeof props & {
		asChild?: boolean | null | undefined;
	};
	type ButtonProps = Omit<
		React.ComponentProps<typeof Button>,
		"asChild" | "variant" | "danger" | "className"
	>;
	const buttonProps: React.ComponentProps<typeof Button> = {
		variant,
		className,
		...(danger !== undefined && danger !== null ? { danger } : {}),
		...(restProps as ButtonProps),
	};
	return (
		<AlertDialogPrimitive.Action asChild>
			<Button {...buttonProps}>{children}</Button>
		</AlertDialogPrimitive.Action>
	);
}

function AlertDialogCancel({
	className,
	asChild = false,
	children,
	...props
}: Omit<React.ComponentProps<typeof AlertDialogPrimitive.Cancel>, "asChild"> & {
	asChild?: boolean;
}) {
	if (asChild) {
		return (
			<AlertDialogPrimitive.Cancel asChild {...props}>
				{children}
			</AlertDialogPrimitive.Cancel>
		);
	}
	// Extract asChild from props to avoid type conflicts
	const { asChild: _asChild, ...restProps } = props as typeof props & {
		asChild?: boolean | null | undefined;
	};
	type ButtonProps = Omit<
		React.ComponentProps<typeof Button>,
		"asChild" | "variant" | "className"
	>;
	return (
		<AlertDialogPrimitive.Cancel asChild>
			<Button
				variant="secondary"
				className={className}
				{...(restProps as ButtonProps)}
			>
				{children}
			</Button>
		</AlertDialogPrimitive.Cancel>
	);
}

export {
	AlertDialog,
	AlertDialogPortal,
	AlertDialogOverlay,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogAction,
	AlertDialogCancel,
};
