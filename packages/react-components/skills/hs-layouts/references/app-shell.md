# App shell

> _Recommended — the outer frame most screens live in. Adapt freely._

The chrome around every page: a fixed left navigation sidebar, a top header
(breadcrumb + account/global actions), and a scrollable content region that
fills the rest.

**Seen in:** every Aidbox screen (Resource browser, REST console, SQL console…).

## Structure

```
┌─────────┬──────────────────────────────────────────────┐
│         │  breadcrumb …                    ⌂ ? avatar   │  header
│  nav    ├──────────────────────────────────────────────┤
│  side   │                                              │
│  bar    │            page content (scrolls)             │
│         │                                              │
│ ─────── │                                              │
│ settings│                                              │
└─────────┴──────────────────────────────────────────────┘
```

## Skeleton

```tsx
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  cn,
} from "@health-samurai/react-components";

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" data-slot="app-sidebar">
        <SidebarContent>
          <SidebarMenu>
            {NAV.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton isActive={item.active} tooltip={item.label} asChild>
                  <a href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>{/* Settings, version tag */}</SidebarFooter>
      </Sidebar>

      <SidebarInset data-slot="app-main" className={cn("flex flex-col", "min-w-0")}>
        <header
          data-slot="app-header"
          className={cn(
            "flex items-center justify-between",
            "h-12 px-4",
            "border-b border-border-secondary",
          )}
        >
          {/* <PageBreadcrumb /> on the left, global actions on the right */}
        </header>
        <main data-slot="app-content" className={cn("flex-1 min-h-0 overflow-auto")}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

## Notes

- `SidebarProvider` owns collapse state; `collapsible="icon"` gives the
  icon-only rail seen in some screens. `SidebarTrigger` toggles it.
- Each nav item is icon + label; mark the current one with `isActive`. The
  `tooltip` prop shows the label when the rail is collapsed.
- Pin secondary items (Settings, environment/version tag) in `SidebarFooter`.
- Keep `min-w-0` on the main column so wide tables/editors can scroll instead of
  pushing the layout.
- Put the breadcrumb + page actions in the header via the
  [page-header](page-header.md) pattern.

## Compose from

`Sidebar` → [../../hs-react-components/references/components/sidebar.md](../../hs-react-components/references/components/sidebar.md) ·
`Breadcrumb` → [../../hs-react-components/references/components/breadcrumb.md](../../hs-react-components/references/components/breadcrumb.md)
