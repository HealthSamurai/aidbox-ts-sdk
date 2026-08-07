#!/usr/bin/env node
// Generates the `hs-react-components` Claude skill from the component source.
//
//   node scripts/skill/generate.mjs           # write files
//   node scripts/skill/generate.mjs --check    # fail if anything is stale (CI)
//
// Single source of truth for curated metadata (title, description, Figma link)
// is scripts/skill/config.json. Everything technical (variants, states,
// exports, props type) is extracted from the .tsx source, so component docs
// never drift from the code.
//
// Guard: if a component exists in src/ but is missing from config.json, this
// script errors. That is what forces "add a component -> enrich its doc".

import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractComponent } from "./extract.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..", "..");
const srcDir = join(pkgRoot, "src");
const skillDir = join(pkgRoot, "skills", "hs-react-components");
const refDir = join(skillDir, "references", "components");

const CHECK = process.argv.includes("--check");
const PKG = "@health-samurai/react-components";

const config = JSON.parse(readFileSync(join(here, "config.json"), "utf-8"));

// ---------------------------------------------------------------------------
// Guard: every component .tsx in src must be represented in config.json.
// ---------------------------------------------------------------------------

const COMPONENT_DIRS = ["components", "shadcn/components/ui"];
const discovered = [];
for (const rel of COMPONENT_DIRS) {
	const abs = join(srcDir, rel);
	if (!existsSync(abs)) continue;
	for (const f of readdirSync(abs)) {
		if (!f.endsWith(".tsx") || f.endsWith(".stories.tsx")) continue;
		discovered.push(`src/${rel}/${f}`);
	}
}

const configSources = new Set(config.components.map((c) => c.source));
const missing = discovered.filter((s) => !configSources.has(s));
if (missing.length) {
	console.error(
		`\n✖ ${missing.length} component source file(s) are not in scripts/skill/config.json:\n` +
			missing.map((s) => `   - ${s}`).join("\n") +
			`\n\nAdd an entry (name, title, description, source, story) for each, then re-run.\n`,
	);
	process.exit(1);
}

// ---------------------------------------------------------------------------
// Markdown helpers
// ---------------------------------------------------------------------------

const NOISE_PROPS = new Set([
	"children",
	"className",
	"class",
	"asChild",
	"ref",
	"key",
	"style",
]);

const code = (s) => `\`${s}\``;

function isBooleanOptions(options) {
	return (
		options &&
		options.length > 0 &&
		options.every(
			(o) => o === "true" || o === "false" || o === true || o === false,
		)
	);
}

// Merge cva variants (authoritative for enums) with story argTypes/args.
function buildStates({ cva, story }) {
	const states = {}; // name -> { type: 'enum'|'boolean', options?, default? }

	for (const [name, v] of Object.entries(cva)) {
		if (isBooleanOptions(v.options)) {
			states[name] = { type: "boolean", default: v.default };
		} else {
			states[name] = { type: "enum", options: v.options, default: v.default };
		}
	}

	const hasCva = Object.keys(cva).length > 0;
	for (const [name, at] of Object.entries(story.argTypes)) {
		if (NOISE_PROPS.has(name)) continue;
		const argDefault = story.args?.[name];
		if (states[name]) {
			if (states[name].default === undefined && argDefault !== undefined) {
				states[name].default = argDefault;
			}
			continue;
		}
		if (at.control === "boolean") {
			states[name] = { type: "boolean", default: argDefault };
		} else if (
			!hasCva &&
			at.options &&
			at.options.length &&
			["select", "radio", "inline-radio"].includes(at.control)
		) {
			states[name] = { type: "enum", options: at.options, default: argDefault };
		}
	}
	return states;
}

function statesTable(states) {
	const names = Object.keys(states);
	if (!names.length) return "";
	const rows = names.map((name) => {
		const s = states[name];
		const opts =
			s.type === "boolean"
				? "`boolean`"
				: s.options.map((o) => code(o)).join(" \\| ");
		const def = s.default === undefined ? "—" : code(String(s.default));
		return `| ${code(name)} | ${opts} | ${def} |`;
	});
	return ["| Prop | Options | Default |", "| --- | --- | --- |", ...rows].join(
		"\n",
	);
}

