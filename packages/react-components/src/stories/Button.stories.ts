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
    children: "Button"
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Button"
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    children: "Button"
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Button"
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Button"
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Button"
  },
};
