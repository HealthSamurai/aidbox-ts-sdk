# React Components — Agent Guide

## Package Overview

`@health-samurai/react-components` — React design system built on shadcn/ui, Radix UI, and Tailwind CSS 4.

## Directory Structure

```
src/
├── shadcn/components/ui/   # Base shadcn/ui components (Button, Input, Dialog, etc.)
├── components/             # Custom composite components (IconButton, SplitButton, etc.)
├── tokens.css              # Design tokens (CSS variables)
├── typography.css          # Typography utilities
├── icons.tsx               # Custom SVG icons + Lucide re-exports
└── index.tsx               # Single entry point for all exports
```

## Conventions

- **Styling**: Tailwind CSS 4 + CVA (class-variance-authority) for variant management
- **Utility**: `cn()` from `#shadcn/lib/utils` for class merging
- **Path alias**: `#shadcn/*` → `./src/shadcn/*`
- **Tokens**: Always use design tokens (`bg-bg-primary`, `text-text-secondary`, etc.) — never hardcoded colors
- **Stories**: Every component has a `.stories.tsx` file next to it

## Button Components

### Button (`src/shadcn/components/ui/button.tsx`)

Base button component. Uses CVA for variants, supports `asChild` via Radix `Slot`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"primary" \| "secondary" \| "ghost" \| "link"` | `"primary"` | Visual style |
| `size` | `"regular" \| "small"` | `"regular"` | Height: regular=h-9, small=h-6 |
| `danger` | `boolean` | `false` | Danger/destructive color scheme |
| `asChild` | `boolean` | `false` | Render as child element (Radix Slot) |

Exports: `Button`, `buttonVariants`

### IconButton (`src/components/icon-button.tsx`)

Icon-only button. Fixed size `size-6`, requires `icon` and `aria-label`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"ghost" \| "link"` | `"ghost"` | Visual style |
| `icon` | `React.ReactNode` | — | Icon element to render |
| `aria-label` | `string` | — | Required accessibility label |

Exports: `IconButton`, `iconButtonVariants`

### ButtonDropdown (`src/components/button-dropdown.tsx`)

Button with a searchable dropdown (Popover + Command pattern).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `ButtonDropdownOption[]` | — | `{ value, label }` items |
| `selectedValue` | `string` | — | Currently selected value |
| `onSelectItem` | `(value: string) => void` | — | Selection callback |

Exports: `ButtonDropdown`, `ButtonDropdownOption`

### SplitButton (`src/components/split-button.tsx`)

Container that joins a primary Button + DropdownMenuTrigger into one visual unit. Children must use `data-slot="button"` and `data-slot="dropdown-menu-trigger"`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `"regular" \| "small"` | `"regular"` | Applies sizing to children via data-slot selectors |
| `disabled` | `boolean` | `false` | Disabled styling for all children |

Exports: `SplitButton`
