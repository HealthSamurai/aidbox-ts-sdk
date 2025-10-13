"use client";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import {
	ChevronDownIcon,
	ChevronLeft,
	ChevronRight,
	Plus,
	X,
} from "lucide-react";
import * as React from "react";
import { cn } from "#shadcn/lib/utils";
import { Button } from "./button";
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

// Base tabs styles
const baseTabsStyles = cn("flex", "flex-col", "h-full");

// Tabs add button container styles
const tabsAddButtonContainerStyles = cn(
	"grow",
	"h-full",
	"bg-bg-secondary",
	"border-l",
	"border-b",
);

// Tabs list styles
const tabsListStyles = cn(
	"inline-flex",
	"w-fit",
	"items-center",
	"no-scrollbar",
);

// Base tabs trigger styles
const baseTabsTriggerStyles = cn(
	// Layout & Sizing
	"box-border",
	"flex-1",
	"h-10",
	"inline-flex",
	"items-center",
	"justify-center",
	"px-3",
	"whitespace-nowrap",
	// Spacing & Padding
	"pb-2",
	"pt-2.5",
	// Typography
	"typo-body",
	// Colors & States
	"cursor-pointer",
	"text-text-tertiary",
	"hover:bg-bg-secondary/60",
	"hover:text-text-tertiary_hover",
	"data-[state=active]:text-text-primary",
	"data-[state=active]:border-b-border-brand",
	"disabled:opacity-50",
	"disabled:pointer-events-none",
	// Borders
	"border-b-2",
	"border-b-transparent",
	// Focus & Accessibility
	"focus-visible:ring-2",
	"focus-visible:ring-utility-blue/70",
	"focus-visible:outline-1",
	// Transitions
	"transition-[color,box-shadow]",
	// Icons
	"[&_svg]:pointer-events-none",
	"[&_svg]:shrink-0",
	"[&_svg:not([class*='size-'])]:size-4",
	// Groups
	"group/tabs-trigger",
);

// Tabs content styles
const tabsContentStyles = cn("grow", "outline-none", "overflow-auto");

const tabsVariants = cva("", {
	variants: {
		variant: {
			browser: cn(
				// Tabs
				`flex-row
				 items-center
				 h-10
				 `,
				// TabsList
				`**:data-[slot=tabs-list]:overflow-x-auto
				 **:data-[slot=tabs-list]:divide-x`,
				// TabsTrigger
				`**:data-[slot=tabs-trigger]:max-w-80
				 **:data-[slot=tabs-trigger]:w-60
				 **:data-[slot=tabs-trigger]:min-w-40
				 **:data-[slot=tabs-trigger]:data-[state=inactive]:text-text-secondary
				 **:data-[slot=tabs-trigger]:data-[state=inactive]:border-b-1
				 **:data-[slot=tabs-trigger]:data-[state=inactive]:border-b-border-secondary
				 **:data-[slot=tabs-trigger]:data-[state=inactive]:pt-[9px]
				 `, // TODO: Try to implement this without using pt-[9px].
			),
		},
	},
});

type TabsProps<T extends string> = Omit<
	React.ComponentProps<typeof TabsPrimitive.Root> &
		VariantProps<typeof tabsVariants>,
	"value" | "defaultValue" | "onValueChange"
> & {
	value?: T;
	defaultValue?: T;
	onValueChange?: (value: T) => void;
};

function Tabs<T extends string = string>({
	className,
	variant,
	...props
}: TabsProps<T>) {
	const tabProps = {
		"data-slot": "tabs",
		className: cn(baseTabsStyles, tabsVariants({ variant }), className),
		...props,
		onValueChange: (value: string) => props.onValueChange?.(value as T),
	};
	return <TabsPrimitive.Root {...tabProps} />;
}

export function TabsAddButton(props: React.ComponentProps<typeof Button>) {
	return (
		<div className={tabsAddButtonContainerStyles}>
			<Button
				data-slot="tabs-add-button"
				variant="link"
				className="h-full"
				{...props}
			>
				<Plus />
			</Button>
		</div>
	);
}

function horizontalScroll(event: React.WheelEvent) {
	const mode = event.deltaMode;
	let deltaPx = 0;

	if (mode === 0) {
		deltaPx = event.deltaY;
	} else if (mode === 1) {
		deltaPx = event.deltaY * 160;
	} else if (mode === 2) {
		deltaPx = event.currentTarget.clientWidth;
	}

	const newScrollLeft = event.currentTarget.scrollLeft + deltaPx;

	event.currentTarget.scrollTo({
		left: newScrollLeft,
		behavior: "smooth",
	});
}

