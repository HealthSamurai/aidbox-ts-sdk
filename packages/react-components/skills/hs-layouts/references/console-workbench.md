# Console / workbench

> _Recommended — for a request/query tool with history. Adapt freely._

Three regions: a collapsible secondary left panel (history / collections /
tables), a tabbed editor for the request/query, and a request + response split
where each half has its own tab strip and a primary run button.

**Seen in:** REST console (History/Collections · request tabs · Raw/Params/
Headers/Body over Response Body/Headers/Raw/Explain), SQL console (tables tree ·
query tabs · RUN + fetch size).

## Structure

```
┌──────────────┬─────────────────────────────────────────────┐
│ History      │ [GET New request] [ + ]                      │  tabbed editor
│ Collections  ├─────────────────────────────────────────────┤
│ ───────────  │ [GET ▾] Enter URL…              [▶ Send]     │  request line
│ search…      │ Raw  Params  Headers  Body        JSON YAML  │  request tabs
│ GET /        │  1  GET /                                    │
│              ├─────────────────────────────────────────────┤
│              │ Response:  Body  Headers  Raw  Explain       │  response tabs
│              │  No response yet                             │
└──────────────┴─────────────────────────────────────────────┘
   left panel                main (tabbed + split)
```

## Skeleton

```tsx
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsAddButton,
  Input,
  Button,
  Select,
  CodeEditor,
  SegmentControl,
  cn,
} from "@health-samurai/react-components";

function ConsoleWorkbench() {
  return (
    <ResizablePanelGroup direction="horizontal" data-slot="console" className="min-h-0 h-full">
      {/* Left secondary panel */}
      <ResizablePanel defaultSize={22} minSize={15}>
        <div className={cn("flex flex-col", "min-h-0 h-full", "border-r border-border-secondary")}>
          <Tabs defaultValue="history" variant="secondary">
            <TabsList>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="collections">Collections</TabsTrigger>
            </TabsList>
            <TabsContent value="history">
              <Input placeholder="Search history…" />
              {/* list of past requests */}
            </TabsContent>
          </Tabs>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Main: request tabs + request/response split */}
      <ResizablePanel defaultSize={78}>
        <div className={cn("flex flex-col", "min-h-0 h-full")}>
          {/* Request tabs strip */}
          <div className={cn("flex items-center", "gap-1", "px-2 h-9", "border-b border-border-secondary")}>
            <Tabs defaultValue="req-1" variant="browser" className="min-w-0">
              <TabsList>
                <TabsTrigger value="req-1">GET New request</TabsTrigger>
              </TabsList>
            </Tabs>
            <TabsAddButton onClick={() => {}} />
          </div>

          <ResizablePanelGroup direction="vertical" className="min-h-0 flex-1">
            {/* Request */}
            <ResizablePanel defaultSize={55}>
              <div className={cn("flex items-center", "gap-2", "px-3 h-11")}>
                <Select /* method */ />
                <Input placeholder="Enter URL" className="flex-1" />
                <Button variant="primary">Send</Button>
              </div>
              <CodeEditor mode="json" />
            </ResizablePanel>

            <ResizableHandle />

            {/* Response */}
            <ResizablePanel defaultSize={45}>
              <div className={cn("px-3 h-9 flex items-center")}>
                <Tabs defaultValue="body" variant="secondary">
                  <TabsList>
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="raw">Raw</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {/* response body or empty state — see states.md */}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </ResizablePanelGroup>
    </ResizablePanelGroup>
  );
}
```

## Notes

- Nest `ResizablePanelGroup`: horizontal for panel|main, vertical inside main for
  request|response.
- Use `variant="browser"` tabs for the request/query documents (with
  `TabsAddButton` for the `+`); `variant="secondary"` for the sub-view tabs
  (Raw/Params/Headers…).
- The left panel is collapsible — a `SidebarTrigger`-style chevron or letting the
  panel `collapsible` handles it.
- Before a run, the response half shows an empty state ("No response yet"). See
  [states](states.md).
- SQL console is the same shape: replace the left tabs with a tables tree
  (`TreeView`) + search, and the request line with a `RUN` toolbar.

## Compose from

`Resizable` · `Tabs` (+ `TabsAddButton`) · `CodeEditor` · `Input` · `Select` ·
`SegmentControl` · `TreeView`
(look up each in the `hs:react-components` skill).
