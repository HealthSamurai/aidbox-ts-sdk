import type { ServerOptions } from "@atomic-ehr/fhirpath-lsp";
import type { Resource } from "./messages";

export function wrapCache(opts: ServerOptions): ServerOptions {
	let db: IDBDatabase | undefined;
	let dbErrorReported = false;

	const canonicalByUrlStore = "canonicalByUrl";
	const canonicalsByKindStore = "canonicalsByKind";

	const req = self.indexedDB.open("aidbox-fhirpath-lsp-cache", 2);
	req.onerror = (ev) => {
		console.error(ev);
		console.error(
			"Could not open IndexedDB database. Falling back to direct requests.",
		);
		db = undefined;
	};
	req.onsuccess = (_ev) => {
		const resDb = req.result;
		db = resDb;

		resDb.onversionchange = (_ev) => {
			console.log("DB version changed. Closing the database.");
			resDb.close();
			db = undefined;
		};
	};
	req.onupgradeneeded = (_ev) => {
		const resDb = req.result;
		try {
			resDb.deleteObjectStore(canonicalByUrlStore);
		} catch {}
		try {
			resDb.deleteObjectStore(canonicalsByKindStore);
		} catch {}
		resDb.createObjectStore(canonicalByUrlStore);
		resDb.createObjectStore(canonicalsByKindStore);
		db = resDb;
	};
	req.onblocked = (ev) => {
		console.error(ev);
		console.log("DB is blocked");
		db = undefined;
	};

	const reportDbUnavailable = (msg?: string) => {
		if (dbErrorReported === false) {
			console.error(msg ?? "Indexed DB unavailable");
			dbErrorReported = true;
		}
	};

	const tryCache = <T>(store: string, key: string): Promise<T | undefined> => {
		if (db === undefined) {
			return Promise.resolve(undefined);
		}

		return new Promise<T | undefined>((resolve, reject) => {
			if (db === undefined) {
				reportDbUnavailable();
				reject("DB closed.");
				return;
			}

			const transaction = db.transaction(store, "readonly");
			const objectStore = transaction.objectStore(store);
			const request = objectStore.get(key);
			request.onsuccess = (_ev) => {
				if (request.result === undefined) {
					resolve(undefined);
					return;
				}
				resolve(request.result as T);
			};
			request.onerror = (ev) => {
				reject(ev);
			};
		});
	};

	const updateCache = <T>(
		store: string,
		value: T,
		key?: string,
	): Promise<boolean> => {
		if (db === undefined) {
			reportDbUnavailable();
			return Promise.resolve(false);
		}

		return new Promise<boolean>((resolve, reject) => {
			if (db === undefined) {
				reportDbUnavailable();
				reject(false);
				return;
			}

			const transaction = db.transaction(store, "readwrite");
			const objectStore = transaction.objectStore(store);
			const request = objectStore.put(value, key);
			request.onsuccess = (_ev) => {
				resolve(true);
			};
			request.onerror = (ev) => {
				console.error(ev);
				console.error("Could not update cached value");
				reject(false);
			};
		});
	};

	const resolve = async (typeName: string): Promise<Resource | null> => {
		let value: Resource | undefined;
		try {
			value = await tryCache<Resource>(canonicalByUrlStore, typeName);
		} catch (e) {
			console.error(e);
			console.error("Error checking for cached canonical by URL");
			value = undefined;
		}

		if (value !== undefined) {
			return value;
		}

		const newValue = await opts.resolve(typeName);

		if (newValue === null) {
			return newValue;
		}

		value = newValue;

		try {
			await updateCache(canonicalByUrlStore, value, typeName);
		} catch (e) {
			console.error(e);
			console.error("Error updating cached canonical");
		}

		return value;
	};

	const search = async (
		kind: "primitive-type" | "complex-type" | "resource",
	): Promise<Resource[]> => {
		let value: Resource[] | undefined;
		try {
			value = await tryCache<Resource[]>(canonicalsByKindStore, kind);
		} catch (e) {
			console.error(e);
			console.error("Error checking cached canonicals by type");
			value = undefined;
		}

		if (value !== undefined) {
			return value ?? [];
		}

		value = await opts.search(kind);

		try {
			await updateCache(canonicalsByKindStore, value, kind);
		} catch (e) {
			console.error(e);
			console.error("Error updating cached canonicals by type");
		}

		return value;
	};

	return { ...opts, search: search, resolve: resolve };
}
