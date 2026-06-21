/**
 * Détermine si une activité doit être grisée (non lançable) au rendu du HUD.
 * Les grisages de proficiency ne s'appliquent que si un personnage est assigné
 * (hasCharacter) ; les grisages de camp s'appliquent toujours.
 * @param {{id:string}} activity
 * @param {{craftingTrained:boolean, medicineTrained:boolean, campPresent:boolean,
 *          ingredientCount:number, characterCount:number, hasCharacter:boolean}} ctx
 * @returns {boolean}
 */
export function activityDisabled(activity, ctx) {
    switch (activity?.id) {
        case "craft":
            return !ctx.campPresent || (ctx.hasCharacter && !ctx.craftingTrained);
        case "treat-wounds":
            return ctx.hasCharacter && !ctx.medicineTrained;
        case "cook":
            return !ctx.campPresent || ctx.ingredientCount < ctx.characterCount;
        case "rest":
            return !ctx.campPresent;
        default:
            return false; // repair inclus : jamais grisé
    }
}
