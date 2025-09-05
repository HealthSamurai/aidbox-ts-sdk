### Figma Mapping Rules → Design System (react-components)

These rules are mandatory for any work on synchronizing Figma layouts with the `react-components` package code.

## 1) Source of Truth: Tokens Only from @theme in `src/index.css`

- **Always** use only tokens from the `@theme { ... }` section of the `packages/react-components/src/index.css` file.
- **1:1 name correspondence**: Figma variables are mapped to semantically similar tokens from `@theme` (do not use arbitrary/alternative tokens).
- **No raw values**: do not insert direct HEX/RGB/px etc., only classes/variables tied to `@theme`.
- **Examples of correct references**:
  - Text: `text-text-primary`, `text-text-secondary`, `text-text-tertiary`, `text-text-link`.
  - Background: `bg-bg-primary`, `bg-bg-secondary`, `bg-bg-tertiary`.
  - Border: `border-border-primary`, `border-border-secondary`.
  - Focus/ring: `ring-utility-blue/70`, `focus-visible:ring-utility-blue/70`.

## 1.1) CRITICAL: Text vs Foreground Tokens

**NEVER confuse these two token types:**

- **`--color-text-*`** tokens → use as `text-text-*` classes (for actual text content only)
- **`--color-fg-*`** tokens → use as `text-fg-*` classes (for all foreground elements that lay on top: icons, decorative elements, symbols, etc.)

**Key principle:** `fg` is for everything that lies **on top** of the background (foreground layer).

**Examples:**

- ✅ Correct: `text-text-primary` (for paragraph text, headings, labels, actual readable text)
- ✅ Correct: `text-fg-primary` (for icon colors, symbols, decorative elements, anything visual on top)
- ❌ Wrong: `text-fg-primary` for readable text content (paragraphs, headings, labels)
- ❌ Wrong: `text-text-primary` for icons and visual elements

## 2) Typography: Only Presets from `src/typography.css`

- Any text styles are taken **from ready-made presets** in `packages/react-components/src/typography.css`.
- Do not compose typography from utility classes (`text-xl`, `leading-7`, `font-medium`, ...).
- If a preset doesn't exist — add a new one using **only** tokens from `@theme`/`tokens.css`.
- Examples of existing presets:
  - `.typo-body` — Inter 14/20 Regular.
  - `.typo-label` — Inter 14/20 Medium.
  - `.typo-page-header` — Inter 20/28 Medium + `letter-spacing: var(--font-tracking-tight)`.

## 3) Letter-spacing from Figma → `--font-tracking-*` in `src/tokens.css`

- Always map `letter-spacing` (tracking) to variables from `packages/react-components/src/tokens.css`:
  - `--font-tracking-tighter`, `--font-tracking-tight`, `--font-tracking-normal`, `--font-tracking-wide`, ...
- Apply letter-spacing exclusively through a preset in `typography.css`.

## 4) CRITICALLY IMPORTANT RULES FOR WORKING WITH TOKENS

### 4.1) Creating New Tokens

- **NEVER** create new CSS tokens without explicit user approval
- Always show a list of missing tokens and wait for approval
- **NEVER** assign HEX colors directly to tokens
- All values must be taken from `tokens.css` through `var()` references

### 4.2) Checking Existing Tokens

- Always check existing tokens before creating new ones
- If a token is missing in `index.css` - **MANDATORILY** ask the user what to do
- **DO NOT CREATE** tokens independently without coordination
- Even if it seems like a token is needed - **ALWAYS** coordinate with the user

### 4.3) Token Format

- Use **short format** without `--color-` prefix
- Examples of correct format:
  - `border-fg-secondary` instead of `border-[--color-fg-secondary]`
  - `bg-bg-link` instead of `bg-[--color-bg-bg-link]`
  - `text-text-primary` instead of `text-[--color-text-primary]`

## 5) Figma Layout Work Process

1. Received link/node → extract variables/typography.
2. Match colors/backgrounds/borders strictly with tokens from `@theme` `src/index.css` and use appropriate classes (`text-…`, `bg-…`, `border-…`).
3. Match typography with presets from `typography.css` with `typo-` prefix. If none exists — add a new preset with tokens from `@theme`/`tokens.css`.
4. Make changes **only to styles**, without changing component logic/structure.
5. If there's no 1:1 correspondence or there are doubts — stop and request clarification.
6. **WHEN TOKENS ARE MISSING**: show a list of missing ones and wait for user decision.

