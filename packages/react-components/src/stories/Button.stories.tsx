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
        "ghost",
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
  size,
  normalText,
  iconElement,
  criticalText,
}: {
  label: string;
  variant:
    | "primary"
    | "critical"
    | "outline"
    | "ghost";
  size: "small" | "regular";
  normalText: string;
  iconElement: React.ReactNode;
  criticalText?: string;
}) {
  return (
    <div className="flex items-center gap-6 py-3">
      <div className="w-40 text-sm font-medium text-gray-700">{label}</div>

      {/* Without icon column */}
      <div className="flex gap-3 items-center min-w-80">
        <Button variant={variant} size={size}>{normalText}</Button>
        <Button variant={variant} size={size} disabled> {normalText} </Button>
      </div>

      {/* With icon column */}
      <div className="flex gap-3 items-center">
        <Button variant={variant} size={size}> {iconElement} {criticalText || normalText} </Button>
        <Button variant={variant} size={size} disabled> {iconElement} {criticalText || normalText} </Button>
      </div>
    </div>
  );
}

export const AllVariants: Story = {
  render: () => (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg p-6 shadow-sm">

        {/* Header */}
        <div className="flex items-center gap-3 py-3 border-b border-gray-200 mb-4">
          <div className="w-30">Variant</div>
          <div className="min-w-100 text-sm font-medium text-gray-600"> Without icon </div>
          <div className="min-w-100 text-sm font-medium text-gray-600">With icon</div>
        </div>

        {["primary", "critical", "outline", "ghost"].map((variant) => (
          <div className="flex gap-3 items-center py-3 ">
            <div className="w-30"> {variant} </div>
            <div key={variant} className="flex gap-3 items-center w-100">
              <Button variant={variant}> Button </Button>
              <Button variant={variant} disabled> Button </Button>
              <Button variant={variant} size="small" > Button </Button>
              <Button variant={variant} size="small" disabled> Button </Button>
            </div>

            <div key={variant} className="flex gap-3 items-center w-100">
              <Button variant={variant}> <Trash2 /> Button </Button>
              <Button variant={variant} disabled> <Trash2 /> Button </Button>
              <Button variant={variant} size="small" > <Trash2 /> Button </Button>
              <Button variant={variant} size="small" disabled> <Trash2 /> Button </Button>
            </div>
          </div>
        ))}




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
