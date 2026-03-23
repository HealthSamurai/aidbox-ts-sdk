import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { DatePickerInput } from "./date-picker-input";

function DatePickerInputWrapper(props: {
	placeholder?: string;
	disabled?: boolean;
}) {
	const [value, setValue] = useState("");
	return (
		<div className="w-48">
			<DatePickerInput value={value} onChange={setValue} {...props} />
		</div>
	);
}

function DatePickerInputPrefilledWrapper() {
	const [value, setValue] = useState("15.06.2025");
	return (
		<div className="w-48">
			<DatePickerInput value={value} onChange={setValue} />
		</div>
	);
}

function DatePickerRangeWrapper() {
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	return (
		<div className="flex items-center gap-2">
			<DatePickerInput
				value={from}
				onChange={setFrom}
				className="w-40"
				placeholder="From"
			/>
			<span className="text-text-secondary">—</span>
			<DatePickerInput
				value={to}
				onChange={setTo}
				className="w-40"
				placeholder="To"
			/>
		</div>
	);
}

const meta = {
	title: "Component/DatePickerInput",
	component: DatePickerInputWrapper,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof DatePickerInputWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPlaceholder: Story = {
	args: {
		placeholder: "Select a date...",
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
	},
};

export const Prefilled: StoryObj = {
	render: () => <DatePickerInputPrefilledWrapper />,
};

export const DateRange: StoryObj = {
	render: () => <DatePickerRangeWrapper />,
};
