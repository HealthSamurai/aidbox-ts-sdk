import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg transition-all  disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 cursor-pointer",
  {
    variants: {
      size: {
        regular: "h-9 px-4 typo-label",
        small: "h-6 px-2 typo-button-label-xs gap-1 rounded-md",
      },
      variant: {
        primary:
          "bg-bg-link text-text-primary_on-brand shadow-xs hover:bg-bg-link_hover active:bg-bg-link disabled:bg-bg-disabled",
        outline:
          "border border-border-primary bg-bg-primary text-text-tertiary shadow-xs hover:text-fg-primary disabled:text-fg-disabled disabled:border-border-disabled hover:bg-bg-secondary active:bg-bg-primary active:text-text-tertiary disabled:hover:bg-bg-primary",
        link: "text-text-secondary hover:text-text-primary disabled:text-text-disabled",
        ghost:
          "text-text-secondary hover:text-text-primary disabled:text-text-disabled hover:bg-bg-secondary active:bg-bg-tertiary disabled:hover:bg-bg-primary",
      },
      danger: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "primary",
        danger: true,
        class:
          "bg-bg-error-primary_inverse text-text-primary_on-brand hover:bg-bg-error-primary_inverse_hover active:bg-bg-error-primary_inverse disabled:bg-bg-disabled",
      },
      {
        variant: "outline",
        danger: true,
        class: "border-border-error text-text-error-primary hover:text-text-error-primary_hover hover:bg-bg-error-secondary active:bg-bg-primary active:text-text-error-primary_on-brand",
      },
      {
        variant: "link",
        danger: true,
        class: "text-text-error-secondary hover:text-text-error-primary",
      },
      {
        variant: "ghost",
        danger: true,
        class: "text-text-error-secondary hover:text-text-error-primary hover:bg-bg-error-secondary active:bg-bg-error-tertiary",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "regular",
      danger: false,
    },
  }
);

function Button({
  className,
  variant,
  size,
  danger = false,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    danger?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, danger, className }))}
      {...props}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
