import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Typography component for demonstration
const Typography = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>;
};

const meta: Meta<typeof Typography> = {
  title: 'Components/Typography',
  component: Typography,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Typography>;

export const Headings: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-2xl">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
        Heading 1
      </h1>
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Heading 2
      </h2>
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
        Heading 3
      </h3>
      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
        Heading 4
      </h4>
      <h5 className="scroll-m-20 text-lg font-semibold tracking-tight">
        Heading 5
      </h5>
      <h6 className="scroll-m-20 text-base font-semibold tracking-tight">
        Heading 6
      </h6>
    </div>
  ),
};

export const Paragraph: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-2xl">
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        The king, seeing how much happier his subjects were, realized the
        importance of their happiness and resolved to be a more thoughtful
        leader. From that day forward, he made sure to consider the needs of
        his people in every decision he made.
      </p>
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        This is another paragraph with some <strong>bold text</strong> and{' '}
        <em>italic text</em>. You can also have{' '}
        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
          inline code
        </code>{' '}
        within paragraphs.
      </p>
    </div>
  ),
};

export const Blockquote: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <blockquote className="mt-6 border-l-2 pl-6 italic">
        "After all," he said, "everyone enjoys a good joke, so it's only fair
        that they should pay for the privilege."
      </blockquote>
    </div>
  ),
};

export const Lists: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-2xl">
      <div>
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">
          Unordered List
        </h3>
        <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
          <li>1st level of puns: 5 gold coins</li>
          <li>2nd level of jokes: 10 gold coins</li>
          <li>3rd level of one-liners: 20 gold coins</li>
          <li>
            Nested list item
            <ul className="my-2 ml-6 list-disc [&>li]:mt-1">
              <li>Nested item 1</li>
              <li>Nested item 2</li>
            </ul>
          </li>
        </ul>
      </div>
      
      <div>
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">
          Ordered List
        </h3>
        <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">
          <li>First step in the process</li>
          <li>Second step with details</li>
          <li>Third step to completion</li>
          <li>
            Final step with sub-steps
            <ol className="my-2 ml-6 list-decimal [&>li]:mt-1">
              <li>Sub-step A</li>
              <li>Sub-step B</li>
            </ol>
          </li>
        </ol>
      </div>
    </div>
  ),
};

export const InlineText: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-2xl">
      <p className="leading-7">
        You can style text with <strong>bold</strong>, <em>italic</em>,{' '}
        <u>underline</u>, and <s>strikethrough</s> formatting.
      </p>
      
      <p className="leading-7">
        Here's some{' '}
        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
          inline code
        </code>{' '}
        and a{' '}
        <a href="#" className="font-medium text-primary underline underline-offset-4">
          link
        </a>{' '}
        in the text.
      </p>
      
      <p className="leading-7">
        Small text can be shown with{' '}
        <small className="text-sm font-medium leading-none">
          small tags
        </small>{' '}
        and large text with{' '}
        <span className="text-lg font-semibold">larger spans</span>.
      </p>
    </div>
  ),
};

export const CodeBlocks: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-2xl">
      <div>
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">
          Code Block
        </h3>
        <pre className="overflow-x-auto rounded-lg bg-muted p-4">
          <code className="text-sm">
{`function greet(name: string) {
  return \`Hello, \${name}!\`;
}

const message = greet("World");
console.log(message);`}
          </code>
        </pre>
      </div>
      
      <div>
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">
          Inline Code
        </h3>
        <p className="leading-7">
          Use the{' '}
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
            useState
          </code>{' '}
          hook to manage component state in React.
        </p>
      </div>
    </div>
  ),
};

export const TextSizes: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-2xl">
      <div className="text-xs">Extra small text (text-xs)</div>
      <div className="text-sm">Small text (text-sm)</div>
      <div className="text-base">Base text (text-base)</div>
      <div className="text-lg">Large text (text-lg)</div>
      <div className="text-xl">Extra large text (text-xl)</div>
      <div className="text-2xl">2X large text (text-2xl)</div>
      <div className="text-3xl">3X large text (text-3xl)</div>
      <div className="text-4xl">4X large text (text-4xl)</div>
    </div>
  ),
};

