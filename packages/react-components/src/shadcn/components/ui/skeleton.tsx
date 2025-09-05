import { cn } from "#shadcn/lib/utils";

// Skeleton styles
const skeletonStyles = cn("bg-bg-tertiary", "animate-pulse", "rounded-md");

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			className={cn(skeletonStyles, className)}
			{...props}
		/>
	);
}

export { Skeleton };
