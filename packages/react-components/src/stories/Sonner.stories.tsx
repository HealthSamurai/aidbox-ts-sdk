import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sonner } from '@/components/ui/sonner';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Info, 
  Bell,
  Download,
  Upload,
  Save,
  Trash,
  Mail,
  Settings,
  User,
  Heart,
  Star,
  MessageCircle
} from 'lucide-react';

const meta: Meta<typeof Sonner> = {
  title: 'Components/Sonner',
  component: Sonner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div>
        <Story />
        <Sonner />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Sonner>;

export const Default: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast('Event has been created', {
          description: 'Sunday, December 03, 2023 at 9:00 AM',
          action: {
            label: 'Undo',
            onClick: () => console.log('Undo'),
          },
        })
      }
    >
      Show Toast
    </Button>
  ),
};

export const Types: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() => toast.success('Successfully saved!')}
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.error('Something went wrong!')}
      >
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.warning('Please check your input')}
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.info('New update available')}
      >
        Info
      </Button>
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast.success('Profile updated', {
            description: 'Your profile has been successfully updated.',
          })
        }
      >
        Success with Description
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error('Failed to upload', {
            description: 'The file size exceeds the maximum limit of 10MB.',
          })
        }
      >
        Error with Description
      </Button>
    </div>
  ),
};

export const WithActions: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast('File deleted', {
            description: 'Your file has been moved to trash.',
            action: {
              label: 'Undo',
              onClick: () => toast.success('File restored!'),
            },
          })
        }
      >
        With Action
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast('New message received', {
            description: 'You have a new message from John Doe.',
            action: {
              label: 'View',
              onClick: () => toast.info('Opening message...'),
            },
          })
        }
      >
        Message Action
      </Button>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast.success('Download completed', {
            description: 'Your file has been downloaded successfully.',
            icon: <Download className="h-4 w-4" />,
          })
        }
      >
        Custom Success Icon
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error('Upload failed', {
            description: 'Failed to upload file. Please try again.',
            icon: <Upload className="h-4 w-4" />,
          })
        }
      >
        Custom Error Icon
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast('New notification', {
            description: 'You have 3 unread notifications.',
            icon: <Bell className="h-4 w-4" />,
          })
        }
      >
        Custom Icon
      </Button>
    </div>
  ),
};

export const Duration: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast('Short message', {
            duration: 1000,
          })
        }
      >
        1 Second
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast('Medium message', {
            duration: 5000,
          })
        }
      >
        5 Seconds
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast('Persistent message', {
            duration: Infinity,
            action: {
              label: 'Dismiss',
              onClick: () => {},
            },
          })
        }
      >
        Persistent
      </Button>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() => {
          const id = toast.loading('Uploading file...');
          
          setTimeout(() => {
            toast.success('File uploaded successfully!', { id });
          }, 2000);
        }}
      >
        Loading → Success
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          const id = toast.loading('Processing payment...');
          
          setTimeout(() => {
            toast.error('Payment failed. Please try again.', { id });
          }, 2000);
        }}
      >
        Loading → Error
      </Button>
    </div>
  ),
};

export const Promise: Story = {
  render: () => {
    const saveData = () => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          Math.random() > 0.5 ? resolve('Data saved!') : reject('Failed to save');
        }, 2000);
      });
    };

    return (
      <Button
        variant="outline"
        onClick={() =>
          toast.promise(saveData, {
            loading: 'Saving data...',
            success: 'Data saved successfully!',
            error: 'Failed to save data',
          })
        }
      >
        Promise Toast
      </Button>
    );
  },
};

export const ApplicationExamples: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Application Actions</CardTitle>
        <CardDescription>Common toast notifications in applications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.success('Settings saved', {
                description: 'Your preferences have been updated.',
                icon: <Settings className="h-4 w-4" />,
              })
            }
          >
            <Settings className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast('Profile updated', {
                description: 'Your profile information has been updated.',
                icon: <User className="h-4 w-4" />,
                action: {
                  label: 'View',
                  onClick: () => toast.info('Opening profile...'),
                },
              })
            }
          >
            <User className="h-4 w-4 mr-2" />
            Update Profile
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.success('Email sent', {
                description: 'Your message has been delivered.',
                icon: <Mail className="h-4 w-4" />,
              })
            }
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast('Item deleted', {
                description: 'The item has been moved to trash.',
                icon: <Trash className="h-4 w-4" />,
                action: {
                  label: 'Undo',
                  onClick: () => toast.success('Item restored'),
                },
              })
            }
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete Item
          </Button>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast('Added to favorites', {
                icon: <Heart className="h-4 w-4 text-red-500" />,
              })
            }
          >
            <Heart className="h-4 w-4 mr-2" />
            Like
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast('Added to bookmarks', {
                icon: <Star className="h-4 w-4 text-yellow-500" />,
              })
            }
          >
            <Star className="h-4 w-4 mr-2" />
            Bookmark
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast('Message sent', {
                description: 'Your comment has been posted.',
                icon: <MessageCircle className="h-4 w-4" />,
              })
            }
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Comment
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const id = toast.loading('Processing...');
              setTimeout(() => {
                toast.success('Action completed!', { id });
              }, 1500);
            }}
          >
            Process
          </Button>
        </div>
      </CardContent>
    </Card>
  ),
};

export const FormSubmission: Story = {
  render: () => {
    const handleSubmit = (event: React.FormEvent) => {
      event.preventDefault();
      
      const id = toast.loading('Submitting form...');
      
      // Simulate form submission
      setTimeout(() => {
        const success = Math.random() > 0.3;
        
        if (success) {
          toast.success('Form submitted successfully!', {
            id,
            description: 'Thank you for your submission.',
            action: {
              label: 'View',
              onClick: () => toast.info('Opening submission...'),
            },
          });
        } else {
          toast.error('Failed to submit form', {
            id,
            description: 'Please check your input and try again.',
            action: {
              label: 'Retry',
              onClick: () => handleSubmit(event),
            },
          });
        }
      }, 2000);
    };

    return (
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Contact Form</CardTitle>
          <CardDescription>Submit the form to see toast notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input placeholder="Your name" required />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="your@email.com" required />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea placeholder="Your message..." required />
            </div>
            
            <Button type="submit" className="w-full">
              Submit Form
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  },
};

export const MultipleToasts: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() => {
          toast.success('First notification');
          setTimeout(() => toast.info('Second notification'), 500);
          setTimeout(() => toast.warning('Third notification'), 1000);
        }}
      >
        Multiple Sequential
      </Button>
      
      <Button
        variant="outline"
        onClick={() => {
          toast.success('Success message');
          toast.error('Error message');
          toast.info('Info message');
          toast.warning('Warning message');
        }}
      >
        Multiple Simultaneous
      </Button>
      
      <Button
        variant="outline"
        onClick={() => toast.dismiss()}
      >
        Dismiss All
      </Button>
    </div>
  ),
};