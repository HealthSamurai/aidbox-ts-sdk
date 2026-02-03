import { Controls, Primary, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleX, Copy, Mail } from "lucide-react";
import { Badge } from "#shadcn/components/ui/badge";
import { Input } from "#shadcn/components/ui/input";
import { Label } from "#shadcn/components/ui/label";
import { IconButton } from "../../../components/icon-button";

interface InputWithLabelProps {
	label?: string;
	description?: string;
	invalid?: boolean;
	disabled?: boolean;
	placeholder?: string;
	leftSlot?: React.ReactNode;
	rightSlot?: React.ReactNode;
	suffix?: string;
}

function InputWithLabel({
	label = "Label",
	description = "This is a hint text to help user.",
	invalid = false,
	disabled = false,
	placeholder = "Placeholder",
	leftSlot,
	rightSlot,
	suffix,
}: InputWithLabelProps) {
	const descriptionColor = invalid
		? "text-text-error-primary"
		: disabled
			? "text-text-disabled"
			: "text-text-secondary";

	return (
		<div className="flex w-full">
			<div className="space-y-2 w-full">
				<Label>{label}</Label>
				<Input
					placeholder={placeholder}
					leftSlot={leftSlot}
					rightSlot={rightSlot}
					{...(suffix && { suffix })}
					invalid={invalid}
					disabled={disabled}
				/>
				<p className={`typo-body-xs ${descriptionColor}`}>{description}</p>
			</div>
		</div>
	);
}

const meta = {
	title: "Component/Input",
	component: Input,
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
		type: {
			control: "select",
			options: ["text", "password"],
		},
		placeholder: {
			control: "text",
		},
		invalid: {
			control: "boolean",
		},
		disabled: {
			control: "boolean",
		},
		hasPrefix: {
			control: "boolean",
			name: "hasPrefix",
		},
		hasSuffix: {
			control: "boolean",
			name: "hasSuffix",
		},
	},
	args: {
		type: "text",
		placeholder: "Placeholder",
		invalid: false,
		disabled: false,
		hasPrefix: false,
		hasSuffix: false,
	},
} satisfies Meta<typeof Input>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
	tags: ["!dev"],
	render: (args) => {
		const { hasPrefix, hasSuffix, ...rest } = args as typeof args & {
			hasPrefix?: boolean;
			hasSuffix?: boolean;
		};
		return (
			<Input
				{...rest}
				{...(hasPrefix && { prefixValue: "https://" })}
				{...(hasSuffix && { suffix: ".com" })}
			/>
		);
	},
} satisfies Story;

