import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        // Текстовые токены и типографика из @theme/typography
        // break-words - перенос длинных слов

        "text-text-tertiary typo-body flex flex-wrap items-center break-words gap-2",
        className
      )}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn(
        // inline-flex - display: inline-flex
        // items-center - align-items: center (вертикальное выравнивание по центру)
        "inline-flex items-center",
        className
      )}
      {...props}
    />
  );
}

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn(
        // chip-like appearance. Цвета только из @theme и пресет типографики
        "typo-body bg-bg-tertiary text-text-tertiary rounded-md px-2 py-1 transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    />
  );
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn(
        // Типографика из Figma: 20/28 Medium, tracking tight — используем готовый пресет
        // Цвет 1:1 с Figma: text-primary → text-text-primary
        "typo-page-header text-text-primary px-0 py-0.5",
        className
      )}
      {...props}
    />
  );
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn(
        // [&>svg]:size-3.5 - для всех svg внутри: width: 0.875rem, height: 0.875rem
        // облегчённый вид: размер 12px, цвет из @theme
        "[&>svg]:size-3.5 text-text-quternary text-xs",
        className
      )}
      {...props}
    >
      {children ?? "/"}
    </li>
  );
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn(
        // flex - display: flex
        // size-9 - width: 2.25rem, height: 2.25rem
        // items-center - align-items: center (вертикальное выравнивание по центру)
        // justify-center - justify-content: center (горизонтальное выравнивание по центру)
        "flex size-9 items-center justify-center",
        className
      )}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
