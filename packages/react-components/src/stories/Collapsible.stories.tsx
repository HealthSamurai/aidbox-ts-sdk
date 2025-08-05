import type { Meta, StoryObj } from '@storybook/react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const meta: Meta<typeof Collapsible> = {
  title: 'Components/Collapsible',
  component: Collapsible,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[350px] space-y-2">
        <div className="flex items-center justify-between space-x-4 px-4">
          <h4 className="text-sm font-semibold">
            @peduarte starred 3 repositories
          </h4>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="rounded-md border px-4 py-3 font-mono text-sm">
          @radix-ui/primitives
        </div>
        <CollapsibleContent className="space-y-2">
          <div className="rounded-md border px-4 py-3 font-mono text-sm">
            @radix-ui/colors
          </div>
          <div className="rounded-md border px-4 py-3 font-mono text-sm">
            @stitches/react
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
};

export const WithCard: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <Card className="w-[400px]">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email notifications</span>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Privacy settings</span>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Two-factor authentication</span>
                  <Button variant="outline" size="sm">Setup</Button>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  },
};

export const FAQ: Story = {
  render: () => {
    const [openItems, setOpenItems] = useState<string[]>([]);
    
    const toggleItem = (item: string) => {
      setOpenItems(prev => 
        prev.includes(item) 
          ? prev.filter(i => i !== item)
          : [...prev, item]
      );
    };

    const faqItems = [
      {
        id: 'item-1',
        question: 'What is your return policy?',
        answer: 'We offer a 30-day return policy for all items. Items must be in their original condition and packaging.'
      },
      {
        id: 'item-2',
        question: 'How long does shipping take?',
        answer: 'Standard shipping takes 3-5 business days. Express shipping is available for 1-2 business days.'
      },
      {
        id: 'item-3',
        question: 'Do you ship internationally?',
        answer: 'Yes, we ship to most countries worldwide. International shipping rates and delivery times vary by location.'
      }
    ];
    
    return (
      <div className="w-[500px] space-y-2">
        <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
        {faqItems.map((item) => (
          <Collapsible 
            key={item.id}
            open={openItems.includes(item.id)} 
            onOpenChange={() => toggleItem(item.id)}
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-4 text-left hover:bg-muted/50">
              <span className="font-medium">{item.question}</span>
              {openItems.includes(item.id) ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4 pt-2">
              <p className="text-sm text-muted-foreground">{item.answer}</p>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    );
  },
};