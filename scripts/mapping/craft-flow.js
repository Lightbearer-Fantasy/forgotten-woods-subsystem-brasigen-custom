import { counterValue } from "./gpc-bridge.js";
import { craftMaterialCost, craftMaterialConsumption, craftExceedsLevel } from "./craft-logic.js";
import { requestConsumeResource } from "./gm-actions.js";
import { CraftItemPicker } from "./craft-item-picker.js";
import { markTemporaryCraft } from "./craft-temp-card.js";

const t = (key) => game.i18n.localize(`FORGOTTEN_WOODS.craft.${key}`);

/** Fabriquer : sélection d'objet (zone de drop), pré-check matériaux, jet PF2E
 *  (callback pour l'outcome), consommation de matériaux confirmée par le MJ. */
export class CraftFlow {
    static async start(token, actor, event) {
        if (!token || !actor) return;
        const item = await CraftItemPicker.pick();
        if (!item) return;
        const charLevel = actor.level ?? actor.system?.details?.level?.value;
        if (craftExceedsLevel(item.level, charLevel)) {
            ui.notifications.warn(t("tooHighLevel"));
            return;
        }
        const baseCost = craftMaterialCost(item.level, charLevel);
        if (counterValue("materials") < baseCost) {
            ui.notifications.warn(t("noMaterials"));
            return;
        }
        const quantity = item.isOfType("consumable") ? 2 : 1;
        markTemporaryCraft(actor.id);
        await game.pf2e.actions.craft({
            item, quantity, actors: [actor], event, free: true,
            callback: (result) => {
                const amount = craftMaterialConsumption(result?.outcome, baseCost);
                requestConsumeResource({
                    resourceKey: "materials",
                    activityLabel: game.i18n.localize("FORGOTTEN_WOODS.craft.label"),
                    skillLabel: "Crafting",
                    outcome: result?.outcome,
                    amount
                });
            }
        });
    }
}
