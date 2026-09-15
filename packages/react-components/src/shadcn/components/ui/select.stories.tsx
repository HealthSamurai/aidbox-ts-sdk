import { Controls, Primary, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
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
	contentClassName?: string;
}

function SelectWrapper({
	variant = "default",
	disabled = false,
	contentClassName,
}: SelectWrapperProps) {
	return (
		<Select disabled={disabled}>
			<SelectTrigger className="w-[200px]" variant={variant}>
				<SelectValue placeholder="Select a fruit" />
			</SelectTrigger>
			<SelectContent className={contentClassName}>
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
					<p className="sbdocs-p">
						Popper menus size to their content within the available viewport,
						with the trigger width and the usual menu minimum as lower bounds.
						Use <code>className</code> or <code>style</code> to set a different
						width. Plain text labels truncate while retaining their full text
						for selection and native tooltips; custom option content can wrap or
						use its own layout.
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
		contentClassName: {
			control: "text",
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
	render: (args) => <SelectWrapper {...args} />,
} satisfies Story;

const longLabel = `${"A detailed question with a very long description. ".repeat(340)}END`;
const unbrokenLabel = `${"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".repeat(230)}END`;

export const LongLabels = {
	parameters: { layout: "padded" },
	render: function LongLabelsExample({ contentClassName }) {
		const [value, setValue] = useState("short");
		return (
			<div className="flex w-64 max-w-full items-center gap-2">
				<Select value={value} onValueChange={setValue}>
					<SelectTrigger className="flex-1" aria-label="Long label select">
						<SelectValue />
					</SelectTrigger>
					<SelectContent className={contentClassName}>
						<SelectItem value="short">Short label</SelectItem>
						<SelectItem value="long">{longLabel}</SelectItem>
						<SelectItem value="unbroken">{unbrokenLabel}</SelectItem>
						<SelectItem value="custom" textValue="Custom label">
							<span className="text-text-secondary">Custom</span>
							<span>label</span>
						</SelectItem>
					</SelectContent>
				</Select>
				<button
					type="button"
					className="shrink-0 typo-body"
					onClick={() => setValue("short")}
				>
					Reset
				</button>
			</div>
		);
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);
		const trigger = canvas.getByRole("combobox", { name: "Long label select" });
		const width = trigger.getBoundingClientRect().width;
		await userEvent.click(trigger);
		const menu = await body.findByRole("listbox");
		await waitFor(() => {
			const bounds = menu.getBoundingClientRect();
			expect(bounds.left).toBeGreaterThanOrEqual(0);
			expect(bounds.right).toBeLessThanOrEqual(
				canvasElement.ownerDocument.documentElement.clientWidth,
			);
			expect(menu.scrollWidth).toBeLessThanOrEqual(menu.clientWidth + 1);
			for (const option of body.getAllByRole("option")) {
				expect(option.scrollWidth).toBeLessThanOrEqual(option.clientWidth + 1);
			}
			if (args.contentClassName) {
				expect(Math.abs(bounds.width - width)).toBeLessThanOrEqual(1);
			} else {
				expect(bounds.width).toBeGreaterThan(width);
			}
		});
		for (const label of [longLabel, unbrokenLabel]) {
			const text = body.getByTitle(label);
			await expect(text.clientWidth).toBeGreaterThan(0);
			await expect(text.clientWidth).toBeLessThan(text.scrollWidth);
		}
		await userEvent.click(body.getByRole("option", { name: longLabel }));
		await expect(trigger).toHaveTextContent(longLabel);
		await expect(within(trigger).getByTitle(longLabel)).toBeVisible();
		await expect(trigger.getBoundingClientRect().width).toBe(width);
		await expect(trigger.scrollWidth).toBeLessThanOrEqual(trigger.clientWidth);
		await userEvent.keyboard("[Space][ArrowDown][Enter]");
		await expect(trigger).toHaveTextContent(unbrokenLabel);
		await expect(trigger.scrollWidth).toBeLessThanOrEqual(trigger.clientWidth);
		await userEvent.keyboard("[Space][End][Enter]");
		await expect(trigger).toHaveTextContent("Customlabel");
		await userEvent.click(await canvas.findByRole("button", { name: "Reset" }));
		await expect(trigger).toHaveTextContent("Short label");
	},
} satisfies Story;

export const StyledWidth = {
	...LongLabels,
	args: { contentClassName: "w-(--radix-select-trigger-width)" },
} satisfies Story;

export const CompactTrigger = {
	parameters: { layout: "padded" },
	render: () => (
		<Select defaultValue="and">
			<SelectTrigger className="w-auto" aria-label="Combine conditions">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="and">AND</SelectItem>
				<SelectItem value="or">OR</SelectItem>
			</SelectContent>
		</Select>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);
		const trigger = canvas.getByRole("combobox", {
			name: "Combine conditions",
		});
		await userEvent.click(trigger);
		const menu = await body.findByRole("listbox");
		await waitFor(() => {
			expect(menu.getBoundingClientRect().width).toBeGreaterThan(
				trigger.getBoundingClientRect().width,
			);
			for (const label of ["AND", "OR"]) {
				const text = within(menu).getByTitle(label);
				expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth);
			}
		});
		await userEvent.click(
			body.getByRole("option", { name: "OR", exact: true }),
		);
		await expect(trigger).toHaveTextContent("OR");
	},
} satisfies Story;

