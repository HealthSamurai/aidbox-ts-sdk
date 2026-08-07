# IconButton

> Icon-only actions without a text label.

**Import**

```tsx
import { IconButton } from "@health-samurai/react-components";
```

**Props / states**

| Prop | Options | Default |
| --- | --- | --- |
| `variant` | `ghost` \| `link` | `ghost` |
| `disabled` | `boolean` | `false` |

**Type**

```ts
export interface IconButtonProps
	extends Omit<React.ComponentProps<"button">, "children">,
		VariantProps<typeof iconButtonVariants> {
	icon: React.ReactNode;
	"aria-label": string;
}
```

**Links**

[Storybook](https://healthsamurai.github.io/aidbox-ts-sdk/react-components/?path=/docs/component-iconbutton--docs) · [Figma](https://www.figma.com/design/VooyJnoC1F0Z4R8fSchMfk/HS-Design-System-CLEAN--WIP?node-id=2322-17314) · [Source](src/components/icon-button.tsx) · [Story](src/components/icon-button.stories.tsx)

_For the full prop list and a working example, `Read` the Source and Story files above._
