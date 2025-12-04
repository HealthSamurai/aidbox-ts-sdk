import type { Bundle, OperationOutcome } from "./fhir-types/hl7-fhir-r4-core";
import { Err, Ok, type Result } from "./result";
import type {
	AuthProvider,
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
	RequestParams,
	ResourceResponse,
	ResponseWithMeta,
	SearchCompartmentOptions,
	SearchSystemOptions,
	SearchTypeOptions,
	TransactionOptions,
	UpdateOptions,
	User,
	ValidateOptions,
	VReadOptions,
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

/// IMPORTANT:
///
/// PLEASE, use one sentence per line approach in the docstrings.
/// Don't use hard-wrapping, it makes git-diff a painfull experience.

/**
 * Create a client to the FHIR server.
 *
 * ```typescript
 * import type { User } from "@health-samurai/aidbox-client";
 *
 * const baseUrl = "https://fhir-server.address";
 * const client = new AidboxClient(
 *   baseUrl,
 *   new BrowserAuthProvider(baseUrl);
 * );
 *
 * // alternatively, specify different FHIR types:
 * import type { Bundle, OperationOutcome } from "hl7-fhir-r5-core";
 * const client = new AidboxClient<Bundle, OperationOutcome, User>(
 *   baseUrl,
 *   authProvider: new BrowserAuthProvider(baseUrl);
 * );
 * ```
 *
 * Main client functions are `request` for typed interactions, and `rawRequest` for manual response processing.
 *
 * This client also provides a set of convenience methods for accessing FHIR operations, provided below.
 *
 * @showGroups
 */
export class AidboxClient<
	TBundle = Bundle,
	TOperationOutcome = OperationOutcome,
	TUser = User,
> {
	public baseUrl: string;
	public authProvider: AuthProvider;

	constructor(baseUrl: string, authProvider: AuthProvider) {
		this.baseUrl = baseUrl;
		this.authProvider = authProvider;
	}

	// TODO: async response pattern
	async #internalRawRequest(
		requestParams: RequestParams,
	): Promise<ResponseWithMeta | InternalAidboxErrorResponse> {
		const startTime = performance.now();
		const baseUrl = this.getBaseUrl();

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
			const response: Response = await this.authProvider.fetch(
				urlObj.toString(),
				{
					method,
					headers: requestHeaders,
					body: body || null,
					cache: "no-store",
				},
			);
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
	}

	/// FHIR HTTP methods

	/**
	 *
	 * Read the current state of the resource
	 *
	 * The interaction is performed by an HTTP GET command as shown:
	 *
	 * ```
	 * GET [base]/[type]/[id] {?_format=[mime-type]}
	 * ```
	 *
	 * FHIR Reference: https://hl7.org/fhir/http.html#read
	 *
	 * Example usage:
	 *
	 * ```typescript
	 * const patient = await client.read<Patient>({
	 *   type: "Patient",
	 *   id: "patient-id",
	 * });
	 * ```
	 *
	 * @group Instance Level Interactions
	 */
	public async read<T>(
		opts: ReadOptions,
	): Promise<Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>> {
		const requestParams: RequestParams = {
			url: makeUrl([basePath, opts.type, opts.id]),
			method: "GET",
		};
		if (opts.mimeType)
			requestParams.headers = {
				accept: opts.mimeType,
			};
		return await this.request(requestParams);
	}

	/**
	 * Read the state of a specific version of the resource
	 *
	 * The interaction is performed by an HTTP GET command as shown:
	 *
	 * ```
	 * GET [base]/[type]/[id]/_history/[vid] {?_format=[mime-type]}
	 * ```
	 *
	 * FHIR Reference: https://hl7.org/fhir/http.html#vread
	 *
	 * Example usage:
	 *
	 * ```typescript
	 * const patient = await client.vread<Patient>({
	 *   type: "Patient",
	 *   id: "patient-id",
	 *   vid: "version-id",
	 * });
	 * ```
	 *
	 * @group Instance Level Interactions
	 */
	public async vread<T>(
		opts: VReadOptions,
	): Promise<Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>> {
		const requestParams: RequestParams = {
			url: makeUrl([basePath, opts.type, opts.id, "_history", opts.vid]),
			method: "GET",
		};
		if (opts.mimeType)
			requestParams.headers = {
				accept: opts.mimeType,
			};
		return await this.request(requestParams);
	}

	/**
	 * Search the resource type based on some filter criteria.
	 *
	 * The interaction is performed by an HTTP GET command as shown:
	 *
	 * ```
	 * GET [base]/[resource-type]/?param1=value&...{&_format=[mime-type]}
	 * ```
	 *
	 * FHIR Reference: https://hl7.org/fhir/http.html#search-get
	 *
	 * Example usage:
	 *
	 * ```typescript
	 * const searchset: Bundle = await client.searchType({
	 *   type: "Patient",
	 *   query: [["family", "Unknown"]],
	 * });
	 * ```
	 *
	 * @group Type Level Interactions
	 */
	public async searchType(
		opts: SearchTypeOptions,
	): Promise<
		Result<ResourceResponse<TBundle>, ResourceResponse<TOperationOutcome>>
	> {
		const url = [basePath, opts.type];

		const requestParams: RequestParams = {
			url: makeUrl(url),
			method: "GET",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			params: opts.query,
		};

		return await this.request<TBundle>(requestParams);
	}

	/**
	 * Search the system based on some filter criteria.
	 *
	 * The interaction is performed by an HTTP GET command as shown:
	 *
	 * ```
	 * GET [base]?param1=value&...{&_format=[mime-type]}
	 * ```
	 *
	 * FHIR Reference: https://hl7.org/fhir/http.html#search-get
	 *
	 * Example usage:
	 *
	 * ```typescript
	 * const searchset: Bundle = await client.searchSystem({
	 *   query: [["family", "Unknown"]]
	 * });
	 * ```
	 *
	 * @group Whole System Interactions
	 */
	public async searchSystem(
		opts: SearchSystemOptions,
	): Promise<
		Result<ResourceResponse<TBundle>, ResourceResponse<TOperationOutcome>>
	> {
		const url = [basePath];
		const requestParams: RequestParams = {
			url: makeUrl(url),
			method: "GET",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			params: opts.query,
		};

		return await this.request<TBundle>(requestParams);
	}

	/**
	 * Search the resource type across the compartment based on some filter criteria.
	 *
	 * The interaction is performed by an HTTP GET command as shown:
	 *
	 * ```
	 * GET [base]/[compartment-type]/[compartment-id]/[resource-type]?param1=value&...{&_format=[mime-type]}
	 * ```
	 *
	 * FHIR Reference: https://hl7.org/fhir/http.html#search-get
	 *
	 * Example usage:
	 *
	 * ```typescript
	 * const result: Bundle = await client.searchCompartment({
	 *   compartment: "Patient",
	 *   compartmentId: "patient-id",
	 *   type: "Observation",
	 *   query: [["status", "final"]],
	 * });
	 * ```
	 *
	 * @group Compartment Interactions
	 */
	public async searchCompartment(
		opts: SearchCompartmentOptions,
	): Promise<
		Result<ResourceResponse<TBundle>, ResourceResponse<TOperationOutcome>>
	> {
		const url = [basePath, opts.compartment, opts.compartmentId, opts.type];

		const requestParams: RequestParams = {
			url: makeUrl(url),
			method: "GET",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			params: opts.query,
		};

		return await this.request<TBundle>(requestParams);
	}

	/**
	 * Create a new resource with a server assigned id.
	 *
	 * The `create` interaction is performed by an HTTP POST command as shown:
	 *
	 * ```
	 * POST [base]/[type] {?_format=[mime-type]}
	 * ```
	 *
	 * FHIR Reference: https://hl7.org/fhir/http.html#create
	 *
	 * Example usage:
	 *
	 * ```typescript
	 * const patient = await client.create<Patient>({
	 *   type: "Patient",
	 *   resource: {
	 *     id: "patient-id",
	 *     name: [{
	 *       family: "Test",
	 *       given: ["Patient"],
	 *     }],
	 *   },
	 * });
	 * ```
	 *
	 * @group Type Level Interactions
	 */
	public async create<T>(
		opts: CreateOptions<T>,
	): Promise<Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>> {
		return await this.request<T>({
			url: makeUrl([basePath, opts.type]),
			method: "POST",
			body: JSON.stringify(opts.resource),
		});
	}

	/**
	 * The conditional create interaction allows a client to create a new resource only if some equivalent resource does not already exist on the server.
	 * The client defines what equivalence means in this case by supplying a FHIR search query using an HL7 defined extension header `If-None-Exist`.
	 *
	 * The conditional `create` interaction is performed by an HTTP POST command as shown:
	 *
	 * ```
	 * POST [base]/[type]?param1=value&...{&_format=[mime-type]}
	 * ```
	 *
	 * FHIR Reference: https://hl7.org/fhir/http.html#ccreate
	 *
	 * @group Type Level Interactions
	 */
	public async conditionalCreate<T>(
		opts: ConditionalCreateOptions<T>,
	): Promise<Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>> {
		return await this.request<T>({
			url: makeUrl([basePath, opts.type]),
			method: "POST",
			headers: {
				"If-None-Exist": new URLSearchParams(opts.searchParameters).toString(),
			},
			body: JSON.stringify(opts.resource),
		});
	}

	/**
	 * Update an existing resource by its id (or create it if it is new)
	 *
	 * The `update` interaction is performed by an HTTP PUT command as shown:
	 *
	 * ```
	 * PUT [base]/[type]/[id] {?_format=[mime-type]}
	 * ```
	 *
	 * FHIR Reference: https://hl7.org/fhir/http.html#update
	 *
	 * Example usage:
	 *
	 * ```typescript
	 * const result = await client.update<Patient>({
	 *   type: "Patient",
	 *   id: patientId,
	 *   resource: {
	 *     resourceType: "Patient",
	 *     name: [{
	 *       family: "Smith",
	 *       given: ["John"],
	 *     }],
	 *   },
	 * });
	 * ```
	 *
	 * @group Instance Level Interactions
	 */
	public async update<T>(
		opts: UpdateOptions<T>,
	): Promise<Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>> {
		return await this.request<T>({
			url: makeUrl([basePath, opts.type, opts.id]),
			method: "PUT",
			body: JSON.stringify(opts.resource),
		});
	}

	/**
	 * Conditional Update allows a client to update an existing resource based on some identification criteria, rather than by logical id.
	 *
	 * The conditional `update` interaction is performed by an HTTP PUT command as shown:
	 *
	 * ```
	 * PUT [base]/[type]?[search parameters]
	 * ```
	 *
	 * FHIR Reference: https://hl7.org/fhir/http.html#cond-update
	 *
	 * @group Instance Level Interactions
	 */
	public async conditionalUpdate<T>(
		opts: ConditionalUpdateOptions<T>,
	): Promise<Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>> {
		return await this.request<T>({
			url: makeUrl([basePath, opts.type]),
			method: "PUT",
			body: JSON.stringify(opts.resource),
			params: opts.searchParameters,
		});
	}

	/**
	 * Update an existing resource by posting a set of changes to it.
	 *
	 * The `patch` interaction is performed by an HTTP PATCH command as shown:
	 *
	 * ```
	 * PATCH [base]/[type]/[id] {?_format=[mime-type]}
	 * ```
	 *
	 * The body of a PATCH interaction is a JSON Patch icon document with a content type of `application/json-patch+json`.
	 *
	 * FHIR Reference: https://hl7.org/fhir/http.html#patch
	 *
	 * @group Instance Level Interactions
	 */
	public async patch<T>(
		opts: PatchOptions,
	): Promise<Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>> {
		return await this.request<T>({
			url: makeUrl([basePath, opts.type, opts.id]),
			method: "PATCH",
			headers: { "Content-Type": "application/json-patch+json" },
			body: JSON.stringify(opts.patch),
		});
	}

	/**
	 * Conditional Patch performs a search using the standard search facilities for the resource type, with the goal of resolving a single logical id for this request.
	 * The action it takes depends on how many matches are found.
	 *
	 * The conditional `patch` interaction is performed by an HTTP PATCH command as shown:
	 *
	 * ```
	 * PATCH [base]/[type]?param1=value&...{&_format=[mime-type]}
	 * ```
	 *
	 * The body of a PATCH interaction is a JSON Patch icon document with a content type of `application/json-patch+json`.
	 *
	 * FHIR Reference: https://hl7.org/fhir/http.html#cond-patch
	 *
	 * @group Instance Level Interactions
	 */
	public async conditionalPatch<T>(
		opts: ConditionalPatchOptions,
	): Promise<Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>> {
		return await this.request<T>({
			url: makeUrl([basePath, opts.type]),
			method: "PATCH",
			headers: { "Content-Type": "application/json-patch+json" },
			params: opts.searchParameters,
			body: JSON.stringify(opts.patch),
		});
	}

	/**
	 * Delete a resource.
	 *
	 * The interaction is performed by an HTTP DELETE command as shown:
	 *
	 * ```
	 * DELETE [base]/[type]/[id]
	 * ```
	 *
	 * FHIR Reference: https://hl7.org/fhir/http.html#delete
	 *
	 * Example usage:
	 *
	 * ```typescript
	 * const patient = await client.delete<Patient>({
	 *   type: "Patient",
	 *   id: "patient-id",
	 * });
	 * ```
	 *
	 * @group Instance Level Interactions
	 */
	public async delete<T>(
		opts: DeleteOptions,
	): Promise<
		Result<ResourceResponse<T | undefined>, ResourceResponse<TOperationOutcome>>
	> {
		const response = await this.#internalRawRequest({
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
	}

	/**
	 * Delete all historical versions of a resource.
	 *
	 * The interaction is performed by an HTTP DELETE command as shown:
	 *
	 * ```
	 * DELETE [base]/[type]/[id]/_history
	 * ```
	 *
	 * FHIR Reference: https://build.fhir.org/http.html#delete-history
	 *
	 * @group Instance Level Interactions
	 */
	public async deleteHistory<T>(
		opts: DeleteOptions,
	): Promise<Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>> {
		return await this.request<T>({
			url: makeUrl([basePath, opts.type, opts.id, "_history"]),
			method: "DELETE",
		});
	}

	/**
	 * Delete a specific version of a resource.
	 *
	 * The interaction is performed by an HTTP DELETE command as shown:
	 *
	 * ```
	 * DELETE [base]/[type]/[id]/_history/[vid]
	 * ```
	 *
	 * FHIR Reference: https://build.fhir.org/http.html#delete-history-version
	 *
	 * @group Instance Level Interactions
	 */
	public async deleteHistoryVersion<T>(
		opts: DeleteHistoryVersionOptions,
	): Promise<Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>> {
		return await this.request<T>({
			url: makeUrl([basePath, opts.type, opts.id, "_history", opts.vid]),
			method: "DELETE",
		});
	}

	/**
	 * Conditional Delete across all resource types based on some filter criteria
	 *
	 * If type is provided, performs conditional delete across a particular resource type based on some filter criteria.
	 *
	 * To accomplish this, the client issues an HTTP DELETE as shown:
	 *
	 * ```
	 * DELETE [base]/[type]?[search parameters]
	 * DELETE [base]?[search parameters]
	 * ```
	 *
	 * FHIR Reference: https://hl7.org/fhir/http.html#cdelete
	 *
	 * @group Type Level Interactions
	 * @group Whole System Interactions
	 */
	public async conditionalDelete<T>(
		opts: ConditionalDeleteOptions,
	): Promise<Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>> {
		const url = [basePath];
		if (opts.type) url.push(opts.type);

		const requestParams: RequestParams = {
			url: makeUrl(url),
			method: "DELETE",
			params: opts.searchParameters,
		};

		return await this.request<T>(requestParams);
	}

	/**
	 * Retrieve the change history for a particular resource.
	 *
	 * The interaction is performed by an HTTP GET command as shown:
	 *
	 * ```
	 * GET [base]/[type]/[id]/_history{?[parameters]&_format=[mime-type]}
	 * ```
	 *
	 * FHIR Reference: https://hl7.org/fhir/http.html#history
	 *
	 * @group Instance Level Interactions
	 */
	public async historyInstance(
		opts: HistoryInstanceOptions,
	): Promise<
		Result<ResourceResponse<TBundle>, ResourceResponse<TOperationOutcome>>
	> {
		const url = [basePath, opts.type, opts.id, "_history"];

		const requestParams: RequestParams = {
			url: makeUrl(url),
			method: "GET",
		};

		return await this.request<TBundle>(requestParams);
	}

	/**
	 * Retrieve the change history for a particular resource type.
	 *
	 * The interaction is performed by an HTTP GET command as shown:
	 *
	 * ```
	 * GET [base]/[type]/_history{?[parameters]&_format=[mime-type]}
	 * ```
	 *
	 * FHIR Reference: https://hl7.org/fhir/http.html#history
	 *
	 * @group Whole System Interactions
	 */
	public async historySystem(
		_: HistorySystemOptions,
	): Promise<
		Result<ResourceResponse<TBundle>, ResourceResponse<TOperationOutcome>>
	> {
		const url = [basePath, "_history"];

		const requestParams: RequestParams = {
			url: makeUrl(url),
			method: "GET",
		};

		return await this.request<TBundle>(requestParams);
	}

	/**
	 * Retrieve the change history for all resources.
	 *
	 * The interaction is performed by an HTTP GET command as shown:
	 *
	 * ```
	 * GET [base]/_history{?[parameters]&_format=[mime-type]}
	 * ```
	 *
	 * FHIR Reference: https://hl7.org/fhir/http.html#history
	 *
	 * @group Type Level Interactions
	 */
	public async historyType(
		opts: HistoryTypeOptions,
	): Promise<
		Result<ResourceResponse<TBundle>, ResourceResponse<TOperationOutcome>>
	> {
		const url = [basePath, opts.type, "_history"];

		const requestParams: RequestParams = {
			url: makeUrl(url),
			method: "GET",
		};

		return await this.request<TBundle>(requestParams);
	}

	/**
	 * Get a capability statement for the system.
	 *
	 * The interaction is performed by an HTTP GET command as shown:
	 *
	 * ```
	 * GET [base]/metadata{?mode=[mode]} {&_format=[mime-type]}
	 * ```
	 *
	 * The `mode` can be:
	 *
	 * | Mode          | Description                                                                                                                  |
	 * |---------------|------------------------------------------------------------------------------------------------------------------------------|
	 * | `full`        | A `CapabilityStatement` that specifies which resource types and interactions are supported                                   |
	 * | `normative`   | As above, but only the normative portions of the Capability Statement                                                        |
	 * | `terminology` | A `TerminologyCapabilities` resource that provides further information about terminologies which are supported by the server |
	 *
	 * FHIR Reference: https://hl7.org/fhir/http.html#capabilities
	 *
	 * @group Whole System Interactions
	 */
	public async capabilities(
		opts: CapabilitiesOptions,
	): Promise<
		Result<ResourceResponse<unknown>, ResourceResponse<TOperationOutcome>>
	> {
		return await this.request<TBundle>({
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
	}

	/**
	 * Perform multiple operations in a batch request (e.g. create, read, update, delete, patch, and/or [extended operations])
	 *
	 * A batch interaction is performed by an HTTP POST command as shown:
	 *
	 * ```
	 * POST [base] {?_format=[mime-type]}
	 * ```
	 *
	 * FHIR Reference: https://hl7.org/fhir/http.html#transaction
	 *
	 * @group Whole System Interactions
	 */
	public async batch(
		opts: BatchOptions<TBundle>,
	): Promise<
		Result<ResourceResponse<unknown>, ResourceResponse<TOperationOutcome>>
	> {
		return await this.request<unknown>({
			url: makeUrl([basePath]),
			method: "POST",
			params: [["_format", opts.format]],
			body: JSON.stringify(opts.bundle),
		});
	}

	/**
	 * Perform multiple operations as a transaction (e.g. create, read, update, delete, patch, and/or [extended operations])
	 *
	 * A transaction interaction is performed by an HTTP POST command as shown:
	 *
	 * ```
	 * POST [base] {?_format=[mime-type]}
	 * ```
	 *
	 * FHIR Reference: https://hl7.org/fhir/http.html#transaction
	 *
	 * @group Whole System Interactions
	 */
	public async transaction(
		opts: TransactionOptions<TBundle>,
	): Promise<
		Result<ResourceResponse<unknown>, ResourceResponse<TOperationOutcome>>
	> {
		return await this.request<unknown>({
			url: makeUrl([basePath]),
			method: "POST",
			params: [["_format", opts.format]],
			body: JSON.stringify(opts.bundle),
		});
	}

	/**
	 * Perform an operation as defined by an `OperationDefinition`.
	 *
	 * The interaction is performed by an HTTP POST command as shown:
	 *
	 * ```
	 * POST [base]/[type]/[operation] {?_format=[mime-type]}
	 * POST [base]/[type]/[id]/[operation] {?_format=[mime-type]}
	 * ```
	 *
	 * FHIR Reference: https://hl7.org/fhir/operations.html
	 *
	 * @group Operations
	 */
	public async operation<TResource, TResult>(
		opts: OperationOptions<TResource>,
	): Promise<
		Result<ResourceResponse<TResult>, ResourceResponse<TOperationOutcome>>
	> {
		const url = [basePath, opts.type];
		if (opts.id) url.push(opts.id);
		url.push(opts.operation);

		const requestParams: RequestParams = {
			url: makeUrl(url),
			method: "POST",
		};

		if (opts.resource) requestParams.body = JSON.stringify(opts.resource);

		return await this.request(requestParams);
	}

	/**
	 * Perform the Validate Operation.
	 *
	 * The interaction is performed by an HTTP POST command as shown:
	 *
	 * ```
	 * [base]/[type]/$validate
	 * [base]/[type]/[id]/$validate
	 * ```
	 *
	 * FHIR Reference: https://hl7.org/fhir/operation-resource-validate.html
	 *
	 * @group Operations
	 */
	public async validate<T>(
		opts: ValidateOptions<T>,
	): Promise<
		Result<
			ResourceResponse<TOperationOutcome>,
			ResourceResponse<TOperationOutcome>
		>
	> {
		return await this.operation<T, TOperationOutcome>({
			operation: "$validate",
			...opts,
		});
	}

	/**
	 * Performs a request to `/auth/userinfo`.
	 *
	 * @group Aidbox methods
	 */
	public async userinfo(): Promise<TUser> {
		const user = await this.rawRequest({
			url: "/auth/userinfo",
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
		}).then((response) => coerceBody<TUser>(response));

		return user;
	}

	/**
	 * Performs a request to `/auth/logout`.
	 *
	 * @group Aidbox methods
	 */
	public async logout() {
		return (
			await this.rawRequest({
				url: "/auth/logout",
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
			})
		).response;
	}

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
	 *
	 * @group Client methods
	 */
	public async request<T>(
		params: RequestParams,
	): Promise<Result<ResourceResponse<T>, ResourceResponse<TOperationOutcome>>> {
		const response = await this.#internalRawRequest(params);

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
	}

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
	 *
	 * @group Client methods
	 */
	public async rawRequest(
		requestParams: RequestParams,
	): Promise<ResponseWithMeta> {
		const result = await this.#internalRawRequest(requestParams);

		if (isInternalErrorResponse(result)) throw result.error;

		if (!result.response.ok)
			throw new ErrorResponse(
				`HTTP ${result.response.status}: ${result.response.statusText}`,
				result,
			);

		return result;
	}

	/**
	 * Obtain server's base URL.
	 *
	 * @group Client methods
	 */
	public getBaseUrl(): string {
		return this.baseUrl;
	}
}
