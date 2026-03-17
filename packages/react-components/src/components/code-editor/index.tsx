import {
	acceptCompletion,
	autocompletion,
	type Completion,
	closeBrackets,
	closeBracketsKeymap,
	completionKeymap,
	completionStatus,
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
} from "@codemirror/language";
import { linter, lintGutter, lintKeymap } from "@codemirror/lint";
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
import {
	ChevronDown,
	ChevronsRight,
	ChevronUp,
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
	type GetStructureDefinitions,
} from "./fhir-completion";
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

function showErrorTooltip(anchor: Element, message: string) {
	hideErrorTooltip();

	const tooltip = document.createElement("div");
	tooltip.textContent = message;
	Object.assign(tooltip.style, {
		position: "fixed",
		backgroundColor: "var(--color-bg-primary)",
		border: "1px solid var(--color-border-primary)",
		borderRadius: "var(--radius-md)",
		padding: "6px 10px",
		fontSize: "12px",
		lineHeight: "1.4",
		color: "var(--color-text-error-primary)",
		fontFamily: "var(--font-family-sans)",
		boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
		zIndex: "1000",
		pointerEvents: "none",
		maxWidth: "400px",
		whiteSpace: "pre-wrap",
	});
	document.body.appendChild(tooltip);
	errorTooltipEl = tooltip;

	const guttersEl = anchor.closest(".cm-gutters");
	const guttersRect = guttersEl
		? guttersEl.getBoundingClientRect()
		: anchor.getBoundingClientRect();
	const anchorRect = anchor.getBoundingClientRect();
	tooltip.style.left = `${guttersRect.right + 4}px`;
	tooltip.style.top = `${anchorRect.top}px`;
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
		return state;
	},
	provide(field) {
		return [
			gutterLineClass.from(field, (val) => val.gutterMarkers),
			EditorView.decorations.from(field, (val) => val.lineDecorations),
		];
	},
});

const errorTooltipHandler = EditorView.domEventHandlers({
	mouseover(event, view) {
		const target = event.target as HTMLElement;
		const gutterEl = target.closest(
			".cm-lineNumbers .cm-gutterElement",
		) as HTMLElement | null;
		if (!gutterEl) {
			hideErrorTooltip();
			return false;
		}

		const lineNo = Number.parseInt(gutterEl.textContent ?? "", 10);
		if (Number.isNaN(lineNo)) {
			hideErrorTooltip();
			return false;
		}

		const { messages } = view.state.field(issueLinesField);
		const message = messages.get(lineNo);
		if (!message) {
			hideErrorTooltip();
			return false;
		}

		showErrorTooltip(gutterEl, message);
		return false;
	},
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
	".cm-errorLineGutter": {
		color: "var(--color-text-error-primary)",
		backgroundColor:
			"color-mix(in srgb, var(--color-text-error-primary) 7%, transparent)",
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
	".cm-errorLineGutter": {
		color: "var(--color-text-error-primary)",
		backgroundColor:
			"color-mix(in srgb, var(--color-text-error-primary) 7%, transparent)",
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
	"insert",
	"update",
	"delete",
	"create",
	"drop",
	"alter",
	"table",
	"index",
	"join",
	"inner",
	"left",
	"right",
	"outer",
	"on",
	"as",
	"order",
	"by",
	"group",
	"having",
	"limit",
	"offset",
	"union",
	"intersect",
	"except",
	"distinct",
	"all",
	"exists",
	"case",
	"when",
	"then",
	"else",
	"end",
	"null",
	"true",
	"false",
	"is",
	"asc",
	"desc",
];

const SQL_BUILTIN = [
	"varchar",
	"char",
	"text",
	"integer",
	"int",
	"bigint",
	"decimal",
	"numeric",
	"float",
	"real",
	"boolean",
	"date",
	"time",
	"timestamp",
	"uuid",
	"count",
	"sum",
	"avg",
	"min",
	"max",
	"coalesce",
	"concat",
	"substring",
	"upper",
	"lower",
	"trim",
	"length",
	"now",
	"current_date",
	"current_time",
];

const customSQLDialect = SQLDialect.define({
	keywords: SQL_KEYWORDS.join(" "),
	builtin: SQL_BUILTIN.join(" "),
});

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
			keymap.of([{
				key: "Enter",
				run: (view) => {
					const { state } = view;
					const line = state.doc.lineAt(state.selection.main.head);
					const lineText = line.text;
					const indent = lineText.match(/^(\s*)/)?.[1] ?? "";
					const trimmed = lineText.trimEnd();
					if (trimmed.endsWith(":")) {
						// After "key:" — indent to key content level + 2
						const dashMatch = trimmed.match(/^(\s*-\s+)/);
						const baseIndent = dashMatch?.[1] ? " ".repeat(dashMatch[1].length) : indent;
						const newIndent = `${baseIndent}  `;
						view.dispatch({
							changes: { from: state.selection.main.head, insert: `\n${newIndent}` },
							selection: { anchor: state.selection.main.head + 1 + newIndent.length },
						});
					} else {
						view.dispatch({
							changes: { from: state.selection.main.head, insert: `\n${indent}` },
							selection: { anchor: state.selection.main.head + 1 + indent.length },
						});
					}
					return true;
				},
			}]),
		];
	} else {
		return [
			json(),
			linter(jsonParseLinter(), { delay: 300 }),
			syntaxHighlighting(customHighlightStyle),
		];
	}
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
	lintGutter?: boolean;
	lineNumbers?: boolean;
	sql?: SqlConfig;
	getStructureDefinitions?: GetStructureDefinitions;
	getUrlSuggestions?: GetUrlSuggestions;
};

