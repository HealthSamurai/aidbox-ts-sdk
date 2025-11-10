import type { OperationOutcome } from "@fhir-types/hl7-fhir-r4-core";

export interface ClientParams {
	basepath: string;
}

export interface UserInfo {
	id: string;
	email?: string;
}

export interface AidboxRequestParams {
	method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
	url: string;
	headers?: Record<string, string>;
	params?: [string, string][];
	body?: string;
	streamBody?: boolean;
}

export type AidboxRawResponse = {
	response: Response;
	responseHeaders: Record<string, string>;
	duration: number;
	request: {
		method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
		url: string;
		headers?: Record<string, string>;
		params?: [string, string][];
		body?: string;
	};
};

export type AidboxResponse<T> = Omit<AidboxRawResponse, "response"> & {
	response: Omit<Response, "body"> & {
		body: T | OperationOutcome;
	};
};

export class AidboxClientError extends Error {
	constructor(msg: string, cause: AidboxRawResponse) {
		super(msg, { cause });
		this.name = "AidboxError";

		Object.setPrototypeOf(this, AidboxClientError.prototype);
	}
}

export type AidboxClientBodyCoersionErrorCause = {
	contentType: string;
	body: string | undefined;
};

export class AidboxBodyCoersionError extends Error {
	constructor(msg: string, cause: AidboxClientBodyCoersionErrorCause) {
		super(msg, { cause });
		this.name = "BodyCoersionError";

		Object.setPrototypeOf(this, AidboxBodyCoersionError.prototype);
	}
}
