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
	getAidboxBaseURL: () => string;
	aidboxRawRequest: (params: AidboxRequestParams) => Promise<AidboxRawResponse>;
	aidboxRequest: <T>(
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
	return (resp as InternalAidboxErrorResponse).error !== undefined;
};

export function makeClient<TBundle, TOperationOutcome, TUser>({
	baseurl,
	onRawResponseHook = (resp) => resp,
}: AidboxClientParams): AidboxClient<TBundle, TOperationOutcome, TUser> {
	const getAidboxBaseURL = (): string => {
		return baseurl;
	};

	const internalAidboxRawRequest = async (
		requestParams: AidboxRequestParams,
	): Promise<AidboxRawResponse | InternalAidboxErrorResponse> => {
		const startTime = Date.now();
		const baseURL = getAidboxBaseURL();

		if (!requestParams.url.startsWith("/"))
			return {
				error: new AidboxClientError("url must start with a forward slash"),
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
			body: body || "",
		};

		try {
			const response = await fetch(urlObj.toString(), {
				method,
				headers: requestHeaders,
				body: body || null,
				credentials: "include",
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
				error: e,
				duration: Date.now() - startTime,
				request,
			};
		}
	};

	const aidboxRawRequest = async (
		requestParams: AidboxRequestParams,
	): Promise<AidboxRawResponse> => {
		const result = await internalAidboxRawRequest(requestParams);

		if (isInternalErrorResponse(result)) throw result.error;

		const hookResult = onRawResponseHook(result);

		if (hookResult.response.status < 200 || hookResult.response.status > 299)
			throw new AidboxErrorResponse(
				`HTTP ${result.response.status}: ${result.response.statusText}`,
				hookResult,
			);

		return hookResult;
	};

	const aidboxRequest = async <T>(
		params: AidboxRequestParams,
	): Promise<AidboxResponse<T | TOperationOutcome>> => {
		const result = await internalAidboxRawRequest(params);

		if (isInternalErrorResponse(result)) throw result.error;

		const hookResult = onRawResponseHook(result);

		const responseCopy = hookResult.response.clone(); // rethrown if body is not an OperationOutcome
		const body = await coerceBody<T | TOperationOutcome>(hookResult);

		if (hookResult.response.status < 200 || hookResult.response.status > 299) {
			if ((body as OperationOutcome).resourceType === "OperationOutcome")
				return {
					...hookResult,
					response: {
						...hookResult.response,
						body: body,
					},
				};

			throw new AidboxErrorResponse(
				`HTTP ${hookResult.response.status}: ${hookResult.response.statusText}`,
				{
					...hookResult,
					response: responseCopy,
				},
			);
		}

		return {
			...hookResult,
			response: {
				...hookResult.response,
				body,
			},
		};
	};

	const fetchUserInfo = async (): Promise<TUser> => {
		const user = await aidboxRawRequest({
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
		return await aidboxRawRequest({
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
		const history = await aidboxRawRequest({
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
		getAidboxBaseURL,
		aidboxRawRequest,
		aidboxRequest,
		fetchUIHistory,
		performLogout,
		fetchUserInfo,
	};
}
