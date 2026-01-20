import { Controls, Primary, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "#shadcn/components/ui/alert-dialog";
import { Button } from "#shadcn/components/ui/button";

interface AlertDialogWrapperProps {
	variant?: "default" | "danger";
	buttons?: 1 | 2;
	scrollableContent?: boolean;
}

function AlertDialogWrapper({
	variant = "default",
	buttons = 1,
	scrollableContent = false,
}: AlertDialogWrapperProps) {
	const actionProps = variant === "danger" ? { danger: true } : {};

	const longContent = (
		<>
			{Array.from({ length: 20 }, (_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static content
				<p key={i}>
					{i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
					do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
					ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
					aliquip ex ea commodo consequat. Duis aute irure dolor in
					reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
					pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
					culpa qui officia deserunt mollit anim id est laborum.
				</p>
			))}
		</>
	);

	return (
		<AlertDialog defaultOpen>
			<AlertDialogTrigger asChild>
				<Button variant="secondary">Show Dialog</Button>
			</AlertDialogTrigger>
			<AlertDialogContent
				className={
					scrollableContent ? "h-[calc(100vh-44px)] flex flex-col" : undefined
				}
			>
				<AlertDialogHeader>
					<AlertDialogTitle>Dialog Title</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription
					className={scrollableContent ? "flex-1 overflow-y-auto" : undefined}
				>
					{scrollableContent ? (
						<div className="space-y-4">{longContent}</div>
					) : (
						"This is a dialog description. It provides context about the action."
					)}
				</AlertDialogDescription>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<div className="flex gap-3">
						{buttons === 2 && (
							<AlertDialogAction variant="secondary" {...actionProps}>
								Secondary
							</AlertDialogAction>
						)}
						<AlertDialogAction {...actionProps}>
							{variant === "danger" ? "Delete" : "Confirm"}
						</AlertDialogAction>
					</div>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

const meta = {
	title: "Component/Alert dialog",
	component: AlertDialogWrapper,
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
			options: ["default", "danger"],
		},
		buttons: {
			control: "select",
			options: [1, 2],
		},
		scrollableContent: {
			control: "boolean",
		},
	},
	args: {
		variant: "default",
		buttons: 1,
		scrollableContent: false,
	},
} satisfies Meta<typeof AlertDialogWrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
	tags: ["!dev"],
	render: ({ variant = "default", buttons = 1, scrollableContent = false }) => (
		<AlertDialogWrapper
			variant={variant}
			buttons={buttons}
			scrollableContent={scrollableContent}
		/>
	),
} satisfies Story;

export const Demo = {
	tags: ["!autodocs"],
	render: () => (
		<div className="flex flex-wrap gap-4">
			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant="secondary">Default</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirm Action</AlertDialogTitle>
					</AlertDialogHeader>
					<AlertDialogDescription>
						Are you sure you want to continue?
					</AlertDialogDescription>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<div className="flex gap-3">
							<AlertDialogAction>Confirm</AlertDialogAction>
						</div>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant="secondary">Default (2 buttons)</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
					</AlertDialogHeader>
					<AlertDialogDescription>
						You have unsaved changes. Do you want to save before leaving?
					</AlertDialogDescription>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<div className="flex gap-3">
							<AlertDialogAction variant="secondary">
								Don&apos;t Save
							</AlertDialogAction>
							<AlertDialogAction>Save</AlertDialogAction>
						</div>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant="secondary">Danger</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Account</AlertDialogTitle>
					</AlertDialogHeader>
					<AlertDialogDescription>
						This action cannot be undone. All your data will be permanently
						deleted.
					</AlertDialogDescription>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<div className="flex gap-3">
							<AlertDialogAction danger>Delete</AlertDialogAction>
						</div>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant="secondary">Scrollable Content</Button>
				</AlertDialogTrigger>
				<AlertDialogContent className="h-[calc(100vh-44px)] flex flex-col">
					<AlertDialogHeader>
						<AlertDialogTitle>Terms and Conditions</AlertDialogTitle>
					</AlertDialogHeader>
					<AlertDialogDescription className="flex-1 overflow-y-auto">
						<div className="space-y-4">
							{Array.from({ length: 20 }, (_, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: static content
								<p key={i}>
									{i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing
									elit. Sed do eiusmod tempor incididunt ut labore et dolore
									magna aliqua. Ut enim ad minim veniam, quis nostrud
									exercitation ullamco laboris nisi ut aliquip ex ea commodo
									consequat. Duis aute irure dolor in reprehenderit in voluptate
									velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
									sint occaecat cupidatat non proident, sunt in culpa qui
									officia deserunt mollit anim id est laborum.
								</p>
							))}
						</div>
					</AlertDialogDescription>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<div className="flex gap-3">
							<AlertDialogAction>Accept</AlertDialogAction>
						</div>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	),
} satisfies Story;
