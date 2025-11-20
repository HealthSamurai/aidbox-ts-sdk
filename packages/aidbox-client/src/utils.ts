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
	const contentType = resp.responseHeaders["content-type"];
	if (!contentType)
		throw new AidboxErrorResponse(
			"can't coerce body to the specifyed type: server didn't specify response content-type",
			resp,
		);

	const responseCopy = resp.response.clone();

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
		throw new AidboxErrorResponse(`failed to coerce body: ${message}`, resp);
	}
	// default:
	throw new AidboxErrorResponse(
		`failed to coerce body: unknown content-type ${contentType}`,
		resp,
	);
};
