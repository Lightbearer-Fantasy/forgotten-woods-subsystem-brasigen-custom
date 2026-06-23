// tests/craft-logic.test.js
import { describe, it, expect } from "vitest";
import { craftMaterialCost, craftMaterialConsumption, craftExceedsLevel, temporaryItemName, isCraftContext, craftOutcomeText } from "../scripts/mapping/craft-logic.js";
import { INDIVIDUAL_ACTIVITIES } from "../scripts/data/activities.js";

describe("craftMaterialCost", () => {
    it("objet de niveau −2 ou moins → 3", () => {
        expect(craftMaterialCost(3, 5)).toBe(3); // 5-3 = 2
    });
    it("objet de niveau −1 → 5", () => {
        expect(craftMaterialCost(4, 5)).toBe(5); // 5-4 = 1
    });
    it("objet de votre niveau → 5", () => {
        expect(craftMaterialCost(5, 5)).toBe(5);
    });
    it("objet au-dessus de votre niveau → 5", () => {
        expect(craftMaterialCost(8, 5)).toBe(5);
    });
});

describe("craftMaterialConsumption", () => {
    it("réussite : −base", () => {
        expect(craftMaterialConsumption("success", 3)).toBe(-3);
    });
    it("réussite critique : −(base−1)", () => {
        expect(craftMaterialConsumption("criticalSuccess", 5)).toBe(-4);
    });
    it("échec : 0", () => {
        expect(craftMaterialConsumption("failure", 5)).toBe(0);
    });
    it("échec critique : −1", () => {
        expect(craftMaterialConsumption("criticalFailure", 5)).toBe(-1);
    });
});

describe("craftExceedsLevel", () => {
    it("objet au-dessus du niveau du PJ → interdit", () => {
        expect(craftExceedsLevel(22, 1)).toBe(true);
        expect(craftExceedsLevel(2, 1)).toBe(true);
    });
    it("objet du niveau du PJ ou inférieur → autorisé", () => {
        expect(craftExceedsLevel(1, 1)).toBe(false);
        expect(craftExceedsLevel(0, 1)).toBe(false);
        expect(craftExceedsLevel(3, 5)).toBe(false);
    });
});

describe("temporaryItemName", () => {
    it("ajoute le suffixe « (temporaire) »", () => {
        expect(temporaryItemName("Potion de soin")).toBe("Potion de soin (temporaire)");
    });
    it("ne double pas le suffixe si déjà présent", () => {
        expect(temporaryItemName("Potion de soin (temporaire)")).toBe("Potion de soin (temporaire)");
    });
    it("gère un nom vide", () => {
        expect(temporaryItemName("")).toBe(" (temporaire)");
    });
});

describe("isCraftContext", () => {
    // PF2E v14 : le contexte du message ne porte PAS de champ `action` ;
    // l'activité vit dans la roll option « action:craft » de context.options.
    it("vrai si options contient « action:craft »", () => {
        expect(isCraftContext({ type: "skill-check", options: ["self:level:5", "action:craft"] })).toBe(true);
    });
    it("faux si options ne mentionne pas le craft", () => {
        expect(isCraftContext({ type: "skill-check", options: ["action:repair"] })).toBe(false);
    });
    it("faux si options absent", () => {
        expect(isCraftContext({ type: "skill-check" })).toBe(false);
    });
    it("faux pour un contexte nul/indéfini", () => {
        expect(isCraftContext(null)).toBe(false);
        expect(isCraftContext(undefined)).toBe(false);
    });
    it("ne se fie pas au champ `action` (inexistant dans le flag réel)", () => {
        // Même si un hypothétique action:"craft" était présent, c'est options qui fait foi.
        expect(isCraftContext({ action: "craft", options: [] })).toBe(false);
    });
});

describe("craftOutcomeText", () => {
    const craft = INDIVIDUAL_ACTIVITIES.find((a) => a.id === "craft");

    it("renvoie le texte de l'activité maison pour chaque issue définie", () => {
        expect(craftOutcomeText("criticalSuccess")).toBe(craft.outcomes.criticalSuccess);
        expect(craftOutcomeText("success")).toBe(craft.outcomes.success);
        expect(craftOutcomeText("criticalFailure")).toBe(craft.outcomes.criticalFailure);
    });
    it("renvoie null pour l'échec simple (aucun texte d'activité)", () => {
        expect(craftOutcomeText("failure")).toBeNull();
    });
    it("renvoie null pour un outcome inconnu ou absent", () => {
        expect(craftOutcomeText("banana")).toBeNull();
        expect(craftOutcomeText(null)).toBeNull();
        expect(craftOutcomeText(undefined)).toBeNull();
    });
});
