import type {
	Column,
	ColumnDef,
	ColumnFiltersState,
	ColumnOrderState,
	ColumnPinningPosition,
	ColumnPinningState,
	ColumnSizingState,
	Header,
	PaginationState,
	Row,
	RowPinningState,
	SortingState,
	TableOptions,
	Table as TanstackTable,
} from "@tanstack/react-table";
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	ArrowLeftToLine,
	ArrowRightToLine,
	ChevronDown,
	ChevronUp,
	GripVertical,
	MoreHorizontal,
	PinOff,
	SearchIcon,
} from "lucide-react";
import type { CSSProperties, MouseEventHandler } from "react";
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Button } from "#shadcn/components/ui/button.js";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#shadcn/components/ui/dropdown-menu.js";
import { Input } from "#shadcn/components/ui/input.js";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#shadcn/components/ui/select.js";
import { Skeleton } from "#shadcn/components/ui/skeleton";
import { cn } from "#shadcn/lib/utils";
import { DatePicker } from "./date-picker";
import { DateRangePicker } from "./date-range-picker";

const styles = {
	tableContainer: cn(
		"block",
		"w-full",
		"overflow-x-auto",
		"border",
		"border-border-secondary",
		"rounded-md",
	),
	table: cn(
		"w-full",
		"table-fixed",
		"border-collapse",
		"text-sm",
		"[&_td]:border-border",
		"[&_th]:border-border",
		"border-separate",
		"border-spacing-0",
		"[&_tfoot_td]:border-t",
		"[&_th]:border-b",
		"[&_tr]:border-none",
	),
	cellPadding: cn("px-4"),
	pinnedColumn: cn(
		"data-pinned:bg-background/90",
		"data-pinned:backdrop-blur-xs",
		"[&[data-pinned=left][data-last-col=left]]:border-r",
		"[&[data-pinned=left][data-last-col=left]]:border-r-border-primary",
		"[&[data-pinned=right][data-last-col=right]]:border-l",
		"[&[data-pinned=right][data-last-col=right]]:border-l-border-primary",
	),
	pinnedHeader: cn(
		"data-pinned:bg-muted/90",
		"data-pinned:backdrop-blur-xs",
		"[&[data-pinned=left][data-last-col=left]]:border-r",
		"[&[data-pinned=left][data-last-col=left]]:border-r-border-primary",
		"[&[data-pinned=right][data-last-col=right]]:border-l",
		"[&[data-pinned=right][data-last-col=right]]:border-l-border-primary",
	),
	thead: cn("bg-bg-secondary"),
	th: cn("h-8", "text-left", "font-medium", "text-text-primary", "select-none"),
	thSortable: cn("cursor-pointer", "hover:bg-bg-tertiary"),
	thSorted: cn("bg-bg-link/3", "border-b", "border-border-link"),
	thRightAlign: cn("text-right"),
	cellSorted: cn("bg-bg-link/3"),
	headerContent: cn(
		"h-8",
		"flex",
		"items-center",
		"justify-between",
		"typo-body",
		"text-text-secondary",
		"relative",
		"w-full",
	),
	headerText: cn("truncate", "pr-3"),
	headerIcons: cn("flex", "flex-col", "items-center", "justify-center"),
	headerIcon: cn("w-3", "h-3"),
	headerIconInactive: cn("w-3", "h-3", "opacity-30"),
	cellContent: cn("h-8", "flex", "items-center", "text-text-primary"),
	cellText: cn("truncate"),
	cellCode: cn("h-8", "flex", "items-center", "text-text-primary", "typo-code"),
	cellRightAlign: cn("justify-end"),
	cellTextRightAlign: cn("text-right"),
	filterRow: cn("bg-white", "border-b", "border-border-secondary"),
	filterCell: cn("px-1", "h-8"),
	filterCellPinned: cn("px-1", "h-8", "bg-white/90", "backdrop-blur-xs"),
	filterActions: cn("text-text-tertiary", "text-sm"),
	filterInput: cn("border-0", "h-8"),
	filterIcon: cn("w-4", "h-4", "text-text-tertiary"),
	dataRow: cn("hover:bg-bg-link/10"),
	dataRowZebra: cn("bg-bg-secondary", "hover:bg-bg-link/10"),
	dataCell: cn("h-8"),
	actionButton: cn(
		"text-text-link",
		"hover:text-text-link_hover",
		"transition-colors",
		"cursor-pointer",
	),
	actionLink: cn(
		"text-text-link",
		"hover:text-text-link_hover",
		"transition-colors",
		"cursor-pointer",
	),
	resizeHandle: cn(
		"absolute",
		"right-0",
		"top-0",
		"h-full",
		"w-1",
		"px-1",
		"bg-border-primary",
		"cursor-col-resize",
		"user-select-none",
		"touch-action-none",
		"opacity-0",
		"hover:opacity-100",
		"active:opacity-100",
		"transition-opacity",
		"duration-150",
		"before:absolute",
		"before:right-[-4px]",
		"before:top-0",
		"before:w-2",
		"before:h-full",
		"before:content-['']",
	),
	resizeHandleActive: cn("opacity-100", "bg-border-link"),
	resizableHeader: cn(
		"group-hover:[&:not(:last-child)]:after:opacity-30",
		"after:absolute",
		"after:right-0",
		"after:top-1/2",
		"after:-translate-y-1/2",
		"after:h-4",
		"after:w-px",
		"after:bg-border-primary",
		"after:opacity-0",
		"after:transition-opacity",
		"after:duration-150",
		"hover:after:opacity-50",
		"last:after:w-0",
	),
	draggableHeader: cn("transition-all", "duration-150", "group/header"),
	dragZone: cn(
		"absolute",
		"left-0",
		"top-0",
		"h-full",
		"cursor-grab",
		"active:cursor-grabbing",
		"flex",
		"items-center",
		"justify-start",
		"pl-0",
		"opacity-0",
		"hover:opacity-100",
		"group-hover/header:opacity-60",
		"hover:!opacity-100",
		"transition-opacity",
		"duration-150",
		"bg-transparent",
		"border-none",
		"text-text-tertiary",
		"hover:text-text-secondary",
		"right-5",
	),
	draggingHeader: cn(
		"bg-bg-primary_inverse/10",
		"scale-105",
		"shadow-lg",
		"z-50",
	),
	draggingColumn: cn("bg-bg-primary_inverse/10", "shadow-inner"),
	dropZone: cn(
		"relative",
		"before:absolute",
		"before:left-0",
		"before:top-0",
		"before:w-1",
		"before:h-full",
		"before:bg-border-link",
		"before:opacity-0",
		"before:transition-opacity",
		"before:duration-150",
	),
	dropZoneActive: cn("before:opacity-100"),
} as const;

