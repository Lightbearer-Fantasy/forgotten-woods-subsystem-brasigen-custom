// scripts/mapping/ancre-proximity.js
// État de proximité du Token Party à une Chip Ancre (PUR). "on" si le Party est sur
// une Ancre (boussole calme), "adjacent" si un voisin direct en porte une (boussole
// agitée), sinon "none". `neighborsOf` est injecté pour rester pur.

/**
 * @param {string} partyKey  clé "i,j" du Hex du Party
 * @param {Set<string>|string[]} ancreKeys  clés des Hex portant une Ancre
 * @param {(key:string)=>string[]} neighborsOf  voisins directs d'une clé
 * @returns {"on"|"adjacent"|"none"}
 */
export function ancreProximity(partyKey, ancreKeys, neighborsOf) {
    const set = ancreKeys instanceof Set ? ancreKeys : new Set(ancreKeys);
    if (set.has(partyKey)) return "on";
    for (const n of neighborsOf(partyKey)) {
        if (set.has(n)) return "adjacent";
    }
    return "none";
}
