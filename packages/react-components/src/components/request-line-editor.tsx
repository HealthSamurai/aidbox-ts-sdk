import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "#shadcn/components/ui/button";
import { Input } from "#shadcn/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#shadcn/components/ui/select";

const requestMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

// Move to copy-button.tsx
function CopyButton() {
	const [isActive, setIsActive] = useState(false);
	function handleClick() {
		setIsActive(true);
		setTimeout(() => {
			setIsActive(false);
		}, 1000);
	}
	return (
		<Button
			variant="ghost"
			className="p-1 absolute right-2 top-1.5 text-text-secondary"
			onClick={handleClick}
		>
			{isActive ? <Check /> : <Copy />}
		</Button>
	);
}

function RequestMethodSelector({
	variant = "compound",
	size = "regular",
	disabled = false,
}: {
	variant?: "default" | "compound";
	size?: "regular" | "small";
	disabled?: boolean;
}) {
	const [selectedMethod, setMethod] = useState("GET");
	return (
		<Select
			value={selectedMethod}
			onValueChange={setMethod}
			disabled={disabled}
		>
			<SelectTrigger variant={variant} size={size}>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{requestMethods.map((requestMethod) => (
					<SelectItem key={requestMethod} value={requestMethod}>
						{requestMethod}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

interface RequestLineEditorProps {
	variant?: "default" | "compound";
	size?: "regular" | "small";
	disabled?: boolean;
}

function RequestLineEditor({
	variant = "compound",
	size = "regular",
	disabled = false,
}: RequestLineEditorProps) {
	return (
		<div className="flex relative w-full">
			<RequestMethodSelector
				variant={variant}
				size={size}
				disabled={disabled}
			/>
			<Input
				className="rounded-l-none!"
				defaultValue="/fhir/Patient"
				disabled={disabled}
			/>
			<CopyButton />
		</div>
	);
}

export { RequestLineEditor };