function performHorizontalScroll(
	tabsListRef: React.RefObject<HTMLDivElement | null>,
	direction: "left" | "right",
) {
	if (!tabsListRef.current) return;
	const scrollAmount = 160;
	let newScrollLeft = tabsListRef.current.scrollLeft;

	if (direction === "left") {
		newScrollLeft -= scrollAmount;
		newScrollLeft -= newScrollLeft % scrollAmount;
	} else {
		newScrollLeft += scrollAmount;

		const rightCoord = newScrollLeft + tabsListRef.current.clientWidth;

		if (rightCoord % scrollAmount !== 0) {
			newScrollLeft += scrollAmount - (rightCoord % scrollAmount);
		}
	}

	tabsListRef.current.scrollTo({
		left: newScrollLeft,
		behavior: "smooth",
	});
}

type EdgeScrollPosition = "touch" | "depart";
type FlowType = "overflow" | "underflow";

type TabsListProps = {
	onLeftEdge?: (position: EdgeScrollPosition) => void;
	onRightEdge?: (position: EdgeScrollPosition) => void;
	onFlow?: (flow: FlowType) => void;
	onResize?: (entries: ResizeObserverEntry[]) => void;
	onTabChange?: (mutationRecords: MutationRecord[]) => void;
} & React.ComponentProps<typeof TabsPrimitive.List>;

function TabsList({
	className,
	onLeftEdge,
	onRightEdge,
	onResize,
	onFlow,
	onTabChange,
	...props
}: TabsListProps) {
	const tabListRef = React.useRef<HTMLDivElement | null>(null);

	const onLeftEdgeRef = React.useRef(onLeftEdge);
	React.useEffect(() => {
		onLeftEdgeRef.current = onLeftEdge;
	}, [onLeftEdge]);

	const onResizeRef = React.useRef(onResize);
	React.useEffect(() => {
		onResizeRef.current = onResize;
	}, [onResize]);

	const onRightEdgeRef = React.useRef(onRightEdge);
	React.useEffect(() => {
		onRightEdgeRef.current = onRightEdge;
	}, [onRightEdge]);

	const onFlowRef = React.useRef(onFlow);
	React.useEffect(() => {
		onFlowRef.current = onFlow;
	}, [onFlow]);

	const onTabChangeRef = React.useRef(onTabChange);
	React.useEffect(() => {
		onTabChangeRef.current = onTabChange;
	}, [onTabChange]);

	React.useEffect(() => {
		if (tabListRef.current === null) {
			return;
		}
		const tabList = tabListRef.current;

		let last: {
			scrollLeft: number;
			scrollWidth: number;
			clientWidth: number;
		} | null = null;

		const handleScroll = () => {
			if (onLeftEdgeRef.current) {
				const newState: EdgeScrollPosition =
					tabList.scrollLeft < 1 ? "touch" : "depart";

				if (last === null) {
					onLeftEdgeRef.current(newState);
				} else {
					const lastState: EdgeScrollPosition =
						last.scrollLeft < 1 ? "touch" : "depart";

					if (lastState !== newState) {
						onLeftEdgeRef.current(newState);
					}
				}
			}

			if (onRightEdgeRef.current) {
				const newState: EdgeScrollPosition =
					tabList.scrollWidth - tabList.clientWidth - tabList.scrollLeft < 1
						? "touch"
						: "depart";

				if (last === null) {
					onRightEdgeRef.current(newState);
				} else {
					const lastState: EdgeScrollPosition =
						last.scrollWidth - last.clientWidth - last.scrollLeft < 1
							? "touch"
							: "depart";

					if (lastState !== newState) {
						onRightEdgeRef.current(newState);
					}
				}
			}

			if (onFlowRef.current) {
				const newState: FlowType =
					tabList.scrollWidth > tabList.clientWidth ? "overflow" : "underflow";

				if (last === null) {
					onFlowRef.current(newState);
				} else {
					const lastState =
						last.scrollWidth > last.clientWidth ? "overflow" : "underflow";
					if (lastState !== newState) {
						onFlowRef.current(newState);
					}
				}
			}

			last = {
				scrollLeft: tabList.scrollLeft,
				scrollWidth: tabList.scrollWidth,
				clientWidth: tabList.clientWidth,
			};
		};

		const scrollCallback = (_ev: unknown) => handleScroll();
		const resizeObserver = new ResizeObserver((entries) => {
			handleScroll();
			if (onResizeRef.current) {
				onResizeRef.current(entries);
			}
		});
		const mutationObserver = new MutationObserver((mutationRecords) => {
			handleScroll();
			if (onTabChangeRef.current) {
				onTabChangeRef.current(mutationRecords);
			}
		});

		tabList.addEventListener("scroll", scrollCallback, { passive: true });
		resizeObserver.observe(tabList);
		mutationObserver.observe(tabList, { childList: true });

		return () => {
			tabList.removeEventListener("scroll", scrollCallback);
			resizeObserver.disconnect();
			mutationObserver.disconnect();
		};
	}, []);

	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			className={cn("inline-flex w-fit items-center", className)}
			{...props}
			ref={(element) => {
				tabListRef.current = element;
				if (props.ref !== undefined && props.ref !== null) {
					if (typeof props.ref === "function") {
						props.ref(element);
					} else {
						props.ref.current = element;
					}
				}
			}}
		/>
	);
}

