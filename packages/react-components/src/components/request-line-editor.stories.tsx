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

function RequestLineEditorWrapper({ method, path }: RequestLineEditorProps) {
	const [currentSelectedMethod, setMethod] = React.useState(method);
	const [currentInputValue, setInputValue] = React.useState(path);
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
			method={currentSelectedMethod}
			onMethodChange={actionSetMethod}
			path={currentInputValue}
			onPathChange={actionSetInputValue}
		/>
	);
}

export const GET: Story = {
	args: {
		method: "GET",
		path: "/fhir/Patient",
	},
	render: (args) => <RequestLineEditorWrapper {...args} />,
};

export const POST: Story = {
	args: {
		method: "POST",
		path: "/fhir/Patient",
	},
	render: (args) => <RequestLineEditorWrapper {...args} />,
};

export const PUT: Story = {
	args: {
		method: "PUT",
		path: "/fhir/Patient",
	},
	render: (args) => <RequestLineEditorWrapper {...args} />,
};

export const PATCH: Story = {
	args: {
		method: "PATCH",
		path: "/fhir/Patient",
	},
	render: (args) => <RequestLineEditorWrapper {...args} />,
};

export const DELETE: Story = {
	args: {
		method: "DELETE",
		path: "/fhir/Patient",
	},
	render: (args) => <RequestLineEditorWrapper {...args} />,
};
