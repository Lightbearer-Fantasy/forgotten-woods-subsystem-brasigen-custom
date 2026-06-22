/**
 * Le membre porte-t-il déjà l'effet d'UUID donné ?
 * @param {{itemTypes?:{effect?:Array<{flags?:{core?:{sourceId?:string}}}>}}} member
 * @param {string} uuid
 * @returns {boolean}
 */
export function hasScout(member, uuid) {
    const effects = member?.itemTypes?.effect ?? [];
    return effects.some((e) => e?.flags?.core?.sourceId === uuid);
}

/**
 * Sous-ensemble des membres NE portant PAS déjà l'effet (cibles à qui l'appliquer).
 * @param {Array} members
 * @param {string} uuid
 * @returns {Array}
 */
export function membersNeedingScout(members, uuid) {
    return (members ?? []).filter((m) => !hasScout(m, uuid));
}
