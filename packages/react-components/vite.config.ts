import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import dts from "vite-plugin-dts";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		tailwindcss(),
		react(),
		dts({
			tsconfigPath: "./tsconfig.app.json",
			rollupTypes: true,
		}),
	],
	build: {
		emptyOutDir: true,
		lib: {
			entry: resolve(__dirname, "src/index.tsx"),
			name: "ReactComponents",
			formats: ["es"],
			fileName: "index",
		},
		rollupOptions: {
			external: ["react", "react-dom"],
		},
		cssCodeSplit: false,
	},
});
