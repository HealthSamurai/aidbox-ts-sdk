import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Folder, 
  Search, 
  Settings, 
  Home, 
  Mail, 
  Calendar, 
  User,
  Code,
  Terminal,
  Globe,
  Database,
  Layers,
  PlayCircle
} from 'lucide-react';

const meta: Meta<typeof ResizablePanelGroup> = {
  title: 'Components/Resizable',
  component: ResizablePanelGroup,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ResizablePanelGroup>;

export const Default: Story = {
  render: () => (
    <div className="h-[400px] w-full">
      <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">One</span>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">Two</span>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

export const WithHandle: Story = {
  render: () => (
    <div className="h-[400px] w-full">
      <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">One</span>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">Two</span>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="h-[400px] w-full">
      <ResizablePanelGroup direction="vertical" className="rounded-lg border">
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">Header</span>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">Content</span>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

export const ThreePanels: Story = {
  render: () => (
    <div className="h-[400px] w-full">
      <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
        <ResizablePanel defaultSize={25}>
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">Sidebar</span>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">Content</span>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={25}>
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">Details</span>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

export const NestedPanels: Story = {
  render: () => (
    <div className="h-[500px] w-full">
      <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
        <ResizablePanel defaultSize={30}>
          <div className="flex h-full items-center justify-center p-6">
            <span className="font-semibold">Sidebar</span>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={60}>
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-semibold">Main Content</span>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={40}>
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-semibold">Bottom Panel</span>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

export const CodeEditor: Story = {
  render: () => (
    <div className="h-[600px] w-full">
      <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
        {/* File Explorer */}
        <ResizablePanel defaultSize={20} minSize={15}>
          <Card className="h-full rounded-none border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Explorer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1 px-3">
                <div className="flex items-center gap-2 py-1 text-sm hover:bg-accent rounded-sm px-2">
                  <Folder className="h-4 w-4" />
                  src
                </div>
                <div className="flex items-center gap-2 py-1 text-sm hover:bg-accent rounded-sm px-2 ml-4">
                  <FileText className="h-4 w-4" />
                  App.tsx
                </div>
                <div className="flex items-center gap-2 py-1 text-sm hover:bg-accent rounded-sm px-2 ml-4">
                  <FileText className="h-4 w-4" />
                  index.tsx
                </div>
                <div className="flex items-center gap-2 py-1 text-sm hover:bg-accent rounded-sm px-2">
                  <FileText className="h-4 w-4" />
                  package.json
                </div>
              </div>
            </CardContent>
          </Card>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Main Editor Area */}
        <ResizablePanel defaultSize={60}>
          <ResizablePanelGroup direction="vertical">
            {/* Editor */}
            <ResizablePanel defaultSize={70}>
              <Card className="h-full rounded-none border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      App.tsx
                    </CardTitle>
                    <Badge variant="secondary">TypeScript</Badge>
                  </div>
                </CardHeader>
                <CardContent className="font-mono text-sm space-y-1">
                  <div className="text-muted-foreground">1</div>
                  <div>2  <span className="text-blue-600">import</span> React <span className="text-blue-600">from</span> <span className="text-green-600">'react'</span>;</div>
                  <div className="text-muted-foreground">3</div>
                  <div>4  <span className="text-blue-600">function</span> <span className="text-yellow-600">App</span>() &#123;</div>
                  <div>5    <span className="text-blue-600">return</span> (</div>
                  <div>6      &lt;<span className="text-red-600">div</span> <span className="text-blue-600">className</span>=<span className="text-green-600">"App"</span>&gt;</div>
                  <div>7        &lt;<span className="text-red-600">h1</span>&gt;Hello World&lt;/<span className="text-red-600">h1</span>&gt;</div>
                  <div>8      &lt;/<span className="text-red-600">div</span>&gt;</div>
                  <div>9    );</div>
                  <div>10 &#125;</div>
                </CardContent>
              </Card>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            {/* Terminal */}
            <ResizablePanel defaultSize={30} minSize={20}>
              <Card className="h-full rounded-none border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    Terminal
                  </CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-sm bg-black text-green-400 p-4">
                  <div>$ npm start</div>
                  <div className="text-blue-400">Compiled successfully!</div>
                  <div>Local: http://localhost:3000</div>
                  <div className="opacity-50">webpack compiled with 0 errors</div>
                  <div className="opacity-30">_</div>
                </CardContent>
              </Card>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Properties Panel */}
        <ResizablePanel defaultSize={20} minSize={15}>
          <Card className="h-full rounded-none border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Properties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Component</h4>
                <div className="text-sm text-muted-foreground">App</div>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Props</h4>
                <div className="space-y-1 text-sm">
                  <div>className: "App"</div>
                  <div>children: ReactNode</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

export const Dashboard: Story = {
  render: () => (
    <div className="h-[600px] w-full">
      <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
        {/* Navigation Sidebar */}
        <ResizablePanel defaultSize={15} minSize={12}>
          <Card className="h-full rounded-none border-0">
            <CardContent className="p-4">
              <nav className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" />
                  Users
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Database className="mr-2 h-4 w-4" />
                  Database
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Globe className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </nav>
            </CardContent>
          </Card>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Main Content Area */}
        <ResizablePanel defaultSize={65}>
          <ResizablePanelGroup direction="vertical">
            {/* Top Stats */}
            <ResizablePanel defaultSize={30}>
              <Card className="h-full rounded-none border-0">
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                  <CardDescription>Key metrics for your application</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">1,234</div>
                      <div className="text-sm text-muted-foreground">Total Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">5,678</div>
                      <div className="text-sm text-muted-foreground">Page Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">98.5%</div>
                      <div className="text-sm text-muted-foreground">Uptime</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            {/* Chart Area */}
            <ResizablePanel defaultSize={70}>
              <Card className="h-full rounded-none border-0">
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>Traffic and engagement metrics</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <div className="text-muted-foreground">
                    <Layers className="h-8 w-8 mx-auto mb-2" />
                    Chart visualization would go here
                  </div>
                </CardContent>
              </Card>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Activity Panel */}
        <ResizablePanel defaultSize={20} minSize={15}>
          <Card className="h-full rounded-none border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-full px-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500 rounded-full p-1">
                      <User className="h-3 w-3 text-white" />
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">New user registered</div>
                      <div className="text-muted-foreground">2 minutes ago</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-500 rounded-full p-1">
                      <PlayCircle className="h-3 w-3 text-white" />
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">Deployment successful</div>
                      <div className="text-muted-foreground">5 minutes ago</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-orange-500 rounded-full p-1">
                      <Mail className="h-3 w-3 text-white" />
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">Email campaign sent</div>
                      <div className="text-muted-foreground">1 hour ago</div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};