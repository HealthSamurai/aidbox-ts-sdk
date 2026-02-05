import { cva } from "class-variance-authority";
import * as Lucide from "lucide-react";
import * as React from "react";
import { Button } from "#shadcn/components/ui/button.js";
import {
	Command,
	CommandInput,
	CommandItem,
	CommandList,
} from "#shadcn/components/ui/command.js";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#shadcn/components/ui/popover";
import { cn } from "#shadcn/lib/utils";

export interface ButtonDropdownOption {
	value: string;
	label: string;
}

const popoverTriggerButtonStyle = cn(
	"text-text-secondary",
	"bg-gray-100",
	"rounded-full",
	"px-2 h-6",
);

const checkIconStyles = cva("ml-auto size-4", {
	variants: {
		isSelected: {
			true: "opacity-100",
			false: "opacity-0",
		},
	},
});

export function ButtonDropdown({
	options,
	selectedValue,
	onSelectItem,
}: {
	selectedValue?: string;
	options: ButtonDropdownOption[];
	onSelectItem: (item: string) => void;
}) {
	const [open, setOpen] = React.useState(false);

	const onSelectItemMy = (item: string) => {
		onSelectItem(item);
		setOpen(false);
	};

	const selectedOption = options.find(
		(option) => option.value === selectedValue,
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="link" className={popoverTriggerButtonStyle}>
					<span className="typo-body">{selectedOption?.label}</span>
					<Lucide.ChevronDownIcon />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="p-0">
				<Command>
					<CommandInput></CommandInput>
					<CommandList>
						{options.map((option) => (
							<CommandItem
								key={option.value}
								data-state={
									selectedOption?.value === option.value
										? "checked"
										: "unchecked"
								}
								value={option.value}
								onSelect={onSelectItemMy}
							>
								{option.label}
								<Lucide.CheckIcon
									className={cn(
										checkIconStyles({
											isSelected: selectedOption?.value === option.value,
										}),
									)}
								/>
							</CommandItem>
						))}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
