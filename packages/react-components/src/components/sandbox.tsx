import { Copy, Eye, EyeOff } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "../shadcn/components/ui/tooltip";
import { cn } from "../shadcn/lib/utils";

// Base sandbox styles
const baseSandboxStyles = cn(
	// Layout
	"flex",
	"flex-col",
	"items-start",
	"relative",
	"size-full",
	// Spacing
	"gap-2",
);

// Input container styles
const inputContainerStyles = cn(
	// Layout
	"flex",
	"items-center",
	"gap-2",
	"w-full",
	// Spacing
	"px-3",
	"py-2",
	// Background & Border
	"bg-bg-tertiary",
	"rounded",
	// Overflow
	"overflow-hidden",
);

// Content styles
const contentStyles = cn(
	// Layout
	"flex",
	"items-center",
	"gap-2",
	"flex-1",
	"min-w-0",
);

// Text styles
const textStyles = cn(
	// Typography
	"typo-body",
	"text-text-primary",
	// Layout
	"flex-1",
	"min-w-0",
	"truncate",
);

// Copy button styles
const copyButtonStyles = cn(
	// Layout
	"flex",
	"items-center",
	"justify-center",
	"shrink-0",
	// Sizing
	"size-4",
	// Cursor
	"cursor-pointer",
	// Hover
	"hover:opacity-80",
	"transition-opacity",
	"duration-200",
);

// Eye button styles
const eyeButtonStyles = cn(
	// Layout
	"flex",
	"items-center",
	"justify-center",
	"shrink-0",
	// Sizing
	"size-4",
	// Cursor
	"cursor-pointer",
	// Hover
	"hover:opacity-80",
	"transition-opacity",
	"duration-200",
);

export interface SandboxProps
	extends Omit<React.ComponentProps<"div">, "children" | "onCopy"> {
	url: string;

	showCopy?: boolean;

	showEye?: boolean;

	copyIcon?: React.ReactNode;

	tooltipText?: string;

	showToast?: boolean;

	onCopy?: (text: string) => void;
}

function Sandbox({
	url,
	showCopy = true,
	showEye = true,
	copyIcon = <Copy />,
	tooltipText = "Copy URL",
	showToast = true,
	onCopy,
	className,
	...props
}: SandboxProps) {
	const [isVisible, setIsVisible] = useState(true);

	return (
		<>
			<div
				data-slot="sandbox"
				className={cn(baseSandboxStyles, className)}
				{...props}
			>
				<div className={inputContainerStyles}>
					<div className={contentStyles}>
						<span className={textStyles}>
							{isVisible ? url : "•".repeat(url.length)}
						</span>
					</div>
					{showEye && (
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									className={eyeButtonStyles}
									onClick={() => setIsVisible(!isVisible)}
								>
									{isVisible ? <Eye /> : <EyeOff />}
								</button>
							</TooltipTrigger>
							<TooltipContent>
								<p>{isVisible ? "Hide URL" : "Show URL"}</p>
							</TooltipContent>
						</Tooltip>
					)}
					{showCopy && (
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									className={copyButtonStyles}
									onClick={async () => {
										try {
											await navigator.clipboard.writeText(url);

											if (showToast) {
												toast("Copied", {
													description:
														url.length > 50 ? `${url.slice(0, 50)}...` : url,
													duration: 2000,
												});
											}

											onCopy?.(url);
										} catch (error) {
											console.error("Failed to copy to clipboard:", error);
										}
									}}
								>
									{copyIcon}
								</button>
							</TooltipTrigger>
							<TooltipContent>
								<p>{tooltipText}</p>
							</TooltipContent>
						</Tooltip>
					)}
				</div>
			</div>
		</>
	);
}

export { Sandbox };
