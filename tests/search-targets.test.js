import { describe, it, expect } from "vitest";
import {
    validSearchKeys,
    isValidSearchHex,
    searchPointsDeltas
} from "../scripts/mapping/search-targets.js";

describe("validSearchKeys / isValidSearchHex", () => {
    const offsets = [
        { i: 5, j: 5 }, // centre
        { i: 4, j: 5 }, { i: 6, j: 5 },
        { i: 5, j: 4 }, { i: 5, j: 6 },
        { i: 4, j: 6 }, { i: 6, j: 6 }
    ];
    const keys = validSearchKeys(offsets);

    it("construit un set de 7 clés", () => {
        expect(keys.size).toBe(7);
        expect(keys.has("5,5")).toBe(true);
    });

    it("accepte un hex de la liste", () => {
        expect(isValidSearchHex(keys, { i: 4, j: 5 })).toBe(true);
        expect(isValidSearchHex(keys, { i: 5, j: 5 })).toBe(true);
    });

    it("rejette un hex hors liste", () => {
        expect(isValidSearchHex(keys, { i: 9, j: 9 })).toBe(false);
        expect(isValidSearchHex(keys, { i: 3, j: 5 })).toBe(false);
    });
});

describe("searchPointsDeltas", () => {
    it("delta non nul → Map à une entrée", () => {
        const m = searchPointsDeltas("2,3", 2);
        expect([...m.entries()]).toEqual([["2,3", 2]]);
    });

    it("delta négatif conservé (échec critique)", () => {
        const m = searchPointsDeltas("2,3", -1);
        expect(m.get("2,3")).toBe(-1);
    });

    it("delta 0 → Map vide (aucune écriture)", () => {
        expect(searchPointsDeltas("2,3", 0).size).toBe(0);
    });
});
