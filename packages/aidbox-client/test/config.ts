const env = (
	globalThis as typeof globalThis & {
		process?: { env?: Record<string, string | undefined> };
	}
).process?.env;

const port = env?.AIDBOX_PORT || "8080";

export const baseUrl = env?.AIDBOX_BASE_URL || `http://localhost:${port}`;
