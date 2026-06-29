import { mapSkillChoices, skillLabelKey } from "../data/map-skills.js";

const t = (key) => game.i18n.localize(`FORGOTTEN_WOODS.mapArea.${key}`);

/**
 * Ouvre la fenêtre de sélection de compétence.
 * @param {string} defaultSkill  slug présélectionné
 * @param {Actor|undefined} actor  acteur dont les compétences sont proposées
 * @returns {Promise<{type:"skill",skill:string}|{type:"pass"}|{type:"closed"}>}
 */
export async function openSkillPrompt(defaultSkill, actor) {
    const options = mapSkillChoices(actor).map((slug) => {
        const selected = slug === defaultSkill ? " selected" : "";
        return `<option value="${slug}"${selected}>${game.i18n.localize(skillLabelKey(slug))}</option>`;
    }).join("");
    const result = await foundry.applications.api.DialogV2.wait({
        window: { title: t("skillPrompt.title") },
        content: `<p>${t("skillPrompt.label")}</p>`
            + `<select name="skill" autofocus>${options}</select>`,
        buttons: [
            {
                action: "confirm",
                label: t("skillPrompt.confirm"),
                default: true,
                callback: (event, button) => ({ type: "skill", skill: button.form.elements.skill.value })
            },
            { action: "pass", label: t("skillPrompt.pass"), callback: () => ({ type: "pass" }) }
        ],
        // Fermeture via la croix (X) = signal d'erreur → restart côté initiateur.
        rejectClose: false
    });
    return result ?? { type: "closed" };
}

/**
 * Affiche la fenêtre d'attente (verrouillée) jusqu'au déblocage.
 * Titre/message par défaut = Cartographier ; surchargés pour d'autres usages (ex. Cuisiner).
 * @param {{ title?: string, message?: string }} [opts]
 * @returns {{ close: () => Promise<void> }}
 */
export function showWaiting({ title = t("waiting.title"), message = t("waiting.message") } = {}) {
    const dialog = new foundry.applications.api.DialogV2({
        window: { title },
        content: `<p>${message}</p>`,
        buttons: [{ action: "wait", label: "…", disabled: true }]
    });
    dialog.render({ force: true });
    return { close: () => dialog.close() };
}