export const TextWeights: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-2xl">
      <div className="font-thin">Thin weight (font-thin)</div>
      <div className="font-extralight">Extra light weight (font-extralight)</div>
      <div className="font-light">Light weight (font-light)</div>
      <div className="font-normal">Normal weight (font-normal)</div>
      <div className="font-medium">Medium weight (font-medium)</div>
      <div className="font-semibold">Semibold weight (font-semibold)</div>
      <div className="font-bold">Bold weight (font-bold)</div>
      <div className="font-extrabold">Extra bold weight (font-extrabold)</div>
      <div className="font-black">Black weight (font-black)</div>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-2xl">
      <div className="text-foreground">Default foreground text</div>
      <div className="text-muted-foreground">Muted foreground text</div>
      <div className="text-primary">Primary color text</div>
      <div className="text-secondary-foreground">Secondary foreground text</div>
      <div className="text-destructive">Destructive color text</div>
      <div className="text-red-500">Red colored text</div>
      <div className="text-green-500">Green colored text</div>
      <div className="text-blue-500">Blue colored text</div>
      <div className="text-yellow-500">Yellow colored text</div>
      <div className="text-purple-500">Purple colored text</div>
    </div>
  ),
};

export const ArticleExample: Story = {
  render: () => (
    <article className="prose prose-gray max-w-2xl">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
        The Art of Typography
      </h1>
      
      <p className="text-xl text-muted-foreground">
        Typography is the art and technique of arranging type to make written
        language legible, readable, and appealing when displayed.
      </p>
      
      <Separator className="my-6" />
      
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Introduction
      </h2>
      
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        Typography involves selecting typefaces, point size, line length, line
        spacing, and letter spacing, and adjusting the space between pairs of
        letters. The term typography is also applied to the style, arrangement,
        and appearance of the letters, numbers, and symbols created by the
        process.
      </p>
      
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
        Key Principles
      </h3>
      
      <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
        <li>Hierarchy and contrast</li>
        <li>Consistency and repetition</li>
        <li>Alignment and proximity</li>
        <li>White space and balance</li>
      </ul>
      
      <blockquote className="mt-6 border-l-2 pl-6 italic">
        "Typography is a beautiful group of letters, not a group of beautiful
        letters." — Matthew Carter
      </blockquote>
      
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
        Best Practices
      </h3>
      
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        When working with typography in digital interfaces, consider these
        important factors:
      </p>
      
      <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">
        <li>Choose fonts that support your brand identity</li>
        <li>Establish a clear typographic hierarchy</li>
        <li>Ensure adequate contrast for accessibility</li>
        <li>Optimize for different screen sizes</li>
      </ol>
      
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        Remember that good typography is often invisible — it serves the content
        without drawing attention to itself. The goal is to create a comfortable
        reading experience that guides the user through your content naturally.
      </p>
    </article>
  ),
};

export const ComponentDocumentation: Story = {
  render: () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Button Component
          <Badge variant="secondary">v1.0.0</Badge>
        </CardTitle>
        <CardDescription>
          A versatile button component with multiple variants and sizes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-3">
            Usage
          </h3>
          <pre className="overflow-x-auto rounded-lg bg-muted p-4">
            <code className="text-sm">
{`import { Button } from '@/components/ui/button';

<Button variant="default" size="md">
  Click me
</Button>`}
            </code>
          </pre>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-3">
            Props
          </h3>
          <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
            <li>
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                variant
              </code>{' '}
              - Button style variant (default, destructive, outline, secondary, ghost, link)
            </li>
            <li>
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                size
              </code>{' '}
              - Button size (default, sm, lg, icon)
            </li>
            <li>
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                disabled
              </code>{' '}
              - Whether the button is disabled
            </li>
          </ul>
        </div>
        
        <div>
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-3">
            Examples
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};