const getPinningStyles = <T,>(column: Column<T>): CSSProperties => {
	const isPinned = column.getIsPinned();
	return {
		left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
		right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
		position: isPinned ? "sticky" : "relative",
		zIndex: isPinned ? 1 : 0,
	};
};

const Table = ({ className, ...props }: React.ComponentProps<"table">) => (
	<table className={className} {...props} />
);

const TableHeader = ({
	className,
	...props
}: React.ComponentProps<"thead">) => <thead className={className} {...props} />;

type SkeletonWhenNoDataProps<T> = {
	table: TanstackTable<T>;
	draggedColumn: string | null;
	dropTarget: string | null;
	showZebraStripes: boolean;
};

const SkeletonWhenNoData = <TData, _>({
	table,
	showZebraStripes,
	draggedColumn,
	dropTarget,
}: SkeletonWhenNoDataProps<TData>) => {
	return (
		<>
			<tr
				className={cn(styles.dataRow, showZebraStripes && styles.dataRowZebra)}
			>
				{table.getVisibleFlatColumns().map((column) => (
					<TableCell
						key={`skeleton1-${column.id}`}
						column={column}
						draggedColumn={draggedColumn}
						dropTarget={dropTarget}
					>
						<Skeleton className="h-5 w-full" />
					</TableCell>
				))}
			</tr>
			<tr
				className={cn(styles.dataRow, showZebraStripes && styles.dataRowZebra)}
			>
				{table.getVisibleFlatColumns().map((column) => (
					<TableCell
						key={`skeleton2-${column.id}`}
						column={column}
						draggedColumn={draggedColumn}
						dropTarget={dropTarget}
					>
						<Skeleton className="h-5 w-full" />
					</TableCell>
				))}
			</tr>
			<tr
				className={cn(styles.dataRow, showZebraStripes && styles.dataRowZebra)}
			>
				{table.getVisibleFlatColumns().map((column) => (
					<TableCell
						key={`skeleton3-${column.id}`}
						column={column}
						draggedColumn={draggedColumn}
						dropTarget={dropTarget}
					>
						<Skeleton className="h-5 w-full" />
					</TableCell>
				))}
			</tr>
		</>
	);
};

const zebraRowStyle = (rowIndex: number, showFilters: boolean) => {
	const effectiveIndex = showFilters ? rowIndex : rowIndex + 1;
	return effectiveIndex % 2 === 0 ? styles.dataRowZebra : "";
};

type TableBodyProps<T> = {
	table: TanstackTable<T>;
	pinnedRows: PinnedRows | undefined;
	draggedColumn: string | null;
	dropTarget: string | null;
	filterConfigMap: Map<string, FilterConfig>;
	handleRowClick: (row: T) => MouseEventHandler<HTMLTableRowElement>;
	showZebraStripes: boolean;
	isLoading?: boolean;
} & React.ComponentProps<"tbody">;

