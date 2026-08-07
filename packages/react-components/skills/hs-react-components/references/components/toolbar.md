# Toolbar

> Horizontal bar grouping action buttons and controls.

**Import**

```tsx
import { Toolbar } from "@health-samurai/react-components";
```

**Type**

```ts
export interface ToolbarProps
	extends Omit<React.ComponentProps<"div">, "children"> {
	segmentControlValue?: string;
	onSegmentControlChange?: (value: string) => void;
	segmentControlItems?: { value: string; label: React.ReactNode }[];
	onCopyClick?: () => void;
	onAlignLeftClick?: () => void;
	onDownloadClick?: () => void;
	showCopy?: boolean;
	showAlignLeft?: boolean;
	showDownload?: boolean;
}
```

**Links**

[Storybook](https://healthsamurai.github.io/aidbox-ts-sdk/react-components/?path=/docs/component-toolbar--docs) · [Source](src/components/toolbar.tsx) · [Story](src/components/toolbar.stories.tsx)

_For the full prop list and a working example, `Read` the Source and Story files above._
