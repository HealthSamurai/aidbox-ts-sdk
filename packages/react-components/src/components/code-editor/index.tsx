import {
	acceptCompletion,
	autocompletion,
	type Completion,
	closeBrackets,
	closeBracketsKeymap,
	completionKeymap,
	completionStatus,
	moveCompletionSelection,
} from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { SQLDialect, sql } from "@codemirror/lang-sql";
import { yaml } from "@codemirror/lang-yaml";
import {
	bracketMatching,
	foldGutter,
	foldKeymap,
	HighlightStyle,
	indentOnInput,
	syntaxHighlighting,
	syntaxTree,
} from "@codemirror/language";
import { linter, lintKeymap } from "@codemirror/lint";
import {
	closeSearchPanel,
	findNext,
	findPrevious,
	getSearchQuery,
	highlightSelectionMatches,
	SearchQuery,
	search,
	searchKeymap,
	setSearchQuery,
} from "@codemirror/search";
import {
	Compartment,
	EditorState,
	type Extension,
	Prec,
	RangeSet,
	StateEffect,
	StateField,
} from "@codemirror/state";
import {
	crosshairCursor,
	Decoration,
	drawSelection,
	dropCursor,
	EditorView,
	GutterMarker,
	gutterLineClass,
	highlightSpecialChars,
	keymap,
	lineNumbers,
	rectangularSelection,
	type ViewUpdate,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { vim } from "@replit/codemirror-vim";
import {
	ChevronDown,
	ChevronsRight,
	ChevronUp,
	Columns2,
	Heading,
	Table2,
	Terminal,
	X,
} from "lucide-react";
import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import {
	ComplexTypeIcon,
	ResourceIcon,
	SquareFunctionIcon,
	TypCodeIcon,
} from "../../icons";
import {
	buildFhirCompletionExtension,
	type ExpandValueSet,
	fhirDiagnosticsField,
	type GetStructureDefinitions,
} from "./fhir-autocomplete";
import { type GetUrlSuggestions, http } from "./http";
import {
	buildSqlCompletionExtensions,
	fetchSqlMetadata,
	type SqlConfig,
} from "./sql-completion";

// --- Issue lines: gutter highlighting, line background, hover tooltip ---

type IssueLine = { line: number; message?: string };

class ErrorLineGutterMarker extends GutterMarker {
	elementClass = "cm-errorLineGutter";
}
const errorLineMarker = new ErrorLineGutterMarker();
const errorLineDecoration = Decoration.line({ class: "cm-errorLine" });

const setIssueLinesEffect = StateEffect.define<IssueLine[]>();

let errorTooltipEl: HTMLDivElement | null = null;

function formatErrorTypeTitle(code: string): string {
	return code
		.split("-")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}

function renderErrorCard(msg: string): HTMLElement {
	const card = document.createElement("div");
	Object.assign(card.style, {
		backgroundColor: "var(--color-bg-primary)",
		border: "1px solid var(--color-border-primary)",
		borderRadius: "var(--radius-md)",
		padding: "6px 10px",
		boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
	});
	const newlineIdx = msg.indexOf("\n");
	if (newlineIdx !== -1) {
		const title = msg.slice(0, newlineIdx);
		const body = msg.slice(newlineIdx + 1);

		const titleEl = document.createElement("div");
		titleEl.textContent = formatErrorTypeTitle(title);
		Object.assign(titleEl.style, { fontWeight: "600" });

		const hr = document.createElement("div");
		Object.assign(hr.style, {
			borderTop: "1px solid var(--color-border-primary)",
			margin: "4px 0",
		});

		const bodyEl = document.createElement("div");
		bodyEl.textContent = body;
		Object.assign(bodyEl.style, { whiteSpace: "pre-wrap" });

		card.append(titleEl, hr, bodyEl);
	} else {
		card.textContent = msg;
		card.style.whiteSpace = "pre-wrap";
	}
	return card;
}

function showErrorTooltip(message: string, x: number, y: number) {
	hideErrorTooltip();

	const tooltip = document.createElement("div");
	Object.assign(tooltip.style, {
		position: "fixed",
		fontSize: "12px",
		lineHeight: "1.4",
		color: "var(--color-text-error-primary)",
		fontFamily: "var(--font-family-sans)",
		zIndex: "1000",
		pointerEvents: "none",
		maxWidth: "400px",
		display: "flex",
		flexDirection: "column",
		gap: "6px",
	});

	const parts = message.split("\n\x00\n");
	for (const part of parts) {
		tooltip.append(renderErrorCard(part ?? ""));
	}

	document.body.appendChild(tooltip);
	errorTooltipEl = tooltip;

	const tooltipRect = tooltip.getBoundingClientRect();
	let top = y - tooltipRect.height - 8;
	// If tooltip goes above viewport, show below cursor instead
	if (top < 4) {
		top = y + 20;
	}
	// If it still goes below viewport, clamp to bottom
	if (top + tooltipRect.height > window.innerHeight - 4) {
		top = window.innerHeight - tooltipRect.height - 4;
	}
	// Final clamp to top
	if (top < 4) top = 4;
	tooltip.style.left = `${x}px`;
	tooltip.style.top = `${top}px`;
}

function hideErrorTooltip() {
	errorTooltipEl?.remove();
	errorTooltipEl = null;
}

const issueLinesField = StateField.define<{
	gutterMarkers: RangeSet<GutterMarker>;
	lineDecorations: RangeSet<Decoration>;
	messages: Map<number, string>;
}>({
	create() {
		return {
			gutterMarkers: RangeSet.empty,
			lineDecorations: Decoration.none,
			messages: new Map(),
		};
	},
	update(state, tr) {
		for (const effect of tr.effects) {
			if (effect.is(setIssueLinesEffect)) {
				const markers: { from: number; to: number; value: GutterMarker }[] = [];
				const lineDecos: {
					from: number;
					to: number;
					value: Decoration;
				}[] = [];
				const messages = new Map<number, string>();
				const doc = tr.state.doc;

				for (const issue of effect.value) {
					if (issue.line >= 1 && issue.line <= doc.lines) {
						const line = doc.line(issue.line);
						markers.push(errorLineMarker.range(line.from));
						lineDecos.push(errorLineDecoration.range(line.from));
						if (issue.message) {
							messages.set(issue.line, issue.message);
						}
					}
				}

				return {
					gutterMarkers: RangeSet.of(markers, true),
					lineDecorations: Decoration.set(lineDecos, true),
					messages,
				};
			}
		}
		if (tr.docChanged) {
			try {
				return {
					gutterMarkers: state.gutterMarkers.map(tr.changes),
					lineDecorations: state.lineDecorations.map(tr.changes),
					messages: state.messages,
				};
			} catch {
				return {
					gutterMarkers: RangeSet.empty,
					lineDecorations: Decoration.none,
					messages: new Map(),
				};
			}
		}
		return state;
	},
	provide(field) {
		return [
			gutterLineClass.from(field, (val) => val.gutterMarkers),
			EditorView.decorations.from(field, (val) => val.lineDecorations),
		];
	},
});

function getErrorMessageForLine(
	view: EditorView,
	lineNo: number,
): string | undefined {
	const issueMsg = view.state.field(issueLinesField).messages.get(lineNo);
	if (issueMsg) return issueMsg;
	try {
		return view.state.field(fhirDiagnosticsField).messages.get(lineNo);
	} catch {
		return undefined;
	}
}

function handleErrorTooltipMove(event: Event, view: EditorView) {
	const target = event.target as HTMLElement;
	const mouseEvent = event as MouseEvent;

	// Check gutter line number
	const gutterEl = target.closest(
		".cm-lineNumbers .cm-gutterElement",
	) as HTMLElement | null;
	if (gutterEl) {
		const lineNo = Number.parseInt(gutterEl.textContent ?? "", 10);
		if (!Number.isNaN(lineNo)) {
			const message = getErrorMessageForLine(view, lineNo);
			if (message) {
				showErrorTooltip(message, mouseEvent.clientX, mouseEvent.clientY);
				return false;
			}
		}
		hideErrorTooltip();
		return false;
	}

	// Check content line (cm-line) — follow cursor
	const lineEl = target.closest(".cm-line") as HTMLElement | null;
	if (lineEl) {
		const pos = view.posAtDOM(lineEl);
		const lineNo = view.state.doc.lineAt(pos).number;
		const message = getErrorMessageForLine(view, lineNo);
		if (message) {
			showErrorTooltip(message, mouseEvent.clientX, mouseEvent.clientY);
			return false;
		}
	}

	hideErrorTooltip();
	return false;
}

const errorTooltipHandler = EditorView.domEventHandlers({
	mouseover: handleErrorTooltipMove,
	mousemove: handleErrorTooltipMove,
	mouseleave() {
		hideErrorTooltip();
		return false;
	},
});

const baseTheme = EditorView.theme({
	"&": {
		backgroundColor: "var(--color-bg-primary)",
		height: "100%",
		width: "100%",
		fontSize: "14px",
	},
	"&.cm-editor": {
		paddingTop: "0 !important",
		paddingBottom: "0 !important",
	},
	".cm-scroller": {
		overflow: "auto",
		paddingTop: "8px",
		paddingBottom: "8px",
	},
	".cm-content": {
		fontFamily: "var(--font-family-mono)",
		padding: "0",
	},
	"&.cm-focused": {
		outline: "none",
	},
	".cm-cursor, .cm-dropCursor": {
		borderLeftColor: "var(--color-text-primary)",
	},
	".cm-gutter": {
		fontFamily: "var(--font-family-mono)",
	},
	".cm-gutters": {
		backgroundColor: "var(--color-bg-primary)",
		border: "none",
	},
	".cm-lineNumbers": {
		minWidth: "3.5ch",
	},
	".cm-lineNumbers .cm-gutterElement": {
		minWidth: "3.5ch",
		paddingRight: "4px",
		color: "var(--color-text-quaternary)",
	},
	".cm-lineNumbers .cm-gutterElement.cm-activeLineGutter": {
		backgroundColor: "var(--color-bg-primary)",
		color: "var(--color-text-secondary)",
	},
	".cm-activeLineGutter": {
		backgroundColor: "transparent !important",
	},
	".cm-activeLine": {
		backgroundColor: "transparent !important",
	},
	".cm-lineNumbers .cm-gutterElement.cm-errorLineGutter": {
		color: "var(--color-text-error-primary)",
		backgroundColor:
			"color-mix(in srgb, var(--color-text-error-primary) 7%, transparent)",
	},
	".cm-foldGutter .cm-gutterElement.cm-errorLineGutter": {
		color: "var(--color-text-error-primary)",
		backgroundColor:
			"color-mix(in srgb, var(--color-text-error-primary) 7%, transparent)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	},
	".cm-errorLine": {
		backgroundColor:
			"color-mix(in srgb, var(--color-text-error-primary) 7%, transparent)",
	},
});

const completionTheme = EditorView.theme({
	".cm-tooltip.cm-tooltip-autocomplete > ul": {
		maxHeight: "400px",
	},
	".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
		display: "flex",
		alignItems: "center",
		gap: "8px",
	},
	".cm-completionLabel": {
		flex: "1",
		minWidth: "0",
		fontFamily: "var(--font-family-mono)",
		fontSize: "var(--font-size-sm)",
		lineHeight: "var(--font-leading-5)",
	},
	".cm-completionMatchedText": {
		textDecoration: "none",
		fontWeight: "600",
		color: "var(--color-text-link)",
	},
	".cm-completionDetail": {
		color: "var(--color-text-tertiary)",
		fontSize: "12px",
		marginLeft: "auto",
		whiteSpace: "nowrap",
	},
	".cm-completionInfo": {
		backgroundColor: "var(--color-bg-primary)",
		border: "1px solid var(--color-border-primary)",
		borderRadius: "var(--radius-md)",
		color: "var(--color-text-secondary)",
		fontFamily: "var(--font-family-mono)",
		fontSize: "14px",
		padding: "8px 12px",
		marginLeft: "8px",
		lineHeight: "1.4",
		whiteSpace: "normal",
		maxWidth: "300px",
	},
	".cm-completion-icon": {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: "16px",
		height: "16px",
		flexShrink: "0",
	},
});

const readOnlyTheme = EditorView.theme({
	"&": {
		backgroundColor: "var(--color-bg-secondary)",
		height: "100%",
		width: "100%",
		fontSize: "14px",
	},
	"&.cm-editor": {
		paddingTop: "0 !important",
		paddingBottom: "0 !important",
	},
	".cm-scroller": {
		overflow: "auto",
		paddingTop: "8px",
		paddingBottom: "8px",
	},
	".cm-content": {
		fontFamily: "var(--font-family-mono)",
		padding: "0",
	},
	"&.cm-focused": {
		outline: "none",
	},
	".cm-gutter": {
		fontFamily: "var(--font-family-mono)",
	},
	".cm-gutters": {
		backgroundColor: "var(--color-bg-secondary)",
		border: "none",
	},
	".cm-lineNumbers": {
		minWidth: "3.5ch",
	},
	".cm-lineNumbers .cm-gutterElement": {
		minWidth: "3.5ch",
		paddingRight: "4px",
		color: "var(--color-text-quaternary)",
	},
	".cm-lineNumbers .cm-gutterElement.cm-activeLineGutter": {
		backgroundColor: "var(--color-bg-secondary)",
		color: "var(--color-text-secondary)",
	},
	".cm-activeLineGutter": {
		backgroundColor: "transparent !important",
	},
	".cm-activeLine": {
		backgroundColor: "transparent !important",
	},
	".cm-lineNumbers .cm-gutterElement.cm-errorLineGutter": {
		color: "var(--color-text-error-primary)",
		backgroundColor:
			"color-mix(in srgb, var(--color-text-error-primary) 7%, transparent)",
	},
	".cm-foldGutter .cm-gutterElement.cm-errorLineGutter": {
		color: "var(--color-text-error-primary)",
		backgroundColor:
			"color-mix(in srgb, var(--color-text-error-primary) 7%, transparent)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	},
	".cm-errorLine": {
		backgroundColor:
			"color-mix(in srgb, var(--color-text-error-primary) 7%, transparent)",
	},
});

const iconButtonStyle: React.CSSProperties = {
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	width: "28px",
	height: "28px",
	border: "none",
	borderRadius: "var(--radius-sm)",
	background: "transparent",
	color: "var(--color-text-secondary)",
	cursor: "pointer",
	padding: 0,
};

function getMatchInfo(
	state: EditorState,
	searchText: string,
): { current: number; total: number } {
	if (!searchText) return { current: 0, total: 0 };
	const doc = state.doc.toString();
	const sel = state.selection.main;
	const lowerDoc = doc.toLowerCase();
	const lowerSearch = searchText.toLowerCase();
	const searchLen = searchText.length;
	let total = 0;
	let current = 0;
	let pos = 0;
	for (;;) {
		const idx = lowerDoc.indexOf(lowerSearch, pos);
		if (idx === -1) break;
		total++;
		if (idx === sel.from && idx + searchLen === sel.to) {
			current = total;
		}
		pos = idx + 1;
	}
	return { current, total };
}

function createSearchPanel(view: EditorView) {
	const dom = document.createElement("div");
	const root = createRoot(dom);

	const panelRef: {
		setSearch: ((v: string) => void) | null;
		setMatch: ((info: { current: number; total: number }) => void) | null;
		lastSearch: string;
		lastCurrent: number;
		lastTotal: number;
	} = {
		setSearch: null,
		setMatch: null,
		lastSearch: "",
		lastCurrent: 0,
		lastTotal: 0,
	};

	function Panel() {
		const [value, setValue] = React.useState(
			() => getSearchQuery(view.state).search,
		);
		const [match, setMatchState] = React.useState({ current: 0, total: 0 });

		panelRef.setSearch = setValue;
		panelRef.setMatch = setMatchState;

		const handleChange = (newValue: string) => {
			setValue(newValue);
			view.dispatch({
				effects: setSearchQuery.of(new SearchQuery({ search: newValue })),
			});
		};

		return (
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "2px",
					padding: "6px 8px",
					marginTop: "4px",
					backgroundColor: "var(--color-bg-primary)",
					border: "1px solid var(--color-border-primary)",
					borderRadius: "var(--radius-md)",
					boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
				}}
			>
				<input
					value={value}
					onChange={(e) => handleChange(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							if (e.shiftKey) findPrevious(view);
							else findNext(view);
						}
						if (e.key === "Escape") {
							e.preventDefault();
							closeSearchPanel(view);
							view.focus();
						}
					}}
					placeholder="Find..."
					style={{
						height: "28px",
						padding: "0 8px",
						border: "1px solid var(--color-border-primary)",
						borderRadius: "var(--radius-md)",
						fontSize: "13px",
						fontFamily: "var(--font-family-sans)",
						backgroundColor: "var(--color-bg-primary)",
						color: "var(--color-text-primary)",
						outline: "none",
						flex: "0 0 200px",
					}}
				/>
				<span
					style={{
						fontSize: "12px",
						fontFamily: "var(--font-family-sans)",
						color: "var(--color-text-secondary)",
						whiteSpace: "nowrap",
						minWidth: "70px",
						textAlign: "center",
						visibility: value ? "visible" : "hidden",
					}}
				>
					{value
						? match.total > 0
							? `${match.current} of ${match.total}`
							: "No results"
						: "No results"}
				</span>
				<button
					type="button"
					onClick={() => findPrevious(view)}
					title="Previous match"
					style={iconButtonStyle}
				>
					<ChevronUp size={16} />
				</button>
				<button
					type="button"
					onClick={() => findNext(view)}
					title="Next match"
					style={iconButtonStyle}
				>
					<ChevronDown size={16} />
				</button>
				<button
					type="button"
					onClick={() => {
						closeSearchPanel(view);
						view.focus();
					}}
					title="Close"
					style={iconButtonStyle}
				>
					<X size={14} />
				</button>
			</div>
		);
	}

	flushSync(() => {
		root.render(<Panel />);
	});

	const input = dom.querySelector("input");
	if (input) input.setAttribute("main-field", "true");

	// Compute initial match info
	const q = getSearchQuery(view.state);
	panelRef.lastSearch = q.search;
	if (q.search) {
		const info = getMatchInfo(view.state, q.search);
		panelRef.lastCurrent = info.current;
		panelRef.lastTotal = info.total;
		panelRef.setMatch?.(info);
	}

	return {
		dom,
		top: true,
		mount() {
			const el = dom.querySelector("input");
			if (el) {
				el.focus();
				el.select();
			}
		},
		update(update: ViewUpdate) {
			const query = getSearchQuery(update.state);

			if (query.search !== panelRef.lastSearch) {
				panelRef.setSearch?.(query.search);
			}
			panelRef.lastSearch = query.search;

			const info = getMatchInfo(update.state, query.search);
			if (
				info.current !== panelRef.lastCurrent ||
				info.total !== panelRef.lastTotal
			) {
				panelRef.lastCurrent = info.current;
				panelRef.lastTotal = info.total;
				panelRef.setMatch?.(info);
			}
		},
		destroy() {
			root.unmount();
			panelRef.setSearch = null;
			panelRef.setMatch = null;
		},
	};
}