const TableBody = <TData, _>({
	table,
	pinnedRows,
	draggedColumn,
	dropTarget,
	filterConfigMap,
	handleRowClick,
	showZebraStripes,
	isLoading = false,
	className,
	...props
}: TableBodyProps<TData>) => {
	const showFilters = filterConfigMap.size > 0;

	if (pinnedRows) {
		return (
			<tbody className={className} {...props}>
				{showFilters && (
					<FilterRow
						headers={table.getHeaderGroups()[0]?.headers || []}
						draggedColumn={draggedColumn}
						dropTarget={dropTarget}
						filterConfigMap={filterConfigMap}
					/>
				)}
				{table.getTopRows().map((row, rowIndex) => (
					<TableRow
						key={`row-${row.id}`}
						row={row}
						isLoading={isLoading}
						onClick={handleRowClick(row.original)}
						draggedColumn={draggedColumn}
						dropTarget={dropTarget}
						rowIndex={rowIndex}
						className={
							showZebraStripes
								? zebraRowStyle(rowIndex, showFilters)
								: undefined
						}
					/>
				))}
				<GapRow table={table}>
					{pinnedRows.gap ? pinnedRows.gap : <span />}
				</GapRow>
				{table.getCenterRows().map((row, rowIndex) => (
					<TableRow
						key={`row-${row.id}`}
						row={row}
						isLoading={isLoading}
						onClick={handleRowClick(row.original)}
						draggedColumn={draggedColumn}
						dropTarget={dropTarget}
						rowIndex={rowIndex}
						className={
							showZebraStripes
								? zebraRowStyle(rowIndex, showFilters)
								: undefined
						}
					/>
				))}
			</tbody>
		);
	} else {
		const rows = table.getRowModel().rows;

		return (
			<tbody className={className} {...props}>
				{filterConfigMap.size > 0 && (
					<FilterRow
						headers={table.getHeaderGroups()[0]?.headers || []}
						draggedColumn={draggedColumn}
						dropTarget={dropTarget}
						filterConfigMap={filterConfigMap}
					/>
				)}
				{rows.length === 0 ? (
					isLoading ? (
						<SkeletonWhenNoData
							table={table}
							draggedColumn={draggedColumn}
							dropTarget={dropTarget}
							showZebraStripes={showZebraStripes}
						/>
					) : (
						<GapRow table={table}>
							<span>No data</span>
						</GapRow>
					)
				) : (
					rows.map((row, rowIndex) => (
						<TableRow
							key={`row-${row.id}`}
							row={row}
							isLoading={isLoading}
							onClick={handleRowClick(row.original)}
							draggedColumn={draggedColumn}
							dropTarget={dropTarget}
							rowIndex={rowIndex}
							className={
								showZebraStripes
									? zebraRowStyle(rowIndex, showFilters)
									: undefined
							}
						/>
					))
				)}
			</tbody>
		);
	}
};

type TableRowProps<T> = {
	row: Row<T>;
	isLoading: boolean;
	draggedColumn: string | null;
	dropTarget: string | null;
	rowIndex: number;
} & React.ComponentProps<"tr">;

const TableRow = <TData, _>({
	row,
	isLoading,
	onClick,
	draggedColumn,
	dropTarget,
	rowIndex,
	className,
	...props
}: TableRowProps<TData>) => {
	return (
		<tr className={cn(styles.dataRow, className)} onClick={onClick} {...props}>
			{isLoading
				? row.getVisibleCells().map((cell) => (
						<TableCell
							key={cell.id}
							column={cell.column}
							draggedColumn={draggedColumn}
							dropTarget={dropTarget}
						>
							<Skeleton className="h-5 w-full" />
						</TableCell>
					))
				: row.getVisibleCells().map((cell) => (
						<TableCell
							key={cell.id}
							column={cell.column}
							draggedColumn={draggedColumn}
							dropTarget={dropTarget}
						>
							{flexRender(cell.column.columnDef.cell, cell.getContext())}
						</TableCell>
					))}
		</tr>
	);
};

type GapRowProps<T> = {
	table: TanstackTable<T>;
} & React.ComponentProps<"tr">;

const GapRow = <T, _>({
	content,
	table,
	className,
	children,
	...props
}: GapRowProps<T>) => {
	return (
		<tr className={className} {...props}>
			<td
				colSpan={table.getVisibleFlatColumns().length}
				className="text-center py-4 text-gray-500"
			>
				{children}
			</td>
		</tr>
	);
};

export type TableHeaderSortProps = {
	isSorted: false | "asc" | "desc";
};

const TableHeaderSort = ({ isSorted }: TableHeaderSortProps) => {
	return (
		<div className={styles.headerIcons}>
			{isSorted === "asc" ? (
				<ChevronUp className={styles.headerIcon} />
			) : isSorted === "desc" ? (
				<ChevronDown className={styles.headerIcon} />
			) : (
				<div className="flex flex-col">
					<ChevronUp className={styles.headerIconInactive} />
					<ChevronDown className={styles.headerIconInactive} />
				</div>
			)}
		</div>
	);
};

export type TableHeaderResizeProps<T> = {
	header: Header<T, unknown>;
};

