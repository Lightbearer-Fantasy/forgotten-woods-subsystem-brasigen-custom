import { describe, it, expect } from "vitest";
import { MAP_SKILLS, skillLabelKey, mapSkillChoices } from "../scripts/data/map-skills.js";

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

describe("mapSkillChoices", () => {
    it("liste de base sans Scouting Lore", () => {
        const actor = { skills: { crafting: {} } };
        expect(mapSkillChoices(actor)).toEqual(["crafting", "society", "nature", "survival"]);
    });
    it("ajoute scouting-lore si l'acteur la possède", () => {
        const actor = { skills: { "scouting-lore": {} } };
        expect(mapSkillChoices(actor)).toEqual(["crafting", "society", "nature", "survival", "scouting-lore"]);
    });
    it("acteur sans skills : liste de base", () => {
        expect(mapSkillChoices(undefined)).toEqual(["crafting", "society", "nature", "survival"]);
    });
});
