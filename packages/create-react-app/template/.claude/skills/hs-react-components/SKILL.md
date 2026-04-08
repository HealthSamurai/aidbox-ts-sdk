---
name: hs:react-components
description: Look up Health Samurai Design System components, icons, and design tokens. Invoke during UI development.
argument-hint: "[component|icon|token]"
agent: Explore
# context: fork
disable-model-invocation: false
user-invocable: true
allowed-tools:
  - Read
  - WebFetch
  - AskUserQuestion
---

## How to answer

1. Find the matching component below and `Read` its reference file at `references/` (relative to this file).
2. If no exact match is found, **you MUST call the `AskUserQuestion` tool**:
   - Pick 2–4 most similar components from the list below (match by name or purpose).
   - Each option: `label` = component name, `description` = one-line purpose from the list.
3. The reference has `[Source]`/`[Story]` relative paths.
   1. `Read` `node_modules/@health-samurai/react-components/{path}` if local.
   2. `WebFetch` `https://raw.githubusercontent.com/HealthSamurai/aidbox-ts-sdk/master/packages/react-components/{path}` as fallback.
4. Return for each component:
   - **Props** — interface/type with descriptions.
   - **Usage example** — minimal working snippet from source/story.
   - **Import** — exact import path.

## Design Tokens
[References](references/tokens.md)

## Icons
[References](references/icons.md)

## Components

### Button
Actions with a text label, optionally with an icon.
[References](references/components/button.md)

### IconButton
Icon-only actions without a text label.
[References](references/components/icon-button.md)

### SplitButton
A primary action with alternative options behind a dropdown.
[References](references/components/split-button.md)

### ButtonDropdown
Picking one value from a searchable list of options.
[References](references/components/button-dropdown.md)

### Input
Single-line text or password entry.
[References](references/components/input.md)

### Select
Choosing one option from a fixed dropdown list.
[References](references/components/select.md)

### Combobox / MultiCombobox
Choosing one or multiple options with search/filtering.
[References](references/components/combobox.md)

### Checkbox
Toggling an independent boolean option on or off.
[References](references/components/checkbox.md)

### Switch
Toggling a setting that takes effect immediately.
[References](references/components/switch.md)

### RadioGroup
Choosing exactly one option from a small set.
[References](references/components/radio-group.md)

### RadioButtonGroup
Button-style radio group for visual selection.
[References](references/components/radio-button-group.md)

### Textarea
Multi-line text entry.
[References](references/components/textarea.md)

### Label
Accessible text label for a form control.
[References](references/components/label.md)

### InputOTP
Entering a one-time verification code digit by digit.
[References](references/components/input-otp.md)

### Form
Wrapping form fields with validation and error state management.
[References](references/components/form.md)

### Table
Rendering tabular data with basic markup (thead, tbody, tr, td).
[References](references/components/table.md)

### DataTable
TanStack Table wrapper with sticky header support.
[References](references/components/data-table.md)

### Tag
Colored label with shape, size, and vibrance variants.
[References](references/components/tag.md)

### Badge
Compact status indicator (default, secondary, destructive, outline).
[References](references/components/badge.md)

### Tile
Displaying a labeled key-value pair with an optional icon.
[References](references/components/tile.md)

### Skeleton
Placeholder pulse animation while content is loading.
[References](references/components/skeleton.md)

### Progress
Showing completion percentage as a filled bar.
[References](references/components/progress.md)

### Card
Grouping related content into a bordered container with header and footer.
[References](references/components/card.md)

### Avatar
Showing a user photo or initials in a circle.
[References](references/components/avatar.md)

### Dialog
Modal window for forms or content that requires focus.
[References](references/components/dialog.md)

### Sheet
Panel that slides in from a screen edge for secondary content.
[References](references/components/sheet.md)

### AlertDialog
Modal confirmation before a destructive or irreversible action.
[References](references/components/alert-dialog.md)

### Drawer
Draggable panel from any screen edge, with swipe-to-dismiss.
[References](references/components/drawer.md)

### DropdownMenu
Context actions triggered by a button click.
[References](references/components/dropdown-menu.md)

### ContextMenu
Context actions triggered by right-click.
[References](references/components/context-menu.md)

### Tabs
Switching between views in the same context.
[References](references/components/tabs.md)

### Popover
Floating panel with interactive content anchored to a trigger.
[References](references/components/popover.md)

### Tooltip
Brief text hint on hover, non-interactive.
[References](references/components/tooltip.md)

### HoverCard
Rich preview content on hover (heavier than Tooltip).
[References](references/components/hover-card.md)

### Breadcrumb
Showing the current page location in a hierarchy.
[References](references/components/breadcrumb.md)

### Pagination
Navigating between pages of a list.
[References](references/components/pagination.md)

### NavigationMenu
Top-level site navigation with dropdown sections.
[References](references/components/navigation-menu.md)

### Menubar
Application menu bar with nested items, checkboxes, and shortcuts.
[References](references/components/menubar.md)

### Sidebar
Collapsible side navigation panel for the app shell.
[References](references/components/sidebar.md)

### Alert
Persistent inline message: info, warning, critical, success.
[References](references/components/alert.md)

### Toast / Sonner
Temporary dismissible notification that appears and auto-hides.
[References](references/components/sonner.md)

### Accordion
Expanding/collapsing multiple titled sections in a list.
[References](references/components/accordion.md)

### Collapsible
Expanding/collapsing a single content block.
[References](references/components/collapsible.md)

### Resizable
Panels with draggable dividers for user-adjustable layout.
[References](references/components/resizable.md)

### ScrollArea
Scrollable container with custom styled scrollbars.
[References](references/components/scroll-area.md)

### Separator
Horizontal or vertical divider line between content.
[References](references/components/separator.md)

### AspectRatio
Maintaining a fixed width-to-height ratio on an element.
[References](references/components/aspect-ratio.md)

### Carousel
Swiping through a horizontal set of slides.
[References](references/components/carousel.md)

### Slider
Selecting a numeric value from a continuous range.
[References](references/components/slider.md)

### Toggle
On/off button for toggling a state.
[References](references/components/toggle.md)

### ToggleGroup
Exclusive selection within a button group.
[References](references/components/toggle-group.md)

### Calendar
Picking a date or date range from a month view.
[References](references/components/calendar.md)

### DatePickerInput
Date input field with a calendar popover.
[References](references/components/date-picker-input.md)

### Chart
Data visualization with themed Recharts wrapper.
[References](references/components/chart.md)

### Command
Searchable command palette (Cmd+K style).
[References](references/components/command.md)

### CodeEditor
Editing code or structured text with syntax highlighting.
[References](references/components/code-editor.md)

### SegmentControl
Switching between a small fixed set of views (tab-like but inline).
[References](references/components/segment-control.md)

### Toolbar
Horizontal bar grouping action buttons and controls.
[References](references/components/toolbar.md)

### CopyIcon
One-click copy-to-clipboard button.
[References](references/components/copy-icon.md)

### Tree
Low-level tree component (shadcn primitive).
[References](references/components/tree.md)

### TreeView
Displaying and navigating hierarchical nested data.
[References](references/components/tree-view.md)

### Sandbox
Container with visibility toggle and copy-to-clipboard.
[References](references/components/sandbox.md)

### FhirStructureView
Viewing FHIR resource definitions as a tree with types and cardinality.
[References](references/components/fhir-structure-view.md)

### OperationOutcomeView
Displaying FHIR OperationOutcome errors and warnings.
[References](references/components/operation-outcome-view.md)

### RequestLineEditor
Editing an HTTP method + path for REST API requests.
[References](references/components/request-line-editor.md)
