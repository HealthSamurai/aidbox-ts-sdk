---
name: hs:layouts
description: Recommended page & app layout patterns for the Health Samurai design system (app shell, list page, master-detail, editor, console, builder). Consult when composing a screen.
argument-hint: "[layout]"
agent: Explore
disable-model-invocation: false
user-invocable: true
allowed-tools:
  - Read
  - AskUserQuestion
---

## What this is

A catalog of **recommended** layout patterns distilled from real Aidbox UI
screens, built entirely from `@health-samurai/react-components`.

These are **recommendations, not requirements.** Use a pattern when the screen
you are building matches it; adapt freely; ignore what does not fit. When a task
maps cleanly onto one of these, starting from its skeleton saves time and keeps
screens consistent — but a bespoke layout is always fine.

The one hard rule still applies: whatever you build, follow the design-system
[rules](../hs-react-components/references/patterns.md) (semantic tokens, `typo-*`,
`cn()`, `data-slot`). For component props, use the `hs:react-components` skill.

## How to use

1. Skim the patterns below and pick the closest match (or none).
2. `Read` its reference for a skeleton, the components it composes, and variations.
3. Swap in your content; look up any component's API via `hs:react-components`.
4. If unsure which fits, `AskUserQuestion` with the 2–3 closest patterns.

## Patterns

### App shell
The outer chrome every screen sits in: fixed left nav sidebar + top header with
breadcrumb and account actions + scrollable content region.
[References](references/app-shell.md)

### Page header
Breadcrumb + page title + right-aligned actions, optionally followed by a tab bar
for sub-views (Instances / Profiles / …).
[References](references/page-header.md)

### List page
A searchable/filterable collection: query or toolbar row → `DataTable` with row
selection → bulk-action + pagination footer.
[References](references/list-page.md)

### Master–detail
A list on the left and a closable detail panel on the right (with its own tabs),
often as a resizable split.
[References](references/master-detail.md)

### Editor view
A resource/code editor: toolbar (JSON/YAML toggle, format, save) → `CodeEditor` →
optional validation/error dock → footer actions.
[References](references/editor-view.md)

### Console / workbench
A three-region tool: secondary left panel (history/collections/tables) → tabbed
request editor → request + response split with tab strips.
[References](references/console-workbench.md)

### Builder + preview
A form-based builder on the left, a live data/preview panel on the right, and a
bottom result dock with view toggles (Table / List / Chart).
[References](references/builder-preview.md)

### States (empty · loading · error)
Cross-cutting recommendations: empty states, loading skeletons, and the
validation/error dock. Compose these into any pattern above.
[References](references/states.md)
