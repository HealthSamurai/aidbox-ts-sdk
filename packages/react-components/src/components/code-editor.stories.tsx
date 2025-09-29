import type { EditorView } from "@codemirror/view";
import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { Input } from "#shadcn/components/ui/input.js";
import { CodeEditor } from "./code-editor";

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

type ParsedHeader = {
	name: string;
	nameTrivia: string;
	value: string;
	valueTrivia: string;
};

type Parsed = {
	method: string;
	methodTrivia: string;
	path: string;
	pathTrivia: string;
	headers: ParsedHeader[];
	headersTrivia: string;
};

function parse(query: string): Parsed {
	let hi = 0;
	let lo = 0;
	const res: Parsed = {
		method: "",
		methodTrivia: "",
		path: "",
		pathTrivia: "",
		headers: [],
		headersTrivia: "",
	};

	// Note that we iterate by code units, but it doesn't change correctness.
	// method
	for (hi = 0; hi < query.length; ++hi) {
		const c = query[hi];
		if (c === " " || c === "\t" || c === "\n") {
			break;
		}
	}
	res.method = query.substring(lo, hi);
	lo = hi;
	if (lo >= query.length) {
		return res;
	}

	// method trivia
	for (hi = lo; hi < query.length; ++hi) {
		const c = query[hi];
		if (!(c === " " || c === "\t")) {
			break;
		}
	}
	res.methodTrivia = query.substring(lo, hi);
	lo = hi;
	if (lo >= query.length) {
		return res;
	}

	// path
	for (hi = lo; hi < query.length; ++hi) {
		const c = query[hi];
		if (c === "\n") {
			break;
		}
	}
	res.path = query.substring(lo, hi);
	lo = hi;
	if (lo >= query.length) {
		return res;
	}

	// path trivia
	if (query[hi] === "\n") {
		hi += 1;
		res.pathTrivia = query.substring(lo, hi);
	}
	lo = hi;
	if (lo >= query.length) {
		return res;
	}

	// headers
	let header: ParsedHeader = {
		name: "",
		nameTrivia: "",
		value: "",
		valueTrivia: "",
	};
	let headerReady = false;
	// SAFETY: don't decrease hi inside this loop.
	for (hi = lo; hi < query.length; ++hi) {
		if (headerReady) {
			res.headers.push(header);
		}
		header = { name: "", nameTrivia: "", value: "", valueTrivia: "" };
		headerReady = false;

		if (query[hi] === "\n") {
			// end of headers
			break;
		}

		// header name
		for (lo = hi; hi <= query.length; ++hi) {
			const c = query[hi];
			if (c === " " || c === "\t" || c === "\n" || c === ":") {
				break;
			}
		}
		headerReady = true;
		header.name = query.substring(lo, hi);
		lo = hi;
		if (lo >= query.length) {
			break;
		}

		// header name trivia
		let colonFound = false;
		for (lo = hi; hi <= query.length; ++hi) {
			const c = query[hi];
			if (c === ":" && !colonFound) {
				colonFound = true;
			} else if (!(c === " " || c === "\t")) {
				break;
			}
		}
		header.nameTrivia = query.substring(lo, hi);
		lo = hi;
		if (lo >= query.length) {
			break;
		}

		// header value
		for (hi = lo; hi < query.length; ++hi) {
			const c = query[hi];
			if (c === "\n") {
				break;
			}
		}
		header.value = query.substring(lo, hi);
		lo = hi;
		if (lo >= query.length) {
			break;
		}

		// header value trivia
		if (query[hi] === "\n") {
			header.valueTrivia = query.substring(lo, hi + 1);
		}
		lo = hi + 1;
		if (lo >= query.length) {
			break;
		}
	}
	if (headerReady) {
		res.headers.push(header);
	}

	if (query[hi] === "\n") {
		res.headersTrivia = query.substring(lo, hi + 1);
	}

	return res;
}

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
			{"Path: "}
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
	const [rawQuery, setRawQuery] = React.useState("");
	const parsed = React.useMemo(() => parse(rawQuery), [rawQuery]);
	const parsedRef = React.useRef(parsed);
	React.useEffect(() => {
		parsedRef.current = parsed;
	}, [parsed]);
	const method = React.useMemo(() => parsed.method, [parsed.method]);
	const path = React.useMemo(() => parsed.path, [parsed.path]);

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

			const from = 0;
			const to = parsedRef.current.method.length;

			view.dispatch({
				changes: {
					from: from,
					to: to,
					insert: newVal,
				},
			});
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

			const from =
				parsedRef.current.method.length + parsedRef.current.methodTrivia.length;
			const to = from + parsedRef.current.path.length;
			console.log(from, to);

			view.dispatch({
				changes: {
					from: from,
					to: to,
					insert: newVal,
				},
			});
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
						if (update.docChanged) {
							setRawQuery(update.state.doc.toString());
						}
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
