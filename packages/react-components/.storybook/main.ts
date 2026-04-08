import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
	stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: [getAbsolutePath("@storybook/addon-docs"), getAbsolutePath("@storybook/addon-a11y"), getAbsolutePath("@storybook/addon-vitest"), getAbsolutePath("@storybook/addon-mcp")],
	framework: getAbsolutePath("@storybook/react-vite"),
	typescript: {
		reactDocgen: "react-docgen-typescript",
	},
};
export default config;

function getAbsolutePath(value: string): any {
    return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
