import { describe, it, expect } from "vitest";
import { autoIncrement, agOptions } from "../scripts/mapping/auto-increment.js";

describe("autoIncrement", () => {
    it("2 AG, rayon non augmenté → rayon 1, delta 1", () => {
        expect(autoIncrement(2, false)).toEqual({ radius: 1, delta: 1 });
    });
    it("2 AG, rayon augmenté → rayon 2, delta 0", () => {
        expect(autoIncrement(2, true)).toEqual({ radius: 2, delta: 0 });
    });
    it("3 AG, rayon non augmenté → rayon 1, delta 2", () => {
        expect(autoIncrement(3, false)).toEqual({ radius: 1, delta: 2 });
    });
    it("3 AG, rayon augmenté → rayon 2, delta 1", () => {
        expect(autoIncrement(3, true)).toEqual({ radius: 2, delta: 1 });
    });
});

describe("agOptions", () => {
    it("liste 1..ag", () => {
        expect(agOptions(4)).toEqual([1, 2, 3, 4]);
        expect(agOptions(1)).toEqual([1]);
    });
});
