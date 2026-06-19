import { coordsToOffset } from "../utils/hex.js";
import { dcAt } from "./mapping-dc-store.js";
import { rollMapSkill, resolveSkillStatistic } from "./skill-roll.js";

const t = (key) => game.i18n.localize(`FORGOTTEN_WOODS.skillCheck.${key}`);

/** Libellé d'une compétence : libellé PF2E si connu, sinon le slug en Title Case. */
function skillLabel(slug) {
    const cfg = CONFIG.PF2E?.skills?.[slug];
    if (cfg?.label) return game.i18n.localize(cfg.label);
    return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/**
 * Flux de jet déclenché par le bouton d20 d'une activité « à check ».
 * Activités de zone (`check.vsHexDC`) : jet opposé au Hex DC caché.
 * Placeholders : jet PF2E standard sans cible. Aucun PC appliqué dans les deux cas.
 * IO — validé en jeu.
 */
export class SkillCheckFlow {
    /**
     * @param {Token} token   Token Party ancré au HUD
     * @param {object} actor  acteur qui lance le jet
     * @param {object} activity  activité (doit porter `check.skills`)
     */
    static async start(token, actor, activity) {
        if (!token || !actor) return;
        const skills = activity?.check?.skills ?? [];
        if (!skills.length) return;

        const skill = skills.length === 1 ? skills[0] : await this.#promptSkill(skills);
        if (!skill) return;
        if (!resolveSkillStatistic(actor, skill)) { ui.notifications.warn(t("noSkill")); return; }

        let dc = null;
        if (activity.check.vsHexDC) {
            const offset = coordsToOffset(token.center);
            dc = dcAt(canvas.scene, offset);
            if (!dc) { ui.notifications.warn(t("noDC")); return; }
        }
        await rollMapSkill(actor, skill, dc, []);
    }

    /** Prompt de choix de compétence. @returns {Promise<string|null>} slug ou null. */
    static async #promptSkill(skills) {
        const opts = skills.map((s) => `<option value="${s}">${skillLabel(s)}</option>`).join("");
        return foundry.applications.api.DialogV2.prompt({
            window: { title: t("prompt.title") },
            content: `<p>${t("prompt.label")}</p><select name="skill" autofocus>${opts}</select>`,
            ok: { callback: (event, button) => button.form.elements.skill.value },
            modal: true
        });
    }
}
