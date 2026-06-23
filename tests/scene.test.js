import { describe, it, expect } from "vitest";
import { isHexScene, isPartyToken, activePartyToken, tokenAtPoint, canvasClickOpensHud } from "../scripts/utils/scene.js";

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

describe("canvasClickOpensHud", () => {
    it("autorise l'ouverture quand l'outil actif est la sélection de jetons", () => {
        expect(canvasClickOpensHud("select")).toBe(true);
    });

    it("bloque l'ouverture sur un outil Hex Controls (selectHex / editPoints)", () => {
        expect(canvasClickOpensHud("selectHex")).toBe(false);
        expect(canvasClickOpensHud("editPoints")).toBe(false);
    });

    it("bloque l'ouverture pour tout autre outil ou un outil absent", () => {
        expect(canvasClickOpensHud("ruler")).toBe(false);
        expect(canvasClickOpensHud(undefined)).toBe(false);
        expect(canvasClickOpensHud(null)).toBe(false);
    });

    it("bloque l'ouverture pendant une sélection de Hex (Fouiller), même outil 'select'", () => {
        expect(canvasClickOpensHud("select", true)).toBe(false);
        expect(canvasClickOpensHud("select", false)).toBe(true);
    });
});

describe("tokenAtPoint", () => {
    // Token couvrant le rectangle [100,200) en x et [100,180) en y.
    const token = (overrides = {}) => ({ bounds: { x: 100, y: 100, width: 100, height: 80 }, ...overrides });

    it("renvoie le token dont les bornes contiennent le point", () => {
        const t = token();
        expect(tokenAtPoint({ x: 150, y: 140 }, [t])).toBe(t);
    });

    it("inclut le coin haut-gauche et exclut les bords bas-droite (demi-ouvert)", () => {
        const t = token();
        expect(tokenAtPoint({ x: 100, y: 100 }, [t])).toBe(t); // coin inclus
        expect(tokenAtPoint({ x: 200, y: 140 }, [t])).toBeNull(); // bord droit exclu
        expect(tokenAtPoint({ x: 150, y: 180 }, [t])).toBeNull(); // bord bas exclu
    });

    it("renvoie null quand le point est hors de tous les tokens", () => {
        expect(tokenAtPoint({ x: 0, y: 0 }, [token()])).toBeNull();
    });

    it("renvoie le premier token contenant le point en cas de chevauchement", () => {
        const a = token();
        const b = token();
        expect(tokenAtPoint({ x: 150, y: 140 }, [a, b])).toBe(a);
    });

    it("ignore les tokens sans bornes", () => {
        const t = token();
        expect(tokenAtPoint({ x: 150, y: 140 }, [{}, { bounds: null }, t])).toBe(t);
    });

    it("renvoie null pour un point absent ou une liste vide/absente", () => {
        expect(tokenAtPoint(null, [token()])).toBeNull();
        expect(tokenAtPoint({ x: 150, y: 140 }, [])).toBeNull();
        expect(tokenAtPoint({ x: 150, y: 140 })).toBeNull();
    });
});
