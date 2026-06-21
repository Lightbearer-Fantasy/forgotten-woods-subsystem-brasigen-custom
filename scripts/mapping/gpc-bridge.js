const MODULE_ID = "forgotten-woods-brasigen";
const SETTING = "resourceClocks";
const GPC_ID = "global-progress-clocks";

/** Libellés des compteurs de ressources (FR). */
export const RESOURCE_LABELS = {
    ingredients: "Ingrédients frais",
    materials: "Matériaux de fabrication"
};

/** Enregistre le setting de monde mémorisant les IDs de compteurs GPC. À appeler au init. */
export function registerResourceClocks() {
    game.settings.register(MODULE_ID, SETTING, {
        scope: "world",
        config: false,
        type: Object,
        default: {}
    });
}

/** Données brutes des compteurs GPC (source de vérité, évite la collection stale). */
function activeClocks() {
    return game.settings.get(GPC_ID, "activeClocks") ?? {};
}

/** ID GPC mémorisé pour une ressource, ou null. */
function storedClockId(resourceKey) {
    return (game.settings.get(MODULE_ID, SETTING) ?? {})[resourceKey] ?? null;
}

/**
 * Valeur courante d'un compteur (0 s'il n'existe pas).
 * @param {"ingredients"|"materials"} resourceKey
 * @returns {number}
 */
export function counterValue(resourceKey) {
    const id = storedClockId(resourceKey);
    if (!id) return 0;
    return activeClocks()[id]?.value ?? 0;
}

/**
 * Plafond des compteurs de ressources (type GPC "points" : max autorisé 99).
 * Sans `max` explicite, GPC applique DEFAULT_CLOCK.max = 4 et plafonne la valeur
 * à 4 ; on force donc 99 à la création ET à la mise à jour (répare les compteurs
 * créés avant ce correctif et coincés à 4).
 */
const POINTS_MAX = 99;

/**
 * Applique une variation `amount` au compteur de la ressource ; le crée si besoin.
 * Variation négative tolérée (échec critique) : la valeur est plancher à 0 et un
 * compteur inexistant n'est pas instancié pour une perte. No-op si amount === 0.
 * MJ uniquement.
 * @param {"ingredients"|"materials"} resourceKey
 * @param {number} amount  variation (peut être négative)
 */
export function addOrIncrement(resourceKey, amount) {
    if (!game.user.isGM || amount === 0 || !window.clockDatabase) return;
    const id = storedClockId(resourceKey);
    const existing = id ? activeClocks()[id] : null;
    if (existing) {
        const next = Math.max(0, (existing.value ?? 0) + amount);
        window.clockDatabase.update({ id, value: next, max: POINTS_MAX });
        return;
    }
    if (amount < 0) return; // rien à retirer : ne pas créer un compteur pour une perte
    const newId = foundry.utils.randomID();
    window.clockDatabase.addClock({
        id: newId, type: "points", name: RESOURCE_LABELS[resourceKey],
        value: amount, max: POINTS_MAX, private: false
    });
    const map = { ...(game.settings.get(MODULE_ID, SETTING) ?? {}) };
    map[resourceKey] = newId;
    game.settings.set(MODULE_ID, SETTING, map);
}
