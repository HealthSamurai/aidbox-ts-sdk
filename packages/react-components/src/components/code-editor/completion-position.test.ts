import type { EditorView, Rect } from "@codemirror/view";
import { describe, expect, it } from "vitest";
import { completionSpace, positionCompletionInfo } from "./completion-position";

const view = {} as EditorView;
const rect = (
	left: number,
	top: number,
	right: number,
	bottom: number,
): Rect => ({
	left,
	top,
	right,
	bottom,
});

// Completion list at x 320–590, y 100–290 with the first option selected
const list = rect(320, 100, 590, 290);
const option = rect(328, 108, 582, 136);
const info = rect(0, 0, 350, 50);

describe("positionCompletionInfo", () => {
	it("puts the description beside the list when there is room", () => {
		const result = positionCompletionInfo(
			view,
			list,
			option,
			info,
			rect(0, 0, 1400, 640),
		);
		expect(result.class).toBe("cm-completionInfo-right");
		expect(result.style).toContain("top: 8px");
	});

	it("puts the description under the whole list in a narrow window", () => {
		const result = positionCompletionInfo(
			view,
			list,
			option,
			info,
			rect(0, 0, 700, 640),
		);
		expect(result.class).toBe("cm-completionInfo-stacked");
		// below the list (190px high) rather than over the options
		expect(result.style).toContain("top: 194px");
		// within the window: 700 - 320 - 4
		expect(result.style).toContain("max-width: 376px");
	});

	it("puts the description above the list when there is no room below", () => {
		const result = positionCompletionInfo(
			view,
			list,
			option,
			info,
			rect(0, 0, 700, 320),
		);
		expect(result.class).toBe("cm-completionInfo-stacked");
		expect(result.style).toContain("bottom: 194px");
	});
});

describe("completionSpace", () => {
	const viewport = rect(0, 0, 1000, 640);

	it("keeps the list below the cursor when six options fit there", () => {
		// 240px below the cursor line ≥ 6 options × 28px + 16px padding
		expect(completionSpace(viewport, rect(300, 380, 302, 400), 28)).toEqual({
			...viewport,
			top: 380,
		});
	});

	it("moves the list above the cursor when fewer options fit below", () => {
		// 140px below the cursor line < 184px
		expect(completionSpace(viewport, rect(300, 480, 302, 500), 28)).toEqual({
			...viewport,
			bottom: 500,
		});
	});
});
