import { Slot } from "@radix-ui/react-slot";
import { ChevronDownIcon, MoreHorizontal } from "lucide-react";
import type * as React from "react";
import { createContext, useContext } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "#shadcn/components/ui/dropdown-menu";
import { cn } from "#shadcn/lib/utils";
import { IconButton } from "../../../components/icon-button";

// Styles
const breadcrumbListStyles = cn(
	// Typography
	"typo-body",
	"text-text-tertiary",
	// Layout
	"flex",
	"flex-wrap",
	"items-center",
	"break-words",
	// Spacing
	"gap-2",
);

const breadcrumbItemStyles = cn(
	// Layout
	"inline-flex",
	"items-center",
);

const breadcrumbLinkBaseStyles = cn(
	// Typography
	"typo-body",
	// Layout
	"px-2",
	"py-1",
	// Colors
	"bg-bg-tertiary",
	"text-text-tertiary",
	"hover:text-text-secondary",
	// Shape
	"rounded-md",
	// Interaction
	"transition-colors",
	"focus-visible:outline-none",
	"focus-visible:ring-2",
	"focus-visible:ring-utility-blue/70",
);

const breadcrumbLinkWithDropdownStyles = cn(
	// Shape
	"rounded-l-md",
	"rounded-r-none",
);

const breadcrumbSeparatorStyles = cn(
	// Size
	"h-4",
	"w-px",
	"shrink-0",
	// Colors
	"bg-border-separator",
);

const breadcrumbTriggerContainerStyles = cn(
	// Layout
	"flex",
	"items-center",
	"gap-2",
	"h-7",
	"pl-0",
	"pr-2",
	"py-1",
	// Colors
	"bg-bg-tertiary",
	// Shape
	"rounded-r-md",
	"rounded-l-none",
);

const breadcrumbIconButtonStyles = cn(
	// Size
	"size-auto",
	"p-0",
	// Colors
	"bg-transparent",
	"hover:bg-transparent",
	"text-text-tertiary",
	"hover:text-text-secondary",
);

const breadcrumbPageBaseStyles = cn(
	// Typography
	"typo-page-header",
	// Layout
	"px-0",
	"py-0.5",
	// Colors
	"text-text-primary",
);

const breadcrumbPageWhiteStyles = cn(
	// Colors
	"text-white",
);

const breadcrumbSeparatorBaseStyles = cn(
	// Typography
	"text-xs",
	"text-text-tertiary",
	// SVG
	"[&>svg]:size-3.5",
);

const breadcrumbEllipsisStyles = cn(
	// Layout
	"flex",
	"size-9",
	"items-center",
	"justify-center",
);

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
			className={cn(breadcrumbListStyles, className)}
			{...props}
		/>
	);
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
	return (
		<li
			data-slot="breadcrumb-item"
			className={cn(breadcrumbItemStyles, className)}
			{...props}
		/>
	);
}

function BreadcrumbLink({
	asChild,
	className,
	dropdownContent,
	...props
}: React.ComponentProps<"a"> & {
	asChild?: boolean;
	dropdownContent?: React.ReactNode;
}) {
	const Comp = asChild ? Slot : "a";

	const linkStyles = cn(
		breadcrumbLinkBaseStyles,
		dropdownContent && breadcrumbLinkWithDropdownStyles,
		className,
	);

	if (dropdownContent) {
		return (
			<div className="inline-flex items-center">
				<Comp data-slot="breadcrumb-link" className={linkStyles} {...props} />
				<div className={breadcrumbTriggerContainerStyles}>
					<div className={breadcrumbSeparatorStyles} />
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<IconButton
								icon={<ChevronDownIcon className="size-4" />}
								aria-label="Toggle menu"
								className={breadcrumbIconButtonStyles}
							/>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							{dropdownContent}
						</DropdownMenuContent>
					</DropdownMenu>
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
				breadcrumbPageBaseStyles,
				isWhite && breadcrumbPageWhiteStyles,
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
			className={cn(breadcrumbSeparatorBaseStyles, className)}
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
			className={cn(breadcrumbEllipsisStyles, className)}
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
