import type { Meta, StoryObj } from '@storybook/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Info, Star, User, Mail, Phone, MapPin } from 'lucide-react';

const meta: Meta<typeof Label> = {
  title: 'Components/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="Enter your email" />
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="space-y-6 w-[300px]">
      <div className="space-y-2">
        <Label htmlFor="user">
          <User className="h-4 w-4" />
          Username
        </Label>
        <Input id="user" placeholder="Enter username" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email-icon">
          <Mail className="h-4 w-4" />
          Email Address
        </Label>
        <Input id="email-icon" type="email" placeholder="user@example.com" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">
          <Phone className="h-4 w-4" />
          Phone Number
        </Label>
        <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
      </div>
    </div>
  ),
};

export const WithBadges: Story = {
  render: () => (
    <div className="space-y-6 w-[300px]">
      <div className="space-y-2">
        <Label htmlFor="required-field">
          Full Name
          <Badge variant="destructive" className="text-xs">Required</Badge>
        </Label>
        <Input id="required-field" placeholder="John Doe" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="optional-field">
          Company
          <Badge variant="secondary" className="text-xs">Optional</Badge>
        </Label>
        <Input id="optional-field" placeholder="Acme Inc." />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="premium-field">
          Priority Support
          <Badge variant="default" className="text-xs">
            <Star className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </Label>
        <Input id="premium-field" placeholder="Support ticket priority" />
      </div>
    </div>
  ),
};

export const FormControls: Story = {
  render: () => (
    <div className="space-y-6 w-[400px]">
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" placeholder="Type your message here..." />
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <Label htmlFor="terms" className="text-sm font-normal">
            I agree to the terms and conditions
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox id="newsletter" />
          <Label htmlFor="newsletter" className="text-sm font-normal">
            Subscribe to our newsletter
          </Label>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch id="notifications" />
        <Label htmlFor="notifications">
          Enable push notifications
        </Label>
      </div>
    </div>
  ),
};

export const WithHelperText: Story = {
  render: () => (
    <div className="space-y-6 w-[400px]">
      <div className="space-y-2">
        <Label htmlFor="password">
          Password
          <Badge variant="secondary" className="text-xs">Min 8 characters</Badge>
        </Label>
        <Input id="password" type="password" placeholder="Enter password" />
        <p className="text-xs text-muted-foreground">
          Must contain at least 8 characters with numbers and special characters.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="bio">
          Bio
          <span className="text-xs text-muted-foreground ml-auto">0/280</span>
        </Label>
        <Textarea 
          id="bio" 
          placeholder="Tell us about yourself..." 
          className="resize-none"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          A brief description that will appear on your profile.
        </p>
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="space-y-6 w-[300px]">
      <div className="space-y-2">
        <Label htmlFor="normal">Normal State</Label>
        <Input id="normal" placeholder="Normal input" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="disabled" className="opacity-50">
          Disabled State
        </Label>
        <Input id="disabled" placeholder="Disabled input" disabled />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="error" className="text-destructive">
          <AlertCircle className="h-4 w-4" />
          Error State
        </Label>
        <Input 
          id="error" 
          placeholder="Error input" 
          className="border-destructive focus-visible:ring-destructive"
        />
        <p className="text-xs text-destructive">This field is required.</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="success" className="text-green-600">
          Success State
        </Label>
        <Input 
          id="success" 
          placeholder="Success input" 
          className="border-green-500 focus-visible:ring-green-500"
          defaultValue="Valid input"
        />
        <p className="text-xs text-green-600">Looks good!</p>
      </div>
    </div>
  ),
};

export const ComplexForm: Story = {
  render: () => (
    <Card className="w-[500px]">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your account details and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first-name">
              First Name
              <Badge variant="destructive" className="text-xs">Required</Badge>
            </Label>
            <Input id="first-name" placeholder="John" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last-name">
              Last Name
              <Badge variant="destructive" className="text-xs">Required</Badge>
            </Label>
            <Input id="last-name" placeholder="Doe" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email-complex">
            <Mail className="h-4 w-4" />
            Email Address
            <Badge variant="destructive" className="text-xs">Required</Badge>
          </Label>
          <Input id="email-complex" type="email" placeholder="john.doe@example.com" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">
            <MapPin className="h-4 w-4" />
            Location
            <Badge variant="secondary" className="text-xs">Optional</Badge>
          </Label>
          <Input id="location" placeholder="San Francisco, CA" />
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <Label className="text-base font-semibold">Preferences</Label>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="marketing" />
              <Label htmlFor="marketing" className="text-sm font-normal">
                Send me marketing emails
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="updates" defaultChecked />
              <Label htmlFor="updates" className="text-sm font-normal">
                Send me product updates
              </Label>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">
                Enable dark mode
              </Label>
              <Switch id="dark-mode" />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="secondary">Cancel</Button>
          <Button>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  ),
};