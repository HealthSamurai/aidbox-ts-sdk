import type React from "react";

export function Button({
	children,
}: React.PropsWithChildren<Record<string, never>>) {
	return <button type="button">{children}</button>;
}
