import { MAP_SKILLS, skillLabelKey } from "../data/map-skills.js";

const t = (key) => game.i18n.localize(`FORGOTTEN_WOODS.mapArea.${key}`);

/**
 * Ouvre la fenêtre de sélection de compétence.
 * @param {string} defaultSkill  slug présélectionné
 * @returns {Promise<string|null>} slug choisi, ou null si l'utilisateur quitte
 */
export function openSkillPrompt(defaultSkill) {
    const options = MAP_SKILLS.map((slug) => {
        const selected = slug === defaultSkill ? " selected" : "";
        return `<option value="${slug}"${selected}>${game.i18n.localize(skillLabelKey(slug))}</option>`;
    }).join("");
    return foundry.applications.api.DialogV2.wait({
        window: { title: t("skillPrompt.title") },
        content: `<p>${t("skillPrompt.label")}</p>`
            + `<select name="skill" autofocus>${options}</select>`,
        buttons: [
            {
                action: "confirm",
                label: t("skillPrompt.confirm"),
                default: true,
                callback: (event, button) => button.form.elements.skill.value
            },
            { action: "abandon", label: t("skillPrompt.abandon"), callback: () => null }
        ],
        // Fermeture via la croix = abandon.
        rejectClose: false
    });
}

/**
 * Affiche la fenêtre d'attente (verrouillée) jusqu'au lancement des jets.
 * @returns {{ close: () => Promise<void> }}
 */
export function showWaiting() {
    const dialog = new foundry.applications.api.DialogV2({
        window: { title: t("waiting.title") },
        content: `<p>${t("waiting.message")}</p>`,
        buttons: [{ action: "wait", label: "…", disabled: true }]
    });
    dialog.render({ force: true });
    return { close: () => dialog.close() };
}
