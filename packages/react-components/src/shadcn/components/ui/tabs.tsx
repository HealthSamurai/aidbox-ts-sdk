"use client";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { Plus, X } from "lucide-react";
import type * as React from "react";
import { cn } from "#shadcn/lib/utils";
import { Button } from "./button";

// Base tabs styles
const baseTabsStyles = cn("flex", "flex-col", "h-full");

// Tabs add button container styles
const tabsAddButtonContainerStyles = cn(
	"grow",
	"h-full",
	"bg-bg-secondary",
	"border-l",
	"border-b",
);

// Base tabs trigger styles
const baseTabsTriggerStyles = cn(
	// Layout & Sizing
	"box-border",
	"flex-1",
	"h-10",
	"inline-flex",
	"items-center",
	"justify-center",
	"px-3",
	"whitespace-nowrap",
	// Spacing & Padding
	"pb-2",
	"pt-2.5",
	// Typography
	"typo-body",
	// Colors & States
	"cursor-pointer",
	"text-text-tertiary",
	"hover:bg-bg-secondary/60",
	"hover:text-text-tertiary_hover",
	"data-[state=active]:text-text-primary",
	"data-[state=active]:border-b-border-brand",
	"disabled:opacity-50",
	"disabled:pointer-events-none",
	// Borders
	"border-b-2",
	"border-b-transparent",
	// Focus & Accessibility
	"focus-visible:ring-2",
	"focus-visible:ring-utility-blue/70",
	"focus-visible:outline-1",
	// Transitions
	"transition-[color,box-shadow]",
	// Icons
	"[&_svg]:pointer-events-none",
	"[&_svg]:shrink-0",
	"[&_svg:not([class*='size-'])]:size-4",
	// Groups
	"group/tabs-trigger",
);

// Tabs content styles
const tabsContentStyles = cn("grow", "outline-none", "overflow-auto");

const tabsVariants = cva("", {
	variants: {
		variant: {
			browser: cn(
				// Tabs
				`flex-row 
				 items-center
				 h-10
				 `,
				// TabsList
				`**:data-[slot=tabs-list]:overflow-x-auto
				 **:data-[slot=tabs-list]:divide-x`,
				// TabsTrigger
				`**:data-[slot=tabs-trigger]:max-w-80 
				 **:data-[slot=tabs-trigger]:w-60
				 **:data-[slot=tabs-trigger]:min-w-40
				 **:data-[slot=tabs-trigger]:data-[state=inactive]:border-b-1
				 **:data-[slot=tabs-trigger]:data-[state=inactive]:border-b-border-secondary
				 **:data-[slot=tabs-trigger]:data-[state=inactive]:pt-[9px]
				 `, // TODO: Try to implement this without using pt-[9px].
			),
		},
	},
});

function Tabs({
	className,
	variant,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Root> &
	VariantProps<typeof tabsVariants>) {
	return (
		<TabsPrimitive.Root
			data-slot="tabs"
			className={cn(baseTabsStyles, tabsVariants({ variant }), className)}
			{...props}
		/>
	);
}

export function TabsAddButton(props: React.ComponentProps<typeof Button>) {
	return (
		<div className={tabsAddButtonContainerStyles}>
			<Button
				data-slot="tabs-add-button"
				variant="link"
				className="h-full"
				{...props}
			>
				<Plus />
			</Button>
		</div>
	);
}

function TabsList({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			className={cn("inline-flex w-fit items-center", className)}
			{...props}
		/>
	);
}

function TabsTrigger({
	className,
	onClose,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
	onClose?: (value: string) => void;
}) {
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			className={cn(
				baseTabsTriggerStyles,
				onClose ? "justify-between" : "justify-start",
				className,
			)}
			{...props}
		>
			{props.children}

			{onClose && (
				<Button
					onClick={(event) => {
						event.stopPropagation();
						onClose(props.value);
					}}
					variant="link"
					size="small"
					className="p-0 ml-2 opacity-0 group-hover/tabs-trigger:opacity-100 transition-opacity"
					asChild
				>
					<span>
						<X />
					</span>
				</Button>
			)}
		</TabsPrimitive.Trigger>
	);
}

function TabsContent({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content
			data-slot="tabs-content"
			className={cn(tabsContentStyles, className)}
			{...props}
		/>
	);
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
