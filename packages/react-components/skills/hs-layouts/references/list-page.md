# List page

> _Recommended — for browsing a collection. Adapt freely._

A query/toolbar row, a `DataTable` with row selection and sortable columns, and
a footer that shows a bulk-action bar when rows are selected plus pagination.

**Seen in:** Resource browser → Instances (Patient list with `GET /fhir/Patient?…`
query line, selectable rows, `N selected: Export / Delete / Deselect`, pager).

## Structure

```
[GET] _count=30&_page=1&…                 [ Search ]  [ + Create ]   ← query row
────────────────────────────────────────────────────────────────
☑  id            lastUpdated        address           name          ← DataTable
☑  0be40874…     Jul 23 2024        497 Emmerich…     Sophia Grace
   …
────────────────────────────────────────────────────────────────
6 selected:  ⬇ Export  🗑 Delete  Deselect      ‹ 1 2 3 … 12 ›  30/page  ← footer
```

## Skeleton

```tsx
import {
  RequestLineEditor,
  DataTable,
  type ColumnDef,
  Button,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
  PaginationPageSizeSelector,
  cn,
} from "@health-samurai/react-components";

function ListPage() {
  return (
    <div data-slot="list-page" className={cn("flex flex-col", "min-h-0", "gap-3", "p-4")}>
      {/* Query / toolbar row */}
      <div className={cn("flex items-center", "gap-2")}>
        <RequestLineEditor
          method="GET"
          path="/fhir/Patient?_count=30&_page=1"
          onMethodChange={() => {}}
          className="flex-1"
        />
        <Button variant="primary">Search</Button>
        <Button variant="secondary">Create</Button>
      </div>

      {/* Table (scrolls; header can stick) */}
      <div className={cn("flex-1 min-h-0 overflow-auto")}>
        <DataTable stickyHeader columns={columns} data={rows} />
      </div>

      {/* Footer: bulk actions (when selection) + pagination */}
      <div className={cn("flex items-center justify-between", "gap-4", "pt-2")}>
        <div className={cn("flex items-center", "gap-3")}>
          {selectedCount > 0 && (
            <>
              <span className="typo-label text-text-secondary">
                {selectedCount} selected:
              </span>
              <Button variant="link">Export</Button>
              <Button variant="link" danger>Delete</Button>
              <Button variant="link">Deselect</Button>
            </>
          )}
        </div>
        <div className={cn("flex items-center", "gap-3")}>
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
              <PaginationItem><PaginationLink href="#" isActive>1</PaginationLink></PaginationItem>
              <PaginationItem><PaginationLink href="#">2</PaginationLink></PaginationItem>
              <PaginationItem><PaginationNext href="#" /></PaginationItem>
            </PaginationContent>
          </Pagination>
          <PaginationPageSizeSelector />
        </div>
      </div>
    </div>
  );
}
```

## Notes

- A plain search box is fine when there is no request line — use `Input` instead
  of `RequestLineEditor`.
- Row selection, sorting, and cell rendering live in the `ColumnDef[]` you pass
  to `DataTable` (`stickyHeader` keeps the header visible while scrolling).
- Render status/enum cells as a colored `Tag`; show row-level problems with a
  warning icon in a leading cell.
- The bulk-action bar only appears when `selectedCount > 0`; keep it on the left,
  pagination on the right.
- `PaginationPageSizeSelector` covers the `30 / page` control.

## Compose from

`RequestLineEditor` · `DataTable` · `Pagination` · `Button` · `Tag` · `Input`
(look up each in the `hs:react-components` skill).
