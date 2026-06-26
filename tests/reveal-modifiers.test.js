import { describe, it, expect } from "vitest";
import { revealDelta, effectiveRange } from "../scripts/mapping/reveal-modifiers.js";

describe("revealDelta", () => {
    it("plaines +1, marais -1", () => {
        expect(revealDelta(["plaines"])).toBe(1);
        expect(revealDelta(["marais"])).toBe(-1);
    });
    it("somme des chips connus, ignore les inconnus", () => {
        expect(revealDelta(["plaines", "ancre", "foret"])).toBe(1);
        expect(revealDelta(["plaines", "marais"])).toBe(0);
    });
    it("0 pour liste vide ou non-array", () => {
        expect(revealDelta([])).toBe(0);
        expect(revealDelta(undefined)).toBe(0);
    });
});

describe("effectiveRange", () => {
    it("ajoute le delta à la base", () => {
        expect(effectiveRange(1, ["plaines"])).toBe(2);
    });
    it("borne à 0 (marais ne descend pas sous l'Hex seul)", () => {
        expect(effectiveRange(1, ["marais"])).toBe(0);
        expect(effectiveRange(0, ["marais"])).toBe(0);
    });
    it("base nulle traitée comme 0", () => {
        expect(effectiveRange(null, ["plaines"])).toBe(1);
        expect(effectiveRange(undefined, [])).toBe(0);
    });
});
