import { describe, it, expect } from "vitest";
import { autoIncrement, agOptions, mapAreaPlan } from "../scripts/mapping/auto-increment.js";

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

describe("mapAreaPlan", () => {
    it("aucun chip → identique à autoIncrement (radius, autoDelta = choice − radius)", () => {
        expect(mapAreaPlan(3, false, [])).toEqual({ radius: 1, autoDelta: 2 });
        expect(mapAreaPlan(3, true, [])).toEqual({ radius: 2, autoDelta: 1 });
    });
    it("Plaines herbeuses → rayon +1, autoDelta recalculé", () => {
        // base radius 1 → effectif 2 ; autoDelta = 3 − 2 = 1
        expect(mapAreaPlan(3, false, ["plaines"])).toEqual({ radius: 2, autoDelta: 1 });
    });
    it("Marais → rayon −1, autoDelta recalculé", () => {
        // base radius 1 → effectif 0 ; autoDelta = 3 − 0 = 3
        expect(mapAreaPlan(3, false, ["marais"])).toEqual({ radius: 0, autoDelta: 3 });
    });
    it("Marais planché à 0 (jamais négatif)", () => {
        // base radius 1, marais −1 → 0, pas −1
        expect(mapAreaPlan(1, false, ["marais"]).radius).toBe(0);
    });
    it("chip sans effet de révélation → inchangé", () => {
        expect(mapAreaPlan(2, false, ["foret"])).toEqual({ radius: 1, autoDelta: 1 });
    });
});
