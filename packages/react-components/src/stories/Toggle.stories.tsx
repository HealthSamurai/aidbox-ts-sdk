import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Toggle } from '@/components/ui/toggle';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Star,
  Heart,
  Bookmark,
  ThumbsUp,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Shuffle,
  Repeat,
  Grid,
  List,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  Bell,
  BellOff
} from 'lucide-react';

const meta: Meta<typeof Toggle> = {
  title: 'Components/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  render: () => (
    <Toggle aria-label="Toggle italic">
      <Italic className="h-4 w-4" />
    </Toggle>
  ),
};

export const WithText: Story = {
  render: () => (
    <Toggle aria-label="Toggle bold">
      <Bold className="mr-2 h-4 w-4" />
      Bold
    </Toggle>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Toggle variant="default" aria-label="Bold">
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle variant="outline" aria-label="Italic">
        <Italic className="h-4 w-4" />
      </Toggle>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Toggle size="sm" aria-label="Small toggle">
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle size="default" aria-label="Default toggle">
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle size="lg" aria-label="Large toggle">
        <Bold className="h-4 w-4" />
      </Toggle>
    </div>
  ),
};

export const TextFormatting: Story = {
  render: () => {
    const [bold, setBold] = useState(false);
    const [italic, setItalic] = useState(false);
    const [underline, setUnderline] = useState(false);

    return (
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Text Formatting</CardTitle>
          <CardDescription>Toggle text formatting options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-1">
            <Toggle pressed={bold} onPressedChange={setBold} aria-label="Bold">
              <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle pressed={italic} onPressedChange={setItalic} aria-label="Italic">
              <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle pressed={underline} onPressedChange={setUnderline} aria-label="Underline">
              <Underline className="h-4 w-4" />
            </Toggle>
          </div>
          
          <Separator />
          
          <div className="p-4 border rounded-md min-h-[100px]">
            <p 
              className={`${bold ? 'font-bold' : ''} ${italic ? 'italic' : ''} ${underline ? 'underline' : ''}`}
            >
              This is a preview of your text formatting. The text will update based on your toggle selections.
            </p>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Active: {[bold && 'Bold', italic && 'Italic', underline && 'Underline'].filter(Boolean).join(', ') || 'None'}
          </div>
        </CardContent>
      </Card>
    );
  },
};

export const TextAlignment: Story = {
  render: () => {
    const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left');

    return (
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Text Alignment</CardTitle>
          <CardDescription>Choose text alignment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-1">
            <Toggle 
              pressed={alignment === 'left'} 
              onPressedChange={() => setAlignment('left')}
              aria-label="Align left"
            >
              <AlignLeft className="h-4 w-4" />
            </Toggle>
            <Toggle 
              pressed={alignment === 'center'} 
              onPressedChange={() => setAlignment('center')}
              aria-label="Align center"
            >
              <AlignCenter className="h-4 w-4" />
            </Toggle>
            <Toggle 
              pressed={alignment === 'right'} 
              onPressedChange={() => setAlignment('right')}
              aria-label="Align right"
            >
              <AlignRight className="h-4 w-4" />
            </Toggle>
          </div>
          
          <Separator />
          
          <div className="p-4 border rounded-md">
            <p className={`text-${alignment}`}>
              This text will be aligned based on your selection. Choose left, center, or right alignment using the toggles above.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  },
};

export const MediaControls: Story = {
  render: () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isShuffled, setIsShuffled] = useState(false);
    const [isRepeating, setIsRepeating] = useState(false);

    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle>Media Player</CardTitle>
          <CardDescription>Control your media playback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Toggle 
              pressed={isShuffled} 
              onPressedChange={setIsShuffled}
              variant="outline"
              size="sm"
              aria-label="Shuffle"
            >
              <Shuffle className="h-4 w-4" />
            </Toggle>
            
            <Toggle 
              pressed={isPlaying} 
              onPressedChange={setIsPlaying}
              variant="outline"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Toggle>
            
            <Toggle 
              pressed={isRepeating} 
              onPressedChange={setIsRepeating}
              variant="outline"
              size="sm"
              aria-label="Repeat"
            >
              <Repeat className="h-4 w-4" />
            </Toggle>
          </div>
          
          <div className="flex items-center justify-center">
            <Toggle 
              pressed={isMuted} 
              onPressedChange={setIsMuted}
              variant="outline"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Toggle>
          </div>
          
          <Separator />
          
          <div className="text-center text-sm text-muted-foreground">
            <div>Status: {isPlaying ? 'Playing' : 'Paused'}</div>
            <div>Volume: {isMuted ? 'Muted' : 'On'}</div>
            <div>Mode: {isShuffled ? 'Shuffle' : 'Normal'} {isRepeating ? '• Repeat' : ''}</div>
          </div>
        </CardContent>
      </Card>
    );
  },
};