const TableHeaderResize = <TData, _>({
	header,
}: TableHeaderResizeProps<TData>) => {
	if (
		!header.column.columnDef.enableResizing ||
		!header.column.getCanResize()
	) {
		return null;
	}

	return (
		<div
			data-resize-handle
			{...{
				onMouseDown: header.getResizeHandler(),
				onTouchStart: header.getResizeHandler(),
				onClick: (e: React.MouseEvent) => e.stopPropagation(),
				className: cn(
					styles.resizeHandle,
					header.column.getIsResizing() && styles.resizeHandleActive,
				),
			}}
		/>
	);
};

export type TableHeaderDragProps = {
	onDragStart: (e: React.DragEvent<HTMLButtonElement>) => void;
	onDragEnd: () => void;
};

const TableHeaderDrag = ({ onDragStart, onDragEnd }: TableHeaderDragProps) => {
	return (
		<button
			type="button"
			data-drag-zone
			draggable
			className={styles.dragZone}
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
		>
			<GripVertical className="w-4 h-4" />
		</button>
	);
};

export type TableHeaderPinProps<T> = {
	header: Header<T, unknown>;
	isPinned: ColumnPinningPosition;
};

const TableHeaderPin = <TData, _>({
	header,
	isPinned,
}: TableHeaderPinProps<TData>) => {
	const unpin = () => header.column.pin(false);
	const pinLeft = () => header.column.pin("left");
	const pinRight = () => header.column.pin("right");

	return isPinned ? (
		<Button
			size="small"
			variant="ghost"
			className="h-6 w-6 p-0 ml-1 opacity-60 hover:opacity-100"
			onClick={unpin}
			title="Unpin column"
		>
			<PinOff className="h-3 w-3" />
		</Button>
	) : (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					size="small"
					variant="ghost"
					className="h-6 w-6 p-0 ml-1 opacity-60 hover:opacity-100"
					title="Pin column"
				>
					<MoreHorizontal className="h-3 w-3" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={pinLeft}>
					<ArrowLeftToLine className="mr-2 h-4 w-4" />
					Stick to left
				</DropdownMenuItem>
				<DropdownMenuItem onClick={pinRight}>
					<ArrowRightToLine className="mr-2 h-4 w-4" />
					Stick to right
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

type TableHeadProps<T> = {
	header: Header<T, unknown>;
	columnOrder: string[];
	enableColumnReordering: boolean;
	draggedColumn: string | null;
	dropTarget: string | null;
	onDropColumn: (x: string | null) => void;
	onChangeDraggedColumn: (x: string | null) => void;
	onChangeColumnOrder: (order: ColumnOrderState) => void;
} & React.ComponentProps<"th">;

const TableHead = <TData, _>({
	header,
	columnOrder,
	draggedColumn,
	dropTarget,
	enableColumnReordering,
	onDropColumn,
	onChangeDraggedColumn,
	onChangeColumnOrder,
	className,
	...props
}: TableHeadProps<TData>) => {
	const columnKey = header.id;
	const isSortable = header.column.columnDef.enableSorting;
	const isPinned = header.column.getIsPinned();
	const isSorted = header.column.getIsSorted();
	const isDraggable = enableColumnReordering && !isPinned;
	const isDragging = draggedColumn === columnKey;
	const isDropTarget = dropTarget === columnKey;
	const isLastLeftPinned =
		isPinned === "left" && header.column.getIsLastColumn("left");
	const isFirstRightPinned =
		isPinned === "right" && header.column.getIsFirstColumn("right");

	const onClick = useCallback(
		(e: React.MouseEvent<HTMLTableCellElement>) => {
			const target = e.target as HTMLElement;
			if (
				target.closest("[data-resize-handle]") ||
				target.closest("[data-drag-zone]") ||
				target.closest("button") ||
				target.closest("[role='menu']")
			) {
				return;
			}
			if (header.column.columnDef.enableSorting) {
				isSorted
					? isSorted === "desc"
						? header.column.toggleSorting(false)
						: header.column.clearSorting()
					: header.column.toggleSorting(true);
			}
		},
		[header.column, isSorted],
	);

	const onDragOver = useCallback(
		(e: React.DragEvent<HTMLTableCellElement>) => {
			if (!isDraggable || !draggedColumn || draggedColumn === columnKey) return;
			e.preventDefault();
			onDropColumn(columnKey);
		},
		[isDraggable, draggedColumn, columnKey, onDropColumn],
	);

	const onDragLeave = useCallback(
		(e: React.DragEvent<HTMLTableCellElement>) => {
			const rect = e.currentTarget.getBoundingClientRect();
			const x = e.clientX;
			const y = e.clientY;
			if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
				onDropColumn(null);
			}
		},
		[onDropColumn],
	);

	const onDrop = useCallback(
		(e: React.DragEvent<HTMLTableCellElement>) => {
			e.preventDefault();
			if (!isDraggable || !draggedColumn) return;

			const draggedIndex = columnOrder.indexOf(draggedColumn);
			const targetIndex = columnOrder.indexOf(columnKey);

			if (draggedIndex !== -1 && targetIndex !== -1) {
				const newOrder = [...columnOrder];
				newOrder.splice(draggedIndex, 1);
				newOrder.splice(targetIndex, 0, draggedColumn);
				onChangeColumnOrder(newOrder);
			}

			onChangeDraggedColumn(null);
			onDropColumn(null);
		},
		[
			isDraggable,
			draggedColumn,
			columnOrder,
			columnKey,
			onChangeColumnOrder,
			onChangeDraggedColumn,
			onDropColumn,
		],
	);

	const onDragStart = useCallback(
		(e: React.DragEvent<HTMLButtonElement>) => {
			onChangeDraggedColumn(columnKey);
			e.dataTransfer.effectAllowed = "move";
		},
		[columnKey, onChangeDraggedColumn],
	);

	const onDragEnd = useCallback(() => {
		onChangeDraggedColumn(null);
		onDropColumn(null);
	}, [onChangeDraggedColumn, onDropColumn]);

	return (
		<th
			className={cn(
				styles.cellPadding,
				styles.th,
				styles.pinnedHeader,
				"relative",
				isSortable && styles.thSortable,
				isSorted && styles.thSorted,
				header.column.columnDef.enableResizing &&
					header.column.getCanResize() &&
					styles.resizableHeader,
				// this style degradate perfomance!
				// isDraggable &&  styles.draggableHeader,
				isDragging && styles.draggingHeader,
				isDragging && styles.draggingColumn,
				isDropTarget && styles.dropZone,
				isDropTarget && styles.dropZoneActive,
				className,
			)}
			style={{
				...getPinningStyles(header.column),
				width: `calc(var(--header-${header?.id}-size) * 1px)`,
			}}
			data-pinned={isPinned || undefined}
			data-last-col={
				isLastLeftPinned ? "left" : isFirstRightPinned ? "right" : undefined
			}
			onClick={onClick}
			onDragOver={onDragOver}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
			{...props}
		>
			{isDraggable && (
				<TableHeaderDrag onDragStart={onDragStart} onDragEnd={onDragEnd} />
			)}
			<div className={styles.headerContent}>
				{flexRender(header.column.columnDef.header, header.getContext())}
				<div className="flex items-center">
					{isSortable && <TableHeaderSort isSorted={isSorted} />}
					{header.column.columnDef.enablePinning && (
						<TableHeaderPin isPinned={isPinned} header={header} />
					)}
				</div>
			</div>
			<TableHeaderResize header={header} />
		</th>
	);
};

type TableCellProps<TData, TValue> = {
	column: Column<TData, TValue>;
	draggedColumn: string | null;
	dropTarget: string | null;
} & React.ComponentProps<"td">;

const TableCell = <TData, TValue>({
	column,
	draggedColumn,
	dropTarget,
	className,
	...props
}: TableCellProps<TData, TValue>) => {
	const columnKey = column.id;
	const isPinned = column.getIsPinned();
	const isSorted = column.columnDef.enableSorting && column.getIsSorted();
	const isBeingDragged = draggedColumn === columnKey;
	const isDropTarget = dropTarget === columnKey;
	const isLastLeftPinned =
		isPinned === "left" && column.getIsLastColumn("left");
	const isFirstRightPinned =
		isPinned === "right" && column.getIsFirstColumn("right");

	return (
		<td
			className={cn(
				styles.cellPadding,
				styles.dataCell,
				styles.pinnedColumn,
				isSorted && styles.cellSorted,
				isBeingDragged && styles.draggingColumn,
				isDropTarget && styles.dropZone,
				isDropTarget && styles.dropZoneActive,
				className,
			)}
			style={{
				...getPinningStyles(column),
				width: `calc(var(--col-${column.id}-size) * 1px)`,
			}}
			data-pinned={isPinned || undefined}
			data-last-col={
				isLastLeftPinned ? "left" : isFirstRightPinned ? "right" : undefined
			}
			{...props}
		/>
	);
};

export type TableHeaderContentProps = {
	content: React.ReactNode;
};

export function TableHeaderContent({ content }: TableHeaderContentProps) {
	return <span className={styles.headerText}>{content}</span>;
}

export type TableCellContentProps = {
	content: React.ReactNode;
};

export function TableCellContent({ content }: TableCellContentProps) {
	return (
		<div
			className={cn("text-sm font-normal leading-[24px] truncate w-full")}
			title={typeof content === "string" ? content : undefined}
		>
			{content}
		</div>
	);
}

export type TableDoubleCellContentProps = {
	content1: string | React.ReactNode;
	content2: string | React.ReactNode;
};

export function TableDoubleCellContent({
	content1,
	content2,
}: TableDoubleCellContentProps) {
	return (
		<div className={cn("text-sm font-normal truncate w-full leading-[24px]")}>
			<div className="truncate w-full">{content1}</div>
			<div className="truncate w-full">{content2}</div>
		</div>
	);
}

type BaseFilterConfig = {
	columnId: string;
	enabled: boolean;
};

export type TextFilterConfig = BaseFilterConfig & {
	type: "text";
	placeholder?: string;
	value?: string;
};

export type DateFilterConfig = BaseFilterConfig & {
	type: "date";
	placeholder?: string;
	value?: Date;
};

export type DateRangeFilterConfig = BaseFilterConfig & {
	type: "date-range";
	fromPlaceholder?: string;
	toPlaceholder?: string;
	value?: {
		from: string;
		to: string;
	};
};

export type NumberFilterConfig = BaseFilterConfig & {
	type: "number";
	value?: string;
	placeholder?: string;
	min?: number;
	max?: number;
	step?: number;
};

export type EnumFilterConfig = BaseFilterConfig & {
	type: "enum";
	options: { label: string; value: string }[] | string[];
	placeholder?: string;
	value?: string;
};

export type FilterConfig =
	| TextFilterConfig
	| DateFilterConfig
	| DateRangeFilterConfig
	| NumberFilterConfig
	| EnumFilterConfig;

export const isTextFilter = (
	filter: FilterConfig,
): filter is TextFilterConfig => {
	return filter.type === "text";
};

export const isDateFilter = (
	filter: FilterConfig,
): filter is DateFilterConfig => {
	return filter.type === "date";
};

export const isDateRangeFilter = (
	filter: FilterConfig,
): filter is DateRangeFilterConfig => {
	return filter.type === "date-range";
};

export const isNumberFilter = (
	filter: FilterConfig,
): filter is NumberFilterConfig => {
	return filter.type === "number";
};

export const isEnumFilter = (
	filter: FilterConfig,
): filter is EnumFilterConfig => {
	return filter.type === "enum";
};

type FilterValue = string | number | Date | { from?: Date; to?: Date };

type BaseFilterProps = {
	columnId: string;
	onValueChange: (value: FilterValue | undefined) => void;
};

type TextFilterProps = {
	filter: TextFilterConfig;
} & BaseFilterProps;

type DateFilterProps = {
	filter: DateFilterConfig;
} & BaseFilterProps;

type DateRangeFilterProps = {
	filter: DateRangeFilterConfig;
} & BaseFilterProps;

type NumberFilterProps = {
	filter: NumberFilterConfig;
} & BaseFilterProps;

type EnumFilterProps = {
	filter: EnumFilterConfig;
} & BaseFilterProps;

const filterInputClasses =
	"h-full text-sm border-0 bg-transparent focus-visible:ring-0 placeholder:text-[#CCCED3] pl-8 focus:outline-none";
const filterIconClasses =
	"absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none";

export const TextFilter: React.FC<TextFilterProps> = ({
	columnId,
	onValueChange,
	filter,
}: TextFilterProps) => {
	return (
		<div className="relative h-full">
			<div className={filterIconClasses}>
				<SearchIcon />
			</div>
			<Input
				key={columnId}
				type="text"
				placeholder={filter.placeholder || columnId}
				value={filter.value || ""}
				onChange={(e) => onValueChange(e.target.value)}
				className={filterInputClasses}
			/>
		</div>
	);
};

export const DateFilter: React.FC<DateFilterProps> = ({
	columnId,
	onValueChange,
	filter,
}: DateFilterProps) => {
	return (
		<DatePicker
			key={columnId}
			onDateChange={onValueChange}
			value={filter.value}
		/>
	);
};

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
	columnId,
	onValueChange,
	filter,
}: DateRangeFilterProps) => {
	// Convert string dates to Date objects for the component

	const dateValue =
		filter.value?.from && filter.value.to
			? {
					from: new Date(filter.value.from),
					to: new Date(filter.value.to),
				}
			: undefined;

	return (
		<DateRangePicker
			key={columnId}
			value={dateValue}
			onDateRangeChange={onValueChange}
			fromPlaceholder={filter.fromPlaceholder}
			toPlaceholder={filter.toPlaceholder}
		/>
	);
};

