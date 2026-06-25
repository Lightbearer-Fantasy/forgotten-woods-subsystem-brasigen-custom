import { describe, it, expect } from "vitest";
import {
    roundCountModifier, roundCountColor, roundSymbols,
    partyFatigued, isCookRound,
    FATIGUED_SYMBOL_IMG, COOK_SYMBOL_IMG
} from "../scripts/data/round-effects.js";

const withFatigued = () => ({ itemTypes: { condition: [{ slug: "fatigued" }] } });
const noConditions = () => ({ itemTypes: { condition: [] } });

describe("roundCountModifier", () => {
    it("−2 si fatigued seul", () => expect(roundCountModifier({ fatigued: true, cook: false })).toBe(-2));
    it("+1 si cook seul", () => expect(roundCountModifier({ fatigued: false, cook: true })).toBe(1));
    it("−1 si fatigued ET cook (cumul)", () => expect(roundCountModifier({ fatigued: true, cook: true })).toBe(-1));
    it("0 si aucun", () => expect(roundCountModifier({ fatigued: false, cook: false })).toBe(0));
});

describe("roundCountColor", () => {
    it("0 → white", () => expect(roundCountColor(0)).toBe("white"));
    it(">0 → blue", () => expect(roundCountColor(1)).toBe("blue"));
    it("<0 → red", () => expect(roundCountColor(-2)).toBe("red"));
});

describe("roundSymbols", () => {
    it("vide si aucun effet", () => expect(roundSymbols({ fatigued: false, cook: false })).toEqual([]));
    it("Fatigued puis Cuisiner si les deux", () => {
        const s = roundSymbols({ fatigued: true, cook: true });
        expect(s.map((x) => x.img)).toEqual([FATIGUED_SYMBOL_IMG, COOK_SYMBOL_IMG]);
    });
});

describe("partyFatigued", () => {
    it("vrai si au moins un membre Fatigued", () => expect(partyFatigued([noConditions(), withFatigued()])).toBe(true));
    it("faux si aucun", () => expect(partyFatigued([noConditions(), noConditions()])).toBe(false));
    it("faux si liste vide ou nulle", () => {
        expect(partyFatigued([])).toBe(false);
        expect(partyFatigued(null)).toBe(false);
    });
});

describe("isCookRound", () => {
    const marker = { round: 3, combatId: "abc" };
    it("vrai si round ET combatId correspondent", () => expect(isCookRound(marker, 3, "abc")).toBe(true));
    it("faux si round différent", () => expect(isCookRound(marker, 4, "abc")).toBe(false));
    it("faux si combatId différent", () => expect(isCookRound(marker, 3, "xyz")).toBe(false));
    it("faux si pas de combat (round null)", () => expect(isCookRound(marker, null, "abc")).toBe(false));
    it("faux si combatId null", () => expect(isCookRound(marker, 3, null)).toBe(false));
    it("faux si marqueur undefined", () => expect(isCookRound(undefined, 3, "abc")).toBe(false));
    it("faux si marqueur null", () => expect(isCookRound(null, 3, "abc")).toBe(false));
});
