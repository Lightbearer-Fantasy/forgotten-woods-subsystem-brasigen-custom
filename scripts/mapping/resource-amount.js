/** Montant de ressources gagné par degré de réussite (Chasser / Récupérer). */
const AMOUNT = {
    criticalSuccess: 3,
    success: 2,
    failure: 0,
    criticalFailure: 0
};

/**
 * Quantité de ressources à ajouter selon l'outcome PF2E.
 * @param {string} outcome  clé d'outcome ("criticalSuccess"…)
 * @returns {number} 0 si inconnu
 */
export function resourceAmountForOutcome(outcome) {
    return AMOUNT[outcome] ?? 0;
}
