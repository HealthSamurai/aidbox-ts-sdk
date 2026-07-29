import YAML from "yaml";
import type { ResponseWithMeta } from "./types";
import { ErrorResponse } from "./types";

/**
 * Join a base URL (which may include a path component) with a path.
 *
 * `new URL("/foo", "http://host/bar")` drops `/bar` because absolute paths
 * replace the entire path of the base. This preserves the base path.
 */
export function joinUrl(baseUrl: string, path: string): URL {
	const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
	const suffix = path.startsWith("/") ? path : `/${path}`;
	return new URL(`${base}${suffix}`);
}

/**
 * Validate that fetch input URL starts with baseUrl.
 * Throws if the URL doesn't match baseUrl.
 */
export function validateBaseUrl(
	input: RequestInfo | URL,
	baseUrl: string,
): void {
	const url = input instanceof Request ? input.url : input.toString();

	if (!url.startsWith(baseUrl)) {
		throw new Error("URL of the request must start with baseUrl");
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
