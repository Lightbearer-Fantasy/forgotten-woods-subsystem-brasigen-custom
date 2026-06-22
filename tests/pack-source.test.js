import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { HUSTLE_EFFECT_UUID, COOK_EFFECT_UUID } from "../scripts/data/module-effects.js";

const read = (rel) => JSON.parse(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8"));
const manifest = read("../module.json");
const hustle = read("../packs/_source/effects/effet-s-empresser.json");
const cook = read("../packs/_source/effects/effet-cuisiner.json");

describe("compendium d'effets — manifest", () => {
    it("module.json déclare le pack effects (Item, system pf2e)", () => {
        const pack = (manifest.packs ?? []).find((p) => p.name === "effects");
        expect(pack).toBeTruthy();
        expect(pack.type).toBe("Item");
        expect(pack.system).toBe("pf2e");
        expect(pack.path).toBe("packs/effects");
    });
});

describe("compendium d'effets — sources", () => {
    it("Effet: S'empresser : _id 16 car., type effect, flag hustle, duration unlimited", () => {
        expect(hustle._id).toHaveLength(16);
        expect(hustle.type).toBe("effect");
        expect(hustle.name).toBe("Effet: S'empresser");
        expect(hustle.flags["forgotten-woods-brasigen"].effect).toBe("hustle");
        expect(hustle.system.duration.unit).toBe("unlimited");
        expect(hustle.system.rules).toEqual([]);
    });
    it("Effet: Cuisiner : _id 16 car., type effect, flag cook, duration unlimited", () => {
        expect(cook._id).toHaveLength(16);
        expect(cook.type).toBe("effect");
        expect(cook.name).toBe("Effet: Cuisiner");
        expect(cook.flags["forgotten-woods-brasigen"].effect).toBe("cook");
        expect(cook.system.duration.unit).toBe("unlimited");
        expect(cook.system.rules).toEqual([]);
    });
});

describe("compendium d'effets — _key (sinon foundryvtt-cli ignore la source → pack vide)", () => {
    it("chaque source a _key === !items!<_id>", () => {
        expect(hustle._key).toBe(`!items!${hustle._id}`);
        expect(cook._key).toBe(`!items!${cook._id}`);
    });
    it("les UUID de module-effects.js pointent sur les _id des sources", () => {
        expect(HUSTLE_EFFECT_UUID.endsWith(`.Item.${hustle._id}`)).toBe(true);
        expect(COOK_EFFECT_UUID.endsWith(`.Item.${cook._id}`)).toBe(true);
    });
});
