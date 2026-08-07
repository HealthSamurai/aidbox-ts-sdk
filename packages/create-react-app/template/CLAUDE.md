# CLAUDE.md

## Project

Vite + React + TypeScript app using `@health-samurai/react-components` design system.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm typecheck    # Type-check
pnpm lint:check   # Lint with Biome
pnpm lint:fix     # Auto-fix lint issues
```

## Components

All components are imported from `@health-samurai/react-components`.

Use the `/hs:react-components` skill to look up component props, states, usage
examples, design tokens, and the design-system rules.

## Layouts

When composing a whole screen (app shell, list page, master-detail, editor,
console, builder…), consult the `/hs:layouts` skill for **recommended** layout
patterns built from these components. They are suggestions, not requirements —
use one when it fits, adapt freely.
