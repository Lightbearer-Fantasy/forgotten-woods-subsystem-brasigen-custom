import { describe, it, expect } from "vitest";
import { lockIsFree } from "../scripts/mapping/map-lock.js";

describe("lockIsFree", () => {
    it("libre si aucun verrou", () => {
        expect(lockIsFree(null, 1000, 120000)).toBe(true);
    });
    it("occupé si verrou récent", () => {
        expect(lockIsFree({ userId: "u", timestamp: 1000 }, 1000, 120000)).toBe(false);
    });
    it("libre si verrou expiré", () => {
        expect(lockIsFree({ userId: "u", timestamp: 0 }, 130000, 120000)).toBe(true);
    });
    it("timeout par défaut = 120000", () => {
        expect(lockIsFree({ userId: "u", timestamp: 0 }, 130000)).toBe(true);
        expect(lockIsFree({ userId: "u", timestamp: 0 }, 100000)).toBe(false);
    });
});
