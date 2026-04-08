#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const positional = args.filter((a) => !a.startsWith("--"));

if (flags.has("--help") || flags.has("-h")) {
	console.log(`
Usage: pnpm create @health-samurai/react-app <project-name> [options]

Options:
  --aidbox    Include @health-samurai/aidbox-client
  --codegen   Include FHIR type generation (scripts/generate-types.ts)
  --skills    Include Claude Code skills and CLAUDE.md
  --help, -h  Show this help message
`);
	process.exit(0);
}

const targetName = positional[0];

if (!targetName) {
	console.error("Usage: pnpm create @health-samurai/react-app <project-name> [options]");
	process.exit(1);
}

const targetDir = resolve(targetName);

if (existsSync(targetDir)) {
	console.error(`Directory "${targetName}" already exists.`);
	process.exit(1);
}

const dir = fileURLToPath(new URL(".", import.meta.url));
const templateDir = join(dir, "template");

mkdirSync(targetDir, { recursive: true });
cpSync(templateDir, targetDir, { recursive: true });

if (!flags.has("--skills")) {
	rmSync(join(targetDir, ".claude"), { recursive: true, force: true });
	rmSync(join(targetDir, "CLAUDE.md"), { force: true });
}

const pkgPath = join(targetDir, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
pkg.name = basename(targetDir);

if (!flags.has("--aidbox")) {
	delete pkg.dependencies["@health-samurai/aidbox-client"];
}

if (!flags.has("--codegen")) {
	delete pkg.scripts["generate-types"];
	delete pkg.devDependencies["@atomic-ehr/codegen"];
	delete pkg.devDependencies["tsx"];
	rmSync(join(targetDir, "scripts"), { recursive: true, force: true });
}

writeFileSync(pkgPath, JSON.stringify(pkg, null, "\t") + "\n");

if (flags.has("--skills")) {
	const claudePath = join(targetDir, "CLAUDE.md");
	let claude = readFileSync(claudePath, "utf-8");

	const sections = [];
	if (flags.has("--codegen")) {
		sections.push("## FHIR Types\n\nGenerated via `@atomic-ehr/codegen` into `src/fhir-types/`.\n\n```bash\npnpm generate-types\n```\n\nEdit `scripts/generate-types.ts` to configure which resources to include.");
	}
	if (flags.has("--aidbox")) {
		sections.push("## Aidbox Client\n\n`@health-samurai/aidbox-client` provides a typed FHIR client with `Result<T, E>` error handling.");
	}
	if (sections.length > 0) {
		claude = claude.replace("## Components", sections.join("\n\n") + "\n\n## Components");
	}

	writeFileSync(claudePath, claude);
}

console.log(`\nCreated "${targetName}".\n`);
console.log("Next steps:\n");
console.log(`  cd ${targetName}`);
console.log("  pnpm install");
if (flags.has("--codegen")) {
	console.log("  pnpm generate-types");
}
console.log("  pnpm dev\n");
