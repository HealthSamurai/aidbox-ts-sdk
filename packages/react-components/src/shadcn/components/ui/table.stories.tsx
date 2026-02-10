"use client";

import { Controls, Primary, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	type ColumnDef,
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type RowSelectionState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

import { Checkbox } from "#shadcn/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#shadcn/components/ui/table";

type Invoice = {
	invoice: string;
	paymentStatus: "Paid" | "Pending" | "Unpaid";
	totalAmount: number;
	paymentMethod: string;
};

const statuses: Invoice["paymentStatus"][] = ["Paid", "Pending", "Unpaid"];
const methods: Invoice["paymentMethod"][] = [
	"Credit Card",
	"PayPal",
	"Bank Transfer",
];

const invoiceData: Invoice[] = Array.from({ length: 50 }, (_, i) => ({
	invoice: `INV${String(i + 1).padStart(3, "0")}`,
	paymentStatus: statuses[i % statuses.length]!,
	totalAmount: 100 + ((i * 73) % 900),
	paymentMethod: methods[i % methods.length]!,
}));

const columnHelper = createColumnHelper<Invoice>();

const columns = [
	columnHelper.accessor("invoice", {
		header: "Invoice",
		cell: (info) => String(info.getValue()),
		enableSorting: true,
	}),
	columnHelper.accessor("paymentStatus", {
		header: "Status",
		cell: (info) => String(info.getValue()),
		enableSorting: true,
	}),
	columnHelper.accessor("paymentMethod", {
		header: "Method",
		cell: (info) => String(info.getValue()),
		enableSorting: true,
	}),
	columnHelper.accessor("totalAmount", {
		header: "Amount",
		cell: (info) => {
			const value = info.getValue();
			return `$${value.toFixed(2)}`;
		},
		enableSorting: true,
	}),
];

const selectColumn: ColumnDef<Invoice, unknown> = {
	id: "select",
	header: ({ table }) => (
		<Checkbox
			size="small"
			checked={
				table.getIsAllPageRowsSelected()
					? true
					: table.getIsSomePageRowsSelected()
						? "indeterminate"
						: false
			}
			onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
			aria-label="Select all"
		/>
	),
	cell: ({ row }) => (
		<Checkbox
			size="small"
			checked={row.getIsSelected()}
			onCheckedChange={(value) => row.toggleSelected(!!value)}
			aria-label="Select row"
		/>
	),
	enableSorting: false,
};

function TableWithSorting({
	zebra = false,
	selectable = false,
	stickyHeader = false,
}: { zebra?: boolean; selectable?: boolean; stickyHeader?: boolean } = {}) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

	const tableColumns = selectable
		? [selectColumn, ...columns]
		: columns;

	const table = useReactTable({
		data: invoiceData,
		columns: tableColumns,
		state: {
			sorting,
			rowSelection,
		},
		onSortingChange: setSorting,
		onRowSelectionChange: setRowSelection,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	return (
		<Table zebra={zebra} stickyHeader={stickyHeader}>
			<TableHeader>
				{table.getHeaderGroups().map((headerGroup) => (
					<TableRow key={headerGroup.id}>
						{headerGroup.headers.map((header) => (
							<TableHead
								key={header.id}
								onClick={header.column.getToggleSortingHandler()}
								sortable={header.column.getCanSort()}
								sorted={header.column.getIsSorted() || false}
							>
								{flexRender(
									header.column.columnDef.header,
									header.getContext(),
								)}
							</TableHead>
						))}
					</TableRow>
				))}
			</TableHeader>
			<TableBody>
				{table.getRowModel().rows.map((row, index) => (
					<TableRow
						key={row.id}
						zebra={zebra}
						index={index}
						selected={row.getIsSelected()}
					>
						{row.getVisibleCells().map((cell) => (
							<TableCell
								key={cell.id}
								type={cell.column.id === "invoice" ? "link" : "text"}
							>
								{flexRender(cell.column.columnDef.cell, cell.getContext())}
							</TableCell>
						))}
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

const meta = {
	title: "Component/Table",
	component: TableWithSorting,
	parameters: {
		docs: {
			page: () => (
				<>
					<Title />
					<Primary />
					<Controls />
				</>
			),
		},
	},
	argTypes: {
		zebra: {
			control: "boolean",
			description: "Enable alternating row background colors",
		},
		selectable: {
			control: "boolean",
			description: "Enable row selection with checkboxes",
		},
		stickyHeader: {
			control: "boolean",
			description: "Keep header fixed while scrolling",
		},
	},
	args: {
		zebra: false,
		selectable: false,
		stickyHeader: false,
	},
} satisfies Meta<typeof TableWithSorting>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
	tags: ["!dev"],
	render: ({
		zebra = false,
		selectable = false,
		stickyHeader = false,
	}: { zebra?: boolean; selectable?: boolean; stickyHeader?: boolean } = {}) => (
		<div className="h-80">
			<TableWithSorting zebra={zebra} selectable={selectable} stickyHeader={stickyHeader} />
		</div>
	),
} satisfies Story;

export const Demo = {
	tags: ["!autodocs"],
	render: () => (
		<div className="space-y-8 p-6">
			<div>
				<h3 className="text-lg font-semibold mb-4 text-text-primary">
					Without Zebra Striping
				</h3>
				<div className="h-80">
					<TableWithSorting zebra={false} stickyHeader={true} />
				</div>
			</div>
			<div>
				<h3 className="text-lg font-semibold mb-4 text-text-primary">
					With Zebra Striping
				</h3>
				<div className="h-80">
					<TableWithSorting zebra={true} stickyHeader={true} />
				</div>
			</div>
			<div>
				<h3 className="text-lg font-semibold mb-4 text-text-primary">
					Selectable
				</h3>
				<div className="h-80">
					<TableWithSorting selectable={true} stickyHeader={true} />
				</div>
			</div>
			<div>
				<h3 className="text-lg font-semibold mb-4 text-text-primary">
					Selectable + Zebra
				</h3>
				<div className="h-80">
					<TableWithSorting selectable={true} zebra={true} stickyHeader={true} />
				</div>
			</div>
		</div>
	),
} satisfies Story;