const searchPanelTheme = EditorView.theme({
	"& .cm-panels-top": {
		position: "absolute",
		top: "8px",
		right: "4px",
		left: "auto",
		zIndex: "10",
		backgroundColor: "transparent",
		border: "none",
	},
	".cm-searchMatch": {
		backgroundColor: "var(--color-blue-200) !important",
	},
	".cm-searchMatch-selected": {
		backgroundColor: "var(--color-blue-400) !important",
	},
	".cm-selectionMatch": {
		backgroundColor: "var(--color-blue-100) !important",
	},
});

const customSearchExtension = [
	search({ createPanel: createSearchPanel }),
	searchPanelTheme,
];

const customHighlightStyle = HighlightStyle.define([
	{ tag: tags.propertyName, color: "var(--hs-syntax-property)" },
	{ tag: tags.string, color: "var(--hs-syntax-string)" },
	{ tag: tags.number, color: "var(--hs-syntax-number)" },
	{ tag: tags.bool, color: "var(--hs-syntax-keyword)" },
	{ tag: tags.null, color: "var(--hs-syntax-keyword)" },
	{ tag: tags.keyword, color: "var(--hs-syntax-keyword)" },
	{ tag: tags.operatorKeyword, color: "var(--hs-syntax-string)" },
	{ tag: tags.controlKeyword, color: "var(--hs-syntax-property)" },
	{ tag: tags.typeName, color: "var(--hs-syntax-number)" },
	{ tag: tags.variableName, color: "var(--hs-syntax-property)" },
	{ tag: tags.operator, color: "var(--hs-syntax-string)" },
	{ tag: tags.comment, color: "var(--hs-syntax-comment)" },
	{ tag: tags.lineComment, color: "var(--hs-syntax-comment)" },
	{ tag: tags.blockComment, color: "var(--hs-syntax-comment)" },
]);

