# RadioButtonGroup

> Button-style radio group for visual selection.

**Import**

```tsx
import { RadioButtonGroup } from "@health-samurai/react-components";
```

**Props / states**

| Prop | Options | Default |
| --- | --- | --- |
| `variant` | `wrapped` \| `unwrapped` | `wrapped` |
| `vertical` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |
| `optionDescription` | `boolean` | `true` |

**Type**

```ts
export interface RadioButtonGroupProps
	extends Omit<
			React.ComponentProps<typeof RadioGroupPrimitive.Root>,
			"children"
		>,
		VariantProps<typeof radioButtonGroupStyles> {
	title?: string;
	description?: string;
	options: RadioButtonGroupOption[];
}
```

**Links**

[Storybook](https://healthsamurai.github.io/aidbox-ts-sdk/react-components/?path=/docs/component-radiobuttongroup--docs) · [Source](src/shadcn/components/ui/radio-button-group.tsx) · [Story](src/shadcn/components/ui/radio-button-group.stories.tsx)

_For the full prop list and a working example, `Read` the Source and Story files above._
