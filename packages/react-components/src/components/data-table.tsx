"use client";

import {
	type AccessorKeyColumnDef,
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../shadcn/components/ui/table";

export interface DataTableProps<TData> {
	// It is not possible to allow arbitrary and nested data structures
	// and have more type safety. Note that the useReactTable type definition
	// is exactly the same.
	// There is an open issue: https://github.com/TanStack/table/issues/4382
	// biome-ignore lint/suspicious/noExplicitAny: cannot be stricter while being a useful library
	columns: ColumnDef<TData, any>[];
	data: TData[];
	stickyHeader?: boolean;
}

export function DataTable<TData>({
	columns,
	data,
	stickyHeader = false,
}: DataTableProps<TData>) {
	"use no memo";
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		columnResizeMode: "onChange",
		enableColumnResizing: true,
	});

	return (
		<div className="overflow-hidden w-full h-full">
			<Table className="relative border-spacing-0 border-separate w-full">
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead
										key={header.id}
										className={`relative group border ${stickyHeader ? "sticky top-0 z-10 bg-bg-secondary text-elements-assistive" : ""}`}
										style={{
											width:
												header.column.getIndex() ===
												headerGroup.headers.length - 1
													? "w-full"
													: header.getSize(),
										}}
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
										{header.column.getCanResize() && (
											<div
												{...{
													onMouseDown: header.getResizeHandler(),
													onTouchStart: header.getResizeHandler(),
													className: `hidden group-hover:block absolute top-0 right-0 h-full w-1 bg-border-secondary cursor-col-resize hover:bg-border-secondary`,
													style: {
														userSelect: "none",
														touchAction: "none",
													},
												}}
											/>
										)}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow
								key={row.id}
								data-state={row.getIsSelected() && "selected"}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell
										className="border"
										key={cell.id}
										style={{
											width:
												cell.column.getIndex() ===
												row.getVisibleCells().length - 1
													? "w-full"
													: cell.column.getSize(),
										}}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}

export type { ColumnDef, AccessorKeyColumnDef };
