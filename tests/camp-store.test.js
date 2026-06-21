import { describe, it, expect } from "vitest";
import {
    readCamps, campAt, buildCampUpdate, buildClearAllCamps, MODULE_ID, FLAG
} from "../scripts/mapping/camp-store.js";

function sceneWith(camps) {
    return { getFlag: (mod, flag) => (mod === MODULE_ID && flag === FLAG ? camps : undefined) };
}

describe("camp-store (pur)", () => {
    it("readCamps renvoie {} si aucun flag", () => {
        expect(readCamps(sceneWith(undefined))).toEqual({});
    });
    it("campAt vrai si le hex porte un camp", () => {
        const scene = sceneWith({ "2,3": true });
        expect(campAt(scene, { i: 2, j: 3 })).toBe(true);
        expect(campAt(scene, { i: 0, j: 0 })).toBe(false);
    });
    it("buildCampUpdate(on=true) pose la clé à true", () => {
        const scene = sceneWith({});
        expect(buildCampUpdate(scene, { i: 1, j: 1 }, true))
            .toEqual({ [`flags.${MODULE_ID}.${FLAG}.1,1`]: true });
    });
    it("buildCampUpdate(on=false) supprime la clé", () => {
        const scene = sceneWith({ "1,1": true });
        expect(buildCampUpdate(scene, { i: 1, j: 1 }, false))
            .toEqual({ [`flags.${MODULE_ID}.${FLAG}.-=1,1`]: null });
    });
    it("buildClearAllCamps supprime tout le flag, ou no-op si vide", () => {
        expect(buildClearAllCamps(sceneWith({ "1,1": true })))
            .toEqual({ [`flags.${MODULE_ID}.-=${FLAG}`]: null });
        expect(buildClearAllCamps(sceneWith({}))).toEqual({});
    });
});
