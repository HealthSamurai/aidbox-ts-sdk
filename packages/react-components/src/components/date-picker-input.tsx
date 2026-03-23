import { CalendarIcon } from "lucide-react";
import * as React from "react";
import { Button } from "#shadcn/components/ui/button";
import { Calendar } from "#shadcn/components/ui/calendar";
import { Input } from "#shadcn/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#shadcn/components/ui/popover";
import { cn } from "#shadcn/lib/utils";

function formatDate(date: Date | undefined): string {
	if (!date) return "";
	const d = date.getDate().toString().padStart(2, "0");
	const m = (date.getMonth() + 1).toString().padStart(2, "0");
	const y = date.getFullYear();
	return `${d}.${m}.${y}`;
}

function parseDate(value: string): Date | undefined {
	if (!value) return undefined;
	const parts = value.split(".");
	if (parts.length === 3) {
		const [d, m, y] = parts;
		const date = new Date(`${y}-${m}-${d}`);
		if (!Number.isNaN(date.getTime())) return date;
	}
	const date = new Date(value);
	if (!Number.isNaN(date.getTime())) return date;
	return undefined;
}

interface DatePickerInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
}

function DatePickerInput({
	value,
	onChange,
	placeholder = "dd.mm.yyyy",
	className,
	disabled,
}: DatePickerInputProps) {
	const [open, setOpen] = React.useState(false);
	const selectedDate = parseDate(value);
	const [month, setMonth] = React.useState<Date>(
		selectedDate ?? new Date(),
	);

	return (
		<div className={cn("relative", className)}>
			<Input
				type="text"
				placeholder={placeholder}
				value={value}
				disabled={disabled}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "ArrowDown") {
						e.preventDefault();
						setOpen(true);
					}
				}}
				rightSlot={
					<Popover open={open} onOpenChange={setOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="ghost"
								size="small"
								className="p-0 size-5"
								aria-label="Select date"
								disabled={disabled}
								onClick={(e) => {
									e.preventDefault();
									setOpen((o) => !o);
								}}
							>
								<CalendarIcon className="size-3.5" />
							</Button>
						</PopoverTrigger>
						<PopoverContent
							className="w-auto p-0"
							align="end"
							sideOffset={10}
						>
							<Calendar
								mode="single"
								selected={selectedDate}
								month={month}
								onMonthChange={(m) => setMonth(m)}
								onSelect={(date) => {
									onChange(formatDate(date));
									if (date) setMonth(date);
									setOpen(false);
								}}
							/>
						</PopoverContent>
					</Popover>
				}
			/>
		</div>
	);
}

export { DatePickerInput, type DatePickerInputProps };
