import { cva } from "class-variance-authority";
import type * as React from "react";
import { toast } from "sonner";
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

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type RequestMethod = (typeof METHODS)[number];

const requestMethodVariants = cva<{ method: { [K in RequestMethod]: string } }>(
	cn(
		"cursor-pointer",
		"border-r-0",
		"rounded-r-none",
		"shadow-none",
		"typo-label",
		"text-left",
		"items-center",
		"w-26",
	),
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
	},
);

type RequestMethodSelectorProps = {
	value: string;
	onValueChange?: (newMethod: string) => void;
};

function isKnownMethod(candidate: string): candidate is RequestMethod {
	const methods: readonly string[] = METHODS;
	return methods.includes(candidate);
}

function RequestMethodSelector({
	value,
	onValueChange,
}: RequestMethodSelectorProps) {
	return (
		<Select
			value={value}
			{...(onValueChange ? { onValueChange: onValueChange } : {})}
		>
			<SelectTrigger
				className={requestMethodVariants(
					isKnownMethod(value) ? { method: value } : undefined,
				)}
			>
				<SelectValue>{value}</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{METHODS.map((method) => (
					<SelectItem key={method} value={method}>
						<span className={requestMethodVariants({ method: method })}>
							{method}
						</span>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

type RequestLineEditorProps = {
	method: string;
	placeholder?: string;
	autoFocus?: boolean;
	onMethodChange: (newMethod: string) => void;
	path?: string | undefined;
	onPathChange?: React.ChangeEventHandler<HTMLInputElement>;
	className?: string;
};

function RequestLineEditor({
	className,
	method,
	onMethodChange,
	path,
	placeholder,
	autoFocus,
	onPathChange,
}: RequestLineEditorProps) {
	return (
		<div className={cn("flex", className)}>
			<RequestMethodSelector value={method} onValueChange={onMethodChange} />
			<Input
				className="rounded-l-none"
				value={path}
				autoFocus={autoFocus}
				placeholder={placeholder}
				rightSlot={
					<CopyIcon
						text={`${method} ${path}`}
						tooltipText="Copy request line"
						showToast={false}
						onCopy={(text) => {
							// Custom toast for request line
							const truncatedText =
								text.length > 30 ? `${text.slice(0, 30)}...` : text;
							toast(
								<div className="flex flex-col gap-1">
									<span className="typo-body">Request line copied</span>
									<span className="typo-code text-text-secondary">
										{truncatedText}
									</span>
								</div>,
								{
									duration: 2000,
								},
							);
						}}
					/>
				}
				{...(onPathChange !== undefined ? { onChange: onPathChange } : {})}
			/>
		</div>
	);
}

export {
	RequestLineEditor,
	type RequestLineEditorProps,
	requestMethodVariants,
};
