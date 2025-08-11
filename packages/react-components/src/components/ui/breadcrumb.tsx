import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        // text-muted-foreground - цвет текста (обычно серый)
        // flex - display: flex
        // flex-wrap - flex-wrap: wrap (перенос элементов на новую строку)
        // items-center - align-items: center (вертикальное выравнивание по центру)
        // gap-1.5 - gap: 0.375rem (отступы между элементами)
        // text-sm - font-size: 0.875rem (размер шрифта)
        // break-words - word-break: break-word (перенос длинных слов)
        // sm:gap-2.5 - на экранах sm и больше: gap: 0.625rem
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
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
        // gap-1.5 - gap: 0.375rem (отступы между элементами)
        "inline-flex items-center gap-1.5",
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
        // hover:text-foreground - при наведении: цвет текста (обычно черный)
        // transition-colors - transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1) (плавная анимация цвета)
        "hover:text-foreground transition-colors",
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
        // text-foreground - цвет текста (обычно черный)
        // font-normal - font-weight: 400 (обычный вес шрифта)
        "text-foreground font-normal",
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
        "[&>svg]:size-3.5",
        className
      )}
      {...props}
    >
      {children ?? <ChevronRight />}
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
