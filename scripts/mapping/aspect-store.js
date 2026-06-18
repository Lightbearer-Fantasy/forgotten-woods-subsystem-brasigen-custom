export const MODULE_ID = "forgotten-woods-brasigen";
export const ASPECT_FLAG = "mappingAspect";

/**
 * Aspect courant de la scène.
 * @param {object} scene
 * @returns {string|null} null si absent ou vide
 */
export function aspectOf(scene) {
    return scene?.getFlag?.(MODULE_ID, ASPECT_FLAG) || null;
}

/**
 * Payload scene.update fixant (ou effaçant) l'aspect.
 * @param {string|null} aspect  chaîne vide/null efface la clé
 * @returns {Record<string, any>}
 */
export function buildSetAspect(aspect) {
    const flagBase = `flags.${MODULE_ID}`;
    if (!aspect) return { [`${flagBase}.-=${ASPECT_FLAG}`]: null };
    return { [`${flagBase}.${ASPECT_FLAG}`]: aspect };
}

/**
 * Fixe l'aspect de la scène et persiste (MJ uniquement).
 * @param {object} scene
 * @param {string|null} aspect
 * @returns {Promise|void}
 */
export function setAspect(scene, aspect) {
    if (!game.user.isGM || !scene) return;
    return scene.update(buildSetAspect(aspect));
}
