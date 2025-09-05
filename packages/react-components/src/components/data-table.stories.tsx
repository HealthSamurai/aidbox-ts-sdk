import type { Meta, StoryObj } from "@storybook/react-vite";
import { DataTable, type DataTableProps } from "./data-table";

const meta: Meta<typeof DataTable> = {
	title: "Component/Data table",
	component: DataTable,
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DataTable>;

function DataTableWrapper<TData, TValue>({
	columns,
	data,
}: DataTableProps<TData, TValue>) {
	return <DataTable columns={columns} data={data} />;
}

export const Default: Story = {
	args: {
		columns: [
			{
				header: "Name",
				accessorKey: "name",
			},
			{
				header: "Age",
				accessorKey: "age",
			},
		],
		data: [{ name: "John Doe", age: 30 }],
	},
	parameters: {
		layout: "fullscreen",
	},
	render: (args) => <DataTableWrapper {...args} />,
};
