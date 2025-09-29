import { cn } from "#shadcn/lib/utils";

const splitButtonStyles = cn(
	"flex",
	"*:data-[slot=button]:rounded-r-none",
	"*:data-[slot=dropdown-menu-trigger]:px-1",
	"*:data-[slot=dropdown-menu-trigger]:py-2",
	"*:data-[slot=dropdown-menu-trigger]:rounded-l-none",
	"*:data-[slot=dropdown-menu-trigger]:border-l-0",
	"*:data-[slot=dropdown-menu-trigger]:border-l-0",
);

const SplitButton = ({ children }: { children: React.ReactNode }) => {
	return <div className={splitButtonStyles}>{children}</div>;
};

export { SplitButton };
