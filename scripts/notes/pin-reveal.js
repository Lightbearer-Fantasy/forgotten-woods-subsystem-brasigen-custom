// scripts/notes/pin-reveal.js
// Logique PURE de révélation des repères (pins) selon les Points de
// Cartographie. Aucune dépendance Foundry → testable en isolation.

/** Seuil de PC pour révéler un pin : 4 si Secret, 2 sinon. */
export function pinThreshold(secret) {
    return secret ? 4 : 2;
}

/** Vrai si les PC d'un pin atteignent son seuil. */
export function isPinRevealed({ secret, points }) {
    return (points ?? 0) >= pinThreshold(secret);
}

/** Valeur par défaut du marqueur « Repère Forgotten Woods » : coché sur une scène Hex. */
export function defaultFwPin(isHex) {
    return !!isHex;
}

/** Vrai si un joueur (non-MJ) doit voir le pin : note non gérée, ou pin déjà révélé. */
export function pinVisibleToPlayer({ fwPin, revealed }) {
    return !fwPin || !!revealed;
}

/**
 * Parmi des pins { id, fwPin, secret, revealed, points }, renvoie les id à
 * latcher : gérés (fwPin), pas encore révélés, dont les PC franchissent le seuil.
 */
export function pinsToReveal(pins) {
    return (pins ?? [])
        .filter((p) => p.fwPin && !p.revealed && isPinRevealed(p))
        .map((p) => p.id);
}
