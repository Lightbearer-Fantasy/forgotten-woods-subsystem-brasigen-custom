import { describe, it, expect } from "vitest";
import {
    aspectOf, buildSetAspect, MODULE_ID, ASPECT_FLAG
} from "../scripts/mapping/aspect-store.js";

const sceneWith = (value) => ({
    getFlag: (m, f) => (m === MODULE_ID && f === ASPECT_FLAG ? value : undefined)
});

describe("aspectOf", () => {
    it("lit l'aspect", () => {
        expect(aspectOf(sceneWith("sauvage"))).toBe("sauvage");
    });
    it("null si absent", () => {
        expect(aspectOf(sceneWith(undefined))).toBe(null);
        expect(aspectOf(sceneWith(""))).toBe(null);
    });
});

describe("buildSetAspect", () => {
    const flagBase = `flags.${MODULE_ID}`;
    it("fixe un aspect", () => {
        expect(buildSetAspect("donjon")).toEqual({
            [`${flagBase}.${ASPECT_FLAG}`]: "donjon"
        });
    });
    it("vide/null → supprime la clé", () => {
        expect(buildSetAspect("")).toEqual({ [`${flagBase}.-=${ASPECT_FLAG}`]: null });
        expect(buildSetAspect(null)).toEqual({ [`${flagBase}.-=${ASPECT_FLAG}`]: null });
    });
});
