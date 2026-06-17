import { describe, it, expect, vi, afterEach } from "vitest";
import { HexSelection } from "../scripts/canvas/hex-selection.js";

// Pas de canvas global -> le rendu de surbrillance est un no-op (garde interne).
afterEach(() => {
    delete globalThis.canvas;
});

describe("HexSelection", () => {
    it("démarre sans sélection", () => {
        const sel = new HexSelection();
        expect(sel.get()).toBeNull();
        expect(sel.has({ i: 0, j: 0 })).toBe(false);
    });

    it("select définit l'offset et le notifie", () => {
        const sel = new HexSelection();
        const cb = vi.fn();
        sel.onChange(cb);
        sel.select({ i: 2, j: 3 });
        expect(sel.get()).toEqual({ i: 2, j: 3 });
        expect(sel.has({ i: 2, j: 3 })).toBe(true);
        expect(sel.has({ i: 0, j: 0 })).toBe(false);
        expect(cb).toHaveBeenCalledWith({ i: 2, j: 3 });
    });

    it("un nouveau select remplace l'ancien", () => {
        const sel = new HexSelection();
        sel.select({ i: 1, j: 1 });
        sel.select({ i: 4, j: 5 });
        expect(sel.get()).toEqual({ i: 4, j: 5 });
        expect(sel.has({ i: 1, j: 1 })).toBe(false);
    });

    it("clear désélectionne et notifie null", () => {
        const sel = new HexSelection();
        const cb = vi.fn();
        sel.select({ i: 1, j: 1 });
        sel.onChange(cb);
        sel.clear();
        expect(sel.get()).toBeNull();
        expect(cb).toHaveBeenCalledWith(null);
    });

    it("notifie tous les abonnés", () => {
        const sel = new HexSelection();
        const a = vi.fn();
        const b = vi.fn();
        sel.onChange(a);
        sel.onChange(b);
        sel.select({ i: 0, j: 0 });
        expect(a).toHaveBeenCalledTimes(1);
        expect(b).toHaveBeenCalledTimes(1);
    });
});
