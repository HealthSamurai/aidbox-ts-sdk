import type { Bundle, OperationOutcome } from "@fhir-types/hl7-fhir-r4-core";
import Cookies from "js-cookie";
import YAML from "yaml";
import type {
	AidboxClientParams,
	AidboxRawResponse,
	AidboxRequestParams,
	AidboxResponse,
	UserInfo,
} from "./types";
import { AidboxClientError } from "./types";

export type AidboxClient = {
	getAidboxBaseURL: () => string;
	aidboxRawRequest: (params: AidboxRequestParams) => Promise<AidboxRawResponse>;
	aidboxRequest: <T>(
		params: AidboxRequestParams,
	) => Promise<AidboxResponse<T | OperationOutcome>>;
	fetchUIHistory: () => Promise<Bundle | OperationOutcome>;
	performLogout: () => Promise<Response>;
	fetchUserInfo: () => Promise<UserInfo>;
};

type InternalAidboxErrorResponse = {
	error?: unknown;
	duration: number;
	request: AidboxRequestParams;
};

export function makeClient({
	baseurl,
	onRawResponseHook = (resp) => resp,
}: AidboxClientParams): AidboxClient {
	const getAidboxBaseURL = (): string => {
		return baseurl;
	};

	const isInternalErrorResponse = (
		resp: InternalAidboxErrorResponse | AidboxRawResponse,
	): resp is InternalAidboxErrorResponse => {
		return (resp as InternalAidboxErrorResponse).error !== undefined;
	};

	const internalAidboxRawRequest = async (
		requestParams: AidboxRequestParams,
	): Promise<AidboxRawResponse | InternalAidboxErrorResponse> => {
		const startTime = Date.now();
		const baseURL = getAidboxBaseURL();

		if (!requestParams.url.startsWith("/"))
			return {
				error: new Error("url must start with forward slash"),
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
			throw new AidboxClientError(
				`HTTP ${result.response.status}: ${result.response.statusText}`,
				hookResult,
			);

		return hookResult;
	};

	const normalizeContentType = (contentType: string) => {
		const semicolon = contentType.indexOf(";");
		if (semicolon !== -1) {
			return contentType.substring(0, semicolon).toLowerCase();
		} else {
			return contentType.toLowerCase();
		}
	};

	const coerceBody = async <T>(resp: AidboxRawResponse): Promise<T> => {
		const response = resp.response;
		const contentType = resp.responseHeaders["content-type"];
		if (!contentType)
			throw new AidboxClientError(
				"server didn't specify response content-type",
				resp,
			);

		const responseCopy = response.clone(); // thrown if unable to parse body

		try {
			switch (normalizeContentType(contentType)) {
				case "application/json":
				case "application/fhir+json":
					return await response.json();
				case "text/yaml":
					return YAML.parse(await response.text());
			}
		} catch (e) {
			const message: string = e instanceof Error ? e.message : "unknown error";
			throw new AidboxClientError(`failed to coerce body: ${message}`, {
				...resp,
				// cloned response still has its body as a stream
				response: responseCopy,
			});
		}
		// default:
		throw new AidboxClientError(
			`failed to coerce body: unknown content-type ${contentType}`,
			resp,
		);
	};

	const aidboxRequest = async <T>(
		params: AidboxRequestParams,
	): Promise<AidboxResponse<T | OperationOutcome>> => {
		const result = await internalAidboxRawRequest(params);

		if (isInternalErrorResponse(result)) throw result.error;

		const hookResult = onRawResponseHook(result);

		const responseCopy = hookResult.response.clone(); // rethrown if body is not an OperationOutcome
		const body = await coerceBody<T | OperationOutcome>(hookResult);

		if (hookResult.response.status < 200 || hookResult.response.status > 299) {
			if ((body as OperationOutcome).resourceType === "OperationOutcome")
				return {
					...hookResult,
					response: {
						...hookResult.response,
						body: body,
					},
				};

			throw new AidboxClientError(
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

	const fetchUserInfo = async (): Promise<UserInfo> => {
		const response = await aidboxRawRequest({
			url: "/auth/userinfo",
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
		}).then(({ response }: AidboxRawResponse) => response.json());

		return response;
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

	const fetchUIHistory = async (): Promise<Bundle | OperationOutcome> => {
		const response = await aidboxRequest<Bundle>({
			method: "GET",
			url: "/ui_history",
			params: [
				[".type", "http"],
				["_sort", "-_lastUpdated"],
				["_count", "100"],
			],
		}).then(
			({ response }: AidboxResponse<Bundle | OperationOutcome>) =>
				response.body,
		);

		return response;
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
