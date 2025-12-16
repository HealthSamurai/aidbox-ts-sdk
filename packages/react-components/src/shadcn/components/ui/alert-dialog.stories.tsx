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

const meta = {
	title: "Component/Alert dialog",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="secondary">Show Dialog</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription>
					This action cannot be undone. This will permanently delete your
					account and remove your data from our servers.
				</AlertDialogDescription>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction>Continue</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	),
} satisfies Story;

export const WithDangerAction = {
	render: () => (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="secondary">Delete Account</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete your account?</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription>
					This action is permanent. All your data will be removed and cannot be
					recovered.
				</AlertDialogDescription>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<div className="flex gap-2">
						<AlertDialogAction variant="secondary" danger>
							Delete
						</AlertDialogAction>
						<AlertDialogAction danger>Delete</AlertDialogAction>
					</div>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	),
} satisfies Story;

export const WithCustomButtons = {
	render: () => (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="secondary">Unsaved Changes</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogDescription>
					You have unsaved changes. Do you want to save before switching?
				</AlertDialogDescription>
				<AlertDialogFooter>
					<AlertDialogCancel>Don&apos;t Save</AlertDialogCancel>
					<AlertDialogAction>Save Changes</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	),
} satisfies Story;
