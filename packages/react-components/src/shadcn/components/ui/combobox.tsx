"use client";

import { CheckIcon } from "lucide-react";
import * as React from "react";
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from "#shadcn/components/ui/command";
import {
	Select,
	SelectContent,
	SelectTrigger,
	SelectValue,
} from "#shadcn/components/ui/select";
import { cn } from "#shadcn/lib/utils";

export interface ComboboxOption {
	value: string;
	label: string;
}

interface ComboboxProps {
	options: ComboboxOption[];
	value?: string;
	onValueChange?: (value: string) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyText?: string;
	disabled?: boolean;
	className?: string;
}

export function Combobox({
	options,
	value,
	onValueChange,
	placeholder = "Select option...",
	searchPlaceholder = "Search...",
	emptyText = "No options found.",
	disabled = false,
	className,
}: ComboboxProps) {
	const [open, setOpen] = React.useState(false);
	const [searchValue, setSearchValue] = React.useState("");
	const inputRef = React.useRef<HTMLInputElement>(null);

	const filteredOptions = React.useMemo(() => {
		if (!searchValue) return options;
		return options.filter((option) =>
			option.label.toLowerCase().includes(searchValue.toLowerCase()),
		);
	}, [options, searchValue]);

	const selectedOption = options.find((option) => option.value === value);

	// Reset search when closing and auto-focus when opening
	React.useEffect(() => {
		if (!open) {
			setSearchValue("");
		} else {
			// Auto-focus on search input when opening
			setTimeout(() => {
				inputRef.current?.focus();
			}, 0);
		}
	}, [open]);

	return (
		<Select
			value={value || ""}
			{...(onValueChange && { onValueChange })}
			disabled={disabled}
			open={open}
			onOpenChange={setOpen}
		>
			<SelectTrigger className={className}>
				<SelectValue placeholder={placeholder}>
					{selectedOption?.label}
				</SelectValue>
			</SelectTrigger>
			<SelectContent className="p-0 [&_[data-radix-select-viewport]]:p-0">
				<Command className="w-full">
					<CommandInput
						ref={inputRef}
						placeholder={searchPlaceholder}
						value={searchValue}
						onValueChange={setSearchValue}
					/>
					<CommandList>
						<CommandEmpty>{emptyText}</CommandEmpty>

						{filteredOptions.map((option) => (
							<CommandItem
								key={option.value}
								value={option.value}
								data-state={value === option.value ? "checked" : undefined}
								onSelect={(currentValue) => {
									onValueChange?.(currentValue);
									setOpen(false);
								}}
							>
								{option.label}
								<CheckIcon
									className={cn(
										"ml-auto size-4",
										value === option.value ? "opacity-100" : "opacity-0",
									)}
								/>
							</CommandItem>
						))}
					</CommandList>
				</Command>
			</SelectContent>
		</Select>
	);
}

// Demo component for Storybook
const demoOptions = [
	{ value: "next.js", label: "Next.js" },
	{ value: "sveltekit", label: "SvelteKit" },
	{ value: "nuxt.js", label: "Nuxt.js" },
	{ value: "remix", label: "Remix" },
	{ value: "astro", label: "Astro" },
];

export function ComboboxDemo() {
	const [value, setValue] = React.useState("");

	return (
		<Combobox
			options={demoOptions}
			value={value}
			onValueChange={setValue}
			placeholder="Select framework..."
			searchPlaceholder="Search framework..."
		/>
	);
}
