export type ReadOptions = {
	type: string;
	id: string;
};

export type VReadOptions = ReadOptions & {
	vid: string;
};

export type SearchOptions = {
	type: string;
	query?: string;
};

export type CreateOptions = {
	type: string;
	resource: object;
};

export type UpdateOptions = CreateOptions & {
	id: string;
};

export type PatchOptions = Omit<UpdateOptions, "resource"> & {
	patch: object;
};

export type DeleteOptions = Omit<UpdateOptions, "resource">;

export type HistoryOptions = {
	type?: string;
	id?: string;
};

export type OperationOptions = {
	type: string;
	id?: string;
	operation: "$run" | "$validate";
	resource: object;
};

export type ValidateOptions = Omit<OperationOptions, "operation">;
