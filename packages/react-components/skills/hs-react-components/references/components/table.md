# Table

> Rendering tabular data with basic markup (thead, tbody, tr, td).

**Import**

```tsx
import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from "@health-samurai/react-components";
```

**Props / states**

| Prop | Options | Default |
| --- | --- | --- |
| `zebra` | `boolean` | `false` |
| `selectable` | `boolean` | `false` |
| `stickyHeader` | `boolean` | `false` |

**Composition**

`Table` · `TableHeader` · `TableBody` · `TableFooter` · `TableHead` · `TableRow` · `TableCell` · `TableCaption`

**Type**

```ts
type TableProps = React.ComponentProps<"table"> & {
	zebra?: boolean | undefined;
	stickyHeader?: boolean | undefined;
};
```

**Links**

[Storybook](https://healthsamurai.github.io/aidbox-ts-sdk/react-components/?path=/docs/component-table--docs) · [Source](src/shadcn/components/ui/table.tsx) · [Story](src/shadcn/components/ui/table.stories.tsx)

_For the full prop list and a working example, `Read` the Source and Story files above._
