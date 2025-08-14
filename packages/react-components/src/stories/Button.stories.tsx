import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@/components/ui/button";
import { Trash2, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
      options: ["primary", "outline", "link", "ghost"],
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
    <div className="p-6  min-h-screen flex justify-center items-center">
      <div className=" rounded-lg p-6 shadow-sm w-280">
        {/* Header */}

        <div className="flex items-center mb-4 justify-between">
          <div className="w-40 text-center" >Variants</div>
          <div className="w-70 text-center text-sm text-text-secondary" >Danger: <Badge variant="outline" className="text-xs">false</Badge></div>
          <div className="w-70 text-center text-sm text-text-secondary" >Danger: <Badge variant="outline" className="text-xs">true</Badge></div>
          <div className="w-70 text-center text-sm text-text-secondary" >Disabled: <Badge variant="outline" className="text-xs">true</Badge></div>
        </div>

        {(["regular", "small"] as const).map((size) => (
          <div className=" items-center gap-3 py-3 border-gray-l00 border-t border-border-separator" key={size}>
            {(["primary", "secondary", "ghost", "link"] as const).map((variant) => (
              <div key={variant} className="flex gap-3 items-center py-2 justify-between">
                <div className="w-40 text-sm text-text-secondary" >
                  <div className="flex mb-1"> <div className="w-15">Variant:</div> <Badge variant="outline" className="text-xs">{variant}</Badge> </div>
                  <div className="flex"> <div className="w-15">Size:</div> <Badge variant="outline" className="text-xs">{size}</Badge> </div>
                </div>
                <div className="w-70 flex gap-3 justify-center">
                  <Button size={size} variant={variant}> Button </Button>
                  <Button size={size} variant={variant}> <Play /> Button </Button>
                  <Button size={size} variant={variant}> <Play /> </Button>
                </div>
                <div className="w-70 flex gap-3 justify-center">
                  <Button size={size} variant={variant} danger> Button </Button>
                  <Button size={size} variant={variant} danger> <Play /> Button </Button>
                  <Button size={size} variant={variant} danger> <Play /> </Button>
                </div>
                <div className="w-70 flex gap-3 justify-center">
                  <Button size={size} variant={variant} disabled> Button </Button>
                  <Button size={size} variant={variant} disabled> <Play /> Button </Button>
                  <Button size={size} variant={variant} disabled> <Play /> </Button>
                </div>
              </div>
            ))}
          </div>
        ))}


      </div>
    </div>
  ),
  parameters: {
    layout: "centered",
  },
};
