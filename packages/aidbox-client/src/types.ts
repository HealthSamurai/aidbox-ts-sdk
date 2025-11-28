import type {
	Bundle,
	OperationOutcome,
	Resource,
} from "./fhir-types/hl7-fhir-r4-core";
import type { Result } from "./result";

export type ClientParams = {
	baseurl: string;
	onResponse?: (resp: Response) => void;
};

// FIXME: sansara#6557 Generate from IG
export type User = Resource & {
	email?: string;
};

export type RequestParams = {
	method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
	url: string;
	headers?: Record<string, string>;
	params?: [string, string][];
	body?: string;
};

export type ResponseWithMeta = {
	response: Response;
	responseHeaders: Record<string, string>;
	duration: number;
	request: RequestParams;
};

export type ClientResponse<T> = ResponseWithMeta & {
	resource: T;
};

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

export class ErrorResponse extends Error {
	rawResponse: ResponseWithMeta;

	constructor(msg: string, cause: ResponseWithMeta) {
		super(msg);
		this.rawResponse = cause;
		this.name = "ErrorResponse";
	}
}

export type ReadOptions = {
	type: string;
	id: string;
};

export type SearchOptions = {
	type: string;
	query?: string;
};

export type CreateOptions = {
	type: string;
	resource: object;
};

export type OperationOptions = {
	type: string;
	operation: "$run" | "$validate";
	resource: object;
};

export type ValidateOptions = {
	type: string;
	resource: object;
	id?: string;
};

export type FhirServerClient<
	TBundle = Bundle,
	TOperationOutcome = OperationOutcome,
	TUser = User,
> = {
	getBaseURL: () => string;
	/**
	 * Untyped request.
	 *
	 * Example usage:
	 *
	 * ```typescript
	 * const result = client.rawRequest({
	 *   method: "GET",
	 *   url: "/fhir/Patient/pt-1",
	 * })
	 * ```
	 */
	rawRequest: (params: RequestParams) => Promise<ResponseWithMeta>;
	/**
	 * Typed request
	 *
	 * Example usage:
	 *
	 * ```typescript
	 * const result = client.request<Patient>({
	 *   method: "GET",
	 *   url: "/fhir/Patient/pt-1",
	 * })
	 *
	 * if (isOk(result)) {
	 *   const { value } = result;
	 *   // work with value as a Patient type
	 * } else {
	 *   const { error } = result;
	 *   // work with error as an OperationOutcome type.
	 * }
	 * ```
	 */
	request: <T>(
		params: RequestParams,
	) => Promise<Result<ClientResponse<T>, ClientResponse<TOperationOutcome>>>;
	/** Performs a request to `/auth/logout`. */
	performLogout: () => Promise<Response>;
	/** Performs a request to `/auth/userinfo`. */
	fetchUserInfo: () => Promise<TUser>;
	// FHIR methods
	read: <T>(
		opts: ReadOptions,
	) => Promise<Result<ClientResponse<T>, ClientResponse<TOperationOutcome>>>;
	search: (
		opts: SearchOptions,
	) => Promise<
		Result<ClientResponse<TBundle>, ClientResponse<TOperationOutcome>>
	>;
	create: <T>(
		opts: CreateOptions,
	) => Promise<Result<ClientResponse<T>, ClientResponse<TOperationOutcome>>>;
	operation: <T>(
		opts: OperationOptions,
	) => Promise<Result<ClientResponse<T>, ClientResponse<TOperationOutcome>>>; // $run, $validate
	validate: (
		opts: ValidateOptions,
	) => Promise<
		Result<ClientResponse<TOperationOutcome>, ClientResponse<TOperationOutcome>>
	>;
};
