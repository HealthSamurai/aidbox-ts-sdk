import type {
	FeatureImplementation,
	ItemInstance,
	TreeConfig,
} from "@headless-tree/core";
import {
	hotkeysCoreFeature,
	selectionFeature,
	syncDataLoaderFeature,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import type React from "react";
import { Tree, TreeItem, TreeItemLabel } from "#shadcn/components/ui/tree";
import { cn } from "#shadcn/lib/utils.js";

// Styles
const treeItemStyle = cn(
	"relative",
	"before:absolute",
	"before:inset-0",
	"before:-ms-1",
	"before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)))]",
);

const treeItemLabelStyle = cn(
	"before:bg-background",
	"relative",
	"before:absolute",
	"before:inset-x-0",
	"before:-inset-y-0",
	"before:-z-10",
);

interface TreeViewItem<T> {
	name: string;
	children?: string[];
	meta?: T;
}

const customClickBehavior: FeatureImplementation = {
	itemInstance: {
		getProps: ({ tree, item, prev }) => ({
			...prev?.(),
			onClick: () => {
				item.primaryAction();
				if (item.isExpanded()) {
					item.collapse();
				} else {
					item.expand();
				}
				if (!item.isFolder()) {
					tree.setSelectedItems([item.getItemMeta().itemId]);
				}
			},
		}),
	},
};

const indent = 20;

function TreeView<T>({
	rootItemId,
	items,
	selectedItemId,
	expandedItemIds,
	onSelectItem,
	customItemView,
}: {
	rootItemId: string;
	selectedItemId?: string;
	expandedItemIds?: string[];
	onSelectItem?: (item: ItemInstance<TreeViewItem<T>>) => void;
	items: Record<string, TreeViewItem<T>>;
	customItemView?: (item: ItemInstance<TreeViewItem<T>>) => React.ReactNode;
}) {
	const treeConfig: TreeConfig<TreeViewItem<T>> = {
		initialState: {
			selectedItems: selectedItemId ? [selectedItemId] : [],
			expandedItems: expandedItemIds ?? [],
		},
		indent,
		rootItemId: rootItemId,
		isItemFolder: (item: ItemInstance<TreeViewItem<T>>) =>
			item.getItemData()?.children !== undefined,
		getItemName: (item: ItemInstance<TreeViewItem<T>>) =>
			item.getItemData()?.name,
		dataLoader: {
			getItem: (itemId) => items[itemId] as TreeViewItem<T>,
			getChildren: (itemId) => items[itemId]?.children ?? [],
		},
		features: [
			syncDataLoaderFeature,
			hotkeysCoreFeature,
			selectionFeature,
			customClickBehavior,
		],
	};

	const tree = useTree<TreeViewItem<T>>(treeConfig);

	return (
		<Tree tree={tree} indent={indent}>
			{tree.getItems().map((item) => {
				return (
					<TreeItem key={item.getId()} item={item} className={treeItemStyle}>
						<TreeItemLabel
							className={treeItemLabelStyle}
							onClick={() => onSelectItem?.(item)}
						>
							{customItemView ? customItemView(item) : item.getItemData()?.name}
						</TreeItemLabel>
					</TreeItem>
				);
			})}
		</Tree>
	);
}

export { TreeView, type TreeViewItem };
