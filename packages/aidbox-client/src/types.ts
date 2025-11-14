import type { OperationOutcome } from "@fhir-types/hl7-fhir-r4-core";

export type AidboxClientParams = {
	baseurl: string;
	onRawResponseHook?: (resp: AidboxRawResponse) => AidboxRawResponse;
};

export interface UserInfo {
	id: string;
	email?: string;
}

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
		body: T | OperationOutcome;
	};
};

export class AidboxClientError extends Error {
	constructor(msg: string, cause: AidboxRawResponse) {
		super(msg, { cause });
		this.name = "AidboxClientError";
	}
}
