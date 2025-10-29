import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { DateRangePicker } from "./date-range-picker";

const meta = {
	title: "Component/DateRangePicker",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => {
		const [dateRange, setDateRange] = React.useState<
			{ from?: Date; to?: Date } | undefined
		>(undefined);

		return (
			<div className="space-y-4">
				<DateRangePicker value={dateRange} onDateRangeChange={setDateRange} />
				<div className="text-sm">
					{dateRange ? (
						<div className="space-y-1">
							<div>From: {dateRange.from?.toString() || "Not set"}</div>
							<div>To: {dateRange.to?.toString() || "Not set"}</div>
						</div>
					) : (
						<div>No date range selected</div>
					)}
				</div>
			</div>
		);
	},
} satisfies Story;
