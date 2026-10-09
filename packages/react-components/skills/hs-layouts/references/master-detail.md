# Master–detail

> _Recommended — for browsing a list while inspecting one item. Adapt freely._

A list (or table) on the left; a closable detail panel on the right that has its
own tab bar and content. Best as a resizable split so the user can size each
side.

**Seen in:** Resource browser → Profiles (profile list left; right panel with
`Differential / Snapshot / FHIRSchema / StructureDefinition` tabs over a
tree-table), and any "select a row → open a side panel" flow.

## Structure

```
┌───────────────────────┬───────────────────────────────────┐
│ list / table          │ Differential  Snapshot  …     ✕   │
│  http://…/Patient     │ ───────────────────────────────── │
│  http://…/Observation │  Name        Card.  Type          │
│  …                    │  ▸ Patient   0..*   Resource      │
│                       │    active    0..1   boolean       │
└───────────────────────┴───────────────────────────────────┘
        master              detail (closable, tabbed)
```

## Skeleton

```tsx
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  DataTable,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  IconButton,
  TreeView,
  cn,
} from "@health-samurai/react-components";
import { X } from "lucide-react";

function MasterDetail() {
  const [selected, setSelected] = useState<Row | null>(null);

  return (
    <ResizablePanelGroup direction="horizontal" data-slot="master-detail" className="min-h-0">
      <ResizablePanel defaultSize={selected ? 45 : 100} minSize={30}>
        <DataTable columns={columns} data={rows} /* onRowClick={setSelected} */ />
      </ResizablePanel>

      {selected && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={55} minSize={30}>
            <div data-slot="detail-panel" className={cn("flex flex-col", "min-h-0", "h-full")}>
              <div className={cn("flex items-center justify-between", "px-3 h-10", "border-b border-border-secondary")}>
                <Tabs defaultValue="differential" variant="secondary" className="min-w-0">
                  <TabsList>
                    <TabsTrigger value="differential">Differential</TabsTrigger>
                    <TabsTrigger value="snapshot">Snapshot</TabsTrigger>
                    <TabsTrigger value="fhirschema">FHIRSchema</TabsTrigger>
                  </TabsList>
                </Tabs>
                <IconButton
                  variant="ghost"
                  aria-label="Close panel"
                  icon={<X />}
                  onClick={() => setSelected(null)}
                />
              </div>
              <div className={cn("flex-1 min-h-0 overflow-auto", "p-2")}>
                <TreeView /* … */ />
              </div>
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
```

## Notes

- When nothing is selected, let the master fill the width (`defaultSize={100}`)
  and mount the detail panel + handle only once there is a selection.
- The detail panel owns its own tabs; put the close `IconButton` in the panel
  header, opposite the tabs.
- A tree-shaped payload (FHIR structure, JSON) fits `TreeView` /
  `FhirStructureView`; tabular detail fits another `DataTable`.
- For a non-resizable version, replace the panel group with a
  `flex` row (`flex-1` master + fixed/`w-[480px]` detail).
- On narrow widths, consider showing the detail in a `Sheet` instead of a split.

## Compose from

`Resizable` · `Tabs` · `DataTable` · `TreeView` · `FhirStructureView` · `IconButton` · `Sheet`
(look up each in the `hs:react-components` skill).
