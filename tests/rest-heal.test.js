import { describe, it, expect } from "vitest";
import { restHealAmount } from "../scripts/mapping/rest-heal.js";

describe("restHealAmount", () => {
    it("Con +3, niveau 5 → 3×5×3 = 45", () => {
        expect(restHealAmount(3, 5)).toBe(45);
    });
    it("Con 0 → plancher à 1 : 1×4×3 = 12", () => {
        expect(restHealAmount(0, 4)).toBe(12);
    });
    it("Con négatif → plancher à 1 : 1×2×3 = 6", () => {
        expect(restHealAmount(-2, 2)).toBe(6);
    });
    it("niveau 1, Con +1 → 1×1×3 = 3", () => {
        expect(restHealAmount(1, 1)).toBe(3);
    });
});
