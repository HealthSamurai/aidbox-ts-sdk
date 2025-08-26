import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { Plus, X } from "lucide-react";
import type * as React from "react";
import { cn } from "#shadcn/lib/utils";
import { Button } from "./button";

const tabsVariants = cva("", {
  variants: {
    variant: {
      browser: cn(
        // Tabs
        `flex-row 
				 items-center
				 h-10
				 `,
        // TabsList
        `**:data-[slot=tabs-list]:overflow-x-auto
				 **:data-[slot=tabs-list]:divide-x`,
        // TabsTrigger
        `**:data-[slot=tabs-trigger]:max-w-80 
				 **:data-[slot=tabs-trigger]:min-w-40
				 **:data-[slot=tabs-trigger]:data-[state=inactive]:border-b-1
				 **:data-[slot=tabs-trigger]:data-[state=inactive]:border-b-border-secondary
				 **:data-[slot=tabs-trigger]:data-[state=inactive]:pt-[9px]
				 ` // TODO: Try to implement this without using pt-[9px].
      ),
    },
  },
});

function Tabs({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root> &
  VariantProps<typeof tabsVariants>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col", tabsVariants({ variant }), className)}
      {...props}
    />
  );
}

export function TabsAddButton(props: React.ComponentProps<typeof Button>) {
  return (
    <div className="grow h-full bg-bg-secondary border-l border-b">
      <Button
        data-slot="tabs-add-button"
        variant="link"
        className="h-full"
        {...props}
      >
        <Plus />
      </Button>
    </div>
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("inline-flex w-fit items-center", className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  onClose,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
  onClose?: (value: string) => void;
}) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "group/tabs-trigger",
        "box-border h-10 typo-body px-3 pb-2 pt-2.5 cursor-pointer text-text-tertiary data-[state=active]:text-text-primary",
        "data-[state=active]:border-b-border-brand border-b-2 border-b-transparent hover:text-text-tertiary-hover focus-visible:border-ring",
        "focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:text-muted-foreground",
        "inline-flex flex-1 items-center justify-center whitespace-nowrap transition-[color,box-shadow]",
        "focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "hover:bg-bg-secondary/60",
        onClose ? "justify-between" : "",
        className
      )}
      {...props}
    >
      {props.children}

      {onClose && (
        <Button
          onClick={(event) => {
            event.stopPropagation();
            onClose(props.value);
          }}
          variant="link"
          size="small"
          className="p-0 ml-2"
          asChild
        >
          <span>
            <X />
          </span>
        </Button>
      )}
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
