import type { Parameters } from "./types";

export type ReadOptions = {
	type: string;
	id: string;
};

export type VReadOptions = ReadOptions & {
	vid: string;
};

export type SearchTypeOptions = {
	type: string;
	query: Parameters;
};

export type SearchSystemOptions = {
	query: Parameters;
};

export type SearchCompartmentOptions = {
	query: Parameters;
	type: string;
	compartment: string;
	compartmentId: string;
};

export type CreateOptions = {
	type: string;
	resource: object;
};

export type ConditionalCreateOptions = {
	type: string;
	resource: object;
	searchParameters: Parameters;
};

export type UpdateOptions = {
	type: string;
	resource: object;
	id: string;
};

export type ConditionalUpdateOptions = {
	type: string;
	resource: object;
	searchParameters: Parameters;
};

export type PatchOptions = {
	type: string;
	id: string;
	patch: object;
};

export type ConditionalPatchOptions = {
	type: string;
	searchParameters: Parameters;
	patch: object;
};

export type DeleteOptions = {
	type: string;
	id: string;
};

export type ConditionalDeleteOptions = {
	type?: string;
	searchParameters: Parameters;
};

export type DeleteHistoryVersionOptions = {
	type: string;
	id: string;
	vid: string;
};

export type HistoryInstanceOptions = {
	type: string;
	id: string;
};

export type HistoryTypeOptions = {
	type: string;
};

export type HistorySystemOptions = Record<string, never>;

export type OperationOptions = {
	type: string;
	id?: string;
	operation: "$run" | "$validate";
	resource: object;
};

export type ValidateOptions = Omit<OperationOptions, "operation">;

export type CapabilitiesOptions = {
	mode: "full" | "normative" | "terminology";
};

type Bundle = Record<string, unknown>;

export type BatchOptions = {
	format: string;
	bundle: Bundle & {
		type: "batch";
	};
};

export type TransactionOptions = {
	format: string;
	bundle: Bundle & {
		type: "transaction";
	};
};
