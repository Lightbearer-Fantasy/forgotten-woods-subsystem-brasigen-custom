/**
 * Détermine si une activité doit être grisée (non lançable) au rendu du HUD.
 * Le MJ (isGM) n'est jamais impacté : il n'a pas de personnage et garde une vue
 * d'ensemble. Sinon, les grisages de proficiency ne s'appliquent que si un
 * personnage est assigné (hasCharacter) ; les grisages de camp s'appliquent toujours.
 * @param {{id:string}} activity
 * @param {{craftingTrained:boolean, medicineTrained:boolean, campPresent:boolean,
 *          ingredientCount:number, characterCount:number, hasCharacter:boolean,
 *          isGM:boolean, partyPoints:number}} ctx
 * @returns {boolean}
 */
export function activityDisabled(activity, ctx) {
    if (ctx?.isGM) return false; // le MJ n'est jamais grisé
    switch (activity?.id) {
        case "craft":
            return !ctx.campPresent || (ctx.hasCharacter && !ctx.craftingTrained);
        case "treat-wounds":
            return ctx.hasCharacter && !ctx.medicineTrained;
        case "cook":
            return !ctx.campPresent || ctx.ingredientCount < ctx.characterCount;
        case "rest":
            return !ctx.campPresent;
        case "make-camp":
            return ctx.campPresent; // grisé si un camp est déjà sur le Hex du Party
        case "prepare-ground":
            return ctx.hasCharacter && (ctx.partyPoints ?? 0) < 2;
        default:
            return false; // repair inclus : jamais grisé
    }
}