type TabScrollButtonProps = {
	disabled: boolean;
	onClick: () => void;
};

function TabScrollLeftButton({
	disabled,
	onClick,
}: TabScrollButtonProps): React.ReactElement {
	return (
		<Button
			variant="link"
			size="small"
			disabled={disabled}
			className="h-full border-r border-b bg-bg-secondary"
			onClick={onClick}
		>
			<ChevronLeft />
		</Button>
	);
}

function TabScrollRightButton({
	disabled,
	onClick,
}: TabScrollButtonProps): React.ReactElement {
	return (
		<Button
			variant="link"
			size="small"
			disabled={disabled}
			className="h-full border-l border-b bg-bg-secondary"
			onClick={onClick}
		>
			<ChevronRight />
		</Button>
	);
}

function TabsBrowserList({
	className,
	children,
	...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
	const tabsListRef = React.useRef<HTMLDivElement | null>(null);

	const [showScrollButtons, setShowScrollButtons] = React.useState(false);
	const [canScrollLeft, setCanScrollLeft] = React.useState(false);
	const [canScrollRight, setCanScrollRight] = React.useState(false);

	return (
		<React.Fragment>
			{showScrollButtons && (
				<TabScrollLeftButton
					disabled={!canScrollLeft}
					onClick={() => performHorizontalScroll(tabsListRef, "left")}
				/>
			)}

			<TabsList
				onLeftEdge={(edgeState) => {
					if (edgeState === "touch") {
						setCanScrollLeft(false);
					} else {
						setCanScrollLeft(true);
					}
				}}
				onRightEdge={(edgeState) => {
					if (edgeState === "touch") {
						setCanScrollRight(false);
					} else {
						setCanScrollRight(true);
					}
				}}
				onFlow={(flow) => {
					if (flow === "overflow") {
						setShowScrollButtons(true);
					} else {
						setShowScrollButtons(false);
					}
				}}
				onResize={() => {
					tabsListRef.current
						?.querySelector<HTMLButtonElement>('button[data-state="active"]')
						?.scrollIntoView();
				}}
				onTabChange={(entries) => {
					if (
						entries.filter((entry) => entry.addedNodes.length !== 0).length !==
						0
					) {
						tabsListRef.current
							?.querySelector<HTMLButtonElement>('button[data-state="active"]')
							?.scrollIntoView();
					}
				}}
				data-slot="tabs-list"
				className={cn(tabsListStyles, className)}
				onWheel={(event) => horizontalScroll(event)}
				{...props}
				ref={tabsListRef}
			>
				{children}
			</TabsList>

			{showScrollButtons && (
				<TabScrollRightButton
					disabled={!canScrollRight}
					onClick={() => performHorizontalScroll(tabsListRef, "right")}
				/>
			)}
		</React.Fragment>
	);
}

export function TabsListDropdown({
	tabs,
	handleTabSelect,
	handleCloseTab,
}: {
	tabs: { id: string; content: React.ReactNode }[];
	handleTabSelect?: (tabId: string) => void;
	handleCloseTab?: (tabId: string) => void;
}) {
	const [isMenuOpen, setIsMenuOpen] = React.useState(false);
	return (
		<Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
			<PopoverTrigger asChild>
				<Button variant="link" className="bg-bg-secondary h-full border-b pr-6">
					<ChevronDownIcon className="size-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80 p-0 mr-3" align="end">
				<Command>
					<CommandInput placeholder="Search tabs..." />
					<CommandList>
						<CommandEmpty>Not tabs found.</CommandEmpty>
						{tabs.map((tab) => (
							<CommandItem
								key={tab.id}
								onSelect={() => {
									handleTabSelect?.(tab.id);
									setIsMenuOpen(false);
								}}
								className="group flex items-center justify-between"
							>
								{tab.content}
								{tabs.length > 1 && (
									<Button
										variant="ghost"
										size="small"
										className="opacity-0 group-hover:opacity-100 transition-opacity p-1 ml-2"
										onClick={(e) => {
											e.stopPropagation();
											handleCloseTab?.(tab.id);
										}}
									>
										<X className="size-3" />
									</Button>
								)}
							</CommandItem>
						))}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

function TabsTrigger({
	className,
	onClose,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
	onClose?: (value: string) => void;
}) {
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			className={cn(
				baseTabsTriggerStyles,
				onClose ? "justify-between" : "justify-start",
				className,
			)}
			{...props}
		>
			{props.children}

			{onClose && (
				<Button
					onClick={(event) => {
						event.stopPropagation();
						onClose(props.value);
					}}
					variant="link"
					size="small"
					className="p-0 ml-2 opacity-0 group-hover/tabs-trigger:opacity-100 transition-opacity"
					asChild
				>
					<span>
						<X />
					</span>
				</Button>
			)}
		</TabsPrimitive.Trigger>
	);
}

function TabsContent({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content
			data-slot="tabs-content"
			className={cn(tabsContentStyles, className)}
			{...props}
		/>
	);
}

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsBrowserList };
