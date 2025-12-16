import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Accordion item styles
const accordionItemStyles = cn("flex", "flex-col");

// Accordion trigger styles
const accordionTriggerStyles = cn(
	// Layout
	"flex",
	"flex-1",
	"items-center",
	"justify-between",
	"gap-2",
	// Typography
	"body16bold",
	"tracking-tight",
	"text-text-primary",
	// Interaction
	"cursor-pointer",
	"transition-all",
	"outline-none",
	// Focus
	"focus-visible:ring-2",
	"focus-visible:ring-utility-blue/70",
	// Disabled
	"disabled:pointer-events-none",
	"disabled:opacity-50",
	// Icon rotation
	"[&[data-state=open]>svg]:rotate-180",
);

// Accordion content styles
const accordionContentStyles = cn(
	"data-[state=closed]:animate-accordion-up",
	"data-[state=open]:animate-accordion-down",
	"overflow-hidden",
);

// Accordion content inner styles
const accordionContentInnerStyles = cn(
	"body14",
	"text-text-secondary_hover",
	"pt-3",
	"pb-0",
);

// Accordion separator styles
const accordionSeparatorStyles = cn(
	"h-px",
	"border-t",
	"border-border-separator",
	"mt-2",
);

// Accordion chevron styles
const accordionChevronStyles = cn(
	"text-text-secondary",
	"pointer-events-none",
	"size-4",
	"shrink-0",
	"transition-transform",
	"duration-200",
);

function Accordion({
	className,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
	return (
		<AccordionPrimitive.Root
			data-slot="accordion"
			className={cn(
				"flex",
				"flex-col",
				"gap-2",
				"[&>[data-slot=accordion-item]:last-child>[data-slot=accordion-separator]]:hidden",
				className,
			)}
			{...props}
		/>
	);
}

function AccordionItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
	return (
		<AccordionPrimitive.Item
			data-slot="accordion-item"
			className={cn(accordionItemStyles, className)}
			{...props}
		>
			{children}
			<div
				data-slot="accordion-separator"
				className={accordionSeparatorStyles}
			/>
		</AccordionPrimitive.Item>
	);
}

function AccordionTrigger({
	className,
	children,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
	return (
		<AccordionPrimitive.Header className="flex">
			<AccordionPrimitive.Trigger
				data-slot="accordion-trigger"
				className={cn(accordionTriggerStyles, className)}
				{...props}
			>
				{children}
				<ChevronDownIcon className={accordionChevronStyles} />
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	);
}

function AccordionContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
	return (
		<AccordionPrimitive.Content
			data-slot="accordion-content"
			className={accordionContentStyles}
			{...props}
		>
			<div className={cn(accordionContentInnerStyles, className)}>
				{children}
			</div>
		</AccordionPrimitive.Content>
	);
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
