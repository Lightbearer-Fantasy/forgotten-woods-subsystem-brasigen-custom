/**
 * Variation du compteur de ressources par degré de réussite (Chasser / Récupérer).
 * Négatif sur échec critique : le personnage ramène une ressource avariée qui
 * le force à trier et perd 1 unité.
 */
const AMOUNT = {
    criticalSuccess: 3,
    success: 2,
    failure: 0,
    criticalFailure: -1
};

/**
 * Variation de ressources à appliquer selon l'outcome PF2E (peut être négative).
 * @param {string} outcome  clé d'outcome ("criticalSuccess"…)
 * @returns {number} 0 si inconnu
 */
export function resourceAmountForOutcome(outcome) {
    return AMOUNT[outcome] ?? 0;
}
