// scripts/mapping/combat-scene.js
// Résout la Scene d'un Combat. Un Combat peut être « scene-agnostic »
// (combat.scene === null) — c'est le cas quand l'Encounter n'est lié à aucune
// Scene (le Token Party reste hors initiative). On déduit alors la Scene des
// combattants (token.parent), indépendamment de la vue. Pur : objets Combat-like.

/**
 * @param {object} combat  document Combat (ou objet { scene, combatants })
 * @returns {object|null} la Scene du combat, ou celle de ses combattants, ou null
 */
export function resolveCombatScene(combat) {
    if (combat?.scene) return combat.scene;
    for (const c of combat?.combatants ?? []) {
        const scene = c?.token?.parent ?? null;
        if (scene) return scene;
    }
    return null;
}
