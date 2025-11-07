import { Err, Ok } from "src/result";
import { describe, expect, it } from "vitest";

describe("Result type", () => {
	describe("Ok", () => {
		it("should not be err", () => {
			const result = Ok(42);
			expect(result.isOk()).toBe(true);
			expect(result.isErr()).toBe(false);
			if (result.isOk()) expect(result.value).toBe(42);
		});
		it("should map", () => {
			const result = Ok(26);
			const newResult = result.map((x) => x + 1);
			expect(newResult.isOk()).toBe(true);
			expect(newResult.isErr()).toBe(false);
			if (newResult.isOk()) expect(newResult.value).toBe(27);
			expect(result.isOk()).toBe(true);
			if (result.isOk()) expect(result.value).toBe(26);
		});
		it("should not mapErr", () => {
			const result = Ok("baz");
			const newResult = result.mapErr((x) => `${x}quz`);
			expect(newResult.isOk()).toBe(true);
			expect(newResult.isErr()).toBe(false);
			if (newResult.isOk()) expect(newResult.value).toBe("baz");
			expect(result.isOk()).toBe(true);
			if (result.isOk()) expect(result.value).toBe("baz");
		});
	});
	describe("Err", () => {
		it("should not be ok", () => {
			const result = Err(42);
			expect(result.isOk()).toBe(false);
			expect(result.isErr()).toBe(true);
			if (result.isErr()) expect(result.value).toBe(42);
		});
		it("should not map", () => {
			const result = Err(26);
			const newResult = result.map((x) => x + 1);
			expect(newResult.isOk()).toBe(false);
			expect(newResult.isErr()).toBe(true);
			if (newResult.isErr()) expect(newResult.value).toBe(26);
			expect(result.isErr()).toBe(true);
			if (result.isErr()) expect(result.value).toBe(26);
		});
		it("should mapErr", () => {
			const result = Err("foo");
			const newResult = result.mapErr((x) => `${x}bar`);
			expect(newResult.isOk()).toBe(false);
			expect(newResult.isErr()).toBe(true);
			if (newResult.isErr()) expect(newResult.value).toBe("foobar");
			expect(result.isErr()).toBe(true);
			if (result.isErr()) expect(result.value).toBe("foo");
		});
	});
});
