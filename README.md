<p align="center">
  <img src=".github/logo.svg" width="64" height="64" alt="Health Samurai">
</p>

<h1 align="center">Aidbox TS SDK</h1>

<p align="center">
  A monorepo of TypeScript libraries for building healthcare applications on top of <a href="https://www.health-samurai.io/aidbox">Aidbox</a> and FHIR servers.
</p>

<p align="center">
  <a href="https://github.com/HealthSamurai/aidbox-ts-sdk/actions/workflows/common.yaml"><img src="https://github.com/HealthSamurai/aidbox-ts-sdk/actions/workflows/common.yaml/badge.svg" alt="Build"></a>
  <a href="https://github.com/HealthSamurai/aidbox-ts-sdk/actions/workflows/pages.yaml"><img src="https://github.com/HealthSamurai/aidbox-ts-sdk/actions/workflows/pages.yaml/badge.svg" alt="Pages"></a>
  <a href="https://www.npmjs.com/package/@health-samurai/react-components"><img src="https://img.shields.io/npm/v/@health-samurai/react-components/alpha?label=react-components" alt="npm react-components"></a>
  <a href="https://www.npmjs.com/package/@health-samurai/aidbox-client"><img src="https://img.shields.io/npm/v/@health-samurai/aidbox-client/alpha?label=aidbox-client" alt="npm aidbox-client"></a>
  <a href="https://www.npmjs.com/package/@health-samurai/aidbox-fhirpath-lsp"><img src="https://img.shields.io/npm/v/@health-samurai/aidbox-fhirpath-lsp/alpha?label=fhirpath-lsp" alt="npm fhirpath-lsp"></a>
  <a href="https://healthsamurai.github.io/aidbox-ts-sdk/react-components/"><img src="https://img.shields.io/badge/storybook-react--components-ff4785" alt="Storybook"></a>
</p>

## Packages

### [@health-samurai/react-components](packages/react-components)

A design system and component library built on React 19, Radix UI, and Tailwind CSS 4.
Includes 60+ accessible components — from standard UI primitives to healthcare-specific views like FHIR structure trees and OperationOutcome displays.

[Storybook](https://healthsamurai.github.io/aidbox-ts-sdk/react-components/) · [README](packages/react-components/README.md)

### [@health-samurai/aidbox-client](packages/aidbox-client)

A typed FHIR client with support for all FHIR interactions, multiple auth strategies, and a `Result<T, E>` return type for explicit error handling.

[API Docs](https://healthsamurai.github.io/aidbox-ts-sdk/aidbox-client/) · [README](packages/aidbox-client/README.md)

### [@health-samurai/aidbox-fhirpath-lsp](packages/aidbox-fhirpath-lsp)

A FHIRPath language server that runs entirely in the browser via Web Workers.
Provides autocompletion, diagnostics, hover, and go-to-definition for FHIRPath expressions inside CodeMirror editors.

[README](packages/aidbox-fhirpath-lsp/README.md)

## Getting started

```bash
# requires pnpm 10+
pnpm install
pnpm -r run build
```

## Development

| Command | Description |
|---------|-------------|
| `pnpm -r run build` | Build all packages |
| `pnpm -r run tsc:check` | Type-check all packages |
| `pnpm -r run lint:fix` | Lint and auto-fix with Biome |
| `pnpm hooks` | Install git pre-commit hooks |

Each package also has its own `build`, `lint`, and `tsc:check` scripts.
Run them from the package directory or via `pnpm --filter <package> run <script>`.
