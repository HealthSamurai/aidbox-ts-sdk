import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tag } from "./tag";

const CheckIcon = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
		<title>Check icon</title>
		<path
			d="M13.5 4.5L6 12L2.5 8.5"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);
const meta: Meta<typeof Tag> = {
	title: "Component/Tag",
	component: Tag,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
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
			control: false,
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
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
							<th className="sticky left-0 z-10 bg-white p-2 text-left border border-gray-200"></th>
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
											icon={<CheckIcon />}
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
};
