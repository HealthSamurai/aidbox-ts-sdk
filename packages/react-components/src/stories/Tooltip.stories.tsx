import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Plus, 
  Info, 
  Settings, 
  HelpCircle, 
  Copy, 
  Edit, 
  Trash,
  Download,
  Share,
  Heart,
  Star,
  Bookmark,
  MoreHorizontal,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

const meta: Meta<typeof Tooltip> = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Add to library</p>
      </TooltipContent>
    </Tooltip>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" variant="outline">
          <Plus className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Add new item</p>
      </TooltipContent>
    </Tooltip>
  ),
};

export const Positions: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 place-items-center">
      <div></div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Top</Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Tooltip on top</p>
        </TooltipContent>
      </Tooltip>
      <div></div>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Left</Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Tooltip on left</p>
        </TooltipContent>
      </Tooltip>
      <div></div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Right</Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Tooltip on right</p>
        </TooltipContent>
      </Tooltip>
      
      <div></div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Tooltip on bottom</p>
        </TooltipContent>
      </Tooltip>
      <div></div>
    </div>
  ),
};

export const ActionButtons: Story = {
  render: () => (
    <div className="flex gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline">
            <Edit className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Edit</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline">
            <Copy className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy to clipboard</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline">
            <Download className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Download file</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline">
            <Share className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Share</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline">
            <Trash className="h-4 w-4 text-destructive" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Delete permanently</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const WithKeyboardShortcuts: Story = {
  render: () => (
    <div className="flex gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline">
            <Copy className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-2">
            <span>Copy</span>
            <Badge variant="secondary" className="text-xs">⌘C</Badge>
          </div>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline">
            <Edit className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-2">
            <span>Edit</span>
            <Badge variant="secondary" className="text-xs">⌘E</Badge>
          </div>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline">
            <Settings className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-2">
            <span>Settings</span>
            <Badge variant="secondary" className="text-xs">⌘,</Badge>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const HelpIcons: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">API Key</label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>Your API key is used to authenticate requests. Keep it secure and don't share it publicly.</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Input placeholder="Enter your API key" />

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Webhook URL</label>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>The URL where we'll send webhook events. Must be a valid HTTPS URL.</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Input placeholder="https://example.com/webhook" />
    </div>
  ),
};

export const UserProfile: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Avatar className="cursor-pointer">
            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="space-y-1">
            <p className="font-medium">John Doe</p>
            <p className="text-xs text-muted-foreground">Software Developer</p>
            <div className="flex items-center gap-1 text-xs">
              <Mail className="h-3 w-3" />
              john@example.com
            </div>
          </div>
        </TooltipContent>
      </Tooltip>

      <div>
        <h3 className="font-medium">John Doe</h3>
        <p className="text-sm text-muted-foreground">Online</p>
      </div>
    </div>
  ),
};

export const InteractiveElements: Story = {
  render: () => (
    <div className="flex gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <Heart className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Like this post</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <Star className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add to favorites</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <Bookmark className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Save for later</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>More options</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const StatusIndicators: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">Operational</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">All systems operational</p>
            <p className="text-xs text-muted-foreground">Last updated: 2 minutes ago</p>
          </div>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm">Maintenance</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Scheduled maintenance</p>
            <p className="text-xs text-muted-foreground">Expected completion: 30 minutes</p>
          </div>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="h-3 w-3 bg-red-500 rounded-full"></div>
            <span className="text-sm">Incident</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Service disruption</p>
            <p className="text-xs text-muted-foreground">Investigating the issue</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const DetailedInfo: Story = {
  render: () => (
    <div className="space-y-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Team Meeting</h3>
              <Badge variant="secondary">Recurring</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Weekly sync meeting</p>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs" side="right">
          <div className="space-y-2">
            <h4 className="font-medium">Team Meeting Details</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>Every Monday</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>10:00 AM - 11:00 AM</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span>5 attendees</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                <span>Conference Room A</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};