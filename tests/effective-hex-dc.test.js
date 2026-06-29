import { describe, it, expect } from "vitest";
import { effectiveHexDc } from "../scripts/mapping/mapping-dc-store.js";

const MODULE_ID = "forgotten-woods-brasigen";
// Stub de scène : getFlag(module, flag) -> map "i,j" -> valeur.
function scene({ dc = {}, points = {} } = {}) {
    return {
        getFlag(mod, flag) {
            if (mod !== MODULE_ID) return undefined;
            if (flag === "mappingDC") return dc;
            if (flag === "mappingPoints") return points;
            return undefined;
        }
    };
}
const off = { i: 1, j: 2 };
const KEY = "1,2";

describe("effectiveHexDc", () => {
    it("DC de base inchangé si moins de 2 PC", () => {
        const s = scene({ dc: { [KEY]: 15 }, points: { [KEY]: 1 } });
        expect(effectiveHexDc(s, off)).toBe(15);
    });
    it("DC réduit de 2 si 2 PC ou plus", () => {
        const s = scene({ dc: { [KEY]: 15 }, points: { [KEY]: 2 } });
        expect(effectiveHexDc(s, off)).toBe(13);
    });
    it("réduction aussi à 4 PC", () => {
        const s = scene({ dc: { [KEY]: 15 }, points: { [KEY]: 4 } });
        expect(effectiveHexDc(s, off)).toBe(13);
    });
    it("dynamic:false ignore les PC (cas Cuisiner)", () => {
        const s = scene({ dc: { [KEY]: 15 }, points: { [KEY]: 4 } });
        expect(effectiveHexDc(s, off, { dynamic: false })).toBe(15);
    });
    it("0 si aucun DC défini", () => {
        const s = scene({ points: { [KEY]: 4 } });
        expect(effectiveHexDc(s, off)).toBe(0);
    });
});
