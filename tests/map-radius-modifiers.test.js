import { describe, it, expect } from "vitest";
import { mapRadiusDelta, effectiveMapRadius } from "../scripts/mapping/map-radius-modifiers.js";

describe("mapRadiusDelta", () => {
    it("liste vide ou non-array → 0", () => {
        expect(mapRadiusDelta([])).toBe(0);
        expect(mapRadiusDelta(undefined)).toBe(0);
    });
    it("orme-blanc → +1", () => {
        expect(mapRadiusDelta(["orme-blanc"])).toBe(1);
    });
    it("plaines +1, marais −1 (conservés)", () => {
        expect(mapRadiusDelta(["plaines"])).toBe(1);
        expect(mapRadiusDelta(["marais"])).toBe(-1);
    });
    it("plaines + orme-blanc cumulent → +2", () => {
        expect(mapRadiusDelta(["plaines", "orme-blanc"])).toBe(2);
    });
    it("marais + orme-blanc s'annulent → 0", () => {
        expect(mapRadiusDelta(["marais", "orme-blanc"])).toBe(0);
    });
    it("chip sans effet (foret) → 0", () => {
        expect(mapRadiusDelta(["foret"])).toBe(0);
    });
});

describe("effectiveMapRadius", () => {
    it("base + delta, planché à 0", () => {
        expect(effectiveMapRadius(1, ["orme-blanc"])).toBe(2);
        expect(effectiveMapRadius(1, ["marais"])).toBe(0);
        expect(effectiveMapRadius(0, ["marais"])).toBe(0); // jamais négatif
        expect(effectiveMapRadius(undefined, [])).toBe(0);
    });
});
