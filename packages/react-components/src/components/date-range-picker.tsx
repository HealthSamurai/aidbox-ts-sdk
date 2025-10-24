import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useCallback, useId, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "#shadcn/components/ui/button.js";
import { Calendar } from "#shadcn/components/ui/calendar.js";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#shadcn/components/ui/popover.js";
import { cn } from "#shadcn/lib/utils.js";

type DateRangePickerProps = {
	value?: { from?: Date; to?: Date } | undefined;
	onDateRangeChange?: (value: { from?: Date; to?: Date } | undefined) => void;
	fromPlaceholder?: string | undefined;
	toPlaceholder?: string | undefined;
	formatDate?: (value: Date) => string;
};

export function DateRangePicker(props: DateRangePickerProps) {
	const id = useId();
	const [open, setOpen] = useState(false);

	const formatDate = useCallback(
		(date: Date) =>
			props.formatDate ? props.formatDate(date) : format(date, "MM/dd/yyyy"),
		[props.formatDate],
	);

	const onSelect = useCallback(
		(range: DateRange | undefined) => {
			if (!range) {
				props.onDateRangeChange?.(undefined);
			} else {
				const result: { from?: Date; to?: Date } = {};
				if (range.from) result.from = range.from;
				if (range.to) result.to = range.to;
				props.onDateRangeChange?.(result);
			}
		},
		[props.onDateRangeChange],
	);

	// Convert to DateRange type for Calendar
	let selectedRange: DateRange | undefined;
	if (props.value?.from) {
		selectedRange = { from: props.value.from };
		if (props.value.to) selectedRange.to = props.value.to;
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					id={id}
					variant="ghost"
					className="group bg-background hover:bg-background w-full justify-start px-3 font-normal"
				>
					<CalendarIcon
						size={16}
						className="text-muted-foreground/80 group-hover:text-foreground shrink-0 transition-colors"
						aria-hidden="true"
					/>
					<span
						className={cn(
							"truncate",
							!props.value?.from && "text-muted-foreground",
						)}
					>
						{props.value?.from ? (
							props.value.to ? (
								<>
									{formatDate(props.value.from)} - {formatDate(props.value.to)}
								</>
							) : (
								formatDate(props.value.from)
							)
						) : (
							"Pick a date range"
						)}
					</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-2" align="start">
				<Calendar mode="range" selected={selectedRange} onSelect={onSelect} />
			</PopoverContent>
		</Popover>
	);
}
