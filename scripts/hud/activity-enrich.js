import { renderActivityHtml } from "../data/activity-render.js";
import { loadActionMaps, resolveActionMarkers } from "../data/activity-actions.js";

/**
 * Rend une activité, résout les marqueurs `@Action` en `@UUID`, puis enrichit
 * via PF2E/Foundry (les `@Check`/`@UUID` deviennent cliquables). IO — validé en jeu.
 * @param {object} activity
 * @returns {Promise<string>}
 */
export async function enrichActivityHtml(activity) {
    const { uuidBySlug } = await loadActionMaps();
    const html = resolveActionMarkers(renderActivityHtml(activity), uuidBySlug);
    return foundry.applications.ux.TextEditor.implementation.enrichHTML(html);
}
