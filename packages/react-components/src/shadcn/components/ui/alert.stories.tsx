import { Controls, Primary, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	AlertCircleIcon,
	AlertTriangleIcon,
	CheckCircle2Icon,
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
			options: ["default", "info", "success", "warning", "danger"],
		},
		icon: {
			control: "boolean",
		},
	},
	args: {
		variant: "info",
		icon: true,
	},
} satisfies Meta<typeof Alert>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
	tags: ["!dev"],
	render: ({ variant, icon = true }) => (
		<Alert variant={variant} icon={icon}>
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
		<div className="grid w-full max-w-xl items-start gap-4">
			<Alert variant="danger">
				<AlertTriangleIcon />
				<AlertTitle>Danger Alert</AlertTitle>
				<AlertDescription>
					Something went wrong. Please try again.
				</AlertDescription>
			</Alert>
			<Alert variant="warning">
				<AlertCircleIcon />
				<AlertTitle>Warning Alert</AlertTitle>
				<AlertDescription>
					Please review your changes before proceeding.
				</AlertDescription>
			</Alert>
			<Alert variant="info">
				<InfoIcon />
				<AlertTitle>Info Alert</AlertTitle>
				<AlertDescription>
					Here is some useful information for you.
				</AlertDescription>
			</Alert>
			<Alert variant="success">
				<CheckCircle2Icon />
				<AlertTitle>Success Alert</AlertTitle>
				<AlertDescription>
					Your changes have been saved successfully.
				</AlertDescription>
			</Alert>
			<Alert variant="info" icon={false}>
				<InfoIcon />
				<AlertTitle>Alert without icon</AlertTitle>
				<AlertDescription>
					This alert has icon=false so the icon is hidden.
				</AlertDescription>
			</Alert>
		</div>
	),
} satisfies Story;
