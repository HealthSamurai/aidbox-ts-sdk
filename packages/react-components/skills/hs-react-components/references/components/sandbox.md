# Sandbox

> Container with visibility toggle and copy-to-clipboard.

**Import**

```tsx
import { Sandbox } from "@health-samurai/react-components";
```

**Props / states**

| Prop | Options | Default |
| --- | --- | --- |
| `showCopy` | `boolean` | — |
| `showEye` | `boolean` | — |
| `showToast` | `boolean` | — |

**Type**

```ts
export interface SandboxProps
	extends Omit<React.ComponentProps<"div">, "children" | "onCopy"> {
	url: string;

	showCopy?: boolean;

	showEye?: boolean;

	copyIcon?: React.ReactNode;

	tooltipText?: string;

	showToast?: boolean;

	onCopy?: (text: string) => void;
}
```

**Links**

[Storybook](https://healthsamurai.github.io/aidbox-ts-sdk/react-components/?path=/docs/component-sandbox--docs) · [Source](src/components/sandbox.tsx) · [Story](src/components/sandbox.stories.tsx)

_For the full prop list and a working example, `Read` the Source and Story files above._
