export type Resource = {
	[key: string]: unknown;
	url?: string;
	version?: string;
	id: string;
	resourceType: string;
};

export type MsgStart = {
	type: "start";
	port: MessagePort;
	contextType?: string | undefined;
};

export type MsgSetContextType = {
	type: "setContextType";
	contextType: string | null;
};

export type MsgStarted = {
	type: "started";
};

export type MsgResolveRequest = {
	type: "resolveRequest";
	canonicalUrl: string;
};

export type MsgResolveResponse = {
	type: "resolveResponse";
	resource: Resource | null;
};

export type MsgResolveError = {
	type: "resolveError";
};

export type MsgSearchRequest = {
	type: "searchRequest";
	kind: "primitive-type" | "complex-type" | "resource";
};

export type MsgSearchResponse = {
	type: "searchResponse";
	resources: Resource[] | null;
};

export type MsgSearchError = {
	type: "searchError";
};

export type RequestMsg = MsgResolveRequest | MsgSearchRequest;
export type ResponseMsg = MsgResolveResponse | MsgSearchResponse;
export type ErrorMsg = MsgResolveError | MsgSearchError;
export type ControlMsg = MsgStart | MsgStarted | MsgSetContextType;

export type Msg = RequestMsg | ResponseMsg | ControlMsg;

export type NumberedMsg = (RequestMsg | ResponseMsg | ErrorMsg) & {
	id: number;
};
export type WireMsg = ControlMsg | NumberedMsg;
