import type { Preview } from "@storybook/react-vite";
import "../src/complete.css";

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
	tags: ["autodocs"],
};

export default preview;
