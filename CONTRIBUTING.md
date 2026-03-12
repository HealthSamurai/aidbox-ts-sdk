# Contributing to Aidbox TS SDK

Thanks for your interest in contributing!
This guide will help you get set up and submit your first pull request.

## Prerequisites

- **[pnpm](https://pnpm.io/installation) 10+**
- **Docker** — only needed if you want to run `aidbox-client` integration tests

## Setup

```bash
git clone https://github.com/HealthSamurai/aidbox-ts-sdk.git
cd aidbox-ts-sdk
pnpm install
pnpm hooks          # install pre-commit hooks (lint + typecheck)
pnpm -r run build   # initial build (required for cross-package types)
```

## Development workflow

1. **Create a branch** from `development`:
   ```bash
   git checkout -b my-feature development
   ```

2. **Make your changes.**
   Each package can be worked on independently:
   ```bash
   cd packages/<package>
   pnpm build        # compile
   pnpm tsc:check    # type-check
   pnpm lint:fix     # auto-fix formatting
   ```

3. **Run tests** (currently `aidbox-client` only):
   ```bash
   cd packages/aidbox-client
   pnpm test
   ```

4. **Preview UI changes** with Storybook:
   ```bash
   cd packages/react-components
   pnpm storybook    # opens on http://localhost:6006
   ```

5. **Commit.**
   The pre-commit hook will run `lint:check` and `tsc:check` across all packages.
   Fix any issues before pushing.

6. **Open a pull request** against `development`.

## Code style

All formatting and linting is handled by [Biome](https://biomejs.dev/).
There is no ESLint or Prettier.

- Indentation: **tabs**
- Quotes: **double quotes**
- Imports: auto-organized alphabetically by Biome

Run `pnpm lint:fix` to auto-format.
The pre-commit hook enforces this, so you don't need to think about it.

## Project structure

```
packages/
  aidbox-client/          # FHIR client library
  aidbox-fhirpath-lsp/    # FHIRPath language server (Web Worker)
  react-components/       # React design system & component library
```

Dependencies flow in one direction:

```
react-components -> aidbox-fhirpath-lsp -> aidbox-client
```

Always build in dependency order (`pnpm -r run build` handles this automatically).

## Guidelines

- **TypeScript strict mode** is enforced.
  Do not use `any` — prefer `unknown`, generics, or proper types.
- **Do not edit `src/fhir-types/`** in `aidbox-client` — these types are generated.
- **Use the `Result<T, E>` monad** for error handling in `aidbox-client`, not try/catch.
- **Follow shadcn/ui patterns** for new components: CVA variants, `cn()` utility, Radix primitives.
- **Use design tokens** (CSS variables from `tokens.css`) instead of hardcoded colors and spacing.
- **Add Storybook stories** for any new or modified React component.
- **Keep PRs focused.**
  One feature or fix per PR.
  Avoid unrelated refactors.

## Reporting bugs

Open an issue at [github.com/HealthSamurai/aidbox-ts-sdk/issues](https://github.com/HealthSamurai/aidbox-ts-sdk/issues) with:

- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Package name and version

## Questions?

If something is unclear, open a discussion or issue — we're happy to help.
