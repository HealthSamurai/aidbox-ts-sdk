import { Slot } from "@radix-ui/react-slot";
import { MoreHorizontal } from "lucide-react";
import type * as React from "react";
import { createContext, useContext } from "react";

import { cn } from "#shadcn/lib/utils";

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
	...props
}: React.ComponentProps<"a"> & {
	asChild?: boolean;
}) {
	const { isWhite } = useContext(BreadcrumbContext);
	const Comp = asChild ? Slot : "a";

	return (
		<Comp
			data-slot="breadcrumb-link"
			className={cn(
				"typo-body",
				"bg-bg-tertiary",
				"rounded-md",
				"px-2",
				"py-1",
				"transition-colors",
				"focus-visible:outline-none",
				"focus-visible:ring-2",
				"focus-visible:ring-utility-blue/70",
				isWhite
					? ["text-text-tertiary", "hover:text-text-secondary"]
					: ["text-text-tertiary", "hover:text-text-secondary"],
				className,
			)}
			{...props}
		/>
	);
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
