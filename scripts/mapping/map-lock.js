/**
 * Vrai si le verrou de cartographie est libre ou expiré.
 * @param {{ userId: string, timestamp: number }|null} lock
 * @param {number} now  horodatage courant (ms)
 * @param {number} [timeoutMs=120000]  durée d'expiration de sécurité
 * @returns {boolean}
 */
export function lockIsFree(lock, now, timeoutMs = 120000) {
    return !lock || (now - lock.timestamp > timeoutMs);
}