function linkLine(c) {
	const parts = [];
	if (c.storybook) parts.push(`[Storybook](${c.storybook})`);
	if (c.figma) parts.push(`[Figma](${c.figma})`);
	if (c.source) parts.push(`[Source](${c.source})`);
	if (c.story) parts.push(`[Story](${c.story})`);
	return parts.join(" · ");
}

function renderComponent(c) {
	const src = join(pkgRoot, c.source);
	const storyAbs = c.story ? join(pkgRoot, c.story) : undefined;
	const data = extractComponent({
		sourceFile: src,
		storyFile: storyAbs && existsSync(storyAbs) ? storyAbs : undefined,
	});

	const states = buildStates(data);
	// Sub-components / components you actually render, minus cva helpers.
	const components = data.exports.values.filter((v) => !/Variants$/.test(v));
	const importNames = components.length ? components : data.exports.values;

	const out = [`# ${c.title}`, "", `> ${c.description}`, ""];

	// Import
	if (importNames.length) {
		out.push("**Import**", "");
		out.push("```tsx");
		out.push(`import { ${importNames.join(", ")} } from "${PKG}";`);
		out.push("```", "");
	}

	// Props / states
	const table = statesTable(states);
	if (table) {
		out.push("**Props / states**", "", table, "");
	}

	// Composition (when the component ships several sub-parts)
	if (components.length > 1) {
		out.push("**Composition**", "");
		out.push(components.map(code).join(" · "), "");
	}

	// Exported props type, verbatim (capped)
	if (data.propsType) {
		let t = data.propsType.trim();
		if (t.length > 900) t = `${t.slice(0, 900)}\n/* … see Source */`;
		out.push("**Type**", "", "```ts", t, "```", "");
	}

	// Links
	const links = linkLine(c);
	if (links) out.push("**Links**", "", links, "");

	out.push(
		"_For the full prop list and a working example, `Read` the Source and Story files above._",
		"",
	);

	return out.join("\n");
}

// ---------------------------------------------------------------------------
// tokens.md + icons.md (offline-usable vocabulary)
// ---------------------------------------------------------------------------

function semanticColorVars() {
	const css = readFileSync(join(srcDir, "index.css"), "utf-8");
	const set = new Set();
	for (const m of css.matchAll(/--color-([a-z0-9-]+)/g)) set.add(m[1]);
	// keep only semantic namespaces, drop the raw palette (blue-500 etc.)
	const semanticPrefixes = [
		"bg-",
		"text-",
		"fg-",
		"border-",
		"ring-",
		"utility-",
	];
	return [...set]
		.filter((n) => semanticPrefixes.some((p) => n.startsWith(p)))
		.sort();
}

function typoClasses() {
	const css = readFileSync(join(srcDir, "typography.css"), "utf-8");
	return [
		...new Set([...css.matchAll(/\.(typo-[a-z0-9-]+)/g)].map((m) => m[1])),
	].sort();
}

function renderTokens() {
	const vars = semanticColorVars();
	const groups = {};
	for (const v of vars) {
		const prefix = v.split("-")[0];
		groups[prefix] ??= [];
		groups[prefix].push(v);
	}
	const utilFor = (prefix) =>
		({
			bg: "bg",
			text: "text",
			fg: "text / fill",
			border: "border",
			ring: "ring",
		})[prefix] || prefix;

	const out = [
		"# Design Tokens",
		"",
		"Use **only** these semantic tokens. Never hardcode hex colors or raw",
		"palette utilities (`text-blue-500`, `bg-[#f5f5f6]`).",
		"",
		"Each `--color-<name>` maps to a Tailwind utility. E.g. `--color-bg-secondary`",
		"→ `bg-bg-secondary`; `--color-text-primary` → `text-text-primary`;",
		"`--color-border-error` → `border-border-error`.",
		"",
		"## Typography",
		"",
		"Use these semantic classes instead of raw `font-*`/`text-*`/`leading-*`:",
		"",
		typoClasses().map(code).join(" · "),
		"",
		"## Semantic colors",
		"",
	];
	for (const prefix of Object.keys(groups).sort()) {
		out.push(`### ${prefix} — use as \`${utilFor(prefix)}-<token>\``, "");
		out.push(groups[prefix].map(code).join(" · "), "");
	}
	out.push("[Source](src/index.css) · [Source](src/tokens.css)", "");
	return out.join("\n");
}

