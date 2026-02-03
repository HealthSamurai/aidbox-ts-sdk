import { Controls, Primary, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	AlertCircleIcon,
	CheckIcon,
	CircleXIcon,
	InfoIcon,
} from "lucide-react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "#shadcn/components/ui/alert";

const meta = {
	title: "Component/Alert",
	component: Alert,
	parameters: {
		docs: {
			page: () => (
				<>
					<Title />
					<Primary />
					<Controls />
				</>
			),
		},
	},
	argTypes: {
		variant: {
			control: "select",
			options: ["critical", "warning", "info", "neutral", "success"],
		},
		vivid: {
			control: "boolean",
		},
		icon: {
			control: "boolean",
		},
	},
	args: {
		variant: "info",
		vivid: false,
		icon: true,
	},
} satisfies Meta<typeof Alert>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
	tags: ["!dev"],
	render: ({ variant, vivid, icon = true }) => (
		<Alert variant={variant} vivid={vivid} icon={icon}>
			<InfoIcon />
			<AlertTitle>Alert Title</AlertTitle>
			<AlertDescription>
				This is an alert description with some helpful information.
			</AlertDescription>
		</Alert>
	),
} satisfies Story;

export const Demo = {
	tags: ["!autodocs"],
	render: () => (
		<div className="grid grid-cols-2 w-full max-w-4xl items-start gap-4">
			{/* Default variants */}
			<Alert variant="critical">
				<CircleXIcon />
				<AlertDescription>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
					eiusmod tempor incididunt ut labore et dolore magna aliqua. Learn more
				</AlertDescription>
			</Alert>
			<Alert variant="critical" vivid>
				<CircleXIcon />
				<AlertDescription>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
					eiusmod tempor incididunt ut labore et dolore magna aliqua. Learn more
				</AlertDescription>
			</Alert>

			<Alert variant="warning">
				<AlertCircleIcon />
				<AlertDescription>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
					eiusmod tempor incididunt ut labore et dolore magna aliqua. Learn more
				</AlertDescription>
			</Alert>
			<Alert variant="warning" vivid>
				<AlertCircleIcon />
				<AlertDescription>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
					eiusmod tempor incididunt ut labore et dolore magna aliqua. Learn more
				</AlertDescription>
			</Alert>

			<Alert variant="info">
				<InfoIcon />
				<AlertDescription>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
					eiusmod tempor incididunt ut labore et dolore magna aliqua. Learn more
				</AlertDescription>
			</Alert>
			<Alert variant="info" vivid>
				<InfoIcon />
				<AlertDescription>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
					eiusmod tempor incididunt ut labore et dolore magna aliqua. Learn more
				</AlertDescription>
			</Alert>

			<Alert variant="neutral">
				<InfoIcon />
				<AlertDescription>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
					eiusmod tempor incididunt ut labore et dolore magna aliqua. Learn more
				</AlertDescription>
			</Alert>
			<Alert variant="neutral" vivid>
				<InfoIcon />
				<AlertDescription>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
					eiusmod tempor incididunt ut labore et dolore magna aliqua. Learn more
				</AlertDescription>
			</Alert>

			<Alert variant="success">
				<CheckIcon />
				<AlertDescription>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
					eiusmod tempor incididunt ut labore et dolore magna aliqua. Learn more
				</AlertDescription>
			</Alert>
			<Alert variant="success" vivid>
				<CheckIcon />
				<AlertDescription>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
					eiusmod tempor incididunt ut labore et dolore magna aliqua. Learn more
				</AlertDescription>
			</Alert>
		</div>
	),
} satisfies Story;
