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
		data: [
			{ name: "John Doe", age: 30 },
			{ name: "Jane Smith", age: 25 },
			{ name: "Bob Johnson", age: 42 },
			{ name: "Alice Williams", age: 35 },
			{ name: "Charlie Brown", age: 28 },
			{ name: "Diana Prince", age: 31 },
			{ name: "Edward Norton", age: 45 },
			{ name: "Fiona Green", age: 27 },
			{ name: "George Miller", age: 38 },
			{ name: "Hannah Davis", age: 33 },
			{ name: "Ian Moore", age: 29 },
			{ name: "Julia Taylor", age: 41 },
			{ name: "Kevin Anderson", age: 36 },
			{ name: "Laura Thomas", age: 32 },
			{ name: "Michael Jackson", age: 44 },
			{ name: "Nancy Wilson", age: 26 },
			{ name: "Oscar Martinez", age: 39 },
			{ name: "Patricia Lee", age: 34 },
			{ name: "Quinn Harris", age: 37 },
			{ name: "Rachel Clark", age: 40 },
			{ name: "Samuel Wright", age: 43 },
			{ name: "Tina Turner", age: 48 },
			{ name: "Ulysses Grant", age: 52 },
			{ name: "Victoria Baker", age: 29 },
			{ name: "William Scott", age: 35 },
			{ name: "Xavier Adams", age: 31 },
			{ name: "Yolanda King", age: 38 },
			{ name: "Zachary Nelson", age: 27 },
			{ name: "Amy Carter", age: 33 },
			{ name: "Benjamin Hall", age: 46 },
			{ name: "Catherine Allen", age: 24 },
			{ name: "David Young", age: 41 },
			{ name: "Emily Walker", age: 36 },
			{ name: "Frank Robinson", age: 39 },
			{ name: "Grace White", age: 28 },
			{ name: "Henry Lewis", age: 47 },
			{ name: "Isabella Hill", age: 32 },
			{ name: "Jack Martin", age: 34 },
			{ name: "Katherine Garcia", age: 30 },
			{ name: "Louis Rodriguez", age: 45 },
			{ name: "Margaret Martinez", age: 37 },
			{ name: "Nathan Hernandez", age: 26 },
			{ name: "Olivia Lopez", age: 29 },
			{ name: "Peter Gonzalez", age: 43 },
			{ name: "Quincy Wilson", age: 38 },
			{ name: "Rebecca Anderson", age: 31 },
			{ name: "Steven Thomas", age: 44 },
			{ name: "Teresa Taylor", age: 35 },
			{ name: "Ursula Moore", age: 40 },
			{ name: "Victor Jackson", age: 42 },
		],
	},
	parameters: {
		layout: "fullscreen",
	},
	render: (args) => <DataTableWrapper {...args} />,
};
