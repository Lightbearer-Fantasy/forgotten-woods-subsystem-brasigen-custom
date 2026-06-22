// tests/cook-logic.test.js
import { describe, it, expect } from "vitest";
import { cookSkillChoices, cookIngredientCost } from "../scripts/mapping/cook-logic.js";

describe("cookSkillChoices", () => {
    it("Crafting seul si pas de Cooking Lore", () => {
        expect(cookSkillChoices({ skills: { crafting: {} } })).toEqual(["crafting"]);
    });
    it("Crafting + Cooking Lore si la fiche l'a", () => {
        expect(cookSkillChoices({ skills: { crafting: {}, "cooking-lore": {} } })).toEqual(["crafting", "cooking-lore"]);
    });
    it("tolère un acteur sans skills", () => {
        expect(cookSkillChoices({})).toEqual(["crafting"]);
    });
});

describe("cookIngredientCost", () => {
    it("réussite : −partySize", () => {
        expect(cookIngredientCost("success", 4)).toBe(-4);
    });
    it("réussite critique : −(partySize−1)", () => {
        expect(cookIngredientCost("criticalSuccess", 4)).toBe(-3);
    });
    it("réussite critique à 1 PJ : 0 (pas négatif)", () => {
        expect(cookIngredientCost("criticalSuccess", 1)).toBe(0);
    });
    it("échec : 0", () => {
        expect(cookIngredientCost("failure", 4)).toBe(0);
    });
    it("échec critique : −1", () => {
        expect(cookIngredientCost("criticalFailure", 4)).toBe(-1);
    });
});
