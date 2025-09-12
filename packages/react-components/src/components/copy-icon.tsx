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
}

function CopyIcon({ text }: CopyIconProps) {
	const [isActive, setIsActive] = React.useState(false);

	async function handleClick() {
		try {
			await navigator.clipboard.writeText(text);
			setIsActive(true);
			const truncatedText = text.length > 30 ? `${text.slice(0, 30)}...` : text;

			toast(
				<div className="flex flex-col gap-1">
					<span className="typo-body">Request successfully copied</span>
					<span className="typo-code text-text-secondary">{truncatedText}</span>
				</div>,
				{
					duration: 2000,
				},
			);
			setTimeout(() => {
				setIsActive(false);
			}, 1000);
		} catch (error) {
			console.error("Failed to copy to clipboard:", error);
		}
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					onClick={handleClick}
					style={{ cursor: "pointer" }}
				>
					{isActive ? <Check /> : <Copy />}
				</button>
			</TooltipTrigger>
			<TooltipContent>
				<p>Copy request</p>
			</TooltipContent>
		</Tooltip>
	);
}

export { CopyIcon };
