// scripts/mapping/map-radius-modifiers.js
// Modificateurs du RAYON de Cartographier la zone portés par les chips (PUR).
// Distinct de reveal-modifiers.js (distance de révélation) : Orme Blanc augmente le
// rayon de Cartographier SANS toucher la révélation. Plaines/Marais sont aussi listés
// ici pour préserver le comportement actuel du rayon (cf. auto-increment).

const MAP_RADIUS_DELTAS = { plaines: 1, marais: -1, "orme-blanc": 1 };

/** Somme des deltas de rayon des chips fournis (0 pour les chips sans effet). */
export function mapRadiusDelta(chipIds) {
    if (!Array.isArray(chipIds)) return 0;
    return chipIds.reduce((sum, id) => sum + (MAP_RADIUS_DELTAS[id] ?? 0), 0);
}

/** Rayon effectif de Cartographier : base + delta des chips, planché à 0. */
export function effectiveMapRadius(base, chipIds) {
    return Math.max(0, (base ?? 0) + mapRadiusDelta(chipIds));
}