const SQL_KEYWORDS = [
	"select",
	"from",
	"where",
	"and",
	"or",
	"not",
	"in",
	"between",
	"like",
	"ilike",
	"similar",
	"insert",
	"update",
	"delete",
	"create",
	"drop",
	"alter",
	"table",
	"index",
	"view",
	"materialized",
	"schema",
	"sequence",
	"type",
	"extension",
	"function",
	"procedure",
	"trigger",
	"join",
	"inner",
	"left",
	"right",
	"outer",
	"full",
	"cross",
	"lateral",
	"natural",
	"on",
	"using",
	"as",
	"order",
	"by",
	"group",
	"having",
	"limit",
	"offset",
	"fetch",
	"first",
	"next",
	"rows",
	"only",
	"union",
	"intersect",
	"except",
	"distinct",
	"all",
	"exists",
	"any",
	"some",
	"case",
	"when",
	"then",
	"else",
	"end",
	"null",
	"true",
	"false",
	"is",
	"isnull",
	"notnull",
	"asc",
	"desc",
	"nulls",
	"with",
	"recursive",
	"returning",
	"into",
	"values",
	"set",
	"default",
	"begin",
	"commit",
	"rollback",
	"savepoint",
	"release",
	"transaction",
	"explain",
	"analyze",
	"verbose",
	"costs",
	"buffers",
	"format",
	"grant",
	"revoke",
	"truncate",
	"cascade",
	"restrict",
	"vacuum",
	"reindex",
	"cluster",
	"copy",
	"do",
	"perform",
	"raise",
	"notice",
	"exception",
	"if",
	"elsif",
	"loop",
	"while",
	"for",
	"foreach",
	"return",
	"returns",
	"language",
	"plpgsql",
	"declare",
	"primary",
	"key",
	"foreign",
	"references",
	"unique",
	"check",
	"constraint",
	"not",
	"null",
	"add",
	"column",
	"rename",
	"to",
	"owner",
	"tablespace",
	"temporary",
	"temp",
	"unlogged",
	"if",
	"replace",
	"or",
	"conflict",
	"nothing",
	"window",
	"partition",
	"over",
	"range",
	"unbounded",
	"preceding",
	"following",
	"current",
	"row",
	"groups",
	"exclude",
	"ties",
	"filter",
	"within",
];

