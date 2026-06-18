import { describe, it, expect } from "vitest";
import { MAP_SKILLS, skillLabelKey } from "../scripts/data/map-skills.js";

describe("MAP_SKILLS", () => {
    it("liste les 4 compétences dans l'ordre", () => {
        expect(MAP_SKILLS).toEqual(["crafting", "society", "nature", "survival"]);
    });
});

describe("skillLabelKey", () => {
    it("préfixe la clé i18n", () => {
        expect(skillLabelKey("nature")).toBe("FORGOTTEN_WOODS.skills.nature");
    });
});
