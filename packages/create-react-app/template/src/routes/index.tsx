import { createFileRoute } from "@tanstack/react-router";
import { BookDashed } from "lucide-react";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	return (
		<div className="flex min-h-screen items-center justify-center gap-3">
			<BookDashed />
			<h1>Aidbox React Components Template</h1>
		</div>
	);
}
