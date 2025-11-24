import type { StorybookConfig } from "@storybook/react-vite";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): string {
	return dirname(require.resolve(join(value, "package.json")));
}
const config: StorybookConfig = {
	stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: ["@storybook/addon-docs", {name: '@storybook/addon-mcp', options: {toolsets: {dev: true, docs: true,}, experimentalFormat: 'markdown'}}],
	framework: {
		name: getAbsolutePath("@storybook/react-vite"),
		options: {},
	},
    features: {
		experimentalComponentsManifest: true,
	},
	typescript: {
		reactDocgen: "react-docgen-typescript",
	},
};
export default config;
