# States — empty · loading · error

> _Recommended — cross-cutting bits to drop into any pattern. Adapt freely._

Not a layout of its own; these compose into the patterns above (list, editor,
console, builder). Consistent empty/loading/error states are what make a screen
feel finished.

**Seen in:** "No response yet" / "No results yet — Click Run to execute", the red
`5 errors` validation dock, and loading rows.

## Empty state

Centered, muted, a short title + one hint line. Use for pre-run panels and empty
collections.

```tsx
import { cn } from "@health-samurai/react-components";

function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div
      data-slot="empty-state"
      className={cn("flex flex-col items-center justify-center", "gap-1", "h-full p-8", "text-center")}
    >
      <span className="typo-label text-text-secondary">{title}</span>
      {hint && <span className="typo-body text-text-tertiary">{hint}</span>}
    </div>
  );
}

// <EmptyState title="No response yet" hint="Send a request to see the response" />
```

For a table with no rows, `DataTable` renders its own empty cell — pass an empty
`data` array. When there are also no results after an action, an `Alert
variant="info"` with a call-to-action reads well too.

## Loading

Prefer `Skeleton` rows/blocks that mirror the eventual content over a spinner.

```tsx
import { Skeleton, cn } from "@health-samurai/react-components";

function TableLoading() {
  return (
    <div className={cn("flex flex-col", "gap-2", "p-2")}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className={cn("h-8 w-full")} />
      ))}
    </div>
  );
}
```

## Validation / error dock

A solid red summary bar pinned to the bottom of an editor, listing errors. Use
`Alert variant="critical"` with `vivid`.

```tsx
import { Alert, AlertTitle, AlertDescription, cn } from "@health-samurai/react-components";

function ErrorDock({ errors }: { errors: { id: string; kind: string; message: string }[] }) {
  if (errors.length === 0) return null;
  return (
    <Alert variant="critical" vivid data-slot="error-dock" className={cn("rounded-none")}>
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
  );
}
```

For inline, non-blocking messages use `Alert` with `variant="info" | "warning" |
"success"`; for transient feedback (saved, copied) use `toast` / `Sonner`; for
per-field form errors use the `Form` component's error handling.

## Notes

- Keep empty/error regions **out** of the scroll area — dock them, let content
  scroll between toolbar and dock.
- Match the tone: `info` for neutral empties/hints, `critical` for blocking
  validation, `warning` for recoverable issues, `success` for confirmations.

## Compose from

`Alert` · `Skeleton` · `Sonner` / `toast` · `Form` · `DataTable`
(look up each in the `hs:react-components` skill).
