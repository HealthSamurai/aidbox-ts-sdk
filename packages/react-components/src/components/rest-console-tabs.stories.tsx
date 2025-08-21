import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { action } from "storybook/actions";
import { RestConsoleTabs, type Tab } from "./rest-console-tabs";

const meta: Meta<typeof RestConsoleTabs> = {
	title: "Component/Rest console tabs",
	component: RestConsoleTabs,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof RestConsoleTabs>;

function RestConsoleTabsWrapper({
	tabs,
	selectedTabId,
}: {
	tabs: Tab[];
	selectedTabId: string;
}) {
	const [currentSelectedTabId, setSelectedTabId] =
		React.useState(selectedTabId);
	const [currentTabs, setTabs] = React.useState(tabs);

	const handleSelectTab = (tabId: string) => {
		action("onSelectTab")(tabId);
		setSelectedTabId(tabId);
	};

	const handleCloseTab = (tabId: string) => {
		action("onCloseTab")(tabId);
		const updatedTabs = currentTabs.filter((tab) => tab.id !== tabId);
		setTabs(updatedTabs);
	};

	return (
		<RestConsoleTabs
			tabs={currentTabs}
			selectedTabId={currentSelectedTabId}
			onSelectTab={handleSelectTab}
			onCloseTab={handleCloseTab}
		/>
	);
}

const manyTabs: Tab[] = [
	{
		id: "1",
		method: "GET",
		path: "/fhir/Patient",
	},
	{
		id: "2",
		method: "POST",
		path: "/fhir/Patient",
	},
	{
		id: "3",
		method: "PUT",
		path: "/fhir/Patient/123",
	},
	{
		id: "4",
		method: "DELETE",
		path: "/fhir/Patient/456",
	},
	{
		id: "5",
		method: "PATCH",
		path: "/fhir/Observation",
	},
	{
		id: "6",
		method: "GET",
		path: "/fhir/Organization",
	},
];

export const Default: Story = {
	args: {
		tabs: manyTabs,
		selectedTabId: "3",
	},
	render: (args) => <RestConsoleTabsWrapper {...args} />,
};
