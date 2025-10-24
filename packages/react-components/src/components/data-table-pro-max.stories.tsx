import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import {
	type ColumnFilterConfig,
	DataTable,
	type FilterConfig,
	TableCellContent,
	TableHeaderContent,
} from "./data-table-pro-max";

type PatientRow = {
	id: string;
	firstName?: string;
	lastName?: string;
	phoneNumber?: string;
	email?: string;
	birthDate?: string;
	gender?: "male" | "female" | "other" | "unknown";
	street?: string;
	city?: string;
	state?: string;
	country?: string;
	zip?: string;
	encounters?: number;
};

const patientsColumns: ColumnDef<PatientRow>[] = [
	{
		accessorKey: "firstName",
		header: () => <TableHeaderContent content={"First name"} />,
		cell: ({ cell }) => (
			<TableCellContent content={cell.getValue() as string} />
		),
		enablePinning: true,
		enableResizing: true,
		enableSorting: true,
	},
	{
		accessorKey: "lastName",
		header: () => <TableHeaderContent content={"Last name"} />,
		cell: ({ cell }) => (
			<TableCellContent content={cell.getValue() as string} />
		),
		enablePinning: true,
		enableResizing: true,
		enableSorting: true,
	},
	{
		accessorKey: "id",
		header: () => <TableHeaderContent content={"ID"} />,
		cell: ({ cell }) => (
			<TableCellContent content={cell.getValue() as string} />
		),
		enablePinning: true,
		enableResizing: true,
	},
	{
		accessorKey: "birthDate",
		header: () => <TableHeaderContent content={"Birth"} />,
		cell: ({ cell }) => (
			<TableCellContent content={cell.getValue() as string} />
		),
		enablePinning: true,
		enableResizing: true,
		enableSorting: true,
		minSize: 120,
	},
	{
		accessorKey: "phoneNumber",
		header: () => <TableHeaderContent content={"Phone number"} />,
		cell: ({ cell }) => (
			<TableCellContent content={cell.getValue() as string} />
		),
		enablePinning: true,
		enableResizing: true,
		enableSorting: true,
	},
	{
		accessorKey: "email",
		header: () => <TableHeaderContent content={"Email"} />,
		cell: ({ cell }) => (
			<TableCellContent content={cell.getValue() as string} />
		),
		enablePinning: true,
		enableResizing: true,
		enableSorting: true,
	},
	{
		accessorKey: "gender",
		header: () => <TableHeaderContent content={"Gender"} />,
		cell: ({ cell }) => (
			<TableCellContent content={cell.getValue() as string} />
		),
		enablePinning: true,
		enableResizing: true,
	},
	{
		accessorKey: "street",
		header: () => <TableHeaderContent content={"Street"} />,
		cell: ({ cell }) => (
			<TableCellContent content={cell.getValue() as string} />
		),
		enablePinning: true,
		enableResizing: true,
	},
	{
		accessorKey: "city",
		header: () => <TableHeaderContent content={"City"} />,
		cell: ({ cell }) => (
			<TableCellContent content={cell.getValue() as string} />
		),
		enablePinning: true,
		enableResizing: true,
	},
	{
		accessorKey: "state",
		header: () => <TableHeaderContent content={"State"} />,
		cell: ({ cell }) => (
			<TableCellContent content={cell.getValue() as string} />
		),
		enablePinning: true,
		enableResizing: true,
	},
	{
		accessorKey: "zip",
		header: () => <TableHeaderContent content={"ZIP"} />,
		cell: ({ cell }) => (
			<TableCellContent content={cell.getValue() as string} />
		),
		enablePinning: true,
		enableResizing: true,
	},
	{
		accessorKey: "country",
		header: () => <TableHeaderContent content={"Country"} />,
		cell: ({ cell }) => (
			<TableCellContent content={cell.getValue() as string} />
		),
		enablePinning: true,
		enableResizing: true,
	},
	{
		accessorKey: "encounters",
		header: () => <TableHeaderContent content={"Encounters"} />,
		cell: ({ cell }) => (
			<TableCellContent content={cell.getValue() as number} />
		),
		enablePinning: true,
		enableResizing: true,
	},
	{
		id: "actions",
		header: () => <TableHeaderContent content={"Actions"} />,
		cell: (_) => (
			<TableCellContent
				content={
					<button
						type="button"
						className="text-blue-600 hover:text-blue-800 cursor-pointer"
						onClick={(e) => e.stopPropagation()}
					>
						Match
					</button>
				}
			/>
		),
		enablePinning: true,
	},
];

