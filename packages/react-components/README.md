<p align="center">
  <img src="../../.github/logo.svg" width="64" height="64" alt="Health Samurai">
</p>

<h1 align="center">@health-samurai/react-components</h1>

<p align="center">
  A React component library for healthcare UIs.<br>
  Looks good out of the box, flexible enough for real-world applications.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@health-samurai/react-components"><img src="https://img.shields.io/npm/v/@health-samurai/react-components/alpha" alt="npm"></a>
  <a href="https://healthsamurai.github.io/aidbox-ts-sdk/react-components/"><img src="https://img.shields.io/badge/storybook-react--components-ff4785" alt="Storybook"></a>
</p>

Built on React 19, Radix UI, and Tailwind CSS 4.
Dark mode support and a design token system are included.

## How to use

```bash
pnpm add @health-samurai/react-components@alpha
```

Requires `react` and `react-dom` 19+.

Import the styles — without this, components will render unstyled:

```typescript
import "@health-samurai/react-components/full.css";
```

Add the fonts to the `<head>` of the page:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" rel="stylesheet">
```

## 60+ components

The library ships with a full set of UI primitives (based on [shadcn/ui](https://ui.shadcn.com/)) alongside custom components built specifically for healthcare developer tooling.

**UI Primitives** — Buttons, dialogs, forms, menus, popovers, tables, tabs, tooltips, and more.
Based on [Radix UI](https://www.radix-ui.com/) for accessibility, styled with Tailwind.
The full set is available in [Storybook](https://healthsamurai.github.io/aidbox-ts-sdk/react-components/).

**Healthcare & Developer Tools:**

| Component | Description |
|-----------|-------------|
| `CodeEditor` | CodeMirror 6-based editor with syntax highlighting for JSON, YAML, SQL, and HTTP |
| `DataTable` | TanStack Table wrapper with sticky headers, column resizing, and sorting |
| `FhirStructureView` | Tree view for displaying FHIR resource structure definitions |
| `OperationOutcomeView` | Renders FHIR OperationOutcome issues with severity indicators |
| `SegmentControl` | Multi-option selector (auto-switches to toggle for 2 items) |
| `SplitButton` | Button with a dropdown for secondary actions |
| `RequestLineEditor` | HTTP method + URL editor for API tools |
| `TreeView` | General-purpose hierarchical data display |

## Design tokens

A token system defined as CSS custom properties:

- **Colors** — Neutral, brand, semantic, and status palettes with light/dark variants (OKLch-based)
- **Typography** — Inter (sans) and JetBrains Mono (mono), with a size scale from `xxs` to `9xl`
- **Spacing** — 8px base unit with quarter, half, and multiplied variants
- **Radii** — `xs` through `max` for consistent rounding

## Storybook

All components and their variants are available in [Storybook](https://healthsamurai.github.io/aidbox-ts-sdk/react-components/).

To run locally:

```bash
pnpm storybook
```

## Development

The package lives in the `aidbox-ts-sdk` monorepo and is built with SWC + TypeScript + Tailwind CSS.

```bash
git clone git@github.com:HealthSamurai/aidbox-ts-sdk.git
cd aidbox-ts-sdk
pnpm install
cd packages/react-components
pnpm build          # Build the library
pnpm storybook      # Start Storybook on port 6006
pnpm tsc:check      # Type-check
pnpm lint:fix       # Lint and format with Biome
```

### Linking for local development

To use a local build of the library in another project:

```bash
cd aidbox-ts-sdk && pnpm link
cd <your-project> && pnpm link @health-samurai/react-components
```