export const NumberFilter: React.FC<NumberFilterProps> = ({
	columnId,
	filter,
	onValueChange,
}: NumberFilterProps) => {
	return (
		<Input
			key={columnId}
			placeholder={filter.placeholder || columnId}
			value={filter.value || ""}
			onChange={(e) => onValueChange(e.target.value)}
			className="h-full text-sm border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent placeholder:text-[#CCCED3] px-0"
			min={filter.min}
			max={filter.max}
			step={filter.step}
		/>
	);
};

export const EnumFilter: React.FC<EnumFilterProps> = ({
	filter,
	columnId,
	onValueChange,
}) => {
	const CLEAR_VALUE = "__CLEAR__";

	const selectValue =
		filter.value === undefined || filter.value === null || filter.value === ""
			? undefined
			: filter.value;

	const handleValueChange = (value: string) => {
		if (value === CLEAR_VALUE) {
			onValueChange(undefined);
		} else {
			onValueChange(value);
		}
	};

	return (
		<Select
			value={selectValue || CLEAR_VALUE}
			onValueChange={handleValueChange}
		>
			<SelectTrigger size="small" className="w-full">
				<SelectValue placeholder={filter.placeholder || columnId} />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value={CLEAR_VALUE}>
					<span className="text-gray-500 italic">Clear selection</span>
				</SelectItem>
				{filter.options.map((opt) => {
					const val = typeof opt === "string" ? opt : opt.value;
					const label = typeof opt === "string" ? opt : opt.label;
					return (
						<SelectItem key={val} value={val}>
							{label}
						</SelectItem>
					);
				})}
			</SelectContent>
		</Select>
	);
};

