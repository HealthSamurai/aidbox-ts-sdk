import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg transition-all  disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 cursor-pointer",
  {
    variants: {
      size: {
        regular: "py-2 px-6 typo-label",
        small: "py-1 px-2 text-xs gap-1",
      },
      variant: {
        primary:
          "bg-bg-link text-text-primary_on-brand shadow-xs hover:bg-bg-link_hover active:bg-bg-link disabled:bg-bg-disabled",
        outline:
          "border border-border-primary bg-bg-primary text-text-tertiary shadow-xs hover:bg-bg-tertiary hover:text-fg-primary disabled:text-fg-disabled disabled:border-border-disabled",
        critical:
          "bg-bg-error-primary_inverse text-text-primary_on-brand shadow-xs hover:bg-bg-error-primary_inverse_hover active:bg-bg-error-primary_inverse disabled:bg-bg-disabled",
        criticalInverse:
          "border typo-button-label-xs bg-transparent border-border-error_inverse text-text-primary_on-brand hover:border-border-error_inverse_hover disabled:text-text-error-secondary active:border-border-error_inverse disabled:bg-bg-error-primary_inverse",
        link: "text-text-tertiary hover:text-text-primary active:text-text-tertiary ",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "regular",
    },
  }
);

function Button({
  className,
  variant,
  size,

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
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
