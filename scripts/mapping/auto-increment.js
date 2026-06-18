/**
 * Incrément automatique de PC pour « Cartographier la zone ».
 * delta = Ag − r, r = 2 si le rayon est augmenté sinon 1
 * (équivalent à la formule documentée Ia(r) = Ag − 1 − (r − 1)).
 * @param {number} ag  Activités de Groupe dépensées
 * @param {boolean} radiusIncreased  réponse « Oui » au prompt rayon
 * @returns {{ radius: number, delta: number }}
 */
export function autoIncrement(ag, radiusIncreased) {
    const radius = radiusIncreased ? 2 : 1;
    return { radius, delta: ag - radius };
}

/**
 * Liste des choix d'Activités de Groupe pour le prompt : [1 … ag].
 * @param {number} ag
 * @returns {number[]}
 */
export function agOptions(ag) {
    return Array.from({ length: Math.max(0, ag) }, (_, k) => k + 1);
}
