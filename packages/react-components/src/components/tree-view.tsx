import type {
	FeatureImplementation,
	ItemInstance,
	TreeConfig,
	TreeInstance,
	Updater,
} from "@headless-tree/core";
import {
	createOnDropHandler,
	dragAndDropFeature,
	hotkeysCoreFeature,
	renamingFeature,
	selectionFeature,
	syncDataLoaderFeature,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import React from "react";
import { Tree, TreeItem, TreeItemLabel } from "#shadcn/components/ui/tree";
import { cn } from "#shadcn/lib/utils.js";

// Styles
const treeItemStyle = cn(
	"relative",
	"before:absolute",
	"before:inset-0",
	"before:-ms-1",
	"before:-z-20",
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
		getProps: ({ item, prev }) => {
			return {
				...prev?.(),
				onClick: () => {
					item.setFocused();
					item.primaryAction();
				},
			};
		},
	},
};

const indent = 22;

type ExpansionPropsUncontrolled = {
	defaultExpandedItems?: string[];
	expandedItems?: never;
	onExpandedItemsChange?: never;
};
type ExpansionPropsControlled = {
	defaultExpandedItems?: never;
	expandedItems: string[];
	onExpandedItemsChange: (items: string[]) => void;
};
type ExpansionProps = ExpansionPropsUncontrolled | ExpansionPropsControlled;

type FocusPropsUncontrolled = {
	defaultFocusedItem?: string;
	focusedItem?: never;
	onFocusedItemChange?: never;
};
type FocusPropsControlled = {
	defaultFocusedItem?: never;
	focusedItem: string | null;
	onFocusedItemChange: (item: string | null) => void;
};
type FocusProps = FocusPropsUncontrolled | FocusPropsControlled;

type TreeViewProps<T> = {
	rootItemId: string;
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
	itemLabelClassFn?: (item: ItemInstance<TreeViewItem<T>>) => string;
	canReorder?: boolean;
	onDropFn?: (
		tree: TreeInstance<TreeViewItem<T>>,
		item: ItemInstance<TreeViewItem<T>>,
		newChildren: string[],
	) => void;
} & ExpansionProps &
	FocusProps;

function TreeView<T>({
	rootItemId,
	items,
	defaultFocusedItem,
	focusedItem,
	onFocusedItemChange,
	defaultExpandedItems,
	expandedItems,
	onExpandedItemsChange,
	customItemView,
	onRename,
	disableHover,
	zebra,
	horizontalLines,
	hideChevron,
	itemLabelClassFn,
	canReorder,
	onDropFn,
}: TreeViewProps<T>) {
	"use no memo";

	const initialExpandedItems = defaultExpandedItems ?? expandedItems;
	const initialFocusedItem = defaultFocusedItem ?? focusedItem;

	const setExpandedItems =
		expandedItems !== undefined && onExpandedItemsChange !== undefined
			? (updater: Updater<string[]>) => {
					const newVal =
						updater instanceof Function ? updater(expandedItems) : updater;

					onExpandedItemsChange(newVal);
				}
			: undefined;

	const setFocusedItem =
		focusedItem !== undefined && onFocusedItemChange !== undefined
			? (updater: Updater<string | null>) => {
					const newVal =
						updater instanceof Function ? updater(focusedItem) : updater;

					onFocusedItemChange(newVal);
				}
			: undefined;

	const treeConfig: TreeConfig<TreeViewItem<T>> = {
		initialState: {
			...(initialExpandedItems !== undefined
				? { expandedItems: initialExpandedItems }
				: {}),
			...(initialFocusedItem !== undefined
				? { focusedItem: initialFocusedItem }
				: {}),
		},
		state: {
			...(expandedItems !== undefined ? { expandedItems } : {}),
			...(focusedItem !== undefined ? { focusedItem } : {}),
		},
		...(setExpandedItems !== undefined ? { setExpandedItems } : {}),
		...(setFocusedItem !== undefined ? { setFocusedItem } : {}),
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
			renamingFeature,
			dragAndDropFeature,
			customClickBehavior,
		],
		canReorder: canReorder ?? false,
		onDrop: createOnDropHandler((item, newChildren) => {
			onDropFn?.(tree, item, newChildren);
		}),
	};

	const tree = useTree<TreeViewItem<T>>(treeConfig);

	const [prevItems, setPrevItems] = React.useState<null | typeof items>(null);
	if (prevItems !== items) {
		tree.rebuildTree();
		setPrevItems(items);
	}

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
							className={cn(treeItemLabelStyle, itemLabelClassFn?.(item))}
							// onClick={() => onSelectItem?.(item)}
							horizontalLines={horizontalLines ?? false}
						>
							{customItemView
								? customItemView(item, tree)
								: item.getItemData()?.name}
						</TreeItemLabel>
					</TreeItem>
				);
			})}
			<div
				style={tree.getDragLineStyle()}
				className="h-px bg-bg-link z-100 mx-4"
			/>
		</Tree>
	);
}

export { TreeView, type TreeViewItem, type TreeInstance };
