import type { Resource } from "./fhir-types/hl7-fhir-r4-core";

export type AidboxClientParams = {
	baseurl: string;
	onRawResponseHook?: (resp: AidboxRawResponse) => AidboxRawResponse;
};

// FIXME: sansara#6557 Generate from IG
export type User = Resource & {
	email?: string;
};

export type AidboxRequestParams = {
	method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
	url: string;
	headers?: Record<string, string>;
	params?: [string, string][];
	body?: string;
};

export type AidboxRawResponse = {
	response: Response;
	responseHeaders: Record<string, string>;
	duration: number;
	request: AidboxRequestParams;
};

export type AidboxResponse<T> = Omit<AidboxRawResponse, "response"> & {
	response: Omit<Response, "body"> & {
		body: T;
	};
};

export class AidboxClientError extends Error {
	request: AidboxRequestParams;

	constructor(msg: string, {cause, request}: {cause?: unknown; request: AidboxRequestParams}) {
		if (cause)
			super(msg, {cause});
		else
			super(msg);
		this.name = "AidboxClientError";
		this.request = request;
	}
}

export class AidboxErrorResponse extends Error {
	rawResponse: AidboxRawResponse;

	constructor(msg: string, cause: AidboxRawResponse) {
		super(msg);
		this.rawResponse = cause;
		this.name = "AidboxErrorResponse";
	}
}
