import type { ReactNode } from "react";
import { cn } from "#shadcn/lib/utils.js";

// Container: h-24px, p-2px, rounded-full, bg-secondary_inverse
const containerClass = cn(
	"inline-flex",
	"h-6",
	"p-0.5",
	"bg-bg-secondary_inverse",
	"rounded-full",
	"border",
	"border-transparent",
	"outline-none",
	"transition-all",
	"focus-visible:border-border-link",
	"focus-visible:ring-4",
	"focus-visible:ring-ring-blue",
);

// Item: px-8px py-2px, rounded-full (16px), typo-body
const itemBaseClass = cn(
	"flex",
	"items-center",
	"justify-center",
	"px-2",
	"py-0.5",
	"typo-body",
	"leading-4",
	"cursor-pointer",
	"rounded-full",
	"select-none",
	"transition-colors",
);

const itemInactiveClass = "text-text-quternary_on-brand";
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
	return (
		<div className={containerClass}>
			{items.map((item) => (
				<button
					type="button"
					key={item.value}
					className={cn(
						itemBaseClass,
						item.value === value ? itemActiveClass : itemInactiveClass,
					)}
					onClick={() => onValueChange(item.value)}
				>
					{item.label}
				</button>
			))}
		</div>
	);
}

export { SegmentControl };
export type { SegmentControlProps };
