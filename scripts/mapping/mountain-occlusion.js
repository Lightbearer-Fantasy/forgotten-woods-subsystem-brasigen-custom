// scripts/mapping/mountain-occlusion.js
// Effets du chip Montagne (PUR).
//  - filterMappableDeltas : la Cartographie ne pose pas de PC sur une Montagne tant que
//    le Party n'est pas lui-même sur une Montagne.
//  - occludeBehindMountains : une Montagne occulte la révélation des Hex au-delà d'elle
//    (ajouté en Task 6).

/**
 * Retire des deltas de Cartographie les Hex Montagne, sauf si l'origine est une Montagne.
 * @param {Map<string,number>} deltas  clé "i,j" -> delta
 * @param {boolean} originIsMountain
 * @param {(key:string)=>boolean} isMountainKey
 * @returns {Map<string,number>}  nouvelle Map
 */
export function filterMappableDeltas(deltas, originIsMountain, isMountainKey) {
    if (originIsMountain) return new Map(deltas);
    const out = new Map();
    for (const [key, delta] of deltas) {
        if (!isMountainKey(key)) out.set(key, delta);
    }
    return out;
}
