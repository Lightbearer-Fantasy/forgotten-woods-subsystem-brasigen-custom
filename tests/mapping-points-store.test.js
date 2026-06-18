import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
    readPoints,
    pointsAt,
    clampedAdd,
    buildUpdate,
    buildClearAll,
    buildRangeDeltas,
    MODULE_ID,
    FLAG
} from "../scripts/mapping/mapping-points-store.js";

const sceneWith = (data) => ({
    getFlag: (module, flag) => (module === MODULE_ID && flag === FLAG ? data : undefined)
});

describe("clampedAdd", () => {
    it("additionne", () => expect(clampedAdd(2, 1)).toBe(3));
    it("décrémente", () => expect(clampedAdd(2, -1)).toBe(1));
    it("borne à 0", () => {
        expect(clampedAdd(0, -1)).toBe(0);
        expect(clampedAdd(1, -5)).toBe(0);
    });
    it("traite current absent comme 0", () => expect(clampedAdd(undefined, 1)).toBe(1));
    it("plafonne à 4", () => {
        expect(clampedAdd(4, 1)).toBe(4);
        expect(clampedAdd(3, 5)).toBe(4);
        expect(clampedAdd(2, 2)).toBe(4);
    });
});

describe("readPoints / pointsAt", () => {
    it("renvoie {} si pas de flag", () => {
        expect(readPoints(sceneWith(undefined))).toEqual({});
    });
    it("lit le compteur d'un hex", () => {
        const scene = sceneWith({ "1,1": 3 });
        expect(pointsAt(scene, { i: 1, j: 1 })).toBe(3);
        expect(pointsAt(scene, { i: 9, j: 9 })).toBe(0);
    });
});

describe("buildUpdate", () => {
    const flagBase = `flags.${MODULE_ID}.${FLAG}`;

    it("incrémente une clé existante et en crée une nouvelle", () => {
        const scene = sceneWith({ "1,1": 2 });
        const deltas = new Map([["1,1", 1], ["2,2", 1]]);
        expect(buildUpdate(scene, deltas)).toEqual({
            [`${flagBase}.1,1`]: 3,
            [`${flagBase}.2,2`]: 1
        });
    });

    it("plafonne le compteur à 4", () => {
        const scene = sceneWith({ "1,1": 4 });
        const deltas = new Map([["1,1", 1]]);
        expect(buildUpdate(scene, deltas)).toEqual({
            [`${flagBase}.1,1`]: 4
        });
    });

    it("supprime la clé quand le compteur retombe à 0", () => {
        const scene = sceneWith({ "1,1": 1 });
        const deltas = new Map([["1,1", -1]]);
        expect(buildUpdate(scene, deltas)).toEqual({
            [`${flagBase}.-=1,1`]: null
        });
    });

    it("un décrément sous 0 sur une clé absente produit une suppression (no-op net)", () => {
        const scene = sceneWith({});
        const deltas = new Map([["3,3", -1]]);
        expect(buildUpdate(scene, deltas)).toEqual({
            [`${flagBase}.-=3,3`]: null
        });
    });
});

describe("buildClearAll", () => {
    const flagBase = `flags.${MODULE_ID}`;

    it("supprime tout le flag quand des PC existent", () => {
        const scene = sceneWith({ "1,1": 2, "2,2": 4 });
        expect(buildClearAll(scene)).toEqual({
            [`${flagBase}.-=${FLAG}`]: null
        });
    });

    it("renvoie {} quand il n'y a aucun PC (no-op)", () => {
        expect(buildClearAll(sceneWith({}))).toEqual({});
        expect(buildClearAll(sceneWith(undefined))).toEqual({});
    });
});

describe("buildRangeDeltas", () => {
    const fourNeighbours = ({ i, j }) => [
        { i: i - 1, j }, { i: i + 1, j }, { i, j: j - 1 }, { i, j: j + 1 }
    ];
    beforeEach(() => {
        globalThis.canvas = { grid: { getAdjacentOffsets: fourNeighbours } };
    });
    afterEach(() => {
        delete globalThis.canvas;
    });

    it("rayon 1, delta 2 → 5 clés à +2", () => {
        const deltas = buildRangeDeltas({ i: 0, j: 0 }, 1, 2);
        expect(deltas.size).toBe(5);
        expect(deltas.get("0,0")).toBe(2);
        expect(deltas.get("1,0")).toBe(2);
    });

    it("delta <= 0 → Map vide", () => {
        expect(buildRangeDeltas({ i: 0, j: 0 }, 2, 0).size).toBe(0);
        expect(buildRangeDeltas({ i: 0, j: 0 }, 1, -1).size).toBe(0);
    });
});
