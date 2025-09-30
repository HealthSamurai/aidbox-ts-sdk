import type { ItemInstance } from "@headless-tree/core";
import { ChevronDownIcon } from "lucide-react";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "#shadcn/lib/utils";

type WithMeta = {
	meta?: {
		lastNode?: boolean;
	};
};

// biome-ignore lint/suspicious/noExplicitAny: FIXME Origin UI as-is
interface TreeContextValue<T = any> {
	indent: number;
	currentItem?: ItemInstance<T>;
	// biome-ignore lint/suspicious/noExplicitAny: FIXME Origin UI as-is
	tree?: any;
}

const TreeContext = React.createContext<TreeContextValue>({
	indent: 20,
});

// biome-ignore lint/suspicious/noExplicitAny: FIXME Origin UI as-is
function useTreeContext<T = any>() {
	return React.useContext(TreeContext) as TreeContextValue<T>;
}

interface TreeProps extends React.HTMLAttributes<HTMLDivElement> {
	indent?: number;
	// biome-ignore lint/suspicious/noExplicitAny: FIXME Origin UI as-is
	tree?: any;
}

function Tree({ indent = 20, tree, className, ...props }: TreeProps) {
	const containerProps =
		tree && typeof tree.getContainerProps === "function"
			? tree.getContainerProps()
			: {};
	const mergedProps = { ...props, ...containerProps };

	// Extract style from mergedProps to merge with our custom styles
	const { style: propStyle, ...otherProps } = mergedProps;

	// Merge styles
	const mergedStyle = {
		...propStyle,
		"--tree-indent": `${indent}px`,
		"--border": `var(--color-fg-disabled)`,
	} as React.CSSProperties;

	return (
		<TreeContext.Provider value={{ indent, tree }}>
			<div
				data-slot="tree"
				style={mergedStyle}
				className={cn("flex flex-col", className)}
				{...otherProps}
			/>
		</TreeContext.Provider>
	);
}

// biome-ignore lint/suspicious/noExplicitAny: FIXME Origin UI as-is
interface TreeItemProps<T = any>
	extends React.HTMLAttributes<HTMLButtonElement> {
	item: ItemInstance<T>;
	indent?: number;
	asChild?: boolean;
}

// biome-ignore lint/suspicious/noExplicitAny: FIXME Origin UI as-is
function TreeItem<T = any>({
	item,
	className,
	asChild,
	children,
	...props
}: Omit<TreeItemProps<T>, "indent">) {
	const { indent } = useTreeContext<T>();

	const itemProps = typeof item.getProps === "function" ? item.getProps() : {};
	const mergedProps = { ...props, ...itemProps };

	// Extract style from mergedProps to merge with our custom styles
	const { style: propStyle, ...otherProps } = mergedProps;

	// Merge styles
	const mergedStyle = {
		...propStyle,
		"--tree-padding": `${item.getItemMeta().level * indent}px`,
	} as React.CSSProperties;

	const Comp = asChild ? Slot.Root : "span";

	return (
		<TreeContext.Provider value={{ indent, currentItem: item }}>
			<Comp
				data-slot="tree-item"
				style={mergedStyle}
				className={cn(
					"z-10 ps-(--tree-padding) outline-hidden select-none focus:z-20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
					className,
				)}
				data-focus={
					typeof item.isFocused === "function"
						? item.isFocused() || false
						: undefined
				}
				data-folder={
					typeof item.isFolder === "function"
						? item.isFolder() || false
						: undefined
				}
				data-selected={
					typeof item.isSelected === "function"
						? item.isSelected() || false
						: undefined
				}
				data-drag-target={
					typeof item.isDragTarget === "function"
						? item.isDragTarget() || false
						: undefined
				}
				data-search-match={
					typeof item.isMatchingSearch === "function"
						? item.isMatchingSearch() || false
						: undefined
				}
				aria-expanded={item.isExpanded()}
				{...Object.fromEntries(
					Object.entries(otherProps).filter(([key]) => key !== "onClick"),
				)}
			>
				{children}
			</Comp>
		</TreeContext.Provider>
	);
}

// biome-ignore lint/suspicious/noExplicitAny: FIXME Origin UI as-is
interface TreeItemLabelProps<T = any>
	extends React.HTMLAttributes<HTMLSpanElement> {
	hideChevron?: boolean;
	disableHover?: boolean;
	item?: ItemInstance<T>;
	horizontalLines?: boolean;
}

function TreeItemLabel<T>({
	item: propItem,
	children,
	className,
	disableHover,
	horizontalLines,
	hideChevron,
	...props
}: TreeItemLabelProps<T & WithMeta>) {
	const { currentItem } = useTreeContext<T & WithMeta>();
	const item = propItem || currentItem;

	if (!item) {
		console.warn("TreeItemLabel: No item provided via props or context");
		return null;
	}

	const data = item.getItemData?.();
	const isLastNode = data?.meta?.lastNode;
	const itemMeta = item.getItemMeta();

	return (
		<span
			data-slot="tree-item-label"
			className={cn(
				"group/tree-item-label relative select-text cursor-pointer border-l-2 border-l-transparent in-focus-visible:ring-ring/50 bg-background text-text-secondary in-data-[drag-target=true]:bg-accent flex items-center gap-2 pr-2 pl-2.5 py-1.5 text-sm transition-colors not-in-data-[folder=true]:ps-2.5 in-focus-visible:ring-[3px] in-data-[search-match=true]:bg-blue-400/20! [&_svg]:pointer-events-none [&_svg]:shrink-0",
				!disableHover &&
					"in-data-[selected=true]:bg-bg-secondary hover:bg-bg-secondary hover:text-text-primary in-data-[selected=true]:text-text-primary",
				disableHover && "text-text-primary",
				className,
			)}
			{...props}
		>
			{item.isFolder() && (
				<button
					type="button"
					className="self-start mt-0.5 cursor-pointer"
					onClick={() => {
						item.isExpanded() ? item.collapse() : item.expand();
					}}
				>
					<ChevronDownIcon className="text-muted-foreground size-4 in-aria-[expanded=false]:-rotate-90" />
				</button>
			)}
			{!item.isFolder() && horizontalLines && (
				<div
					className={`w-5 min-w-5 h-px border-t mt-2.25 -ml-1 self-start`}
				></div>
			)}
			{item.isFolder() && item.isExpanded() && horizontalLines && (
				<div
					className={`absolute left-4.25 top-4 w-px min-h-full h-full border-l mt-2.25  self-start `}
				></div>
			)}
			{horizontalLines && (
				<div
					className={`absolute left-0 top-5.5 -m-1.75 border-t w-4 ${isLastNode ? "h-full bg-inherit " : ""} ${itemMeta.level === 0 ? "hidden" : ""}`}
				></div>
			)}
			{children ||
				(typeof item.getItemName === "function" ? item.getItemName() : null)}
		</span>
	);
}

function TreeDragLine({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	const { tree } = useTreeContext();

	if (!tree || typeof tree.getDragLineStyle !== "function") {
		console.warn(
			"TreeDragLine: No tree provided via context or tree does not have getDragLineStyle method",
		);
		return null;
	}

	const dragLine = tree.getDragLineStyle();
	return (
		<div
			style={dragLine}
			className={cn(
				"bg-primary before:bg-background before:border-primary absolute z-30 -mt-px h-0.5 w-[unset] before:absolute before:-top-[3px] before:left-0 before:size-2 before:rounded-full before:border-2",
				className,
			)}
			{...props}
		/>
	);
}

export { Tree, TreeItem, TreeItemLabel, TreeDragLine, type ItemInstance };
