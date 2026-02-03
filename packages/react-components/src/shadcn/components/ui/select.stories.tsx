import { Controls, Primary, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#shadcn/components/ui/select";

interface SelectWrapperProps {
	variant?: "default" | "compound";
	disabled?: boolean;
}

function SelectWrapper({
	variant = "default",
	disabled = false,
}: SelectWrapperProps) {
	return (
		<Select disabled={disabled}>
			<SelectTrigger className="w-[200px]" variant={variant}>
				<SelectValue placeholder="Select a fruit" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectItem value="apple">Apple</SelectItem>
					<SelectItem value="banana">Banana</SelectItem>
					<SelectItem value="blueberry">Blueberry</SelectItem>
					<SelectItem value="grapes">Grapes</SelectItem>
					<SelectItem value="pineapple">Pineapple</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

const meta = {
	title: "Component/Select",
	component: SelectWrapper,
	parameters: {
		layout: "centered",
		docs: {
			page: () => (
				<>
					<Title />
					<p className="sbdocs-p">
						Select is a dropdown component for choosing a single option. It is
						also used as the trigger/container in <strong>Combobox</strong> and{" "}
						<strong>MultiCombobox</strong> components.
					</p>
					<Primary />
					<Controls />
				</>
			),
		},
	},
	argTypes: {
		variant: {
			control: "select",
			options: ["default", "compound"],
		},
		disabled: {
			control: "boolean",
		},
	},
	args: {
		variant: "default",
		disabled: false,
	},
} satisfies Meta<typeof SelectWrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
	tags: ["!dev"],
	render: ({ variant = "default", disabled = false }) => (
		<SelectWrapper variant={variant} disabled={disabled} />
	),
} satisfies Story;

export const Demo = {
	tags: ["!autodocs"],
	render: () => (
		<div className="space-y-8">
			{/* Default */}
			<div>
				<h3 className="typo-label mb-4">Default</h3>
				<Select>
					<SelectTrigger className="w-[200px]">
						<SelectValue placeholder="Select a fruit" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectItem value="apple">Apple</SelectItem>
							<SelectItem value="banana">Banana</SelectItem>
							<SelectItem value="blueberry">Blueberry</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>

			{/* Compound */}
			<div>
				<h3 className="typo-label mb-4">Compound</h3>
				<Select>
					<SelectTrigger className="w-[200px]" variant="compound">
						<SelectValue placeholder="Select option" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="option1">Option 1</SelectItem>
						<SelectItem value="option2">Option 2</SelectItem>
						<SelectItem value="option3">Option 3</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Disabled */}
			<div>
				<h3 className="typo-label mb-4">Disabled</h3>
				<Select disabled>
					<SelectTrigger className="w-[200px]">
						<SelectValue placeholder="Select a fruit" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectItem value="apple">Apple</SelectItem>
							<SelectItem value="banana">Banana</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>
		</div>
	),
} satisfies Story;
