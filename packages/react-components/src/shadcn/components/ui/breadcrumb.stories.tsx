// biome-ignore-all lint/a11y/useValidAnchor: Useless in stories
import { Controls, Primary, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "#shadcn/components/ui/breadcrumb";
import { DropdownMenuItem } from "#shadcn/components/ui/dropdown-menu";

interface BreadcrumbWrapperProps {
	isWhite?: boolean;
	hasDropdown?: boolean;
}

function BreadcrumbWrapper({
	isWhite = false,
	hasDropdown = false,
}: BreadcrumbWrapperProps) {
	return (
		<div className={isWhite ? "bg-black p-8 rounded-lg" : ""}>
			<Breadcrumb isWhite={isWhite}>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<a href="/">Home</a>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							asChild
							dropdownContent={
								hasDropdown ? (
									<>
										<DropdownMenuItem>Level 1</DropdownMenuItem>
										<DropdownMenuItem>Level 2</DropdownMenuItem>
										<DropdownMenuItem>Level 3</DropdownMenuItem>
									</>
								) : undefined
							}
						>
							<a href="/docs">Documentation</a>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>Components</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
		</div>
	);
}

const meta = {
	title: "Component/Breadcrumb",
	component: BreadcrumbWrapper,
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
		isWhite: {
			control: "boolean",
		},
		hasDropdown: {
			control: "boolean",
		},
	},
	args: {
		isWhite: false,
		hasDropdown: false,
	},
} satisfies Meta<typeof BreadcrumbWrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
	tags: ["!dev"],
	render: ({ isWhite = false, hasDropdown = false }) => (
		<BreadcrumbWrapper isWhite={isWhite} hasDropdown={hasDropdown} />
	),
} satisfies Story;

export const Demo = {
	tags: ["!autodocs"],
	render: () => (
		<div className="space-y-8">
			<div>
				<p className="text-sm text-text-secondary mb-2">Default</p>
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<a href="/">Home</a>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<a href="/docs">Documentation</a>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Components</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</div>

			<div>
				<p className="text-sm text-text-secondary mb-2">With Dropdown</p>
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<a href="/">Home</a>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink
								asChild
								dropdownContent={
									<>
										<DropdownMenuItem>Level 1</DropdownMenuItem>
										<DropdownMenuItem>Level 2</DropdownMenuItem>
										<DropdownMenuItem>Level 3</DropdownMenuItem>
									</>
								}
							>
								<a href="/docs">Documentation</a>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Components</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</div>

			<div className="bg-black p-8 rounded-lg">
				<p className="text-sm text-white/70 mb-2">
					White (for dark backgrounds)
				</p>
				<Breadcrumb isWhite>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<a href="/">Home</a>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<a href="/docs">Documentation</a>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Components</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</div>
		</div>
	),
} satisfies Story;
