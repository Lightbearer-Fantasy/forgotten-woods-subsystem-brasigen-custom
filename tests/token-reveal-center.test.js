import { describe, it, expect } from "vitest";
import { tokenRevealCenter } from "../scripts/utils/scene.js";

// gridSize = 100 → demi-grid = 50.
describe("tokenRevealCenter", () => {
    it("utilise la position NEUVE du payload de changement, pas le document périmé", () => {
        const doc = { x: 0, y: 0 };        // ancienne position (encore dans le doc au hook)
        const changes = { x: 300, y: 200 }; // nouvelle position
        expect(tokenRevealCenter(doc, changes, 100)).toEqual({ x: 350, y: 250 });
    });

    it("retombe sur le document quand un axe n'a pas changé", () => {
        const doc = { x: 100, y: 100 };
        expect(tokenRevealCenter(doc, { y: 400 }, 100)).toEqual({ x: 150, y: 450 });
        expect(tokenRevealCenter(doc, { x: 400 }, 100)).toEqual({ x: 450, y: 150 });
    });

    it("sans changes, utilise le document", () => {
        expect(tokenRevealCenter({ x: 0, y: 0 }, null, 100)).toEqual({ x: 50, y: 50 });
    });
});
