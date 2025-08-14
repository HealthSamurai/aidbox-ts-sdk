import {
	Button,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Input,

} from "../../index";

import {
	Check,
	ChevronDown,
	Copy,
} from "lucide-react";
import { useState } from "react";

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

function RequestMethodSelector() {
	const [selectedMethod, setMethod] = useState("GET");
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="rounded-r-none! border-r-0! pr-3! w-26 h-9 bg-bg-secondary"
				>
					{selectedMethod}
					<ChevronDown />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuLabel>Request method</DropdownMenuLabel>
				<DropdownMenuSeparator></DropdownMenuSeparator>
				{requestMethods.map((requestMethod) => (
					<DropdownMenuCheckboxItem
						key={requestMethod}
						checked={selectedMethod === requestMethod}
						onCheckedChange={() => setMethod(requestMethod)}
					>
						{requestMethod}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function ReuqestLineEditor() {
	return (
		<div className="flex relative w-full">
				<RequestMethodSelector />
				<Input className="rounded-l-none!" defaultValue="/fhir/Patient" />
				<CopyButton />
			</div>
	);
}

export { ReuqestLineEditor }