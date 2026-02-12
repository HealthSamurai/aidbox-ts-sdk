import { Check, Copy, Info, TriangleAlert } from "lucide-react";
import React from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "../shadcn/components/ui/tooltip";
import { cn } from "../shadcn/lib/utils";

type OperationOutcomeSeverity = "fatal" | "error" | "warning" | "information";

export interface OperationOutcomeIssue {
	code: string;
	severity: OperationOutcomeSeverity;
	diagnostics?: string;
	expression?: string[];
	details?: {
		coding?: { system?: string; code?: string; display?: string }[];
		text?: string;
	};
}

export interface OperationOutcome {
	resourceType: "OperationOutcome";
	issue: OperationOutcomeIssue[];
}

export type OperationOutcomeViewProps = {
	resource: OperationOutcome;
	onIssueClick?: (issue: OperationOutcomeIssue) => void;
} & Omit<React.ComponentProps<"div">, "resource">;

const severityOrder: OperationOutcomeSeverity[] = [
	"fatal",
	"error",
	"warning",
	"information",
];

const severityConfig = {
	fatal: {
		header: cn("bg-bg-error-primary_inverse", "text-text-primary_on-brand"),
		text: "text-text-error-primary",
		icon: TriangleAlert,
		label: "fatal",
	},
	error: {
		header: cn("bg-bg-error-primary_inverse", "text-text-primary_on-brand"),
		text: "text-text-error-primary",
		icon: TriangleAlert,
		label: "error",
	},
	warning: {
		header: cn("bg-bg-warning-primary_inverse", "text-text-warning-primary"),
		text: "text-text-warning-primary",
		icon: TriangleAlert,
		label: "warning",
	},
	information: {
		header: cn("bg-bg-info-primary_inverse", "text-text-primary_on-brand"),
		text: "text-text-info-primary",
		icon: Info,
		label: "info",
	},
} as const;

const issueCodeLabels: Record<string, string> = {
	"constraint-error": "Constraint violation",
	"constraint-exception": "Constraint exception",
	"empty-value": "Empty value",
	"expected-array": "Expected array",
	"extension-for-repeated-primitive-types-must-be-an-array":
		"Extension must be array",
	"extension-for-scalar-primitive-types-must-be-an-object":
		"Extension must be object",
	"internal-validator-error": "Internal validator error",
	"invalid-cardinality": "Invalid cardinality",
	"invalid-constant": "Invalid constant",
	"invalid-extension-cardinality": "Invalid extension cardinality",
	"invalid-slice-cardinality": "Invalid slice cardinality",
	"invalid-slice-default": "Invalid slice default",
	"invalid-slicing-ordrer": "Invalid slicing order",
	"invalid-target-profile": "Invalid target profile",
	"invalid-type": "Invalid type",
	"non-existent-resource": "Resource not found",
	"required-key": "Required field",
	"terminology-binding-error": "Terminology binding error",
	"terminology-binding-check": "Terminology binding check",
	"too-many-union-subtypes": "Too many union subtypes",
	"underscore-keys-should-be-element-type": "Invalid underscore key",
	"underscore-property-on-complex-type": "Invalid underscore property",
	"unexpected-array": "Unexpected array",
	"unexpected-object": "Unexpected object",
	"unknown-extension": "Unknown extension",
	"unknown-key": "Unknown property",
	"unknown-profile": "Unknown profile",
	"unknown-resource-type": "Unknown resource type",
	"unmatched-element-in-closed-slicing": "Unmatched element in slicing",
	"unmathced-resource": "Unmatched resource",
	"wrong-union-type": "Wrong union type",
	processing: "Processing error",
	invalid: "Invalid",
	structure: "Structure error",
	required: "Required",
	value: "Invalid value",
	invariant: "Invariant violation",
	"not-found": "Not found",
	"not-supported": "Not supported",
	duplicate: "Duplicate",
	"business-rule": "Business rule violation",
	conflict: "Conflict",
	transient: "Transient error",
	exception: "Exception",
};

function getIssueCode(issue: OperationOutcomeIssue): string {
	return issue.details?.coding?.[0]?.code ?? issue.code;
}

function getIssueCodeLabel(code: string): string {
	return issueCodeLabels[code] ?? code;
}

function groupIssuesBySeverity(issues: OperationOutcomeIssue[]) {
	const groups = new Map<OperationOutcomeSeverity, OperationOutcomeIssue[]>();
	for (const issue of issues) {
		const existing = groups.get(issue.severity) ?? [];
		existing.push(issue);
		groups.set(issue.severity, existing);
	}
	return severityOrder
		.filter((s) => groups.has(s))
		.map((s) => ({
			severity: s,
			issues: groups.get(s) as OperationOutcomeIssue[],
		}));
}

function CopyButton({ resource }: { resource: OperationOutcome }) {
	const [copied, setCopied] = React.useState(false);

	const handleCopy = (e: React.MouseEvent) => {
		e.stopPropagation();
		navigator.clipboard.writeText(JSON.stringify(resource, null, 2));
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					className="p-1 rounded hover:bg-white/20 transition-colors [&>svg]:size-3.5"
					onClick={handleCopy}
				>
					{copied ? <Check /> : <Copy />}
				</button>
			</TooltipTrigger>
			<TooltipContent side="bottom">
				{copied ? "Copied" : "Copy OperationOutcome"}
			</TooltipContent>
		</Tooltip>
	);
}

export function OperationOutcomeView({
	resource,
	onIssueClick,
	className,
	...props
}: OperationOutcomeViewProps) {
	const groups = groupIssuesBySeverity(resource.issue);

	return (
		<div
			data-slot="operation-outcome-view"
			className={cn("flex flex-col", className)}
			{...props}
		>
			{groups.map(({ severity, issues }) => {
				const config = severityConfig[severity];
				const Icon = config.icon;
				const count = issues.length;
				const label = `${count} ${config.label}${count !== 1 ? "s" : ""}`;

				return (
					<div key={severity}>
						<div
							className={cn(
								"flex items-center gap-2 px-4 h-8",
								"[&>svg]:size-4 [&>svg]:shrink-0",
								"typo-body",
								config.header,
							)}
						>
							<Icon />
							<span className="grow">{label}</span>
							<CopyButton resource={resource} />
						</div>
						<div className="flex flex-col py-1 bg-bg-primary">
							{issues.map((issue) => {
								const expressionText = issue.expression?.join(", ");
								const codeLabel = getIssueCodeLabel(getIssueCode(issue));
								const key = `${issue.severity}-${getIssueCode(issue)}-${expressionText ?? ""}`;

								const row = (
									<button
										type="button"
										key={key}
										className={cn(
											"flex cursor-pointer hover:bg-bg-secondary w-full text-left",
										)}
										onClick={
											onIssueClick ? () => onIssueClick(issue) : undefined
										}
									>
										<span
											className={cn(
												"px-4 py-1 typo-body font-medium whitespace-nowrap",
												config.text,
											)}
										>
											{codeLabel}
										</span>
										<span className="pr-4 py-1 typo-body text-text-primary whitespace-nowrap">
											{expressionText ?? ""}
										</span>
									</button>
								);

								if (!issue.diagnostics) return row;

								return (
									<Tooltip key={key}>
										<TooltipTrigger asChild>{row}</TooltipTrigger>
										<TooltipContent
											side="bottom"
											align="start"
											className="max-w-lg whitespace-pre-wrap"
										>
											{issue.diagnostics}
										</TooltipContent>
									</Tooltip>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
}
