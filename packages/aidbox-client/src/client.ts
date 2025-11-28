import type { OperationOutcome } from "./fhir-types/hl7-fhir-r4-core";
import { Err, Ok, type Result } from "./result";
import type {
	ClientParams,
	ClientResponse,
	CreateOptions,
	FhirServerClient,
	OperationOptions,
	ReadOptions,
	RequestParams,
	ResponseWithMeta,
	SearchOptions,
	ValidateOptions,
} from "./types";
import { ErrorResponse, RequestError } from "./types";
import { coerceBody } from "./utils";

type InternalAidboxErrorResponse = {
	error?: unknown;
	duration: number;
	request: RequestParams;
};

const isInternalErrorResponse = (
	resp: InternalAidboxErrorResponse | ResponseWithMeta,
): resp is InternalAidboxErrorResponse => {
	return "error" in resp;
};

/**
 * Create a client to the FHIR server.
 *
 * ```typescript
 * const client = makeClient({ baseurl: "https://fhir-server.address" })
 *
 * // alternatively, specify different FHIR types:
 * import type { Bundle, OperationOutcome } from "hl7-fhir-r5-core";
 * const client = makeClient<Bundle, OperationOutcome>({ baseurl: "https://fhir-server.address" })
 * ```
 *
 * Main client functions are `request` for typed interactions, and `rawRequest` for manual response processing.
 *
 * This client also provides a set of convenience methods for accessing FHIR operations:
 *
 * - `read`
 * - `search`
 * - `create`
 * - `operation`
 * - `validate`
 *
 */
export function makeClient<TBundle, TOperationOutcome, TUser>({
	baseurl,
	onResponse = undefined,
}: ClientParams): FhirServerClient<TBundle, TOperationOutcome, TUser> {
	const getBaseURL = (): string => {
		return baseurl;
	};

	// TODO: async response pattern
	const internalRawRequest = async (
		requestParams: RequestParams,
	): Promise<ResponseWithMeta | InternalAidboxErrorResponse> => {
		const startTime = Date.now();
		const baseURL = getBaseURL();

		if (!requestParams.url.startsWith("/"))
			return {
				error: new RequestError("url must start with a forward slash", {
					request: requestParams,
				}),
				duration: Date.now() - startTime,
				request: requestParams,
			};

		const { method, url, headers = {}, params = [], body } = requestParams;

		const urlObj = new URL(url, baseURL);

		params.forEach(([key, value]) => {
			urlObj.searchParams.append(key, value);
		});

		const requestHeaders: Record<string, string> = {
			"content-type": "application/json",
			accept: "application/json",
		};

		Object.entries(headers).forEach(([header, value]) => {
			requestHeaders[header.toLowerCase()] = value;
		});

		const request = {
			method,
			url,
			params,
			headers: requestHeaders,
			body: body ?? "",
		};

		try {
			const response: Response = await fetch(urlObj.toString(), {
				method,
				headers: requestHeaders,
				body: body || null,
				credentials: "include",
				cache: "no-store",
			});
			const responseHeaders: Record<string, string> = {};
			response.headers.forEach((value, key) => {
				responseHeaders[key] = value;
			});
			return {
				response,
				responseHeaders,
				duration: Date.now() - startTime,
				request,
			};
		} catch (e) {
			return {
				error: new RequestError(
					e && typeof e === "object" && "message" in e
						? `error during request: ${e.message}`
						: "unknown error during request",
					{
						cause: e,
						request: request,
					},
				),
				duration: Date.now() - startTime,
				request,
			};
		}
	};

	const rawRequest = async (
		requestParams: RequestParams,
	): Promise<ResponseWithMeta> => {
		const result = await internalRawRequest(requestParams);

		if (isInternalErrorResponse(result)) throw result.error;

		if (onResponse) onResponse(result.response.clone());

		if (!result.response.ok)
			throw new ErrorResponse(
				`HTTP ${result.response.status}: ${result.response.statusText}`,
				result,
			);

		return result;
	};

	const request = async <T>(
		params: RequestParams,
	): Promise<Result<ClientResponse<T>, ClientResponse<TOperationOutcome>>> => {
		const response = await internalRawRequest(params);

		if (isInternalErrorResponse(response)) throw response.error;

		if (onResponse) onResponse(response.response.clone());

		const body = await coerceBody<T | TOperationOutcome>(response);

		if (!response.response.ok) {
			if ((body as OperationOutcome).resourceType === "OperationOutcome")
				return Err({ resource: body as TOperationOutcome, ...response });

			throw new ErrorResponse(
				`HTTP ${response.response.status}: ${response.response.statusText}`,
				response,
			);
		}

		return Ok({ resource: body as T, ...response });
	};

	const fetchUserInfo = async (): Promise<TUser> => {
		const user = await rawRequest({
			url: "/auth/userinfo",
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
		}).then((response) => coerceBody<TUser>(response));

		return user;
	};

	const performLogout = async () => {
		return (
			await rawRequest({
				url: "/auth/logout",
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
			})
		).response;
	};

	const read = async <T>(
		opts: ReadOptions,
	): Promise<Result<ClientResponse<T>, ClientResponse<TOperationOutcome>>> => {
		return await request({
			url: `/fhir/${opts.type}/${opts.id}`,
			method: "GET",
		});
	};

	const search = async (
		opts: SearchOptions,
	): Promise<
		Result<ClientResponse<TBundle>, ClientResponse<TOperationOutcome>>
	> => {
		return await request({
			url: `/fhir/${opts.type}/_search`,
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: opts.query ? opts.query : "",
		});
	};

	const create = async <T>(
		opts: CreateOptions,
	): Promise<Result<ClientResponse<T>, ClientResponse<TOperationOutcome>>> => {
		return await request<T>({
			url: `/fhir/${opts.type}/`,
			method: "POST",
			body: JSON.stringify(opts.resource),
		});
	};

	const operation = async <T>(
		opts: OperationOptions,
	): Promise<Result<ClientResponse<T>, ClientResponse<TOperationOutcome>>> => {
		return await request({
			url: `/fhir/${opts.type}/${opts.operation}`,
			method: "POST",
			body: JSON.stringify(opts.resource),
		});
	};

	const validate = async (
		opts: ValidateOptions,
	): Promise<
		Result<ClientResponse<TOperationOutcome>, ClientResponse<TOperationOutcome>>
	> => {
		return await request({
			url: opts.id
				? `/fhir/${opts.type}/${opts.id}/$validate`
				: `/fhir/${opts.type}/$valieate`,
			method: "POST",
			body: JSON.stringify(opts.resource),
		});
	};

	return {
		getBaseURL,
		rawRequest,
		request,
		performLogout,
		fetchUserInfo,
		read,
		search,
		create,
		operation,
		validate,
	};
}
