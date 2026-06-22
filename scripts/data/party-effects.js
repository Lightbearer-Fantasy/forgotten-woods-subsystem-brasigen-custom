// scripts/data/party-effects.js
// Marqueurs d'effets de groupe portés par un FLAG sur l'acteur Party.
// PF2E interdit les items `effect` sur l'acteur party (baseAllowedItemTypes =
// ["physical"], sauf campagne Kingmaker) → on stocke l'état dans un flag et on
// l'affiche dans le HUD. Source unique, retrait 1 clic, rien sur les Joueurs.

/** Registre des marqueurs connus : clé → libellé (i18n) + icône. */
export const PARTY_EFFECTS = {
    hustle: { label: "FORGOTTEN_WOODS.partyEffect.hustle", img: "systems/pf2e/icons/spells/longstrider.webp" },
    cook: { label: "FORGOTTEN_WOODS.partyEffect.cook", img: "icons/consumables/food/bowl-stew-tofu-potato-red.webp" }
};

/**
 * Ajoute une clé d'effet à la liste, sans doublon. Pur.
 * @param {string[]|undefined} list
 * @param {string} key
 * @returns {string[]}
 */
export function withEffect(list, key) {
    const arr = Array.isArray(list) ? list : [];
    return arr.includes(key) ? arr : [...arr, key];
}

/**
 * Retire une clé d'effet de la liste. Pur.
 * @param {string[]|undefined} list
 * @param {string} key
 * @returns {string[]}
 */
export function withoutEffect(list, key) {
    return (Array.isArray(list) ? list : []).filter((k) => k !== key);
}
