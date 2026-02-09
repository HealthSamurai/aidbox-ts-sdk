import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import * as React from "react";

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

// Table header
const tableHeaderStyles = cn(
	"bg-bg-secondary",
	"[&_tr]:border-b",
	"[&_tr]:border-border-secondary",
	"[&_tr]:h-8",
);

// Table header sticky variant
const tableHeaderStickyStyles = cn(
	"sticky",
	"top-0",
	"z-10",
);

// Table body
const tableBodyStyles = cn(
	"[&_tr:last-child]:border-0",
	"[&_tr]:hover:bg-bg-hover",
);

// Table footer
const tableFooterStyles = cn(
	"bg-bg-secondary",
	"border-t",
	"border-border-secondary",
	"font-medium",
	"[&>tr]:last:border-b-0",
);

// Table row
const tableRowStyles = cn(
	"h-7",
	"transition-colors",
	"duration-150",
);

// Table head cell
const tableHeadStyles = cn(
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
	"hover:bg-bg-tertiary",
	"[&:has([role=checkbox])]:pr-0",
);

// Table head sort icon
const tableSortIconStyles = cn(
	"size-3.5",
	"shrink-0",
	"transition-opacity",
	"duration-150",
);

// Table cell
const tableCellStyles = cn(
	"px-4",
	"py-1",
	"align-middle",
	"whitespace-nowrap",
	"text-sm",
	"text-text-primary",
	"[&:has([role=checkbox])]:pr-0",
);

// Table cell link variant
const tableCellLinkStyles = cn(
	"text-text-link",
	"cursor-pointer",
	"hover:underline",
);

// Table caption
const tableCaptionStyles = cn(
	"text-text-secondary",
	"mt-4",
	"text-xs",
	"text-left",
);

// Context for sticky header
const TableStickyContext = React.createContext(false);

type TableProps = React.ComponentProps<"table"> & {
	zebra?: boolean | undefined;
	stickyHeader?: boolean | undefined;
};

function Table({
	className,
	zebra = false,
	stickyHeader = false,
	...props
}: TableProps) {
	return (
		<TableStickyContext.Provider value={stickyHeader}>
			<div data-slot="table-container" className={tableContainerStyles}>
				<table
					data-slot="table"
					data-zebra={zebra}
					className={cn(tableStyles, className)}
					{...props}
				/>
			</div>
		</TableStickyContext.Provider>
	);
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
	const stickyHeader = React.useContext(TableStickyContext);

	return (
		<thead
			data-slot="table-header"
			className={cn(
				tableHeaderStyles,
				stickyHeader && tableHeaderStickyStyles,
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
			className={cn(tableBodyStyles, className)}
			{...props}
		/>
	);
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
	return (
		<tfoot
			data-slot="table-footer"
			className={cn(tableFooterStyles, className)}
			{...props}
		/>
	);
}

type TableRowProps = React.ComponentProps<"tr"> & {
	zebra?: boolean | undefined;
	index?: number | undefined;
	selected?: boolean | undefined;
};

function TableRow({
	className,
	zebra = false,
	index = 0,
	selected = false,
	...props
}: TableRowProps) {
	const isOdd = index % 2 === 1;

	return (
		<tr
			data-slot="table-row"
			className={cn(
				tableRowStyles,
				!zebra && "border-b",
				!zebra && "border-border-secondary",
				zebra && isOdd && "bg-bg-secondary",
				selected && "bg-bg-hover",
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
				tableHeadStyles,
				sortable && "cursor-pointer select-none",
				className,
			)}
			{...props}
		>
			{sortable ? (
				<div className="flex items-center gap-1">
					{children}
					<SortIcon
						className={cn(
							tableSortIconStyles,
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
	return (
		<td
			data-slot="table-cell"
			data-type={type}
			className={cn(
				tableCellStyles,
				type === "link" && tableCellLinkStyles,
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
			className={cn(tableCaptionStyles, className)}
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
