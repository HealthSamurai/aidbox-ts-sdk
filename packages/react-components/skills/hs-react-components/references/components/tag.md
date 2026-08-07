# Tag

> Colored label with shape, size, and vibrance variants.

**Import**

```tsx
import { Tag } from "@health-samurai/react-components";
```

**Props / states**

| Prop | Options | Default |
| --- | --- | --- |
| `shape` | `round` \| `square` | `round` |
| `size` | `big` \| `small` | `big` |
| `type` | `filled` \| `outlined` | `filled` |
| `vibrance` | `vivid` \| `subtle` | `vivid` |
| `color` | `green` \| `gray` \| `red` \| `blue` \| `yellow` \| `contrast` | `green` |
| `showIcon` | `boolean` | `true` |

**Type**

```ts
export type TagProps = {
	icon?: React.ReactNode;
	showIcon?: boolean;
} & Omit<React.ComponentProps<"div">, "color"> &
	VariantProps<typeof tagVariants>;
```

**Links**

[Storybook](https://healthsamurai.github.io/aidbox-ts-sdk/react-components/?path=/docs/component-tag--docs) · [Figma](https://www.figma.com/design/VooyJnoC1F0Z4R8fSchMfk/HS-Design-System-CLEAN--WIP?node-id=2690-23388) · [Source](src/components/tag.tsx) · [Story](src/components/tag.stories.tsx)

_For the full prop list and a working example, `Read` the Source and Story files above._
