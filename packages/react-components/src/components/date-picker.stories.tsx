import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { DatePicker } from "./date-picker";

const meta = {
	title: "Component/DatePicker",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => {
		const [date, setDate] = React.useState<Date | undefined>(undefined);

		return (
			<div>
				<DatePicker value={date} onDateChange={setDate} />
				<span className="mt-4">{date?.toString()}</span>
			</div>
		);
	},
} satisfies Story;
