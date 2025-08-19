import { Check, Copy } from "lucide-react";
import * as React from "react";

interface CopyIconProps {
	text: string;
}

function CopyIcon({ text }: CopyIconProps) {
	const [isActive, setIsActive] = React.useState(false);

	async function handleClick() {
		try {
			await navigator.clipboard.writeText(text);
			setIsActive(true);
			setTimeout(() => {
				setIsActive(false);
			}, 1000);
		} catch (error) {
			console.error("Failed to copy to clipboard:", error);
		}
	}

	return (
		<button type="button" onClick={handleClick} style={{ cursor: "pointer" }}>
			{isActive ? <Check /> : <Copy />}
		</button>
	);
}

export { CopyIcon };
