import {
	acceptCompletion,
	autocompletion,
	type Completion,
	closeBrackets,
	closeBracketsKeymap,
	completionKeymap,
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
	search,
	SearchQuery,
	searchKeymap,
	setSearchQuery,
} from "@codemirror/search";
import {
	Compartment,
	EditorState,
	type Extension,
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
	highlightActiveLine,
	highlightActiveLineGutter,
	highlightSpecialChars,
	keymap,
	lineNumbers,
	rectangularSelection,
	type ViewUpdate,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

import { ComplexTypeIcon, SquareFunctionIcon, TypCodeIcon } from "../../icons";
import { http } from "./http";

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

const baseTheme = EditorView.baseTheme({
	"&": {
		backgroundColor: "var(--color-bg-primary)",
		height: "100%",
		width: "100%",
		fontSize: "14px",
		paddingTop: "8px",
		paddingBottom: "8px",
	},
	".cm-scroller": {
		overflow: "auto",
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
		backgroundColor: "var(--color-bg-primary)",
		border: "none",
	},
	".cm-lineNumbers": {
		paddingLeft: "16px",
	},
	".cm-activeLineGutter": {
		backgroundColor: "var(--color-bg-primary)",
		color: "var(--color-text-primary)",
	},
	".cm-activeLine": {
		backgroundColor: "rgba(255, 255, 255, 0)",
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

const readOnlyTheme = EditorView.theme({
	"&": {
		backgroundColor: "var(--color-bg-secondary)",
		height: "100%",
		width: "100%",
		fontSize: "14px",
		paddingTop: "8px",
		paddingBottom: "8px",
	},
	".cm-scroller": {
		overflow: "auto",
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
		paddingLeft: "16px",
	},
	".cm-activeLineGutter": {
		backgroundColor: "var(--color-bg-secondary)",
		color: "var(--color-text-primary)",
	},
	".cm-activeLine": {
		backgroundColor: "rgba(255, 255, 255, 0)",
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
				effects: setSearchQuery.of(
					new SearchQuery({ search: newValue }),
				),
			});
		};

		return (
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "2px",
					padding: "6px 8px",
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

const searchPanelTheme = EditorView.baseTheme({
	".cm-panels-top": {
		position: "absolute",
		top: "4px",
		right: "4px",
		left: "auto",
		zIndex: "10",
		backgroundColor: "transparent",
		border: "none",
	},
	".cm-searchMatch": {
		backgroundColor: "#e9f2fc",
	},
	".cm-searchMatch-selected": {
		backgroundColor: "#d0e2f8",
	},
});

const customSearchExtension = [
	search({ createPanel: createSearchPanel }),
	searchPanelTheme,
];

const customHighlightStyle = HighlightStyle.define([
	{ tag: tags.propertyName, color: "#EA4A35" },
	{ tag: tags.string, color: "#405CBF" },
	{ tag: tags.number, color: "#00A984" },
	{ tag: tags.bool, color: "#569cd6" },
	{ tag: tags.null, color: "#569cd6" },
	{ tag: tags.keyword, color: "#569cd6" },
	{ tag: tags.operatorKeyword, color: "#405CBF" },
	{ tag: tags.controlKeyword, color: "#EA4A35" },
	{ tag: tags.typeName, color: "#00A984" },
	{ tag: tags.variableName, color: "#EA4A35" },
	{ tag: tags.operator, color: "#405CBF" },
	{ tag: tags.comment, color: "#00A984" },
	{ tag: tags.lineComment, color: "#00A984" },
	{ tag: tags.blockComment, color: "#00A984" },
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

function languageExtensions(mode: LanguageMode, sqlExtraBuiltins?: string[]) {
	if (mode === "http") {
		const jsonLang = json();
		const yamlLang = yaml();
		return [
			http((ct) =>
				ct === "application/json"
					? jsonLang.language
					: ct === "text/yaml" ||
							ct === "application/yaml" ||
							ct === "application/x-yaml"
						? yamlLang.language
						: null,
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
		return [yaml(), syntaxHighlighting(customHighlightStyle)];
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
	sqlExtraBuiltins?: string[];
};

export type CodeEditorView = EditorView;

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
	sqlExtraBuiltins,
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
					autocompletion(),
					rectangularSelection(),
					crosshairCursor(),
					highlightActiveLine(),
					highlightActiveLineGutter(),
					highlightSelectionMatches(),
					themeCompartment.current.of(baseTheme),
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

	React.useEffect(() => {
		if (view === null) {
			return;
		}
		view.dispatch({
			effects: languageCompartment.current.reconfigure(
				languageExtensions(mode, sqlExtraBuiltins),
			),
		});
	}, [mode, view, sqlExtraBuiltins]);

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

function getCompletionIcon(completion: Completion): React.FC | null {
	if (completion.type === "function") return SquareFunctionIcon;
	const detail = completion.detail;
	if (!detail) return null;
	const typeName = detail.replace(/\[\]$/, "");
	if (!typeName) return null;
	const firstChar = typeName[0];
	if (!firstChar) return null;
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
