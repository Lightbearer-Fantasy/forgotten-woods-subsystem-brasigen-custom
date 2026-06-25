// tests/pin-presets.test.js
import { describe, it, expect } from "vitest";
import { PIN_PRESETS, getPreset } from "../scripts/notes/pin-presets.js";

describe("PIN_PRESETS", () => {
    it("contient les 3 presets attendus", () => {
        expect(PIN_PRESETS.map((p) => p.id)).toEqual(["anchor", "creature", "poi"]);
    });

    it("chaque preset a les 7 champs visuels et n'a pas name/description/secret", () => {
        for (const p of PIN_PRESETS) {
            expect(p).toMatchObject({
                icon: expect.any(String),
                iconSize: expect.any(Number),
                tint: expect.stringMatching(/^#[0-9a-fA-F]{6}$/),
                fontFamily: expect.any(String),
                fontSize: expect.any(Number),
                textColor: expect.stringMatching(/^#[0-9a-fA-F]{6}$/),
                textAnchor: "BOTTOM"
            });
            expect(p).not.toHaveProperty("name");
            expect(p).not.toHaveProperty("description");
            expect(p).not.toHaveProperty("secret");
        }
    });

    it("Ancre = ancre rouge foncé", () => {
        expect(getPreset("anchor")).toMatchObject({
            icon: "icons/svg/anchor.svg", tint: "#680808", textColor: "#680808",
            iconSize: 40, fontSize: 40, fontFamily: ""
        });
    });

    it("Créature = patte ambre", () => {
        expect(getPreset("creature")).toMatchObject({
            icon: "icons/svg/pawprint.svg", tint: "#be8919", textColor: "#be8919"
        });
    });

    it("Point d'intérêt = tour blanche", () => {
        expect(getPreset("poi")).toMatchObject({
            icon: "icons/svg/tower.svg", tint: "#ffffff", textColor: "#ffffff"
        });
    });

    it("getPreset retourne undefined pour un id inconnu", () => {
        expect(getPreset("inconnu")).toBeUndefined();
    });
});
