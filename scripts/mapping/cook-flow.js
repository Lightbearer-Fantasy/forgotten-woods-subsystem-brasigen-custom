import { coordsToOffset } from "../utils/hex.js";
import { dcAt } from "./mapping-dc-store.js";
import { rollMapSkill, resolveSkillStatistic } from "./skill-roll.js";
import { characterCount } from "../hud/party-counts.js";
import { cookSkillChoices, cookIngredientCost } from "./cook-logic.js";
import { skillLabel, promptSkill } from "./skill-prompt.js";
import { requestConsumeResource } from "./gm-actions.js";
import { COOK_EFFECT_UUID } from "../data/module-effects.js";

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
        const dc = dcAt(canvas.scene, coordsToOffset(token.center));
        if (!dc) { ui.notifications.warn(t("noDC")); return; }
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
            effectUuid: applyEffect ? COOK_EFFECT_UUID : null
        });
    }
}
