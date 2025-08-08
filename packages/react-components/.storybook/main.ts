import { dirname, join } from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): string {
	return dirname(require.resolve(join(value, "package.json")));
}
const config: StorybookConfig = {
	stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: ["@storybook/addon-docs"],
	framework: {
		name: getAbsolutePath("@storybook/react-vite"),
		options: {},
	},
	typescript: {
		reactDocgen: "react-docgen-typescript",
	},
};
export default config;
