import { effectiveMapRadius } from "./map-radius-modifiers.js";

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
 * Plan de cartographie en tenant compte des chips du Hex du Party.
 * Le rayon de base (autoIncrement) est modulé par le delta de révélation des
 * chips (Plaines +1, Marais −1, planché à 0), et l'incrément automatique reste
 * fidèle à Ia(r) = Ag − r (avec le rayon ajusté).
 * @param {number} choice  Activités de Groupe dépensées (Ag)
 * @param {boolean} radiusIncreased  réponse « Oui » au prompt rayon
 * @param {string[]} chipIds  chips du Hex du Party
 * @returns {{ radius: number, autoDelta: number }}
 */
export function mapAreaPlan(choice, radiusIncreased, chipIds) {
    const { radius: base } = autoIncrement(choice, radiusIncreased);
    const radius = effectiveMapRadius(base, chipIds);
    return { radius, autoDelta: choice - radius };
}

/**
 * Liste des choix d'Activités de Groupe pour le prompt : [1 … ag].
 * @param {number} ag
 * @returns {number[]}
 */
export function agOptions(ag) {
    return Array.from({ length: Math.max(0, ag) }, (_, k) => k + 1);
}
