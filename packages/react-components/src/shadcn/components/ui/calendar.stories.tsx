import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Calendar } from "#shadcn/components/ui/calendar";

const meta = {
	title: "Component/Calendar",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => {
		const [date, setDate] = React.useState<Date | undefined>(new Date());

		return (
			<Calendar
				mode="single"
				selected={date}
				onSelect={setDate}
				className="rounded-md border shadow-sm"
				captionLayout="dropdown"
			/>
		);
	},
} satisfies Story;
