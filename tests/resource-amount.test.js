import { describe, it, expect } from "vitest";
import { resourceAmountForOutcome, resourceAmountWithBonus } from "../scripts/mapping/resource-amount.js";

describe("resourceAmountForOutcome", () => {
    it("succès critique → 3", () => {
        expect(resourceAmountForOutcome("criticalSuccess")).toBe(3);
    });
    it("succès → 2", () => {
        expect(resourceAmountForOutcome("success")).toBe(2);
    });
    it("échec → 0", () => {
        expect(resourceAmountForOutcome("failure")).toBe(0);
    });
    it("échec critique → -1 (perte d'une ressource)", () => {
        expect(resourceAmountForOutcome("criticalFailure")).toBe(-1);
    });
    it("outcome inconnu ou vide → 0", () => {
        expect(resourceAmountForOutcome("")).toBe(0);
        expect(resourceAmountForOutcome(undefined)).toBe(0);
    });
});

describe("resourceAmountWithBonus", () => {
    it("ajoute le bonus uniquement sur un gain", () => {
        expect(resourceAmountWithBonus("success", 1)).toBe(3);          // 2 + 1
        expect(resourceAmountWithBonus("criticalSuccess", 1)).toBe(4);  // 3 + 1
    });
    it("n'ajoute rien sur échec ni échec critique", () => {
        expect(resourceAmountWithBonus("failure", 1)).toBe(0);
        expect(resourceAmountWithBonus("criticalFailure", 1)).toBe(-1);
    });
    it("bonus 0 = identité", () => {
        expect(resourceAmountWithBonus("success", 0)).toBe(2);
        expect(resourceAmountWithBonus("success")).toBe(2);
    });
});
