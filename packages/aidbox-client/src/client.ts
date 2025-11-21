import Cookies from "js-cookie";
import type { Bundle, OperationOutcome } from "./fhir-types/hl7-fhir-r4-core";
import type {
	AidboxClientParams,
	AidboxRawResponse,
	AidboxRequestParams,
	AidboxResponse,
	User,
} from "./types";
import { AidboxClientError, AidboxErrorResponse } from "./types";
import { coerceBody } from "./utils";

export type AidboxClient<
	TBundle = Bundle,
	TOperationOutcome = OperationOutcome,
	TUser = User,
> = {
	getBaseURL: () => string;
	rawRequest: (params: AidboxRequestParams) => Promise<AidboxRawResponse>;
	request: <T>(
		params: AidboxRequestParams,
	) => Promise<AidboxResponse<T | TOperationOutcome>>;
	fetchUIHistory: () => Promise<TBundle>;
	performLogout: () => Promise<Response>;
	fetchUserInfo: () => Promise<TUser>;
};

type InternalAidboxErrorResponse = {
	error?: unknown;
	duration: number;
	request: AidboxRequestParams;
};

const isInternalErrorResponse = (
	resp: InternalAidboxErrorResponse | AidboxRawResponse,
): resp is InternalAidboxErrorResponse => {
	return "error" in resp;
};

export function makeClient<TBundle, TOperationOutcome, TUser>({
	baseurl,
	onResponse = undefined,
}: AidboxClientParams): AidboxClient<TBundle, TOperationOutcome, TUser> {
	const getBaseURL = (): string => {
		return baseurl;
	};

	const internalRawRequest = async (
		requestParams: AidboxRequestParams,
	): Promise<AidboxRawResponse | InternalAidboxErrorResponse> => {
		const startTime = Date.now();
		const baseURL = getBaseURL();

		if (!requestParams.url.startsWith("/"))
			return {
				error: new AidboxClientError("url must start with a forward slash", {
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
			const response = await fetch(urlObj.toString(), {
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
				error: new AidboxClientError(
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
		requestParams: AidboxRequestParams,
	): Promise<AidboxRawResponse> => {
		const result = await internalRawRequest(requestParams);

		if (isInternalErrorResponse(result)) throw result.error;

		if (onResponse) onResponse(result.response.clone());

		if (!result.response.ok)
			throw new AidboxErrorResponse(
				`HTTP ${result.response.status}: ${result.response.statusText}`,
				result,
			);

		return result;
	};

	const request = async <T>(
		params: AidboxRequestParams,
	): Promise<AidboxResponse<T | TOperationOutcome>> => {
		const result = await internalRawRequest(params);

		if (isInternalErrorResponse(result)) throw result.error;

		if (onResponse) onResponse(result.response.clone());

		const body = await coerceBody<T | TOperationOutcome>(result);

		const response = {
			...result,
			responseBody: body,
		};

		if (!result.response.ok) {
			if ((body as OperationOutcome).resourceType === "OperationOutcome")
				return response;

			throw new AidboxErrorResponse(
				`HTTP ${result.response.status}: ${result.response.statusText}`,
				result,
			);
		}

		return response;
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
		return await rawRequest({
			url: "/auth/logout",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
		}).then(({ response }: AidboxRawResponse) => {
			Cookies.remove("asid", { path: "/" });
			return response;
		});
	};

	const fetchUIHistory = async (): Promise<TBundle> => {
		const history = await rawRequest({
			method: "GET",
			url: "/fhir/ui_history",
			params: [
				[".type", "http"],
				["_sort", "-_lastUpdated"],
				["_count", "100"],
			],
		}).then((response) => coerceBody<TBundle>(response));

		return history;
	};

	return {
		getBaseURL,
		rawRequest,
		request,
		fetchUIHistory,
		performLogout,
		fetchUserInfo,
	};
}
