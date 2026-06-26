// scripts/data/hex-chips.js
// Registre des chips d'Hex + règles de composition (PUR, aucune globale Foundry).
// Deux catégories : "terrain" (exclusif, 1 max/Hex) et "marker" (cumulable).
// icon/color/abbr sont PROVISOIRES (l'utilisateur fournira des images plus tard ;
// le rendu pourra basculer sur une image sans changer le modèle).

export const CHIPS = [
    { id: "plaines",        category: "terrain", labelKey: "FORGOTTEN_WOODS.mapping.chips.plaines",       icon: "fa-solid fa-wheat-awn", color: "#86b049", abbr: "Pl" },
    { id: "marais",         category: "terrain", labelKey: "FORGOTTEN_WOODS.mapping.chips.marais",        icon: "fa-solid fa-water",     color: "#3f7d6e", abbr: "Ma" },
    { id: "foret",          category: "terrain", labelKey: "FORGOTTEN_WOODS.mapping.chips.foret",         icon: "fa-solid fa-tree",      color: "#2f7d32", abbr: "Fo" },
    { id: "foret-ancienne", category: "terrain", labelKey: "FORGOTTEN_WOODS.mapping.chips.foret-ancienne", icon: "fa-solid fa-tree",     color: "#1b5e20", abbr: "FA" },
    { id: "montagne",       category: "terrain", labelKey: "FORGOTTEN_WOODS.mapping.chips.montagne",      icon: "fa-solid fa-mountain",  color: "#9e9e9e", abbr: "Mo" },
    { id: "ancre",          category: "marker",  labelKey: "FORGOTTEN_WOODS.mapping.chips.ancre",         icon: "fa-solid fa-anchor",    color: "#2b6cb0", abbr: "An" },
    { id: "orme-blanc",     category: "marker",  labelKey: "FORGOTTEN_WOODS.mapping.chips.orme-blanc",    icon: "fa-solid fa-leaf",      color: "#dfe6e9", abbr: "OB", unique: true },
];

/** @param {string} id @returns {object|undefined} */
export function getChip(id) {
    return CHIPS.find((c) => c.id === id);
}

/** @returns {object[]} chips de catégorie terrain, dans l'ordre du registre. */
export function terrains() {
    return CHIPS.filter((c) => c.category === "terrain");
}

/** @returns {object[]} chips de catégorie marqueur, dans l'ordre du registre. */
export function markers() {
    return CHIPS.filter((c) => c.category === "marker");
}

/**
 * Applique un chip à une liste d'ids et renvoie une NOUVELLE liste.
 * - terrain : retire le terrain existant puis ajoute (exclusivité) ;
 * - marqueur : ajoute s'il est absent (idempotent) ;
 * - chip inconnu ou déjà présent : liste inchangée (copie).
 * @param {string[]} currentChips
 * @param {string} chipId
 * @returns {string[]}
 */
export function applyChipToList(currentChips, chipId) {
    const chip = getChip(chipId);
    if (!chip || currentChips.includes(chipId)) return [...currentChips];
    if (chip.category === "terrain") {
        const withoutTerrains = currentChips.filter((id) => getChip(id)?.category !== "terrain");
        return [...withoutTerrains, chipId];
    }
    return [...currentChips, chipId];
}

/**
 * Renvoie une NOUVELLE liste sans le chip ciblé.
 * @param {string[]} currentChips
 * @param {string} chipId
 * @returns {string[]}
 */
export function removeChipFromList(currentChips, chipId) {
    return currentChips.filter((id) => id !== chipId);
}
