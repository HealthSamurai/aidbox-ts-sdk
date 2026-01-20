import { Controls, Primary, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Check, Circle, Star, X, Zap } from "lucide-react";
import { Tag, type TagProps } from "./tag";

const iconMap = {
	check: <Check className="size-4" />,
	star: <Star className="size-4" />,
	zap: <Zap className="size-4" />,
	circle: <Circle className="size-4" />,
	x: <X className="size-4" />,
} as const;

type IconName = keyof typeof iconMap;

interface TagWrapperProps extends Omit<TagProps, "icon"> {
	icon?: IconName;
}

function TagWrapper({ icon = "check", children, ...props }: TagWrapperProps) {
	return (
		<Tag icon={iconMap[icon]} {...props}>
			{children}
		</Tag>
	);
}

const meta = {
	title: "Component/Tag",
	component: TagWrapper,
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
		shape: {
			control: "select",
			options: ["round", "square"],
		},
		size: {
			control: "select",
			options: ["big", "small"],
		},
		vibrance: {
			control: "select",
			options: ["vivid", "subtle"],
		},
		color: {
			control: "select",
			options: ["red", "yellow", "green", "blue", "gray"],
		},
		showIcon: {
			control: "boolean",
		},
		icon: {
			control: "select",
			options: ["check", "star", "zap", "circle", "x"],
		},
		children: {
			control: "text",
		},
	},
	args: {
		children: "Tag",
		shape: "round",
		size: "big",
		vibrance: "vivid",
		color: "green",
		showIcon: true,
		icon: "check",
	},
} satisfies Meta<typeof TagWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {
	tags: ["!dev"],
	render: ({ children, ...args }) => (
		<TagWrapper {...args}>{children}</TagWrapper>
	),
} satisfies Story;

export const Demo = {
	tags: ["!autodocs"],
	render: () => {
		const colors = [
			{ label: "Red", value: "red" },
			{ label: "Yellow", value: "yellow" },
			{ label: "Green", value: "green" },
			{ label: "Blue", value: "blue" },
			{ label: "Gray", value: "gray" },
		] as const;

		const columns = [
			{
				shape: "round" as const,
				size: "big" as const,
				vibrance: "vivid" as const,
			},
			{
				shape: "round" as const,
				size: "big" as const,
				vibrance: "subtle" as const,
			},
			{
				shape: "round" as const,
				size: "small" as const,
				vibrance: "vivid" as const,
			},
			{
				shape: "round" as const,
				size: "small" as const,
				vibrance: "subtle" as const,
			},
			{
				shape: "square" as const,
				size: "big" as const,
				vibrance: "vivid" as const,
			},
			{
				shape: "square" as const,
				size: "big" as const,
				vibrance: "subtle" as const,
			},
			{
				shape: "square" as const,
				size: "small" as const,
				vibrance: "vivid" as const,
			},
			{
				shape: "square" as const,
				size: "small" as const,
				vibrance: "subtle" as const,
			},
		];

		return (
			<div className="overflow-x-auto">
				<table className="border-collapse">
					<thead>
						<tr>
							<th className="sticky left-0 z-20 bg-white p-2 text-left border border-gray-200">
								Color
							</th>
							<th
								colSpan={4}
								className="p-2 text-center border border-gray-200 bg-gray-50 typo-label-xs"
							>
								Shape=Round
							</th>
							<th
								colSpan={4}
								className="p-2 text-center border border-gray-200 bg-gray-50 typo-label-xs"
							>
								Shape=Square
							</th>
						</tr>
						<tr>
							<th className="sticky left-0 z-10 bg-white p-2 text-left border border-gray-200" />
							{columns.map((col) => (
								<th
									key={`${col.shape}-${col.size}-${col.vibrance}`}
									className="p-2 text-center border border-gray-200 whitespace-nowrap bg-gray-50"
								>
									<div className="flex flex-col gap-1">
										<span className="typo-label-xs">
											Size={col.size === "big" ? "Big" : "Small"}
										</span>
										<span className="typo-label-xs">
											Vibrance={col.vibrance === "vivid" ? "Vivid" : "Subtle"}
										</span>
									</div>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{colors.map((color) => (
							<tr key={color.value}>
								<td className="sticky left-0 z-10 bg-white p-2 typo-label border border-gray-200">
									{color.label}
								</td>
								{columns.map((col) => (
									<td
										key={`${color.value}-${col.shape}-${col.size}-${col.vibrance}`}
										className="p-2 border border-gray-200 text-center"
									>
										<Tag
											shape={col.shape}
											size={col.size}
											vibrance={col.vibrance}
											color={color.value}
											icon={<Check className="size-4" />}
										>
											Tag
										</Tag>
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	},
} satisfies Story;
