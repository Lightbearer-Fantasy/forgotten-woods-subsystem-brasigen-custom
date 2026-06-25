// tests/round-resolution.test.js
import { describe, it, expect } from "vitest";
import { resolveRoundChips } from "../scripts/mapping/round-resolution.js";

describe("resolveRoundChips", () => {
    it("hustle → applique Fatigued", () => {
        expect(resolveRoundChips(["hustle"])).toEqual({ blocked: false, applyCook: false, applyFatigued: true, removeFatigued: false });
    });
    it("rest → retire Fatigued", () => {
        expect(resolveRoundChips(["rest"])).toEqual({ blocked: false, applyCook: false, applyFatigued: false, removeFatigued: true });
    });
    it("cook → applique Cuisiner", () => {
        expect(resolveRoundChips(["cook"])).toEqual({ blocked: false, applyCook: true, applyFatigued: false, removeFatigued: false });
    });
    it("cook + hustle (cumul) → les deux", () => {
        expect(resolveRoundChips(["cook", "hustle"])).toEqual({ blocked: false, applyCook: true, applyFatigued: true, removeFatigued: false });
    });
    it("hustle + rest → bloqué, aucune action", () => {
        expect(resolveRoundChips(["hustle", "rest"])).toEqual({ blocked: true, applyCook: false, applyFatigued: false, removeFatigued: false });
    });
    it("hustle + rest + cook → bloqué (l'exclusivité prime, même cook)", () => {
        expect(resolveRoundChips(["hustle", "rest", "cook"])).toEqual({ blocked: true, applyCook: false, applyFatigued: false, removeFatigued: false });
    });
    it("aucun chip → aucune action", () => {
        expect(resolveRoundChips([])).toEqual({ blocked: false, applyCook: false, applyFatigued: false, removeFatigued: false });
    });
});
