import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { 
  Copy, 
  Scissors, 
  Clipboard, 
  Download, 
  Share, 
  Trash, 
  Edit, 
  Eye, 
  Folder, 
  FileText,
  Settings,
  Heart,
  Star,
  Bookmark
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuLabel,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';

const meta: Meta<typeof ContextMenu> = {
  title: 'Components/ContextMenu',
  component: ContextMenu,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ContextMenu>;

export const Default: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
        Right click here
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem inset>
          <Copy className="mr-2 h-4 w-4" />
          Copy
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset>
          <Scissors className="mr-2 h-4 w-4" />
          Cut
          <ContextMenuShortcut>⌘X</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset>
          <Clipboard className="mr-2 h-4 w-4" />
          Paste
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem inset>
          <Download className="mr-2 h-4 w-4" />
          Download
        </ContextMenuItem>
        <ContextMenuItem inset>
          <Share className="mr-2 h-4 w-4" />
          Share
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem inset variant="destructive">
          <Trash className="mr-2 h-4 w-4" />
          Delete
          <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const WithSubmenus: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
        Right click for submenu options
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem inset>
          <Eye className="mr-2 h-4 w-4" />
          View
        </ContextMenuItem>
        <ContextMenuItem inset>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger inset>
            <Share className="mr-2 h-4 w-4" />
            Share
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </ContextMenuItem>
            <ContextMenuItem>
              <FileText className="mr-2 h-4 w-4" />
              Email
            </ContextMenuItem>
            <ContextMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Export
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger inset>
            <Folder className="mr-2 h-4 w-4" />
            More Options
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Properties
            </ContextMenuItem>
            <ContextMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">
              <Trash className="mr-2 h-4 w-4" />
              Move to Trash
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const WithCheckboxes: Story = {
  render: () => {
    const [showBookmarks, setShowBookmarks] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [showDownloads, setShowDownloads] = useState(true);

    return (
      <ContextMenu>
        <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
          Right click for checkbox options
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuLabel inset>View Options</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuCheckboxItem
            checked={showBookmarks}
            onCheckedChange={setShowBookmarks}
          >
            <Bookmark className="mr-2 h-4 w-4" />
            Show Bookmarks
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem
            checked={showHistory}
            onCheckedChange={setShowHistory}
          >
            <FileText className="mr-2 h-4 w-4" />
            Show History
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem
            checked={showDownloads}
            onCheckedChange={setShowDownloads}
          >
            <Download className="mr-2 h-4 w-4" />
            Show Downloads
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuItem inset>
            <Settings className="mr-2 h-4 w-4" />
            Preferences
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  },
};

export const WithRadioGroup: Story = {
  render: () => {
    const [theme, setTheme] = useState('light');

    return (
      <ContextMenu>
        <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
          Right click for radio options
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuLabel inset>Theme Settings</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuRadioGroup value={theme} onValueChange={setTheme}>
            <ContextMenuRadioItem value="light">
              Light Theme
            </ContextMenuRadioItem>
            <ContextMenuRadioItem value="dark">
              Dark Theme
            </ContextMenuRadioItem>
            <ContextMenuRadioItem value="system">
              System Theme
            </ContextMenuRadioItem>
          </ContextMenuRadioGroup>
          <ContextMenuSeparator />
          <ContextMenuItem inset>
            <Settings className="mr-2 h-4 w-4" />
            Advanced Settings
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  },
};

export const FileManager: Story = {
  render: () => {
    const [favorites, setFavorites] = useState<string[]>(['document.pdf']);

    const toggleFavorite = (filename: string) => {
      setFavorites(prev => 
        prev.includes(filename) 
          ? prev.filter(f => f !== filename)
          : [...prev, filename]
      );
    };

    return (
      <div className="grid grid-cols-2 gap-4">
        {['document.pdf', 'image.jpg', 'spreadsheet.xlsx', 'presentation.pptx'].map((filename) => (
          <ContextMenu key={filename}>
            <ContextMenuTrigger className="flex h-[100px] w-[150px] flex-col items-center justify-center rounded-md border border-dashed text-sm hover:bg-muted/50">
              <FileText className="h-8 w-8 mb-2" />
              {filename}
            </ContextMenuTrigger>
            <ContextMenuContent className="w-64">
              <ContextMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                Open
                <ContextMenuShortcut>⌘O</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem>
                <Copy className="mr-2 h-4 w-4" />
                Copy
                <ContextMenuShortcut>⌘C</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem>
                <Scissors className="mr-2 h-4 w-4" />
                Cut
                <ContextMenuShortcut>⌘X</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuCheckboxItem
                checked={favorites.includes(filename)}
                onCheckedChange={() => toggleFavorite(filename)}
              >
                <Heart className="mr-2 h-4 w-4" />
                Add to Favorites
              </ContextMenuCheckboxItem>
              <ContextMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Properties
              </ContextMenuItem>
              <ContextMenuItem variant="destructive">
                <Trash className="mr-2 h-4 w-4" />
                Delete
                <ContextMenuShortcut>⌫</ContextMenuShortcut>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
    );
  },
};