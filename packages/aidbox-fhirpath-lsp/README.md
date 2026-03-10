<p align="center">
  <img src="../../.github/logo.svg" width="64" height="64" alt="Health Samurai">
</p>

<h1 align="center">@health-samurai/aidbox-fhirpath-lsp</h1>

<p align="center">
  A FHIRPath language server that runs entirely in the browser.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@health-samurai/aidbox-fhirpath-lsp"><img src="https://img.shields.io/npm/v/@health-samurai/aidbox-fhirpath-lsp/alpha" alt="npm"></a>
</p>

No server process, no WebSocket connections — just a Web Worker providing autocompletion, diagnostics, hover information, and go-to-definition for [FHIRPath](https://hl7.org/fhirpath/) expressions in CodeMirror editors.

## Installation

```bash
pnpm add @health-samurai/aidbox-fhirpath-lsp
```

Peer dependencies: `react`, `react-dom`, `@codemirror/lsp-client`, `@codemirror/state`.

## How it works

The LSP server runs in a Web Worker and communicates with CodeMirror via a `MessageChannel`.
FHIR type information (StructureDefinitions) is resolved through the Aidbox client and cached in IndexedDB so subsequent loads are fast.

```
CodeMirror ←→ LSP Transport (MessageChannel) ←→ Web Worker (FHIRPath LSP)
                                                       ↕
                                                  Aidbox Client → FHIR Server
                                                       ↕
                                                    IndexedDB Cache
```

## Features

- **Autocompletion** — Context-aware suggestions for FHIRPath functions, fields, and resource types
- **Diagnostics** — Real-time validation and error highlighting
- **Hover** — Inline type information and documentation
- **Go-to-definition** — Jump to type definitions
- **Find references** — Locate all usages
- **Code actions** — Quick fixes and suggestions
- **Context type prefix** — With a resource type set (e.g. `Patient`), expressions like `name.first()` work without the `Patient.` prefix
- **IndexedDB caching** — StructureDefinitions are cached locally to avoid redundant network requests

## Usage

### React hook

```tsx
import { useCodeMirrorLsp } from "@health-samurai/aidbox-fhirpath-lsp";
import { AidboxClient } from "@health-samurai/aidbox-client";

function FhirPathEditor() {
  const { extension, setContextType } = useCodeMirrorLsp(client, {
    contextType: "Patient",
    debug: false,
  });

  // `extension` goes into the CodeMirror editor setup
  // `setContextType("Observation")` switches context dynamically
}
```

### Standalone (no React)

```typescript
import { createCodeMirrorLsp } from "@health-samurai/aidbox-fhirpath-lsp";
import { EditorState } from "@codemirror/state";

const { extension, setContextType } = createCodeMirrorLsp(client, {
  contextType: "Patient",
});

const state = EditorState.create({
  doc: "name.where(use = 'official').first()",
  extensions: [
    // ... other CodeMirror extensions
    extension,
  ],
});
```

### Caching

The `wrapCache` helper adds IndexedDB caching to resolve/search functions:

```typescript
import { wrapCache } from "@health-samurai/aidbox-fhirpath-lsp";

const cachedCallbacks = wrapCache({
  resolve: (typeName) => fetchStructureDefinition(typeName),
  search: (kind) => searchStructureDefinitions(kind),
});
```

## LSP methods supported

| Method | Description |
|--------|-------------|
| `textDocument/completion` | Autocomplete suggestions |
| `textDocument/hover` | Type info and documentation |
| `textDocument/definition` | Jump to definition |
| `textDocument/references` | Find all references |
| `textDocument/publishDiagnostics` | Error and warning markers |
| `textDocument/documentSymbol` | Document outline |
| `textDocument/codeAction` | Quick fixes |

## Development

```bash
cd packages/aidbox-fhirpath-lsp
pnpm build          # Build library + worker
pnpm tsc:check      # Type-check
pnpm lint:fix       # Lint and format with Biome
```

The worker is built separately by Vite as a standalone ES module (see `vite.config.ts`).
