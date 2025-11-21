import YAML from "yaml";
import type { AidboxRawResponse } from "./types";
import { AidboxErrorResponse } from "./types";

const normalizeContentType = (contentType: string) => {
	const semicolon = contentType.indexOf(";");
	if (semicolon !== -1) {
		return contentType.substring(0, semicolon).toLowerCase();
	} else {
		return contentType.toLowerCase();
	}
};

export const coerceBody = async <T>(resp: AidboxRawResponse): Promise<T> => {
	const response = resp.response;
	const contentType = resp.responseHeaders["content-type"];
	if (!contentType)
		throw new AidboxErrorResponse(
			"server didn't specify response content-type",
			resp,
		);

	const responseCopy = response.clone(); // thrown if unable to parse body

	try {
		switch (normalizeContentType(contentType)) {
			case "application/json":
			case "application/fhir+json":
				return await response.json();
			case "text/yaml":
				return YAML.parse(await response.text());
		}
	} catch (e) {
		const message: string = e instanceof Error ? e.message : "unknown error";
		throw new AidboxErrorResponse(`failed to coerce body: ${message}`, {
			...resp,
			// cloned response still has its body as a stream
			response: responseCopy,
		});
	}
	// default:
	throw new AidboxErrorResponse(
		`failed to coerce body: unknown content-type ${contentType}`,
		resp,
	);
};
