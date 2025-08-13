import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "#shadcn/components/ui/resizable";

const meta = {
	title: "Component/Resizable",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => (
		<ResizablePanelGroup
			direction="horizontal"
			className="max-w-md rounded-lg border md:min-w-[450px]"
		>
			<ResizablePanel defaultSize={50}>
				<div className="flex h-[200px] items-center justify-center p-6">
					<span className="font-semibold">One</span>
				</div>
			</ResizablePanel>
			<ResizableHandle />
			<ResizablePanel defaultSize={50}>
				<ResizablePanelGroup direction="vertical">
					<ResizablePanel defaultSize={25}>
						<div className="flex h-full items-center justify-center p-6">
							<span className="font-semibold">Two</span>
						</div>
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel defaultSize={75}>
						<div className="flex h-full items-center justify-center p-6">
							<span className="font-semibold">Three</span>
						</div>
					</ResizablePanel>
				</ResizablePanelGroup>
			</ResizablePanel>
		</ResizablePanelGroup>
	),
} satisfies Story;
