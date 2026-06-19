import { renderActivityHtml } from "../data/activity-render.js";

/**
 * Rend une activité puis enrichit le HTML via PF2E/Foundry : la syntaxe
 * `@Check[...]` devient des boutons de jet cliquables, colorés par trait
 * (rendu identique au Token HUD). IO — validé en jeu.
 * @param {object} activity
 * @returns {Promise<string>} HTML enrichi
 */
export async function enrichActivityHtml(activity) {
    return foundry.applications.ux.TextEditor.implementation.enrichHTML(renderActivityHtml(activity));
}
