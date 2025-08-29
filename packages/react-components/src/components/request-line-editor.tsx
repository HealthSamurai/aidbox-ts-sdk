import { cva, type VariantProps } from "class-variance-authority";
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

const requestMethodVariants = cva(
	"border-r-0 rounded-r-none shadow-none typo-label text-left items-center",
	{
		variants: {
			method: {
				GET: "text-utility-green [&_svg]:text-utility-green",
				POST: "text-utility-yellow [&_svg]:text-utility-yellow",
				PUT: "text-utility-blue [&_svg]:text-utility-blue ",
				PATCH: "text-utility-violet [&_svg]:text-utility-violet",
				DELETE: "text-utility-red [&_svg]:text-utility-red",
			},
		},
		defaultVariants: {
			method: "GET",
		},
	},
);

type RequestMethod = VariantProps<typeof requestMethodVariants>["method"];

interface RequestLineEditorProps extends React.ComponentProps<"div"> {
	selectedMethod: string;
	setMethod: (value: string) => void;
	methods: string[];
	inputValue?: string | undefined;
	onInputChange?: React.ChangeEventHandler<HTMLInputElement>;
}

function RequestMethodSelector({
	selectedMethod,
	setMethod,
	methods,
}: RequestLineEditorProps) {
	return (
		<Select value={selectedMethod} onValueChange={setMethod}>
			<SelectTrigger
				className={cn(
					"w-30",
					requestMethodVariants({ method: selectedMethod as RequestMethod }),
				)}
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{methods.map((method) => (
					<SelectItem key={method} value={method}>
						<span
							className={cn(
								requestMethodVariants({ method: method as RequestMethod }),
							)}
						>
							{method}
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
				className="rounded-l-none"
				value={inputValue}
				rightSlot={<CopyIcon text={`${selectedMethod} ${inputValue}`} />}
				{...(onInputChange !== undefined ? { onChange: onInputChange } : {})}
			/>
		</div>
	);
}

export {
	RequestLineEditor,
	type RequestLineEditorProps,
	requestMethodVariants,
};
