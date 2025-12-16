import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	AlertCircleIcon,
	AlertTriangleIcon,
	CheckCircle2Icon,
	InfoIcon,
	PopcornIcon,
} from "lucide-react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "#shadcn/components/ui/alert";

const meta = {
	title: "Component/Alert",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<div className="grid w-full max-w-xl items-start gap-4">
			<Alert variant="destructive">
				<AlertTriangleIcon />
				<AlertDescription>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
					eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
					minim veniam, quis nostrud exercitation ullamco laboris nisi ut
					aliquip ex ea commodo consequat.{" "}
					<a href="https://example.com" className="underline">
						Learn more
					</a>
				</AlertDescription>
			</Alert>
			<Alert variant="warning">
				<AlertCircleIcon />
				<AlertDescription>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
					eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
					minim veniam, quis nostrud exercitation ullamco laboris nisi ut
					aliquip ex ea commodo consequat.{" "}
					<a href="https://example.com" className="underline">
						Learn more
					</a>
				</AlertDescription>
			</Alert>
			<Alert variant="info">
				<InfoIcon />
				<AlertDescription>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
					eiusmod tempor incididunt ut labore et dolore magna aliqua.{" "}
					<a href="https://example.com" className="underline">
						Learn more
					</a>
				</AlertDescription>
			</Alert>
			<Alert>
				<CheckCircle2Icon />
				<AlertTitle>Success! Your changes have been saved</AlertTitle>
				<AlertDescription>
					This is an alert with icon, title and description.
				</AlertDescription>
			</Alert>
			<Alert>
				<PopcornIcon />
				<AlertTitle>
					This Alert has a title and an icon. No description.
				</AlertTitle>
			</Alert>
			<Alert variant="destructive">
				<AlertCircleIcon />
				<AlertTitle>Unable to process your payment.</AlertTitle>
				<AlertDescription>
					<p>Please verify your billing information and try again.</p>
					<ul className="list-inside list-disc text-sm">
						<li>Check your card details</li>
						<li>Ensure sufficient funds</li>
						<li>Verify billing address</li>
					</ul>
				</AlertDescription>
			</Alert>
		</div>
	),
} satisfies Story;
