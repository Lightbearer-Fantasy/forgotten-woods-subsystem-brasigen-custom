import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RecallKnowledgeFlow } from "../scripts/mapping/recall-knowledge-flow.js";

afterEach(() => { delete globalThis.game; delete globalThis.ui; });

describe("RecallKnowledgeFlow.start", () => {
    it("ne fait rien sans acteur", async () => {
        globalThis.game = { modules: { get: () => null } };
        await expect(RecallKnowledgeFlow.start(null)).resolves.toBeUndefined();
    });

    it("avertit si l'API pf2e-hud est absente", async () => {
        const warn = vi.fn();
        globalThis.ui = { notifications: { warn } };
        globalThis.game = { modules: { get: () => ({ api: {} }) },
            i18n: { localize: (k) => k } };
        await RecallKnowledgeFlow.start({ id: "a" });
        expect(warn).toHaveBeenCalledWith("FORGOTTEN_WOODS.skillCheck.noRK");
    });

    it("appelle rollRecallKnowledge deux fois avec l'acteur", async () => {
        const roll = vi.fn().mockResolvedValue(undefined);
        globalThis.game = { modules: { get: () => ({ api: { actions: { rollRecallKnowledge: roll } } }) },
            i18n: { localize: (k) => k } };
        const actor = { id: "hero" };
        await RecallKnowledgeFlow.start(actor);
        expect(roll).toHaveBeenCalledTimes(2);
        expect(roll).toHaveBeenNthCalledWith(1, actor);
        expect(roll).toHaveBeenNthCalledWith(2, actor);
    });
});
