// scripts/data/terrain-travel.js
// Coût de Voyage par terrain (PUR). Marais/Montagne = terrain difficile (2),
// le reste = 1 ; défaut 1 si pas de chip terrain ou terrain inconnu.
const TRAVEL_COST = {
    plaines: 1,
    marais: 2,
    foret: 1,
    "foret-ancienne": 1,
    montagne: 2
};

/** @param {string|undefined} terrainId @returns {number} */
export function travelCost(terrainId) {
    return TRAVEL_COST[terrainId] ?? 1;
}

/** Vrai si la Progression atteint le coût de Voyage (charge -1 prête). */
export function reachesTravelDiscount(count, cost) {
    return count >= cost;
}
