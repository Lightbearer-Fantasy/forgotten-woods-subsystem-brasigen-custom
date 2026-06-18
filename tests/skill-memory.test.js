import { describe, it, expect, vi } from "vitest";
import {
    readDefault, effectiveDefault, writeDefault, MODULE_ID, SKILL_FLAG
} from "../scripts/data/skill-memory.js";

const actorWith = (skill) => ({
    getFlag: (m, f) => (m === MODULE_ID && f === SKILL_FLAG ? skill : undefined),
    setFlag: vi.fn()
});

describe("readDefault", () => {
    it("lit le flag", () => {
        expect(readDefault(actorWith("nature"))).toBe("nature");
    });
    it("null si absent", () => {
        expect(readDefault(actorWith(undefined))).toBe(null);
    });
});

describe("effectiveDefault", () => {
    it("renvoie le flag valide", () => {
        expect(effectiveDefault(actorWith("society"))).toBe("society");
    });
    it("flag absent → première compétence", () => {
        expect(effectiveDefault(actorWith(undefined))).toBe("crafting");
    });
    it("flag invalide → première compétence", () => {
        expect(effectiveDefault(actorWith("acrobatics"))).toBe("crafting");
    });
});

describe("writeDefault", () => {
    it("écrit un slug valide", () => {
        const actor = actorWith(undefined);
        writeDefault(actor, "survival");
        expect(actor.setFlag).toHaveBeenCalledWith(MODULE_ID, SKILL_FLAG, "survival");
    });
    it("ignore un slug invalide", () => {
        const actor = actorWith(undefined);
        writeDefault(actor, "stealth");
        expect(actor.setFlag).not.toHaveBeenCalled();
    });
});
