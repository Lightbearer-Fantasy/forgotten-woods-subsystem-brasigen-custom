import { describe, it, expect } from "vitest";
import { markTemporaryCraft, consumeTemporaryCraftMark } from "../scripts/mapping/craft-temp-card.js";

describe("registre de marqueurs de craft temporaire", () => {
    it("consomme un marqueur présent dans la fenêtre", () => {
        markTemporaryCraft("actor-A", 1000);
        expect(consumeTemporaryCraftMark("actor-A", 10000, 5000)).toBe(true);
    });
    it("ne consomme qu'une fois (one-shot)", () => {
        markTemporaryCraft("actor-B", 1000);
        expect(consumeTemporaryCraftMark("actor-B", 10000, 2000)).toBe(true);
        expect(consumeTemporaryCraftMark("actor-B", 10000, 2000)).toBe(false);
    });
    it("renvoie false hors fenêtre et purge l'entrée", () => {
        markTemporaryCraft("actor-C", 1000);
        expect(consumeTemporaryCraftMark("actor-C", 10000, 999999)).toBe(false);
        // l'entrée expirée a été purgée : un re-mark récent fonctionne
        markTemporaryCraft("actor-C", 100000);
        expect(consumeTemporaryCraftMark("actor-C", 10000, 105000)).toBe(true);
    });
    it("renvoie false pour un acteur jamais marqué", () => {
        expect(consumeTemporaryCraftMark("inconnu", 10000, 0)).toBe(false);
    });
});
