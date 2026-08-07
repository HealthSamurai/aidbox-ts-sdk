# Editor view

> _Recommended — for editing a resource / document as code. Adapt freely._

A toolbar (format toggle, format/copy, save), a full-height `CodeEditor`, an
optional validation/error dock pinned to the bottom, and footer actions.

**Seen in:** resource editor (`John Doe` → Edit: `JSON / YAML / Form` toggle,
`Format / Copy / Profile`, JSON editor, red `5 errors` dock, `Save / Cancel`,
`Duplicate / Delete`), SearchParameter → Edit.

## Structure

```
JSON  YAML  Form                              ≡ Format   ⧉ Copy   ✦ Profile   ← toolbar
──────────────────────────────────────────────────────────────────────────
1  {                                                                          │
2    "resourceType": "Patient",                                               │  CodeEditor
3    …                                                                         │
──────────────────────────────────────────────────────────────────────────
⚠ 5 errors                                                                     ← error dock
  Syntax error:   "{" is missing
  Unknown key:    "communication"
──────────────────────────────────────────────────────────────────────────
[ Save ] [ Cancel ]                                       ⧉ Duplicate  🗑 Delete ← footer
```

## Skeleton

```tsx
import {
  SegmentControl,
  Button,
  IconButton,
  CodeEditor,
  Alert,
  AlertTitle,
  AlertDescription,
  cn,
} from "@health-samurai/react-components";

function EditorView() {
  const [format, setFormat] = useState<"json" | "yaml" | "form">("json");

  return (
    <div data-slot="editor-view" className={cn("flex flex-col", "min-h-0", "h-full")}>
      {/* Toolbar */}
      <div className={cn("flex items-center justify-between", "gap-2", "px-3 h-10", "border-b border-border-secondary")}>
        <SegmentControl
          value={format}
          onValueChange={setFormat}
          items={[
            { value: "json", label: "JSON" },
            { value: "yaml", label: "YAML" },
            { value: "form", label: "Form" },
          ]}
        />
        <div className={cn("flex items-center", "gap-1")}>
          <Button variant="ghost" size="small">Format</Button>
          <Button variant="ghost" size="small">Copy</Button>
        </div>
      </div>

      {/* Editor */}
      <div className={cn("flex-1 min-h-0")}>
        <CodeEditor mode="json" /* value / onChange */ />
      </div>

      {/* Validation dock — render only when there are errors */}
      {errors.length > 0 && (
        <Alert variant="critical" vivid data-slot="editor-errors" className={cn("rounded-none")}>
          <AlertTitle>{errors.length} errors</AlertTitle>
          <AlertDescription>
            <ul className={cn("flex flex-col", "gap-0.5", "typo-code")}>
              {errors.map((e) => (
                <li key={e.id}>
                  <span className="text-text-error-primary">{e.kind}:</span> {e.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Footer actions */}
      <div className={cn("flex items-center justify-between", "gap-2", "px-3 h-12", "border-t border-border-secondary")}>
        <div className={cn("flex items-center", "gap-2")}>
          <Button variant="primary">Save</Button>
          <Button variant="secondary">Cancel</Button>
        </div>
        <div className={cn("flex items-center", "gap-1")}>
          <Button variant="ghost">Duplicate</Button>
          <Button variant="ghost" danger>Delete</Button>
        </div>
      </div>
    </div>
  );
}
```

## Notes

- `SegmentControl` is ideal for the JSON/YAML/Form toggle (it takes
  `{ value, label }[]`); a two-item set behaves as a toggle.
- Give the editor a bounded, scrollable region: `flex-1 min-h-0` around
  `CodeEditor`, and keep the toolbar/dock/footer out of the scroll.
- Mount the error dock only when there are errors; `Alert variant="critical"`
  with `vivid` matches the solid red summary bar. See [states](states.md).
- Pair the primary action left (`Save`/`Cancel`) with destructive/secondary
  actions right (`Duplicate`/`Delete`).

## Compose from

`CodeEditor` · `SegmentControl` · `Alert` · `Button` · `IconButton`
(look up each in the `hs:react-components` skill).
