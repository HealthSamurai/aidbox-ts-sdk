import type { Meta, StoryObj } from "@storybook/react";
import { ExperimentalTabsDemo } from "../components/ExperimentalTabsDemo";

const meta: Meta<typeof ExperimentalTabsDemo> = {
  title: "Demo/ExperimentalTabs",
  component: ExperimentalTabsDemo,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Demo: Story = {};
