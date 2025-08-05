import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  Grid,
  Calendar,
  ChevronLeft,
  ChevronRight,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Type,
  Image,
  Video,
  Mic
} from 'lucide-react';

const meta: Meta<typeof ToggleGroup> = {
  title: 'Components/ToggleGroup',
  component: ToggleGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

export const Default: Story = {
  render: () => (
    <ToggleGroup type="multiple">
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <Bold className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <Italic className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Toggle underline">
        <Underline className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Single: Story = {
  render: () => (
    <ToggleGroup type="single" defaultValue="center">
      <ToggleGroupItem value="left" aria-label="Left aligned">
        <AlignLeft className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Center aligned">
        <AlignCenter className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Right aligned">
        <AlignRight className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Outline: Story = {
  render: () => (
    <ToggleGroup type="single" variant="outline" defaultValue="list">
      <ToggleGroupItem value="list" aria-label="List view">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="grid" aria-label="Grid view">
        <Grid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="calendar" aria-label="Calendar view">
        <Calendar className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 text-sm font-medium">Small</h4>
        <ToggleGroup type="single" size="sm" variant="outline">
          <ToggleGroupItem value="bold">
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic">
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline">
            <Underline className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      <div>
        <h4 className="mb-2 text-sm font-medium">Default</h4>
        <ToggleGroup type="single" variant="outline">
          <ToggleGroupItem value="bold">
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic">
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline">
            <Underline className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      <div>
        <h4 className="mb-2 text-sm font-medium">Large</h4>
        <ToggleGroup type="single" size="lg" variant="outline">
          <ToggleGroupItem value="bold">
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic">
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline">
            <Underline className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  ),
};

export const TextEditor: Story = {
  render: () => {
    const [formatting, setFormatting] = useState<string[]>([]);
    const [alignment, setAlignment] = useState('left');

    return (
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Text Editor</CardTitle>
          <CardDescription>Format and align your text</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Formatting</label>
            <ToggleGroup 
              type="multiple" 
              variant="outline" 
              value={formatting} 
              onValueChange={setFormatting}
            >
              <ToggleGroupItem value="bold" aria-label="Bold">
                <Bold className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Italic">
                <Italic className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="underline" aria-label="Underline">
                <Underline className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Alignment</label>
            <ToggleGroup 
              type="single" 
              variant="outline" 
              value={alignment} 
              onValueChange={(value) => value && setAlignment(value)}
            >
              <ToggleGroupItem value="left" aria-label="Left align">
                <AlignLeft className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label="Center align">
                <AlignCenter className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="Right align">
                <AlignRight className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          <Separator />
          
          <div className="p-4 border rounded-md min-h-[100px]">
            <p 
              className={`
                ${formatting.includes('bold') ? 'font-bold' : ''} 
                ${formatting.includes('italic') ? 'italic' : ''} 
                ${formatting.includes('underline') ? 'underline' : ''} 
                text-${alignment}
              `}
            >
              This is a preview of your text. The formatting and alignment will update based on your selections.
            </p>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <div>Formatting: {formatting.length ? formatting.join(', ') : 'None'}</div>
            <div>Alignment: {alignment}</div>
          </div>
        </CardContent>
      </Card>
    );
  },
};

export const MediaPlayer: Story = {
  render: () => {
    const [playbackState, setPlaybackState] = useState('pause');
    const [volume, setVolume] = useState('medium');

    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle>Media Player</CardTitle>
          <CardDescription>Control your media playback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Playback Controls</label>
            <ToggleGroup 
              type="single" 
              variant="outline" 
              value={playbackState} 
              onValueChange={(value) => value && setPlaybackState(value)}
            >
              <ToggleGroupItem value="previous" aria-label="Previous">
                <SkipBack className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="play" aria-label="Play">
                <Play className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="pause" aria-label="Pause">
                <Pause className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="next" aria-label="Next">
                <SkipForward className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Volume</label>
            <ToggleGroup 
              type="single" 
              variant="outline" 
              value={volume} 
              onValueChange={(value) => value && setVolume(value)}
            >
              <ToggleGroupItem value="mute" aria-label="Mute">
                <VolumeX className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="low" aria-label="Low volume">
                <Volume1 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="medium" aria-label="Medium volume">
                <Volume2 className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          <Separator />
          
          <div className="text-center text-sm text-muted-foreground">
            <div>Status: {playbackState}</div>
            <div>Volume: {volume}</div>
          </div>
        </CardContent>
      </Card>
    );
  },
};

export const ThemeSelector: Story = {
  render: () => {
    const [theme, setTheme] = useState('system');

    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle>Theme Selector</CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleGroup 
            type="single" 
            variant="outline" 
            value={theme} 
            onValueChange={(value) => value && setTheme(value)}
          >
            <ToggleGroupItem value="light" aria-label="Light theme">
              <Sun className="h-4 w-4 mr-2" />
              Light
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" aria-label="Dark theme">
              <Moon className="h-4 w-4 mr-2" />
              Dark
            </ToggleGroupItem>
            <ToggleGroupItem value="system" aria-label="System theme">
              <Laptop className="h-4 w-4 mr-2" />
              System
            </ToggleGroupItem>
          </ToggleGroup>
          
          <Separator />
          
          <div className="text-sm text-muted-foreground">
            Current theme: <span className="font-medium">{theme}</span>
          </div>
        </CardContent>
      </Card>
    );
  },
};

export const DeviceSelector: Story = {
  render: () => {
    const [devices, setDevices] = useState<string[]>(['desktop']);

    return (
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Device Preview</CardTitle>
          <CardDescription>Select devices to preview your design</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleGroup 
            type="multiple" 
            variant="outline" 
            value={devices} 
            onValueChange={setDevices}
          >
            <ToggleGroupItem value="mobile" aria-label="Mobile">
              <Smartphone className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="tablet" aria-label="Tablet">
              <Tablet className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="desktop" aria-label="Desktop">
              <Monitor className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Active previews:</div>
            <div className="flex flex-wrap gap-1">
              {devices.length > 0 ? devices.map(device => (
                <span key={device} className="inline-flex items-center px-2 py-1 bg-muted rounded-md text-xs">
                  {device}
                </span>
              )) : (
                <span className="text-sm text-muted-foreground">None selected</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
};

export const ContentTypes: Story = {
  render: () => {
    const [contentTypes, setContentTypes] = useState<string[]>(['text']);

    return (
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Content Filter</CardTitle>
          <CardDescription>Filter content by type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleGroup 
            type="multiple" 
            variant="outline" 
            value={contentTypes} 
            onValueChange={setContentTypes}
          >
            <ToggleGroupItem value="text" aria-label="Text content">
              <Type className="h-4 w-4 mr-2" />
              Text
            </ToggleGroupItem>
            <ToggleGroupItem value="image" aria-label="Image content">
              <Image className="h-4 w-4 mr-2" />
              Images
            </ToggleGroupItem>
            <ToggleGroupItem value="video" aria-label="Video content">
              <Video className="h-4 w-4 mr-2" />
              Videos
            </ToggleGroupItem>
            <ToggleGroupItem value="audio" aria-label="Audio content">
              <Mic className="h-4 w-4 mr-2" />
              Audio
            </ToggleGroupItem>
          </ToggleGroup>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Showing content types:</div>
            <div className="text-sm text-muted-foreground">
              {contentTypes.length > 0 ? contentTypes.join(', ') : 'None selected'}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
};

export const Navigation: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = useState('2');

    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle>Page Navigation</CardTitle>
          <CardDescription>Navigate between pages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleGroup 
            type="single" 
            variant="outline" 
            value={currentPage} 
            onValueChange={(value) => value && setCurrentPage(value)}
          >
            <ToggleGroupItem value="prev" aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="1" aria-label="Page 1">
              1
            </ToggleGroupItem>
            <ToggleGroupItem value="2" aria-label="Page 2">
              2
            </ToggleGroupItem>
            <ToggleGroupItem value="3" aria-label="Page 3">
              3
            </ToggleGroupItem>
            <ToggleGroupItem value="next" aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          
          <Separator />
          
          <div className="text-center text-sm text-muted-foreground">
            Current page: {currentPage}
          </div>
        </CardContent>
      </Card>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <ToggleGroup type="multiple" variant="outline" disabled>
      <ToggleGroupItem value="bold" aria-label="Bold">
        <Bold className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Italic">
        <Italic className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Underline">
        <Underline className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};