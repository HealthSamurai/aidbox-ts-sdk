import type * as React from "react";
import { Input } from "#shadcn/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#shadcn/components/ui/select";
import { cn } from "#shadcn/lib/utils";
import { CopyIcon } from "./copy-icon";

interface RequestLineEditorProps extends React.ComponentProps<"div"> {
	selectedMethod: string;
	setMethod: (value: string) => void;
	methods: string[];
	inputValue?: string | undefined;
	onInputChange?: React.ChangeEventHandler<HTMLInputElement>;
}

const METHOD_COLORS = {
	GET: {
		text: "text-[#6D9F0F] [&_svg]:text-[#6D9F0F]!",
		background: "bg-green-200",
		border:
			"border-fg-success-secondary! hover:border-fg-success-secondary ring-green-200!",
	},
	POST: {
		text: "text-yellow-600 [&_svg]:text-yellow-600!",
		background: "bg-yellow-200",
		border: "border-[#F4CB00]! hover:border-[#F4CB00] ring-yellow-200!",
	},
	PUT: {
		text: "text-blue-500 [&_svg]:text-blue-500!",
		background: "bg-blue-200",
		border: "border-blue-400! hover:border-blue-400 ring-blue-200!",
	},
	PATCH: {
		text: "text-violet-600 [&_svg]:text-violet-600",
		background: "bg-violet-200",
		border: "border-violet-400! hover:border-violet-400 ring-violet-200!",
	},
	DELETE: {
		text: "text-red-600 [&_svg]:text-red-600!",
		background: "bg-red-200",
		border: "border-red-300! hover:border-red-300 ring-red-200!",
	},
};

function RequestMethodSelector({
	selectedMethod,
	setMethod,
	methods,
}: RequestLineEditorProps) {
	return (
		<Select value={selectedMethod} onValueChange={setMethod}>
			<SelectTrigger
				className={`min-w-26 border-r-0 rounded-r-none shadow-none ${METHOD_COLORS[selectedMethod as keyof typeof METHOD_COLORS].text} ${METHOD_COLORS[selectedMethod as keyof typeof METHOD_COLORS].background} ${METHOD_COLORS[selectedMethod as keyof typeof METHOD_COLORS].border}`}
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{methods.map((method) => (
					<SelectItem key={method} value={method}>
						<span
							className={`${METHOD_COLORS[method as keyof typeof METHOD_COLORS].text}`}
						>
							{" "}
							{method}{" "}
						</span>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

function RequestLineEditor({
	className,
	selectedMethod,
	setMethod,
	methods,
	inputValue,
	onInputChange,
}: RequestLineEditorProps) {
	return (
		<div className={cn("flex", className)}>
			<RequestMethodSelector
				selectedMethod={selectedMethod}
				setMethod={setMethod}
				methods={methods}
			/>
			<Input
				className={`rounded-l-none ${METHOD_COLORS[selectedMethod as keyof typeof METHOD_COLORS].border}`}
				value={inputValue}
				rightSlot={<CopyIcon text={`${selectedMethod} ${inputValue}`} />}
				{...(onInputChange !== undefined ? { onChange: onInputChange } : {})}
			/>
		</div>
	);
}

export { RequestLineEditor, type RequestLineEditorProps, METHOD_COLORS };
