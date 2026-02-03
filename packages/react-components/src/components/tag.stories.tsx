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
		type: {
			control: "select",
			options: ["filled", "outlined"],
		},
		vibrance: {
			control: "select",
			options: ["vivid", "subtle"],
		},
		color: {
			control: "select",
			options: ["red", "yellow", "green", "blue", "gray", "contrast"],
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
		type: "filled",
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
			{ label: "Contrast", value: "contrast" },
		] as const;

		return (
			<div className="space-y-8">
				{/* Filled Section */}
				<div>
					<h2 className="typo-h4 mb-4">Filled</h2>
					<div className="overflow-x-auto">
						<table className="border-collapse">
							<thead>
								<tr>
									<th className="p-2 text-left border border-gray-200">
										Color
									</th>
									<th
										colSpan={4}
										className="p-2 text-center border border-gray-200 bg-gray-50 typo-label-xs"
									>
										Round
									</th>
									<th
										colSpan={4}
										className="p-2 text-center border border-gray-200 bg-gray-50 typo-label-xs"
									>
										Square
									</th>
								</tr>
								<tr>
									<th className="p-2 border border-gray-200" />
									<th className="p-2 text-center border border-gray-200 bg-gray-50 typo-label-xs">
										Big/Vivid
									</th>
									<th className="p-2 text-center border border-gray-200 bg-gray-50 typo-label-xs">
										Big/Subtle
									</th>
									<th className="p-2 text-center border border-gray-200 bg-gray-50 typo-label-xs">
										Small/Vivid
									</th>
									<th className="p-2 text-center border border-gray-200 bg-gray-50 typo-label-xs">
										Small/Subtle
									</th>
									<th className="p-2 text-center border border-gray-200 bg-gray-50 typo-label-xs">
										Big/Vivid
									</th>
									<th className="p-2 text-center border border-gray-200 bg-gray-50 typo-label-xs">
										Big/Subtle
									</th>
									<th className="p-2 text-center border border-gray-200 bg-gray-50 typo-label-xs">
										Small/Vivid
									</th>
									<th className="p-2 text-center border border-gray-200 bg-gray-50 typo-label-xs">
										Small/Subtle
									</th>
								</tr>
							</thead>
							<tbody>
								{colors.map((color) => (
									<tr key={color.value}>
										<td className="p-2 typo-label border border-gray-200">
											{color.label}
										</td>
										{/* Round */}
										<td className="p-2 border border-gray-200 text-center">
											<Tag
												shape="round"
												size="big"
												type="filled"
												vibrance="vivid"
												color={color.value}
												icon={<Check />}
											>
												Tag
											</Tag>
										</td>
										<td className="p-2 border border-gray-200 text-center">
											<Tag
												shape="round"
												size="big"
												type="filled"
												vibrance="subtle"
												color={color.value}
												icon={<Check />}
											>
												Tag
											</Tag>
										</td>
										<td className="p-2 border border-gray-200 text-center">
											<Tag
												shape="round"
												size="small"
												type="filled"
												vibrance="vivid"
												color={color.value}
												icon={<Check />}
											>
												Tag
											</Tag>
										</td>
										<td className="p-2 border border-gray-200 text-center">
											<Tag
												shape="round"
												size="small"
												type="filled"
												vibrance="subtle"
												color={color.value}
												icon={<Check />}
											>
												Tag
											</Tag>
										</td>
										{/* Square */}
										<td className="p-2 border border-gray-200 text-center">
											<Tag
												shape="square"
												size="big"
												type="filled"
												vibrance="vivid"
												color={color.value}
												icon={<Check />}
											>
												Tag
											</Tag>
										</td>
										<td className="p-2 border border-gray-200 text-center">
											<Tag
												shape="square"
												size="big"
												type="filled"
												vibrance="subtle"
												color={color.value}
												icon={<Check />}
											>
												Tag
											</Tag>
										</td>
										<td className="p-2 border border-gray-200 text-center">
											<Tag
												shape="square"
												size="small"
												type="filled"
												vibrance="vivid"
												color={color.value}
												icon={<Check />}
											>
												Tag
											</Tag>
										</td>
										<td className="p-2 border border-gray-200 text-center">
											<Tag
												shape="square"
												size="small"
												type="filled"
												vibrance="subtle"
												color={color.value}
												icon={<Check />}
											>
												Tag
											</Tag>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* Outlined Section */}
				<div>
					<h2 className="typo-h4 mb-4">Outlined</h2>
					<div className="overflow-x-auto">
						<table className="border-collapse">
							<thead>
								<tr>
									<th className="p-2 text-left border border-gray-200">
										Color
									</th>
									<th
										colSpan={2}
										className="p-2 text-center border border-gray-200 bg-gray-50 typo-label-xs"
									>
										Round
									</th>
									<th
										colSpan={2}
										className="p-2 text-center border border-gray-200 bg-gray-50 typo-label-xs"
									>
										Square
									</th>
								</tr>
								<tr>
									<th className="p-2 border border-gray-200" />
									<th className="p-2 text-center border border-gray-200 bg-gray-50 typo-label-xs">
										Big
									</th>
									<th className="p-2 text-center border border-gray-200 bg-gray-50 typo-label-xs">
										Small
									</th>
									<th className="p-2 text-center border border-gray-200 bg-gray-50 typo-label-xs">
										Big
									</th>
									<th className="p-2 text-center border border-gray-200 bg-gray-50 typo-label-xs">
										Small
									</th>
								</tr>
							</thead>
							<tbody>
								{colors.map((color) => (
									<tr key={color.value}>
										<td className="p-2 typo-label border border-gray-200">
											{color.label}
										</td>
										<td className="p-2 border border-gray-200 text-center">
											<Tag
												shape="round"
												size="big"
												type="outlined"
												color={color.value}
												icon={<Check />}
											>
												Tag
											</Tag>
										</td>
										<td className="p-2 border border-gray-200 text-center">
											<Tag
												shape="round"
												size="small"
												type="outlined"
												color={color.value}
												icon={<Check />}
											>
												Tag
											</Tag>
										</td>
										<td className="p-2 border border-gray-200 text-center">
											<Tag
												shape="square"
												size="big"
												type="outlined"
												color={color.value}
												icon={<Check />}
											>
												Tag
											</Tag>
										</td>
										<td className="p-2 border border-gray-200 text-center">
											<Tag
												shape="square"
												size="small"
												type="outlined"
												color={color.value}
												icon={<Check />}
											>
												Tag
											</Tag>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		);
	},
} satisfies Story;