type FilterCellProps<TData, TValue> = {
	filter: FilterConfig;
	header: Header<TData, TValue>;
};

function FilterCell<TData, TValue>({
	filter,
	header,
}: FilterCellProps<TData, TValue>) {
	const handleValueChange = useCallback(
		(value: FilterValue | undefined) => {
			header.column.setFilterValue(value);
		},
		[header.column],
	);

	switch (filter.type) {
		case "enum":
			return (
				<EnumFilter
					filter={filter}
					columnId={filter.columnId}
					onValueChange={handleValueChange}
				/>
			);
		case "date-range":
			return (
				<DateRangeFilter
					filter={filter}
					columnId={filter.columnId}
					onValueChange={handleValueChange}
				/>
			);
		case "number":
			return (
				<NumberFilter
					filter={filter}
					columnId={filter.columnId}
					onValueChange={handleValueChange}
				/>
			);
		case "date":
			return (
				<DateFilter
					filter={filter}
					columnId={filter.columnId}
					onValueChange={handleValueChange}
				/>
			);
		default:
			return (
				<TextFilter
					filter={filter}
					columnId={filter.columnId}
					onValueChange={handleValueChange}
				/>
			);
	}
}

type FilterRowProps<TData, TValue> = {
	headers: Header<TData, TValue>[];
	draggedColumn: string | null;
	dropTarget: string | null;
	filterConfigMap: Map<string, FilterConfig>;
};

