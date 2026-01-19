import * as AvatarPrimitive from "@radix-ui/react-avatar";
import type * as React from "react";

import { cn } from "#shadcn/lib/utils";

const avatarStyles = cn(
	"relative",
	"flex",
	"size-8",
	"shrink-0",
	"overflow-hidden",
	"rounded-full",
);

function Avatar({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
	return (
		<AvatarPrimitive.Root
			data-slot="avatar"
			className={cn(avatarStyles, className)}
			{...props}
		/>
	);
}

function AvatarImage({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
	return (
		<AvatarPrimitive.Image
			data-slot="avatar-image"
			className={cn("aspect-square", "size-full", className)}
			{...props}
		/>
	);
}

function AvatarFallback({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
	return (
		<AvatarPrimitive.Fallback
			data-slot="avatar-fallback"
			className={cn(
				"bg-bg-tertiary",
				"text-text-secondary",
				"flex",
				"size-full",
				"items-center",
				"justify-center",
				"rounded-full",
				"transition-colors",
				"cursor-pointer",
				"hover:bg-bg-dark_tertiary",
				"hover:text-text-primary_on-brand",
				className,
			)}
			{...props}
		/>
	);
}

export { Avatar, AvatarImage, AvatarFallback };
