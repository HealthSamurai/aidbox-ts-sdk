import fs from "node:fs";
import path from "node:path";

const EXTENSIONS = ["css"];

function makeGlob(extension: string): string {
	return `**/*.${extension}`;
}

function makeGlobs(extensions: string[]): string[] {
	return extensions.map(makeGlob);
}

if (!fs.existsSync("dist")) {
	fs.mkdirSync("dist");
}

const suffixes = fs
	.globSync(makeGlobs(EXTENSIONS), {
		cwd: "./src",
		withFileTypes: true,
	})
	.filter((entry) => entry.isFile())
	.map((entry) =>
		path.join(
			"src",
			path.relative("src", path.join(entry.parentPath, entry.name)),
		),
	);

for (const srcPath of suffixes) {
	const dstPath = path.join("dist", srcPath);

	const dstBasePath = path.dirname(dstPath);

	if (!fs.existsSync(dstBasePath)) {
		console.log(`Create ${dstBasePath}`);
		fs.mkdirSync(dstBasePath, { recursive: true });
	}

	if (!fs.existsSync(dstPath)) {
		console.log(`Copy ${srcPath} to ${dstPath}`);
		fs.copyFileSync(srcPath, dstPath);
		continue;
	}

	const srcStat = fs.statSync(srcPath, { bigint: true });
	const dstStat = fs.statSync(dstPath, { bigint: true });

	let shouldCopy = true;

	if (!dstStat.isFile()) {
		console.log(`Remove non-file ${dstPath}`);
		fs.rmSync(dstPath, { recursive: true, force: true });
	} else if (dstStat.mtimeNs >= srcStat.mtimeNs) {
		console.log(`File up-to-date ${dstPath}`);
		shouldCopy = false;
	}

	if (shouldCopy) {
		console.log(`Copy ${srcPath} to ${dstPath}`);
		fs.copyFileSync(srcPath, dstPath);
	}
}
