#!/usr/bin/env node
// CLI for @health-samurai/react-components.
//
//   hs-react-components sync-skills [--symlink] [--dir <path>]
//
// Copies (default) or symlinks the design-system Claude skills shipped inside
// this package into the target project's .claude/skills/, and gitignores them.
// Run it once, or wire it to your project's postinstall so the skills always
// match the installed package version:
//
//   "scripts": { "postinstall": "hs-react-components sync-skills" }

import {
	cpSync,
	existsSync,
	lstatSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	symlinkSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillsSrc = join(pkgRoot, "skills");

const [cmd, ...rest] = process.argv.slice(2);

if (cmd !== "sync-skills") {
	console.log(`Usage: hs-react-components sync-skills [--symlink] [--dir <path>]

  Installs the design-system Claude skills into <project>/.claude/skills/.
  Default is a copy; pass --symlink to link against node_modules instead.
  Wire it to your project's postinstall to keep skills in sync with the package.`);
	process.exit(cmd ? 1 : 0);
}

const useSymlink = rest.includes("--symlink");
const dirFlag = rest.indexOf("--dir");
const targetRoot = dirFlag !== -1 ? rest[dirFlag + 1] : process.cwd();
const skillsDst = join(targetRoot, ".claude", "skills");

if (!existsSync(skillsSrc)) {
	console.error(`✖ no skills bundled in this package at ${skillsSrc}`);
	process.exit(1);
}

const skillNames = readdirSync(skillsSrc, { withFileTypes: true })
	.filter((d) => d.isDirectory() && existsSync(join(skillsSrc, d.name, "SKILL.md")))
	.map((d) => d.name);

if (!skillNames.length) {
	console.error("✖ no skills found to sync");
	process.exit(1);
}

mkdirSync(skillsDst, { recursive: true });

// Remove whatever is at the path, including a dangling symlink (rmSync with
// force follows the link, sees no target, and no-ops — so unlink links first).
function removeExisting(p) {
	let st;
	try {
		st = lstatSync(p);
	} catch {
		return;
	}
	if (st.isSymbolicLink() || st.isFile()) unlinkSync(p);
	else rmSync(p, { recursive: true, force: true });
}

for (const name of skillNames) {
	const from = join(skillsSrc, name);
	const to = join(skillsDst, name);
	removeExisting(to);
	if (useSymlink) {
		symlinkSync(from, to, "dir");
	} else {
		cpSync(from, to, { recursive: true });
	}
}

// Gitignore the synced skills — they are a derived artifact of the package.
try {
	const rel = relative(targetRoot, skillsDst).split("\\").join("/");
	const gitignore = join(targetRoot, ".gitignore");
	const lines = existsSync(gitignore)
		? readFileSync(gitignore, "utf-8").split("\n")
		: [];
	const entries = skillNames.map((n) => `${rel}/${n}/`);
	const missing = entries.filter((e) => !lines.includes(e));
	if (missing.length) {
		const block = ["", "# Health Samurai design-system skills (synced from the package)", ...missing];
		const body = [...lines, ...block].join("\n").replace(/\n{3,}/g, "\n\n");
		writeFileSync(gitignore, body.endsWith("\n") ? body : body + "\n");
	}
} catch {
	// non-fatal: gitignore is a convenience
}

const how = useSymlink ? "symlinked" : "copied";
console.log(`✓ ${how} ${skillNames.length} skill(s) → ${relative(targetRoot, skillsDst) || skillsDst}`);
console.log(`  ${skillNames.join(", ")}`);
