import { Controls, Primary, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	Calculator,
	Calendar,
	CreditCard,
	Settings,
	Smile,
	User,
} from "lucide-react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "#shadcn/components/ui/command";

interface CommandWrapperProps {
	leftIcons?: boolean;
	rightIcons?: boolean;
	groups?: boolean;
}

function CommandWrapper({
	leftIcons = true,
	rightIcons = true,
	groups = true,
}: CommandWrapperProps) {
	const items1 = [
		{ icon: Calendar, label: "Calendar", shortcut: "⌘C" },
		{ icon: Smile, label: "Search Emoji", shortcut: "⌘E" },
		{ icon: Calculator, label: "Calculator", shortcut: "⌘K" },
	];

	const items2 = [
		{ icon: User, label: "Profile", shortcut: "⌘P" },
		{ icon: CreditCard, label: "Billing", shortcut: "⌘B" },
		{ icon: Settings, label: "Settings", shortcut: "⌘S" },
	];

	const renderItem = (item: (typeof items1)[0]) => (
		<CommandItem key={item.label}>
			{leftIcons && <item.icon />}
			<span>{item.label}</span>
			{rightIcons && <CommandShortcut>{item.shortcut}</CommandShortcut>}
		</CommandItem>
	);

	return (
		<Command className="w-[450px] rounded-lg border">
			<CommandInput placeholder="Type a command or search..." />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				{groups ? (
					<>
						<CommandGroup heading="Suggestions">
							{items1.map(renderItem)}
						</CommandGroup>
						<CommandSeparator />
						<CommandGroup heading="Settings">
							{items2.map(renderItem)}
						</CommandGroup>
					</>
				) : (
					[...items1, ...items2].map(renderItem)
				)}
			</CommandList>
		</Command>
	);
}

const meta = {
	title: "Component/Command",
	component: CommandWrapper,
	parameters: {
		layout: "centered",
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
		leftIcons: {
			control: "boolean",
		},
		rightIcons: {
			control: "boolean",
		},
		groups: {
			control: "boolean",
		},
	},
	args: {
		leftIcons: true,
		rightIcons: true,
		groups: true,
	},
} satisfies Meta<typeof CommandWrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
	tags: ["!dev"],
	render: ({ leftIcons = true, rightIcons = true, groups = true }) => (
		<CommandWrapper
			leftIcons={leftIcons}
			rightIcons={rightIcons}
			groups={groups}
		/>
	),
} satisfies Story;

export const Demo = {
	tags: ["!autodocs"],
	render: () => (
		<div className="space-y-8">
			{/* Full */}
			<div>
				<h3 className="typo-label mb-4">With icons and groups</h3>
				<Command className="w-[450px] rounded-lg border">
					<CommandInput placeholder="Type a command or search..." />
					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>
						<CommandGroup heading="Suggestions">
							<CommandItem>
								<Calendar />
								<span>Calendar</span>
								<CommandShortcut>⌘C</CommandShortcut>
							</CommandItem>
							<CommandItem>
								<Smile />
								<span>Search Emoji</span>
								<CommandShortcut>⌘E</CommandShortcut>
							</CommandItem>
						</CommandGroup>
						<CommandSeparator />
						<CommandGroup heading="Settings">
							<CommandItem>
								<User />
								<span>Profile</span>
								<CommandShortcut>⌘P</CommandShortcut>
							</CommandItem>
							<CommandItem>
								<Settings />
								<span>Settings</span>
								<CommandShortcut>⌘S</CommandShortcut>
							</CommandItem>
						</CommandGroup>
					</CommandList>
				</Command>
			</div>

			{/* Without groups */}
			<div>
				<h3 className="typo-label mb-4">Without groups</h3>
				<Command className="w-[450px] rounded-lg border">
					<CommandInput placeholder="Type a command or search..." />
					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>
						<CommandItem>
							<Calendar />
							<span>Calendar</span>
						</CommandItem>
						<CommandItem>
							<User />
							<span>Profile</span>
						</CommandItem>
						<CommandItem>
							<Settings />
							<span>Settings</span>
						</CommandItem>
					</CommandList>
				</Command>
			</div>

			{/* Without icons */}
			<div>
				<h3 className="typo-label mb-4">Without icons</h3>
				<Command className="w-[450px] rounded-lg border">
					<CommandInput placeholder="Type a command or search..." />
					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>
						<CommandGroup heading="Actions">
							<CommandItem>
								<span>Calendar</span>
							</CommandItem>
							<CommandItem>
								<span>Profile</span>
							</CommandItem>
							<CommandItem>
								<span>Settings</span>
							</CommandItem>
						</CommandGroup>
					</CommandList>
				</Command>
			</div>
		</div>
	),
} satisfies Story;
