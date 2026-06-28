import { describe, it, expect } from "vitest";
import { INDIVIDUAL_ACTIVITIES } from "../scripts/data/activities.js";

describe("Chasser et cueillir", () => {
    it("propose Nature, Survival et Hunting Lore", () => {
        const act = INDIVIDUAL_ACTIVITIES.find((a) => a.id === "hunt-and-gather");
        expect(act.check.skills).toEqual(["nature", "survival", "hunting-lore"]);
    });
});
