import { describe, it, expect } from "vitest";
import { deltaForDegree, sumDeltas, degreeKeyFromNumber } from "../scripts/mapping/skill-outcome.js";

describe("deltaForDegree", () => {
    it("mappe les 4 degrés", () => {
        expect(deltaForDegree("criticalSuccess")).toBe(2);
        expect(deltaForDegree("success")).toBe(1);
        expect(deltaForDegree("failure")).toBe(0);
        expect(deltaForDegree("criticalFailure")).toBe(-1);
    });
    it("degré inconnu → 0", () => {
        expect(deltaForDegree("???")).toBe(0);
        expect(deltaForDegree(undefined)).toBe(0);
    });
});

describe("sumDeltas", () => {
    it("somme les deltas (instruction §3)", () => {
        const results = [
            { degree: "criticalSuccess" }, // +2
            { degree: "success" },         // +1
            { degree: "failure" },         // 0
            { degree: "criticalFailure" }  // -1
        ];
        expect(sumDeltas(results)).toBe(2);
    });
    it("liste vide → 0", () => {
        expect(sumDeltas([])).toBe(0);
    });
});

describe("degreeKeyFromNumber", () => {
    it("mappe les degrés numériques PF2E", () => {
        expect(degreeKeyFromNumber(3)).toBe("criticalSuccess");
        expect(degreeKeyFromNumber(2)).toBe("success");
        expect(degreeKeyFromNumber(1)).toBe("failure");
        expect(degreeKeyFromNumber(0)).toBe("criticalFailure");
        expect(degreeKeyFromNumber(99)).toBe("");
    });
});
