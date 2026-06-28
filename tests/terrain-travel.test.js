import { describe, it, expect } from "vitest";
import { travelCost, reachesTravelDiscount } from "../scripts/data/terrain-travel.js";

describe("travelCost", () => {
    it("Marais et Montagne coûtent 2", () => {
        expect(travelCost("marais")).toBe(2);
        expect(travelCost("montagne")).toBe(2);
    });
    it("Plaines, Forêt, Forêt ancienne coûtent 1", () => {
        expect(travelCost("plaines")).toBe(1);
        expect(travelCost("foret")).toBe(1);
        expect(travelCost("foret-ancienne")).toBe(1);
    });
    it("défaut 1 si terrain absent ou inconnu", () => {
        expect(travelCost(undefined)).toBe(1);
        expect(travelCost("xyz")).toBe(1);
    });
});

describe("reachesTravelDiscount", () => {
    it("vrai si la Progression atteint le coût", () => {
        expect(reachesTravelDiscount(2, 2)).toBe(true);
        expect(reachesTravelDiscount(3, 2)).toBe(true);
    });
    it("faux en dessous du coût", () => {
        expect(reachesTravelDiscount(1, 2)).toBe(false);
    });
});
