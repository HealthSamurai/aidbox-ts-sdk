import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Progress } from "#shadcn/components/ui/progress";

const meta = {
	title: "Component/Progress",
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo = {
	render: () => {
		const [progress, setProgress] = React.useState(13);

		React.useEffect(() => {
			const timer = setTimeout(() => setProgress(66), 500);
			return () => clearTimeout(timer);
		}, []);

		return <Progress value={progress} className="w-[60%]" />;
	},
} satisfies Story;
