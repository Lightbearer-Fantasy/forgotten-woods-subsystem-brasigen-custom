import { describe, it, expect } from "vitest";
import { activityDisabled } from "../scripts/data/activity-gating.js";

const base = {
    craftingTrained: true, medicineTrained: true, campPresent: true,
    ingredientCount: 4, characterCount: 4, hasCharacter: true
};

describe("activityDisabled", () => {
    it("Fabriquer grisé si pas Entraîné Artisanat", () => {
        expect(activityDisabled({ id: "craft" }, { ...base, craftingTrained: false })).toBe(true);
    });
    it("Fabriquer grisé si pas de camp", () => {
        expect(activityDisabled({ id: "craft" }, { ...base, campPresent: false })).toBe(true);
    });
    it("Fabriquer actif si Entraîné + camp", () => {
        expect(activityDisabled({ id: "craft" }, base)).toBe(false);
    });
    it("Fabriquer : pas de grisage proficiency sans personnage assigné (camp présent)", () => {
        expect(activityDisabled({ id: "craft" }, { ...base, hasCharacter: false, craftingTrained: false })).toBe(false);
    });
    it("Réparer jamais grisé", () => {
        expect(activityDisabled({ id: "repair" }, { ...base, campPresent: false })).toBe(false);
    });
    it("Soigner les blessures grisé si pas Entraîné Médecine", () => {
        expect(activityDisabled({ id: "treat-wounds" }, { ...base, medicineTrained: false })).toBe(true);
    });
    it("Soigner : pas de grisage sans personnage assigné", () => {
        expect(activityDisabled({ id: "treat-wounds" }, { ...base, hasCharacter: false, medicineTrained: false })).toBe(false);
    });
    it("Cuisiner grisé sans camp", () => {
        expect(activityDisabled({ id: "cook" }, { ...base, campPresent: false })).toBe(true);
    });
    it("Cuisiner grisé si ingrédients < personnages", () => {
        expect(activityDisabled({ id: "cook" }, { ...base, ingredientCount: 3, characterCount: 4 })).toBe(true);
    });
    it("Cuisiner actif si camp + ingrédients suffisants", () => {
        expect(activityDisabled({ id: "cook" }, { ...base, ingredientCount: 4, characterCount: 4 })).toBe(false);
    });
    it("Se reposer grisé sans camp", () => {
        expect(activityDisabled({ id: "rest" }, { ...base, campPresent: false })).toBe(true);
        expect(activityDisabled({ id: "rest" }, base)).toBe(false);
    });
    it("activité quelconque jamais grisée", () => {
        expect(activityDisabled({ id: "scout" }, { ...base, campPresent: false })).toBe(false);
    });
    it("MJ (isGM) : jamais grisé, même sans camp ni proficiency ni ingrédients", () => {
        const gm = { ...base, isGM: true, campPresent: false, craftingTrained: false, medicineTrained: false, ingredientCount: 0 };
        expect(activityDisabled({ id: "craft" }, gm)).toBe(false);
        expect(activityDisabled({ id: "cook" }, gm)).toBe(false);
        expect(activityDisabled({ id: "rest" }, gm)).toBe(false);
        expect(activityDisabled({ id: "treat-wounds" }, gm)).toBe(false);
    });
    it("Monter le camp grisé si un camp est déjà présent", () => {
        expect(activityDisabled({ id: "make-camp" }, { ...base, campPresent: true })).toBe(true);
    });
    it("Monter le camp actif s'il n'y a pas de camp", () => {
        expect(activityDisabled({ id: "make-camp" }, { ...base, campPresent: false })).toBe(false);
    });
    it("Monter le camp jamais grisé pour le MJ, même avec un camp", () => {
        expect(activityDisabled({ id: "make-camp" }, { ...base, isGM: true, campPresent: true })).toBe(false);
    });
});

describe("activityDisabled — prepare-ground", () => {
    const act = { id: "prepare-ground" };
    it("grisé si le Hex Party a moins de 2 PC", () => {
        expect(activityDisabled(act, { hasCharacter: true, partyPoints: 1 })).toBe(true);
    });
    it("actif si le Hex Party a au moins 2 PC", () => {
        expect(activityDisabled(act, { hasCharacter: true, partyPoints: 2 })).toBe(false);
    });
    it("jamais grisé pour le MJ", () => {
        expect(activityDisabled(act, { isGM: true, partyPoints: 0 })).toBe(false);
    });
});