const SQL_BUILTIN = [
	// types
	"varchar",
	"char",
	"text",
	"integer",
	"int",
	"smallint",
	"bigint",
	"decimal",
	"numeric",
	"float",
	"real",
	"double",
	"precision",
	"boolean",
	"bool",
	"date",
	"time",
	"timestamp",
	"timestamptz",
	"interval",
	"uuid",
	"json",
	"jsonb",
	"bytea",
	"serial",
	"bigserial",
	"smallserial",
	"money",
	"inet",
	"cidr",
	"macaddr",
	"point",
	"line",
	"lseg",
	"box",
	"path",
	"polygon",
	"circle",
	"tsquery",
	"tsvector",
	"xml",
	"oid",
	"regclass",
	"regtype",
	// aggregate functions
	"count",
	"sum",
	"avg",
	"min",
	"max",
	"array_agg",
	"string_agg",
	"json_agg",
	"jsonb_agg",
	"json_object_agg",
	"jsonb_object_agg",
	"bool_and",
	"bool_or",
	"every",
	"bit_and",
	"bit_or",
	// window functions
	"row_number",
	"rank",
	"dense_rank",
	"percent_rank",
	"cume_dist",
	"ntile",
	"lag",
	"lead",
	"first_value",
	"last_value",
	"nth_value",
	// string functions
	"coalesce",
	"nullif",
	"greatest",
	"least",
	"concat",
	"concat_ws",
	"substring",
	"upper",
	"lower",
	"trim",
	"ltrim",
	"rtrim",
	"length",
	"char_length",
	"octet_length",
	"position",
	"replace",
	"translate",
	"left",
	"right",
	"repeat",
	"reverse",
	"split_part",
	"regexp_match",
	"regexp_matches",
	"regexp_replace",
	"regexp_split_to_array",
	"regexp_split_to_table",
	"format",
	"encode",
	"decode",
	"md5",
	"starts_with",
	// date/time functions
	"now",
	"current_date",
	"current_time",
	"current_timestamp",
	"localtime",
	"localtimestamp",
	"clock_timestamp",
	"statement_timestamp",
	"transaction_timestamp",
	"timeofday",
	"age",
	"date_part",
	"date_trunc",
	"extract",
	"make_date",
	"make_time",
	"make_timestamp",
	"make_timestamptz",
	"make_interval",
	"to_char",
	"to_date",
	"to_timestamp",
	"to_number",
	// json/jsonb functions
	"json_build_object",
	"jsonb_build_object",
	"json_build_array",
	"jsonb_build_array",
	"json_extract_path",
	"jsonb_extract_path",
	"json_extract_path_text",
	"jsonb_extract_path_text",
	"jsonb_set",
	"jsonb_insert",
	"jsonb_strip_nulls",
	"jsonb_pretty",
	"jsonb_typeof",
	"jsonb_each",
	"jsonb_each_text",
	"jsonb_array_elements",
	"jsonb_array_elements_text",
	"jsonb_array_length",
	"jsonb_object_keys",
	"jsonb_to_record",
	"jsonb_to_recordset",
	"jsonb_populate_record",
	"jsonb_populate_recordset",
	"jsonb_path_query",
	"jsonb_path_query_array",
	"jsonb_path_query_first",
	"jsonb_path_exists",
	"to_json",
	"to_jsonb",
	"row_to_json",
	// array functions
	"array_length",
	"array_dims",
	"array_lower",
	"array_upper",
	"array_append",
	"array_prepend",
	"array_cat",
	"array_remove",
	"array_replace",
	"array_position",
	"array_positions",
	"array_to_string",
	"string_to_array",
	"unnest",
	"cardinality",
	// set-returning functions
	"generate_series",
	"generate_subscripts",
	// math functions
	"abs",
	"ceil",
	"ceiling",
	"floor",
	"round",
	"trunc",
	"sign",
	"sqrt",
	"cbrt",
	"power",
	"exp",
	"ln",
	"log",
	"mod",
	"random",
	"setseed",
	"pi",
	"degrees",
	"radians",
	// system functions
	"pg_typeof",
	"pg_size_pretty",
	"pg_table_size",
	"pg_indexes_size",
	"pg_total_relation_size",
	"pg_relation_size",
	"pg_database_size",
	"pg_cancel_backend",
	"pg_terminate_backend",
	"pg_stat_activity",
	"pg_stat_statements",
	"pg_advisory_lock",
	"pg_advisory_unlock",
	"pg_try_advisory_lock",
	// cast/conversion
	"cast",
	"pg_get_functiondef",
	"pg_get_viewdef",
	"pg_get_indexdef",
	// misc
	"exists",
	"in",
	"between",
	"like",
	"ilike",
	"similar",
	"any",
	"some",
	"row",
	"array",
	"nextval",
	"currval",
	"setval",
	"lastval",
	"txid_current",
];

