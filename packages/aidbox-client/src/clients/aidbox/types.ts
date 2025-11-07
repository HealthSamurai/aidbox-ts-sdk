export interface ClientParams {
	basepath: string;
}

export interface UIHistoryResource {
	id: string;
	command: string;
	meta: {
		createdAt: string;
	};
}

export interface UIHistoryEntry {
	resource: UIHistoryResource;
}

export interface UIHistoryResponse {
	resourceType: "Bundle";
	type: "searchset";
	total: number;
	entry: UIHistoryEntry[];
}

export interface UserInfo {
	id: string;
	email?: string;
}

export interface AidboxRequestParams {
	method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
	url: string;
	headers?: Record<string, string>;
	params?: [string, string][];
	body?: string;
	streamBody?: boolean;
}

export type AidboxRawResponse = {
	response: Response;
	responseHeaders: Record<string, string>;
	duration: number;
	request: {
		method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
		url: string;
		headers?: Record<string, string>;
		params?: [string, string][];
		body?: string;
	};
};

export type AidboxResponse<T> = Omit<AidboxRawResponse, "response"> & {
	response: Omit<Response, "body"> & {
		body: T | OperationOutcome;
	};
};

export type OperationOutcome = {
	resourceType: string;
};
