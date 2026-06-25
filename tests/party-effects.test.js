import { describe, it, expect } from "vitest";
import { PARTY_EFFECTS, withEffect, withoutEffect } from "../scripts/data/party-effects.js";
import { INDIVIDUAL_ACTIVITIES } from "../scripts/data/activities.js";

describe("PARTY_EFFECTS registry", () => {
    it("déclare hustle et cook avec label i18n + icône", () => {
        expect(PARTY_EFFECTS.hustle.label).toContain("partyEffect");
        expect(PARTY_EFFECTS.cook.label).toContain("partyEffect");
        expect(PARTY_EFFECTS.hustle.img).toMatch(/longstrider/);
    });

    it("la chip Cuisiner réutilise l'icône de l'activité Cuisiner", () => {
        const cookActivity = INDIVIDUAL_ACTIVITIES.find((a) => a.id === "cook");
        expect(PARTY_EFFECTS.cook.img).toBe(cookActivity.img);
    });
});

describe("withEffect", () => {
    it("ajoute une clé absente", () => {
        expect(withEffect([], "cook")).toEqual(["cook"]);
        expect(withEffect(["cook"], "hustle")).toEqual(["cook", "hustle"]);
    });
    it("ne duplique pas une clé présente", () => {
        expect(withEffect(["cook"], "cook")).toEqual(["cook"]);
    });
    it("tolère undefined", () => {
        expect(withEffect(undefined, "cook")).toEqual(["cook"]);
    });
});

describe("withoutEffect", () => {
    it("retire la clé", () => {
        expect(withoutEffect(["cook", "hustle"], "cook")).toEqual(["hustle"]);
    });
    it("no-op si absente", () => {
        expect(withoutEffect(["hustle"], "cook")).toEqual(["hustle"]);
    });
    it("tolère undefined", () => {
        expect(withoutEffect(undefined, "cook")).toEqual([]);
    });
});

describe("PARTY_EFFECTS — clé rest (v0.7)", () => {
    it("rest a un label i18n et une image", () => {
        expect(PARTY_EFFECTS.rest).toBeTruthy();
        expect(PARTY_EFFECTS.rest.label).toBe("FORGOTTEN_WOODS.partyEffect.rest");
        expect(typeof PARTY_EFFECTS.rest.img).toBe("string");
        expect(PARTY_EFFECTS.rest.img.length).toBeGreaterThan(0);
    });
});
