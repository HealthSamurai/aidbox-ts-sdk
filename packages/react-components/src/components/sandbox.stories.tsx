import { Check, Copy } from "lucide-react";
import { Sandbox } from "./sandbox";

const meta = {
	title: "Component/Sandbox",
	component: Sandbox,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		url: {
			control: "text",
			description: "Display url",
		},
		showCopy: {
			control: "boolean",
			description: "Show the copy button",
		},
		copyIcon: {
			control: false,
			description: "Show the copy icon",
		},
		tooltipText: {
			control: "text",
			description: "Copy button tooltip text",
		},
		showToast: {
			control: "boolean",
			description: "Show toast on copy",
		},
		onCopy: {
			action: "copied",
			description: "Successful copy callback",
		},
	},
};

export default meta;

export const Default = {
	args: {
		url: "http://localhost:8080/fhir",
		showCopy: true,
		copyIcon: <Copy />,
		tooltipText: "Copy URL",
		showToast: true,
	},
};

export const LongUrl = {
	args: {
		url: "https://very-long-domain-name-that-should-be-truncated.example.com/api/v1/very-long-endpoint-name",
		showCopy: true,
		copyIcon: <Copy />,
		tooltipText: "Copy URL",
		showToast: true,
	},
};

export const WithoutCopy = {
	args: {
		url: "http://localhost:8080/fhir",
		showCopy: false,
	},
};

export const CustomIcon = {
	args: {
		url: "http://localhost:8080/fhir",
		showCopy: true,
		copyIcon: <Check />,
		tooltipText: "Copy URL",
		showToast: true,
	},
};

export const CustomTooltip = {
	args: {
		url: "http://localhost:8080/fhir",
		showCopy: true,
		copyIcon: <Copy />,
		tooltipText: "Copy link",
		showToast: true,
	},
};

export const WithoutToast = {
	args: {
		url: "http://localhost:8080/fhir",
		showCopy: true,
		copyIcon: <Copy />,
		tooltipText: "Copy URL",
		showToast: false,
	},
};

export const WithCallback = {
	args: {
		url: "http://localhost:8080/fhir",
		showCopy: true,
		copyIcon: <Copy />,
		tooltipText: "Copy URL",
		showToast: true,
		onCopy: (text: string) => {
			console.log("Copied:", text);
		},
	},
};