export const NarrowBoundary = {
	parameters: { layout: "padded" },
	render: function NarrowBoundaryExample() {
		const [boundary, setBoundary] = useState<HTMLDivElement | null>(null);
		return (
			<div ref={setBoundary} className="h-64 w-24 max-w-full">
				<Select defaultValue="and">
					<SelectTrigger aria-label="Narrow container">
						<SelectValue />
					</SelectTrigger>
					<SelectContent collisionBoundary={boundary} collisionPadding={4}>
						<SelectItem value="and">AND</SelectItem>
						<SelectItem value="or">OR</SelectItem>
					</SelectContent>
				</Select>
			</div>
		);
	},
	play: async ({ canvasElement }) => {
		const trigger = within(canvasElement).getByRole("combobox");
		const boundary = trigger.parentElement;
		await userEvent.click(trigger);
		const menu = await within(canvasElement.ownerDocument.body).findByRole(
			"listbox",
		);
		await waitFor(() => {
			const bounds = menu.getBoundingClientRect();
			const available = boundary?.getBoundingClientRect();
			expect(bounds.left).toBeGreaterThanOrEqual(available?.left ?? 0);
			expect(bounds.right).toBeLessThanOrEqual(available?.right ?? 0);
			expect(bounds.width).toBeGreaterThan(0);
			expect(bounds.width).toBeLessThan(trigger.getBoundingClientRect().width);
		});
		await userEvent.keyboard("[Escape]");
	},
} satisfies Story;

export const WrappedLabels = {
	parameters: { layout: "padded" },
	render: () => (
		<Select defaultValue="follow-up">
			<SelectTrigger className="w-64" aria-label="Wrapped option labels">
				<SelectValue />
			</SelectTrigger>
			<SelectContent className="w-72">
				<SelectItem value="follow-up">
					<span className="min-w-0 truncate [[data-slot=select-item]_&]:whitespace-normal [[data-slot=select-item]_&]:[overflow-wrap:anywhere]">
						Follow-up assessment: symptoms, medications, daily activities, and
						changes since the previous visit
					</span>
				</SelectItem>
			</SelectContent>
		</Select>
	),
	play: async ({ canvasElement }) => {
		const trigger = within(canvasElement).getByRole("combobox");
		const height = trigger.getBoundingClientRect().height;
		await userEvent.click(trigger);
		const option = await within(canvasElement.ownerDocument.body).findByRole(
			"option",
		);
		const text = within(option).getByText(/^Follow-up assessment:/);
		await waitFor(() => {
			const lineHeight = Number.parseFloat(getComputedStyle(text).lineHeight);
			expect(text.getBoundingClientRect().height).toBeGreaterThan(lineHeight);
			expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth);
		});
		await userEvent.click(option);
		await expect(trigger.getBoundingClientRect().height).toBe(height);
		await expect(trigger.scrollWidth).toBeLessThanOrEqual(trigger.clientWidth);
	},
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
