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
import { AidboxBodyCoersionError, AidboxClientError } from "./types";

export type AidboxClient = {
	getAidboxBaseURL: () => string;
	aidboxRawRequest: (params: AidboxRequestParams) => Promise<AidboxRawResponse>;
	aidboxRequest: <T>(params: AidboxRequestParams) => Promise<AidboxResponse<T>>;
	fetchUIHistory: () => Promise<Bundle | OperationOutcome>;
	performLogout: () => Promise<Response>;
	fetchUserInfo: () => Promise<UserInfo>;
};

export function makeClient(params: AidboxClientParams): AidboxClient {
	const baseurl = params.baseurl;

	const getAidboxBaseURL = (): string => {
		return baseurl;
	};

	const aidboxRawRequest = async ({
		method,
		url,
		headers = {},
		params = [],
		body,
	}: AidboxRequestParams): Promise<AidboxRawResponse> => {
		const startTime = Date.now();
		const baseURL = getAidboxBaseURL();

		if (!url.startsWith("/"))
			throw new Error("url must start with forward slash");

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

		const result: AidboxRawResponse = {
			response,
			responseHeaders,
			duration: Date.now() - startTime,
			request: {
				method,
				url,
				params,
				headers: requestHeaders,
				body: body || "",
			},
		};

		if (!response.ok) {
			if (response.status === 401 || response.status === 403) {
				const encodedLocation = btoa(window.location.href);
				window.location.href = `${baseURL}/auth/login?redirect_to=${encodedLocation}`;
				throw new AidboxClientError("Authentication required", result);
			}

			throw new AidboxClientError(
				`HTTP ${response.status}: ${response.statusText}`,
				result,
			);
		}

		return result;
	};

	const normalizeContentType = (contentType: string) => {
		const semicolon = contentType.indexOf(";");
		if (semicolon !== -1) {
			return contentType.substring(0, semicolon).toLowerCase();
		} else {
			return contentType.toLowerCase();
		}
	};

	const coerceBody = async (
		response: Response,
		contentType: string,
	): Promise<unknown> => {
		let body: string | undefined;
		try {
			body = await response.text();
			switch (normalizeContentType(contentType)) {
				case "application/json":
				case "application/fhir+json":
					return JSON.parse(body);
				case "text/yaml":
					return YAML.parse(body);
			}
		} catch (e) {
			let message: string;
			if (e instanceof Error) {
				message = e.message;
			} else {
				message = "unknown error";
			}
			throw new AidboxBodyCoersionError(`failed to coerce body: ${message}`, {
				contentType,
				body,
			});
		}
		// default:
		throw new AidboxBodyCoersionError(
			`failed to coerce body: unknown content-type ${contentType}`,
			{ contentType, body },
		);
	};

	const aidboxRequest = async <T>(
		params: AidboxRequestParams,
	): Promise<AidboxResponse<T | OperationOutcome>> => {
		try {
			const response: AidboxRawResponse = await aidboxRawRequest(params);

			const contentType = response.responseHeaders["content-type"];
			if (!contentType)
				throw Error("server didn't specify response content-type");

			const body = (await coerceBody(response.response, contentType)) as T;

			return {
				...response,
				response: {
					...response.response,
					body,
				},
			};
		} catch (e) {
			if (e instanceof AidboxClientError) {
				const cause = e.cause as AidboxRawResponse;
				const responseCopy = cause.response.clone(); // rethrown if body is not an OperationOutcome

				const contentType = cause.responseHeaders["content-type"];
				if (!contentType)
					throw Error("server didn't specify response content-type");

				// consumes original response body stream
				const body = await coerceBody(cause.response, contentType);

				if ((body as OperationOutcome).resourceType === "OperationOutcome") {
					return {
						...cause,
						response: {
							...cause.response,
							body: body as OperationOutcome,
						},
					};
				} else {
					throw new AidboxClientError(e.message, {
						...cause,
						// cloned response still has its body as a stream
						response: responseCopy,
					});
				}
			}
			throw e;
		}
	};

	const fetchUserInfo = async (): Promise<UserInfo> => {
		const response = await fetch(`${getAidboxBaseURL()}/auth/userinfo`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
		});

		if (!response.ok) {
			const encodedLocation = btoa(window.location.href);
			window.location.href = `${getAidboxBaseURL()}/auth/login?redirect_to=${encodedLocation}`;
		}

		return response.json();
	};

	const performLogout = async () => {
		const response = await fetch(`${getAidboxBaseURL()}/auth/logout`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
		});

		Cookies.remove("asid", { path: "/" });

		const encodedLocation = btoa(window.location.href);
		window.location.href = `${getAidboxBaseURL()}/auth/login?redirect_to=${encodedLocation}`;

		return response;
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
		}).then((response: AidboxResponse<Bundle>) => {
			return response.response.body;
		});

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
