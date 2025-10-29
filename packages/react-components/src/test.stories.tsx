import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "#shadcn/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#shadcn/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "#shadcn/components/ui/toggle-group";

const meta = {
	title: "Design/FigmaRealization",
	component: () => null,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Frame1333 = {
	render: () => (
		<div
			style={{
				width: "2735px",
				height: "2132px",
				backgroundColor: "#ffffff",
				position: "relative",
			}}
		>
			{/* Tabs (Content1 | Content2) */}
			<div
				style={{
					position: "absolute",
					left: "311px",
					top: "269px",
					width: "692px",
					height: "262px",
				}}
			>
				<Tabs defaultValue="content1">
					<TabsList>
						<TabsTrigger value="content1">Content 1</TabsTrigger>
						<TabsTrigger value="content2">Content 2</TabsTrigger>
					</TabsList>
					<TabsContent value="content1">
						<div style={{ padding: "20px" }}>Content 1 panel</div>
					</TabsContent>
					<TabsContent value="content2">
						<div style={{ padding: "20px" }}>Content 2 panel</div>
					</TabsContent>
				</Tabs>
			</div>

			{/* segmentControl (Yaml | Json) */}
			<div
				style={{
					position: "absolute",
					left: "264px",
					top: "868px",
					width: "2215px",
					height: "262px",
					display: "flex",
					alignItems: "center",
					padding: "20px",
				}}
			>
				<ToggleGroup type="single" variant="outline" defaultValue="yaml">
					<ToggleGroupItem value="yaml">YAML</ToggleGroupItem>
					<ToggleGroupItem value="json">JSON</ToggleGroupItem>
				</ToggleGroup>
			</div>

			{/* primaryButton */}
			<div
				style={{
					position: "absolute",
					left: "311px",
					top: "1323px",
					width: "692px",
					height: "262px",
					display: "flex",
					alignItems: "center",
					padding: "20px",
				}}
			>
				<Button variant="primary">Primary Button</Button>
			</div>

			{/* secondaryButton */}
			<div
				style={{
					position: "absolute",
					left: "1053px",
					top: "1323px",
					width: "692px",
					height: "262px",
					display: "flex",
					alignItems: "center",
					padding: "20px",
				}}
			>
				<Button variant="secondary">Secondary Button</Button>
			</div>
		</div>
	),
} satisfies Story;
