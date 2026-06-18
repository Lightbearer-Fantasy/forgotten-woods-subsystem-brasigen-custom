import { describe, it, expect } from "vitest";
import { isHexScene, isPartyToken, activePartyToken } from "../scripts/utils/scene.js";

const party = () => ({ actor: { type: "party" } });
const pc = () => ({ actor: { type: "character" } });

describe("isHexScene", () => {
    it("est vrai pour les 4 types de grille hexagonale (2,3,4,5)", () => {
        for (const type of [2, 3, 4, 5]) {
            expect(isHexScene({ grid: { type } })).toBe(true);
        }
    });

    it("est faux pour gridless (0) et carré (1)", () => {
        expect(isHexScene({ grid: { type: 0 } })).toBe(false);
        expect(isHexScene({ grid: { type: 1 } })).toBe(false);
    });

    it("est faux pour une scène nulle ou sans grille", () => {
        expect(isHexScene(null)).toBe(false);
        expect(isHexScene({})).toBe(false);
    });
});

describe("isPartyToken", () => {
    it("est vrai quand l'acteur est de type party", () => {
        expect(isPartyToken({ actor: { type: "party" } })).toBe(true);
    });

    it("est faux pour les autres types d'acteur", () => {
        expect(isPartyToken({ actor: { type: "character" } })).toBe(false);
        expect(isPartyToken({ actor: { type: "npc" } })).toBe(false);
    });

    it("est faux quand token ou actor est absent", () => {
        expect(isPartyToken(null)).toBe(false);
        expect(isPartyToken({})).toBe(false);
    });
});

describe("activePartyToken", () => {
    it("renvoie le Token Party quand il est le seul token contrôlé (MJ/propriétaire)", () => {
        const p = party();
        expect(activePartyToken({ controlled: [p], hovered: null })).toBe(p);
    });

    it("renvoie null si le seul token contrôlé n'est pas un Token Party", () => {
        expect(activePartyToken({ controlled: [pc()], hovered: null })).toBeNull();
    });

    it("renvoie null pour une multi-sélection, même si elle contient le Token Party (comportement MJ inchangé)", () => {
        const p = party();
        expect(activePartyToken({ controlled: [p, pc()], hovered: p })).toBeNull();
    });

    it("renvoie le Token Party survolé quand aucun token n'est contrôlé (joueur non-propriétaire)", () => {
        const p = party();
        expect(activePartyToken({ controlled: [], hovered: p })).toBe(p);
    });

    it("renvoie le Token Party survolé même si le joueur garde son propre token sélectionné", () => {
        const p = party();
        expect(activePartyToken({ controlled: [pc()], hovered: p })).toBe(p);
    });

    it("ignore le survol si le Token Party survolé est déjà contrôlé (pas de double-déclenchement)", () => {
        const p = party();
        expect(activePartyToken({ controlled: [p, pc()], hovered: p })).toBeNull();
    });

    it("renvoie null quand le token survolé n'est pas un Token Party", () => {
        expect(activePartyToken({ controlled: [], hovered: pc() })).toBeNull();
    });

    it("renvoie null sans contrôle ni survol", () => {
        expect(activePartyToken({ controlled: [], hovered: null })).toBeNull();
        expect(activePartyToken()).toBeNull();
    });
});
