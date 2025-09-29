import { Check, Copy } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#shadcn/components/ui/tooltip";

interface CopyIconProps {
	text: string;
	showTooltip?: boolean;
	tooltipText?: string;
	showToast?: boolean;
	onCopy?: (text: string) => void;
}

function CopyIcon({
	text,
	showTooltip = true,
	tooltipText = "Copy",
	showToast = true,
	onCopy,
	...props
}: CopyIconProps) {
	const [isActive, setIsActive] = React.useState(false);

	async function handleClick() {
		try {
			await navigator.clipboard.writeText(text);
			setIsActive(true);

			if (showToast) {
				const truncatedText =
					text.length > 30 ? `${text.slice(0, 30)}...` : text;
				toast(
					<div className="flex flex-col gap-1">
						<span className="typo-body">Successfully copied</span>
						<span className="typo-code text-text-secondary">
							{truncatedText}
						</span>
					</div>,
					{
						duration: 2000,
					},
				);
			}

			onCopy?.(text);

			setTimeout(() => {
				setIsActive(false);
			}, 1000);
		} catch (error) {
			console.error("Failed to copy to clipboard:", error);
		}
	}

	const button = (
		<button
			{...props}
			type="button"
			onClick={handleClick}
			style={{ cursor: "pointer" }}
		>
			{isActive ? <Check /> : <Copy />}
		</button>
	);

	if (!showTooltip) {
		return button;
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>{button}</TooltipTrigger>
			<TooltipContent>
				<p>{tooltipText}</p>
			</TooltipContent>
		</Tooltip>
	);
}

export { CopyIcon };
