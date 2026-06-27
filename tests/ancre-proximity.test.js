import { describe, it, expect } from "vitest";
import { ancreProximity } from "../scripts/mapping/ancre-proximity.js";

// voisins simulés : la case "i,j" a pour voisins i±1 (même j) et j±1 (même i)
const neighborsOf = (key) => {
    const [i, j] = key.split(",").map(Number);
    return [`${i - 1},${j}`, `${i + 1},${j}`, `${i},${j - 1}`, `${i},${j + 1}`];
};

describe("ancreProximity", () => {
    it("Party SUR une Ancre → 'on'", () => {
        expect(ancreProximity("5,5", ["5,5"], neighborsOf)).toBe("on");
    });
    it("Party adjacent à une Ancre → 'adjacent'", () => {
        expect(ancreProximity("5,5", ["6,5"], neighborsOf)).toBe("adjacent");
    });
    it("Party loin de toute Ancre → 'none'", () => {
        expect(ancreProximity("5,5", ["8,8"], neighborsOf)).toBe("none");
    });
    it("aucune Ancre → 'none'", () => {
        expect(ancreProximity("5,5", [], neighborsOf)).toBe("none");
    });
    it("'on' prime sur 'adjacent' si Party sur une Ancre voisine d'une autre", () => {
        expect(ancreProximity("5,5", ["5,5", "6,5"], neighborsOf)).toBe("on");
    });
});
