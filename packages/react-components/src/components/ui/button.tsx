import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all  disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 cursor-pointer",
  {
    variants: {
      variant: {
        primaryNormal:
          "bg-bg-link text-text-primary_on-brand shadow-xs hover:bg-bg-link-hover active:bg-bg-link disabled:bg-bg-disabled typo-label py-2 px-6",
        primaryCritical:
          "bg-bg-error-primary-inverse text-fg-primary_inverse shadow-xs hover:bg-bg-error-primary-inverse-hover active:bg-bg-error-primary-inverse focus-visible:ring-destructive/20 disabled:bg-bg-disabled py-2 px-6",
        secondaryNormal:
          "border border-border-primary bg-bg-primary text-fg-tertiary shadow-xs hover:bg-bg-tertiary hover:text-fg-primary disabled:text-fg-disabled disabled:border-border-disabled py-2 px-6",
        tertiaryNormal:
          "bg-bg-primary text-fg-tertiary hover:text-fg-secondary disabled:text-fg-disabled py-2 px-6",

        toolbar:
          "bg-transparent text-fg-tertiary hover:text-fg-secondary disabled:text-fg-disabled typo-label-xs px-2",
        toolbarCritical:
          "bg-bg-toolbar-critical border border-border-error text-fg-error-primary hover:bg-bg-error-secondary disabled:text-fg-disabled disabled:border-border-disabled typo-button-label-xs py-0.5 px-2",
        toolbarCriticalSolid:
          "bg-bg-toolbar-critical-solid text-fg-primary_inverse hover:opacity-90 disabled:bg-bg-disabled typo-button-label-xs h-2 px-2 py-1",
      },
    },
    defaultVariants: {
      variant: "primaryNormal",
    },
  }
);

function Button({
  className,
  variant,

  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, className }))}
      {...props}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
