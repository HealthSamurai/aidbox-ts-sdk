import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "#shadcn/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#shadcn/components/ui/dialog";
import { Input } from "#shadcn/components/ui/input";
import { Label } from "#shadcn/components/ui/label";

const meta = {
	title: "Component/Dialog",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<Dialog>
			<form>
				<DialogTrigger asChild>
					<Button variant="secondary">Open Dialog</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Edit profile</DialogTitle>
						<DialogDescription>
							Make changes to your profile here. Click save when you&apos;re
							done.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4">
						<div className="grid gap-3">
							<Label htmlFor="name-1">Name</Label>
							<Input id="name-1" name="name" defaultValue="Pedro Duarte" />
						</div>
						<div className="grid gap-3">
							<Label htmlFor="username-1">Username</Label>
							<Input id="username-1" name="username" defaultValue="@peduarte" />
						</div>
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button variant="secondary">Cancel</Button>
						</DialogClose>
						<Button type="submit">Save changes</Button>
					</DialogFooter>
				</DialogContent>
			</form>
		</Dialog>
	),
} satisfies Story;
