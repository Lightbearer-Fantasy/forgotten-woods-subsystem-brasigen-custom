import { describe, it, expect } from "vitest";
import { filterMappableDeltas, occludeBehindMountains } from "../scripts/mapping/mountain-occlusion.js";

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
        expect(out).not.toBe(deltas);
    });
    it("renvoie une nouvelle Map (n'altère pas l'entrée)", () => {
        const deltas = new Map([["2,2", 1]]);
        const out = filterMappableDeltas(deltas, false, isMountainKey);
        expect(out).not.toBe(deltas);
        expect(deltas.size).toBe(1);
    });
});

describe("occludeBehindMountains", () => {
    const origin = { x: 0, y: 0 };
    const corridor = 50;

    it("retire un Hex aligné derrière une Montagne", () => {
        const candidates = [
            { key: "m", center: { x: 100, y: 0 }, mountain: true },
            { key: "behind", center: { x: 200, y: 0 }, mountain: false }
        ];
        const kept = occludeBehindMountains(origin, candidates, corridor).map((c) => c.key);
        expect(kept).toEqual(["m"]); // la Montagne reste, l'Hex derrière disparaît
    });
    it("conserve un Hex de biais (hors couloir de la Montagne)", () => {
        const candidates = [
            { key: "m", center: { x: 100, y: 0 }, mountain: true },
            { key: "oblique", center: { x: 100, y: 200 }, mountain: false }
        ];
        const kept = occludeBehindMountains(origin, candidates, corridor).map((c) => c.key);
        expect(kept.sort()).toEqual(["m", "oblique"]);
    });
    it("ne retire pas un Hex plus PROCHE que la Montagne", () => {
        const candidates = [
            { key: "near", center: { x: 50, y: 0 }, mountain: false },
            { key: "m", center: { x: 100, y: 0 }, mountain: true }
        ];
        const kept = occludeBehindMountains(origin, candidates, corridor).map((c) => c.key);
        expect(kept.sort()).toEqual(["m", "near"]);
    });
    it("sans Montagne, tout est conservé", () => {
        const candidates = [
            { key: "a", center: { x: 100, y: 0 }, mountain: false },
            { key: "b", center: { x: 200, y: 0 }, mountain: false }
        ];
        const kept = occludeBehindMountains(origin, candidates, corridor).map((c) => c.key);
        expect(kept.sort()).toEqual(["a", "b"]);
    });
    it("occulte un Hex pris en tenaille entre deux Montagnes (couture pleine)", () => {
        // ligne de vue exactement entre deux Montagnes adjacentes (perp = corridor des deux
        // côtés) : c'est un mur, on ne voit pas par la couture (cas réel 34,13).
        const candidates = [
            { key: "mL", center: { x: -50, y: 100 }, mountain: true },
            { key: "mR", center: { x: 50, y: 100 }, mountain: true },
            { key: "behind", center: { x: 0, y: 200 }, mountain: false }
        ];
        const kept = occludeBehindMountains(origin, candidates, corridor).map((c) => c.key);
        expect(kept.sort()).toEqual(["mL", "mR"]);
    });
    it("conserve un Hex qui ne frôle qu'UNE Montagne (passage ouvert de l'autre côté)", () => {
        // frôlement d'un seul côté (perp = corridor) : il y a un trou de l'autre côté,
        // on voit au travers (cas réel 35,15, plaines ouverte en face).
        const candidates = [
            { key: "m", center: { x: 50, y: 100 }, mountain: true },
            { key: "through", center: { x: 0, y: 200 }, mountain: false }
        ];
        const kept = occludeBehindMountains(origin, candidates, corridor).map((c) => c.key);
        expect(kept.sort()).toEqual(["m", "through"]);
    });
});
