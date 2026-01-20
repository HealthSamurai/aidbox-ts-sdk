import { Controls, Primary, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { action } from "storybook/internal/actions";
import {
	Tabs,
	TabsAddButton,
	TabsContent,
	TabsList,
	TabsListDropdown,
	TabsTrigger,
} from "#shadcn/components/ui/tabs";

interface TabsWrapperProps {
	variant?: "default" | "browser" | "secondary";
}

function TabsWrapper({ variant = "default" }: TabsWrapperProps) {
	if (variant === "browser") {
		return (
			<Tabs defaultValue="first" variant="browser">
				<TabsList>
					<TabsTrigger
						value="first"
						onClick={() => action("onClick")()}
						onClose={(v) => action("onClose")(v)}
					>
						<span className="flex items-center gap-1">
							<span className="text-utility-green">GET</span>
							<span>/fhir/Patient</span>
						</span>
					</TabsTrigger>
					<TabsTrigger
						value="second"
						onClick={() => action("onClick")()}
						onClose={(v) => action("onClose")(v)}
					>
						<span className="flex items-center gap-1">
							<span className="text-utility-yellow">POST</span>
							<span>/fhir</span>
						</span>
					</TabsTrigger>
				</TabsList>
				<TabsAddButton onClick={() => action("onAdd")()} />
				<TabsContent value="first">
					<div className="p-4">GET /fhir/Patient content</div>
				</TabsContent>
				<TabsContent value="second">
					<div className="p-4">POST /fhir content</div>
				</TabsContent>
			</Tabs>
		);
	}

	if (variant === "secondary") {
		return (
			<Tabs defaultValue="tab1" variant="secondary">
				<TabsList>
					<TabsTrigger value="tab1">Tab 1</TabsTrigger>
					<TabsTrigger value="tab2">Tab 2</TabsTrigger>
					<TabsTrigger value="tab3">Tab 3</TabsTrigger>
				</TabsList>
				<TabsContent value="tab1">
					<div className="p-4">Tab 1 content</div>
				</TabsContent>
				<TabsContent value="tab2">
					<div className="p-4">Tab 2 content</div>
				</TabsContent>
				<TabsContent value="tab3">
					<div className="p-4">Tab 3 content</div>
				</TabsContent>
			</Tabs>
		);
	}

	return (
		<Tabs defaultValue="tab1">
			<TabsList>
				<TabsTrigger value="tab1">Tab 1</TabsTrigger>
				<TabsTrigger value="tab2">Tab 2</TabsTrigger>
				<TabsTrigger value="tab3">Tab 3</TabsTrigger>
			</TabsList>
			<TabsContent value="tab1">
				<div className="p-4">Tab 1 content</div>
			</TabsContent>
			<TabsContent value="tab2">
				<div className="p-4">Tab 2 content</div>
			</TabsContent>
			<TabsContent value="tab3">
				<div className="p-4">Tab 3 content</div>
			</TabsContent>
		</Tabs>
	);
}

const meta = {
	title: "Component/Tabs",
	component: TabsWrapper,
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
			options: ["default", "browser", "secondary"],
		},
	},
	args: {
		variant: "default",
	},
} satisfies Meta<typeof TabsWrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
	tags: ["!dev"],
	render: ({ variant = "default" }) => <TabsWrapper variant={variant} />,
} satisfies Story;

export const Demo = {
	tags: ["!autodocs"],
	render: () => (
		<div className="space-y-8">
			{/* Default variant */}
			<div>
				<h3 className="typo-label mb-4">Default</h3>
				<Tabs defaultValue="tab1">
					<TabsList>
						<TabsTrigger value="tab1">Tab 1</TabsTrigger>
						<TabsTrigger value="tab2">Tab 2</TabsTrigger>
						<TabsTrigger value="tab3">Tab 3</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* Secondary variant */}
			<div>
				<h3 className="typo-label mb-4">Secondary</h3>
				<Tabs defaultValue="tab1" variant="secondary">
					<TabsList>
						<TabsTrigger value="tab1">Tab 1</TabsTrigger>
						<TabsTrigger value="tab2">Tab 2</TabsTrigger>
						<TabsTrigger value="tab3">Tab 3</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* Browser variant */}
			<div>
				<h3 className="typo-label mb-4">Browser</h3>
				<Tabs defaultValue="first" variant="browser">
					<TabsList>
						<TabsTrigger
							value="first"
							onClick={() => action("onClick")()}
							onClose={(v) => action("onClose")(v)}
						>
							<span className="flex items-center gap-1">
								<span className="text-utility-green">GET</span>
								<span>/fhir/Patient</span>
							</span>
						</TabsTrigger>
						<TabsTrigger
							value="second"
							onClick={() => action("onClick")()}
							onClose={(v) => action("onClose")(v)}
						>
							<span className="flex items-center gap-1">
								<span className="text-utility-yellow">POST</span>
								<span>/fhir</span>
							</span>
						</TabsTrigger>
						<TabsTrigger
							value="third"
							onClick={() => action("onClick")()}
							onClose={(v) => action("onClose")(v)}
						>
							<span className="flex items-center gap-1">
								<span className="text-utility-yellow">POST</span>
								<span>/$graphql</span>
							</span>
						</TabsTrigger>
					</TabsList>
					<TabsAddButton onClick={() => action("onAdd")()} />
					<TabsListDropdown
						tabs={[
							{
								id: "first",
								content: (
									<span className="flex items-center gap-1">
										<span className="text-utility-green">GET</span>
										<span>/fhir/Patient</span>
									</span>
								),
							},
							{
								id: "second",
								content: (
									<span className="flex items-center gap-1">
										<span className="text-utility-yellow">POST</span>
										<span>/fhir</span>
									</span>
								),
							},
							{
								id: "third",
								content: (
									<span className="flex items-center gap-1">
										<span className="text-utility-yellow">POST</span>
										<span>/$graphql</span>
									</span>
								),
							},
						]}
					/>
				</Tabs>
			</div>
		</div>
	),
} satisfies Story;
