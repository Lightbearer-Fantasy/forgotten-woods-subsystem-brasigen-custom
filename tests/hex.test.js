import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { offsetToKey, spacesInRange, offsetsInRect } from "../scripts/utils/hex.js";

// Adjacence carrée à 4 voisins : déterministe pour tester la logique de parcours
// (indépendamment de la géométrie hexa réelle de Foundry).
const fourNeighbours = ({ i, j }) => [
    { i: i - 1, j },
    { i: i + 1, j },
    { i, j: j - 1 },
    { i, j: j + 1 }
];

beforeEach(() => {
    globalThis.canvas = { grid: { getAdjacentOffsets: fourNeighbours } };
});
afterEach(() => {
    delete globalThis.canvas;
});

describe("offsetToKey", () => {
    it("formate i,j", () => {
        expect(offsetToKey({ i: 2, j: 5 })).toBe("2,5");
    });
});

describe("spacesInRange", () => {
    it("rayon 0 = centre seul", () => {
        const r = spacesInRange({ i: 3, j: 3 }, 0);
        expect(r).toEqual([{ i: 3, j: 3 }]);
    });
    it("rayon 1 = centre + voisins (5 cases en adjacence 4-voisins)", () => {
        const keys = spacesInRange({ i: 0, j: 0 }, 1).map(offsetToKey).sort();
        expect(keys).toEqual(["-1,0", "0,-1", "0,0", "0,1", "1,0"].sort());
    });
    it("rayon 2 = losange de 13 cases", () => {
        expect(spacesInRange({ i: 0, j: 0 }, 2)).toHaveLength(13);
    });
    it("ne contient pas de doublons", () => {
        const keys = spacesInRange({ i: 0, j: 0 }, 2).map(offsetToKey);
        expect(new Set(keys).size).toBe(keys.length);
    });
});

describe("offsetsInRect", () => {
    // Grille mock : centre du hex (i,j) à (i*100, j*100). Plage [0,0,3,3[.
    beforeEach(() => {
        globalThis.canvas = {
            grid: {
                getOffsetRange: () => [0, 0, 3, 3],
                getCenterPoint: ({ i, j }) => ({ x: i * 100, y: j * 100 })
            }
        };
    });

    it("renvoie tous les offsets dont le centre est dans le rectangle", () => {
        const keys = offsetsInRect({ x: 0, y: 0, width: 250, height: 250 })
            .map(offsetToKey).sort();
        // i,j ∈ {0,1,2} (centres 0,100,200 ≤ 250) → 9 hex.
        expect(keys).toHaveLength(9);
        expect(keys).toContain("2,2");
    });

    it("exclut les hex dont le centre sort du rectangle", () => {
        const keys = offsetsInRect({ x: 0, y: 0, width: 150, height: 150 })
            .map(offsetToKey).sort();
        // Seuls i,j ∈ {0,1} (centres 0,100 ≤ 150) → 4 hex ; i=2 ou j=2 (200) exclus.
        expect(keys).toEqual(["0,0", "0,1", "1,0", "1,1"]);
    });
});
