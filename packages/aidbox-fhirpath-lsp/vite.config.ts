import { defineConfig } from "vite";

export default defineConfig({
	build: {
		lib: {
			entry: ["./src/worker.ts"],
			name: "AidboxFhirPath",
			formats: ["iife"],
		},
		minify: true,
	},
});
