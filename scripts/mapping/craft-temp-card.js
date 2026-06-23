import { temporaryItemName } from "./craft-logic.js";

const MODULE_ID = "forgotten-woods-brasigen";

/** Marqueurs one-shot : actorId → timestamp du lancement de Fabriquer. */
const pendingTempCrafts = new Map();

/**
 * Marque le prochain message de craft de cet acteur comme « temporaire » (notre flux).
 * @param {string} actorId
 * @param {number} [now=Date.now()]
 */
export function markTemporaryCraft(actorId, now = Date.now()) {
    if (actorId) pendingTempCrafts.set(actorId, now);
}

/**
 * Consomme (one-shot) le marqueur si présent et dans la fenêtre temporelle.
 * Purge une entrée expirée. Évite qu'un marqueur orphelin tague un craft ultérieur.
 * @param {string} actorId
 * @param {number} [windowMs=10000]
 * @param {number} [now=Date.now()]
 * @returns {boolean}
 */
export function consumeTemporaryCraftMark(actorId, windowMs = 10000, now = Date.now()) {
    const ts = pendingTempCrafts.get(actorId);
    if (ts === undefined) return false;
    pendingTempCrafts.delete(actorId);
    return (now - ts) <= windowMs;
}
