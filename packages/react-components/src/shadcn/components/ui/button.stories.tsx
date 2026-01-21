import { Controls, Primary, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Play } from "lucide-react";
import { Badge } from "#shadcn/components/ui/badge";
import { Button } from "#shadcn/components/ui/button";

interface ButtonWrapperProps {
	variant?: "primary" | "secondary" | "ghost" | "link";
	size?: "regular" | "small";
	danger?: boolean;
	disabled?: boolean;
	icon?: "none" | "left" | "only";
	children?: string;
}

function ButtonWrapper({
	variant = "primary",
	size = "regular",
	danger = false,
	disabled = false,
	icon = "none",
	children = "Button",
}: ButtonWrapperProps) {
	if (icon === "only") {
		return (
			<Button variant={variant} size={size} danger={danger} disabled={disabled}>
				<Play />
			</Button>
		);
	}

	if (icon === "left") {
		return (
			<Button variant={variant} size={size} danger={danger} disabled={disabled}>
				<Play />
				{children}
			</Button>
		);
	}

	return (
		<Button variant={variant} size={size} danger={danger} disabled={disabled}>
			{children}
		</Button>
	);
}

const meta = {
	title: "Component/Button",
	component: ButtonWrapper,
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
			options: ["primary", "secondary", "ghost", "link"],
		},
		size: {
			control: "select",
			options: ["regular", "small"],
		},
		danger: {
			control: "boolean",
		},
		disabled: {
			control: "boolean",
		},
		icon: {
			control: "select",
			options: ["none", "left", "only"],
		},
		children: {
			control: "text",
		},
	},
	args: {
		children: "Button",
		variant: "primary",
		size: "regular",
		danger: false,
		disabled: false,
		icon: "none",
	},
} satisfies Meta<typeof ButtonWrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
	tags: ["!dev"],
	render: ({
		variant = "primary",
		size = "regular",
		danger = false,
		disabled = false,
		icon = "none",
		children = "Button",
	}) => (
		<ButtonWrapper
			variant={variant}
			size={size}
			danger={danger}
			disabled={disabled}
			icon={icon}
		>
			{children}
		</ButtonWrapper>
	),
} satisfies Story;

export const Demo = {
	tags: ["!autodocs"],
	render: () => (
		<div className="p-6  min-h-screen flex justify-center items-center">
			<div className=" rounded-lg p-6 shadow-sm w-280">
				<div className="flex items-center mb-4 justify-between">
					<div className="w-40 text-center">Variants</div>
					<div className="w-70 text-center text-sm text-text-secondary">
						Danger:
						<Badge variant="outline" className="text-xs">
							false
						</Badge>
					</div>
					<div className="w-70 text-center text-sm text-text-secondary">
						Danger:
						<Badge variant="outline" className="text-xs">
							true
						</Badge>
					</div>
					<div className="w-70 text-center text-sm text-text-secondary">
						Disabled:
						<Badge variant="outline" className="text-xs">
							true
						</Badge>
					</div>
				</div>

				{(["regular", "small"] as const).map((size) => (
					<div
						className=" items-center gap-3 py-3 border-gray-l00 border-t border-border-separator"
						key={size}
					>
						{(["primary", "secondary", "ghost", "link"] as const).map(
							(variant) => (
								<div
									key={variant}
									className="flex gap-3 items-center py-2 justify-between"
								>
									<div className="w-40 text-sm text-text-secondary">
										<div className="flex mb-1">
											<div className="w-15">Variant:</div>
											<Badge variant="outline" className="text-xs">
												{variant}
											</Badge>
										</div>
										<div className="flex">
											<div className="w-15">Size:</div>
											<Badge variant="outline" className="text-xs">
												{size}
											</Badge>
										</div>
									</div>
									<div className="w-70 flex gap-3 justify-center">
										<Button size={size} variant={variant}>
											Button
										</Button>
										<Button size={size} variant={variant}>
											<Play /> Button
										</Button>
										<Button size={size} variant={variant}>
											<Play />
										</Button>
									</div>
									<div className="w-70 flex gap-3 justify-center">
										<Button size={size} variant={variant} danger>
											Button
										</Button>
										<Button size={size} variant={variant} danger>
											<Play /> Button
										</Button>
										<Button size={size} variant={variant} danger>
											<Play />
										</Button>
									</div>
									<div className="w-70 flex gap-3 justify-center">
										<Button size={size} variant={variant} disabled>
											Button
										</Button>
										<Button size={size} variant={variant} disabled>
											<Play /> Button
										</Button>
										<Button size={size} variant={variant} disabled>
											<Play />
										</Button>
									</div>
								</div>
							),
						)}
					</div>
				))}
			</div>
		</div>
	),
} satisfies Story;
