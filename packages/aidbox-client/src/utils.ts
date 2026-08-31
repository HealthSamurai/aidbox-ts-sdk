import YAML from "yaml";
import type { ResponseWithMeta } from "./types";
import { ErrorResponse } from "./types";

const BASE_URL_MISMATCH = "URL of the request must start with baseUrl";

/**
 * Parse an absolute URL.
 * Relative URLs and unparsable values are rejected as base URL mismatches.
 */
function parseAbsoluteUrl(value: string): URL {
	try {
		return new URL(value);
	} catch {
		throw new Error(BASE_URL_MISMATCH);
	}
}

/**
 * Validate that the fetch input URL is confined to baseUrl.
 * The request URL must carry no userinfo and must have the same scheme, host, and port as baseUrl,
 * so a textual prefix such as `http://localhost:8080@evil.example` cannot pass the check.
 * When baseUrl has a path, the request path must equal it or continue it at a `/` segment boundary.
 * Throws if the URL doesn't match baseUrl.
 */
export function validateBaseUrl(
	input: RequestInfo | URL,
	baseUrl: string,
): void {
	const url = parseAbsoluteUrl(
		input instanceof Request ? input.url : input.toString(),
	);
	const base = parseAbsoluteUrl(baseUrl);

	if (url.username !== "" || url.password !== "") {
		throw new Error(BASE_URL_MISMATCH);
	}

	if (
		url.origin === "null" ||
		url.origin !== base.origin ||
		url.protocol !== base.protocol
	) {
		throw new Error(BASE_URL_MISMATCH);
	}

	const basePath = base.pathname.endsWith("/")
		? base.pathname.slice(0, -1)
		: base.pathname;

	if (
		basePath !== "" &&
		url.pathname !== basePath &&
		!url.pathname.startsWith(`${basePath}/`)
	) {
		throw new Error(BASE_URL_MISMATCH);
	}
}

/**
 * Merge two Headers objects.
 * Headers from `override` take precedence over `base`.
 */
export function mergeHeaders(base?: Headers, override?: Headers): Headers {
	const merged = new Headers();

	base?.forEach((value, key) => {
		merged.set(key, value);
	});

	override?.forEach((value, key) => {
		merged.set(key, value);
	});

	return merged;
}

const normalizeContentType = (contentType: string) => {
	const semicolon = contentType.indexOf(";");
	if (semicolon !== -1) {
		return contentType.substring(0, semicolon).toLowerCase();
	} else {
		return contentType.toLowerCase();
	}
};

export const coerceBody = async <T>(meta: ResponseWithMeta): Promise<T> => {
	const contentType = meta.responseHeaders["content-type"];
	if (!contentType)
		throw new ErrorResponse(
			"can't coerce body to the specifyed type: server didn't specify response content-type",
			meta,
		);

	const responseCopy = meta.response.clone();

	try {
		switch (normalizeContentType(contentType)) {
			case "application/json":
			case "application/fhir+json":
				return await responseCopy.json();
			case "text/yaml":
				return YAML.parse(await responseCopy.text());
		}
	} catch (e) {
		const message: string = e instanceof Error ? e.message : "unknown error";
		throw new ErrorResponse(`failed to coerce body: ${message}`, meta);
	}
	// default:
	throw new ErrorResponse(
		`failed to coerce body: unknown content-type ${contentType}`,
		meta,
	);
};
