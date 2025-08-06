import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Menu, User, SettingsIcon, Bell, MapPin, ShoppingCart as ShoppingCartIcon, Plus, Minus } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const meta: Meta<typeof Drawer> = {
  title: 'Components/Drawer',
  component: Drawer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Drawer>;

export const Default: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary">Open Drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Drawer Title</DrawerTitle>
          <DrawerDescription>
            This is a basic drawer example. You can add any content here.
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 pb-0">
          <p className="text-sm text-muted-foreground">
            This is the main content area of the drawer. You can place forms, 
            navigation, or any other content here.
          </p>
        </div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const MobileNavigation: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary" size="icon">
          <Menu className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Navigation</DrawerTitle>
          <DrawerDescription>
            Navigate to different sections of the app
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <MapPin className="mr-2 h-4 w-4" />
              Location
            </Button>
          </div>
          <Separator />
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start">
              Help & Support
            </Button>
            <Button variant="ghost" className="w-full justify-start text-destructive">
              Sign Out
            </Button>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="secondary">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const ShoppingCart: Story = {
  render: () => {
    const [items, setItems] = useState([
      { id: 1, name: 'Wireless Headphones', price: 99.99, quantity: 1 },
      { id: 2, name: 'Phone Case', price: 24.99, quantity: 2 },
      { id: 3, name: 'USB Cable', price: 12.99, quantity: 1 },
    ]);

    const updateQuantity = (id: number, change: number) => {
      setItems(prev => prev.map(item => 
        item.id === id 
          ? { ...item, quantity: Math.max(0, item.quantity + change) }
          : item
      ).filter(item => item.quantity > 0));
    };

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button>
            <ShoppingCartIcon className="mr-2 h-4 w-4" />
            Cart ({items.length})
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Shopping Cart</DrawerTitle>
            <DrawerDescription>
              Review your items before checkout
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between space-x-4">
                <div className="flex-1">
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">${item.price}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          <DrawerFooter>
            <Button className="w-full">Proceed to Checkout</Button>
            <DrawerClose asChild>
              <Button variant="secondary">Continue Shopping</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  },
};

export const UserProfile: Story = {
  render: () => {
    const [profile, setProfile] = useState({
      name: 'John Doe',
      email: 'john.doe@example.com',
      bio: 'Software developer passionate about creating great user experiences.',
    });

    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="secondary">
            <User className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Profile</DrawerTitle>
            <DrawerDescription>
              Update your profile information
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-6">
            <div className="flex justify-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button>Save Changes</Button>
            <DrawerClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  },
};

export const FromRight: Story = {
  render: () => (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="secondary">Open from Right</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Side Panel</DrawerTitle>
          <DrawerDescription>
            This drawer slides in from the right side
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 flex-1">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Quick Actions</h4>
              <div className="space-y-1">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  Create New Document
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  Upload File
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  Share Link
                </Button>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium">Recent Activity</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Document edited 2 minutes ago</p>
                <p>File uploaded 1 hour ago</p>
                <p>Link shared yesterday</p>
              </div>
            </div>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="secondary">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const FromTop: Story = {
  render: () => (
    <Drawer direction="top">
      <DrawerTrigger asChild>
        <Button variant="secondary">Open from Top</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Top Notification</DrawerTitle>
          <DrawerDescription>
            This drawer slides down from the top
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">New Update Available</h4>
                <p className="text-sm text-blue-800 mt-1">
                  Version 2.0 is now available with new features and improvements.
                </p>
                <div className="flex space-x-2 mt-3">
                  <Button size="sm">Update Now</Button>
                  <Button variant="secondary" size="sm">Learn More</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="secondary">Dismiss</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};