import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Accordion item styles
const accordionItemStyles = cn(
	"border-b",
	"border-border-primary",
	"last:border-b-0",
);

// Accordion trigger styles
const accordionTriggerStyles = cn(
	// Layout
	"flex",
	"flex-1",
	"items-start",
	"justify-between",
	"gap-4",
	// Shape
	"rounded-md",
	// Spacing
	"py-4",
	// Typography
	"text-left",
	"text-sm",
	"font-medium",
	// Interaction
	"transition-all",
	"outline-none",
	"hover:underline",
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
	"text-sm",
);

// Accordion content inner styles
const accordionContentInnerStyles = cn("pt-0", "pb-4");

// Accordion chevron styles
const accordionChevronStyles = cn(
	"text-text-secondary",
	"pointer-events-none",
	"size-4",
	"shrink-0",
	"translate-y-0.5",
	"transition-transform",
	"duration-200",
);

function Accordion({
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
	return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
	className,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
	return (
		<AccordionPrimitive.Item
			data-slot="accordion-item"
			className={cn(accordionItemStyles, className)}
			{...props}
		/>
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