export type CodeEditorView = EditorView;

export type { GetStructureDefinitions } from "./fhir-completion";
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
	lintGutter: enableLintGutter = true,
	lineNumbers: enableLineNumbers = true,
	sql,
	getStructureDefinitions,
	getUrlSuggestions,
}: CodeEditorProps) {
	const domRef = React.useRef(null);
	const [view, setView] = React.useState<EditorView | null>(null);

	const initialValue = React.useRef(defaultValue ?? "");

	const onChangeComparment = React.useRef(new Compartment());
	const onUpdateComparment = React.useRef(new Compartment());
	const languageCompartment = React.useRef(new Compartment());
	const readOnlyCompartment = React.useRef(new Compartment());
	const themeCompartment = React.useRef(new Compartment());
	const additionalExtensionsCompartment = React.useRef(new Compartment());
	const sqlCompletionCompartment = React.useRef(new Compartment());
	const fhirCompletionCompartment = React.useRef(new Compartment());
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
					EditorView.contentAttributes.of({ "data-gramm": "false" }),
					readOnlyCompartment.current.of(EditorState.readOnly.of(false)),
					...(enableLineNumbers ? [lineNumbers()] : []),
					...(enableFoldGutter ? [foldGutter()] : []),
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
								run: acceptCompletion,
							},
							{
								key: "Enter",
								run: (v) => completionStatus(v.state) === "active",
							},
						]),
					),
					themeCompartment.current.of(baseTheme),
					completionTheme,
					keymap.of([
						...closeBracketsKeymap,
						...defaultKeymap,
						...searchKeymap,
						...historyKeymap,
						...foldKeymap,
						...completionKeymap,
						...lintKeymap,
					]),
					...(enableLintGutter ? [lintGutter()] : []),
					issueLinesField,
					errorTooltipHandler,
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
	}, [enableFoldGutter, enableLineNumbers, enableLintGutter]);

	React.useEffect(() => {
		executeSqlRef.current = sql?.executeSql;
	});

	React.useEffect(() => {
		if (!view || !sql) {
			if (view) {
				view.dispatch({
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
				view.dispatch({
					effects: sqlCompletionCompartment.current.reconfigure(extensions),
				});
			})
			.catch(() => {});

		return () => {
			cancelled = true;
		};
	}, [view, sql]);

	React.useEffect(() => {
		if (!view) return;
		if (getStructureDefinitions) {
			view.dispatch({
				effects: fhirCompletionCompartment.current.reconfigure(
					buildFhirCompletionExtension(getStructureDefinitions),
				),
			});
		} else {
			view.dispatch({
				effects: fhirCompletionCompartment.current.reconfigure([]),
			});
		}
	}, [view, getStructureDefinitions]);

	React.useEffect(() => {
		if (viewCallback && view) {
			viewCallback(view);
		}
	}, [view, viewCallback]);

	React.useEffect(() => {
		view?.dispatch({
			effects: onChangeComparment.current.reconfigure([
				EditorView.updateListener.of((update) => {
					if (update.docChanged && onChange) {
						onChange(update.view.state.doc.toString());
					}
				}),
			]),
		});
	}, [view, onChange]);

	React.useEffect(() => {
		view?.dispatch({
			effects: onUpdateComparment.current.reconfigure([
				EditorView.updateListener.of((update) => {
					if (onUpdate) {
						onUpdate(update);
					}
				}),
			]),
		});
	}, [view, onUpdate]);

	// FIXME: it is probably better to have CM manage its state.
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

	const getUrlSuggestionsRef = React.useRef(getUrlSuggestions);
	getUrlSuggestionsRef.current = getUrlSuggestions;

	const stableGetUrlSuggestions = React.useMemo(() => {
		if (!getUrlSuggestions) return undefined;
		return ((path: string, method: string) =>
			getUrlSuggestionsRef.current?.(path, method) ?? []) as GetUrlSuggestions;
	}, [!!getUrlSuggestions]);

	React.useEffect(() => {
		if (view === null) {
			return;
		}
		view.dispatch({
			effects: languageCompartment.current.reconfigure(
				languageExtensions(mode, sqlFunctions, stableGetUrlSuggestions),
			),
		});
	}, [mode, view, sqlFunctions, stableGetUrlSuggestions]);

	React.useEffect(() => {
		if (view === null) {
			return;
		}
		view.dispatch({
			effects: [
				readOnlyCompartment.current.reconfigure(
					EditorState.readOnly.of(readOnly),
				),
			],
		});
	}, [readOnly, view]);

	React.useEffect(() => {
		if (view === null) {
			return;
		}
		view.dispatch({
			effects: [
				themeCompartment.current.reconfigure(
					isReadOnlyTheme ? readOnlyTheme : baseTheme,
				),
			],
		});
	}, [isReadOnlyTheme, view]);

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
		if (view === null) {
			return;
		}
		view.dispatch({
			effects: setIssueLinesEffect.of(issueLineNumbers ?? []),
		});
	}, [issueLineNumbers, view]);

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
		if (completion.type === "variable") return SquareFunctionIcon;
		return TypCodeIcon;
	}
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
