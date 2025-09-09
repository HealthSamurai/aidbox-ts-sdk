import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Table container styles
const tableContainerStyles = cn("relative", "w-full", "overflow-x-auto");

// Table styles
const tableStyles = cn("w-full", "caption-bottom", "text-sm");

function Table({ className, ...props }: React.ComponentProps<"table">) {
	return (
		<div data-slot="table-container" className={tableContainerStyles}>
			<table
				data-slot="table"
				className={cn(tableStyles, className)}
				{...props}
			/>
		</div>
	);
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
	return (
		<thead
			data-slot="table-header"
			className={cn(
				"[&_tr]:border-b",
				"[&_tr]:border-border-primary",
				className,
			)}
			{...props}
		/>
	);
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
	return (
		<tbody
			data-slot="table-body"
			className={cn("[&_tr:last-child]:border-0", className)}
			{...props}
		/>
	);
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
	return (
		<tfoot
			data-slot="table-footer"
			className={cn(
				"bg-bg-tertiary/50",
				"border-t",
				"border-border-primary",
				"font-medium",
				"[&>tr]:last:border-b-0",
				className,
			)}
			{...props}
		/>
	);
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
	return (
		<tr
			data-slot="table-row"
			className={cn(
				"hover:bg-bg-tertiary/50",
				"data-[state=selected]:bg-bg-tertiary",
				"border-b",
				"border-border-primary",
				"transition-colors",
				className,
			)}
			{...props}
		/>
	);
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
	return (
		<th
			data-slot="table-head"
			className={cn(
				"text-text-primary",
				"h-10",
				"px-2",
				"text-left",
				"align-middle",
				"font-medium",
				"whitespace-nowrap",
				"[&:has([role=checkbox])]:pr-0",
				"[&>[role=checkbox]]:translate-y-[2px]",
				className,
			)}
			{...props}
		/>
	);
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
	return (
		<td
			data-slot="table-cell"
			className={cn(
				"p-2",
				"align-middle",
				"whitespace-nowrap",
				"[&:has([role=checkbox])]:pr-0",
				"[&>[role=checkbox]]:translate-y-[2px]",
				className,
			)}
			{...props}
		/>
	);
}

function TableCaption({
	className,
	...props
}: React.ComponentProps<"caption">) {
	return (
		<caption
			data-slot="table-caption"
			className={cn("text-text-secondary", "mt-4", "text-sm", className)}
			{...props}
		/>
	);
}

export {
	Table,
	TableHeader,
	TableBody,
	TableFooter,
	TableHead,
	TableRow,
	TableCell,
	TableCaption,
};
