import type {
	CapabilitiesOptions,
	ConditionalCreateOptions,
	ConditionalPatchOptions,
	ConditionalUpdateOptions,
	CreateOptions,
	DeleteHistoryVersionOptions,
	DeleteOptions,
	HistoryOptions,
	OperationOptions,
	PatchOptions,
	ReadOptions,
	SearchOptions,
	UpdateOptions,
	ValidateOptions,
	VReadOptions,
} from "./fhir-http";
import type { OperationOutcome } from "./fhir-types/hl7-fhir-r4-core";
import { Err, Ok, type Result } from "./result";
import type {
	ClientParams,
	FhirServerClient,
	RequestParams,
	ResourceResponse,
	ResponseWithMeta,
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
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
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

	/// FHIR HTTP methods
	const read = async <T>(
		opts: ReadOptions,
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request({
			url: `/fhir/${opts.type}/${opts.id}`,
			method: "GET",
		});
	};

	const vread = async <T>(
		opts: VReadOptions,
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request({
			url: `/fhir/${opts.type}/${opts.id}/_history/${opts.vid}`,
			method: "GET",
		});
	};

	const search = async (
		opts: SearchOptions,
	): Promise<
		Result<ResourceResponse<TBundle>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request({
			url: opts.type ? `/fhir/${opts.type}/_search` : `/fhir/_search`,
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: opts.query ? opts.query : "",
		});
	};

	const create = async <T>(
		opts: CreateOptions,
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request<T>({
			url: `/fhir/${opts.type}/`,
			method: "POST",
			body: JSON.stringify(opts.resource),
		});
	};

	const conditionalCreate = async <T>(
		opts: ConditionalCreateOptions,
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request<T>({
			url: `/fhir/${opts.type}/`,
			method: "POST",
			headers: {
				"If-None-Exist": opts.searchParameters
					.map(([name, param]) => `${name}=${param}`)
					.join("&"),
			},
			body: JSON.stringify(opts.resource),
		});
	};

	const update = async <T>(
		opts: UpdateOptions,
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request<T>({
			url: `/fhir/${opts.type}/${opts.id}`,
			method: "PUT",
			body: JSON.stringify(opts.resource),
		});
	};

	const conditionalUpdate = async <T>(
		opts: ConditionalUpdateOptions,
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request<T>({
			url: `/fhir/${opts.type}`,
			method: "PUT",
			body: JSON.stringify(opts.resource),
			params: opts.searchParameters,
		});
	};

	const patch = async <T>(
		opts: PatchOptions,
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request<T>({
			url: `/fhir/${opts.type}/${opts.id}`,
			method: "PATCH",
			headers: { "Content-Type": "application/json-patch+json" },
			body: JSON.stringify(opts.patch),
		});
	};

	const conditionalPatch = async <T>(
		opts: ConditionalPatchOptions,
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request<T>({
			url: `/fhir/${opts.type}`,
			method: "PATCH",
			headers: { "Content-Type": "application/json-patch+json" },
			params: opts.searchParameters,
			body: JSON.stringify(opts.patch),
		});
	};

	const deleteOp = async <T>(
		opts: DeleteOptions,
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request<T>({
			url: `/fhir/${opts.type}/${opts.id}`,
			method: "DELETE",
			params: opts.searchParameters ?? [],
		});
	};

	const deleteHistory = async <T>(
		opts: DeleteOptions,
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request<T>({
			url: `/fhir/${opts.type}/${opts.id}/_history`,
			method: "DELETE",
		});
	};

	const deleteHistoryVersion = async <T>(
		opts: DeleteHistoryVersionOptions,
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request<T>({
			url: `/fhir/${opts.type}/${opts.id}/_history/${opts.vid}`,
			method: "DELETE",
		});
	};

	const conditionalDelete = async <T>(
		opts: DeleteOptions,
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
		const url = ["/fhir"];
		if (opts.type) url.push(opts.type);
		if (opts.id) url.push(opts.id);
		url.push("_history");

		const requestParams: RequestParams = {
			url: url.join("/"),
			method: "DELETE",
			params: opts.searchParameters,
		};

		if (opts.id && !opts.type)
			throw new RequestError(
				"resource type must be specified if ID is provided",
				{ request: requestParams },
			);
		return await request<T>(requestParams);
	};

	const history = async (
		opts: HistoryOptions,
	): Promise<
		Result<ResourceResponse<TBundle>, ResourceResponse<TOperationOutcome>>
	> => {
		const url = ["/fhir"];
		if (opts.type) url.push(opts.type);
		if (opts.id) url.push(opts.id);
		url.push("_history");

		const requestParams: RequestParams = {
			url: url.join("/"),
			method: "GET",
		};

		if (opts.id && !opts.type)
			throw new RequestError(
				"resource type must be specified if ID is provided",
				{ request: requestParams },
			);

		return await request<TBundle>(requestParams);
	};

	const capabilities = async (
		opts: CapabilitiesOptions,
	): Promise<
		Result<ResourceResponse<unknown>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request<TBundle>({
			url: "/fhir/metadata",
			method: "GET",
			params: [
				["mode", opts.mode],
				["_format", "application/fhir+json"],
			],
		});
	};

	const operation = async <T>(
		opts: OperationOptions,
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
		const url = ["/fhir"];
		if (opts.type) url.push(opts.type);
		if (opts.id) url.push(opts.id);
		url.push(opts.operation);

		const requestParams: RequestParams = {
			url: url.join("/"),
			method: "POST",
		};

		if (opts.resource) requestParams.body = JSON.stringify(opts.resource);

		return await request(requestParams);
	};

	const validate = async (
		opts: ValidateOptions,
	): Promise<
		Result<
			ResourceResponse<TOperationOutcome>,
			ResourceResponse<TOperationOutcome>
		>
	> => {
		return await operation<TOperationOutcome>({
			operation: "$validate",
			...opts,
		});
	};

	return {
		getBaseURL,
		rawRequest,
		request,
		performLogout,
		fetchUserInfo,
		read,
		vread,
		search,
		create,
		conditionalCreate,
		update,
		conditionalUpdate,
		patch,
		conditionalPatch,
		delete: deleteOp,
		deleteHistory,
		deleteHistoryVersion,
		conditionalDelete,
		history,
		capabilities,
		operation,
		validate,
	};
}
//
