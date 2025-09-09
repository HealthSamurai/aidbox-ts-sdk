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

export interface Item<T> {
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

export default function TreeView<T>({
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
	onSelectItem?: (item: ItemInstance<Item<T>>) => void;
	items: Record<string, Item<T>>;
	customItemView?: (item: ItemInstance<Item<T>>) => React.ReactNode;
}) {
	const treeConfig: TreeConfig<Item<T>> = {
		initialState: {
			selectedItems: selectedItemId ? [selectedItemId] : [],
			expandedItems: expandedItemIds ?? [],
		},
		indent,
		rootItemId: rootItemId,
		isItemFolder: (item: ItemInstance<Item<T>>) =>
			item.getItemData()?.children !== undefined,
		getItemName: (item: ItemInstance<Item<T>>) => item.getItemData()?.name,
		dataLoader: {
			getItem: (itemId) => items[itemId] as Item<T>,
			getChildren: (itemId) => items[itemId]?.children ?? [],
		},
		features: [
			syncDataLoaderFeature,
			hotkeysCoreFeature,
			selectionFeature,
			customClickBehavior,
		],
	};

	const tree = useTree<Item<T>>(treeConfig);

	return (
		<Tree tree={tree} indent={indent}>
			{tree.getItems().map((item) => {
				return (
					<TreeItem
						key={item.getId()}
						item={item}
						className="relative before:absolute before:inset-0 before:-ms-1 before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)))]"
					>
						<TreeItemLabel
							className="before:bg-background relative before:absolute before:inset-x-0 before:-inset-y-0 before:-z-10"
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
