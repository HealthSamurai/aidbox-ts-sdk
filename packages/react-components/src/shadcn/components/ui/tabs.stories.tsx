import type { Meta, StoryObj } from "@storybook/react-vite";
import { action } from "storybook/internal/actions";
import { Button } from "#shadcn/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#shadcn/components/ui/card";
import { Input } from "#shadcn/components/ui/input";
import { Label } from "#shadcn/components/ui/label";
import {
	Tabs,
	TabsAddButton,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "#shadcn/components/ui/tabs";

const meta = {
	title: "Component/Tabs",
	argTypes: {
		variant: {
			options: ["button", "dashed"],
			control: { type: "select" },
		},
	},
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: (props) => (
		<div className="flex w-full max-w-sm flex-col gap-6">
			<Tabs defaultValue="account" {...props}>
				<TabsList>
					<TabsTrigger value="account">Account</TabsTrigger>
					<TabsTrigger value="password">Password</TabsTrigger>
				</TabsList>
				<TabsContent value="account">
					<Card>
						<CardHeader>
							<CardTitle>Account</CardTitle>
							<CardDescription>
								Make changes to your account here. Click save when you&apos;re
								done.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-6">
							<div className="grid gap-3">
								<Label htmlFor="tabs-demo-name">Name</Label>
								<Input id="tabs-demo-name" defaultValue="Pedro Duarte" />
							</div>
							<div className="grid gap-3">
								<Label htmlFor="tabs-demo-username">Username</Label>
								<Input id="tabs-demo-username" defaultValue="@peduarte" />
							</div>
						</CardContent>
						<CardFooter>
							<Button>Save changes</Button>
						</CardFooter>
					</Card>
				</TabsContent>
				<TabsContent value="password">
					<Card>
						<CardHeader>
							<CardTitle>Password</CardTitle>
							<CardDescription>
								Change your password here. After saving, you&apos;ll be logged
								out.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-6">
							<div className="grid gap-3">
								<Label htmlFor="tabs-demo-current">Current password</Label>
								<Input id="tabs-demo-current" type="password" />
							</div>
							<div className="grid gap-3">
								<Label htmlFor="tabs-demo-new">New password</Label>
								<Input id="tabs-demo-new" type="password" />
							</div>
						</CardContent>
						<CardFooter>
							<Button>Save password</Button>
						</CardFooter>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	),
} satisfies Story;

function BrowserTabOnClose(value: string) {
	action("onClose")(value);
}

function BrowserTabOnClick() {
	action("onClick")();
}

function BrowserTabOnAdd() {
	action("onAdd")();
}

export const Browser = {
	parameters: {
		layout: "fullscreen",
	},
	render: () => (
		<Tabs defaultValue="first" variant="browser">
			<TabsList>
				<TabsTrigger
					value="first"
					onClick={BrowserTabOnClick}
					onClose={BrowserTabOnClose}
				>
					<span className="flex items-center gap-1">
						<span className="text-utility-green">GET</span>
						<span>/fhir/Patient</span>
					</span>
				</TabsTrigger>
				<TabsTrigger
					value="second"
					onClick={BrowserTabOnClick}
					onClose={BrowserTabOnClose}
				>
					<span className="flex items-center gap-1">
						<span className="text-utility-yellow">POST</span>
						<span>/fhir</span>
					</span>
				</TabsTrigger>
				<TabsTrigger
					value="third"
					onClick={BrowserTabOnClick}
					onClose={BrowserTabOnClose}
				>
					<span className="flex items-center gap-1">
						<span className="text-utility-yellow">POST</span>
						<span>/$graphql</span>
					</span>
				</TabsTrigger>
			</TabsList>
			<TabsAddButton onClick={BrowserTabOnAdd} />
		</Tabs>
	),
} satisfies Story;
