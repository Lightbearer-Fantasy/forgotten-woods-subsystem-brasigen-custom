import { describe, it, expect } from "vitest";
import { weGridDataChanged } from "../scripts/utils/scene.js";

describe("weGridDataChanged", () => {
    it("détecte un ajout de gridData", () => {
        expect(weGridDataChanged({ flags: { "world-explorer": { gridData: { "27_14": { reveal: true } } } } })).toBe(true);
    });
    it("détecte un retrait de gridData", () => {
        expect(weGridDataChanged({ flags: { "world-explorer": { gridData: { "-=27_14": null } } } })).toBe(true);
    });
    it("faux pour un autre flag World Explorer", () => {
        expect(weGridDataChanged({ flags: { "world-explorer": { opacityGM: 0.5 } } })).toBe(false);
    });
    it("faux sans flag World Explorer", () => {
        expect(weGridDataChanged({ flags: { "forgotten-woods-brasigen": { hexChips: {} } } })).toBe(false);
        expect(weGridDataChanged({})).toBe(false);
        expect(weGridDataChanged(null)).toBe(false);
    });
});
