import type { ItemInstance } from "@headless-tree/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Ellipsis, Pin, Plus } from "lucide-react";
import React from "react";
import { action } from "storybook/actions";
import { Button } from "#shadcn/components/ui/button.js";
import { PinIcon } from "../icons";
import type { TreeViewItem } from "./tree-view";
import { TreeView } from "./tree-view";

const meta: Meta<typeof TreeView> = {
	title: "Component/Tree view",
	component: TreeView,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
};
type ItemMeta = {
	pinned?: boolean;
	method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
	path?: string;
};

export default meta;
type Story = StoryObj<typeof TreeView<ItemMeta>>;

const items: Record<string, TreeViewItem<ItemMeta>> = {
	root: {
		name: "Root",
		children: ["collection1", "collection2", "collection3"],
	},
	collection1: {
		name: "Collection 1",
		children: ["request1", "request2", "request3"],
		meta: {
			pinned: true,
		},
	},
	collection2: {
		name: "Collection 2",
		children: ["request4", "request5", "request6"],
	},
	collection3: {
		name: "New Collection",
		children: [
			"request7",
			"request8",
			"request9",
			"request10",
			"request11",
			"collection4",
		],
	},
	collection4: {
		name: "New Collection",
		children: ["request12", "request13", "request14"],
	},
	request1: {
		meta: {
			method: "GET",
			path: "/request1",
		},
		name: "Request 1",
	},
	request2: {
		meta: {
			method: "POST",
			path: "/request2",
		},
		name: "Request 2",
	},
	request3: {
		meta: {
			method: "PUT",
			path: "/request3",
		},
		name: "Request 3",
	},
	request4: {
		meta: {
			method: "DELETE",
			path: "/request4",
		},
		name: "Request 4",
	},
	request5: {
		meta: {
			method: "PATCH",
			path: "/request5",
		},
		name: "Request 5",
	},
	request6: {
		meta: {
			method: "GET",
			path: "/request6",
		},
		name: "Request 6",
	},
	request7: {
		meta: {
			method: "PATCH",
			path: "/fhir/Patient/123",
		},
		name: "Request 7",
	},
	request8: {
		meta: {
			method: "DELETE",
			path: "/fhir/Patient/123",
		},
		name: "Request 8",
	},
	request9: {
		meta: {
			method: "PUT",
			path: "/fhir/Patient/123",
		},
		name: "Request 9",
	},
	request10: {
		meta: {
			method: "POST",
			path: "/fhir/Patient/123",
		},
		name: "Request 10",
	},
	request11: {
		meta: {
			method: "GET",
			path: "/fhir/Patient/123",
		},
		name: "Request 11",
	},
	request12: {
		meta: {
			method: "PUT",
			path: "/fhir/Patient/123",
		},
		name: "Request 12",
	},
	request13: {
		meta: {
			method: "PUT",
			path: "/fhir/Patient/123",
		},
		name: "Request 13",
	},
	request14: {
		meta: {
			method: "PUT",
			path: "/fhir/Patient/123",
		},
		name: "Request 14",
	},
};

export const Default: Story = {
	args: {
		items: items,
		rootItemId: "root",
		selectedItemId: "request9",
		expandedItemIds: ["collection3"],
		onSelectItem: (a) => action("onSelectItem")(a),
	},
	render: (args) => <TreeView {...args} />,
};

const customItemView = (item: ItemInstance<TreeViewItem<ItemMeta>>) => {
	const isRootLevel = item.getItemMeta().level === 0;
	const hasChildren = item.getItemData()?.children !== undefined;
	const requestMethhod = item.getItemData()?.meta?.method;
	const requestPath = item.getItemData()?.meta?.path;
	const itemName = item.getItemData()?.name;

	const requestMethodView = () => {
		switch (requestMethhod) {
			case "GET":
				return (
					<div className="opacity-50 group-hover/tree-item-label:opacity-100 in-data-[selected=true]:opacity-100 font-medium min-w-13 w-13 text-utility-green text-left">
						GET
					</div>
				);
			case "POST":
				return (
					<div className="opacity-50 group-hover/tree-item-label:opacity-100 in-data-[selected=true]:opacity-100 font-medium min-w-13 w-13 text-utility-yellow text-left">
						POST
					</div>
				);
			case "PUT":
				return (
					<div className="opacity-50 group-hover/tree-item-label:opacity-100 in-data-[selected=true]:opacity-100 font-medium min-w-13 w-13 text-utility-blue text-left">
						PUT
					</div>
				);
			case "PATCH":
				return (
					<div className="opacity-50 group-hover/tree-item-label:opacity-100 in-data-[selected=true]:opacity-100 font-medium min-w-13 w-13 text-utility-violet text-left">
						PATCH
					</div>
				);
			case "DELETE":
				return (
					<div className="opacity-50 group-hover/tree-item-label:opacity-100 in-data-[selected=true]:opacity-100 font-medium min-w-13 w-13 text-utility-red text-left">
						DELETE
					</div>
				);
			default:
				return (
					<div className="opacity-50 group-hover/tree-item-label:opacity-100 in-data-[selected=true]:opacity-100 font-medium min-w-13 w-13 text-utility-gray text-left">
						Unknown
					</div>
				);
		}
	};

	return (
		<div className="w-full flex justify-between gap-2">
			<div className="flex items-center gap-2 truncate">
				{hasChildren ? (
					itemName
				) : (
					<React.Fragment>
						{requestMethodView()}
						{requestPath}
					</React.Fragment>
				)}
			</div>
			<div className="gap-2 hidden group-hover/tree-item-label:flex items-center">
				{isRootLevel && (
					<Button variant="link" size="small" className="p-0 h-4">
						{item.getItemData()?.meta?.pinned ? <PinIcon /> : <Pin />}
					</Button>
				)}
				{hasChildren && (
					<Button variant="link" size="small" className="p-0 h-4">
						<Plus />
					</Button>
				)}
				<Button variant="link" size="small" className="p-0 h-4">
					<Ellipsis />
				</Button>
			</div>
		</div>
	);
};

export const CustomItemView: Story = {
	args: {
		items: items,
		rootItemId: "root",
		selectedItemId: "request11",
		expandedItemIds: ["collection3", "collection4"],
		onSelectItem: (a) => action("onSelectItem")(a.getItemData()?.name),
		customItemView: customItemView,
	},
	render: (args) => <TreeView {...args} />,
};
