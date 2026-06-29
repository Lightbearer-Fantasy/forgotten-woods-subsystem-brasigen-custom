import { describe, it, expect } from "vitest";
import { allyChoices } from "../scripts/mapping/aid-targets.js";

const party = {
    members: [
        { id: "a", type: "character", name: "Alice" },
        { id: "b", type: "character", name: "Bob" },
        { id: "c", type: "character", name: "Carol" },
        { id: "x", type: "loot", name: "Coffre" }
    ]
};

describe("allyChoices", () => {
    it("exclut le lanceur et les non-personnages", () => {
        expect(allyChoices(party, "a")).toEqual([
            { id: "b", name: "Bob" },
            { id: "c", name: "Carol" }
        ]);
    });
    it("exclut aussi les alliés déjà aidés", () => {
        expect(allyChoices(party, "a", ["b"])).toEqual([{ id: "c", name: "Carol" }]);
    });
    it("Party d'un seul PJ : aucun allié", () => {
        expect(allyChoices({ members: [{ id: "a", type: "character", name: "Alice" }] }, "a")).toEqual([]);
    });
    it("party sans members : liste vide", () => {
        expect(allyChoices(undefined, "a")).toEqual([]);
    });
});
