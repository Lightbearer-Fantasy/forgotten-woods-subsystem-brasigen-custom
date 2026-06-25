// scripts/data/round-effects.js
// Logique PURE d'affichage du compteur d'Activités de Groupe selon les effets
// du Round (Fatigued via S'empresser, Cuisiner). Aucune dépendance Foundry.

export const FATIGUED_SYMBOL_IMG = "systems/pf2e/icons/conditions/fatigued.webp";
export const COOK_SYMBOL_IMG = "icons/tools/cooking/bowl-steaming-brown.webp";

/** Modificateur net du compteur : −2 si Fatigued, +1 si Cuisiner (cumulables). */
export function roundCountModifier({ fatigued, cook }) {
    return (fatigued ? -2 : 0) + (cook ? 1 : 0);
}

/** Couleur du compteur : base blanche, net positif bleu, net négatif rouge. */
export function roundCountColor(modifier) {
    if (modifier > 0) return "blue";
    if (modifier < 0) return "red";
    return "white";
}

/** Symboles à afficher à droite du label (Fatigued puis Cuisiner). */
export function roundSymbols({ fatigued, cook }) {
    const out = [];
    if (fatigued) out.push({ img: FATIGUED_SYMBOL_IMG, title: "Fatigué" });
    if (cook) out.push({ img: COOK_SYMBOL_IMG, title: "Cuisiner" });
    return out;
}

/** Vrai si au moins un membre porte la condition PF2E `fatigued`. */
export function partyFatigued(members) {
    return (members ?? []).some(
        (m) => (m?.itemTypes?.condition ?? []).some((c) => c?.slug === "fatigued")
    );
}

/** Vrai si le marqueur Cuisiner correspond au Round ET au combat courants. */
export function isCookRound(cookRound, currentRound, currentCombatId) {
    return currentRound != null
        && currentCombatId != null
        && cookRound?.round === currentRound
        && cookRound?.combatId === currentCombatId;
}
