/**
 * Flux Recall Knowledge d'« Enquêter » : réutilise l'API publique de PF2E HUD
 * (`api.actions.rollRecallKnowledge`), qui lance un d20 sur toutes les
 * compétences de savoir + lores d'un coup. Appelé deux fois (deux cartes).
 * IO — validé en jeu.
 */
export class RecallKnowledgeFlow {
    /** @param {object} actor  personnage du joueur qui clique */
    static async start(actor) {
        if (!actor) return;
        const roll = game.hud?.api?.actions?.rollRecallKnowledge;
        if (typeof roll !== "function") {
            ui.notifications.warn(game.i18n.localize("FORGOTTEN_WOODS.skillCheck.noRK"));
            return;
        }
        await roll(actor);
        await roll(actor);
    }
}
