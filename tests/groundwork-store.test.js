import { describe, it, expect } from "vitest";
import {
    readGroundwork, groundworkAt, resolveGroundwork,
    buildSetGroundwork, buildClearAllGroundwork
} from "../scripts/mapping/groundwork-store.js";

const sceneWith = (data) => ({ getFlag: () => data });

describe("readGroundwork / groundworkAt", () => {
    it("lit la carte et la valeur d'un Hex", () => {
        const scene = sceneWith({ "3,4": 2 });
        expect(readGroundwork(scene)).toEqual({ "3,4": 2 });
        expect(groundworkAt(scene, { i: 3, j: 4 })).toBe(2);
        expect(groundworkAt(scene, { i: 0, j: 0 })).toBe(0);
    });
});

describe("resolveGroundwork", () => {
    it("accumule sous le coût sans déclencher", () => {
        expect(resolveGroundwork(0, 1, 2)).toEqual({ count: 1, discount: false });
    });
    it("déclenche et remet à 0 au seuil", () => {
        expect(resolveGroundwork(1, 1, 2)).toEqual({ count: 0, discount: true });
        expect(resolveGroundwork(0, 2, 2)).toEqual({ count: 0, discount: true });
    });
    it("plancher à 0 sur delta négatif", () => {
        expect(resolveGroundwork(0, -1, 2)).toEqual({ count: 0, discount: false });
    });
});

describe("buildSetGroundwork / buildClearAllGroundwork", () => {
    it("écrit la valeur, supprime la clé à 0", () => {
        expect(buildSetGroundwork("3,4", 2)).toEqual({
            "flags.forgotten-woods-brasigen.groundwork.3,4": 2
        });
        expect(buildSetGroundwork("3,4", 0)).toEqual({
            "flags.forgotten-woods-brasigen.groundwork.-=3,4": null
        });
    });
    it("clear-all : {} si rien, sinon suppression du flag", () => {
        expect(buildClearAllGroundwork(sceneWith({}))).toEqual({});
        expect(buildClearAllGroundwork(sceneWith({ "1,1": 1 }))).toEqual({
            "flags.forgotten-woods-brasigen.-=groundwork": null
        });
    });
});
