import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"file:text-text-primary placeholder:text-text-quternary selection:bg-bg-primary selection:text-text-primary-foreground border-border-primary hover:border-border-primary_hover flex w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:text-text-disabled md:text-sm",
				"focus-visible:ring-2 focus-visible:ring-border-link ",
				"disabled:bg-bg-disabled",
				"aria-invalid:ring-destructive aria-invalid:text-text-error-primary aria-invalid:border-border-error-primary",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
