import type { EditorView } from "@codemirror/view";
import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { Input } from "#shadcn/components/ui/input.js";
import { CodeEditor } from "./code-editor";
import * as http from "./code-editor/http";

const meta: Meta<typeof CodeEditor> = {
	title: "Component/Editor",
	component: CodeEditor,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CodeEditor>;

export const Default: Story = {
	args: {
		defaultValue: JSON.stringify(
			{
				resourceType: "Patient",
				meta: { versionId: 10 },
				gender: "male",
				name: [{ family: "Doe", given: ["John"] }],
			},
			null,
			2,
		),
	},
	render: () => (
		<div className="h-[500px] w-[500px]">
			<CodeEditor mode="http" />
		</div>
	),
};

const MethodInput = React.memo(function MethodInput({
	method,
	onMethodChange,
}: {
	method: string;
	onMethodChange: (ev: React.ChangeEvent<HTMLInputElement>) => void;
}) {
	return (
		<div className="flex justify-center items-baseline">
			Method:
			<Input
				type="text"
				className="inline"
				value={method}
				onChange={onMethodChange}
			/>
		</div>
	);
});

const PathInput = React.memo(function PathInput({
	path,
	onPathChange,
}: {
	path: string;
	onPathChange: (ev: React.ChangeEvent<HTMLInputElement>) => void;
}) {
	return (
		<div className="flex justify-center items-baseline">
			Path:
			<Input
				type="text"
				className="inline"
				value={path}
				onChange={onPathChange}
			/>
		</div>
	);
});

function ComplexComp() {
	const [path, setPath] = React.useState("");
	const [method, setMethod] = React.useState("");

	const viewRef = React.useRef<EditorView | null>(null);

	const onMethodChange = React.useCallback(
		(ev: React.ChangeEvent<HTMLInputElement>) => {
			let newVal = ev.target.value;

			if (newVal.indexOf(" ") !== -1) {
				newVal = newVal.replaceAll(" ", "").replaceAll("\t", "");
			}

			const view = viewRef.current;
			if (view === null) {
				return null;
			}

			http.setMethod(view, newVal);
			setMethod(newVal);
		},
		[],
	);

	const onPathChange = React.useCallback(
		(ev: React.ChangeEvent<HTMLInputElement>) => {
			const newVal = ev.target.value;

			const view = viewRef.current;
			if (view === null) {
				return null;
			}

			http.setPath(view, newVal);
			setPath(newVal);
		},
		[],
	);

	return (
		<>
			<MethodInput method={method} onMethodChange={onMethodChange} />
			<PathInput path={path} onPathChange={onPathChange} />
			<div className="h-[500px] w-[500px] border-black border-2">
				<CodeEditor
					mode="http"
					onUpdate={(update) => {
						const method = http.getMethod(update.view);
						const path = http.getPath(update.view);

						setMethod(method);
						setPath(path);
					}}
					viewCallback={(view) => {
						viewRef.current = view;
					}}
				/>
			</div>
		</>
	);
}

export const Complex: Story = {
	render: () => ComplexComp(),
};
