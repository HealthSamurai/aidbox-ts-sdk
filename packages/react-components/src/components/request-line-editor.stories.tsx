import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { action } from "storybook/actions";
import {
	RequestLineEditor,
	type RequestLineEditorProps,
} from "./request-line-editor";

const meta: Meta<typeof RequestLineEditor> = {
	title: "Component/Request line editor",
	component: RequestLineEditor,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof RequestLineEditor>;

function RequestLineEditorWrapper({
	selectedMethod,
	methods,
	inputValue,
}: RequestLineEditorProps) {
	const [currentSelectedMethod, setMethod] = React.useState(selectedMethod);
	const [currentInputValue, setInputValue] = React.useState(inputValue);
	const actionSetMethod = (method: string) => {
		action("setMethod")(method);
		setMethod(method);
	};
	const actionSetInputValue = (event: React.ChangeEvent<HTMLInputElement>) => {
		action("setMethod")(event);
		setInputValue(event.target.value);
	};
	return (
		<RequestLineEditor
			methods={methods}
			selectedMethod={currentSelectedMethod}
			setMethod={actionSetMethod}
			inputValue={currentInputValue}
			onInputChange={actionSetInputValue}
		/>
	);
}

export const GET: Story = {
	args: {
		selectedMethod: "GET",
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
		inputValue: "/fhir/Patient",
	},
	render: (args) => <RequestLineEditorWrapper {...args} />,
};

export const POST: Story = {
	args: {
		selectedMethod: "POST",
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
		inputValue: "/fhir/Patient",
	},
	render: (args) => <RequestLineEditorWrapper {...args} />,
};

export const PUT: Story = {
	args: {
		selectedMethod: "PUT",
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
		inputValue: "/fhir/Patient",
	},
	render: (args) => <RequestLineEditorWrapper {...args} />,
};

export const PATCH: Story = {
	args: {
		selectedMethod: "PATCH",
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
		inputValue: "/fhir/Patient",
	},
	render: (args) => <RequestLineEditorWrapper {...args} />,
};

export const DELETE: Story = {
	args: {
		selectedMethod: "DELETE",
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
		inputValue: "/fhir/Patient",
	},
	render: (args) => <RequestLineEditorWrapper {...args} />,
};
