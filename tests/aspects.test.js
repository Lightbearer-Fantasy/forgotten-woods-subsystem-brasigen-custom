import { describe, it, expect } from "vitest";
import { ASPECTS, aspectBonus, aspectOptions, aspectLabelKey } from "../scripts/data/aspects.js";

describe("ASPECTS", () => {
    it("définit Sauvage (+2 Nature) et Donjon (+2 Society)", () => {
        expect(ASPECTS).toEqual({ sauvage: { nature: 2 }, donjon: { society: 2 } });
    });
});

describe("aspectBonus", () => {
    it("Sauvage donne +2 à Nature, rien aux autres", () => {
        expect(aspectBonus("sauvage", "nature")).toBe(2);
        expect(aspectBonus("sauvage", "society")).toBe(0);
    });
    it("Donjon donne +2 à Society", () => {
        expect(aspectBonus("donjon", "society")).toBe(2);
    });
    it("aucun aspect (null/inconnu) → 0", () => {
        expect(aspectBonus(null, "nature")).toBe(0);
        expect(aspectBonus("cendres", "nature")).toBe(0);
    });
});

describe("aspectOptions", () => {
    it("commence par Aucun puis les aspects définis", () => {
        expect(aspectOptions()).toEqual([
            { value: "", labelKey: "FORGOTTEN_WOODS.aspects.none" },
            { value: "sauvage", labelKey: "FORGOTTEN_WOODS.aspects.sauvage" },
            { value: "donjon", labelKey: "FORGOTTEN_WOODS.aspects.donjon" }
        ]);
    });
});

describe("aspectLabelKey", () => {
    it("null → none, sinon le nom", () => {
        expect(aspectLabelKey(null)).toBe("FORGOTTEN_WOODS.aspects.none");
        expect(aspectLabelKey("sauvage")).toBe("FORGOTTEN_WOODS.aspects.sauvage");
    });
});
