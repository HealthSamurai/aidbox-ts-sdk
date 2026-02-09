import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

// Table container
const tableContainerStyles = cn(
	"relative",
	"h-full",
	"w-full",
	"overflow-auto",
);

// Table base
const tableStyles = cn(
	"w-full",
	"caption-bottom",
	"text-sm",
	"border-collapse",
	"border-spacing-0",
);

type TableProps = React.ComponentProps<"table"> & {
	zebra?: boolean | undefined;
};

function Table({ className, zebra = false, ...props }: TableProps) {
	return (
		<div data-slot="table-container" className={tableContainerStyles}>
			<table
				data-slot="table"
				data-zebra={zebra}
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
				"bg-bg-secondary",
				"[&_tr]:border-b",
				"[&_tr]:border-border-secondary",
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
				"bg-bg-secondary",
				"border-t",
				"border-border-secondary",
				"font-medium",
				"[&>tr]:last:border-b-0",
				className,
			)}
			{...props}
		/>
	);
}

type TableRowProps = React.ComponentProps<"tr"> & {
	zebra?: boolean | undefined;
	index?: number | undefined;
};

function TableRow({
	className,
	zebra = false,
	index = 0,
	...props
}: TableRowProps) {
	const isOdd = index % 2 === 1;

	return (
		<tr
			data-slot="table-row"
			className={cn(
				"h-7",
				!zebra && "border-b",
				!zebra && "border-border-secondary",
				"transition-colors",
				"duration-150",
				"hover:bg-bg-hover",
				zebra && isOdd && "bg-bg-secondary",
				className,
			)}
			{...props}
		/>
	);
}

type TableHeadProps = React.ComponentProps<"th"> & {
	sortable?: boolean | undefined;
	sorted?: "asc" | "desc" | false | undefined;
};

function TableHead({
	className,
	sortable = false,
	sorted = false,
	children,
	...props
}: TableHeadProps) {
	const SortIcon =
		sorted === "asc"
			? ArrowUpIcon
			: sorted === "desc"
				? ArrowDownIcon
				: ArrowUpDownIcon;

	return (
		<th
			data-slot="table-head"
			className={cn(
				"group/head",
				"text-text-secondary",
				"h-8",
				"px-4",
				"py-2",
				"text-left",
				"align-middle",
				"typo-label-xs",
				"whitespace-nowrap",
				"transition-colors",
				"duration-150",
				"[&:has([role=checkbox])]:pr-0",
				"[&>[role=checkbox]]:translate-y-[2px]",
				sortable && "cursor-pointer select-none hover:bg-bg-tertiary",
				className,
			)}
			{...props}
		>
			{sortable ? (
				<div className="flex items-center gap-1">
					{children}
					<SortIcon
						className={cn(
							"size-3.5 shrink-0 transition-opacity duration-150",
							sorted ? "opacity-100" : "opacity-0 group-hover/head:opacity-30",
						)}
					/>
				</div>
			) : (
				children
			)}
		</th>
	);
}

type CellType = "text" | "link";

type TableCellProps = React.ComponentProps<"td"> & {
	type?: CellType | undefined;
};

function TableCell({ className, type = "text", ...props }: TableCellProps) {
	const cellStyles = cn(
		"px-4",
		"py-1",
		"align-middle",
		"whitespace-nowrap",
		"text-sm",
		"text-text-primary",
		"[&:has([role=checkbox])]:pr-0",
		"[&>[role=checkbox]]:translate-y-[2px]",
		type === "link" &&
			"text-text-link cursor-pointer hover:text-text-link_hover underline",
		className,
	);

	return (
		<td
			data-slot="table-cell"
			data-type={type}
			className={cellStyles}
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
			className={cn(
				"text-text-secondary",
				"mt-4",
				"text-xs",
				"text-left",
				className,
			)}
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
	type TableProps,
	type TableRowProps,
	type TableHeadProps,
	type TableCellProps,
	type CellType,
};
