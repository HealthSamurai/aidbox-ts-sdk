import type { ReactNode } from "react";
import { cn } from "#shadcn/lib/utils.js";

// Styles
const containerClass = cn(
	"inline-flex",
	"bg-bg-dark_tertiary",
	"p-0.5",
	"gap-0",
	"rounded-full",
);

const itemBaseClass = cn(
	"flex",
	"items-center",
	"justify-center",
	"px-2",
	"py-0.5",
	"text-sm",
	"cursor-pointer",
	"rounded-2xl",
	"select-none",
);

const itemInactiveClass = "text-white/80";
const itemActiveClass = "bg-bg-primary text-text-primary";

interface SegmentControlProps<T extends string> {
	value: T;
	onValueChange: (value: T) => void;
	items: { value: T; label: ReactNode }[];
}

function SegmentControl<T extends string>({
	value,
	onValueChange,
	items,
}: SegmentControlProps<T>) {
	const toggle = () => {
		const currentIndex = items.findIndex((item) => item.value === value);
		const nextIndex = (currentIndex + 1) % items.length;
		const nextItem = items[nextIndex];
		if (nextItem) {
			onValueChange(nextItem.value);
		}
	};

	return (
		<button type="button" className={containerClass} onClick={toggle}>
			{items.map((item) => (
				<span
					key={item.value}
					className={cn(
						itemBaseClass,
						item.value === value ? itemActiveClass : itemInactiveClass,
					)}
				>
					{item.label}
				</span>
			))}
		</button>
	);
}

export { SegmentControl };
export type { SegmentControlProps };