export const ViewModes: Story = {
  render: () => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle>View Mode</CardTitle>
          <CardDescription>Switch between grid and list view</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-1">
            <Toggle 
              pressed={viewMode === 'grid'} 
              onPressedChange={() => setViewMode('grid')}
              variant="outline"
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4 mr-2" />
              Grid
            </Toggle>
            <Toggle 
              pressed={viewMode === 'list'} 
              onPressedChange={() => setViewMode('list')}
              variant="outline"
              aria-label="List view"
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Toggle>
          </div>
          
          <Separator />
          
          <div className="p-4 border rounded-md min-h-[120px]">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="aspect-square bg-muted rounded-md flex items-center justify-center text-xs">
                    Item {i + 1}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-muted rounded-md">
                    <div className="w-8 h-8 bg-background rounded"></div>
                    <span className="text-sm">Item {i + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  },
};

export const SocialActions: Story = {
  render: () => {
    const [liked, setLiked] = useState(false);
    const [starred, setStarred] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [upvoted, setUpvoted] = useState(false);

    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle>Social Actions</CardTitle>
          <CardDescription>Interact with content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Toggle 
              pressed={liked} 
              onPressedChange={setLiked}
              variant="outline"
              aria-label="Like"
            >
              <Heart className={`h-4 w-4 mr-2 ${liked ? 'fill-current text-red-500' : ''}`} />
              Like
            </Toggle>
            
            <Toggle 
              pressed={starred} 
              onPressedChange={setStarred}
              variant="outline"
              aria-label="Star"
            >
              <Star className={`h-4 w-4 mr-2 ${starred ? 'fill-current text-yellow-500' : ''}`} />
              Star
            </Toggle>
          </div>
          
          <div className="flex gap-2">
            <Toggle 
              pressed={bookmarked} 
              onPressedChange={setBookmarked}
              variant="outline"
              aria-label="Bookmark"
            >
              <Bookmark className={`h-4 w-4 mr-2 ${bookmarked ? 'fill-current text-blue-500' : ''}`} />
              Save
            </Toggle>
            
            <Toggle 
              pressed={upvoted} 
              onPressedChange={setUpvoted}
              variant="outline"
              aria-label="Upvote"
            >
              <ThumbsUp className={`h-4 w-4 mr-2 ${upvoted ? 'fill-current text-green-500' : ''}`} />
              Upvote
            </Toggle>
          </div>
          
          <Separator />
          
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>Likes: {liked ? '1' : '0'}</div>
            <div>Stars: {starred ? '1' : '0'}</div>
            <div>Saves: {bookmarked ? '1' : '0'}</div>
            <div>Upvotes: {upvoted ? '1' : '0'}</div>
          </div>
        </CardContent>
      </Card>
    );
  },
};

export const SettingsToggles: Story = {
  render: () => {
    const [notifications, setNotifications] = useState(true);
    const [visible, setVisible] = useState(false);
    const [locked, setLocked] = useState(false);
    const [wifi, setWifi] = useState(true);

    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Configure your preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Notifications</Label>
              </div>
              <Toggle 
                pressed={notifications} 
                onPressedChange={setNotifications}
                variant="outline"
                aria-label="Toggle notifications"
              >
                {notifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </Toggle>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Visibility</Label>
              </div>
              <Toggle 
                pressed={visible} 
                onPressedChange={setVisible}
                variant="outline"
                aria-label="Toggle visibility"
              >
                {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Toggle>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Lock Screen</Label>
              </div>
              <Toggle 
                pressed={locked} 
                onPressedChange={setLocked}
                variant="outline"
                aria-label="Toggle lock"
              >
                {locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </Toggle>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>WiFi</Label>
              </div>
              <Toggle 
                pressed={wifi} 
                onPressedChange={setWifi}
                variant="outline"
                aria-label="Toggle WiFi"
              >
                {wifi ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              </Toggle>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Toggle aria-label="Bold" disabled>
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle aria-label="Italic" disabled pressed>
        <Italic className="h-4 w-4" />
      </Toggle>
    </div>
  ),
};