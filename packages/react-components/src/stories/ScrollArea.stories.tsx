import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Clock, 
  MessageCircle, 
  Star, 
  User, 
  FileText, 
  Image, 
  Video, 
  Music,
  Download,
  Eye,
  Heart,
  Share,
  MoreHorizontal
} from 'lucide-react';

const meta: Meta<typeof ScrollArea> = {
  title: 'Components/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-72 w-48 rounded-md border p-4">
      <div className="space-y-2">
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} className="text-sm">
            Item {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const WithSeparators: Story = {
  render: () => {
    const tags = Array.from({ length: 50 }, (_, i) => `Tag ${i + 1}`);
    
    return (
      <ScrollArea className="h-72 w-48 rounded-md border">
        <div className="p-4">
          <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
          {tags.map((tag, index) => (
            <React.Fragment key={tag}>
              <div className="text-sm">{tag}</div>
              {index < tags.length - 1 && <Separator className="my-2" />}
            </React.Fragment>
          ))}
        </div>
      </ScrollArea>
    );
  },
};

export const MessagesList: Story = {
  render: () => {
    const messages = [
      { id: 1, sender: 'Alice Johnson', message: 'Hey, how are you doing today?', time: '2 min ago', avatar: 'AJ' },
      { id: 2, sender: 'Bob Smith', message: 'Did you see the latest update?', time: '5 min ago', avatar: 'BS' },
      { id: 3, sender: 'Carol Davis', message: 'Meeting at 3 PM today', time: '10 min ago', avatar: 'CD' },
      { id: 4, sender: 'David Wilson', message: 'Great work on the project!', time: '15 min ago', avatar: 'DW' },
      { id: 5, sender: 'Emma Brown', message: 'Can you review my pull request?', time: '20 min ago', avatar: 'EB' },
      { id: 6, sender: 'Frank Miller', message: 'Coffee later?', time: '25 min ago', avatar: 'FM' },
      { id: 7, sender: 'Grace Taylor', message: 'The design looks amazing!', time: '30 min ago', avatar: 'GT' },
      { id: 8, sender: 'Henry Anderson', message: 'New features are ready for testing', time: '35 min ago', avatar: 'HA' },
      { id: 9, sender: 'Ivy Martinez', message: 'Happy birthday! 🎉', time: '40 min ago', avatar: 'IM' },
      { id: 10, sender: 'Jack Thompson', message: 'See you at the conference', time: '45 min ago', avatar: 'JT' },
    ];

    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
          </CardTitle>
          <CardDescription>Recent conversations</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-80">
            <div className="space-y-1 p-4">
              {messages.map((message, index) => (
                <div key={message.id}>
                  <div className="flex items-start gap-3 p-2 rounded-md hover:bg-accent transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{message.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{message.sender}</p>
                        <span className="text-xs text-muted-foreground">{message.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{message.message}</p>
                    </div>
                  </div>
                  {index < messages.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  },
};

export const FilesList: Story = {
  render: () => {
    const files = [
      { name: 'project-overview.pdf', size: '2.4 MB', type: 'pdf', modified: '2 hours ago', icon: FileText },
      { name: 'design-mockups.fig', size: '15.8 MB', type: 'design', modified: '4 hours ago', icon: Image },
      { name: 'presentation.pptx', size: '8.2 MB', type: 'presentation', modified: '1 day ago', icon: FileText },
      { name: 'demo-video.mp4', size: '125.6 MB', type: 'video', modified: '2 days ago', icon: Video },
      { name: 'background-music.mp3', size: '4.7 MB', type: 'audio', modified: '3 days ago', icon: Music },
      { name: 'requirements.docx', size: '1.2 MB', type: 'document', modified: '5 days ago', icon: FileText },
      { name: 'wireframes.sketch', size: '22.1 MB', type: 'design', modified: '1 week ago', icon: Image },
      { name: 'api-documentation.pdf', size: '3.8 MB', type: 'pdf', modified: '1 week ago', icon: FileText },
      { name: 'user-interviews.mov', size: '89.4 MB', type: 'video', modified: '2 weeks ago', icon: Video },
      { name: 'brand-assets.zip', size: '45.2 MB', type: 'archive', modified: '2 weeks ago', icon: FileText },
    ];

    return (
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Recent Files</CardTitle>
          <CardDescription>Your recently accessed files</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-80">
            <div className="space-y-1 p-4">
              {files.map((file, index) => (
                <div key={index}>
                  <div className="flex items-center gap-3 p-3 rounded-md hover:bg-accent transition-colors">
                    <file.icon className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{file.size}</span>
                        <span>•</span>
                        <span>{file.modified}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {index < files.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  },
};

export const NotificationsFeed: Story = {
  render: () => {
    const notifications = [
      { 
        id: 1, 
        type: 'like', 
        user: 'Sarah Wilson', 
        action: 'liked your post', 
        time: '2 min ago',
        icon: Heart,
        color: 'text-red-500'
      },
      { 
        id: 2, 
        type: 'comment', 
        user: 'Mike Johnson', 
        action: 'commented on your photo', 
        time: '5 min ago',
        icon: MessageCircle,
        color: 'text-blue-500'
      },
      { 
        id: 3, 
        type: 'follow', 
        user: 'Emily Davis', 
        action: 'started following you', 
        time: '10 min ago',
        icon: User,
        color: 'text-green-500'
      },
      { 
        id: 4, 
        type: 'share', 
        user: 'Alex Brown', 
        action: 'shared your article', 
        time: '15 min ago',
        icon: Share,
        color: 'text-purple-500'
      },
      { 
        id: 5, 
        type: 'like', 
        user: 'Jessica Martinez', 
        action: 'liked your comment', 
        time: '20 min ago',
        icon: Heart,
        color: 'text-red-500'
      },
      { 
        id: 6, 
        type: 'comment', 
        user: 'David Thompson', 
        action: 'replied to your comment', 
        time: '25 min ago',
        icon: MessageCircle,
        color: 'text-blue-500'
      },
      { 
        id: 7, 
        type: 'follow', 
        user: 'Lisa Anderson', 
        action: 'started following you', 
        time: '30 min ago',
        icon: User,
        color: 'text-green-500'
      },
      { 
        id: 8, 
        type: 'like', 
        user: 'Ryan Garcia', 
        action: 'liked your story', 
        time: '35 min ago',
        icon: Heart,
        color: 'text-red-500'
      },
    ];

    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Recent activity</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-80">
            <div className="space-y-1 p-4">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div className="flex items-start gap-3 p-3 rounded-md hover:bg-accent transition-colors">
                    <div className={`${notification.color} bg-background rounded-full p-2 border`}>
                      <notification.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{notification.user}</span>
                        {' '}
                        <span className="text-muted-foreground">{notification.action}</span>
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  },
};

export const HorizontalScroll: Story = {
  render: () => {
    const artworks = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      title: `Artwork ${i + 1}`,
      artist: `Artist ${i + 1}`,
      price: `$${(Math.random() * 1000 + 100).toFixed(0)}`,
    }));

    return (
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Featured Artworks</CardTitle>
          <CardDescription>Scroll horizontally to see more</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="flex w-max space-x-4 p-4">
              {artworks.map((artwork) => (
                <div key={artwork.id} className="shrink-0">
                  <div className="w-32 space-y-3">
                    <div className="aspect-square bg-gradient-to-br from-blue-400 to-purple-600 rounded-md flex items-center justify-center">
                      <Image className="h-8 w-8 text-white" />
                    </div>
                    <div className="space-y-1 text-sm">
                      <h4 className="font-medium truncate">{artwork.title}</h4>
                      <p className="text-muted-foreground truncate">{artwork.artist}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{artwork.price}</Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  },
};

export const CodeSnippet: Story = {
  render: () => {
    const code = `import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

function MyComponent() {
  const items = Array.from({ length: 100 }, (_, i) => \`Item \${i + 1}\`);
  
  return (
    <ScrollArea className="h-72 w-48 rounded-md border p-4">
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="text-sm">
            {item}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export default MyComponent;

// Usage example with custom styling
<ScrollArea className="h-[400px] w-full rounded-md border">
  <div className="p-4">
    {/* Your scrollable content here */}
  </div>
</ScrollArea>

// Horizontal scrolling
<ScrollArea className="w-full whitespace-nowrap rounded-md border">
  <div className="flex w-max space-x-4 p-4">
    {/* Your horizontal content here */}
  </div>
</ScrollArea>`;

    return (
      <Card className="w-[600px]">
        <CardHeader>
          <CardTitle>Code Example</CardTitle>
          <CardDescription>ScrollArea component usage</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80 w-full rounded-md border bg-muted/50">
            <pre className="p-4 text-sm">
              <code>{code}</code>
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  },
};
