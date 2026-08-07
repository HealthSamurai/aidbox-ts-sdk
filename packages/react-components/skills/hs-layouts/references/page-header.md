# Page header

> _Recommended — the top of a content area. Adapt freely._

Breadcrumb showing location, the current entity title (often with copy/delete
affordances or a resource-type switcher), right-aligned page actions, and an
optional tab bar for sub-views.

**Seen in:** Resource browser (`design-test2 / Resources / Patient`), resource
editor (`Skynet / Resources / Patient / John Doe`).

## Structure

```
design-test2  /  Resources  /  Patient                     [ + Create ]
────────────────────────────────────────────────────────────────────────
Instances   Profiles   Search parameters                          ← tabs
```

## Skeleton

```tsx
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Button,
  cn,
} from "@health-samurai/react-components";

function PageHeader() {
  return (
    <div data-slot="page-header" className={cn("flex flex-col", "gap-3", "px-4 pt-4")}>
      <div className={cn("flex items-center justify-between", "gap-4")}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">design-test2</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/resources">Resources</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Patient</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button variant="primary">Create</Button>
      </div>

      <Tabs defaultValue="instances" variant="primary">
        <TabsList>
          <TabsTrigger value="instances">Instances</TabsTrigger>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="search-params">Search parameters</TabsTrigger>
        </TabsList>
        <TabsContent value="instances">{/* list page */}</TabsContent>
      </Tabs>
    </div>
  );
}
```

## Notes

- `BreadcrumbPage` marks the current (non-link) segment. `BreadcrumbSeparator`
  is a **sibling** of `BreadcrumbItem`, not a child.
- The `variant` prop (`primary` / `secondary` / `tertiary` / `browser`) goes on
  `<Tabs>`, **not** on `<TabsList>`.
- Right-side actions: a primary `Button` for the main action; use `IconButton`
  for copy/delete next to a title, or `Select`/`ButtonDropdown` for a
  resource-type switcher.
- Skip the tab bar when the page has no sub-views.

## Compose from

`Breadcrumb` · `Tabs` · `Button` · `IconButton` · `Select`
(look up each in the `hs:react-components` skill).
