// scripts/mapping/craft-logic.js
/**
 * Coût de base en matériaux selon le palier de niveau de l'objet.
 * niveau −2 ou moins → 3 ; niveau −1 ou niveau (et au-delà) → 5.
 * @param {number} itemLevel
 * @param {number} charLevel
 * @returns {number}
 */
export function craftMaterialCost(itemLevel, charLevel) {
    return (charLevel - itemLevel) >= 2 ? 3 : 5;
}

/**
 * Variation du compteur de matériaux selon l'outcome (≤ 0).
 * @param {string} outcome
 * @param {number} baseCost
 * @returns {number}
 */
export function craftMaterialConsumption(outcome, baseCost) {
    switch (outcome) {
        case "success": return -baseCost;
        case "criticalSuccess": return -Math.max(0, baseCost - 1);
        case "criticalFailure": return -1;
        default: return 0;
    }
}
