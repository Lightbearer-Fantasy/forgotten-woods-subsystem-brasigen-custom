import { coordsToOffset } from "../utils/hex.js";
import { dcAt } from "./mapping-dc-store.js";
import { rollMapSkill, resolveSkillStatistic } from "./skill-roll.js";
import { characterCount } from "../hud/party-counts.js";
import { cookSkillChoices, cookIngredientCost } from "./cook-logic.js";
import { skillLabel, promptSkill } from "./skill-prompt.js";
import { requestConsumeResource } from "./gm-actions.js";

const t = (key) => game.i18n.localize(`FORGOTTEN_WOODS.skillCheck.${key}`);

/** Cuisiner : choix de compétence (Cooking Lore si possédé), jet vs Hex DC,
 *  consommation d'ingrédients (confirmation MJ) + Effet: Cuisiner sur succès. */
export class CookFlow {
    static async start(token, actor) {
        if (!token || !actor) return;
        const slugs = cookSkillChoices(actor);
        const skill = slugs.length === 1
            ? slugs[0]
            : await promptSkill(slugs.map((s) => ({ value: s, label: skillLabel(s) })));
        if (!skill) return;
        if (!resolveSkillStatistic(actor, skill)) { ui.notifications.warn(t("noSkill")); return; }
        const defaultDc = dcAt(canvas.scene, coordsToOffset(token.center)) ?? 15;
        const dc = await promptCookDc(defaultDc);
        if (dc == null) return;
        const outcome = await rollMapSkill(actor, skill, dc, []);
        if (!outcome) return;
        const amount = cookIngredientCost(outcome, characterCount(token.actor));
        const applyEffect = outcome === "success" || outcome === "criticalSuccess";
        requestConsumeResource({
            resourceKey: "ingredients",
            activityLabel: game.i18n.localize("FORGOTTEN_WOODS.cook.label"),
            skillLabel: skillLabel(skill),
            outcome,
            amount,
            partyActorId: token.actor?.id,
            effectKey: applyEffect ? "cook" : null
        });
    }
}

/** Demande le DC de Cuisiner au MJ, pré-rempli au DC du Hex Party (ou 15). */
async function promptCookDc(defaultDc) {
    const value = await foundry.applications.api.DialogV2.prompt({
        window: { title: t("cookDc.title") },
        content: `<p>${t("cookDc.label")}</p>`
            + `<input type="number" name="dc" value="${defaultDc}" min="1" autofocus>`,
        ok: { callback: (event, button) => button.form.elements.dc.value },
        modal: true
    });
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
}
