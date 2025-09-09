import type { Meta, StoryObj } from "@storybook/react-vite";
import { PatientTable, type PatientTableProps } from "./patient-table";

// Интерфейс для Storybook контролов (расширяем основные пропсы)
interface PatientTableStoryProps extends PatientTableProps {
	// Добавляем дополнительные контролы если нужно
}

// Компонент обертка для Stories (аналогично InputWithLabel)
function PatientTableWithStory({
	page = 1,
	count = 10,
	showFilters = true,
	showSorting = true,
	enableColumnResizing = false,
	enableColumnReordering = false,
	enableColumnPinning = false,
	showPinningMenu = true,
	columnWidths,
	columnConfigs,
}: PatientTableStoryProps) {
	return (
		<PatientTable
			page={page}
			count={count}
			showFilters={showFilters}
			showSorting={showSorting}
			enableColumnResizing={enableColumnResizing}
			enableColumnReordering={enableColumnReordering}
			enableColumnPinning={enableColumnPinning}
			showPinningMenu={showPinningMenu}
			{...(columnWidths && { columnWidths })}
			{...(columnConfigs && { columnConfigs })}
		/>
	);
}

const meta = {
	title: "Component/PatientTable",
	component: PatientTableWithStory,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
	argTypes: {
		page: { control: { type: "number", min: 1 } },
		count: { control: { type: "number", min: 1, max: 100 } },
		showFilters: { control: "boolean" },
		showSorting: { control: "boolean" },
		enableColumnResizing: { control: "boolean" },
		enableColumnReordering: { control: "boolean" },
		enableColumnPinning: { control: "boolean" },
		showPinningMenu: { control: "boolean" },
		columnWidths: { control: "object" },
		columnConfigs: { control: "object" },
	},
} satisfies Meta<typeof PatientTableWithStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {
	args: {
		page: 1,
		count: 10,
		showFilters: true,
		showSorting: true,
		enableColumnResizing: true,
	},
} satisfies Story;

export const Aidbox = {
	args: {
		page: 1,
		count: 10,
		showFilters: true,
		showSorting: true,
		enableColumnResizing: true,
		enableColumnReordering: true,
		enableColumnPinning: true,
		showPinningMenu: true,
		columnConfigs: [
			{ key: "firstName", label: "First Name", width: "160px" },
			{ key: "lastName", label: "Last Name", width: "150px" },
			{ key: "id", label: "Patient ID", width: "160px", type: "code" },
			{ key: "birthDate", label: "Birth Date", width: "150px" },
			{ key: "phoneNumber", label: "Phone Number", width: "200px" },
			{ key: "email", label: "Email Address", width: "250px" },
			{ key: "gender", label: "Gender", width: "120px" },
			{ key: "street", label: "Street", width: "200px" },
			{ key: "city", label: "City", width: "120px" },
			{ key: "state", label: "State", width: "120px" },
			{ key: "zip", label: "ZIP", width: "120px" },
			{ key: "encounters", label: "Visits", width: "110px", rightAlign: true },
			{
				key: "actions",
				label: "Actions",
				width: "90px",
				fixed: true,
				type: "button",
				actions: [
					{
						label: "Match",
						onClick: (id) => console.log("Match patient:", id),
						variant: "secondary",
					},
				],
			},
		],
	},
} satisfies Story;
