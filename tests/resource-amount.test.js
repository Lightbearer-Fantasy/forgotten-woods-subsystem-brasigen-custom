import { describe, it, expect } from "vitest";
import { resourceAmountForOutcome } from "../scripts/mapping/resource-amount.js";

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
