"use client";

import { Controls, Primary, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
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

const invoiceData: Invoice[] = [
	{
		invoice: "INV001",
		paymentStatus: "Paid",
		totalAmount: 250,
		paymentMethod: "Credit Card",
	},
	{
		invoice: "INV002",
		paymentStatus: "Pending",
		totalAmount: 150,
		paymentMethod: "PayPal",
	},
	{
		invoice: "INV003",
		paymentStatus: "Unpaid",
		totalAmount: 350,
		paymentMethod: "Bank Transfer",
	},
	{
		invoice: "INV004",
		paymentStatus: "Paid",
		totalAmount: 450,
		paymentMethod: "Credit Card",
	},
	{
		invoice: "INV005",
		paymentStatus: "Paid",
		totalAmount: 550,
		paymentMethod: "PayPal",
	},
	{
		invoice: "INV006",
		paymentStatus: "Pending",
		totalAmount: 200,
		paymentMethod: "Bank Transfer",
	},
	{
		invoice: "INV007",
		paymentStatus: "Unpaid",
		totalAmount: 300,
		paymentMethod: "Credit Card",
	},
];

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

function TableWithSorting({ zebra = false }: { zebra?: boolean } = {}) {
	const [sorting, setSorting] = useState<SortingState>([]);

	const table = useReactTable({
		data: invoiceData,
		columns,
		state: {
			sorting,
		},
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	return (
		<Table zebra={zebra}>
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
					<TableRow key={row.id} zebra={zebra} index={index}>
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
			<TableFooter>
				<TableRow zebra={zebra} index={table.getRowModel().rows.length}>
					<TableCell colSpan={3}>Total</TableCell>
					<TableCell>
						$
						{invoiceData
							.reduce((sum, inv) => sum + inv.totalAmount, 0)
							.toFixed(2)}
					</TableCell>
				</TableRow>
			</TableFooter>
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
	},
	args: {
		zebra: false,
	},
} satisfies Meta<typeof TableWithSorting>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
	tags: ["!dev"],
	render: ({ zebra = false }: { zebra?: boolean } = {}) => (
		<TableWithSorting zebra={zebra} />
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
				<TableWithSorting zebra={false} />
			</div>
			<div>
				<h3 className="text-lg font-semibold mb-4 text-text-primary">
					With Zebra Striping
				</h3>
				<TableWithSorting zebra={true} />
			</div>
		</div>
	),
} satisfies Story;
