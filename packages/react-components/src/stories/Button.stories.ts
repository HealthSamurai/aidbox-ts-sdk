import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@/components/ui/button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean'
    }
  },
  args: {
    children: 'Button'
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "default",
    children: "Button",
    disabled: false
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Button",
    disabled: false
  },
};


export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Button",
    disabled: false
  },
};

export const Tertiary: Story = {
  args: {
    variant: "tertiary",
    children: "Button",
    disabled: false
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    children: "Button",
    disabled: false
  },
};
