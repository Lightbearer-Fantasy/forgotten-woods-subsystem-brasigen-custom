const DEGREE_LABELS = {
    criticalSuccess: "Réussite critique",
    success: "Réussite",
    failure: "Échec",
    criticalFailure: "Échec critique"
};
const DEGREE_ORDER = ["criticalSuccess", "success", "failure", "criticalFailure"];

/** Clé de description PF2E d'un trait : "exploration" -> "PF2E.TraitDescriptionExploration". */
function traitTooltipKey(slug) {
    return `PF2E.TraitDescription${slug.charAt(0).toUpperCase()}${slug.slice(1)}`;
}

/**
 * Balisage natif PF2E d'une activité (mime le rendu Token HUD) : titre + badges
 * de traits `.tag` + description + degrés. Source unique de vérité (chat + popup).
 * Pure — aucun accès Foundry. La description peut contenir de la syntaxe `@Check[...]`
 * littérale, enrichie plus tard par la couche Foundry (`enrichActivityHtml`).
 * @param {{label:string, traits?:string[], description?:string,
 *          outcomes?:Record<string,string>}} activity
 * @returns {string} HTML
 */
export function renderActivityHtml(activity) {
    const parts = [`<h3 class="fw-activity-title">${activity.label}</h3>`];

    const traits = activity.traits ?? [];
    if (traits.length) {
        const badges = traits.map((t) =>
            `<span class="tag" data-trait="${t}" data-tooltip="${traitTooltipKey(t)}">${t}</span>`
        ).join("");
        parts.push(`<div class="tags paizo-style">${badges}</div>`);
    }

    if (activity.description) {
        parts.push(`<div class="description">${activity.description}</div>`);
    }

    const outcomes = activity.outcomes;
    if (outcomes) {
        const lines = DEGREE_ORDER
            .filter((k) => outcomes[k])
            .map((k) => `<p><strong>${DEGREE_LABELS[k]}</strong> ${outcomes[k]}</p>`)
            .join("");
        if (lines) parts.push(`<div class="fw-outcomes">${lines}</div>`);
    }

    return `<div class="item-summary">${parts.join("")}</div>`;
}
