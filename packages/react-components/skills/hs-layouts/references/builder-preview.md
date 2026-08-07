# Builder + preview

> _Recommended — for a form-driven builder with live data. Adapt freely._

A form-based builder on the left with collapsible sections and "+ add" rows, a
live source/preview panel on the right, and a bottom result dock with view
toggles (Table / List / Chart).

**Seen in:** Analytics → ViewDefinition Builder (PROPERTIES / CONSTANT / WHERE /
SELECT sections + `RUN / Save / Materialize`; right `Instances` search + JSON;
bottom `Result / SQL` dock with `Table / List / Chart`).

## Structure

```
▶ RUN   Save   Materialize ▾                          Instances            ✕
┌──────────────────────────────────┬──────────────────────────────────────┐
│ ▾ PROPERTIES                     │ GET /fhir/Patient?    [ Search ]      │
│    RESOURCE   [ Patient ▾ ]      │  1 { "address": [ …                    │
│    NAME       …                  │  …                                     │
│ ▾ WHERE        + Where           │                                        │
│ ▾ SELECT       + Select          │                                        │
├──────────────────────────────────┴──────────────────────────────────────┤
│ Result   SQL                                     Table  List  Chart      │  result dock
│  No results yet — Click Run to execute                                    │
└──────────────────────────────────────────────────────────────────────────┘
```

## Skeleton

```tsx
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  Button,
  ButtonDropdown,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Select,
  SegmentControl,
  Tabs,
  TabsList,
  TabsTrigger,
  CodeEditor,
  DataTable,
  cn,
} from "@health-samurai/react-components";

function BuilderPreview() {
  const [view, setView] = useState<"table" | "list" | "chart">("table");

  return (
    <div data-slot="builder-preview" className={cn("flex flex-col", "min-h-0 h-full")}>
      {/* Toolbar */}
      <div className={cn("flex items-center", "gap-2", "px-3 h-11", "border-b border-border-secondary")}>
        <Button variant="primary">Run</Button>
        <Button variant="secondary">Save</Button>
      </div>

      {/* Builder | preview */}
      <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={55} minSize={35}>
          <div className={cn("min-h-0 h-full overflow-auto", "p-2")}>
            <Accordion type="multiple" defaultValue={["properties", "where", "select"]}>
              <AccordionItem value="properties">
                <AccordionTrigger>PROPERTIES</AccordionTrigger>
                <AccordionContent>
                  {/* labeled fields: RESOURCE (Select), NAME/TITLE (Input) … */}
                  <Select /* resource */ />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="where">
                <AccordionTrigger>WHERE</AccordionTrigger>
                <AccordionContent>
                  <Button variant="link">+ Where</Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={45} minSize={25}>
          <div className={cn("min-h-0 h-full flex flex-col")}>
            {/* preview header + source */}
            <CodeEditor mode="json" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Bottom result dock */}
      <div className={cn("border-t border-border-secondary", "min-h-40")}>
        <div className={cn("flex items-center justify-between", "px-3 h-9")}>
          <Tabs defaultValue="result" variant="secondary">
            <TabsList>
              <TabsTrigger value="result">Result</TabsTrigger>
              <TabsTrigger value="sql">SQL</TabsTrigger>
            </TabsList>
          </Tabs>
          <SegmentControl
            value={view}
            onValueChange={setView}
            items={[
              { value: "table", label: "Table" },
              { value: "list", label: "List" },
              { value: "chart", label: "Chart" },
            ]}
          />
        </div>
        {/* <DataTable …/> or empty state — see states.md */}
      </div>
    </div>
  );
}
```

## Notes

- Collapsible builder sections map to `Accordion type="multiple"`; each "+ add"
  row is a `Button variant="link"`.
- Make the whole thing resizable (builder|preview horizontally) and keep the
  result dock a fixed-min bottom region.
- The result-view switch (Table/List/Chart) is a `SegmentControl`; render the
  matching component (`DataTable`, a list, or `Chart`).
- Before running, both preview and result show empty states. See [states](states.md).
- The right preview panel is closable (like [master-detail](master-detail.md)) —
  mount it conditionally if you want that.

## Compose from

`Resizable` · `Accordion` · `Select` · `SegmentControl` · `Tabs` · `CodeEditor` ·
`DataTable` · `Chart` · `Button` · `ButtonDropdown`
(look up each in the `hs:react-components` skill).
