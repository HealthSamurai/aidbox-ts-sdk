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
				backgroundColor: "#ffffff",
				padding: "40px",
				display: "flex",
				flexDirection: "column",
				gap: "40px",
			}}
		>
			{/* Tabs (Content1 | Content2) */}
			<div>
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
			<div>
				<ToggleGroup type="single" variant="outline" defaultValue="yaml">
					<ToggleGroupItem value="yaml">YAML</ToggleGroupItem>
					<ToggleGroupItem value="json">JSON</ToggleGroupItem>
				</ToggleGroup>
			</div>

			{/* Buttons */}
			<div style={{ display: "flex", gap: "20px" }}>
				<Button variant="primary">Primary Button</Button>
				<Button variant="secondary">Secondary Button</Button>
			</div>
		</div>
	),
} satisfies Story;
