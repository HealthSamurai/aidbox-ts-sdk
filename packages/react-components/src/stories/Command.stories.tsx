import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Calculator, Calendar, CreditCard, Settings, Smile, User } from 'lucide-react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@/components/ui/command';
import { Button } from '@/components/ui/button';

const meta: Meta<typeof Command> = {
  title: 'Components/Command',
  component: Command,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Command>;

export const Default: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md max-w-[450px]">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Calendar</span>
          </CommandItem>
          <CommandItem>
            <Smile className="mr-2 h-4 w-4" />
            <span>Search Emoji</span>
          </CommandItem>
          <CommandItem>
            <Calculator className="mr-2 h-4 w-4" />
            <span>Calculator</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const Dialog: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <p className="text-sm text-muted-foreground mb-4">
          Press{' '}
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </p>
        <Button onClick={() => setOpen(true)}>Open Command Dialog</Button>
        <CommandDialog 
          open={open} 
          onOpenChange={setOpen}
          title="Command Palette"
          description="Type a command or search..."
        >
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem onSelect={() => setOpen(false)}>
                <Calendar className="mr-2 h-4 w-4" />
                <span>Calendar</span>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <Smile className="mr-2 h-4 w-4" />
                <span>Search Emoji</span>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <Calculator className="mr-2 h-4 w-4" />
                <span>Calculator</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem onSelect={() => setOpen(false)}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </>
    );
  },
};

export const WithActions: Story = {
  render: () => {
    const [selectedAction, setSelectedAction] = useState<string>('');

    const actions = [
      { id: 'new-file', label: 'New File', shortcut: '⌘N', icon: User },
      { id: 'open-file', label: 'Open File', shortcut: '⌘O', icon: Calendar },
      { id: 'save-file', label: 'Save File', shortcut: '⌘S', icon: Settings },
      { id: 'save-as', label: 'Save As...', shortcut: '⌘⇧S', icon: CreditCard },
      { id: 'close-file', label: 'Close File', shortcut: '⌘W', icon: Calculator },
    ];

    return (
      <div className="space-y-4">
        <Command className="rounded-lg border shadow-md max-w-[450px]">
          <CommandInput placeholder="Search actions..." />
          <CommandList>
            <CommandEmpty>No actions found.</CommandEmpty>
            <CommandGroup heading="File Actions">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.id}
                    onSelect={() => setSelectedAction(action.label)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{action.label}</span>
                    <CommandShortcut>{action.shortcut}</CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        {selectedAction && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">
              Selected action: <strong>{selectedAction}</strong>
            </p>
          </div>
        )}
      </div>
    );
  },
};

export const SearchResults: Story = {
  render: () => {
    const files = [
      { name: 'index.tsx', path: 'src/pages/index.tsx', type: 'React Component' },
      { name: 'layout.tsx', path: 'src/components/layout.tsx', type: 'React Component' },
      { name: 'utils.ts', path: 'src/lib/utils.ts', type: 'TypeScript' },
      { name: 'globals.css', path: 'src/styles/globals.css', type: 'CSS' },
      { name: 'package.json', path: 'package.json', type: 'Configuration' },
    ];

    const commands = [
      { name: 'Open Terminal', description: 'Open integrated terminal' },
      { name: 'Git: Clone', description: 'Clone a repository' },
      { name: 'Format Document', description: 'Format the current document' },
      { name: 'Toggle Sidebar', description: 'Show/hide the sidebar' },
    ];

    return (
      <Command className="rounded-lg border shadow-md max-w-[500px]">
        <CommandInput placeholder="Search files and commands..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Files">
            {files.map((file) => (
              <CommandItem key={file.path} value={file.name}>
                <div className="flex flex-col">
                  <span className="font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{file.path}</span>
                </div>
                <div className="ml-auto">
                  <span className="text-xs bg-muted px-2 py-1 rounded">{file.type}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Commands">
            {commands.map((command) => (
              <CommandItem key={command.name} value={command.name}>
                <div className="flex flex-col">
                  <span className="font-medium">{command.name}</span>
                  <span className="text-xs text-muted-foreground">{command.description}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    );
  },
};