const customSQLDialect = SQLDialect.define({
	keywords: SQL_KEYWORDS.join(" "),
	builtin: SQL_BUILTIN.join(" "),
});

function computeYamlNewlineIndent(lineText: string): string {
	const indent = lineText.match(/^(\s*)/)?.[1] ?? "";
	const trimmed = lineText.trimEnd();

	if (trimmed.endsWith(":")) {
		// After "key:" with no value — increase indent
		// For "  - key:", base indent is at the dash content level
		const dashMatch = trimmed.match(/^(\s*-\s+)/);
		const baseIndent = dashMatch?.[1]
			? " ".repeat(dashMatch[1].length)
			: indent;
		return `${baseIndent}  `;
	}
	if (/^\s*-\s*$/.test(trimmed)) {
		// After bare "- " (array item marker only) — align to content after dash
		const dashMatch = trimmed.match(/^(\s*-\s*)/);
		return dashMatch?.[1] ? " ".repeat(dashMatch[1].length) : indent;
	}
	// Preserve current indent; for "  - key: val" align to key level
	const dashKeyMatch = trimmed.match(/^(\s*-\s+)\S/);
	return dashKeyMatch?.[1] ? " ".repeat(dashKeyMatch[1].length) : indent;
}

function yamlEnterKeymap(): Extension {
	return keymap.of([
		{
			key: "Enter",
			run: (view) => {
				const { state } = view;
				const pos = state.selection.main.head;
				const line = state.doc.lineAt(pos);
				const newIndent = computeYamlNewlineIndent(line.text);

				view.dispatch({
					changes: { from: pos, insert: `\n${newIndent}` },
					selection: { anchor: pos + 1 + newIndent.length },
				});
				return true;
			},
		},
	]);
}

function httpYamlEnterKeymap(): Extension {
	return keymap.of([
		{
			key: "Enter",
			run: (view) => {
				const { state } = view;
				const pos = state.selection.main.head;
				const doc = state.doc.toString();

				// Only handle if cursor is in YAML body (after blank line separator)
				const textBeforeCursor = doc.slice(0, pos);
				const blankLineIdx = textBeforeCursor.indexOf("\n\n");
				if (blankLineIdx === -1 || pos <= blankLineIdx + 1) return false;

				// Check if the body looks like YAML (not JSON)
				const bodyStart = blankLineIdx + 2;
				const bodyPrefix = doc.slice(bodyStart, bodyStart + 20).trimStart();
				if (bodyPrefix.startsWith("{") || bodyPrefix.startsWith("["))
					return false;

				const line = state.doc.lineAt(pos);
				const newIndent = computeYamlNewlineIndent(line.text);

				view.dispatch({
					changes: { from: pos, insert: `\n${newIndent}` },
					selection: { anchor: pos + 1 + newIndent.length },
				});
				return true;
			},
		},
	]);
}

type LanguageMode = "json" | "http" | "sql" | "yaml";

function languageExtensions(
	mode: LanguageMode,
	sqlExtraBuiltins?: string[],
	getUrlSuggestions?: GetUrlSuggestions,
) {
	if (mode === "http") {
		const jsonLang = json();
		const yamlLang = yaml();
		return [
			http(
				(ct) =>
					ct === "application/json"
						? jsonLang.language
						: ct === "text/yaml" ||
								ct === "application/yaml" ||
								ct === "application/x-yaml"
							? yamlLang.language
							: null,
				getUrlSuggestions,
			),
			syntaxHighlighting(customHighlightStyle),
			jsonAutoExpandBraces(),
			httpYamlEnterKeymap(),
		];
	} else if (mode === "sql") {
		let dialect = customSQLDialect;
		if (sqlExtraBuiltins && sqlExtraBuiltins.length > 0) {
			dialect = SQLDialect.define({
				keywords: SQL_KEYWORDS.join(" "),
				builtin: [...SQL_BUILTIN, ...sqlExtraBuiltins].join(" "),
			});
		}
		return [sql({ dialect }), syntaxHighlighting(customHighlightStyle)];
	} else if (mode === "yaml") {
		return [
			yaml(),
			syntaxHighlighting(customHighlightStyle),
			yamlEnterKeymap(),
		];
	} else {
		return [
			json(),
			linter(
				(view) => {
					if (!view.state.doc.toString().trim()) return [];
					return jsonParseLinter()(view);
				},
				{ delay: 300 },
			),
			syntaxHighlighting(customHighlightStyle),
			jsonAutoExpandBraces(),
		];
	}
}

function jsonAutoExpandBraces(): Extension {
	return EditorState.transactionFilter.of((tr) => {
		if (!tr.docChanged) return tr;

		let braceFrom = -1;
		let braceTo = -1;
		let changeCount = 0;

		tr.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
			changeCount++;
			if (inserted.toString() === "{}") {
				braceFrom = fromA;
				braceTo = toA;
			}
		});

		if (changeCount !== 1 || braceFrom === -1) return tr;

		const tree = syntaxTree(tr.startState);
		const nodeBefore = tree.resolveInner(braceFrom, -1);
		if (nodeBefore.name === "String" || nodeBefore.parent?.name === "String") {
			return tr;
		}

		const line = tr.startState.doc.lineAt(braceFrom);
		const indent = line.text.match(/^(\s*)/)?.[1] ?? "";
		const inner = `${indent}  `;

		// Check if { is inside an extension array — insert {"url": ""} snippet
		const docText = tr.startState.doc.toString();
		const textBefore = docText.slice(0, braceFrom);
		const isInExtArray =
			/"(?:extension|modifierExtension)"\s*:\s*\[\s*(?:\{[\s\S]*?\}\s*,?\s*)*$/s.test(
				textBefore,
			);
		if (isInExtArray) {
			const insert = `{\n${inner}"url": ""\n${indent}}`;
			return {
				changes: { from: braceFrom, to: braceTo, insert },
				selection: { anchor: braceFrom + insert.lastIndexOf('""') + 1 },
			};
		}

		return {
			changes: {
				from: braceFrom,
				to: braceTo,
				insert: `{\n${inner}\n${indent}}`,
			},
			selection: { anchor: braceFrom + 2 + inner.length },
		};
	});
}

