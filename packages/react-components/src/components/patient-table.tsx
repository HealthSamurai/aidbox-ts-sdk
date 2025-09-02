import type {
	Column,
	ColumnDef,
	ColumnPinningState,
	Header,
} from "@tanstack/react-table";
import {
	createColumnHelper,
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
	Search,
} from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "#shadcn/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#shadcn/components/ui/dropdown-menu";
import { Input } from "#shadcn/components/ui/input";
import { cn } from "#shadcn/lib/utils";

// Unstyled table components to preserve custom styling
const Table = ({ className, ...props }: React.ComponentProps<"table">) => (
	<table className={className} {...props} />
);
const TableHeader = ({
	className,
	...props
}: React.ComponentProps<"thead">) => <thead className={className} {...props} />;
const TableBody = ({ className, ...props }: React.ComponentProps<"tbody">) => (
	<tbody className={className} {...props} />
);
const TableRow = ({ className, ...props }: React.ComponentProps<"tr">) => (
	<tr className={className} {...props} />
);
const TableHead = ({ className, ...props }: React.ComponentProps<"th">) => (
	<th className={className} {...props} />
);
const TableCell = ({ className, ...props }: React.ComponentProps<"td">) => (
	<td className={className} {...props} />
);

const getPinningStyles = <T,>(column: Column<T>): CSSProperties => {
	const isPinned = column.getIsPinned();
	return {
		left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
		right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
		position: isPinned ? "sticky" : "relative",
		width: column.getSize(),
		zIndex: isPinned ? 1 : 0,
	};
};

// Column configuration types
export type ColumnType = "text" | "code" | "link" | "button";

export interface ActionConfig {
	label: string;
	onClick: (rowId: string) => void;
	variant?: "primary" | "secondary" | "link" | "ghost";
	danger?: boolean;
}

export interface ColumnConfig {
	key: string;
	label: string;
	width?: string;
	fixed?: boolean;
	rightAlign?: boolean;
	type?: ColumnType;
	sortable?: boolean;
	filterable?: boolean;
	// For action columns
	actions?: ActionConfig[];
}

