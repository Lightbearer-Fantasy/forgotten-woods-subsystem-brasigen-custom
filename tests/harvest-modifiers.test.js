import { describe, it, expect } from "vitest";
import { harvestDelta } from "../scripts/mapping/harvest-modifiers.js";

describe("harvestDelta", () => {
    it("foret + ingredients → +1", () => {
        expect(harvestDelta("ingredients", ["foret"])).toBe(1);
    });
    it("foret + materials → 0 (ne touche pas les matériaux)", () => {
        expect(harvestDelta("materials", ["foret"])).toBe(0);
    });
    it("ingredients sans foret → 0", () => {
        expect(harvestDelta("ingredients", ["plaines"])).toBe(0);
    });
    it("entrées invalides → 0", () => {
        expect(harvestDelta("ingredients", undefined)).toBe(0);
        expect(harvestDelta(undefined, ["foret"])).toBe(0);
    });
});
