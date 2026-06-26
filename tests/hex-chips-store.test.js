import { describe, it, expect } from "vitest";
import {
    readChips, chipsAt, buildApplyChip, buildRemoveChip, buildClearAllChips,
    MODULE_ID, CHIPS_FLAG
} from "../scripts/mapping/hex-chips-store.js";

const sceneWith = (data) => ({
    getFlag: (m, f) => (m === MODULE_ID && f === CHIPS_FLAG ? data : undefined)
});
const base = `flags.${MODULE_ID}.${CHIPS_FLAG}`;

describe("readChips / chipsAt", () => {
    it("{} si pas de flag", () => {
        expect(readChips(sceneWith(undefined))).toEqual({});
    });
    it("lit les chips d'un Hex", () => {
        const scene = sceneWith({ "1,1": ["foret", "ancre"] });
        expect(chipsAt(scene, { i: 1, j: 1 })).toEqual(["foret", "ancre"]);
        expect(chipsAt(scene, { i: 9, j: 9 })).toEqual([]);
    });
});

describe("buildApplyChip", () => {
    it("applique un terrain à plusieurs Hex (remplace l'éventuel terrain)", () => {
        const scene = sceneWith({ "2,2": ["marais"] });
        expect(buildApplyChip(scene, ["1,1", "2,2"], "plaines")).toEqual({
            [`${base}.1,1`]: ["plaines"],
            [`${base}.2,2`]: ["plaines"]
        });
    });
    it("ajoute un marqueur en gardant le terrain", () => {
        const scene = sceneWith({ "1,1": ["foret"] });
        expect(buildApplyChip(scene, ["1,1"], "ancre")).toEqual({
            [`${base}.1,1`]: ["foret", "ancre"]
        });
    });
    it("chip unique : retiré des autres Hex d'abord (clé vidée → supprimée)", () => {
        const scene = sceneWith({ "1,1": ["orme-blanc"], "2,2": ["foret"] });
        expect(buildApplyChip(scene, ["2,2"], "orme-blanc")).toEqual({
            [`${base}.-=1,1`]: null,
            [`${base}.2,2`]: ["foret", "orme-blanc"]
        });
    });
    it("chip unique : conserve les autres chips de l'Hex source", () => {
        const scene = sceneWith({ "1,1": ["foret", "orme-blanc"] });
        expect(buildApplyChip(scene, ["3,3"], "orme-blanc")).toEqual({
            [`${base}.1,1`]: ["foret"],
            [`${base}.3,3`]: ["orme-blanc"]
        });
    });
});

describe("buildRemoveChip", () => {
    it("retire un chip d'un Hex", () => {
        const scene = sceneWith({ "1,1": ["foret", "ancre"] });
        expect(buildRemoveChip(scene, { i: 1, j: 1 }, "ancre")).toEqual({
            [`${base}.1,1`]: ["foret"]
        });
    });
    it("supprime la clé si la liste devient vide", () => {
        const scene = sceneWith({ "1,1": ["ancre"] });
        expect(buildRemoveChip(scene, { i: 1, j: 1 }, "ancre")).toEqual({
            [`${base}.-=1,1`]: null
        });
    });
    it("no-op ({}) si le chip est absent", () => {
        const scene = sceneWith({ "1,1": ["foret"] });
        expect(buildRemoveChip(scene, { i: 1, j: 1 }, "ancre")).toEqual({});
    });
});

describe("buildClearAllChips", () => {
    it("supprime tout le flag s'il existe", () => {
        const scene = sceneWith({ "1,1": ["foret"] });
        expect(buildClearAllChips(scene)).toEqual({
            [`flags.${MODULE_ID}.-=${CHIPS_FLAG}`]: null
        });
    });
    it("{} si rien", () => {
        expect(buildClearAllChips(sceneWith({}))).toEqual({});
        expect(buildClearAllChips(sceneWith(undefined))).toEqual({});
    });
});
