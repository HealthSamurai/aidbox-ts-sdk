import { AlignLeft, Copy, Download } from "lucide-react";
import type React from "react";
import { cn } from "#shadcn/lib/utils";
import { IconButton } from "./icon-button";
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
					<IconButton icon={<Copy />} aria-label="Copy" onClick={onCopyClick} />
				)}
				{showAlignLeft && (
					<IconButton
						icon={<AlignLeft />}
						aria-label="Align left"
						onClick={onAlignLeftClick}
					/>
				)}
				{showDownload && (
					<IconButton
						icon={<Download />}
						aria-label="Download"
						onClick={onDownloadClick}
					/>
				)}
			</div>
		</div>
	);
}

export { Toolbar };
