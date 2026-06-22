/** Libellé d'une compétence : libellé PF2E si connu, sinon le slug en Title Case. */
export function skillLabel(slug) {
    const cfg = CONFIG.PF2E?.skills?.[slug];
    if (cfg?.label) return game.i18n.localize(cfg.label);
    return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/**
 * Prompt de choix de compétence. @param {{value:string,label:string}[]} choices
 * @returns {Promise<string|null>} le slug choisi
 */
export function promptSkill(choices) {
    const opts = choices.map((c) => `<option value="${c.value}">${c.label}</option>`).join("");
    return foundry.applications.api.DialogV2.prompt({
        window: { title: game.i18n.localize("FORGOTTEN_WOODS.skillCheck.prompt.title") },
        content: `<p>${game.i18n.localize("FORGOTTEN_WOODS.skillCheck.prompt.label")}</p><select name="skill" autofocus>${opts}</select>`,
        ok: { callback: (event, button) => button.form.elements.skill.value },
        modal: true
    });
}
