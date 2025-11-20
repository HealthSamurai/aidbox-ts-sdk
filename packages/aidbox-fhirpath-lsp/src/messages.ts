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

export type MsgSearchRequest = {
	type: "searchRequest";
	kind: "primitive-type" | "complex-type" | "resource";
};

export type MsgSearchResponse = {
	type: "searchResponse";
	resources: Resource[] | null;
};

export type RequestMsg = MsgResolveRequest | MsgSearchRequest;
export type ResponseMsg = MsgResolveResponse | MsgSearchResponse;
export type ControlMsg = MsgStart | MsgStarted;

export type Msg = RequestMsg | ResponseMsg | ControlMsg;

export type NumberedMsg = (RequestMsg | ResponseMsg) & { id: number };
export type WireMsg = ControlMsg | NumberedMsg;
