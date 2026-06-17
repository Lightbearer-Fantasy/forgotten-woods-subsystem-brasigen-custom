import { describe, it, expect } from "vitest";
import {
    slowestLandSpeed,
    groupActivityCount,
    groupCountColor,
    characterCount
} from "../scripts/hud/party-counts.js";

const member = (type, speed) => ({ type, system: { attributes: { speed: { value: speed } } } });
const party = (...members) => ({ members });

describe("slowestLandSpeed", () => {
    it("renvoie la plus petite Speed parmi les PJ (type character)", () => {
        expect(slowestLandSpeed(party(member("character", 25), member("character", 20)))).toBe(20);
    });
    it("ignore les membres non-character", () => {
        expect(slowestLandSpeed(party(member("character", 30), member("npc", 10)))).toBe(30);
    });
    it("ignore les Speed absentes ou nulles", () => {
        const m = { type: "character", system: { attributes: { speed: {} } } };
        expect(slowestLandSpeed(party(m, member("character", 25)))).toBe(25);
    });
    it("renvoie null si aucun PJ exploitable", () => {
        expect(slowestLandSpeed(party(member("npc", 20)))).toBeNull();
        expect(slowestLandSpeed(party())).toBeNull();
        expect(slowestLandSpeed(null)).toBeNull();
    });
});

describe("groupActivityCount", () => {
    it("3 si Speed <= 15", () => {
        expect(groupActivityCount(15)).toBe(3);
        expect(groupActivityCount(5)).toBe(3);
    });
    it("4 si Speed entre 16 et 29 (20, 25)", () => {
        expect(groupActivityCount(16)).toBe(4);
        expect(groupActivityCount(20)).toBe(4);
        expect(groupActivityCount(25)).toBe(4);
        expect(groupActivityCount(29)).toBe(4);
    });
    it("5 si Speed >= 30", () => {
        expect(groupActivityCount(30)).toBe(5);
        expect(groupActivityCount(40)).toBe(5);
    });
    it("repli à 4 si null", () => {
        expect(groupActivityCount(null)).toBe(4);
    });
});

describe("groupCountColor", () => {
    it("mappe 3->red, 4->white, 5->blue", () => {
        expect(groupCountColor(3)).toBe("red");
        expect(groupCountColor(4)).toBe("white");
        expect(groupCountColor(5)).toBe("blue");
    });
});

describe("characterCount", () => {
    it("compte les membres de type character", () => {
        expect(characterCount(party(member("character", 25), member("npc", 10), member("character", 30)))).toBe(2);
    });
    it("0 si party nul ou vide", () => {
        expect(characterCount(null)).toBe(0);
        expect(characterCount(party())).toBe(0);
    });
});
