import type { Meta, StoryObj } from "@storybook/react-vite";
import { PanelRight } from "lucide-react";
import { Badge } from "#shadcn/components/ui/badge";
import { Toggle } from "#shadcn/components/ui/toggle";

const meta = {
	title: "Component/Toggle",
	component: Toggle,
	parameters: {
		controls: {
			exclude: ["size", "asChild"],
		},
	},
	argTypes: {
		variant: {
			control: "select",
			options: ["filled", "outline"],
		},
	},
	args: {
		variant: "filled",
		children: (
			<>
				<PanelRight /> Instance preview
			</>
		),
		"aria-label": "Toggle panel",
	},
} satisfies Meta<typeof Toggle>;
export default meta;

type Story = StoryObj<typeof meta>;

export const WithText = {
	args: {
		children: (
			<>
				<PanelRight /> Instance preview
			</>
		),
		"aria-label": "Toggle panel",
		variant: "filled",
	},
} satisfies Story;

export const IconOnly = {
	args: {
		children: <PanelRight />,
		"aria-label": "Toggle panel",
	},
} satisfies Story;

export const Demo = {
	render: () => (
		<div className="p-6 min-h-screen flex justify-center items-center">
			<div className="rounded-lg p-6 shadow-sm w-200">
				<div className="flex items-center mb-4 justify-between">
					<div className="w-30 text-center">Variant</div>
					<div className="w-40 text-center text-sm text-text-secondary">
						Default
					</div>
					<div className="w-40 text-center text-sm text-text-secondary">
						Disabled
					</div>
				</div>

				{(["filled", "outline"] as const).map((variant) => (
					<div className="border-t border-border-separator py-4" key={variant}>
						<div className="flex gap-4 items-center py-2 justify-between">
							<div className="w-30 text-sm text-text-secondary">
								<Badge variant="outline" className="text-xs">
									{variant}
								</Badge>
							</div>
							<div className="w-40 flex gap-3 justify-center items-center">
								<Toggle variant={variant} aria-label="Toggle with text">
									<PanelRight /> Instance preview
								</Toggle>
								<Toggle variant={variant} aria-label="Toggle icon only">
									<PanelRight />
								</Toggle>
							</div>
							<div className="w-40 flex gap-3 justify-center items-center">
								<Toggle
									variant={variant}
									disabled
									aria-label="Toggle with text"
								>
									<PanelRight /> Instance preview
								</Toggle>
								<Toggle
									variant={variant}
									disabled
									aria-label="Toggle icon only"
								>
									<PanelRight />
								</Toggle>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	),
} satisfies Story;
