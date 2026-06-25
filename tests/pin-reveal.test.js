// tests/pin-reveal.test.js
import { describe, it, expect } from "vitest";
import {
    pinThreshold, isPinRevealed, defaultFwPin, pinVisibleToPlayer, pinsToReveal
} from "../scripts/notes/pin-reveal.js";

describe("pinThreshold", () => {
    it("vaut 2 pour un pin non Secret, 4 pour un pin Secret", () => {
        expect(pinThreshold(false)).toBe(2);
        expect(pinThreshold(true)).toBe(4);
    });
});

describe("isPinRevealed", () => {
    it("non Secret : révélé dès 2 PC", () => {
        expect(isPinRevealed({ secret: false, points: 1 })).toBe(false);
        expect(isPinRevealed({ secret: false, points: 2 })).toBe(true);
    });
    it("Secret : caché jusqu'à 4 PC", () => {
        expect(isPinRevealed({ secret: true, points: 3 })).toBe(false);
        expect(isPinRevealed({ secret: true, points: 4 })).toBe(true);
    });
    it("cas 3 PC : non-Secret révélé, Secret encore caché", () => {
        expect(isPinRevealed({ secret: false, points: 3 })).toBe(true);
        expect(isPinRevealed({ secret: true, points: 3 })).toBe(false);
    });
    it("points absent = 0", () => {
        expect(isPinRevealed({ secret: false })).toBe(false);
    });
});

describe("defaultFwPin", () => {
    it("coché sur une scène Hex, décoché sinon", () => {
        expect(defaultFwPin(true)).toBe(true);
        expect(defaultFwPin(false)).toBe(false);
    });
});

describe("pinVisibleToPlayer", () => {
    it("note non gérée : toujours visible", () => {
        expect(pinVisibleToPlayer({ fwPin: false, revealed: false })).toBe(true);
    });
    it("pin géré : visible seulement si révélé", () => {
        expect(pinVisibleToPlayer({ fwPin: true, revealed: false })).toBe(false);
        expect(pinVisibleToPlayer({ fwPin: true, revealed: true })).toBe(true);
    });
});

describe("pinsToReveal", () => {
    it("ne renvoie que les pins gérés, non révélés, ayant franchi le seuil", () => {
        const pins = [
            { id: "a", fwPin: true, secret: false, revealed: false, points: 2 }, // à révéler
            { id: "b", fwPin: true, secret: true, revealed: false, points: 3 },  // secret < 4
            { id: "c", fwPin: true, secret: false, revealed: true, points: 4 },  // déjà révélé (latch)
            { id: "d", fwPin: false, secret: false, revealed: false, points: 4 },// non géré
            { id: "e", fwPin: true, secret: true, revealed: false, points: 4 }   // à révéler
        ];
        expect(pinsToReveal(pins)).toEqual(["a", "e"]);
    });
    it("liste vide / nullish → []", () => {
        expect(pinsToReveal([])).toEqual([]);
        expect(pinsToReveal(undefined)).toEqual([]);
    });
});
