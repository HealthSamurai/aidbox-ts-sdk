import type { Meta, StoryObj } from '@storybook/react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const meta: Meta<typeof AspectRatio> = {
  title: 'Components/AspectRatio',
  component: AspectRatio,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AspectRatio>;

export const Square: Story = {
  render: () => (
    <div className="w-[450px]">
      <AspectRatio ratio={1 / 1} className="bg-muted">
        <img
          src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
          alt="Photo by Drew Beamer"
          className="rounded-md object-cover w-full h-full"
        />
      </AspectRatio>
    </div>
  ),
};

export const Video: Story = {
  render: () => (
    <div className="w-[450px]">
      <AspectRatio ratio={16 / 9} className="bg-muted">
        <img
          src="https://images.unsplash.com/photo-1576075796033-848c2a5a3e13?w=800&dpr=2&q=80"
          alt="Photo by Alvaro Pinot"
          className="rounded-md object-cover w-full h-full"
        />
      </AspectRatio>
    </div>
  ),
};

export const Portrait: Story = {
  render: () => (
    <div className="w-[300px]">
      <AspectRatio ratio={3 / 4} className="bg-muted">
        <img
          src="https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=800&dpr=2&q=80"
          alt="Photo by Tobias Tullius"
          className="rounded-md object-cover w-full h-full"
        />
      </AspectRatio>
    </div>
  ),
};

export const WithPlaceholder: Story = {
  render: () => (
    <div className="w-[450px]">
      <AspectRatio ratio={16 / 9} className="bg-muted rounded-md">
        <div className="flex items-center justify-center w-full h-full text-sm text-muted-foreground">
          16:9 Aspect Ratio
        </div>
      </AspectRatio>
    </div>
  ),
};

export const MultipleRatios: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">1:1 (Square)</h3>
        <div className="w-[200px]">
          <AspectRatio ratio={1 / 1} className="bg-muted rounded-md">
            <div className="flex items-center justify-center w-full h-full text-xs text-muted-foreground">
              1:1
            </div>
          </AspectRatio>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">16:9 (Video)</h3>
        <div className="w-[300px]">
          <AspectRatio ratio={16 / 9} className="bg-muted rounded-md">
            <div className="flex items-center justify-center w-full h-full text-xs text-muted-foreground">
              16:9
            </div>
          </AspectRatio>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">4:3 (Classic)</h3>
        <div className="w-[300px]">
          <AspectRatio ratio={4 / 3} className="bg-muted rounded-md">
            <div className="flex items-center justify-center w-full h-full text-xs text-muted-foreground">
              4:3
            </div>
          </AspectRatio>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">3:4 (Portrait)</h3>
        <div className="w-[200px]">
          <AspectRatio ratio={3 / 4} className="bg-muted rounded-md">
            <div className="flex items-center justify-center w-full h-full text-xs text-muted-foreground">
              3:4
            </div>
          </AspectRatio>
        </div>
      </div>
    </div>
  ),
};