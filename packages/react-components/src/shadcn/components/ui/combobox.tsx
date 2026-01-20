"use client";

import { CheckIcon, X } from "lucide-react";
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
import { Tag } from "../../../components/tag";

/* ==========================================================================
   Styles
   ========================================================================== */

const selectContentStyles = cn(
	// Spacing
	"p-0",
	// Radix viewport reset
	"[&_[data-radix-select-viewport]]:p-0",
);

const commandStyles = cn(
	// Layout
	"w-full",
);

const checkIconStyles = cn(
	// Layout
	"ml-auto",
	// Size
	"size-4",
);

const checkIconVisibleStyles = cn(checkIconStyles, "opacity-100");

const checkIconHiddenStyles = cn(checkIconStyles, "opacity-0");

const triggerWithValueStyles = cn("text-text-primary");

const triggerWithTagsStyles = cn("pl-2");

const clearButtonStyles = cn(
	// Layout
	"ml-auto",
	"shrink-0",
	// Size
	"size-4",
	// Colors
	"text-text-tertiary",
	"hover:text-text-primary",
	// Interactions
	"cursor-pointer",
	"pointer-events-auto",
	"z-10",
	// Transitions
	"transition-colors",
);

/* ==========================================================================
   Types
   ========================================================================== */

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

/* ==========================================================================
   Components
   ========================================================================== */

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

	const changeOpen = (newOpen: boolean) => {
		if (!newOpen) {
			setSearchValue("");
		} else {
			inputRef.current?.focus();
		}
		setOpen(newOpen);
	};

	return (
		<Select
			value={value || ""}
			{...(onValueChange && { onValueChange })}
			disabled={disabled}
			open={open}
			onOpenChange={changeOpen}
		>
			<SelectTrigger className={className}>
				<SelectValue placeholder={placeholder}>
					{selectedOption?.label}
				</SelectValue>
			</SelectTrigger>
			<SelectContent className={selectContentStyles}>
				<Command className={commandStyles}>
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
									changeOpen(false);
								}}
							>
								{option.label}
								<CheckIcon
									className={
										value === option.value
											? checkIconVisibleStyles
											: checkIconHiddenStyles
									}
								/>
							</CommandItem>
						))}
					</CommandList>
				</Command>
			</SelectContent>
		</Select>
	);
}

interface MultiComboboxProps {
	options: ComboboxOption[];
	value?: string[];
	onValueChange?: (value: string[]) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyText?: string;
	disabled?: boolean;
	className?: string;
	maxDisplay?: number;
}

export function MultiCombobox({
	options,
	value = [],
	onValueChange,
	placeholder = "Select options...",
	searchPlaceholder = "Search...",
	emptyText = "No options found.",
	disabled = false,
	className,
	maxDisplay = 2,
}: MultiComboboxProps) {
	const [open, setOpen] = React.useState(false);
	const [searchValue, setSearchValue] = React.useState("");
	const inputRef = React.useRef<HTMLInputElement>(null);

	const filteredOptions = React.useMemo(() => {
		if (!searchValue) return options;
		return options.filter((option) =>
			option.label.toLowerCase().includes(searchValue.toLowerCase()),
		);
	}, [options, searchValue]);

	const selectedOptions = React.useMemo(
		() => options.filter((option) => value.includes(option.value)),
		[options, value],
	);

	const handleSelect = (selectedValue: string) => {
		const newValue = value.includes(selectedValue)
			? value.filter((v) => v !== selectedValue)
			: [...value, selectedValue];
		onValueChange?.(newValue);
	};

	const handleClear = (e: React.MouseEvent) => {
		e.stopPropagation();
		onValueChange?.([]);
	};

	const changeOpen = (newOpen: boolean) => {
		if (!newOpen) {
			setSearchValue("");
		} else {
			inputRef.current?.focus();
		}
		setOpen(newOpen);
	};

	const hasValue = selectedOptions.length > 0;
	const displayedOptions = selectedOptions.slice(0, maxDisplay);
	const remainingCount = selectedOptions.length - maxDisplay;

	return (
		<Select open={open} onOpenChange={changeOpen}>
			<SelectTrigger
				className={cn(
					className,
					hasValue && triggerWithValueStyles,
					hasValue && triggerWithTagsStyles,
				)}
				disabled={disabled}
			>
				{hasValue ? (
					<>
						<div className="flex items-center gap-1 overflow-hidden">
							{displayedOptions.map((opt) => (
								<Tag
									key={opt.value}
									size="small"
									color="gray"
									vibrance="subtle"
									showIcon={false}
								>
									{opt.label}
								</Tag>
							))}
							{remainingCount > 0 && (
								<Tag
									size="small"
									color="gray"
									vibrance="subtle"
									showIcon={false}
								>
									+{remainingCount}
								</Tag>
							)}
						</div>
						<button
							type="button"
							className={clearButtonStyles}
							onClick={handleClear}
							onPointerDown={(e) => e.stopPropagation()}
						>
							<X className="size-4" />
						</button>
					</>
				) : (
					<SelectValue placeholder={placeholder} />
				)}
			</SelectTrigger>
			<SelectContent className={selectContentStyles}>
				<Command className={commandStyles}>
					<CommandInput
						ref={inputRef}
						placeholder={searchPlaceholder}
						value={searchValue}
						onValueChange={setSearchValue}
					/>
					<CommandList>
						<CommandEmpty>{emptyText}</CommandEmpty>

						{filteredOptions.map((option) => {
							const isSelected = value.includes(option.value);
							return (
								<CommandItem
									key={option.value}
									value={option.value}
									data-state={isSelected ? "checked" : undefined}
									onSelect={handleSelect}
								>
									{option.label}
									<CheckIcon
										className={
											isSelected
												? checkIconVisibleStyles
												: checkIconHiddenStyles
										}
									/>
								</CommandItem>
							);
						})}
					</CommandList>
				</Command>
			</SelectContent>
		</Select>
	);
}
