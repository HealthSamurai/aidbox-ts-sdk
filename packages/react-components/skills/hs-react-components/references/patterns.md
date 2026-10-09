# Rules & patterns

Follow these when writing or reviewing UI with the Health Samurai design system.
They are the difference between code that looks native to the system and code that
merely renders.

## 1. Use components, not raw markup

Reach for a design-system component before writing a `<div>`. Look it up in the
skill's component list first. Compose primitives (`Dialog` + `DialogContent` + …)
rather than rebuilding them.

## 2. Colors — semantic tokens only

- ✅ `bg-bg-secondary`, `text-text-primary`, `border-border-error`, `text-fg-success-primary`
- ❌ `bg-[#f5f5f6]`, `text-blue-500`, `text-neutral-600`, any hex or raw palette utility

See [tokens.md](tokens.md) for the full vocabulary. Every color must resolve to a
`--color-*` semantic token defined in `index.css`.

## 3. Typography — semantic `typo-*` classes only

- ✅ `typo-body`, `typo-label`, `typo-label-xs`, `typo-button-label-xs`, `typo-page-header`
- ❌ `font-medium text-xs leading-5` (hardcoded Tailwind type utilities)

## 4. Compose classNames with `cn()`, in order

```tsx
import { cn } from "@health-samurai/react-components";

const styles = cn(
  // Layout
  "inline-flex items-center justify-center",
  // Spacing
  "px-4 py-2",
  // Typography
  "typo-label",
  // Colors
  "bg-bg-secondary text-text-secondary",
  // Interaction / transitions
  "transition-colors duration-200",
);
```

Prefer `gap-*` over `space-y-*`/`space-x-*` for spacing between flex/grid children.

## 5. Variants — `cva`, not conditional strings

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(baseStyles, {
  variants: {
    tone: {
      default: "bg-bg-primary",
      muted: "bg-bg-secondary",
    },
  },
  defaultVariants: { tone: "default" },
});
```

## 6. Every component sets a `data-slot`

```tsx
<div data-slot="my-thing" className={cn(...)} />
```

Used for styling hooks and descendant selectors across the system.

## 7. Author style

- Components are `function`s, never `const` arrow assignments.
- Export both the component **and** its `*Variants` (e.g. `export { Card, cardVariants }`).
- Keep props typed with `VariantProps<typeof xVariants>` so options stay in sync.

## Review checklist

Before finishing UI work, verify:

- [ ] No hex colors or raw palette utilities — only semantic `--color-*` tokens.
- [ ] No raw `font-*`/`text-*`/`leading-*` — only `typo-*` classes.
- [ ] Existing design-system component used where one exists (no reinvented dialogs, dropdowns, tables).
- [ ] `cn()` used for all conditional/composed classNames.
- [ ] `cva` + `defaultVariants` used for anything with variants.
- [ ] `data-slot` present on component roots.
- [ ] `gap-*` used over `space-y-*`/`space-x-*`.
- [ ] Interactive elements have `focus-visible` and `disabled` states.
- [ ] New components are `function` declarations and export their `*Variants`.
