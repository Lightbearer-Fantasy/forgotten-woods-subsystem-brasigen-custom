import { describe, it, expect } from "vitest";
import { toggleActiveStates } from "../scripts/mapping/mapping-points-controller.js";

// L'invariant violé par le bug v0.3.0 : en mode "pc", le toggle DC devait
// rester actif (bouton allumé) sans effet. L'état des deux toggles doit
// dériver exactement du mode (exclusivité au niveau des boutons).
describe("toggleActiveStates", () => {
    it("mode pc → seul le toggle PC est actif", () => {
        expect(toggleActiveStates("pc")).toEqual({ pc: true, dc: false });
    });
    it("mode dc → seul le toggle DC est actif", () => {
        expect(toggleActiveStates("dc")).toEqual({ pc: false, dc: true });
    });
    it("mode none → aucun toggle actif", () => {
        expect(toggleActiveStates("none")).toEqual({ pc: false, dc: false });
    });
});
