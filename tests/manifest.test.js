import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const manifest = JSON.parse(
    readFileSync(fileURLToPath(new URL("../module.json", import.meta.url)), "utf8")
);

describe("module.json manifest", () => {
    it("déclare socket: true (requis pour le relais inter-clients de la Cartographie)", () => {
        // Sans cette déclaration, Foundry ne relaie pas game.socket.emit("module.<id>", …)
        // → requestLock/askSkill/rollNow/applyDeltas/startRound échouent côté joueur.
        expect(manifest.socket).toBe(true);
    });

    it("le canal socket du code correspond à l'id du module", () => {
        // map-lock.js : CHANNEL = "module.forgotten-woods-brasigen"
        expect(`module.${manifest.id}`).toBe("module.forgotten-woods-brasigen");
    });
});
