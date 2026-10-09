# SplitButton

> A primary action with alternative options behind a dropdown.

**Import**

```tsx
import { SplitButton } from "@health-samurai/react-components";
```

**Props / states**

| Prop | Options | Default |
| --- | --- | --- |
| `size` | `regular` \| `small` | `regular` |
| `disabled` | `boolean` | `false` |

**Type**

```ts
export interface SplitButtonProps
	extends Omit<React.ComponentProps<"div">, "children">,
		VariantProps<typeof splitButtonVariants> {
	children: React.ReactNode;
}
```

**Links**

[Storybook](https://healthsamurai.github.io/aidbox-ts-sdk/react-components/?path=/docs/component-splitbutton--docs) · [Figma](https://www.figma.com/design/VooyJnoC1F0Z4R8fSchMfk/HS-Design-System-CLEAN--WIP?node-id=4004-313) · [Source](src/components/split-button.tsx) · [Story](src/components/split-button.stories.tsx)

_For the full prop list and a working example, `Read` the Source and Story files above._
