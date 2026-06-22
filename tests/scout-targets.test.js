import { describe, it, expect } from "vitest";
import { hasScout, membersNeedingScout } from "../scripts/mapping/scout-targets.js";

const UUID = "Compendium.pf2e.other-effects.Item.EMqGwUi3VMhCjTlF";
const withScout = { itemTypes: { effect: [{ flags: { core: { sourceId: UUID } } }] } };
const without = { itemTypes: { effect: [] } };
const otherEffect = { itemTypes: { effect: [{ flags: { core: { sourceId: "Compendium.pf2e.other-effects.Item.OTHER" } } }] } };

describe("hasScout", () => {
    it("détecte l'effet Scout par sourceId", () => {
        expect(hasScout(withScout, UUID)).toBe(true);
    });
    it("renvoie false sans effet", () => {
        expect(hasScout(without, UUID)).toBe(false);
    });
    it("ignore un autre effet", () => {
        expect(hasScout(otherEffect, UUID)).toBe(false);
    });
    it("tolère un membre sans itemTypes", () => {
        expect(hasScout({}, UUID)).toBe(false);
    });
});

describe("membersNeedingScout", () => {
    it("ne garde que les membres sans l'effet", () => {
        const res = membersNeedingScout([withScout, without, otherEffect], UUID);
        expect(res).toEqual([without, otherEffect]);
    });
    it("liste vide si tous l'ont déjà", () => {
        expect(membersNeedingScout([withScout], UUID)).toEqual([]);
    });
    it("tolère une entrée nulle/undefined", () => {
        expect(membersNeedingScout(undefined, UUID)).toEqual([]);
    });
});
