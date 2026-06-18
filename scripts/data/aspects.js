/**
 * Aspects de scène : bonus sans type accordé par compétence pour la cartographie.
 * Extensible — ajouter ici les futurs aspects (ex. cendres: { nature: -2 }).
 * @type {Record<string, Record<string, number>>}
 */
export const ASPECTS = {
    sauvage: { nature: 2 },
    donjon: { society: 2 }
};

/**
 * Bonus sans type d'un aspect pour une compétence donnée.
 * @param {string|null} aspect
 * @param {string} skill
 * @returns {number} 0 si aucun bonus
 */
export function aspectBonus(aspect, skill) {
    return ASPECTS[aspect]?.[skill] ?? 0;
}

/**
 * Clé i18n du nom d'un aspect (ou « none »).
 * @param {string|null} aspect
 * @returns {string}
 */
export function aspectLabelKey(aspect) {
    return `FORGOTTEN_WOODS.aspects.${aspect || "none"}`;
}

/**
 * Options du menu de sélection d'aspect : Aucun, puis chaque aspect défini.
 * @returns {{value: string, labelKey: string}[]}
 */
export function aspectOptions() {
    return [
        { value: "", labelKey: aspectLabelKey(null) },
        ...Object.keys(ASPECTS).map((value) => ({ value, labelKey: aspectLabelKey(value) }))
    ];
}