const initialFilterConfig: ColumnFilterConfig = [
	{
		enabled: true,
		columnId: "firstName",
		type: "text",
		placeholder: "Search",
	},
	{
		enabled: true,
		columnId: "lastName",
		type: "text",
		placeholder: "Search",
	},
	{
		enabled: true,
		columnId: "id",
		type: "text",
		placeholder: "Search",
	},
	{
		enabled: true,
		columnId: "birthDate",
		type: "date",
		placeholder: "Pick date",
	},
	{
		enabled: true,
		columnId: "phoneNumber",
		type: "text",
		placeholder: "Search",
	},
	{
		enabled: true,
		columnId: "email",
		type: "text",
		placeholder: "Search",
	},
	{
		enabled: true,
		columnId: "gender",
		type: "enum",
		options: ["male", "female"],
		placeholder: "Search",
	},
	{
		enabled: true,
		columnId: "encounters",
		type: "text",
		placeholder: "Search",
	},
];

// Helper function to apply filters to data
function filterData(
	data: PatientRow[],
	filterConfig: ColumnFilterConfig,
): PatientRow[] {
	return data.filter((row) => {
		return filterConfig.every((filter) => {
			if (!filter.value) return true;

			const columnValue = row[filter.columnId as keyof PatientRow];

			switch (filter.type) {
				case "text":
					return String(columnValue || "")
						.toLowerCase()
						.includes(String(filter.value).toLowerCase());

				case "date": {
					if (!filter.value) return true;
					const rowDate = new Date(columnValue as string);
					const filterDate = new Date(filter.value as Date);
					return (
						rowDate.getFullYear() === filterDate.getFullYear() &&
						rowDate.getMonth() === filterDate.getMonth() &&
						rowDate.getDate() === filterDate.getDate()
					);
				}

				case "enum":
					return columnValue === filter.value;

				case "number":
					return String(columnValue) === String(filter.value);

				default:
					return true;
			}
		});
	});
}

// Wrapper component that manages filter state
function DataTableWithFilters() {
	const [filterConfig, setFilterConfig] =
		useState<ColumnFilterConfig>(initialFilterConfig);
	const [pageIndex, setPageIndex] = useState(1);
	const pageSize = 10;

	// Apply filters to data
	const filteredData = useMemo(() => {
		return filterData(mockPatients, filterConfig);
	}, [filterConfig]);

	// Handle filter changes
	const handleFilterChange = (
		filters: Array<{ id: string; value: unknown }>,
	) => {
		setFilterConfig((prev) =>
			prev.map((filter) => {
				const newFilter = filters.find((f) => f.id === filter.columnId);
				if (newFilter !== undefined) {
					return { ...filter, value: newFilter.value } as FilterConfig;
				}
				// Clear the filter value if it's not in the new filters array
				const { value, ...rest } = filter;
				return rest as FilterConfig;
			}),
		);
		// Reset to first page when filters change
		setPageIndex(1);
	};

	return (
		<div className="p-4">
			<div className="mb-4 text-sm text-gray-600">
				Showing {filteredData.length} of {mockPatients.length} patients
			</div>
			<DataTable
				columns={patientsColumns}
				data={filteredData}
				filterConfig={filterConfig}
				pageIndex={pageIndex}
				pageSize={pageSize}
				onFilter={handleFilterChange}
				onPaginationChange={({ pageIndex }) => setPageIndex(pageIndex)}
				onRowClick={console.log}
				showZebraStripes={true}
				enableColumnReordering={true}
			/>
		</div>
	);
}

