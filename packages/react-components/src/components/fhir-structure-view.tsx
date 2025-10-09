import type { ItemInstance } from "@headless-tree/core";
import React from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#shadcn/components/ui/tooltip";
import { cn } from "#shadcn/lib/utils.js";
import * as CustomIcon from "../icons";
import { TreeView, type TreeViewItem } from "./tree-view";

type PackageSpec = {
	name: string;
	version: string;
};

type Coordinate = {
	id: string;
	packageSpec: PackageSpec;
	"package-spec": PackageSpec;
	label: string;
};

type FhirStructure = {
	type?: string;
	min?: string;
	max?: string;
	lastNode?: boolean;
	isSummary?: boolean;
	isModifier?: boolean;
	mustSupport?: boolean;
	datatype?: string;
	short?: string;
	desc?: string;
	extensionUrl?: string;
	extensionCoordinate?: Coordinate;
	binding?: {
		valueSet: string;
	};
	vsCoordinate?: Coordinate;
};

const FiledIcon = (item: ItemInstance<TreeViewItem<FhirStructure>>) => {
	const filedType = item.getItemData()?.meta?.type;

	switch (filedType) {
		case "Resource":
			return <CustomIcon.ResourceIcon />;
		case "BackboneElement":
			return <CustomIcon.BackoneElementIcon />;
		case "Reference":
			return <CustomIcon.ReferenceIcon />;
		case "union":
			return <CustomIcon.UnionIcon />;
		case "instant":
		case "time":
		case "date":
		case "dateTime":
		case "decimal":
		case "boolean":
		case "integer":
		case "string":
		case "uri":
		case "base64Binary":
		case "code":
		case "id":
		case "oid":
		case "unsignedInt":
		case "positiveInt":
		case "markdown":
		case "url":
		case "canonical":
		case "uuid":
		case "integer64":
			return <CustomIcon.TypCodeIcon />;
		default:
			return <CustomIcon.ComplexTypeIcon />;
	}
};

const customItemFieldNameClass = cn(
	"flex",
	"items-center",
	"truncate",
	"gap-2",
	"min-w-[calc(260px-var(--tree-padding))]",
	"w-[calc(260px-var(--tree-padding))]",
	"in-data-[folder=true]:w-[calc(260px-var(--tree-padding))]",
	"in-data-[folder=true]:min-w-[calc(260px-var(--tree-padding))]",
);

const customItemView = (item: ItemInstance<TreeViewItem<FhirStructure>>) => {
	const fieldName = item.getItemData()?.name;
	const cardinalityMin = item.getItemData()?.meta?.min;
	const cardinalityMax = item.getItemData()?.meta?.max;
	const isSummary = item.getItemData()?.meta?.isSummary;
	const isModifier = item.getItemData()?.meta?.isModifier;
	const mustSupport = item.getItemData()?.meta?.mustSupport;
	const datatype = item.getItemData()?.meta?.type;
	const short = item.getItemData()?.meta?.short;
	const desc = item.getItemData()?.meta?.desc;
	const extensionUrl = item.getItemData()?.meta?.extensionUrl;
	const extensionCoordinate = item.getItemData()?.meta?.extensionCoordinate;
	const binding = item.getItemData()?.meta?.binding;
	const vsCoordinate = item.getItemData()?.meta?.vsCoordinate;
	return (
		<div className="flex items-start gap-2 text-xs">
			<div className={customItemFieldNameClass}>
				{FiledIcon(item)}
				{fieldName}
			</div>

			<div className="flex items-center gap-1 min-w-[60px] w-[60px]">
				{mustSupport && (
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="px-[2px] max-h-[20px] text-white bg-red-600 rounded cursor-help">
								S
							</span>
						</TooltipTrigger>
						<TooltipContent>
							<p>Must be supported</p>
						</TooltipContent>
					</Tooltip>
				)}
				{isSummary && (
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="px-[2px] max-h-[20px] cursor-help">Σ</span>
						</TooltipTrigger>
						<TooltipContent>
							<p>Part of the summary set</p>
						</TooltipContent>
					</Tooltip>
				)}
				{isModifier && (
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="px-[2px] max-h-[20px] cursor-help">!?</span>
						</TooltipTrigger>
						<TooltipContent>
							<p>Modifying element</p>
						</TooltipContent>
					</Tooltip>
				)}
			</div>
			<div className="flex items-center gap-1 min-w-[50px] w-[50px] typo-code">
				{cardinalityMin && cardinalityMax
					? `${cardinalityMin}..${cardinalityMax}`
					: ""}
			</div>
			<div className="flex gap-1 w-[200px] min-w-[200px]">
				{datatype !== "union" && datatype}
			</div>
			<div className="text-left overflow-hidden">
				{short && <div className="line-clamp-2">{short}</div>}
				{!short && desc && <div className="line-clamp-2">{desc}</div>}
				{extensionUrl && (
					<div className="flex items-center gap-1">
						<span>URL:</span>
						{extensionCoordinate?.id ? (
							<a
								href={`#/ig/${extensionCoordinate?.["package-spec"]?.name || extensionCoordinate?.packageSpec?.name}#${extensionCoordinate?.["package-spec"]?.version || extensionCoordinate?.packageSpec?.version}/sd/${extensionCoordinate?.id}`}
								className="font-medium hover:underline"
							>
								{extensionCoordinate?.label || extensionUrl}
							</a>
						) : (
							<span className="font-medium">
								{extensionCoordinate?.label || extensionUrl}
							</span>
						)}
					</div>
				)}
				{binding && (
					<div className="flex items-center gap-1">
						<span>Binding:</span>
						{vsCoordinate?.id ? (
							<a
								href={`#/ig/${vsCoordinate?.["package-spec"]?.name || vsCoordinate?.packageSpec?.name}#${vsCoordinate?.["package-spec"]?.version || vsCoordinate?.packageSpec?.version}/vs/${vsCoordinate?.id}`}
								className="font-medium hover:underline"
							>
								{vsCoordinate?.label || binding?.valueSet || "Binding"}
							</a>
						) : (
							<span className="font-medium">
								{vsCoordinate?.label || binding?.valueSet || "Binding"}
							</span>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

const FhirStructureView = ({
	tree,
}: {
	tree: Record<string, TreeViewItem<FhirStructure>>;
}) => {
	const expandedItemIds = React.useMemo(() => {
		return Object.keys(tree ?? {});
	}, [tree]);

	return (
		<div className="h-fit w-fit min-h-0 min-w-0">
			<div className="flex items-center gap-2 font-semibold text-xs text-text-secondary border-b py-2 bg-bg-primary sticky top-0 z-20">
				<div className="min-w-[260px] w-[260px] ml-4">Name</div>
				<div className="min-w-[60px] w-[60px]">Flags</div>
				<div className="min-w-[50px] w-[50px]">Card.</div>
				<div className="min-w-[200px] w-[200px]">Type</div>
				<div className="min-w-[200px] w-[200px]">Description</div>
			</div>
			<TreeView
				hideChevron={true}
				horizontalLines={true}
				disableHover={true}
				zebra={true}
				rootItemId="root"
				items={tree}
				customItemView={customItemView}
				expandedItemIds={expandedItemIds}
			/>
		</div>
	);
};

export { FhirStructureView, type FhirStructure };
