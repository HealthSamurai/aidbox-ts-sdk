import { AlignLeft, Copy, Download } from "lucide-react";
import type React from "react";
import { cn } from "#shadcn/lib/utils";
import { SegmentControl } from "./segment-control";

// Styles
const toolbarContainerStyles = cn(
	// Layout
	"inline-flex",
	"items-center",
	"gap-2",
	// Spacing
	"pl-[9px]",
	"pr-2",
	"py-2",
	// Background
	"bg-bg-primary",
	// Border
	"border",
	"border-border-secondary",
	// Shape
	"rounded-full",
	// Shadow
	"toolbar-shadow",
);

const iconsContainerStyles = cn(
	// Layout
	"flex",
	"items-center",
	"gap-0",
);

const iconButtonStyles = cn(
	// Layout
	"flex",
	"items-center",
	"justify-center",
	// Spacing
	"p-1",
	// Size
	"size-8",
	// Shape
	"rounded",
	// Interaction
	"cursor-pointer",
	"transition-colors",
	"duration-200",
	// Colors
	"text-text-tertiary",
	"hover:text-text-secondary",
	"hover:bg-bg-secondary",
	// SVG
	"[&>svg]:size-4",
	"[&>svg]:pointer-events-none",
	"[&>svg]:shrink-0",
);

export interface ToolbarProps
	extends Omit<React.ComponentProps<"div">, "children"> {
	segmentControlValue?: string;
	onSegmentControlChange?: (value: string) => void;
	segmentControlItems?: { value: string; label: React.ReactNode }[];
	onCopyClick?: () => void;
	onAlignLeftClick?: () => void;
	onDownloadClick?: () => void;
	showCopy?: boolean;
	showAlignLeft?: boolean;
	showDownload?: boolean;
}

function Toolbar({
	segmentControlValue = "json",
	onSegmentControlChange,
	segmentControlItems = [
		{ value: "json", label: "JSON" },
		{ value: "yaml", label: "YAML" },
	],
	onCopyClick,
	onAlignLeftClick,
	onDownloadClick,
	showCopy = true,
	showAlignLeft = true,
	showDownload = true,
	className,
	...props
}: ToolbarProps) {
	return (
		<div
			data-slot="toolbar"
			className={cn(toolbarContainerStyles, className)}
			{...props}
		>
			<SegmentControl
				value={segmentControlValue}
				onValueChange={onSegmentControlChange || (() => {})}
				items={segmentControlItems}
			/>
			<div className={iconsContainerStyles}>
				{showCopy && (
					<button
						type="button"
						className={iconButtonStyles}
						onClick={onCopyClick}
						aria-label="Copy"
					>
						<Copy />
					</button>
				)}
				{showAlignLeft && (
					<button
						type="button"
						className={iconButtonStyles}
						onClick={onAlignLeftClick}
						aria-label="Align left"
					>
						<AlignLeft />
					</button>
				)}
				{showDownload && (
					<button
						type="button"
						className={iconButtonStyles}
						onClick={onDownloadClick}
						aria-label="Download"
					>
						<Download />
					</button>
				)}
			</div>
		</div>
	);
}

export { Toolbar };
