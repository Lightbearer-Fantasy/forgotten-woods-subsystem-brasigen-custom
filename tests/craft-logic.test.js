// tests/craft-logic.test.js
import { describe, it, expect } from "vitest";
import { craftMaterialCost, craftMaterialConsumption, craftExceedsLevel } from "../scripts/mapping/craft-logic.js";

describe("craftMaterialCost", () => {
    it("objet de niveau −2 ou moins → 3", () => {
        expect(craftMaterialCost(3, 5)).toBe(3); // 5-3 = 2
    });
    it("objet de niveau −1 → 5", () => {
        expect(craftMaterialCost(4, 5)).toBe(5); // 5-4 = 1
    });
    it("objet de votre niveau → 5", () => {
        expect(craftMaterialCost(5, 5)).toBe(5);
    });
    it("objet au-dessus de votre niveau → 5", () => {
        expect(craftMaterialCost(8, 5)).toBe(5);
    });
});

describe("craftMaterialConsumption", () => {
    it("réussite : −base", () => {
        expect(craftMaterialConsumption("success", 3)).toBe(-3);
    });
    it("réussite critique : −(base−1)", () => {
        expect(craftMaterialConsumption("criticalSuccess", 5)).toBe(-4);
    });
    it("échec : 0", () => {
        expect(craftMaterialConsumption("failure", 5)).toBe(0);
    });
    it("échec critique : −1", () => {
        expect(craftMaterialConsumption("criticalFailure", 5)).toBe(-1);
    });
});

describe("craftExceedsLevel", () => {
    it("objet au-dessus du niveau du PJ → interdit", () => {
        expect(craftExceedsLevel(22, 1)).toBe(true);
        expect(craftExceedsLevel(2, 1)).toBe(true);
    });
    it("objet du niveau du PJ ou inférieur → autorisé", () => {
        expect(craftExceedsLevel(1, 1)).toBe(false);
        expect(craftExceedsLevel(0, 1)).toBe(false);
        expect(craftExceedsLevel(3, 5)).toBe(false);
    });
});