function renderIcons() {
	const tsx = readFileSync(join(srcDir, "icons.tsx"), "utf-8");
	const names = [
		...new Set(
			[
				...tsx.matchAll(/export\s+(?:function|const)\s+([A-Z][A-Za-z0-9]+)/g),
			].map((m) => m[1]),
		),
	].sort();
	return [
		"# Icons",
		"",
		`The design system ships ${names.length} built-in icon components, imported from`,
		`\`${PKG}\`:`,
		"",
		names.map(code).join(" · "),
		"",
		"For general-purpose icons use `lucide-react` (already a dependency).",
		"",
		"[Source](src/icons.tsx)",
		"",
	].join("\n");
}

// ---------------------------------------------------------------------------
// SKILL.md
// ---------------------------------------------------------------------------

function renderSkillMd() {
	const list = config.components
		.map(
			(c) =>
				`### ${c.title}\n${c.description}\n[References](references/components/${c.name}.md)`,
		)
		.join("\n\n");

	return `---
name: hs:react-components
description: Look up Health Samurai Design System components, icons, and design tokens. Invoke during UI development.
argument-hint: "[component|icon|token]"
agent: Explore
disable-model-invocation: false
user-invocable: true
allowed-tools:
  - Read
  - WebFetch
  - AskUserQuestion
---

<!-- GENERATED by scripts/skill/generate.mjs in @health-samurai/react-components. Do not edit by hand. -->

## How to answer

1. Find the matching component below and \`Read\` its reference at \`references/components/<name>.md\`. The reference lists its props, states/variants, defaults, and composition parts.
2. If you need the full prop list or a usage example, follow the \`[Source]\`/\`[Story]\` links in the reference:
   1. \`Read\` \`node_modules/${PKG}/{path}\` if installed locally.
   2. \`WebFetch\` \`https://raw.githubusercontent.com/HealthSamurai/aidbox-ts-sdk/master/packages/react-components/{path}\` as fallback.
3. If no component matches, **call \`AskUserQuestion\`** with the 2–4 closest components (label = name, description = one-line purpose).
4. When writing UI code, **always follow the [rules](references/patterns.md)** — semantic tokens only, \`typo-*\` classes, \`cn()\` composition, \`data-slot\`, \`cva\` for variants.

## Rules & patterns
[References](references/patterns.md)

## Design tokens
[References](references/tokens.md)

## Icons
[References](references/icons.md)

## Components

${list}
`;
}

// ---------------------------------------------------------------------------
// Write / check
// ---------------------------------------------------------------------------

const files = new Map();
files.set(join(skillDir, "SKILL.md"), renderSkillMd());
files.set(join(skillDir, "references", "tokens.md"), renderTokens());
files.set(join(skillDir, "references", "icons.md"), renderIcons());
for (const c of config.components) {
	files.set(join(refDir, `${c.name}.md`), renderComponent(c));
}

if (CHECK) {
	let stale = 0;
	for (const [path, content] of files) {
		const cur = existsSync(path) ? readFileSync(path, "utf-8") : null;
		if (cur !== content) {
			stale++;
			console.error(`✖ stale: ${path.replace(`${pkgRoot}/`, "")}`);
		}
	}
	if (stale) {
		console.error(`\n${stale} file(s) out of date. Run: pnpm generate-skill\n`);
		process.exit(1);
	}
	console.log(`✓ skill is up to date (${files.size} files checked)`);
	process.exit(0);
}

mkdirSync(refDir, { recursive: true });
for (const [path, content] of files) writeFileSync(path, content);
console.log(`✓ generated ${files.size} files for hs-react-components`);
console.log(
	`  ${config.components.length} components · tokens · icons · SKILL.md`,
);
