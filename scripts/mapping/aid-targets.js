// scripts/mapping/aid-targets.js
/**
 * Alliés ciblables par S'entraider : personnages du Party, hors lanceur et hors déjà-aidés.
 * @param {object} party  acteur Party (porte `.members`)
 * @param {string} helperId  id du personnage lanceur
 * @param {string[]} excludeIds  ids d'alliés déjà aidés ce tour
 * @returns {{id: string, name: string}[]}
 */
export function allyChoices(party, helperId, excludeIds = []) {
    const exclude = new Set([helperId, ...excludeIds]);
    return (party?.members ?? [])
        .filter((m) => m?.type === "character" && !exclude.has(m.id))
        .map((m) => ({ id: m.id, name: m.name }));
}
