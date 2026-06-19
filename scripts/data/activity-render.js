const DEGREE_LABELS = {
    criticalSuccess: "Réussite critique",
    success: "Réussite",
    failure: "Échec",
    criticalFailure: "Échec critique"
};
const DEGREE_ORDER = ["criticalSuccess", "success", "failure", "criticalFailure"];

/**
 * Balisage standard PF2E d'une activité : titre + badges de traits + description
 * + lignes de degrés de réussite. Source unique de vérité (chat + popup).
 * Pure — aucun accès Foundry. Une clé d'outcomes (ou tout le bloc) absente est
 * omise ; un degré sans effet n'est simplement pas fourni dans les données.
 * @param {{label:string, traits?:string[], description?:string,
 *          outcomes?:Record<string,string>}} activity
 * @returns {string} HTML
 */
export function renderActivityHtml(activity) {
    const parts = [`<h3 class="fw-activity-title">${activity.label}</h3>`];

    const traits = activity.traits ?? [];
    if (traits.length) {
        const badges = traits.map((t) => `<span class="fw-trait">${t}</span>`).join("");
        parts.push(`<div class="fw-traits">${badges}</div>`);
    }

    if (activity.description) {
        parts.push(`<div class="fw-activity-desc">${activity.description}</div>`);
    }

    const outcomes = activity.outcomes;
    if (outcomes) {
        const lines = DEGREE_ORDER
            .filter((k) => outcomes[k])
            .map((k) => `<p><strong>${DEGREE_LABELS[k]}</strong> ${outcomes[k]}</p>`)
            .join("");
        if (lines) parts.push(`<div class="fw-outcomes">${lines}</div>`);
    }

    return `<div class="fw-activity">${parts.join("")}</div>`;
}
