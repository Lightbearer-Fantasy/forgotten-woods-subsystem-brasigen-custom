// scripts/mapping/harvest-modifiers.js
// Bonus de récolte porté par les chips (PUR). Forêt : +1 ingrédient sur Chasser et
// cueillir (ressource "ingredients" uniquement ; ne touche pas les matériaux).

/**
 * Bonus de ressource apporté par les chips du Hex du Party.
 * @param {string} resourceKey  "ingredients" | "materials"
 * @param {string[]} chipIds
 * @returns {number}
 */
export function harvestDelta(resourceKey, chipIds) {
    if (resourceKey !== "ingredients" || !Array.isArray(chipIds)) return 0;
    return chipIds.includes("foret") ? 1 : 0;
}
