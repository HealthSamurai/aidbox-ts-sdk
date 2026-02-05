# AGENTS.md

## Project Overview

Aidbox TS SDK is a pnpm monorepo of TypeScript libraries for building FHIR healthcare interfaces. Published under the `@health-samurai` npm scope.

### Packages

| Package | Path | Description |
|---------|------|-------------|
| `@health-samurai/aidbox-client` | `packages/aidbox-client` | FHIR client library with Result monad error handling |
| `@health-samurai/react-components` | `packages/react-components` | React design system (shadcn/ui + custom components) |
| `@health-samurai/aidbox-fhirpath-lsp` | `packages/aidbox-fhirpath-lsp` | FHIRPath language server for CodeMirror |

### Dependency Graph

```
react-components → aidbox-client, aidbox-fhirpath-lsp
aidbox-fhirpath-lsp → aidbox-client
```

## Tech Stack

- **Runtime**: Node.js 24, ES modules, TypeScript 5.8 (strict)
- **Package manager**: pnpm 10.21 (workspaces)
- **Compilation**: SWC (transpilation) + tsc (declarations only)
- **Bundling**: Vite 7 (dev/build), Tailwind CSS 4 (styles)
- **UI**: React 19, Radix UI, shadcn/ui, CodeMirror 6, TanStack Table
- **Testing**: Vitest 3.2
- **Linting/Formatting**: Biome 2.1
- **Docs**: Storybook 9 (components), TypeDoc (API)

## Commands

### Workspace-wide (from root)

```bash
pnpm install                   # Install all dependencies
pnpm -r run build              # Build all packages (dependency order)
pnpm -r run lint:check         # Lint all packages
pnpm -r run tsc:check          # Type-check all packages
pnpm -r run test               # Run all tests
pnpm hooks                     # Install git hooks
```

### Per-package

```bash
pnpm build          # Compile with SWC + generate declarations
pnpm lint:check     # Check with Biome
pnpm lint:fix       # Auto-fix lint issues
pnpm format:fix     # Auto-format
pnpm tsc:check      # Type-check
pnpm test           # Run tests (aidbox-client only)
pnpm storybook      # Dev server on :6006 (react-components only)
```

## Code Style

Enforced by Biome 2.1.3 — no ESLint or Prettier.

- **Indentation**: Tabs
- **Quotes**: Double quotes
- **Imports**: Auto-organized alphabetically
- **Lint rules**: `recommended` + `react` + `test` domains
- **FHIR types are excluded from linting** (`!src/fhir-types/**`)

## Architecture

### aidbox-client

- Main class: `AidboxClient<TBundle, TOperationOutcome, TUser>` in `src/client.ts`
- Error handling via `Result<T, E>` monad (`src/result.ts`)
- Pluggable auth: `AuthProvider` interface with `BrowserAuthProvider`, `BasicAuthProvider`, `SmartBackendServicesAuthProvider`
- Generated FHIR R4 types in `src/fhir-types/` (do not edit manually)
- Full FHIR HTTP coverage: instance/type/system-level operations

### react-components

- Base layer: shadcn/ui components in `src/shadcn/components/ui/`
- Custom components in `src/components/` (DataTable, CodeEditor, TreeView, etc.)
- Design tokens in `src/tokens.css` and `src/index.css` (CSS variables)
- Typography utilities in `src/typography.css`
- Icons in `src/icons.tsx` (custom FHIR domain SVGs + Lucide)
- All exports via `src/index.tsx`
- Path alias: `#shadcn/*` maps to `./src/shadcn/*`

### aidbox-fhirpath-lsp

- Web Worker-based LSP (`src/worker.ts`)
- React hooks for CodeMirror integration (`src/hooks.ts`)
- IndexedDB caching (`src/idb-cache.ts`)

## Testing

Tests live in `packages/aidbox-client/test/`. File parallelism is disabled (integration tests share state).

```bash
cd packages/aidbox-client
pnpm test           # Run once
pnpm test:watch     # Watch mode
```

React components use Storybook stories as visual tests (61 `.stories.tsx` files).

## Pre-commit Hook

Runs automatically on commit (install with `pnpm hooks`):

```bash
pnpm -r run lint:check
pnpm -r run tsc:check
```

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

- **common.yaml**: Lint + typecheck on every push
- **aidbox-client.yaml**: Client-specific checks
- **pages.yaml**: Deploy Storybook + TypeDoc to GitHub Pages (master only)
- **release.yaml**: NPM publishing

## Guidelines for AI Agents

1. **Always run `pnpm lint:fix` after editing code** to match project formatting (tabs, double quotes, import ordering).
2. **Do not edit files in `src/fhir-types/`** — these are generated. Use `pnpm generate-types` if types need updating.
3. **Build before type-checking** when working across packages: `pnpm -r run build && pnpm -r run tsc:check`.
4. **Use the `Result` monad** for error handling in `aidbox-client`, not try/catch.
5. **Follow shadcn/ui patterns** for new UI components: CVA variants, `cn()` utility, Radix primitives, `asChild` prop support.
6. **Design tokens over hardcoded values** — use CSS variables from `tokens.css` for colors, spacing, and typography.
7. **Add Storybook stories** for new or modified React components.
8. **Import path**: all react-components are exported from the single `src/index.tsx` entry point.
9. **Use the `/ui` skill** (Claude Code) when generating UI components to reference the full design system.
