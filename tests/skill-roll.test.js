import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildPf2eModifiers, resolveSkillStatistic } from "../scripts/mapping/skill-roll.js";

class FakeModifier {
    constructor(args) { Object.assign(this, args); }
}

beforeEach(() => {
    globalThis.game = {
        pf2e: { Modifier: FakeModifier },
        i18n: { localize: (k) => k }
    };
});
afterEach(() => { delete globalThis.game; });

describe("resolveSkillStatistic", () => {
    it("retourne actor.perception pour le slug 'perception'", () => {
        const perc = { id: "perc" };
        const actor = { skills: { nature: {} }, perception: perc };
        expect(resolveSkillStatistic(actor, "perception")).toBe(perc);
    });
    it("ne retourne PAS actor.skills.perception (undefined) mais actor.perception", () => {
        const perc = { id: "perc" };
        const actor = { skills: {}, perception: perc };
        // skills.perception n'existe pas
        expect(actor.skills.perception).toBeUndefined();
        expect(resolveSkillStatistic(actor, "perception")).toBe(perc);
    });
    it("retourne l'entrée skills pour une compétence normale", () => {
        const nat = { id: "nat" };
        const actor = { skills: { nature: nat } };
        expect(resolveSkillStatistic(actor, "nature")).toBe(nat);
    });
    it("retourne undefined pour une compétence absente", () => {
        const actor = { skills: { nature: {} } };
        expect(resolveSkillStatistic(actor, "cooking-lore")).toBeUndefined();
    });
});

describe("buildPf2eModifiers", () => {
    it("convertit les modificateurs en Modifier sans type", () => {
        const result = buildPf2eModifiers([
            { source: "aspect", modifier: 2 },
            { source: "overuse", modifier: -2 }
        ]);
        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(FakeModifier);
        expect(result[0].modifier).toBe(2);
        expect(result[0].type).toBe("untyped");
        expect(result[0].label).toBe("FORGOTTEN_WOODS.mapArea.modifiers.aspect");
        expect(result[1].label).toBe("FORGOTTEN_WOODS.mapArea.modifiers.overuse");
    });
    it("liste vide → aucun modificateur", () => {
        expect(buildPf2eModifiers([])).toEqual([]);
    });
});
