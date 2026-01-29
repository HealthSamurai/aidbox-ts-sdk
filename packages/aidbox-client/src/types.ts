import type {
	AddPatch,
	CopyPatch,
	MovePatch,
	RemovePatch,
	ReplacePatch,
	TestPatch,
} from "json-patch";
import type { Resource } from "./fhir-types/hl7-fhir-r4-core";

export type Parameters = [string, string][];
export type Headers = Record<string, string>;

export type AuthProvider = {
	fetch: typeof fetch;
	baseUrl: string;
	revokeSession: () => void;
	establishSession: () => void;
};

// FIXME: sansara#6557 Generate from IG
export type User = Resource & {
	email?: string;
};

export type RequestParams = {
	method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";
	url: string;
	headers?: Headers;
	params?: Parameters;
	body?: string;
};

export type ResponseWithMeta = {
	response: Response;
	responseHeaders: Headers;
	duration: number;
	request: RequestParams;
};

export type ResourceResponse<T> = ResponseWithMeta & {
	resource: T;
};

/**
 * An error indicating that request didn't met client's expectations and was not sent as a result.
 */
export class RequestError extends Error {
	request: RequestParams;

	constructor(
		msg: string,
		{ cause, request }: { cause?: unknown; request: RequestParams },
	) {
		if (cause) super(msg, { cause });
		else super(msg);
		this.name = "RequestError";
		this.request = request;
	}
}

/**
 * An error indicating an unknown errornous response from the server.
 *
 * Thrown from `client.rawRequest` on any non-successful response code.
 *
 * Only thrown from `client.request` on any non-success code if response body isn't an `OperationOutcome`.
 */
export class ErrorResponse extends Error {
	responseWithMeta: ResponseWithMeta;

	constructor(msg: string, cause: ResponseWithMeta) {
		super(msg);
		this.responseWithMeta = cause;
		this.name = "ErrorResponse";
	}
}

/// FHIR HTTP method params

export type ReadOptions = {
	type: string;
	id: string;
	mimeType?: string;
};

export type VReadOptions = ReadOptions & {
	vid: string;
};

export type SearchTypeOptions = {
	type: string;
	query: Parameters;
};

export type SearchSystemOptions = {
	query: Parameters;
};

export type SearchCompartmentOptions = {
	query: Parameters;
	type: string;
	compartment: string;
	compartmentId: string;
};

export type CreateOptions<T> = {
	type: string;
	resource: T;
};

export type ConditionalCreateOptions<T> = {
	type: string;
	resource: T;
	searchParameters: Parameters;
};

export type UpdateOptions<T> = {
	type: string;
	resource: T;
	id: string;
};

export type ConditionalUpdateOptions<T> = {
	type: string;
	resource: T;
	searchParameters: Parameters;
};

export type PatchOptions = {
	type: string;
	id: string;
	patch: (
		| AddPatch
		| RemovePatch
		| ReplacePatch
		| MovePatch
		| CopyPatch
		| TestPatch
	)[];
};

export type ConditionalPatchOptions = {
	type: string;
	searchParameters: Parameters;
	patch: (
		| AddPatch
		| RemovePatch
		| ReplacePatch
		| MovePatch
		| CopyPatch
		| TestPatch
	)[];
};

export type DeleteOptions = {
	type: string;
	id: string;
};

export type ConditionalDeleteOptions = {
	type?: string;
	searchParameters: Parameters;
};

export type DeleteHistoryVersionOptions = {
	type: string;
	id: string;
	vid: string;
};

export type HistoryInstanceOptions = {
	type: string;
	id: string;
};

export type HistoryTypeOptions = {
	type: string;
};

export type HistorySystemOptions = Record<string, never>;

// FIXME: resource -> params
export type OperationOptions<T> = {
	type: string;
	id?: string;
	operation: "$run" | "$validate";
	resource: T;
};

export type ValidateOptions<T> = Omit<OperationOptions<T>, "operation">;

export type CapabilitiesOptions = {
	mode: "full" | "normative" | "terminology";
};

export type BatchOptions<TBundle> = {
	format: string;
	bundle: TBundle & {
		type: "batch";
	};
};

export type TransactionOptions<TBundle> = {
	format: string;
	bundle: TBundle & {
		type: "transaction";
	};
};
