import { Copy } from "lucide-react";
import type React from "react";
import { toast } from "sonner";
import { Toaster } from "../shadcn/components/ui/sonner";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "../shadcn/components/ui/tooltip";
import { cn } from "../shadcn/lib/utils";

const baseSandboxStyles = cn(
	"flex",
	"flex-col",
	"items-start",
	"relative",
	"size-full",
	"gap-2",
);

const inputContainerStyles = cn(
	"flex",
	"items-center",
	"gap-2",
	"w-full",
	"px-3",
	"py-2",
	"bg-bg-tertiary",
	"rounded",
	"overflow-hidden",
);

const contentStyles = cn("flex", "items-center", "gap-2", "flex-1", "min-w-0");

const textStyles = cn(
	"typo-body",
	"text-text-primary",
	"flex-1",
	"min-w-0",
	"truncate",
);

const copyButtonStyles = cn(
	"flex",
	"items-center",
	"justify-center",
	"shrink-0",
	"size-4",
	"hover:opacity-80",
	"transition-opacity",
	"duration-200",
);

export type SandboxProps = {
	url: string;
	showCopy?: boolean;
	copyIcon?: React.ReactNode;
	tooltipText?: string;
	showToast?: boolean;
	onCopy?: (text: string) => void;
} & Omit<React.ComponentProps<"div">, "children" | "onCopy">;

export function Sandbox({
	url,
	showCopy = true,
	copyIcon = <Copy />,
	tooltipText = "Copy URL",
	showToast = true,
	onCopy,
	className,
	...props
}: SandboxProps) {
	return (
		<>
			<div
				data-slot="sandbox"
				className={cn(baseSandboxStyles, className)}
				{...props}
			>
				<div className={inputContainerStyles}>
					<div className={contentStyles}>
						<span className={textStyles}>{url}</span>
					</div>
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
			<Toaster position="top-center" />
		</>
	);
}
