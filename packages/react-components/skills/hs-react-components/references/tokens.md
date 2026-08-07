# Design Tokens

Use **only** these semantic tokens. Never hardcode hex colors or raw
palette utilities (`text-blue-500`, `bg-[#f5f5f6]`).

Each `--color-<name>` maps to a Tailwind utility. E.g. `--color-bg-secondary`
→ `bg-bg-secondary`; `--color-text-primary` → `text-text-primary`;
`--color-border-error` → `border-border-error`.

## Typography

Use these semantic classes instead of raw `font-*`/`text-*`/`leading-*`:

`typo-body` · `typo-body-xs` · `typo-button-label-xs` · `typo-code` · `typo-label` · `typo-label-tiny` · `typo-label-xs` · `typo-page-header`

## Semantic colors

### bg — use as `bg-<token>`

`bg-brand-primary` · `bg-brand-secondary` · `bg-brand-tertiary` · `bg-dark` · `bg-disabled` · `bg-error-primary` · `bg-error-secondary` · `bg-error-tertiary` · `bg-hover` · `bg-info-primary` · `bg-link` · `bg-neutral-primary` · `bg-overlay` · `bg-primary` · `bg-quaternary` · `bg-secondary` · `bg-success-primary` · `bg-success-secondary` · `bg-tertiary` · `bg-warning-primary` · `bg-warning-secondary`

### border — use as `border-<token>`

`border-brand` · `border-dark` · `border-disabled` · `border-error` · `border-link` · `border-primary` · `border-secondary` · `border-separator` · `border-success` · `border-warning-primary` · `border-warning-secondary`

### fg — use as `text / fill-<token>`

`fg-brand-primary` · `fg-brand-secondary` · `fg-disabled` · `fg-error-primary` · `fg-error-secondary` · `fg-info-primary` · `fg-link` · `fg-neutral-primary` · `fg-primary` · `fg-secondary` · `fg-success-primary` · `fg-success-secondary` · `fg-tertiary` · `fg-warning-primary` · `fg-warning-secondary`

### ring — use as `ring-<token>`

`ring-blue` · `ring-green` · `ring-orange` · `ring-pink` · `ring-purple` · `ring-red` · `ring-yellow`

### text — use as `text-<token>`

`text-brand-primary` · `text-brand-secondary` · `text-disabled` · `text-error-primary` · `text-error-secondary` · `text-info-primary` · `text-link` · `text-primary` · `text-quternary` · `text-secondary` · `text-success-primary` · `text-tertiary` · `text-warning-primary`

### utility — use as `utility-<token>`

`utility-blue` · `utility-green` · `utility-red` · `utility-violet` · `utility-yellow`

[Source](src/index.css) · [Source](src/tokens.css)
