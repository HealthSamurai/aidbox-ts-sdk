import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Settings, 
  User, 
  Bell, 
  HelpCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  Mail, 
  Phone,
  Info,
  Star,
  Heart,
  Share,
  Bookmark,
  MoreHorizontal
} from 'lucide-react';

const meta: Meta<typeof Popover> = {
  title: 'Components/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <p className="text-sm text-muted-foreground">
              Set the dimensions for the layer.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                defaultValue="100%"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxWidth">Max. width</Label>
              <Input
                id="maxWidth"
                defaultValue="300px"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                defaultValue="25px"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxHeight">Max. height</Label>
              <Input
                id="maxHeight"
                defaultValue="none"
                className="col-span-2 h-8"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const UserProfile: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex gap-4">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">@johndoe</h4>
            <p className="text-sm">
              The React Framework – created and maintained by @vercel.
            </p>
            <div className="flex items-center pt-2">
              <Calendar className="mr-2 h-4 w-4 opacity-70" />
              <span className="text-xs text-muted-foreground">
                Joined December 2021
              </span>
            </div>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="flex justify-between">
          <div className="text-center">
            <div className="text-lg font-semibold">1,337</div>
            <div className="text-xs text-muted-foreground">Following</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">12.5K</div>
            <div className="text-xs text-muted-foreground">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">242</div>
            <div className="text-xs text-muted-foreground">Posts</div>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">Follow</Button>
          <Button size="sm" variant="outline">Message</Button>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const NotificationSettings: Story = {
  render: () => {
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [smsNotifications, setSmsNotifications] = useState(true);

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Notification Settings</h4>
              <p className="text-sm text-muted-foreground">
                Manage how you receive notifications.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Email notifications</div>
                  <div className="text-xs text-muted-foreground">
                    Receive notifications via email
                  </div>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Push notifications</div>
                  <div className="text-xs text-muted-foreground">
                    Receive push notifications on your device
                  </div>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">SMS notifications</div>
                  <div className="text-xs text-muted-foreground">
                    Receive notifications via SMS
                  </div>
                </div>
                <Switch
                  checked={smsNotifications}
                  onCheckedChange={setSmsNotifications}
                />
              </div>
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button size="sm">Save changes</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  },
};

export const QuickActions: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="grid gap-1">
          <Button variant="ghost" className="justify-start" size="sm">
            <Heart className="mr-2 h-4 w-4" />
            Like
          </Button>
          <Button variant="ghost" className="justify-start" size="sm">
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="ghost" className="justify-start" size="sm">
            <Bookmark className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Separator className="my-1" />
          <Button variant="ghost" className="justify-start" size="sm">
            <Info className="mr-2 h-4 w-4" />
            Details
          </Button>
          <Button variant="ghost" className="justify-start text-destructive" size="sm">
            <Star className="mr-2 h-4 w-4" />
            Report
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const ContactForm: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Contact Us</Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Get in touch</CardTitle>
            <CardDescription>
              We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Tell us what you're thinking about..."
                className="resize-none"
                rows={3}
              />
            </div>
            <Button className="w-full">Send message</Button>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  ),
};

export const EventDetails: Story = {
  render: () => (
    <div className="flex gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Team Meeting</Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Team Meeting</h4>
              <Badge variant="secondary" className="mt-1">Recurring</Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>10:00 AM - 11:00 AM</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Every Monday</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Conference Room A</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>John Doe, Jane Smith, +3 others</span>
              </div>
            </div>
            <Separator />
            <div>
              <h5 className="font-medium mb-2">Description</h5>
              <p className="text-sm text-muted-foreground">
                Weekly team sync to discuss project progress, blockers, and upcoming priorities.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">Join Meeting</Button>
              <Button size="sm" variant="outline">Edit</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

export const HelpTooltip: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Label htmlFor="api-key">API Key</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-4 w-4">
            <HelpCircle className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72">
          <div className="space-y-2">
            <h4 className="font-medium">API Key Information</h4>
            <p className="text-sm text-muted-foreground">
              Your API key is used to authenticate requests to our service. Keep it secure and don't share it publicly.
            </p>
            <div className="space-y-1 text-xs">
              <div className="font-medium">Best practices:</div>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                <li>Store it in environment variables</li>
                <li>Rotate keys regularly</li>
                <li>Use different keys for different environments</li>
                <li>Monitor usage for unusual activity</li>
              </ul>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Input id="api-key" type="password" placeholder="Enter your API key" />
    </div>
  ),
};