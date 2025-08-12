import type { Meta, StoryObj } from "@storybook/react";
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarInset,
  SidebarSeparator,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Home,
  Inbox,
  Calendar,
  Search,
  Settings,
  User,
  Mail,
  Bell,
  FileText,
  Users,
  BarChart3,
  Plus,
  ChevronRight,
  MoreHorizontal,
  ChevronDown,
  Archive,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const meta: Meta<typeof Sidebar> = {
  title: "Components/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

// Sample data for the stories
const mainMenuItems = [{ title: "Home", url: "#", icon: Home }];

const projectItems = [
  { title: "Resources", url: "#", icon: Inbox },
  { title: "REST Console", url: "#", icon: Calendar },
  { title: "DB Console", url: "#", icon: Search },
  { title: "Notebooks", url: "#", icon: Settings },
];

const teamItems = [
  { title: "API", url: "#", icon: Users },
  { title: "Database", url: "#", icon: Mail },
  { title: "IAM", url: "#", icon: Bell },
  { title: "FHIR Artefact Registry", url: "#", icon: Users },
  { title: "Plugins", url: "#", icon: Mail },
  { title: "Settings", url: "#", icon: Bell },
];

export const AidboxSidebar: Story = {
  render: () => (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.title === "Home"}
                      >
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {projectItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                      {item.badge && (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {teamItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                      {item.badge && (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </div>
    </SidebarProvider>
  ),
};

// Basic Sidebar Story
export const Default: Story = {
  render: () => (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <h2 className="text-lg font-semibold">My App</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Application</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                      {item.badge && (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm">John Doe</span>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
              <div className="aspect-video rounded-xl bg-muted/50 p-4">
                <h3 className="font-medium">Content Area</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  This is the main content area. The sidebar can be toggled
                  using the button in the header.
                </p>
              </div>
              <div className="aspect-video rounded-xl bg-muted/50 p-4">
                <h3 className="font-medium">Card 2</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Another content card
                </p>
              </div>
              <div className="aspect-video rounded-xl bg-muted/50 p-4">
                <h3 className="font-medium">Card 3</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Yet another content card
                </p>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  ),
};

// Collapsible Icon Sidebar
export const CollapsibleIcon: Story = {
  render: () => (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader className="p-4">
            <h2 className="text-lg font-semibold truncate">My App</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">Icon Sidebar Demo</h1>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4">
            <div className="rounded-xl bg-muted/50 p-6">
              <h3 className="font-medium mb-2">Collapsible Icon Sidebar</h3>
              <p className="text-sm text-muted-foreground">
                This sidebar collapses to show only icons. Hover over the icons
                to see tooltips with the full labels.
              </p>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  ),
};

// Floating Variant
export const FloatingVariant: Story = {
  render: () => (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar variant="floating">
          <SidebarHeader className="p-4">
            <h2 className="text-lg font-semibold">Floating Sidebar</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.title === "Home"}
                      >
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">Floating Sidebar</h1>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4">
            <div className="rounded-xl bg-muted/50 p-6">
              <h3 className="font-medium mb-2">Floating Style</h3>
              <p className="text-sm text-muted-foreground">
                This sidebar has a floating style with rounded corners and
                shadow.
              </p>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  ),
};

// Complex Sidebar with Multiple Groups and Actions
export const ComplexSidebar: Story = {
  render: () => (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BarChart3 className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-semibold">Dashboard</h2>
            </div>
          </SidebarHeader>

          <SidebarContent>
            {/* Main Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.title === "Home"}
                      >
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                      {item.badge && (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction showOnHover>
                            <MoreHorizontal />
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuItem>
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <span>Share</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Projects Section */}
            <SidebarGroup>
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {projectItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                      <SidebarMenuAction>
                        <Plus />
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Teams Section */}
            <SidebarGroup>
              <SidebarGroupLabel>Teams</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {teamItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton>
                      <User />
                      John Doe
                      <ChevronDown className="ml-auto" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    className="w-[--radix-popper-anchor-width]"
                  >
                    <DropdownMenuItem>
                      <span>Account</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span>Billing</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">Complex Sidebar Demo</h1>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl bg-muted/50 p-6">
                <h3 className="font-medium mb-2">Multiple Groups</h3>
                <p className="text-sm text-muted-foreground">
                  Sidebar with multiple grouped sections
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 p-6">
                <h3 className="font-medium mb-2">Menu Actions</h3>
                <p className="text-sm text-muted-foreground">
                  Interactive menu items with dropdown actions
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 p-6">
                <h3 className="font-medium mb-2">User Menu</h3>
                <p className="text-sm text-muted-foreground">
                  Footer with user dropdown menu
                </p>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  ),
};

// Sidebar with Submenus
export const WithSubmenus: Story = {
  render: () => (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <h2 className="text-lg font-semibold">Navigation</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="#">
                        <Home />
                        <span>Dashboard</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <Collapsible defaultOpen className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <Mail />
                          <span>Mail</span>
                          <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <a href="#">
                                <Inbox />
                                <span>Inbox</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <a href="#">
                                <Archive />
                                <span>Archive</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <a href="#">
                                <Trash2 />
                                <span>Trash</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>

                  <Collapsible className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <Settings />
                          <span>Settings</span>
                          <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <a href="#">
                                <User />
                                <span>Profile</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <a href="#">
                                <Bell />
                                <span>Notifications</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="#">
                        <Search />
                        <span>Search</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">Collapsible Submenus</h1>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4">
            <div className="rounded-xl bg-muted/50 p-6">
              <h3 className="font-medium mb-2">Collapsible Navigation</h3>
              <p className="text-sm text-muted-foreground">
                Some menu items have expandable submenus with additional
                navigation options.
              </p>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  ),
};

// Loading State with Skeletons
export const LoadingState: Story = {
  render: () => (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <h2 className="text-lg font-semibold">Loading...</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuSkeleton showIcon />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            <SidebarGroup>
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuSkeleton showIcon />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">Loading State</h1>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4">
            <div className="rounded-xl bg-muted/50 p-6">
              <h3 className="font-medium mb-2">Loading Skeletons</h3>
              <p className="text-sm text-muted-foreground">
                This shows how the sidebar looks while content is loading using
                skeleton components.
              </p>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  ),
};
