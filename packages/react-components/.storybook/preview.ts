import type { Preview } from "@storybook/react-vite";
import "../src/full.css";

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		options: {
			storySort: {
				order: [],
				method: "alphabetical",
			},
		},
	},
	tags: ["autodocs"],
};

export default preview;