type CodeEditorProps = {
	readOnly?: boolean;
	isReadOnlyTheme?: boolean;
	defaultValue?: string;
	currentValue?: string;
	onChange?: (value: string) => void;
	onUpdate?: (update: ViewUpdate) => void;
	id?: string;
	mode?: LanguageMode;
	viewCallback?: (view: EditorView) => void;
	additionalExtensions?: Extension[];
	issueLineNumbers?: { line: number; message?: string }[];
	foldGutter?: boolean;
	lineNumbers?: boolean;
	sql?: SqlConfig;
	getStructureDefinitions?: GetStructureDefinitions;
	resourceTypeHint?: string;
	expandValueSet?: ExpandValueSet;
	getUrlSuggestions?: GetUrlSuggestions;
	vimMode?: boolean;
};

export type CodeEditorView = EditorView;

export type {
	ExpandValueSet,
	GetStructureDefinitions,
} from "./fhir-autocomplete";
export type { GetUrlSuggestions } from "./http";
export type {
	SqlConfig,
	SqlMetadata,
	SqlQueryType,
} from "./sql-completion";

export function CodeEditor({
	defaultValue,
	currentValue,
	onChange,
	onUpdate,
	viewCallback,
	readOnly = false,
	id,
	mode = "json",
	isReadOnlyTheme = false,
	additionalExtensions,
	issueLineNumbers,
	foldGutter: enableFoldGutter = true,
	lineNumbers: enableLineNumbers = true,
	sql,
	getStructureDefinitions,
	resourceTypeHint,
	expandValueSet,
	getUrlSuggestions,
	vimMode = false,
}: CodeEditorProps) {
	const domRef = React.useRef(null);
	const [view, setView] = React.useState<EditorView | null>(null);

	const safeDispatch = React.useCallback(
		(spec: Parameters<EditorView["dispatch"]>[0]) => {
			try {
				view?.dispatch(spec);
			} catch {
				// Ignore RangeError from stale decoration positions during reconfigure
			}
		},
		[view],
	);

	const initialValue = React.useRef(defaultValue ?? "");

	const onChangeComparment = React.useRef(new Compartment());
	const onUpdateComparment = React.useRef(new Compartment());
	const languageCompartment = React.useRef(new Compartment());
	const readOnlyCompartment = React.useRef(new Compartment());
	const themeCompartment = React.useRef(new Compartment());
	const additionalExtensionsCompartment = React.useRef(new Compartment());
	const sqlCompletionCompartment = React.useRef(new Compartment());
	const fhirCompletionCompartment = React.useRef(new Compartment());
	const vimCompartment = React.useRef(new Compartment());
	const [sqlFunctions, setSqlFunctions] = React.useState<
		string[] | undefined
	>();
	const executeSqlRef = React.useRef(sql?.executeSql);

	React.useEffect(() => {
		if (!domRef.current) {
			return;
		}

		const view = new EditorView({
			parent: domRef.current,
			state: EditorState.create({
				doc: initialValue.current,
				extensions: [
					vimCompartment.current.of(vimMode ? vim() : []),
					EditorView.contentAttributes.of({ "data-gramm": "false" }),
					readOnlyCompartment.current.of(EditorState.readOnly.of(false)),
					...(enableLineNumbers ? [lineNumbers()] : []),
					...(enableFoldGutter
						? [
								foldGutter({
									markerDOM: (open) => {
										const el = document.createElement("span");
										el.style.display = "flex";
										el.style.alignItems = "center";
										el.style.justifyContent = "center";
										el.style.width = "100%";
										el.style.height = "100%";
										el.innerHTML = open
											? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>'
											: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
										return el;
									},
								}),
							]
						: []),
					highlightSpecialChars(),
					history(),
					drawSelection(),
					dropCursor(),
					EditorState.allowMultipleSelections.of(true),
					indentOnInput(),
					languageCompartment.current.of([]),
					bracketMatching(),
					closeBrackets(),
					autocompletion({
						icons: false,
						maxRenderedOptions: 1000,
						defaultKeymap: false,
						addToOptions: [{ render: renderCompletionIcon, position: 20 }],
						optionClass: (_completion) =>
							"!px-2 !py-1 rounded-md aria-selected:!bg-bg-quaternary aria-selected:!text-text-primary hover:!bg-bg-secondary flex items-center gap-2",
						tooltipClass: (_state) =>
							"!bg-bg-primary rounded-md p-2 shadow-md !border-border-primary !typo-body",
						compareCompletions: (a, b) => {
							const aIsProperty = a.type === "property" ? 0 : 1;
							const bIsProperty = b.type === "property" ? 0 : 1;
							return aIsProperty - bIsProperty;
						},
					}),
					rectangularSelection(),
					crosshairCursor(),
					highlightSelectionMatches(),
					Prec.highest(
						keymap.of([
							{
								key: "Tab",
								run: (v) => {
									if (completionStatus(v.state) === "active") {
										return moveCompletionSelection(true)(v);
									}
									return false;
								},
							},
							{
								key: "Shift-Tab",
								run: (v) => {
									if (completionStatus(v.state) === "active") {
										return moveCompletionSelection(false)(v);
									}
									return false;
								},
							},
							{
								key: "Enter",
								run: (v) => {
									if (completionStatus(v.state) === "active") {
										return acceptCompletion(v);
									}
									return false;
								},
							},
						]),
					),
					themeCompartment.current.of(baseTheme),
					completionTheme,
					keymap.of([
						...closeBracketsKeymap,
						...completionKeymap.filter((b) => b.key !== "Enter"),
						...defaultKeymap,
						...searchKeymap,
						...historyKeymap,
						...foldKeymap,
						...lintKeymap,
					]),
					issueLinesField,
					errorTooltipHandler,
					EditorView.exceptionSink.of(() => {}),
					...customSearchExtension,
					onChangeComparment.current.of([]),
					onUpdateComparment.current.of([]),
					additionalExtensionsCompartment.current.of([]),
					sqlCompletionCompartment.current.of([]),
					fhirCompletionCompartment.current.of([]),
				],
			}),
		});

		setView(() => view);

		return () => {
			view.destroy();
			setView(() => null);
		};
	}, [enableFoldGutter, enableLineNumbers, vimMode]);

	React.useEffect(() => {
		executeSqlRef.current = sql?.executeSql;
	});

	React.useEffect(() => {
		if (!view || !sql) {
			if (view) {
				safeDispatch({
					effects: sqlCompletionCompartment.current.reconfigure([]),
				});
			}
			setSqlFunctions(undefined);
			return;
		}

		let cancelled = false;

		fetchSqlMetadata(sql.executeSql)
			.then((metadata) => {
				if (cancelled) return;
				setSqlFunctions(metadata.functions);
				const extensions = buildSqlCompletionExtensions(
					metadata,
					(query, type) =>
						executeSqlRef.current?.(query, type) ?? Promise.resolve([]),
				);
				safeDispatch({
					effects: sqlCompletionCompartment.current.reconfigure(extensions),
				});
			})
			.catch(() => {});

		return () => {
			cancelled = true;
		};
	}, [view, sql, safeDispatch]);

	React.useEffect(() => {
		if (!view) return;
		if (getStructureDefinitions) {
			safeDispatch({
				effects: fhirCompletionCompartment.current.reconfigure(
					buildFhirCompletionExtension(
						getStructureDefinitions,
						resourceTypeHint,
						expandValueSet,
					),
				),
			});
		} else {
			safeDispatch({
				effects: fhirCompletionCompartment.current.reconfigure([]),
			});
		}
	}, [
		view,
		getStructureDefinitions,
		resourceTypeHint,
		expandValueSet,
		safeDispatch,
	]);

	React.useEffect(() => {
		if (viewCallback && view) {
			viewCallback(view);
		}
	}, [view, viewCallback]);

	React.useEffect(() => {
		safeDispatch({
			effects: onChangeComparment.current.reconfigure([
				EditorView.updateListener.of((update) => {
					if (update.docChanged && onChange) {
						onChange(update.view.state.doc.toString());
					}
				}),
			]),
		});
	}, [onChange, safeDispatch]);

	React.useEffect(() => {
		safeDispatch({
			effects: onUpdateComparment.current.reconfigure([
				EditorView.updateListener.of((update) => {
					if (onUpdate) {
						onUpdate(update);
					}
				}),
			]),
		});
	}, [onUpdate, safeDispatch]);

	// FIXME: it is probably better to have CM manage its state.
	React.useEffect(() => {
		if (!view || currentValue === undefined) {
			return;
		}

		const currentDoc = view.state.doc.toString();
		if (currentDoc !== currentValue) {
			safeDispatch({
				changes: {
					from: 0,
					to: currentDoc.length,
					insert: currentValue,
				},
			});
		}
	}, [currentValue, view, safeDispatch]);

	const getUrlSuggestionsRef = React.useRef(getUrlSuggestions);
	getUrlSuggestionsRef.current = getUrlSuggestions;

	const stableGetUrlSuggestions = React.useMemo(() => {
		if (!getUrlSuggestions) return undefined;
		return ((path: string, method: string) =>
			getUrlSuggestionsRef.current?.(path, method) ?? []) as GetUrlSuggestions;
	}, [getUrlSuggestions]);

	React.useEffect(() => {
		if (view === null) {
			return;
		}
		safeDispatch({
			effects: languageCompartment.current.reconfigure(
				languageExtensions(mode, sqlFunctions, stableGetUrlSuggestions),
			),
		});
	}, [mode, view, sqlFunctions, stableGetUrlSuggestions, safeDispatch]);

	React.useEffect(() => {
		if (view === null) {
			return;
		}
		safeDispatch({
			effects: [
				readOnlyCompartment.current.reconfigure(
					EditorState.readOnly.of(readOnly),
				),
			],
		});
	}, [readOnly, view, safeDispatch]);

	React.useEffect(() => {
		if (view === null) {
			return;
		}
		safeDispatch({
			effects: [
				themeCompartment.current.reconfigure(
					isReadOnlyTheme ? readOnlyTheme : baseTheme,
				),
			],
		});
	}, [isReadOnlyTheme, view, safeDispatch]);

	React.useEffect(() => {
		if (view === null) {
			return;
		}
		safeDispatch({
			effects: [vimCompartment.current.reconfigure(vimMode ? vim() : [])],
		});
	}, [vimMode, view, safeDispatch]);

	React.useEffect(() => {
		if (view === null) {
			return;
		}
		safeDispatch({
			effects: [
				additionalExtensionsCompartment.current.reconfigure(
					additionalExtensions ?? [],
				),
			],
		});
	}, [additionalExtensions, view, safeDispatch]);

	React.useEffect(() => {
		if (view === null) {
			return;
		}
		safeDispatch({
			effects: setIssueLinesEffect.of(issueLineNumbers ?? []),
		});
	}, [issueLineNumbers, view, safeDispatch]);

	return <div className="h-full w-full" ref={domRef} id={id} />;
}

