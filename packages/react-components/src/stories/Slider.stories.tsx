import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

const meta: Meta<typeof Slider> = {
  title: 'Components/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  render: () => (
    <div className="w-[200px]">
      <Slider defaultValue={[50]} max={100} step={1} />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-[200px] space-y-3">
      <Label>Volume</Label>
      <Slider defaultValue={[25]} max={100} step={1} />
    </div>
  ),
};

export const Range: Story = {
  render: () => (
    <div className="w-[200px] space-y-3">
      <Label>Price Range</Label>
      <Slider defaultValue={[25, 75]} max={100} step={1} />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-[200px] space-y-3">
      <Label>Disabled Slider</Label>
      <Slider defaultValue={[50]} max={100} step={1} disabled />
    </div>
  ),
};