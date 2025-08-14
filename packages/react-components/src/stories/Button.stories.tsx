import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

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
    danger: {
      control: "boolean",
    },
    variant: {
      control: "select",
      options: ["primary", "outline", "link"],
    },

    size: {
      control: "select",
      options: ["small", "regular"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "primary",
    size: "regular",
    disabled: false,
    danger: false,
  },
  render: (args) => (
    <div
      className={`bg-white flex justify-center items-center rounded-lg p-10 shadow-sm gap-4`}
    >
      <Button {...args}>Save</Button>
      <Button {...args}>
        <Trash2 />
        Save
      </Button>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="p-6  min-h-screen">
      <div className=" rounded-lg p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 py-3 border-b border-gray-200 mb-4">
          <div className="w-30">Variant</div>
          <div className="min-w-100 text-sm font-medium text-gray-600">
            {" "}
            Without icon{" "}
          </div>
          <div className="min-w-100 text-sm font-medium text-gray-600">
            With icon
          </div>
        </div>

        {/* normal variants */}
        {(["primary", "outline", "link"] as const).map((variant) => (
          <div className="flex gap-3 items-center py-3 ">
            <div className="w-30"> {variant} </div>
            <div key={variant} className="flex gap-3 items-center w-100">
              <Button variant={variant}> Button </Button>
              <Button variant={variant} disabled>
                {" "}
                Button{" "}
              </Button>
              <Button variant={variant} size="small">
                {" "}
                Button{" "}
              </Button>
              <Button variant={variant} size="small" disabled>
                {" "}
                Button{" "}
              </Button>
            </div>

            <div key={variant} className="flex gap-3 items-center w-100">
              <Button variant={variant}>
                {" "}
                <Trash2 /> Button{" "}
              </Button>
              <Button variant={variant} disabled>
                {" "}
                <Trash2 /> Button{" "}
              </Button>
              <Button variant={variant} size="small">
                {" "}
                <Trash2 /> Button{" "}
              </Button>
              <Button variant={variant} size="small" disabled>
                {" "}
                <Trash2 /> Button{" "}
              </Button>
            </div>
          </div>
        ))}

        {/* danger variants */}
        <div className="flex items-center gap-3 py-3 border-b border-gray-200 mt-8 mb-4">
          <div className="w-30">Variant (danger)</div>
          <div className="min-w-100 text-sm font-medium text-gray-600">
            Without icon
          </div>
          <div className="min-w-100 text-sm font-medium text-gray-600">
            With icon
          </div>
        </div>
        {(["primary", "outline", "link"] as const).map((variant) => (
          <div className="flex gap-3 items-center py-3 ">
            <div className="w-30"> {variant} </div>
            <div
              key={`danger-${variant}`}
              className="flex gap-3 items-center w-100"
            >
              <Button variant={variant} danger>
                Button
              </Button>
              <Button variant={variant} danger disabled>
                Button
              </Button>
              <Button variant={variant} size="small" danger>
                Button
              </Button>
              <Button variant={variant} size="small" danger disabled>
                Button
              </Button>
            </div>

            <div
              key={`danger-icons-${variant}`}
              className="flex gap-3 items-center w-100"
            >
              <Button variant={variant} danger>
                <Trash2 /> Button
              </Button>
              <Button variant={variant} danger disabled>
                <Trash2 /> Button
              </Button>
              <Button variant={variant} danger size="small">
                <Trash2 /> Button
              </Button>
              <Button variant={variant} danger size="small" disabled>
                <Trash2 /> Button
              </Button>
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
