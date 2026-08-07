# RequestLineEditor

> Editing an HTTP method + path for REST API requests.

**Import**

```tsx
import { RequestLineEditor } from "@health-samurai/react-components";
```

**Props / states**

| Prop | Options | Default |
| --- | --- | --- |
| `method` | `GET` \| `POST` \| `PUT` \| `PATCH` \| `DELETE` | — |

**Type**

```ts
type RequestLineEditorProps = {
	method: string;
	placeholder?: string;
	autoFocus?: boolean;
	onMethodChange: (newMethod: string) => void;
	path?: string | undefined;
	onPathChange?: React.ChangeEventHandler<HTMLInputElement>;
	className?: string;
};
```

**Links**

[Storybook](https://healthsamurai.github.io/aidbox-ts-sdk/react-components/?path=/docs/component-request-line-editor--docs) · [Source](src/components/request-line-editor.tsx) · [Story](src/components/request-line-editor.stories.tsx)

_For the full prop list and a working example, `Read` the Source and Story files above._
