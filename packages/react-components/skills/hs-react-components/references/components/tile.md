# Tile

> Displaying a labeled key-value pair with an optional icon.

**Import**

```tsx
import { Tile } from "@health-samurai/react-components";
```

**Props / states**

| Prop | Options | Default |
| --- | --- | --- |
| `size` | `auto` \| `free` | `auto` |
| `showIcon` | `boolean` | — |

**Type**

```ts
export type TileProps = {
	label?: string;
	value?: string | number;
	icon?: React.ReactNode;
	showIcon?: boolean;
	width?: string | number;
} & Omit<React.ComponentProps<"div">, "size"> &
	VariantProps<typeof tileSizeVariants>;
```

**Links**

[Storybook](https://healthsamurai.github.io/aidbox-ts-sdk/react-components/?path=/docs/component-tile--docs) · [Figma](https://www.figma.com/design/VooyJnoC1F0Z4R8fSchMfk/HS-Design-System-CLEAN--WIP?node-id=2728-22171) · [Source](src/components/tile.tsx) · [Story](src/components/tile.stories.tsx)

_For the full prop list and a working example, `Read` the Source and Story files above._
