import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-[36px] file:text-foreground placeholder:text-(--color-elements-disabled) selection:bg-primary selection:text-primary-foreground border-input flex w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:text-(--color-elements-assistive) md:text-sm",
        "focus-visible:border-(--color-border-XS-regular-hover)",
        "disabled:bg-(--color-surface-1)",
        "aria-invalid:ring-destructive aria-invalid:text-(--color-critical-default) aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