function FilterRow<TData, TValue>({
	headers,
	draggedColumn,
	dropTarget,
	filterConfigMap: searchConfigMap,
}: FilterRowProps<TData, TValue>) {
	return (
		<tr className={styles.filterRow}>
			{headers.map((header) => {
				const filterConfig = searchConfigMap.get(header.column.id);

				return (
					<TableCell
						key={`filter-${header.id}`}
						column={header.column}
						draggedColumn={draggedColumn}
						dropTarget={dropTarget}
					>
						{filterConfig ? (
							<FilterCell filter={filterConfig} header={header} />
						) : (
							<div className={styles.filterActions}></div>
						)}
					</TableCell>
				);
			})}
		</tr>
	);
}

export type ColumnFilterConfig = FilterConfig[];

export type PinnedRows = {
	rowIds: string[];
	gap?: React.ReactNode;
};

export type UiState = {
	columnOrder: ColumnOrderState;
	columnSizing: ColumnSizingState;
	columnPinning: ColumnPinningState;
};

type PaginationComponentType = React.ComponentType<{
	canPrevious: boolean;
	canNext: boolean;
	currentPage: number;
	pageSize: number;
	onChangePage: (i: number) => void;
	onPageSizeChange: (v: number) => void;
	pageCount?: number | undefined;
}>;

export type DataTableProps<T> = {
	columns: ColumnDef<T>[];
	data: T[];
	pageIndex: number;
	pageSize: number;
	getRowId?: (
		originalRow: T,
		index: number,
		parent?: Row<T> | undefined,
	) => string;
	pageCount?: number;
	filterConfig?: ColumnFilterConfig;
	sortingConfig?: SortingState;
	showZebraStripes?: boolean;
	enableColumnReordering?: boolean;
	onSort?: (sorting: SortingState) => void;
	onFilter?: (filters: ColumnFiltersState) => void;
	onPaginationChange?: (pagination: PaginationState) => void;
	onRowClick?: (row: T) => void;
	onUiChange?: (uiState: UiState) => void;
	initialUiState?: UiState;
	pinnedRows?: PinnedRows;
	// getRowId: ((originalRow: T, index: number, parent?: Row<T> | undefined) => string)
	isLoading?: boolean;
	paginationComponent?: PaginationComponentType;
};

export const MemoizedTableBody = React.memo(
	TableBody,
	(prev, next) => prev.table.options.data === next.table.options.data,
) as typeof TableBody;

