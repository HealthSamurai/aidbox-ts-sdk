# OperationOutcomeView

> Displaying FHIR OperationOutcome errors and warnings.

**Import**

```tsx
import { OperationOutcomeView } from "@health-samurai/react-components";
```

**Type**

```ts
export type OperationOutcomeViewProps = {
	resource: OperationOutcome;
	onIssueClick?: (issue: OperationOutcomeIssue) => void;
} & Omit<React.ComponentProps<"div">, "resource">;
```

**Links**

[Storybook](https://healthsamurai.github.io/aidbox-ts-sdk/react-components/?path=/docs/component-operationoutcomeview--docs) · [Source](src/components/operation-outcome-view.tsx) · [Story](src/components/operation-outcome-view.stories.tsx)

_For the full prop list and a working example, `Read` the Source and Story files above._
