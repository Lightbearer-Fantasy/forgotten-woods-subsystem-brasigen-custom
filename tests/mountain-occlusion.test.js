import { describe, it, expect } from "vitest";
import { filterMappableDeltas } from "../scripts/mapping/mountain-occlusion.js";

describe("filterMappableDeltas", () => {
    const isMountainKey = (key) => key === "2,2"; // seule "2,2" est une Montagne

    it("retire les Hex Montagne quand l'origine n'est pas une Montagne", () => {
        const deltas = new Map([["1,1", 1], ["2,2", 1], ["3,3", 1]]);
        const out = filterMappableDeltas(deltas, false, isMountainKey);
        expect([...out.keys()]).toEqual(["1,1", "3,3"]);
    });
    it("conserve tout si l'origine est une Montagne", () => {
        const deltas = new Map([["1,1", 1], ["2,2", 1]]);
        const out = filterMappableDeltas(deltas, true, isMountainKey);
        expect([...out.keys()]).toEqual(["1,1", "2,2"]);
    });
    it("renvoie une nouvelle Map (n'altère pas l'entrée)", () => {
        const deltas = new Map([["2,2", 1]]);
        const out = filterMappableDeltas(deltas, false, isMountainKey);
        expect(out).not.toBe(deltas);
        expect(deltas.size).toBe(1);
    });
});
