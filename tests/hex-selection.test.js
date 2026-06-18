import { describe, it, expect, vi, afterEach } from "vitest";
import { HexSelection } from "../scripts/canvas/hex-selection.js";

afterEach(() => {
    delete globalThis.canvas;
});

describe("HexSelection", () => {
    it("démarre vide", () => {
        const sel = new HexSelection();
        expect(sel.get()).toBeNull();
        expect(sel.getAll()).toEqual([]);
        expect(sel.has({ i: 0, j: 0 })).toBe(false);
    });

    it("select définit un seul hex (mono) et notifie la collection", () => {
        const sel = new HexSelection();
        const cb = vi.fn();
        sel.onChange(cb);
        sel.select({ i: 2, j: 3 });
        expect(sel.get()).toEqual({ i: 2, j: 3 });
        expect(sel.getAll()).toEqual([{ i: 2, j: 3 }]);
        expect(sel.has({ i: 2, j: 3 })).toBe(true);
        expect(cb).toHaveBeenCalledWith([{ i: 2, j: 3 }]);
    });

    it("select remplace la sélection courante", () => {
        const sel = new HexSelection();
        sel.select({ i: 1, j: 1 });
        sel.select({ i: 4, j: 5 });
        expect(sel.getAll()).toEqual([{ i: 4, j: 5 }]);
        expect(sel.has({ i: 1, j: 1 })).toBe(false);
    });

    it("toggle ajoute puis retire le même hex", () => {
        const sel = new HexSelection();
        sel.toggle({ i: 1, j: 1 });
        sel.toggle({ i: 2, j: 2 });
        expect(sel.getAll()).toEqual([{ i: 1, j: 1 }, { i: 2, j: 2 }]);
        sel.toggle({ i: 1, j: 1 });
        expect(sel.has({ i: 1, j: 1 })).toBe(false);
        expect(sel.getAll()).toEqual([{ i: 2, j: 2 }]);
    });

    it("add / remove gèrent la collection", () => {
        const sel = new HexSelection();
        sel.add({ i: 0, j: 0 });
        sel.add({ i: 0, j: 0 }); // idempotent
        sel.add({ i: 1, j: 0 });
        expect(sel.getAll()).toEqual([{ i: 0, j: 0 }, { i: 1, j: 0 }]);
        sel.remove({ i: 0, j: 0 });
        expect(sel.getAll()).toEqual([{ i: 1, j: 0 }]);
    });

    it("set remplace toute la collection", () => {
        const sel = new HexSelection();
        sel.add({ i: 9, j: 9 });
        sel.set([{ i: 1, j: 1 }, { i: 2, j: 2 }]);
        expect(sel.getAll()).toEqual([{ i: 1, j: 1 }, { i: 2, j: 2 }]);
        expect(sel.has({ i: 9, j: 9 })).toBe(false);
    });

    it("clear vide et notifie []", () => {
        const sel = new HexSelection();
        const cb = vi.fn();
        sel.add({ i: 1, j: 1 });
        sel.onChange(cb);
        sel.clear();
        expect(sel.getAll()).toEqual([]);
        expect(sel.get()).toBeNull();
        expect(cb).toHaveBeenCalledWith([]);
    });

    it("notifie tous les abonnés", () => {
        const sel = new HexSelection();
        const a = vi.fn();
        const b = vi.fn();
        sel.onChange(a);
        sel.onChange(b);
        sel.toggle({ i: 0, j: 0 });
        expect(a).toHaveBeenCalledTimes(1);
        expect(b).toHaveBeenCalledTimes(1);
    });
});