export const Demo = {
	tags: ["!autodocs"],
	render: () => (
		<div className="p-6 min-h-screen flex justify-center items-center">
			<div className="rounded-lg p-6 shadow-sm w-280">
				<div className="flex items-center mb-4 justify-between">
					<div className="w-40 text-left">Inputs without labels</div>
					<div className="w-70 text-left text-sm text-text-secondary">
						Invalid:
						<Badge variant="outline" className="text-xs ml-2">
							false
						</Badge>
					</div>
					<div className="w-70 text-left text-sm text-text-secondary">
						Invalid:
						<Badge variant="outline" className="text-xs ml-2">
							true
						</Badge>
					</div>
					<div className="w-70 text-left text-sm text-text-secondary">
						Disabled:
						<Badge variant="outline" className="text-xs ml-2">
							true
						</Badge>
					</div>
				</div>

				{(["none", "left", "right", "both", "left-double-right"] as const).map(
					(variant) => {
						const variantLabel = {
							none: "None",
							left: "leftSlot",
							right: "rightSlot",
							both: "leftSlot + rightSlot",
							"left-double-right": "BothPlusExtra",
						}[variant];

						return (
							<div
								className="items-center gap-3 py-3 border-gray-l00 border-t border-border-separator"
								key={variant}
							>
								<div className="flex gap-3 items-center py-2 justify-between">
									<div className="w-40 text-sm text-text-secondary">
										<div className="flex">
											<div className="w-15">Slots:</div>
											<Badge variant="outline" className="text-xs">
												{variantLabel}
											</Badge>
										</div>
									</div>

									{/* Default Variants */}
									<div className="w-70 flex gap-3 justify-center">
										{variant === "none" && <Input placeholder="Placeholder" />}
										{variant === "left" && (
											<Input placeholder="Placeholder" leftSlot={<Mail />} />
										)}
										{variant === "right" && (
											<Input
												placeholder="Placeholder"
												rightSlot={
													<IconButton
														icon={<CircleX />}
														aria-label="Clear"
														variant="link"
													/>
												}
											/>
										)}
										{variant === "both" && (
											<Input
												placeholder="Placeholder"
												leftSlot={<Mail />}
												rightSlot={
													<IconButton
														icon={<CircleX />}
														aria-label="Clear"
														variant="link"
													/>
												}
											/>
										)}
										{variant === "left-double-right" && (
											<Input
												placeholder="Placeholder"
												className="pr-15"
												leftSlot={<Mail />}
												rightSlot={
													<>
														<IconButton
															icon={<CircleX />}
															aria-label="Clear"
															variant="link"
														/>
														<IconButton
															icon={<Copy />}
															aria-label="Copy"
															variant="link"
														/>
													</>
												}
												suffix="milliseconds"
											/>
										)}
									</div>

									{/* Critical Variants */}
									<div className="w-70 flex gap-3 justify-center">
										{variant === "none" && (
											<Input placeholder="Placeholder" invalid />
										)}
										{variant === "left" && (
											<Input
												placeholder="Placeholder"
												leftSlot={<Mail />}
												invalid
											/>
										)}
										{variant === "right" && (
											<Input
												placeholder="Placeholder"
												rightSlot={
													<IconButton
														icon={<CircleX />}
														aria-label="Clear"
														variant="link"
													/>
												}
												invalid
											/>
										)}
										{variant === "both" && (
											<Input
												placeholder="Placeholder"
												leftSlot={<Mail />}
												rightSlot={
													<IconButton
														icon={<CircleX />}
														aria-label="Clear"
														variant="link"
													/>
												}
												invalid
											/>
										)}
										{variant === "left-double-right" && (
											<Input
												placeholder="Placeholder"
												className="pr-15"
												leftSlot={<Mail />}
												rightSlot={
													<>
														<IconButton
															icon={<CircleX />}
															aria-label="Clear"
															variant="link"
														/>
														<IconButton
															icon={<Copy />}
															aria-label="Copy"
															variant="link"
														/>
													</>
												}
												suffix="milliseconds"
												invalid
											/>
										)}
									</div>

									{/* Disabled Variants */}
									<div className="w-70 flex gap-3 justify-center">
										{variant === "none" && (
											<Input placeholder="Aidbox" disabled />
										)}
										{variant === "left" && (
											<Input
												placeholder="Aidbox"
												leftSlot={<Mail />}
												disabled
											/>
										)}
										{variant === "right" && (
											<Input
												placeholder="Aidbox"
												rightSlot={
													<IconButton
														icon={<CircleX />}
														aria-label="Clear"
														variant="link"
														disabled
													/>
												}
												disabled
											/>
										)}
										{variant === "both" && (
											<Input
												placeholder="Aidbox"
												leftSlot={<Mail />}
												rightSlot={
													<IconButton
														icon={<CircleX />}
														aria-label="Clear"
														variant="link"
														disabled
													/>
												}
												disabled
											/>
										)}
										{variant === "left-double-right" && (
											<Input
												placeholder="Aidbox"
												className="pr-15"
												leftSlot={<Mail />}
												rightSlot={
													<>
														<IconButton
															icon={<CircleX />}
															aria-label="Clear"
															variant="link"
															disabled
														/>
														<IconButton
															icon={<Copy />}
															aria-label="Copy"
															variant="link"
															disabled
														/>
													</>
												}
												suffix="milliseconds"
												disabled
											/>
										)}
									</div>
								</div>
							</div>
						);
					},
				)}

				{/* Label + Description Section */}
				<div className="mt-8">
					<div className="flex items-center mb-4 justify-between">
						<div className="w-40 text-left">Input + Label + Description</div>
						<div className="w-70 text-left text-sm text-text-secondary">
							Invalid:
							<Badge variant="outline" className="text-xs">
								false
							</Badge>
						</div>
						<div className="w-70 text-left text-sm text-text-secondary">
							Invalid:
							<Badge variant="outline" className="text-xs">
								true
							</Badge>
						</div>
						<div className="w-70 text-left text-sm text-text-secondary">
							Disabled:
							<Badge variant="outline" className="text-xs">
								true
							</Badge>
						</div>
					</div>

					{(
						["none", "left", "right", "both", "left-double-right"] as const
					).map((variant) => (
						<div
							className="items-center gap-3 py-3 border-gray-l00 border-t border-border-separator"
							key={`label-${variant}`}
						>
							<div className="flex gap-3 items-center py-2 justify-between">
								<div className="w-40 text-sm text-text-secondary">
									<div className="flex">
										<div className="w-15">Slots:</div>
										<Badge variant="outline" className="text-xs">
											{variant}
										</Badge>
									</div>
								</div>

								{/* Default Variants with Label */}
								<div className="w-70 flex gap-3 justify-center">
									{variant === "none" && (
										<InputWithLabel placeholder="Placeholder" />
									)}
									{variant === "left" && (
										<InputWithLabel
											placeholder="Placeholder"
											leftSlot={<Mail />}
										/>
									)}
									{variant === "right" && (
										<InputWithLabel
											placeholder="Placeholder"
											rightSlot={
												<IconButton
													icon={<CircleX />}
													aria-label="Clear"
													variant="link"
												/>
											}
										/>
									)}
									{variant === "both" && (
										<InputWithLabel
											placeholder="Placeholder"
											leftSlot={<Mail />}
											rightSlot={
												<IconButton
													icon={<CircleX />}
													aria-label="Clear"
													variant="link"
												/>
											}
										/>
									)}
									{variant === "left-double-right" && (
										<InputWithLabel
											placeholder="Placeholder"
											leftSlot={<Mail />}
											rightSlot={
												<>
													<IconButton
														icon={<CircleX />}
														aria-label="Clear"
														variant="link"
													/>
													<IconButton
														icon={<Copy />}
														aria-label="Copy"
														variant="link"
													/>
												</>
											}
											suffix="milliseconds"
										/>
									)}
								</div>

								{/* Critical Variants with Label */}
								<div className="w-70 flex gap-3 justify-center">
									{variant === "none" && (
										<InputWithLabel placeholder="Placeholder" invalid />
									)}
									{variant === "left" && (
										<InputWithLabel
											placeholder="Placeholder"
											leftSlot={<Mail />}
											invalid
										/>
									)}
									{variant === "right" && (
										<InputWithLabel
											placeholder="Placeholder"
											rightSlot={
												<IconButton
													icon={<CircleX />}
													aria-label="Clear"
													variant="link"
												/>
											}
											invalid
										/>
									)}
									{variant === "both" && (
										<InputWithLabel
											placeholder="Placeholder"
											leftSlot={<Mail />}
											rightSlot={
												<IconButton
													icon={<CircleX />}
													aria-label="Clear"
													variant="link"
												/>
											}
											invalid
										/>
									)}
									{variant === "left-double-right" && (
										<InputWithLabel
											placeholder="Placeholder"
											leftSlot={<Mail />}
											rightSlot={
												<>
													<IconButton
														icon={<CircleX />}
														aria-label="Clear"
														variant="link"
													/>
													<IconButton
														icon={<Copy />}
														aria-label="Copy"
														variant="link"
													/>
												</>
											}
											suffix="milliseconds"
											invalid
										/>
									)}
								</div>

								{/* Disabled Variants with Label */}
								<div className="w-70 flex gap-3 justify-center">
									{variant === "none" && (
										<InputWithLabel placeholder="Aidbox" disabled />
									)}
									{variant === "left" && (
										<InputWithLabel
											placeholder="Aidbox"
											leftSlot={<Mail />}
											disabled
										/>
									)}
									{variant === "right" && (
										<InputWithLabel
											placeholder="Aidbox"
											rightSlot={
												<IconButton
													icon={<CircleX />}
													aria-label="Clear"
													variant="link"
													disabled
												/>
											}
											disabled
										/>
									)}
									{variant === "both" && (
										<InputWithLabel
											placeholder="Aidbox"
											leftSlot={<Mail />}
											rightSlot={
												<IconButton
													icon={<CircleX />}
													aria-label="Clear"
													variant="link"
													disabled
												/>
											}
											disabled
										/>
									)}
									{variant === "left-double-right" && (
										<InputWithLabel
											placeholder="Aidbox"
											leftSlot={<Mail />}
											rightSlot={
												<>
													<IconButton
														icon={<CircleX />}
														aria-label="Clear"
														variant="link"
														disabled
													/>
													<IconButton
														icon={<Copy />}
														aria-label="Copy"
														variant="link"
														disabled
													/>
												</>
											}
											suffix="milliseconds"
											disabled
										/>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	),
} satisfies Story;