const editorInputTheme = EditorView.theme({
	".cm-content": {
		backgroundColor: "var(--color-bg-primary)",
		border: "1px solid var(--color-border-primary)",
		borderRadius: "var(--radius-md)",
		fontFamily: "var(--font-family-sans)",
		fontWeight: "var(--font-weight-normal)",
		height: "36px",
		padding: "8px 12px 8px 12px",
		fontSize: "14px",
	},
	".cm-editor": {
		fontSize: "var(--font-size-sm)",
		color: "var(--color-text-primary)",
	},
	".cm-cursor, .cm-dropCursor": {
		borderLeftColor: "var(--color-text-primary)",
	},
	"&.cm-editor.cm-focused": {
		outline: "none",
	},
	"&.cm-editor.cm-focused .cm-content": {
		border: "1px solid var(--color-border-link)",
		borderRadius: "var(--radius-md)",
	},
	".cm-line": {
		padding: "0",
	},
	".cm-tooltip.cm-tooltip-autocomplete > ul": {
		maxHeight: "400px",
	},
	".cm-completionInfo": {
		display: "none",
		fontFamily: "var(--font-family-sans)",
	},
	".cm-completionLabel": {
		color: "var(--color-text-link)",
		fontSize: "14px",
	},
	".cm-completionDetail": {
		display: "none",
	},
	".cm-completion-icon": {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: "16px",
		height: "16px",
		flexShrink: "0",
	},
});

const KeywordIcon = () => <Terminal size={16} color="#717684" />;
const OperatorIcon = () => <ChevronsRight size={16} color="#717684" />;
const TableIcon = () => <Table2 size={16} color="#717684" />;
const HeaderIcon = () => <Heading size={16} color="#717684" />;
const ColumnIcon = () => <Columns2 size={16} color="#717684" />;

