import { createContext, type ReactNode, useContext } from "react";
import { cn } from "#shadcn/lib/utils.js";

interface SegmentControlContextType {
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	name?: string;
}

const SegmentControlContext = createContext<SegmentControlContextType>({});

export interface SegmentControlProps {
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	name?: string;
}

interface SegmentControlItemProps {
	children: ReactNode;
	value: string;
}

// Styles
const segmentControlItemClass = cn(
	"flex",
	"items-center",
	"justify-center",
	"px-2",
	"py-0.5",
	"text-sm",
	"cursor-pointer",
	"rounded-2xl",
	"text-white/80",
	"peer-checked:bg-bg-primary",
	"peer-checked:text-text-primary",
	"select-none",
);

const segmentControlContainerClass = cn(
	"inline-flex",
	"bg-bg-dark_tertiary",
	"p-0.5",
	"gap-0",
	"rounded-full",
);

function SegmentControlItem({ children, value }: SegmentControlItemProps) {
	const { defaultValue, onValueChange, name } = useContext(
		SegmentControlContext,
	);

	return (
		<div className="relative">
			<input
				type="radio"
				id={`${name}-${value}`}
				name={name}
				value={value}
				defaultChecked={value === defaultValue}
				onChange={(e) => onValueChange?.(e.target.value)}
				className="sr-only peer"
			/>
			<label
				htmlFor={`${name}-${value}`}
				className={segmentControlItemClass}
				onClick={() => onValueChange?.(value)}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onValueChange?.(value);
					}
				}}
			>
				{children}
			</label>
		</div>
	);
}

function SegmentControl({
	children,
	defaultValue,
	onValueChange,
	name,
}: SegmentControlProps & { children?: ReactNode }) {
	const contextValue: SegmentControlContextType = {
		...(defaultValue !== undefined && { defaultValue }),
		...(onValueChange !== undefined && { onValueChange }),
		name: name || "react-components-segment-control",
	};

	return (
		<SegmentControlContext.Provider value={contextValue}>
			<div className={segmentControlContainerClass}>{children}</div>
		</SegmentControlContext.Provider>
	);
}

export { SegmentControl, SegmentControlItem };
