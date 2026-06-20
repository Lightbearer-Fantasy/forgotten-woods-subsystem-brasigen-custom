import { coordsToOffset } from "../utils/hex.js";
import { dcAt } from "./mapping-dc-store.js";
import { rollMapSkill, resolveSkillStatistic } from "./skill-roll.js";
import { actorSkillChoices } from "../data/activity-actions.js";

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

        // Liste des choix : toutes les compétences/lores de l'acteur (allSkills)
        // ou la liste fixe de l'activité.
        const choices = activity?.check?.allSkills
            ? actorSkillChoices(actor)
            : (activity?.check?.skills ?? []).map((s) => ({ value: s, label: skillLabel(s) }));
        if (!choices.length) return;

        const skill = choices.length === 1 ? choices[0].value : await this.#promptSkill(choices);
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

    /** Prompt de choix de compétence. @param {{value,label}[]} choices */
    static async #promptSkill(choices) {
        const opts = choices.map((c) => `<option value="${c.value}">${c.label}</option>`).join("");
        return foundry.applications.api.DialogV2.prompt({
            window: { title: t("prompt.title") },
            content: `<p>${t("prompt.label")}</p><select name="skill" autofocus>${opts}</select>`,
            ok: { callback: (event, button) => button.form.elements.skill.value },
            modal: true
        });
    }
}