// Styles
const styles = {
	// Table container
	tableContainer: cn(
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

	// Global cell padding
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

	// Header styles
	thead: cn("bg-bg-secondary"),
	th: cn("h-8", "text-left", "font-medium", "text-text-primary", "select-none"),
	thSortable: cn("cursor-pointer", "hover:bg-bg-tertiary"),
	thSorted: cn("bg-bg-link/3", "border-b", "border-border-link"),
	thRightAlign: cn("text-right"),

	// Cell styles for sorted columns
	cellSorted: cn("bg-bg-link/3"),

	// Header content
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

	// Cell content
	cellContent: cn("h-8", "flex", "items-center", "text-text-primary"),
	cellText: cn("truncate"),
	cellCode: cn("h-8", "flex", "items-center", "text-text-primary", "typo-code"),
	cellRightAlign: cn("justify-end"),
	cellTextRightAlign: cn("text-right"),

	// Filter row
	filterRow: cn("bg-white", "border-b", "border-border-secondary"),
	filterCell: cn("px-1", "h-8"),
	filterCellPinned: cn("px-1", "h-8", "bg-white/90", "backdrop-blur-xs"),
	filterActions: cn("text-text-tertiary", "text-sm"),
	filterInput: cn("border-0", "h-8"),
	filterIcon: cn("w-4", "h-4", "text-text-tertiary"),

	dataRow: cn("hover:bg-bg-link/10"),
	dataRowZebra: cn("bg-bg-secondary", "hover:bg-bg-link/10"),
	dataCell: cn("h-8"),

	// Action button
	actionButton: cn(
		"text-text-link",
		"hover:text-text-link_hover",
		"transition-colors",
		"cursor-pointer",
	),

	// Action link
	actionLink: cn(
		"text-text-link",
		"hover:text-text-link_hover",
		"transition-colors",
		"cursor-pointer",
	),

	// Column resize handle
	resizeHandle: cn(
		"absolute",
		"right-0",
		"top-0",
		"h-full",
		"w-1",
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

	// Resizable header indicator
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

	// Draggable header styles
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

// Types
export interface PatientRow {
	id: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	email: string;
	birthDate: string;
	gender: "MALE" | "FEMALE" | "OTHER";
	street: string;
	city: string;
	state: string;
	zip: string;
	country?: string;
	encounters: number;
}

export interface ColumnSearchConfig {
	[key: string]: {
		enabled: boolean;
		type: "text" | "date";
		placeholder: string;
	};
}

export interface PaginationValues {
	pageIndex: number;
	pageSize: number;
}

export interface TableHeaderContentProps {
	content: React.ReactNode;
	isSortable?: boolean;
	sortDirection?: "asc" | "desc" | null;
	isPinnable?: boolean;
	pinnedDirection?: "left" | "right" | false;
	onPin?: (direction: "left" | "right" | false) => void;
}

export interface TableCellContentProps {
	content: React.ReactNode;
	type?: ColumnType;
	rightAlign?: boolean;
	actions?: ActionConfig[];
	rowId?: string;
}

// Mock components
function TableHeaderContent({
	content,
	isSortable = false,
	sortDirection = null,
	isPinnable = false,
	pinnedDirection = false,
	onPin,
}: TableHeaderContentProps) {
	return (
		<div className={styles.headerContent}>
			<span className={styles.headerText}>{content}</span>
			<div className="flex items-center">
				{isSortable && (
					<div className={styles.headerIcons}>
						{sortDirection === "asc" ? (
							<ChevronUp className={styles.headerIcon} />
						) : sortDirection === "desc" ? (
							<ChevronDown className={styles.headerIcon} />
						) : (
							<div className="flex flex-col">
								<ChevronUp className={styles.headerIconInactive} />
								<ChevronDown className={styles.headerIconInactive} />
							</div>
						)}
					</div>
				)}
				{isPinnable &&
					onPin &&
					(pinnedDirection ? (
						<Button
							size="small"
							variant="ghost"
							className="h-6 w-6 p-0 ml-1 opacity-60 hover:opacity-100"
							onClick={() => onPin(false)}
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
								<DropdownMenuItem onClick={() => onPin("left")}>
									<ArrowLeftToLine className="mr-2 h-4 w-4" />
									Stick to left
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => onPin("right")}>
									<ArrowRightToLine className="mr-2 h-4 w-4" />
									Stick to right
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					))}
			</div>
		</div>
	);
}

function TableCellContent({
	content,
	type = "text",
	rightAlign = false,
	actions = [],
	rowId,
}: TableCellContentProps) {
	// For action types, render actions instead of content
	if (type === "link" || type === "button") {
		return (
			<div
				className={cn(styles.cellContent, rightAlign && styles.cellRightAlign)}
			>
				<div className="flex gap-2">
					{actions.map((action, index) => {
						const handleClick = (e: React.MouseEvent) => {
							e.stopPropagation();
							action.onClick(rowId || "");
						};

						const actionKey = `${rowId}-${action.label}-${index}`;

						if (type === "button") {
							return (
								<Button
									key={actionKey}
									variant={action.variant || "primary"}
									size="small"
									{...(action.danger !== undefined && {
										danger: action.danger,
									})}
									onClick={handleClick}
								>
									{action.label}
								</Button>
							);
						}

						// Default to link type
						return (
							<button
								key={actionKey}
								type="button"
								className={styles.actionLink}
								onClick={handleClick}
							>
								{action.label}
							</button>
						);
					})}
				</div>
			</div>
		);
	}

	// For regular content
	const cellClass = cn(
		type === "code" ? styles.cellCode : styles.cellContent,
		rightAlign && styles.cellRightAlign,
	);

	const textClass = cn(
		styles.cellText,
		rightAlign && styles.cellTextRightAlign,
	);

	return (
		<div className={cellClass}>
			<span className={textClass}>{content}</span>
		</div>
	);
}

// Filter row component
function FilterRow<TData, TValue>({
	headers,
	draggedColumn,
	dropTarget,
}: {
	headers: Header<TData, TValue>[]; // TanStack Table headers
	draggedColumn?: string | null;
	dropTarget?: string | null;
}) {
	return (
		<TableRow className={styles.filterRow}>
			{headers.map((header) => {
				const tableColumn = header.column;
				const columnKey = header.id;

				const isPinned = tableColumn.getIsPinned();
				const isBeingDragged = draggedColumn === columnKey;
				const isDropTarget = dropTarget === columnKey;
				const isLastLeftPinned =
					isPinned === "left" && tableColumn.getIsLastColumn("left");
				const isFirstRightPinned =
					isPinned === "right" && tableColumn.getIsFirstColumn("right");

				return (
					<TableCell
						key={`filter-${columnKey}`}
						className={cn(
							isPinned ? styles.filterCellPinned : styles.filterCell,
							styles.pinnedColumn,
							isBeingDragged && styles.draggingColumn,
							isDropTarget && styles.dropZone,
							isDropTarget && styles.dropZoneActive,
						)}
						style={{
							...getPinningStyles(tableColumn),
						}}
						data-pinned={isPinned || undefined}
						data-last-col={
							isLastLeftPinned
								? "left"
								: isFirstRightPinned
									? "right"
									: undefined
						}
					>
						{columnKey === "actions" ? (
							<div className={styles.filterActions}></div>
						) : (
							<Input
								placeholder="Search"
								leftSlot={<Search className={styles.filterIcon} />}
								onChange={(e) =>
									console.log(`Filter ${columnKey}:`, e.target.value)
								}
								className={styles.filterInput}
							/>
						)}
					</TableCell>
				);
			})}
		</TableRow>
	);
}

// Mock DataTable component
interface DataTableProps<T> {
	columns: ColumnDef<T>[];
	data: T[];
	showZebraStripes: boolean;
	showFilters?: boolean;
	showSorting?: boolean;
	enableColumnResizing?: boolean;
	enableColumnReordering?: boolean;
	enableColumnPinning?: boolean;
	onSort?: (columnKey: string) => void;
	columnWidths?: Record<string, string>;
	sortConfig?: { key: string; direction: "asc" | "desc" } | null;
	columnOrder?: string[];
	onColumnOrderChange?: (newOrder: string[]) => void;
	columnPinning?: ColumnPinningState;
	onColumnPinningChange?: (pinning: ColumnPinningState) => void;
}

function DataTable<T>({
	columns,
	data,
	showZebraStripes,
	showFilters = true,
	showSorting = true,
	enableColumnResizing = false,
	enableColumnReordering = false,
	enableColumnPinning = false,
	onSort,
	columnWidths = {},
	sortConfig,
	columnOrder = [],
	onColumnOrderChange,
	columnPinning = {},
	onColumnPinningChange,
	columnConfigs,
}: DataTableProps<T> & { columnConfigs?: ColumnConfig[] }) {
	const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
	const [dropTarget, setDropTarget] = useState<string | null>(null);

	const initialColumnSizing = useMemo(() => {
		if (!enableColumnResizing || !columnConfigs) return {};

		const sizing: Record<string, number> = {};
		columnConfigs.forEach((config) => {
			if (config.width) {
				const width = parseInt(config.width.replace("px", ""), 10);
				if (!Number.isNaN(width)) {
					sizing[config.key] = width;
				}
			}
		});
		return sizing;
	}, [enableColumnResizing, columnConfigs]);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		enableColumnResizing,
		enableColumnPinning,
		columnResizeMode: "onChange",
		state: {
			...(columnOrder.length > 0 && { columnOrder }),
			...(enableColumnPinning && { columnPinning }),
		},
		...(onColumnOrderChange && {
			onColumnOrderChange: (updater) => {
				const newOrder =
					typeof updater === "function" ? updater(columnOrder) : updater;
				onColumnOrderChange(newOrder);
			},
		}),
		...(onColumnPinningChange &&
			enableColumnPinning && {
				onColumnPinningChange: (updater) => {
					const newPinning =
						typeof updater === "function" ? updater(columnPinning) : updater;
					onColumnPinningChange(newPinning);
				},
			}),
		initialState: {
			columnSizing: initialColumnSizing,
		},
	});

	return (
		<div className={styles.tableContainer}>
			<Table className={styles.table}>
				<TableHeader className={styles.thead}>
					<TableRow className={enableColumnResizing ? "group" : ""}>
						{table.getHeaderGroups()[0]?.headers.map((header) => {
							const columnKey = header.id;
							const isSortable = columnKey !== "actions";

							const isPinned = header.column.getIsPinned();
							const isSorted = sortConfig?.key === columnKey;
							const isDraggable = enableColumnReordering && !isPinned;
							const isDragging = draggedColumn === columnKey;
							const isDropTarget = dropTarget === columnKey;
							const isLastLeftPinned =
								isPinned === "left" && header.column.getIsLastColumn("left");
							const isFirstRightPinned =
								isPinned === "right" && header.column.getIsFirstColumn("right");

							const columnConfig = columnConfigs?.find(
								(config) => config.key === columnKey,
							);
							const isRightAlign = columnConfig?.rightAlign || false;

							return (
								<TableHead
									key={`header-${columnKey}`}
									className={cn(
										styles.cellPadding,
										styles.th,
										isSortable && showSorting && styles.thSortable,
										styles.pinnedHeader,
										isSorted && styles.thSorted,
										isRightAlign && styles.thRightAlign,
										"relative",
										enableColumnResizing &&
											header.column.getCanResize() &&
											styles.resizableHeader,
										isDraggable && styles.draggableHeader,
										isDragging && styles.draggingHeader,
										isDragging && styles.draggingColumn,
										isDropTarget && styles.dropZone,
										isDropTarget && styles.dropZoneActive,
									)}
									style={{
										...getPinningStyles(header.column),
										...(enableColumnResizing
											? {}
											: { width: columnWidths[columnKey] || "200px" }),
									}}
									data-pinned={isPinned || undefined}
									data-last-col={
										isLastLeftPinned
											? "left"
											: isFirstRightPinned
												? "right"
												: undefined
									}
									onClick={(e) => {
										const target = e.currentTarget;
										if (
											target.closest("[data-resize-handle]") ||
											target.closest("[data-drag-zone]")
										) {
											return;
										}
										if (isSortable && showSorting && onSort) {
											onSort(String(columnKey));
										}
									}}
									onDragOver={(e) => {
										if (
											!isDraggable ||
											!draggedColumn ||
											draggedColumn === columnKey
										)
											return;
										e.preventDefault();
										setDropTarget(columnKey);
									}}
									onDragLeave={(e) => {
										const rect = e.currentTarget.getBoundingClientRect();
										const x = e.clientX;
										const y = e.clientY;
										if (
											x < rect.left ||
											x > rect.right ||
											y < rect.top ||
											y > rect.bottom
										) {
											setDropTarget(null);
										}
									}}
									onDrop={(e) => {
										e.preventDefault();
										if (!isDraggable || !draggedColumn || !onColumnOrderChange)
											return;

										const currentOrder = table
											.getAllLeafColumns()
											.map((col) => col.id);
										const draggedIndex = currentOrder.indexOf(draggedColumn);
										const targetIndex = currentOrder.indexOf(columnKey);

										if (draggedIndex !== -1 && targetIndex !== -1) {
											const newOrder = [...currentOrder];
											newOrder.splice(draggedIndex, 1);
											newOrder.splice(targetIndex, 0, draggedColumn);
											onColumnOrderChange(newOrder);
										}

										setDraggedColumn(null);
										setDropTarget(null);
									}}
								>
									{isDraggable && (
										<button
											type="button"
											data-drag-zone
											draggable
											className={styles.dragZone}
											onDragStart={(e) => {
												setDraggedColumn(columnKey);
												e.dataTransfer.effectAllowed = "move";
											}}
											onDragEnd={() => {
												setDraggedColumn(null);
												setDropTarget(null);
											}}
										>
											<GripVertical className="w-4 h-4" />
										</button>
									)}

									{flexRender(
										header.column.columnDef.header,
										header.getContext(),
									)}
									{enableColumnResizing && header.column.getCanResize() && (
										<div
											data-resize-handle
											{...{
												onMouseDown: header.getResizeHandler(),
												onTouchStart: header.getResizeHandler(),
												onClick: (e) => e.stopPropagation(),
												className: cn(
													styles.resizeHandle,
													header.column.getIsResizing() &&
														styles.resizeHandleActive,
												),
											}}
										/>
									)}
								</TableHead>
							);
						})}
					</TableRow>
				</TableHeader>
				<TableBody>
					{/* Filter row */}
					{showFilters && (
						<FilterRow
							headers={table.getHeaderGroups()[0]?.headers || []}
							draggedColumn={draggedColumn}
							dropTarget={dropTarget}
						/>
					)}

					{/* Data rows */}
					{table.getRowModel().rows.map((row, rowIndex) => (
						<TableRow
							key={`row-${row.id}`}
							className={cn(
								styles.dataRow,
								showZebraStripes &&
									rowIndex % 2 === (showFilters ? 0 : 1) &&
									styles.dataRowZebra,
							)}
						>
							{row.getVisibleCells().map((cell) => {
								const columnKey = cell.column.id;
								const isPinned = cell.column.getIsPinned();
								const isSorted = sortConfig?.key === columnKey;
								const isBeingDragged = draggedColumn === columnKey;
								const isDropTarget = dropTarget === columnKey;
								const isLastLeftPinned =
									isPinned === "left" && cell.column.getIsLastColumn("left");
								const isFirstRightPinned =
									isPinned === "right" && cell.column.getIsFirstColumn("right");

								return (
									<TableCell
										key={cell.id}
										className={cn(
											styles.cellPadding,
											styles.dataCell,
											styles.pinnedColumn,
											isSorted && styles.cellSorted,
											isBeingDragged && styles.draggingColumn,
											isDropTarget && styles.dropZone,
											isDropTarget && styles.dropZoneActive,
										)}
										style={{
											...getPinningStyles(cell.column),
											...(enableColumnResizing
												? {}
												: { width: columnWidths[columnKey] || "200px" }),
										}}
										data-pinned={isPinned || undefined}
										data-last-col={
											isLastLeftPinned
												? "left"
												: isFirstRightPinned
													? "right"
													: undefined
										}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								);
							})}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

const columnHelper = createColumnHelper<PatientRow>();

const columns = [
	columnHelper.accessor("firstName", {
		header: () => <TableHeaderContent content="First name" />,
		cell: (props) => <TableCellContent content={props.getValue()} />,
	}),
	columnHelper.accessor("lastName", {
		header: () => <TableHeaderContent content="Last name" />,
		cell: (props) => <TableCellContent content={props.getValue()} />,
	}),
	columnHelper.accessor("id", {
		header: () => <TableHeaderContent content="ID" />,
		cell: (props) => (
			<TableCellContent content={props.getValue()} type="code" />
		),
	}),
	columnHelper.accessor("birthDate", {
		header: () => <TableHeaderContent content="Birth" />,
		cell: (props) => (
			<TableCellContent content={props.getValue()} type="code" />
		),
	}),
	columnHelper.accessor("phoneNumber", {
		header: () => <TableHeaderContent content="Phone number" />,
		cell: (props) => <TableCellContent content={props.getValue()} />,
	}),
	columnHelper.accessor("email", {
		header: () => <TableHeaderContent content="Email" />,
		cell: (props) => <TableCellContent content={props.getValue()} />,
	}),
	columnHelper.accessor("gender", {
		header: () => <TableHeaderContent content="Gender" />,
		cell: (props) => <TableCellContent content={props.getValue()} />,
	}),
	columnHelper.accessor("street", {
		header: () => <TableHeaderContent content="Street" />,
		cell: (props) => <TableCellContent content={props.getValue()} />,
	}),
	columnHelper.accessor("city", {
		header: () => <TableHeaderContent content="City" />,
		cell: (props) => <TableCellContent content={props.getValue()} />,
	}),
	columnHelper.accessor("state", {
		header: () => <TableHeaderContent content="State" />,
		cell: (props) => <TableCellContent content={props.getValue()} />,
	}),
	columnHelper.accessor("zip", {
		header: () => <TableHeaderContent content="ZIP" />,
		cell: (props) => <TableCellContent content={props.getValue()} />,
	}),
	columnHelper.accessor("country", {
		header: () => <TableHeaderContent content="Country" />,
		cell: (props) => <TableCellContent content={props.getValue()} />,
	}),
	columnHelper.accessor("encounters", {
		header: () => <TableHeaderContent content="Encounters" />,
		cell: (props) => <TableCellContent content={props.getValue()} />,
	}),
	columnHelper.display({
		id: "actions",
		header: () => <TableHeaderContent content={"Actions"} />,
		cell: ({ row }) => (
			<TableCellContent
				content={
					<button
						type="button"
						className={styles.actionButton}
						onClick={(e) => {
							e.stopPropagation();
							console.log("Match clicked for:", row.original.id);
						}}
					>
						Match
					</button>
				}
			/>
		),
		meta: {
			fixed: "right",
		},
	}),
];

export type PatientTableProps = {
	// data: PatientRow[],
	page: number;
	count: number;
	showFilters?: boolean;
	showSorting?: boolean;
	enableColumnResizing?: boolean;
	enableColumnReordering?: boolean;
	enableColumnPinning?: boolean;
	showPinningMenu?: boolean;
	columnWidths?: Record<string, string>;
	columnConfigs?: ColumnConfig[];
};

export function PatientTable(props: PatientTableProps) {
	const {
		showFilters = true,
		showSorting = true,
		enableColumnResizing = false,
		enableColumnReordering = false,
		enableColumnPinning = false,
		showPinningMenu = true,
		columnWidths = {},
		columnConfigs,
	} = props;

	const [sortConfig, setSortConfig] = useState<{
		key: string;
		direction: "asc" | "desc";
	} | null>(null);

	const [columnOrder, setColumnOrder] = useState<string[]>([]);

	const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({});

	useEffect(() => {
		if (!enableColumnPinning || !columnConfigs) return;

		const fixedColumns = columnConfigs.filter((config) => config.fixed);
		if (fixedColumns.length > 0) {
			const initialPinning: ColumnPinningState = {
				right: fixedColumns.map((config) => config.key),
			};
			setColumnPinning(initialPinning);
		}
	}, [enableColumnPinning, columnConfigs]);

	const handleSort = (columnKey: string) => {
		setSortConfig((current) => {
			if (current?.key === columnKey) {
				return current.direction === "asc"
					? { key: columnKey, direction: "desc" }
					: null;
			}
			return { key: columnKey, direction: "asc" };
		});
	};

	const data: PatientRow[] = [
		{
			id: "PAT-000001",
			firstName: "John",
			lastName: "Smith",
			phoneNumber: "(555) 123-4567",
			email: "john.smith@gmail.com",
			birthDate: "1985-03-15",
			gender: "MALE",
			street: "123 Main St",
			city: "New York",
			state: "NY",
			zip: "10001",
			encounters: 5,
		},
		{
			id: "PAT-000002",
			firstName: "Jane",
			lastName: "Johnson",
			phoneNumber: "(555) 234-5678",
			email: "jane.johnson@yahoo.com",
			birthDate: "1990-07-22",
			gender: "FEMALE",
			street: "456 Oak Ave",
			city: "Los Angeles",
			state: "CA",
			zip: "90210",
			encounters: 12,
		},
		{
			id: "PAT-000003",
			firstName: "Michael",
			lastName: "Williams",
			phoneNumber: "(555) 345-6789",
			email: "michael.williams@hotmail.com",
			birthDate: "1978-11-08",
			gender: "MALE",
			street: "789 Pine St",
			city: "Chicago",
			state: "IL",
			zip: "60601",
			encounters: 8,
		},
		{
			id: "PAT-000004",
			firstName: "Sarah",
			lastName: "Brown",
			phoneNumber: "(555) 456-7890",
			email: "sarah.brown@outlook.com",
			birthDate: "1992-01-30",
			gender: "FEMALE",
			street: "321 Elm Ave",
			city: "Houston",
			state: "TX",
			zip: "77001",
			encounters: 3,
		},
		{
			id: "PAT-000005",
			firstName: "David",
			lastName: "Garcia",
			phoneNumber: "(555) 567-8901",
			email: "david.garcia@gmail.com",
			birthDate: "1980-09-12",
			gender: "MALE",
			street: "654 Cedar St",
			city: "Phoenix",
			state: "AZ",
			zip: "85001",
			encounters: 15,
		},
		{
			id: "PAT-000006",
			firstName: "Emily",
			lastName: "Martinez",
			phoneNumber: "(555) 678-9012",
			email: "emily.martinez@icloud.com",
			birthDate: "1995-05-18",
			gender: "FEMALE",
			street: "987 Washington St",
			city: "Philadelphia",
			state: "PA",
			zip: "19101",
			encounters: 7,
		},
		{
			id: "PAT-000007",
			firstName: "Robert",
			lastName: "Davis",
			phoneNumber: "(555) 789-0123",
			email: "robert.davis@aol.com",
			birthDate: "1973-12-03",
			gender: "MALE",
			street: "147 Park Ave",
			city: "San Antonio",
			state: "TX",
			zip: "78201",
			encounters: 22,
		},
		{
			id: "PAT-000008",
			firstName: "Jessica",
			lastName: "Rodriguez",
			phoneNumber: "(555) 890-1234",
			email: "jessica.rodriguez@protonmail.com",
			birthDate: "1988-04-25",
			gender: "FEMALE",
			street: "258 Lincoln St",
			city: "San Diego",
			state: "CA",
			zip: "92101",
			encounters: 9,
		},
		{
			id: "PAT-000009",
			firstName: "William",
			lastName: "Wilson",
			phoneNumber: "(555) 901-2345",
			email: "william.wilson@gmail.com",
			birthDate: "1965-08-14",
			gender: "MALE",
			street: "369 Jefferson Ave",
			city: "Dallas",
			state: "TX",
			zip: "75201",
			encounters: 18,
		},
		{
			id: "PAT-000010",
			firstName: "Ashley",
			lastName: "Anderson",
			phoneNumber: "(555) 012-3456",
			email: "ashley.anderson@yahoo.com",
			birthDate: "1993-10-07",
			gender: "FEMALE",
			street: "741 Madison St",
			city: "San Jose",
			state: "CA",
			zip: "95101",
			encounters: 4,
		},
		{
			id: "PAT-000011",
			firstName: "Alex",
			lastName: "Taylor",
			phoneNumber: "(555) 111-2222",
			email: "alex.taylor@outlook.com",
			birthDate: "1987-06-19",
			gender: "OTHER",
			street: "852 Adams Ave",
			city: "Austin",
			state: "TX",
			zip: "73301",
			encounters: 11,
		},
	];

	const sortedData = useMemo(() => {
		if (!sortConfig) return data;

		return [...data].sort((a, b) => {
			const aValue = a[sortConfig.key as keyof PatientRow] ?? "";
			const bValue = b[sortConfig.key as keyof PatientRow] ?? "";

			if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
			if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
			return 0;
		});
	}, [sortConfig]);

	const generatedColumnWidths = useMemo(() => {
		if (!columnConfigs) {
			return columnWidths;
		}

		const configWidths: Record<string, string> = {};
		columnConfigs.forEach((config) => {
			if (config.width) {
				configWidths[config.key] = config.width;
			}
		});

		return { ...columnWidths, ...configWidths };
	}, [columnConfigs, columnWidths]);

	const generatedColumns = useMemo(() => {
		if (!columnConfigs) {
			return columns;
		}

		return columnConfigs.map((config): ColumnDef<PatientRow> => {
			const columnSize = config.width
				? parseInt(config.width.replace("px", ""), 10)
				: undefined;

			if (config.type === "link" || config.type === "button") {
				return {
					id: config.key,
					accessorFn: () => null,
					header: () => <TableHeaderContent content={config.label} />,
					cell: ({ row }: { row: { original: PatientRow } }) => (
						<TableCellContent
							content=""
							{...(config.type && { type: config.type })}
							{...(config.rightAlign !== undefined && {
								rightAlign: config.rightAlign,
							})}
							actions={config.actions || []}
							rowId={row.original.id}
						/>
					),
					...(config.fixed && { meta: { fixed: "right" } }),
					...(columnSize && { size: columnSize }),
				};
			}

			return {
				accessorKey: config.key,
				header: () => <TableHeaderContent content={config.label} />,
				cell: ({ cell }: { cell: { getValue: () => any } }) => (
					<TableCellContent
						content={cell.getValue()}
						type={config.type || "text"}
						{...(config.rightAlign !== undefined && {
							rightAlign: config.rightAlign,
						})}
					/>
				),
				...(config.fixed && { meta: { fixed: "right" } }),
				...(columnSize && { size: columnSize }),
			};
		});
	}, [columnConfigs]);

	const columnsWithSorting = generatedColumns.map((column) => ({
		...column,
		header: () => {
			const columnKey = (column as any).id || (column as any).accessorKey;
			const isSortable = columnKey !== "actions";
			const isPinnedLeft = columnPinning.left?.includes(columnKey);
			const isPinnedRight = columnPinning.right?.includes(columnKey);
			const pinnedDirection = isPinnedLeft
				? "left"
				: isPinnedRight
					? "right"
					: false;

			const handlePin = (direction: "left" | "right" | false) => {
				const newPinning: ColumnPinningState = { ...columnPinning };

				if (newPinning.left) {
					newPinning.left = newPinning.left.filter((id) => id !== columnKey);
				}
				if (newPinning.right) {
					newPinning.right = newPinning.right.filter((id) => id !== columnKey);
				}

				if (direction === "left") {
					newPinning.left = [...(newPinning.left || []), columnKey];
				} else if (direction === "right") {
					newPinning.right = [...(newPinning.right || []), columnKey];
				}

				setColumnPinning(newPinning);
			};

			return (
				<TableHeaderContent
					content={
						typeof column.header === "function"
							? column.header({} as any)
							: column.header
					}
					isSortable={isSortable && showSorting}
					sortDirection={
						sortConfig?.key === columnKey && sortConfig
							? sortConfig.direction
							: null
					}
					isPinnable={enableColumnPinning && showPinningMenu}
					pinnedDirection={pinnedDirection}
					onPin={handlePin}
				/>
			);
		},
	})) as ColumnDef<PatientRow>[];

	return (
		<DataTable
			columns={columnsWithSorting}
			data={sortedData}
			showZebraStripes={true}
			showFilters={showFilters}
			showSorting={showSorting}
			enableColumnResizing={enableColumnResizing}
			enableColumnReordering={enableColumnReordering}
			enableColumnPinning={enableColumnPinning}
			onSort={handleSort}
			columnWidths={generatedColumnWidths}
			sortConfig={sortConfig}
			columnOrder={columnOrder}
			onColumnOrderChange={setColumnOrder}
			columnPinning={columnPinning}
			onColumnPinningChange={setColumnPinning}
			{...(columnConfigs && { columnConfigs })}
		/>
	);
}