const mockPatients: PatientRow[] = [
	{
		id: "pt-001",
		firstName: "Emma",
		lastName: "Johnson",
		phoneNumber: "+1-555-0101",
		email: "emma.johnson@example.com",
		birthDate: "1985-03-15",
		gender: "female",
		street: "123 Oak Street",
		city: "Portland",
		state: "Oregon",
		country: "USA",
		zip: "97201",
		encounters: 12,
	},
	{
		id: "pt-002",
		firstName: "Michael",
		lastName: "Chen",
		phoneNumber: "+1-555-0102",
		email: "michael.chen@example.com",
		birthDate: "1978-11-22",
		gender: "male",
		street: "456 Pine Avenue",
		city: "Seattle",
		state: "Washington",
		country: "USA",
		zip: "98101",
		encounters: 8,
	},
	{
		id: "pt-003",
		firstName: "Sarah",
		lastName: "Williams",
		phoneNumber: "+1-555-0103",
		email: "sarah.williams@example.com",
		birthDate: "1992-07-08",
		gender: "female",
		street: "789 Maple Drive",
		city: "Austin",
		state: "Texas",
		country: "USA",
		zip: "78701",
		encounters: 15,
	},
	{
		id: "pt-004",
		firstName: "James",
		lastName: "Martinez",
		phoneNumber: "+1-555-0104",
		email: "james.martinez@example.com",
		birthDate: "1965-09-30",
		gender: "male",
		street: "321 Elm Boulevard",
		city: "Miami",
		state: "Florida",
		country: "USA",
		zip: "33101",
		encounters: 23,
	},
	{
		id: "pt-005",
		firstName: "Olivia",
		lastName: "Davis",
		phoneNumber: "+1-555-0105",
		email: "olivia.davis@example.com",
		birthDate: "1988-12-14",
		gender: "female",
		street: "654 Birch Lane",
		city: "Denver",
		state: "Colorado",
		country: "USA",
		zip: "80201",
		encounters: 6,
	},
	{
		id: "pt-006",
		firstName: "Robert",
		lastName: "Anderson",
		phoneNumber: "+1-555-0106",
		email: "robert.anderson@example.com",
		birthDate: "1975-04-18",
		gender: "male",
		street: "987 Cedar Court",
		city: "Boston",
		state: "Massachusetts",
		country: "USA",
		zip: "02101",
		encounters: 19,
	},
	{
		id: "pt-007",
		firstName: "Sophia",
		lastName: "Taylor",
		phoneNumber: "+1-555-0107",
		email: "sophia.taylor@example.com",
		birthDate: "1995-06-25",
		gender: "female",
		street: "147 Willow Way",
		city: "San Francisco",
		state: "California",
		country: "USA",
		zip: "94101",
		encounters: 4,
	},
	{
		id: "pt-008",
		firstName: "William",
		lastName: "Thomas",
		phoneNumber: "+1-555-0108",
		email: "william.thomas@example.com",
		birthDate: "1982-01-11",
		gender: "male",
		street: "258 Spruce Street",
		city: "Chicago",
		state: "Illinois",
		country: "USA",
		zip: "60601",
		encounters: 11,
	},
	{
		id: "pt-009",
		firstName: "Ava",
		lastName: "Jackson",
		phoneNumber: "+1-555-0109",
		email: "ava.jackson@example.com",
		birthDate: "1990-08-03",
		gender: "female",
		street: "369 Ash Avenue",
		city: "Phoenix",
		state: "Arizona",
		country: "USA",
		zip: "85001",
		encounters: 7,
	},
	{
		id: "pt-010",
		firstName: "David",
		lastName: "White",
		phoneNumber: "+1-555-0110",
		email: "david.white@example.com",
		birthDate: "1970-05-27",
		gender: "male",
		street: "741 Poplar Place",
		city: "Philadelphia",
		state: "Pennsylvania",
		country: "USA",
		zip: "19101",
		encounters: 16,
	},
	{
		id: "pt-011",
		firstName: "Isabella",
		lastName: "Harris",
		phoneNumber: "+1-555-0111",
		email: "isabella.harris@example.com",
		birthDate: "1987-10-09",
		gender: "female",
		street: "852 Hickory Hill",
		city: "Atlanta",
		state: "Georgia",
		country: "USA",
		zip: "30301",
		encounters: 9,
	},
	{
		id: "pt-012",
		firstName: "Joseph",
		lastName: "Clark",
		phoneNumber: "+1-555-0112",
		email: "joseph.clark@example.com",
		birthDate: "1993-02-16",
		gender: "male",
		street: "963 Walnut Road",
		city: "Dallas",
		state: "Texas",
		country: "USA",
		zip: "75201",
		encounters: 5,
	},
	{
		id: "pt-013",
		firstName: "Mia",
		lastName: "Lewis",
		phoneNumber: "+1-555-0113",
		email: "mia.lewis@example.com",
		birthDate: "1980-11-28",
		gender: "female",
		street: "159 Chestnut Circle",
		city: "San Diego",
		state: "California",
		country: "USA",
		zip: "92101",
		encounters: 13,
	},
	{
		id: "pt-014",
		firstName: "Daniel",
		lastName: "Robinson",
		phoneNumber: "+1-555-0114",
		email: "daniel.robinson@example.com",
		birthDate: "1968-07-12",
		gender: "male",
		street: "357 Sycamore Street",
		city: "Houston",
		state: "Texas",
		country: "USA",
		zip: "77001",
		encounters: 21,
	},
	{
		id: "pt-015",
		firstName: "Charlotte",
		lastName: "Walker",
		phoneNumber: "+1-555-0115",
		email: "charlotte.walker@example.com",
		birthDate: "1991-04-05",
		gender: "female",
		street: "486 Magnolia Drive",
		city: "Nashville",
		state: "Tennessee",
		country: "USA",
		zip: "37201",
		encounters: 10,
	},
	{
		id: "pt-016",
		firstName: "Matthew",
		lastName: "Hall",
		phoneNumber: "+1-555-0116",
		email: "matthew.hall@example.com",
		birthDate: "1976-09-19",
		gender: "male",
		street: "597 Dogwood Lane",
		city: "Minneapolis",
		state: "Minnesota",
		country: "USA",
		zip: "55401",
		encounters: 14,
	},
	{
		id: "pt-017",
		firstName: "Amelia",
		lastName: "Young",
		phoneNumber: "+1-555-0117",
		email: "amelia.young@example.com",
		birthDate: "1989-12-31",
		gender: "female",
		street: "684 Redwood Court",
		city: "Portland",
		state: "Maine",
		country: "USA",
		zip: "04101",
		encounters: 3,
	},
	{
		id: "pt-018",
		firstName: "Christopher",
		lastName: "Allen",
		phoneNumber: "+1-555-0118",
		email: "christopher.allen@example.com",
		birthDate: "1984-03-24",
		gender: "male",
		street: "795 Cypress Way",
		city: "Las Vegas",
		state: "Nevada",
		country: "USA",
		zip: "89101",
		encounters: 18,
	},
	{
		id: "pt-019",
		firstName: "Harper",
		lastName: "King",
		phoneNumber: "+1-555-0119",
		email: "harper.king@example.com",
		birthDate: "1996-06-07",
		gender: "other",
		street: "821 Juniper Avenue",
		city: "Salt Lake City",
		state: "Utah",
		country: "USA",
		zip: "84101",
		encounters: 2,
	},
	{
		id: "pt-020",
		firstName: "Benjamin",
		lastName: "Scott",
		phoneNumber: "+1-555-0120",
		email: "benjamin.scott@example.com",
		birthDate: "1972-08-20",
		gender: "male",
		street: "932 Fir Street",
		city: "Columbus",
		state: "Ohio",
		country: "USA",
		zip: "43201",
		encounters: 20,
	},
];

const meta: Meta<typeof DataTable> = {
	title: "Component/Data table PRO MAX",
	component: DataTable,
	tags: ["autodocs"],
};

export default meta;

export const Default: StoryObj<typeof DataTable<PatientRow>> = {
	parameters: {
		layout: "fullscreen",
	},
	render: () => <DataTableWithFilters />,
};