## 6) What is Not Allowed

- Cannot use values not from `@theme` (including variables outside the `@theme` section, arbitrary CSS variables, HEX/RGB, etc.).
- Cannot compose typography from utility classes instead of presets.
- Cannot change component behavior/logic for style tasks.
- **NOT ALLOWED** to create new tokens without user coordination.
- **NOT ALLOWED** to use HEX colors directly in tokens.

## 7) Example (Breadcrumb)

- Colors:
  - Header (active page): `text-text-primary` + `.page-header` preset (Inter 20/28 Medium + tracking tight).
  - List/chips (regular breadcrumbs): `text-text-tertiary` (gray from Figma) and background `bg-bg-tertiary`.
  - Separator: `text-text-quaternary`, size `text-xs`.
- Typography:
  - List/links: use `.typo-body`.
  - Active page: `.typo-page-header`.
- Layout:
  - Only classes (layout/spacing), logic/DOM structure unchanged.
  - Default separator — `/` symbol.

## 8) Class Naming Referencing `@theme` Tokens

- `text-text-…` → `var(--color-text-…)` (for actual text content)
- `text-fg-…` → `var(--color-fg-…)` (for icons, decorative elements)
- `bg-…` → `var(--color-bg-…)`
- `border-…` → `var(--color-border-…)`
- `ring-utility-…` → `var(--color-utility-…)`
- Hovers/states use corresponding tokens `…_hover`, `…_on-brand`, etc., if they exist in `@theme`.

## 9) Quality Check

- Linter without errors.
- Visual correspondence to Figma, including sizes, spacing, letter-spacing, states.
- Tokens and presets are used correctly; absence of raw values.
- All tokens exist in the `@theme` section of `index.css`.
- Correct token format is used (without `--color-` prefix).

## 10) Code Refactoring Rules

### 10.1) Style Organization

- **Always** extract all styles to constants at the top of the file
- **Each CSS class** must be on its own separate line within `cn()` calls
- **Group styles** with descriptive comments (Layout, Typography, Colors, States, etc.)
- **Use meaningful names** for style constants (e.g., `baseButtonStyles`, `formItemStyles`)
- **CRITICAL: Typography** - NEVER use utility classes (`text-sm`, `font-medium`, `leading-6`), ALWAYS use presets from `typography.css` (`typo-body`, `typo-label`, `typo-page-header`)

### 10.2) Style Extraction Examples

```typescript
// ✅ Correct: Styles extracted and organized
const baseButtonStyles = cn(
  // Layout
  "inline-flex",
  "items-center",
  "justify-center",
  // Typography
  "typo-body", // Use preset from typography.css
  // Shape
  "rounded-lg",
  // Interaction
  "transition-colors"
);

// ❌ Wrong: Inline styles and utility typography
className = "inline-flex items-center text-sm font-medium rounded-lg";

// ❌ Wrong: Using utility typography classes
"text-sm",
"font-medium",
"leading-6",

// ✅ Correct: Using typography presets
"typo-body",
"typo-label",
"typo-page-header",
```

### 10.3) Token Replacement

- **Always** replace shadcn tokens with project tokens:

  - `text-muted-foreground` → `text-text-secondary`
  - `text-destructive` → `text-text-error-primary`
  - `bg-primary` → `bg-bg-link`
  - `border-input` → `border-border-primary`
  - `focus-visible:ring-ring` → `focus-visible:ring-utility-blue/70`

- **Always** replace utility typography with presets:
  - `text-sm font-medium` → `typo-label`
  - `text-base` → `typo-body`
  - `text-xl font-medium` → `typo-page-header`
  - Any combination of `text-*`, `font-*`, `leading-*` → appropriate `typo-*` preset

### 10.4) cn() Usage

- **Always** use `cn()` for combining styles
- **First parameter**: base styles constant
- **Second parameter**: conditional/variant styles
- **Last parameter**: `className` prop for overrides

```typescript
// ✅ Correct usage
className={cn(baseStyles, variantStyles, className)}
```

## 11) Algorithm for Actions When Token is Missing

1. **Check** existing tokens in the `@theme` section of `index.css`
2. **Show** the user a list of missing tokens
3. **Wait** for explicit approval to create
4. **Create** token only after receiving approval
5. **Use** correct format: `--color-{category}-{name}`
6. **Reference** existing variables from `tokens.css` through `var()`
