import { describe, it, expect } from "vitest";
import {
    readDC,
    dcAt,
    buildSetDC,
    buildClearAllDC,
    MODULE_ID,
    DC_FLAG
} from "../scripts/mapping/mapping-dc-store.js";

const sceneWith = (data) => ({
    getFlag: (module, flag) => (module === MODULE_ID && flag === DC_FLAG ? data : undefined)
});

describe("readDC / dcAt", () => {
    it("renvoie {} si pas de flag", () => {
        expect(readDC(sceneWith(undefined))).toEqual({});
    });
    it("lit le DC d'un hex", () => {
        const scene = sceneWith({ "1,1": 15 });
        expect(dcAt(scene, { i: 1, j: 1 })).toBe(15);
        expect(dcAt(scene, { i: 9, j: 9 })).toBe(0);
    });
});

describe("buildSetDC", () => {
    const flagBase = `flags.${MODULE_ID}.${DC_FLAG}`;

    it("fixe une valeur absolue sur plusieurs clés", () => {
        const scene = sceneWith({ "1,1": 10 });
        expect(buildSetDC(scene, ["1,1", "2,2"], 17)).toEqual({
            [`${flagBase}.1,1`]: 17,
            [`${flagBase}.2,2`]: 17
        });
    });

    it("n'a aucun plafond", () => {
        const scene = sceneWith({});
        expect(buildSetDC(scene, ["3,3"], 99)).toEqual({
            [`${flagBase}.3,3`]: 99
        });
    });

    it("supprime la clé quand la valeur est 0", () => {
        const scene = sceneWith({ "1,1": 15 });
        expect(buildSetDC(scene, ["1,1"], 0)).toEqual({
            [`${flagBase}.-=1,1`]: null
        });
    });
});

describe("buildClearAllDC", () => {
    const flagBase = `flags.${MODULE_ID}`;

    it("supprime tout le flag quand des DC existent", () => {
        const scene = sceneWith({ "1,1": 15 });
        expect(buildClearAllDC(scene)).toEqual({
            [`${flagBase}.-=${DC_FLAG}`]: null
        });
    });

    it("renvoie {} quand il n'y a aucun DC (no-op)", () => {
        expect(buildClearAllDC(sceneWith({}))).toEqual({});
        expect(buildClearAllDC(sceneWith(undefined))).toEqual({});
    });
});
