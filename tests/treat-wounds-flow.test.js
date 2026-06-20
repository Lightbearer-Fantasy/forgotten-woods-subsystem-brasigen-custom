import { describe, it, expect, vi, afterEach } from "vitest";
import { TreatWoundsFlow } from "../scripts/mapping/treat-wounds-flow.js";

afterEach(() => { delete globalThis.game; delete globalThis.ui; });

describe("TreatWoundsFlow.start", () => {
    it("ne fait rien sans acteur", async () => {
        await expect(TreatWoundsFlow.start(null)).resolves.toBeUndefined();
    });

    it("avertit si l'API pf2e-hud est absente", async () => {
        const warn = vi.fn();
        globalThis.ui = { notifications: { warn } };
        globalThis.game = { hud: { api: {} }, i18n: { localize: (k) => k } };
        await TreatWoundsFlow.start({ id: "a" });
        expect(warn).toHaveBeenCalledWith("FORGOTTEN_WOODS.skillCheck.noTreatWounds");
    });

    it("appelle treatWounds une fois avec l'acteur", async () => {
        const tw = vi.fn().mockResolvedValue(undefined);
        globalThis.game = { hud: { api: { actions: { treatWounds: tw } } }, i18n: { localize: (k) => k } };
        const actor = { id: "hero" };
        await TreatWoundsFlow.start(actor);
        expect(tw).toHaveBeenCalledTimes(1);
        expect(tw).toHaveBeenCalledWith(actor);
    });
});
