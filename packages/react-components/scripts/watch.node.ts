import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";

function spawnWithDecorations(
	command: string,
	args: string[],
	decorationOut: string,
	decorationErr: string,
): ChildProcessWithoutNullStreams {
	const subprocess = spawn(command, args);
	subprocess.stdout.on("data", (data: Buffer) => {
		data
			.toString()
			.split("\n")
			.forEach((line) => console.log(decorationOut, line));
	});
	subprocess.stderr.on("data", (data: Buffer) => {
		data
			.toString()
			.split("\n")
			.forEach((line) => console.log(decorationErr, line));
	});
	return subprocess;
}

spawnWithDecorations(
	"tsc",
	["-b", "--force", "--watch", "--preserveWatchOutput", "--pretty", "false"],
	"     tsc> ",
	"     tsc! ",
);

spawnWithDecorations(
	"tailwindcss",
	["--watch", "--cwd", "./src", "-i", "./full.css", "-o", "../dist/bundle.css"],
	"tailwind> ",
	"tailwind! ",
);

spawnWithDecorations(
	"tsx",
	["--watch-path=./src", "./scripts/copy.node.ts"],
	"    copy> ",
	"    copy! ",
);