export function DataTable<T>({
	columns,
	data,
	pinnedRows,
	pageIndex,
	pageSize,
	pageCount,
	filterConfig,
	sortingConfig,
	showZebraStripes = false,
	enableColumnReordering = false,
	onSort,
	onFilter,
	onPaginationChange,
	onRowClick,
	getRowId,
	onUiChange,
	initialUiState,
	paginationComponent: PaginationComponent,
	isLoading = false,
}: DataTableProps<T>) {
	const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
	const [dropColumn, setDropColumn] = useState<string | null>(null);

	const filterConfigMap = useMemo(() => {
		const map = new Map<string, FilterConfig>();
		filterConfig?.forEach((filter) => {
			map.set(filter.columnId, filter);
		});
		return map;
	}, [filterConfig]);

	const columnFilters =
		filterConfig?.reduce<{ id: string; value: unknown }[]>((acc, filter) => {
			if (filter.value !== undefined && filter.value !== null) {
				acc.push({ id: filter.columnId, value: filter.value });
			}
			return acc;
		}, []) || [];

	const pagination = { pageIndex, pageSize };
	const [sorting, setSorting] = useState<SortingState>(sortingConfig || []);
	const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
		initialUiState?.columnOrder || [],
	);
	const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(
		initialUiState?.columnSizing || {},
	);
	const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>(
		initialUiState?.columnPinning || { left: [], right: [] },
	);
	const [rowPinning, setRowPinning] = React.useState<RowPinningState>({
		top: pinnedRows?.rowIds || [],
		bottom: [],
	});

	// Track if the component has been initialized to avoid calling onUiChange on mount
	const isInitialized = useRef(false);

	const table = useReactTable({
		data,
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		manualFiltering: true,
		manualSorting: true,
		columnResizeMode: "onChange",
		state: {
			columnOrder,
			columnFilters,
			columnSizing,
			pagination,
			sorting,
			columnPinning,
			rowPinning,
		},
		getRowId: getRowId,
		onRowPinningChange: setRowPinning,
		onColumnSizingChange: setColumnSizing,
		onColumnPinningChange: setColumnPinning,
		onColumnOrderChange: setColumnOrder,
		onPaginationChange: (updater) => {
			const newPagination =
				typeof updater === "function" ? updater(pagination) : updater;
			onPaginationChange?.({
				pageIndex: newPagination.pageIndex + 1,
				pageSize: newPagination.pageSize,
			});
		},
		onColumnFiltersChange: (updater) => {
			const newColumnFilters =
				typeof updater === "function" ? updater(columnFilters) : updater;
			onFilter?.(newColumnFilters);
		},
		onSortingChange: (updater) => {
			const newSort =
				typeof updater === "function" ? updater(sorting) : updater;
			setSorting(newSort);
			onSort?.(newSort);
		},
	} as TableOptions<T>);

	useEffect(() => {
		// Skip the first render to avoid overwriting loaded state
		if (!isInitialized.current) {
			isInitialized.current = true;
			return;
		}

		// Only call onUiChange after initialization for actual user changes
		onUiChange?.({ columnOrder, columnSizing, columnPinning });
	}, [onUiChange, columnOrder, columnSizing, columnPinning]);

	const handleRowClick =
		(row: T): MouseEventHandler<HTMLTableRowElement> =>
		(_) =>
			onRowClick?.(row);

	/**
	 * Instead of calling `column.getSize()` on every render for every header
	 * and especially every data cell (very expensive),
	 * we will calculate all column sizes at once at the root table level in a useMemo
	 * and pass the column sizes down as CSS variables to the <table> element.
	 */
	// biome-ignore lint/correctness/useExhaustiveDependencies: getFlatHeaders() returns new array reference on every render, adding it would defeat memoization and break resizing
	const columnSizeVars = useMemo(() => {
		const headers = table.getFlatHeaders();
		const colSizes: { [key: string]: number } = {};
		headers.forEach((header) => {
			colSizes[`--header-${header.id}-size`] = header.getSize();
			colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
		});
		return colSizes;
	}, [table.getState().columnSizingInfo, table.getState().columnSizing]);

	return (
		<div>
			<div className={`${styles.tableContainer} relative`}>
				<Table className={styles.table} style={{ ...columnSizeVars }}>
					<TableHeader className={styles.thead}>
						<tr className={"group"}>
							{table.getHeaderGroups()[0]?.headers.map((header) => (
								<TableHead
									key={`header-${header.id}`}
									header={header}
									columnOrder={table.getAllLeafColumns().map((col) => col.id)}
									enableColumnReordering={enableColumnReordering}
									draggedColumn={draggedColumn}
									dropTarget={dropColumn}
									onChangeDraggedColumn={setDraggedColumn}
									onDropColumn={setDropColumn}
									onChangeColumnOrder={setColumnOrder}
								/>
							))}
						</tr>
					</TableHeader>
					<TableBody
						table={table}
						pinnedRows={pinnedRows}
						draggedColumn={draggedColumn}
						dropTarget={dropColumn}
						filterConfigMap={filterConfigMap}
						handleRowClick={handleRowClick}
						showZebraStripes={showZebraStripes}
						isLoading={isLoading}
					/>
				</Table>
			</div>
			{PaginationComponent && (
				<PaginationComponent
					pageCount={pageCount}
					currentPage={pageIndex}
					canPrevious={table.getCanPreviousPage()}
					canNext={
						pageCount === undefined
							? data.length >= pageSize
							: table.getCanNextPage()
					}
					onChangePage={(x) => table.setPageIndex(x - 1)}
					onPageSizeChange={table.setPageSize}
					pageSize={pageSize}
				/>
			)}
		</div>
	);
}
