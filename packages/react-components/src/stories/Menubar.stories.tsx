import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { 
  File, 
  FileText, 
  Folder, 
  Save, 
  SaveAll, 
  Printer, 
  Copy, 
  Scissors, 
  Clipboard, 
  Undo, 
  Redo, 
  Search, 
  Replace, 
  Zap, 
  Eye, 
  EyeOff, 
  Grid, 
  List, 
  SettingsIcon, 
  HelpCircle, 
  Info, 
  Download, 
  Upload,
  Palette,
  Monitor,
  Sun,
  Moon
} from 'lucide-react';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
} from '@/components/ui/menubar';

const meta: Meta<typeof Menubar> = {
  title: 'Components/Menubar',
  component: Menubar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Menubar>;

export const Default: Story = {
  render: () => (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <FileText className="mr-2 h-4 w-4" />
            New File
            <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            <Folder className="mr-2 h-4 w-4" />
            Open
            <MenubarShortcut>⌘O</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            <Save className="mr-2 h-4 w-4" />
            Save
            <MenubarShortcut>⌘S</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            <SaveAll className="mr-2 h-4 w-4" />
            Save All
            <MenubarShortcut>⌘⇧S</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <Undo className="mr-2 h-4 w-4" />
            Undo
            <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            <Redo className="mr-2 h-4 w-4" />
            Redo
            <MenubarShortcut>⌘⇧Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            <Scissors className="mr-2 h-4 w-4" />
            Cut
            <MenubarShortcut>⌘X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            <Copy className="mr-2 h-4 w-4" />
            Copy
            <MenubarShortcut>⌘C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            <Clipboard className="mr-2 h-4 w-4" />
            Paste
            <MenubarShortcut>⌘V</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <HelpCircle className="mr-2 h-4 w-4" />
            Documentation
          </MenubarItem>
          <MenubarItem>
            <Info className="mr-2 h-4 w-4" />
            About
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
};

export const TextEditor: Story = {
  render: () => {
    const [theme, setTheme] = useState('light');
    const [showLineNumbers, setShowLineNumbers] = useState(true);
    const [showSidebar, setShowSidebar] = useState(false);
    const [viewMode, setViewMode] = useState('editor');

    return (
      <div className="w-full max-w-4xl">
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                <FileText className="mr-2 h-4 w-4" />
                New File
                <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                <Folder className="mr-2 h-4 w-4" />
                Open File
                <MenubarShortcut>⌘O</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                <Download className="mr-2 h-4 w-4" />
                Open Folder
                <MenubarShortcut>⌘⇧O</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <Save className="mr-2 h-4 w-4" />
                Save
                <MenubarShortcut>⌘S</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                <SaveAll className="mr-2 h-4 w-4" />
                Save As...
                <MenubarShortcut>⌘⇧S</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </MenubarItem>
              <MenubarItem>
                <Download className="mr-2 h-4 w-4" />
                Export
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <Printer className="mr-2 h-4 w-4" />
                Print
                <MenubarShortcut>⌘P</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                <Undo className="mr-2 h-4 w-4" />
                Undo
                <MenubarShortcut>⌘Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                <Redo className="mr-2 h-4 w-4" />
                Redo
                <MenubarShortcut>⌘⇧Z</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <Scissors className="mr-2 h-4 w-4" />
                Cut
                <MenubarShortcut>⌘X</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                <Copy className="mr-2 h-4 w-4" />
                Copy
                <MenubarShortcut>⌘C</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                <Clipboard className="mr-2 h-4 w-4" />
                Paste
                <MenubarShortcut>⌘V</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <Search className="mr-2 h-4 w-4" />
                Find
                <MenubarShortcut>⌘F</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                <Replace className="mr-2 h-4 w-4" />
                Replace
                <MenubarShortcut>⌘⇧F</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem
                checked={showSidebar}
                onCheckedChange={setShowSidebar}
              >
                Show Sidebar
                <MenubarShortcut>⌘B</MenubarShortcut>
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                checked={showLineNumbers}
                onCheckedChange={setShowLineNumbers}
              >
                Show Line Numbers
              </MenubarCheckboxItem>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>
                  <Palette className="mr-2 h-4 w-4" />
                  Theme
                </MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarRadioGroup value={theme} onValueChange={setTheme}>
                    <MenubarRadioItem value="light">
                      <Sun className="mr-2 h-4 w-4" />
                      Light
                    </MenubarRadioItem>
                    <MenubarRadioItem value="dark">
                      <Moon className="mr-2 h-4 w-4" />
                      Dark
                    </MenubarRadioItem>
                    <MenubarRadioItem value="system">
                      <Monitor className="mr-2 h-4 w-4" />
                      System
                    </MenubarRadioItem>
                  </MenubarRadioGroup>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSeparator />
              <MenubarRadioGroup value={viewMode} onValueChange={setViewMode}>
                <MenubarRadioItem value="editor">
                  <FileText className="mr-2 h-4 w-4" />
                  Editor
                </MenubarRadioItem>
                <MenubarRadioItem value="preview">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </MenubarRadioItem>
                <MenubarRadioItem value="split">
                  <Grid className="mr-2 h-4 w-4" />
                  Split View
                </MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
          
          <MenubarMenu>
            <MenubarTrigger>Tools</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                <Zap className="mr-2 h-4 w-4" />
                Command Palette
                <MenubarShortcut>⌘⇧P</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <SettingsIcon className="mr-2 h-4 w-4" />
                Preferences
                <MenubarShortcut>⌘,</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          
          <MenubarMenu>
            <MenubarTrigger>Help</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                Documentation
              </MenubarItem>
              <MenubarItem>
                <Search className="mr-2 h-4 w-4" />
                Keyboard Shortcuts
                <MenubarShortcut>⌘/</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <Info className="mr-2 h-4 w-4" />
                About
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        
        {/* Status display */}
        <div className="mt-4 p-4 bg-muted rounded-md text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Current Settings:</strong>
              <ul className="mt-2 space-y-1">
                <li>Theme: {theme}</li>
                <li>View Mode: {viewMode}</li>
                <li>Sidebar: {showSidebar ? 'Visible' : 'Hidden'}</li>
                <li>Line Numbers: {showLineNumbers ? 'Shown' : 'Hidden'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const SimpleApplication: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>App</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <Info className="mr-2 h-4 w-4" />
              About App
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <SettingsIcon className="mr-2 h-4 w-4" />
              Preferences
              <MenubarShortcut>⌘,</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem variant="destructive">
              Quit App
              <MenubarShortcut>⌘Q</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              New
              <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Open
              <MenubarShortcut>⌘O</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              Save
              <MenubarShortcut>⌘S</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Save As...
              <MenubarShortcut>⌘⇧S</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              Undo
              <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Redo
              <MenubarShortcut>⌘⇧Z</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              Cut
              <MenubarShortcut>⌘X</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Copy
              <MenubarShortcut>⌘C</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Paste
              <MenubarShortcut>⌘V</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
};

export const WithLabels: Story = {
  render: () => (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarLabel>Create</MenubarLabel>
          <MenubarItem>
            <FileText className="mr-2 h-4 w-4" />
            New Document
          </MenubarItem>
          <MenubarItem>
            <Folder className="mr-2 h-4 w-4" />
            New Folder
          </MenubarItem>
          <MenubarSeparator />
          <MenubarLabel>Open</MenubarLabel>
          <MenubarItem>
            <File className="mr-2 h-4 w-4" />
            Open File
          </MenubarItem>
          <MenubarItem>
            <Folder className="mr-2 h-4 w-4" />
            Open Folder
          </MenubarItem>
          <MenubarSeparator />
          <MenubarLabel>Recent</MenubarLabel>
          <MenubarItem>document.txt</MenubarItem>
          <MenubarItem>project.json</MenubarItem>
          <MenubarItem>notes.md</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarLabel>Layout</MenubarLabel>
          <MenubarItem>
            <Grid className="mr-2 h-4 w-4" />
            Grid View
          </MenubarItem>
          <MenubarItem>
            <List className="mr-2 h-4 w-4" />
            List View
          </MenubarItem>
          <MenubarSeparator />
          <MenubarLabel>Show/Hide</MenubarLabel>
          <MenubarCheckboxItem checked>
            <Eye className="mr-2 h-4 w-4" />
            Toolbar
          </MenubarCheckboxItem>
          <MenubarCheckboxItem>
            <EyeOff className="mr-2 h-4 w-4" />
            Status Bar
          </MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
};