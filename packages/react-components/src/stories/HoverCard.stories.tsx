import type { Meta, StoryObj } from '@storybook/react';
import { 
  CalendarDays, 
  MapPin, 
  Link as LinkIcon, 
  Github, 
  Twitter, 
  Mail, 
  Phone,
  Building,
  Star,
  Eye,
  GitFork,
  Users,
  Clock,
  TrendingUp
} from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const meta: Meta<typeof HoverCard> = {
  title: 'Components/HoverCard',
  component: HoverCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HoverCard>;

export const Default: Story = {
  render: () => (
    <div className="p-8">
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="link">@nextjs</Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="flex justify-between space-x-4">
            <Avatar>
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback>NJ</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">@nextjs</h4>
              <p className="text-sm">
                The React Framework – created and maintained by @vercel.
              </p>
              <div className="flex items-center pt-2">
                <CalendarDays className="mr-2 h-4 w-4 opacity-70" />
                <span className="text-xs text-muted-foreground">
                  Joined December 2021
                </span>
              </div>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  ),
};

export const UserProfile: Story = {
  render: () => (
    <div className="p-8 space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Hover over the user names to see their profiles:
      </p>
      <div className="space-y-2">
        {[
          { name: 'Sarah Chen', username: 'sarahc', role: 'Frontend Developer', company: 'Vercel' },
          { name: 'Alex Kumar', username: 'alexk', role: 'Full Stack Developer', company: 'GitHub' },
          { name: 'Maria Garcia', username: 'mariag', role: 'UI/UX Designer', company: 'Figma' },
        ].map((user) => (
          <div key={user.username} className="flex items-center space-x-2">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="link" className="p-0 h-auto font-semibold">
                  {user.name}
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="flex justify-between space-x-4">
                  <Avatar>
                    <AvatarImage src={`/placeholder-avatar-${user.username}.jpg`} />
                    <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-semibold">{user.name}</h4>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                    <p className="text-sm">{user.role}</p>
                    <div className="flex items-center pt-2">
                      <Building className="mr-2 h-4 w-4 opacity-70" />
                      <span className="text-xs text-muted-foreground">
                        {user.company}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <CalendarDays className="mr-2 h-4 w-4 opacity-70" />
                      <span className="text-xs text-muted-foreground">
                        Joined March 2023
                      </span>
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
            <span className="text-sm text-muted-foreground">mentioned you in a comment</span>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const GitHubRepository: Story = {
  render: () => (
    <div className="p-8">
      <p className="text-sm text-muted-foreground mb-4">
        Hover over repository links to see details:
      </p>
      <div className="space-y-4">
        {[
          { 
            name: 'shadcn/ui', 
            description: 'Beautifully designed components built with Radix UI and Tailwind CSS.',
            stars: 45200,
            forks: 2800,
            language: 'TypeScript',
            updated: '2 hours ago'
          },
          { 
            name: 'vercel/next.js', 
            description: 'The React Framework',
            stars: 118000,
            forks: 25300,
            language: 'JavaScript',
            updated: '5 minutes ago'
          },
        ].map((repo) => (
          <div key={repo.name}>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="link" className="p-0 h-auto">
                  <Github className="mr-2 h-4 w-4" />
                  {repo.name}
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-96">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold flex items-center">
                        <Github className="mr-2 h-4 w-4" />
                        {repo.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {repo.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3" />
                      <span className="text-xs">{repo.stars.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <GitFork className="h-3 w-3" />
                      <span className="text-xs">{repo.forks.toLocaleString()}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {repo.language}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    Updated {repo.updated}
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const ContactCard: Story = {
  render: () => (
    <div className="p-8">
      <p className="text-sm text-muted-foreground mb-4">
        Hover over team member names:
      </p>
      <div className="grid grid-cols-2 gap-4">
        {[
          {
            name: 'John Smith',
            role: 'Product Manager',
            email: 'john.smith@company.com',
            phone: '+1 (555) 123-4567',
            location: 'San Francisco, CA',
            avatar: 'JS'
          },
          {
            name: 'Emma Wilson',
            role: 'Lead Designer',
            email: 'emma.wilson@company.com',
            phone: '+1 (555) 987-6543',
            location: 'New York, NY',
            avatar: 'EW'
          },
        ].map((contact) => (
          <div key={contact.name} className="p-4 border rounded-lg">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="ghost" className="p-0 h-auto">
                  <Avatar className="mr-3 h-10 w-10">
                    <AvatarFallback>{contact.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">{contact.role}</p>
                  </div>
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{contact.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{contact.name}</h4>
                      <p className="text-sm text-muted-foreground">{contact.role}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 opacity-70" />
                      <span className="text-sm">{contact.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 opacity-70" />
                      <span className="text-sm">{contact.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 opacity-70" />
                      <span className="text-sm">{contact.location}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      <Mail className="mr-2 h-4 w-4" />
                      Email
                    </Button>
                    <Button size="sm" variant="secondary" className="flex-1">
                      <Phone className="mr-2 h-4 w-4" />
                      Call
                    </Button>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const LinkPreview: Story = {
  render: () => (
    <div className="p-8 max-w-2xl">
      <div className="space-y-4">
        <p className="text-sm">
          Check out this amazing article about{' '}
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="link" className="p-0 h-auto text-blue-600">
                React Server Components
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-96">
              <div className="space-y-3">
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 opacity-50" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Understanding React Server Components</h4>
                  <p className="text-sm text-muted-foreground">
                    A comprehensive guide to React Server Components, how they work, 
                    and how to implement them in your Next.js applications.
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <LinkIcon className="h-3 w-3" />
                    <span>reactblog.com</span>
                    <span>•</span>
                    <Eye className="h-3 w-3" />
                    <span>12k views</span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          {' '}and how it's changing the way we build web applications.
        </p>
        
        <p className="text-sm">
          Also, don't miss this great tutorial on{' '}
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="link" className="p-0 h-auto text-blue-600">
                Advanced TypeScript Patterns
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-96">
              <div className="space-y-3">
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">TS</span>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Advanced TypeScript Patterns</h4>
                  <p className="text-sm text-muted-foreground">
                    Learn advanced TypeScript patterns including conditional types, 
                    mapped types, and template literal types with practical examples.
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <LinkIcon className="h-3 w-3" />
                      <span>typescript.dev</span>
                    </div>
                    <Badge>New</Badge>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          {' '}for better type safety.
        </p>
      </div>
    </div>
  ),
};