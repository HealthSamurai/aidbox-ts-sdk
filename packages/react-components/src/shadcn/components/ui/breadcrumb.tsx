import { Slot } from "@radix-ui/react-slot";
import { ChevronDownIcon, MoreHorizontal } from "lucide-react";
import type * as React from "react";
import { createContext, useContext } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#shadcn/components/ui/popover";
import { cn } from "#shadcn/lib/utils";
import { IconButton } from "../../../components/icon-button";

const BreadcrumbContext = createContext<{ isWhite?: boolean }>({});

function Breadcrumb({
	isWhite,
	...props
}: React.ComponentProps<"nav"> & { isWhite?: boolean }) {
	return (
		<BreadcrumbContext.Provider
			value={isWhite !== undefined ? { isWhite } : {}}
		>
			<nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
		</BreadcrumbContext.Provider>
	);
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
	return (
		<ol
			data-slot="breadcrumb-list"
			className={cn(
				"text-text-tertiary",
				"typo-body",
				"flex",
				"flex-wrap",
				"items-center",
				"break-words",
				"gap-2",
				className,
			)}
			{...props}
		/>
	);
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
	return (
		<li
			data-slot="breadcrumb-item"
			className={cn("inline-flex", "items-center", className)}
			{...props}
		/>
	);
}

function BreadcrumbLink({
	asChild,
	className,
	popoverContent,
	...props
}: React.ComponentProps<"a"> & {
	asChild?: boolean;
	popoverContent?: React.ReactNode;
}) {
	const { isWhite } = useContext(BreadcrumbContext);
	const Comp = asChild ? Slot : "a";

	const linkStyles = cn(
		"typo-body",
		"bg-bg-tertiary",
		"px-2",
		"py-1",
		"transition-colors",
		"focus-visible:outline-none",
		"focus-visible:ring-2",
		"focus-visible:ring-utility-blue/70",
		isWhite
			? ["text-text-tertiary", "hover:text-text-secondary"]
			: ["text-text-tertiary", "hover:text-text-secondary"],
		popoverContent ? "rounded-l-md rounded-r-none" : "rounded-md",
		className,
	);

	const separatorStyles = cn("h-4", "w-px", "bg-border-separator", "shrink-0");

	const triggerContainerStyles = cn(
		"bg-bg-tertiary",
		"h-7",
		"flex",
		"items-center",
		"gap-2",
		"pl-0",
		"pr-2",
		"py-1",
		"rounded-r-md",
		"rounded-l-none",
	);

	const iconButtonStyles = cn(
		"size-auto",
		"p-0",
		"bg-transparent",
		"hover:bg-transparent",
		"text-text-tertiary",
		"hover:text-text-secondary",
	);

	if (popoverContent) {
		return (
			<div className="inline-flex items-center">
				<Comp data-slot="breadcrumb-link" className={linkStyles} {...props} />
				<div className={triggerContainerStyles}>
					<div className={separatorStyles} />
					<Popover>
						<PopoverTrigger asChild>
							<IconButton
								icon={<ChevronDownIcon className="size-4" />}
								aria-label="Toggle menu"
								className={iconButtonStyles}
							/>
						</PopoverTrigger>
						<PopoverContent
							align="start"
							className="min-w-[8rem] p-2 flex flex-col gap-1"
						>
							{popoverContent}
						</PopoverContent>
					</Popover>
				</div>
			</div>
		);
	}

	return <Comp data-slot="breadcrumb-link" className={linkStyles} {...props} />;
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
	const { isWhite } = useContext(BreadcrumbContext);

	return (
		// biome-ignore lint/a11y/useFocusableInteractive: FIXME: unchanged shadcn
		// biome-ignore lint/a11y/useSemanticElements: FIXME: unchanged shadcn
		<span
			data-slot="breadcrumb-page"
			role="link"
			aria-disabled="true"
			aria-current="page"
			className={cn(
				"typo-page-header",
				"px-0",
				"py-0.5",
				isWhite ? "text-white" : "text-text-primary",
				className,
			)}
			{...props}
		/>
	);
}

function BreadcrumbSeparator({
	children,
	className,
	...props
}: React.ComponentProps<"li">) {
	return (
		<li
			data-slot="breadcrumb-separator"
			role="presentation"
			aria-hidden="true"
			className={cn(
				"[&>svg]:size-3.5",
				"text-text-tertiary",
				"text-xs",
				className,
			)}
			{...props}
		>
			{children ?? "/"}
		</li>
	);
}

function BreadcrumbEllipsis({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="breadcrumb-ellipsis"
			role="presentation"
			aria-hidden="true"
			className={cn(
				"flex",
				"size-9",
				"items-center",
				"justify-center",
				className,
			)}
			{...props}
		>
			<MoreHorizontal className="size-4" />
			<span className="sr-only">More</span>
		</span>
	);
}

export {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbPage,
	BreadcrumbSeparator,
	BreadcrumbEllipsis,
};