function getCompletionIcon(completion: Completion): React.FC | null {
	if (completion.type === "function") return SquareFunctionIcon;
	if (completion.type === "keyword") return KeywordIcon;
	if (completion.type === "operator") return OperatorIcon;
	if (completion.type === "table") return TableIcon;
	if (completion.type === "header") return HeaderIcon;
	if (completion.type === "text") return TypCodeIcon;
	if (completion.type === "type") return ResourceIcon;
	if (completion.type === "search-param") return null;
	const detail = completion.detail;
	if (!detail) {
		if (completion.type === "variable") return ColumnIcon;
		return TypCodeIcon;
	}
	if (completion.type === "variable") return ColumnIcon;
	const typeName = detail.replace(/\[\]$/, "");
	if (!typeName) return TypCodeIcon;
	// Search param types (TOKEN, REFERENCE) — no icon
	if (typeName === typeName.toUpperCase()) return null;
	const firstChar = typeName[0];
	if (!firstChar) return TypCodeIcon;
	const isComplex = firstChar === firstChar.toUpperCase();
	return isComplex ? ComplexTypeIcon : TypCodeIcon;
}

function renderCompletionIcon(completion: Completion): Node {
	const container = document.createElement("div");
	container.className = "cm-completion-icon";
	const Icon = getCompletionIcon(completion);
	if (Icon) {
		flushSync(() => {
			createRoot(container).render(<Icon />);
		});
	} else {
		container.style.display = "none";
	}
	return container;
}

let activeTooltip: HTMLDivElement | null = null;
let activeRafId: number | null = null;

function cleanupActiveTooltip() {
	activeTooltip?.remove();
	activeTooltip = null;
	if (activeRafId !== null) {
		cancelAnimationFrame(activeRafId);
		activeRafId = null;
	}
}

function renderCompletionDetail(completion: Completion): Node | null {
	const detail = completion.detail;
	if (!detail) return null;

	const anchor = document.createElement("span");
	anchor.style.display = "none";

	const showTooltip = () => {
		cleanupActiveTooltip();

		const tooltip = document.createElement("div");
		tooltip.textContent = detail;
		Object.assign(tooltip.style, {
			position: "fixed",
			backgroundColor: "var(--color-bg-primary)",
			border: "1px solid var(--color-border-primary)",
			borderRadius: "var(--radius-md)",
			padding: "8px 12px",
			fontSize: "12px",
			lineHeight: "1.4",
			color: "var(--color-text-secondary)",
			fontFamily: "var(--font-family-sans)",
			whiteSpace: "normal",
			width: "280px",
			boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
			zIndex: "1000",
			pointerEvents: "none",
		});
		document.body.appendChild(tooltip);
		activeTooltip = tooltip;

		const autocompleteEl = anchor.closest(".cm-tooltip-autocomplete");
		const anchorRect = autocompleteEl
			? autocompleteEl.getBoundingClientRect()
			: anchor.getBoundingClientRect();
		tooltip.style.top = `${anchorRect.top}px`;
		tooltip.style.left = `${anchorRect.right + 8}px`;

		const checkAlive = () => {
			if (!anchor.isConnected) {
				cleanupActiveTooltip();
				return;
			}
			activeRafId = requestAnimationFrame(checkAlive);
		};
		activeRafId = requestAnimationFrame(checkAlive);
	};

	requestAnimationFrame(() => {
		const option = anchor.closest("li");
		if (!option) return;
		option.addEventListener("mouseenter", showTooltip);
		option.addEventListener("mouseleave", cleanupActiveTooltip);
	});

	return anchor;
}

export function EditorInput({
	additionalExtensions,
	id,
	defaultValue,
	currentValue,
	onChange,
}: {
	additionalExtensions?: Extension[];
	id: string;
	defaultValue?: string;
	currentValue?: string;
	onChange?: (value: string) => void;
}) {
	const domRef = React.useRef(null);
	const [view, setView] = React.useState<EditorView | null>(null);
	const additionalExtensionsCompartment = React.useRef(new Compartment());
	const onChangeCompartment = React.useRef(new Compartment());
	const initialValue = React.useRef(defaultValue ?? "");

	React.useEffect(() => {
		if (!domRef.current) {
			return;
		}

		const view = new EditorView({
			parent: domRef.current,
			state: EditorState.create({
				doc: initialValue.current,
				extensions: [
					autocompletion({
						icons: false,
						maxRenderedOptions: 1000,
						closeOnBlur: false,
						addToOptions: [
							{ render: renderCompletionIcon, position: 20 },
							{ render: renderCompletionDetail, position: 80 },
						],
						optionClass: (_completion) =>
							"!px-2 !py-1 rounded-md aria-selected:!bg-bg-quaternary aria-selected:!text-text-primary hover:!bg-bg-secondary grid grid-cols-[16px_1fr] items-center gap-2",
						tooltipClass: (_state) =>
							"!bg-bg-primary rounded-md p-2 shadow-md !border-border-primary !typo-body",
						compareCompletions: (a, b) => {
							const aIsProperty = a.type === "property" ? 0 : 1;
							const bIsProperty = b.type === "property" ? 0 : 1;
							return aIsProperty - bIsProperty;
						},
					}),
					closeBrackets(),
					history(),
					indentOnInput(),
					editorInputTheme,
					EditorView.contentAttributes.of({ "data-gramm": "false" }),
					...customSearchExtension,
					additionalExtensionsCompartment.current.of([]),
					onChangeCompartment.current.of([]),
					keymap.of([
						{ key: "Tab", preventDefault: true, run: acceptCompletion },
						...closeBracketsKeymap,
						...defaultKeymap,
						...searchKeymap,
						...historyKeymap,
						...foldKeymap,
						...completionKeymap,
						...lintKeymap,
					]),
				],
			}),
		});

		setView(() => view);

		return () => {
			view.destroy();
			setView(() => null);
		};
	}, []);

	React.useEffect(() => {
		if (view === null) {
			return;
		}
		view.dispatch({
			effects: [
				additionalExtensionsCompartment.current.reconfigure(
					additionalExtensions ?? [],
				),
			],
		});
	}, [additionalExtensions, view]);

	React.useEffect(() => {
		view?.dispatch({
			effects: onChangeCompartment.current.reconfigure([
				EditorView.updateListener.of((update) => {
					if (update.docChanged && onChange) {
						onChange(update.view.state.doc.toString());
					}
				}),
			]),
		});
	}, [view, onChange]);

	React.useEffect(() => {
		if (!view || currentValue === undefined) {
			return;
		}

		const currentDoc = view.state.doc.toString();
		if (currentDoc !== currentValue) {
			view.dispatch({
				changes: {
					from: 0,
					to: currentDoc.length,
					insert: currentValue,
				},
			});
		}
	}, [currentValue, view]);

	return <div className="h-full w-full" ref={domRef} id={id} />;
}
