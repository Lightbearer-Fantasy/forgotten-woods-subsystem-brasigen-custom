import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (p) => JSON.parse(readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8"));
const fr = read("../lang/fr.json");
const en = read("../lang/en.json");

describe("i18n", () => {
    // en.json est, par convention, la copie française du module (Foundry peut tourner
    // en anglais). Les anglicismes (skills, « Hex », « chip ») sont encodés dans fr.json.
    it("en.json est identique à fr.json", () => {
        expect(en).toEqual(fr);
    });
});
