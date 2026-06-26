import { describe, it, expect } from "vitest";
import {
    CHIPS, getChip, terrains, markers, applyChipToList, removeChipFromList
} from "../scripts/data/hex-chips.js";

describe("registre CHIPS", () => {
    it("liste les 5 terrains et 2 marqueurs attendus", () => {
        expect(terrains().map((c) => c.id)).toEqual(
            ["plaines", "marais", "foret", "foret-ancienne", "montagne"]
        );
        expect(markers().map((c) => c.id)).toEqual(["ancre", "orme-blanc"]);
    });
    it("orme-blanc est unique, les autres non", () => {
        expect(getChip("orme-blanc").unique).toBe(true);
        expect(getChip("plaines").unique).toBeUndefined();
    });
    it("chaque chip a labelKey/icon/color/abbr", () => {
        for (const c of CHIPS) {
            expect(c.labelKey).toMatch(/^FORGOTTEN_WOODS\.mapping\.chips\./);
            expect(c.icon).toBeTruthy();
            expect(c.color).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(c.abbr).toBeTruthy();
        }
    });
    it("getChip rend undefined pour un id inconnu", () => {
        expect(getChip("zzz")).toBeUndefined();
    });
});

describe("applyChipToList", () => {
    it("ajoute un terrain sur une liste vide", () => {
        expect(applyChipToList([], "plaines")).toEqual(["plaines"]);
    });
    it("un nouveau terrain remplace le terrain existant, garde les marqueurs", () => {
        expect(applyChipToList(["marais", "ancre"], "plaines")).toEqual(["ancre", "plaines"]);
    });
    it("un marqueur s'ajoute sans toucher le terrain", () => {
        expect(applyChipToList(["foret"], "ancre")).toEqual(["foret", "ancre"]);
    });
    it("est idempotent (chip déjà présent)", () => {
        expect(applyChipToList(["foret", "ancre"], "ancre")).toEqual(["foret", "ancre"]);
        expect(applyChipToList(["foret"], "foret")).toEqual(["foret"]);
    });
    it("ignore un chip inconnu", () => {
        expect(applyChipToList(["foret"], "zzz")).toEqual(["foret"]);
    });
});

describe("removeChipFromList", () => {
    it("retire le chip ciblé", () => {
        expect(removeChipFromList(["foret", "ancre"], "ancre")).toEqual(["foret"]);
    });
    it("no-op si absent", () => {
        expect(removeChipFromList(["foret"], "ancre")).toEqual(["foret"]);
    });
});
