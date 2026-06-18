/** Delta de PC par degré de réussite (clés d'« outcome » PF2E). */
const DELTA = {
    criticalSuccess: 2,
    success: 1,
    failure: 0,
    criticalFailure: -1
};

/** Degré numérique PF2E (0..3) → clé d'outcome. */
const DEGREE_KEY = ["criticalFailure", "failure", "success", "criticalSuccess"];

/**
 * @param {string} degree  clé d'outcome PF2E
 * @returns {number} delta de PC (0 si inconnu)
 */
export function deltaForDegree(degree) {
    return DELTA[degree] ?? 0;
}

/**
 * Somme des deltas de PC sur l'ensemble des jets.
 * @param {{degree: string}[]} results
 * @returns {number}
 */
export function sumDeltas(results) {
    return results.reduce((total, r) => total + deltaForDegree(r.degree), 0);
}

/**
 * Convertit le degré numérique PF2E (0..3) en clé d'outcome.
 * @param {number} n
 * @returns {string} "" si hors plage
 */
export function degreeKeyFromNumber(n) {
    return DEGREE_KEY[n] ?? "";
}
