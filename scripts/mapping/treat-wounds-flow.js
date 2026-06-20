/**
 * Flux Soigner les blessures : réutilise l'API publique de PF2E HUD
 * (`api.actions.treatWounds`), qui ouvre le dialogue de Treat Wounds
 * sur le personnage du joueur. IO — validé en jeu.
 */
export class TreatWoundsFlow {
    /** @param {object} actor  personnage du joueur qui clique */
    static async start(actor) {
        if (!actor) return;
        const treatWounds = game.hud?.api?.actions?.treatWounds;
        if (typeof treatWounds !== "function") {
            ui.notifications.warn(game.i18n.localize("FORGOTTEN_WOODS.skillCheck.noTreatWounds"));
            return;
        }
        await treatWounds(actor);
    }
}
