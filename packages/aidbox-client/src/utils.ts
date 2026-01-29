import YAML from "yaml";
import type { ResponseWithMeta } from "./types";
import { ErrorResponse } from "./types";

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
 * Merge headers from Request and RequestInit.
 * Headers from RequestInit override headers from Request.
 */
export function mergeHeaders(
	input: RequestInfo | URL,
	init: RequestInit | undefined,
): Headers {
	const merged = new Headers();

	if (input instanceof Request) {
		input.headers.forEach((value, key) => {
			merged.set(key, value);
		});
	}

	if (init?.headers) {
		const initHeaders = new Headers(init.headers);
		initHeaders.forEach((value, key) => {
			merged.set(key, value);
		});
	}

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
