import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { cn } from "#shadcn/lib/utils.js";
import { Button } from "../shadcn/components/ui/button";
import { Calendar } from "../shadcn/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "../shadcn/components/ui/popover";

export type DatePickerProps = {
	value: Date | undefined;
	onDateChange?: (value?: Date) => void;
	formatDate?: (value: Date) => string;
};

export function DatePicker(props: DatePickerProps) {
	const id = useId();
	const [open, setOpen] = useState(false);

	const formatDate = useCallback(
		(date: Date) =>
			props.formatDate ? props.formatDate(date) : format(date, "MM/dd/yyyy"),
		[props.formatDate],
	);

	const onSelect = useCallback(
		(value: Date | undefined) => {
			setOpen(false);
			props.onDateChange?.(value);
		},
		[props.onDateChange],
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					id={id}
					variant={"ghost"}
					className="group bg-background hover:bg-background w-full justify-start px-3 font-normal"
				>
					<CalendarIcon
						size={16}
						className="text-muted-foreground/80 group-hover:text-foreground shrink-0 transition-colors"
						aria-hidden="true"
					/>
					<span
						className={cn("truncate", !props.value && "text-muted-foreground")}
					>
						{props.value ? formatDate(props.value) : "Pick a date"}
					</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-2" align="start">
				<Calendar
					mode="single"
					selected={props.value}
					onSelect={onSelect}
					captionLayout="dropdown"
				/>
			</PopoverContent>
		</Popover>
	);
}
