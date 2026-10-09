# DataTable

> TanStack Table wrapper with sticky header support.

**Import**

```tsx
import { DataTable, ColumnDef, AccessorKeyColumnDef } from "@health-samurai/react-components";
```

**Composition**

`DataTable` · `ColumnDef` · `AccessorKeyColumnDef`

**Type**

```ts
export interface DataTableProps<TData> {
	// It is not possible to allow arbitrary and nested data structures
	// and have more type safety. Note that the useReactTable type definition
	// is exactly the same.
	// There is an open issue: https://github.com/TanStack/table/issues/4382
	// biome-ignore lint/suspicious/noExplicitAny: cannot be stricter while being a useful library
	columns: ColumnDef<TData, any>[];
	data: TData[];
	stickyHeader?: boolean;
}
```

**Links**

[Storybook](https://healthsamurai.github.io/aidbox-ts-sdk/react-components/?path=/docs/component-datatable--docs) · [Source](src/components/data-table.tsx) · [Story](src/components/data-table.stories.tsx)

_For the full prop list and a working example, `Read` the Source and Story files above._
