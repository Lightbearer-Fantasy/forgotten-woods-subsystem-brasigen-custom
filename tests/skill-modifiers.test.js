import { describe, it, expect } from "vitest";
import { composeModifiers } from "../scripts/mapping/skill-modifiers.js";
import { tallySkills } from "../scripts/mapping/skill-malus.js";

describe("composeModifiers", () => {
    it("aucun modificateur → liste vide", () => {
        const t = tallySkills(["crafting", "society"]);
        expect(composeModifiers("crafting", null, t)).toEqual([]);
    });
    it("bonus d'aspect seul", () => {
        const t = tallySkills(["nature"]);
        expect(composeModifiers("nature", "sauvage", t)).toEqual([
            { source: "aspect", modifier: 2 }
        ]);
    });
    it("malus de sur-utilisation seul", () => {
        const t = tallySkills(["survival", "survival", "survival"]);
        expect(composeModifiers("survival", null, t)).toEqual([
            { source: "overuse", modifier: -2 }
        ]);
    });
    it("aspect et sur-utilisation se cumulent (Nature/Sauvage 3×)", () => {
        const t = tallySkills(["nature", "nature", "nature"]);
        expect(composeModifiers("nature", "sauvage", t)).toEqual([
            { source: "aspect", modifier: 2 },
            { source: "overuse", modifier: -2 }
        ]);
    });
});
