import { completionStatus } from "@codemirror/autocomplete";
import type { EditorView, Rect } from "@codemirror/view";

const INFO_MAX_WIDTH = 400;
const INFO_GAP = 4;

const MIN_OPTIONS_BELOW = 6;
// Fallbacks for the option height and the vertical padding of the list
const OPTION_HEIGHT = 28;
const LIST_PADDING = 16;

function viewport(view: EditorView): Rect | null {
	const root = view.dom?.ownerDocument.documentElement;
	return root
		? { left: 0, top: 0, right: root.clientWidth, bottom: root.clientHeight }
		: null;
}

// Space the completion list may take: below the cursor line when at least six
// options fit there, otherwise above it. CodeMirror chooses the side by the
// height of the whole list, so a short and a long list at the same place would
// open on different sides; within the narrowed space a long list below is
// shortened (and scrolls) instead of being flipped.
export function completionSpace(
	space: Rect,
	cursor: Rect,
	optionHeight: number,
): Rect {
	const below =
		space.bottom - cursor.bottom >=
		MIN_OPTIONS_BELOW * optionHeight + LIST_PADDING;
	return below
		? { ...space, top: cursor.top }
		: { ...space, bottom: cursor.bottom };
}

// `tooltipSpace` for the editor: the window, narrowed to one side of the
// cursor while the completion list is open
export function completionTooltipSpace(view: EditorView): Rect {
	const space = viewport(view) ?? { left: 0, top: 0, right: 0, bottom: 0 };
	if (completionStatus(view.state) !== "active") return space;
	const cursor = view.coordsAtPos(view.state.selection.main.head);
	if (!cursor) return space;
	const option = view.dom.querySelector(".cm-tooltip-autocomplete li");
	const optionHeight = option?.getBoundingClientRect().height || OPTION_HEIGHT;
	return completionSpace(space, cursor, optionHeight);
}

// The description of the selected completion goes beside the list. When
// neither side has room (a narrow window), CodeMirror's default puts it under
// the selected option, over the options below it; here it goes under the
// whole list, or above it, within the window.
export function positionCompletionInfo(
	view: EditorView,
	list: Rect,
	option: Rect,
	info: Rect,
	space: Rect,
	tooltip?: HTMLElement,
): { style?: string; class?: string } {
	const listHeight = list.bottom - list.top;
	// Editors scaled with CSS transforms report scaled rects
	const scaleX = tooltip ? (list.right - list.left) / tooltip.offsetWidth : 1;
	const scaleY = tooltip ? listHeight / tooltip.offsetHeight : 1;
	const infoWidth = info.right - info.left;
	const infoHeight = info.bottom - info.top;
	const spaceLeft = list.left - space.left;
	const spaceRight = space.right - list.right;

	const left = spaceRight < Math.min(infoWidth, spaceLeft);
	if (infoWidth <= (left ? spaceLeft : spaceRight)) {
		const top =
			Math.max(space.top, Math.min(option.top, space.bottom - infoHeight)) -
			list.top;
		const maxWidth = Math.min(INFO_MAX_WIDTH, left ? spaceLeft : spaceRight);
		return {
			style: `top: ${top / scaleY}px; max-width: ${maxWidth / scaleX}px`,
			class: left ? "cm-completionInfo-left" : "cm-completionInfo-right",
		};
	}

	const maxWidth = Math.min(INFO_MAX_WIDTH, space.right - list.left - INFO_GAP);
	// The space is narrowed to the list's side of the cursor: the description
	// may still go to the other side, within the window
	const bounds = viewport(view) ?? space;
	const spaceBelow = bounds.bottom - list.bottom;
	const spaceAbove = list.top - bounds.top;
	const side =
		spaceBelow >= infoHeight + INFO_GAP || spaceBelow >= spaceAbove
			? "top"
			: "bottom";
	return {
		style: `${side}: ${(listHeight + INFO_GAP) / scaleY}px; left: 0; margin-left: 0; max-width: ${maxWidth / scaleX}px`,
		class: "cm-completionInfo-stacked",
	};
}
