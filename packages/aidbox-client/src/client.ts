import type {
	BatchOptions,
	CapabilitiesOptions,
	ConditionalCreateOptions,
	ConditionalDeleteOptions,
	ConditionalPatchOptions,
	ConditionalUpdateOptions,
	CreateOptions,
	DeleteHistoryVersionOptions,
	DeleteOptions,
	HistoryInstanceOptions,
	HistorySystemOptions,
	HistoryTypeOptions,
	OperationOptions,
	PatchOptions,
	ReadOptions,
	SearchCompartmentOptions,
	SearchSystemOptions,
	SearchTypeOptions,
	TransactionOptions,
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

const makeUrl = (parts: string[]): string => {
	return `/${parts.map((part: string) => encodeURIComponent(part)).join("/")}`;
};

const basePath = "fhir";

/**
 * Create a client to the FHIR server.
 *
 * ```typescript
 * const baseUrl = "https://fhir-server.address";
 * const client = makeClient({
 *   baseUrl,
 *   authProvider: new BrowserAuthProvider(baseurl);
 * });
 *
 * // alternatively, specify different FHIR types:
 * import type { Bundle, OperationOutcome } from "hl7-fhir-r5-core";
 * const client = makeClient<Bundle, OperationOutcome>({
 *   baseUrl,
 *   authProvider: new BrowserAuthProvider(baseurl);
 * });
 * ```
 *
 * Main client functions are `request` for typed interactions, and `rawRequest` for manual response processing.
 *
 * This client also provides a set of convenience methods for accessing FHIR operations:
 *
 * - `read`
 * - `vread`
 * - `searchType`
 * - `searchSystem`
 * - `searchCompartment`
 * - `create`
 * - `conditionalCreate`
 * - `update`
 * - `conditionalUpdate`
 * - `patch`
 * - `conditionalPatch`
 * - `delete: deleteOp`
 * - `deleteHistory`
 * - `deleteHistoryVersion`
 * - `conditionalDelete`
 * - `historyInstance`
 * - `historyType`
 * - `historySystem`
 * - `capabilities`
 * - `batch`
 * - `transaction`
 * - `operation`
 * - `validate`
 */
export function makeClient<TBundle, TOperationOutcome, TUser>({
	baseUrl,
	authProvider,
}: ClientParams): FhirServerClient<TBundle, TOperationOutcome, TUser> {
	const getBaseUrl = (): string => {
		return baseUrl;
	};

	// TODO: async response pattern
	const internalRawRequest = async (
		requestParams: RequestParams,
	): Promise<ResponseWithMeta | InternalAidboxErrorResponse> => {
		const startTime = performance.now();
		const baseUrl = getBaseUrl();

		if (!requestParams.url.startsWith("/"))
			return {
				error: new RequestError("URL must start with a forward slash", {
					request: requestParams,
				}),
				duration: performance.now() - startTime,
				request: requestParams,
			};

		const { method, url, headers = {}, params = [], body } = requestParams;

		const urlObj = new URL(url, baseUrl);

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
			const response: Response = await authProvider.fetch(urlObj.toString(), {
				method,
				headers: requestHeaders,
				body: body || null,
				cache: "no-store",
			});
			const responseHeaders: Record<string, string> = {};
			response.headers.forEach((value, key) => {
				responseHeaders[key] = value;
			});
			return {
				response,
				responseHeaders,
				duration: performance.now() - startTime,
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
				duration: performance.now() - startTime,
				request,
			};
		}
	};

	const rawRequest = async (
		requestParams: RequestParams,
	): Promise<ResponseWithMeta> => {
		const result = await internalRawRequest(requestParams);

		if (isInternalErrorResponse(result)) throw result.error;

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
			url: makeUrl([basePath, opts.type, opts.id]),
			method: "GET",
		});
	};

	const vread = async <T>(
		opts: VReadOptions,
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request({
			url: makeUrl([basePath, opts.type, opts.id, "_history", opts.vid]),
			method: "GET",
		});
	};

	const searchType = async (
		opts: SearchTypeOptions,
	): Promise<
		Result<ResourceResponse<TBundle>, ResourceResponse<TOperationOutcome>>
	> => {
		const url = [basePath, opts.type];

		const requestParams: RequestParams = {
			url: makeUrl(url),
			method: "GET",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			params: opts.query,
		};

		return await request<TBundle>(requestParams);
	};

	const searchSystem = async (
		opts: SearchSystemOptions,
	): Promise<
		Result<ResourceResponse<TBundle>, ResourceResponse<TOperationOutcome>>
	> => {
		const url = [basePath];
		const requestParams: RequestParams = {
			url: makeUrl(url),
			method: "GET",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			params: opts.query,
		};

		return await request<TBundle>(requestParams);
	};

	const searchCompartment = async (
		opts: SearchCompartmentOptions,
	): Promise<
		Result<ResourceResponse<TBundle>, ResourceResponse<TOperationOutcome>>
	> => {
		const url = [basePath, opts.compartment, opts.compartmentId, opts.type];

		const requestParams: RequestParams = {
			url: makeUrl(url),
			method: "GET",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			params: opts.query,
		};

		return await request<TBundle>(requestParams);
	};

	const create = async <T>(
		opts: CreateOptions,
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request<T>({
			url: makeUrl([basePath, opts.type]),
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
			url: makeUrl([basePath, opts.type]),
			method: "POST",
			headers: {
				"If-None-Exist": new URLSearchParams(opts.searchParameters).toString(),
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
			url: makeUrl([basePath, opts.type, opts.id]),
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
			url: makeUrl([basePath, opts.type]),
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
			url: makeUrl([basePath, opts.type, opts.id]),
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
			url: makeUrl([basePath, opts.type]),
			method: "PATCH",
			headers: { "Content-Type": "application/json-patch+json" },
			params: opts.searchParameters,
			body: JSON.stringify(opts.patch),
		});
	};

	const deleteOp = async <T>(
		opts: DeleteOptions,
	): Promise<
		Result<ResourceResponse<T | undefined>, ResourceResponse<TOperationOutcome>>
	> => {
		const response = await internalRawRequest({
			url: makeUrl([basePath, opts.type, opts.id]),
			method: "DELETE",
		});

		if (isInternalErrorResponse(response)) throw response.error;

		if (response.response.status === 204)
			return Ok({ resource: undefined, ...response });

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

	const deleteHistory = async <T>(
		opts: DeleteOptions,
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request<T>({
			url: makeUrl([basePath, opts.type, opts.id, "_history"]),
			method: "DELETE",
		});
	};

	const deleteHistoryVersion = async <T>(
		opts: DeleteHistoryVersionOptions,
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request<T>({
			url: makeUrl([basePath, opts.type, opts.id, "_history", opts.vid]),
			method: "DELETE",
		});
	};

	const conditionalDelete = async <T>(
		opts: ConditionalDeleteOptions,
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
		const url = [basePath];
		if (opts.type) url.push(opts.type);

		const requestParams: RequestParams = {
			url: makeUrl(url),
			method: "DELETE",
			params: opts.searchParameters,
		};

		return await request<T>(requestParams);
	};

	const historyInstance = async (
		opts: HistoryInstanceOptions,
	): Promise<
		Result<ResourceResponse<TBundle>, ResourceResponse<TOperationOutcome>>
	> => {
		const url = [basePath, opts.type, opts.id, "_history"];

		const requestParams: RequestParams = {
			url: makeUrl(url),
			method: "GET",
		};

		return await request<TBundle>(requestParams);
	};

	const historySystem = async (
		_: HistorySystemOptions,
	): Promise<
		Result<ResourceResponse<TBundle>, ResourceResponse<TOperationOutcome>>
	> => {
		const url = [basePath, "_history"];

		const requestParams: RequestParams = {
			url: makeUrl(url),
			method: "GET",
		};

		return await request<TBundle>(requestParams);
	};

	const historyType = async (
		opts: HistoryTypeOptions,
	): Promise<
		Result<ResourceResponse<TBundle>, ResourceResponse<TOperationOutcome>>
	> => {
		const url = [basePath, opts.type, "_history"];

		const requestParams: RequestParams = {
			url: makeUrl(url),
			method: "GET",
		};

		return await request<TBundle>(requestParams);
	};

	const capabilities = async (
		opts: CapabilitiesOptions,
	): Promise<
		Result<ResourceResponse<unknown>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request<TBundle>({
			url: makeUrl([basePath, "metadata"]),
			method: "GET",
			headers: {
				Accept: "application/fhir+json",
			},
			params: [
				["mode", opts.mode],
				["_format", "application/fhir+json"],
			],
		});
	};

	const batch = async (
		opts: BatchOptions,
	): Promise<
		Result<ResourceResponse<unknown>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request<TBundle>({
			url: makeUrl([basePath]),
			method: "POST",
			params: [["_format", opts.format]],
			body: JSON.stringify(opts.bundle),
		});
	};

	const transaction = async (
		opts: TransactionOptions,
	): Promise<
		Result<ResourceResponse<unknown>, ResourceResponse<TOperationOutcome>>
	> => {
		return await request<TBundle>({
			url: makeUrl([basePath]),
			method: "POST",
			params: [["_format", opts.format]],
			body: JSON.stringify(opts.bundle),
		});
	};

	const operation = async <T>(
		opts: OperationOptions,
	): Promise<
		Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>
	> => {
		const url = [basePath];
		if (opts.type) url.push(opts.type);
		if (opts.id) url.push(opts.id);
		url.push(opts.operation);

		const requestParams: RequestParams = {
			url: makeUrl(url),
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
		// General
		getBaseUrl,
		rawRequest,
		request,
		// Aidbox
		performLogout,
		fetchUserInfo,
		// FHIR HTTP
		read,
		vread,
		searchType,
		searchSystem,
		searchCompartment,
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
		historyInstance,
		historyType,
		historySystem,
		capabilities,
		batch,
		transaction,
		operation,
		validate,
	};
}
