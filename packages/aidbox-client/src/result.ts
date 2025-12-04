export type Ok<T> = {
	ok: true;
	value: T;
	/**
	 * Check if `Result` is `Ok`.
	 */
	isOk: () => this is Ok<T>;
	/**
	 * Check if `Result` is `Err`.
	 */
	isErr: () => this is Err<never>;
	/**
	 * Map Result's success `value` to a new value by providing a transformation function.
	 *
	 * Returns a new `Result<UpdatedType, ErrorType>`:
	 *
	 * ```typescript
	 * const x = Ok<number>(42); // Result<number, never>
	 * const y = x.map<string>((x: number) => x.toString()) // Result<string, never>
	 * ```
	 *
	 * Does nothing if the `Result` is not `Ok`:
	 *
	 * ```typescript
	 * const x = Err<number>(42); // Result<never, number>
	 * const y = x.map<string>((x: number) => x.toString()) // Result<never, number>
	 * ```
	 */
	map: <U>(f: (value: T) => U) => Result<U, never>;
	/**
	 * Map Result's error `value` to a new value by providing a transformation function.
	 *
	 * Returns a new `Result<SuccessType, NewErrorType>`:
	 *
	 * ```typescript
	 * const x = Err<number>(42); // Result<never, number>
	 * const y = x.mapErr<string>((x: number) => x.toString()) // Result<never, string>
	 * ```
	 *
	 * Does nothing if the `Result` is not `Err`:
	 *
	 * ```typescript
	 * const x = Ok<number>(42); // Result<number, never>
	 * const y = x.mapErr<string>((x: number) => x.toString()) // Result<number, never>
	 * ```
	 */
	mapErr: <U>(f: (value: never) => U) => Result<T, never>;
};

export type Err<E> = {
	ok: false;
	value: E;
	/**
	 * Check if `Result` is `Ok`.
	 */
	isOk: () => this is Ok<never>;
	/**
	 * Check if `Result` is `Err`.
	 */
	isErr: () => this is Err<E>;
	/**
	 * Map Result's success `value` to a new value by providing a transformation function.
	 *
	 * Returns a new `Result<UpdatedType, ErrorType>`:
	 *
	 * ```typescript
	 * const x = Ok<number>(42); // Result<number, never>
	 * const y = x.map<string>((x: number) => x.toString()) // Result<string, never>
	 * ```
	 *
	 * Does nothing if the `Result` is not `Ok`:
	 *
	 * ```typescript
	 * const x = Err<number>(42); // Result<never, number>
	 * const y = x.map<string>((x: number) => x.toString()) // Result<never, number>
	 * ```
	 */
	map: <U>(f: (value: never) => U) => Result<never, E>;
	/**
	 * Map Result's error `value` to a new value by providing a transformation function.
	 *
	 * Returns a new `Result<SuccessType, NewErrorType>`:
	 *
	 * ```typescript
	 * const x = Err<number>(42); // Result<never, number>
	 * const y = x.mapErr<string>((x: number) => x.toString()) // Result<never, string>
	 * ```
	 *
	 * Does nothing if the `Result` is not `Err`:
	 *
	 * ```typescript
	 * const x = Ok<number>(42); // Result<number, never>
	 * const y = x.mapErr<string>((x: number) => x.toString()) // Result<number, never>
	 * ```
	 */
	mapErr: <U>(f: (value: E) => U) => Result<never, U>;
};

/**
 * A classic `Result` type that can either be `Ok` or `Err`.
 *
 * `Result` wraps a value under the `value` field, and provides convenience methods for checking if `Result` is `Ok` or `Err`:
 *
 * ```typescript
 * const answer: Result<number, never> = Ok(42);
 *
 * answer.isOk(); // => true
 * answer.isErr(); // => false
 * ```
 *
 * If the function returns a compatible `Result` type, instead of unwrapping the result, and wrapping it back, `map` and `mapErr` methods can be used:
 *
 * ```typescript
 * function someFunctionA(x: number): Result<number, string> {
 *   if (0 === x % 2)
 *     return Err("number was even");
 *   return Ok(x);
 * }
 *
 * function someFunctionB(num: number): Result<number, string> {
 *     return someFunctionA(num).map((x) => x + 1);
 * }
 * ```
 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Constructs the `Ok<T>` variant of `Result<T, never>`.
 */
export const Ok = <T>(value: T): Result<T, never> => ({
	ok: true,
	value,
	isOk: (): this is Ok<T> => true,
	isErr: (): this is Err<never> => false,
	map: <U>(f: (value: T) => U): Result<U, never> => Ok(f(value)),
	mapErr: <U>(_f: (value: never) => U) => Ok(value),
});

/**
 * Constructs the `Err<E>` variant of `Result<never, E>`.
 */
export const Err = <E>(error: E): Result<never, E> => ({
	ok: false,
	value: error,
	isOk: (): this is Ok<never> => false,
	isErr: (): this is Err<E> => true,
	map: <U>(_f: (value: never) => U) => Err(error),
	mapErr: <U>(f: (value: E) => U): Result<never, U> => Err(f(error)),
});
