import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "#shadcn/lib/utils";

function Tabs({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
	return (
		<TabsPrimitive.Root
			data-slot="tabs"
			className={cn("flex flex-col gap-8", className)}
			{...props}
		/>
	);
}

const tabListVariants = cva("", {
	variants: {
		variant: {
			button: "",
			dashed: "",
		},
	},
	defaultVariants: {
		variant: "dashed",
	},
});

function TabsList({
	className,
	variant,
	...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
	VariantProps<typeof tabListVariants>) {
	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			className={cn(
				tabListVariants({ variant }),
				"inline-flex w-fit items-center",
				className,
			)}
			{...props}
		/>
	);
}

function TabsTrigger({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			className={cn(
				"h-10 typo-label px-3 py-2 cursor-pointer text-text-tertiary data-[state=active]:text-text-primary border-b-2",
				"data-[state=active]:border-border-brand border-transparent hover:text-text-tertiary-hover focus-visible:border-ring",
				"focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:text-muted-foreground",
				"inline-flex flex-1 items-center justify-center whitespace-nowrap transition-[color,box-shadow,border]",
				"focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50",
				"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...props}
		/>
	);
}

function TabsContent({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content
			data-slot="tabs-content"
			className={cn("flex-1 outline-none", className)}
			{...props}
		/>
	);
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
