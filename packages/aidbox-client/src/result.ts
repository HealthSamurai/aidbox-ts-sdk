type Ok<T> = {
	ok: true;
	value: T;
	isOk: () => this is Ok<T>;
	isErr: () => this is Err<never>;
	map: <U>(f: (value: T) => U) => Result<U, never>;
	mapErr: <U>(f: (value: never) => U) => Result<T, never>;
};

type Err<E> = {
	ok: false;
	value: E;
	isOk: () => this is Ok<never>;
	isErr: () => this is Err<E>;
	map: <U>(f: (value: never) => U) => Result<never, E>;
	mapErr: <U>(f: (value: E) => U) => Result<never, U>;
};

export type Result<T, E> = Ok<T> | Err<E>;

export const Ok = <T>(value: T): Result<T, never> => ({
	ok: true,
	value,
	isOk: (): this is Ok<T> => true,
	isErr: (): this is Err<never> => false,
	map: <U>(f: (value: T) => U): Result<U, never> => Ok(f(value)),
	mapErr: <U>(_f: (value: never) => U) => Ok(value),
});

export const Err = <E>(error: E): Result<never, E> => ({
	ok: false,
	value: error,
	isOk: (): this is Ok<never> => false,
	isErr: (): this is Err<E> => true,
	map: <U>(_f: (value: never) => U) => Err(error),
	mapErr: <U>(f: (value: E) => U): Result<never, U> => Err(f(error)),
});
