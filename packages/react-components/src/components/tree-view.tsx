import type {
	FeatureImplementation,
	ItemInstance,
	TreeConfig,
	TreeInstance,
	TreeState,
} from "@headless-tree/core";
import {
	hotkeysCoreFeature,
	renamingFeature,
	selectionFeature,
	syncDataLoaderFeature,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import React, { useEffect } from "react";
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

const indent = 24;

function TreeView<T>({
	rootItemId,
	items,
	selectedItemId,
	expandedItemIds,
	onSelectItem,
	customItemView,
	onRename,
	disableHover,
	zebra,
	horizontalLines,
	hideChevron,
}: {
	rootItemId: string;
	selectedItemId?: string;
	expandedItemIds?: string[];
	onSelectItem?: (item: ItemInstance<TreeViewItem<T>>) => void;
	items: Record<string, TreeViewItem<T>>;
	customItemView?: (
		item: ItemInstance<TreeViewItem<T>>,
		tree: TreeInstance<TreeViewItem<T>>,
	) => React.ReactNode;
	onRename?:
		| ((item: ItemInstance<TreeViewItem<T>>, value: string) => void)
		| undefined;
	disableHover?: boolean;
	zebra?: boolean;
	horizontalLines?: boolean;
	hideChevron?: boolean;
}) {
	"use no memo";
	const [state, setState] = React.useState<Partial<TreeState<TreeViewItem<T>>>>(
		{},
	);
	const treeConfig: TreeConfig<TreeViewItem<T>> = {
		initialState: {
			selectedItems: selectedItemId ? [selectedItemId] : [],
			expandedItems: expandedItemIds ?? [],
		},
		state,
		setState,
		indent,
		rootItemId: rootItemId,
		isItemFolder: (item: ItemInstance<TreeViewItem<T>>) =>
			item.getItemData()?.children !== undefined,
		getItemName: (item: ItemInstance<TreeViewItem<T>>) =>
			item.getItemData()?.name,
		dataLoader: {
			getItem: (itemId) => (items[itemId] as TreeViewItem<T>) ?? {},
			getChildren: (itemId) => items[itemId]?.children ?? [],
		},
		...(onRename ? { onRename: onRename } : {}),
		features: [
			syncDataLoaderFeature,
			hotkeysCoreFeature,
			selectionFeature,
			customClickBehavior,
			renamingFeature,
		],
	};

	const tree = useTree<TreeViewItem<T>>(treeConfig);

	// biome-ignore lint/correctness/useExhaustiveDependencies: We must have explicit sync here
	useEffect(() => {
		tree.rebuildTree();
	}, [items]);

	useEffect(() => {
		setState((currentState) => {
			return {
				...currentState,
				selectedItems: selectedItemId ? [selectedItemId] : [],
			};
		});
	}, [selectedItemId]);

	useEffect(() => {
		setState((currentState) => {
			return {
				...currentState,
				expandedItems: expandedItemIds ?? [],
			};
		});
	}, [expandedItemIds]);

	return (
		<Tree tree={tree} indent={indent}>
			{tree.getItems().map((item) => {
				return (
					<TreeItem
						key={item.getId()}
						item={item}
						className={cn(
							treeItemStyle,
							zebra
								? "even:bg-bg-secondary even:[&_[data-slot=tree-item-label]]:bg-bg-secondary"
								: "",
						)}
					>
						<TreeItemLabel
							hideChevron={hideChevron ?? false}
							disableHover={disableHover ?? false}
							className={treeItemLabelStyle}
							onClick={() => onSelectItem?.(item)}
							horizontalLines={horizontalLines ?? false}
						>
							{customItemView
								? customItemView(item, tree)
								: item.getItemData()?.name}
						</TreeItemLabel>
					</TreeItem>
				);
			})}
		</Tree>
	);
}

export { TreeView, type TreeViewItem, type TreeInstance };
