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
        small: "py-1 px-2 gap-1",
      },
      variant: {
        primary:
          "bg-bg-link text-text-primary_on-brand shadow-xs hover:bg-bg-link-hover active:bg-bg-link disabled:bg-bg-disabled",
        critical:
          "bg-bg-error-primary-inverse text-text-primary_inverse shadow-xs hover:bg-bg-error-primary-inverse-hover active:bg-bg-error-primary-inverse  disabled:bg-bg-disabled",
        outline:
          "border border-border-primary bg-bg-primary text-text-tertiary shadow-xs hover:bg-bg-tertiary hover:text-fg-primary disabled:text-fg-disabled disabled:border-border-disabled disabled:hover:bg-bg-primary",
        tertiary:
          "bg-bg-primary text-text-tertiary hover:text-text-secondary disabled:text-fg-disabled",
        toolbar:
          "typo-label text-text-tertiary shadow-xs active:text-text-tertiary  disabled:text-text-disabled hover:text-text-primary py-0 px-2 gap-1",
        toolbarCritical:
          "typo-label-xs text-text-primary_inverse shadow-xs border border-border-error_inverse py-1 px-2 gap-1 active:bg-bg-error-primary-inverse  disabled:text-text-error-secondary hover:border-border-error_inverse_hover",
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
