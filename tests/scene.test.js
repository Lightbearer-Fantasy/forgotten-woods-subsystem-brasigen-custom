import { describe, it, expect } from "vitest";
import { isHexScene, isPartyToken } from "../scripts/utils/scene.js";

describe("isHexScene", () => {
    it("est vrai pour les 4 types de grille hexagonale (2,3,4,5)", () => {
        for (const type of [2, 3, 4, 5]) {
            expect(isHexScene({ grid: { type } })).toBe(true);
        }
    });

    it("est faux pour gridless (0) et carré (1)", () => {
        expect(isHexScene({ grid: { type: 0 } })).toBe(false);
        expect(isHexScene({ grid: { type: 1 } })).toBe(false);
    });

    it("est faux pour une scène nulle ou sans grille", () => {
        expect(isHexScene(null)).toBe(false);
        expect(isHexScene({})).toBe(false);
    });
});

describe("isPartyToken", () => {
    it("est vrai quand l'acteur est de type party", () => {
        expect(isPartyToken({ actor: { type: "party" } })).toBe(true);
    });

    it("est faux pour les autres types d'acteur", () => {
        expect(isPartyToken({ actor: { type: "character" } })).toBe(false);
        expect(isPartyToken({ actor: { type: "npc" } })).toBe(false);
    });

    it("est faux quand token ou actor est absent", () => {
        expect(isPartyToken(null)).toBe(false);
        expect(isPartyToken({})).toBe(false);
    });
});
