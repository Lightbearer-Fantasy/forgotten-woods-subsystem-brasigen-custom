import { describe, it, expect } from "vitest";
import { tallySkills, malusFor } from "../scripts/mapping/skill-malus.js";

describe("tallySkills", () => {
    it("compte les occurrences par compétence", () => {
        expect(tallySkills(["crafting", "crafting", "society"])).toEqual({
            crafting: 2,
            society: 1
        });
    });
    it("liste vide → objet vide", () => {
        expect(tallySkills([])).toEqual({});
    });
});

describe("malusFor", () => {
    const tally = (arr) => tallySkills(arr);

    it("2x Crafting, 1x Society, 1x Survival, 1x Nature → aucun malus", () => {
        const t = tally(["crafting", "crafting", "society", "survival", "nature"]);
        expect(malusFor("crafting", t)).toBe(0);
    });
    it("2x Crafting, 2x Survival, 1x Society → aucun malus", () => {
        const t = tally(["crafting", "crafting", "survival", "survival", "society"]);
        expect(malusFor("crafting", t)).toBe(0);
        expect(malusFor("survival", t)).toBe(0);
    });
    it("3x Crafting → -2 sur Crafting", () => {
        const t = tally(["crafting", "crafting", "crafting", "society", "survival"]);
        expect(malusFor("crafting", t)).toBe(-2);
    });
    it("3x Survival → -2 sur Survival", () => {
        const t = tally(["crafting", "society", "survival", "survival", "survival"]);
        expect(malusFor("survival", t)).toBe(-2);
    });
    it("4x Survival → -4 sur Survival", () => {
        const t = tally(["society", "survival", "survival", "survival", "survival"]);
        expect(malusFor("survival", t)).toBe(-4);
    });
    it("compétence absente du tally → 0", () => {
        expect(malusFor("nature", tally(["crafting"]))).toBe(0);
    });
});
