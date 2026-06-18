import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildPf2eModifiers } from "../scripts/mapping/skill-roll.js";

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
