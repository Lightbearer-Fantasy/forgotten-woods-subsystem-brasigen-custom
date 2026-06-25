import { describe, it, expect } from "vitest";
import { resolveCombatScene } from "../scripts/mapping/combat-scene.js";

const scene = (name) => ({ name });
const combatant = (s) => ({ token: { parent: s } });

describe("resolveCombatScene", () => {
    it("renvoie combat.scene quand il est défini", () => {
        const s = scene("Hex Test");
        expect(resolveCombatScene({ scene: s, combatants: [] })).toBe(s);
    });
    it("replie sur la scène des combattants quand combat.scene est null", () => {
        const s = scene("Hex Test");
        expect(resolveCombatScene({ scene: null, combatants: [combatant(s)] })).toBe(s);
    });
    it("ignore les combattants sans token et prend le premier exploitable", () => {
        const s = scene("Hex Test");
        const combat = { scene: null, combatants: [{ token: null }, combatant(s)] };
        expect(resolveCombatScene(combat)).toBe(s);
    });
    it("renvoie null si ni scène ni combattant exploitable", () => {
        expect(resolveCombatScene({ scene: null, combatants: [] })).toBeNull();
        expect(resolveCombatScene({ scene: null, combatants: [{ token: null }] })).toBeNull();
        expect(resolveCombatScene(null)).toBeNull();
    });
});
