import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@/components/ui/button";
import { ChevronRight, Trash, Trash2 } from "lucide-react";
import * as React from "react";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    disabled: {
      control: "boolean",
    },
    variant: {
      control: "select",
      options: [
        "primary",
        "critical",
        "outline",
        "tertiary",
      ],
    },

    size: {
      control: "select",
      options: [
        "small",
        "regular",
      ],
    },
  },
} satisfies Meta<typeof Button>;


export default meta;
type Story = StoryObj<typeof meta>;

function ButtonRow({
  label,
  variant,
  normalText,
  iconElement,
  criticalText,
}: {
  label: string;
  variant:
    | "primaryNormal"
    | "primaryCritical"
    | "secondaryNormal"
    | "tertiaryNormal"
    | "link"
    | "toolbar"
    | "toolbarCritical"
    | "toolbarCriticalSolid";
  normalText: string;
  iconElement: React.ReactNode;
  criticalText?: string;
}) {
  return (
    <div className="flex items-center gap-6 py-3">
      <div className="w-40 text-sm font-medium text-gray-700">{label}</div>

      {/* Without icon column */}
      <div className="flex gap-3 items-center min-w-80">
        <Button variant={variant}>{normalText}</Button>
        <Button variant={variant} className="hover:opacity-80">
          {normalText}
        </Button>
        <Button variant={variant} className="active:scale-95">
          {normalText}
        </Button>
        <Button variant={variant} disabled>
          {normalText}
        </Button>
      </div>

      {/* With icon column */}
      <div className="flex gap-3 items-center">
        <Button variant={variant}>
          {iconElement}
          {criticalText || normalText}
        </Button>
      </div>
    </div>
  );
}

export const AllVariants: Story = {
  render: () => (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-6 text-gray-900">Buttons</h2>

        {/* Header */}
        <div className="flex items-center gap-6 py-3 border-b border-gray-200 mb-4">
          <div className="w-40"></div>
          <div className="min-w-80 text-sm font-medium text-gray-600">
            ...without icon
          </div>
          <div className="text-sm font-medium text-gray-600">...with icon</div>
        </div>

        {/* Button rows */}
        <ButtonRow
          label="Primary / normal"
          variant="primaryNormal"
          normalText="Save"
          iconElement={<ChevronRight className="w-4 h-4" />}
        />

        <ButtonRow
          label="Primary / critical"
          variant="primaryCritical"
          normalText="Delete"
          iconElement={<Trash className="w-4 h-4" />}
        />

        <ButtonRow
          label="Secondary / normal"
          variant="secondaryNormal"
          normalText="Discard"
          iconElement={<ChevronRight className="w-4 h-4" />}
        />

        <ButtonRow
          label="Tertiary / normal"
          variant="tertiaryNormal"
          normalText="Cancel"
          iconElement={<Trash className="w-4 h-4" />}
        />

        <ButtonRow
          label="Toolbar / normal"
          variant="toolbar"
          normalText="Label"
          iconElement={<ChevronRight className="w-3 h-3" />}
        />

        <ButtonRow
          label="Toolbar / normal"
          variant="toolbarCritical"
          normalText="Label"
          iconElement={<ChevronRight className="w-3 h-3" />}
        />

        {/* Toolbar critical row - custom layout for multiple states */}
      </div>
    </div>
  ),
  parameters: {
    layout: "fullscreen",
  },
};

export const Default: Story = {
  args: {
    variant: "primary",
    size: "regular",
    disabled: false,
  },
  render: (args) => (
    <div className="p-6 bg-gray-50 flex justify-center items-center bg-white rounded-lg p-10 shadow-sm gap-4">
      <Button {...args}>Save</Button>
      <Button {...args}><Trash2 />Save</Button>
    </div>
  )
};
