// scripts/mapping/prepare-ground-flow.js
// Activité individuelle « Préparer le terrain » : sélection d'1 Hex adjacent au Party,
// choix libre de compétence (selon l'Aspect), jet vs DC de l'Hex choisi, et application
// d'un delta de Progression de terrain sur cet Hex. Clone du flux Fouiller.
import { HexSelection } from "../canvas/hex-selection.js";
import { spacesInRange, coordsToOffset, offsetToKey } from "../utils/hex.js";
import { validSearchKeys, isValidSearchHex } from "./search-targets.js";
import { dcAt } from "./mapping-dc-store.js";
import { rollMapSkill, resolveSkillStatistic } from "./skill-roll.js";
import { deltaForDegree } from "./skill-outcome.js";
import { promptSkill } from "./skill-prompt.js";
import { actorSkillChoices } from "../data/activity-actions.js";
import { requestApplyGroundwork } from "./gm-actions.js";
import { isHexScene, isPartyToken } from "../utils/scene.js";

const t = (key) => game.i18n.localize(`FORGOTTEN_WOODS.prepareGround.${key}`);

export class PrepareGroundFlow {
    /** Vrai pendant la sélection (le Party HUD ne se rouvre pas au clic). */
    static selecting = false;

    static async start(token, actor, hud) {
        if (!token || !actor) return;
        const scene = canvas?.scene ?? null;
        if (!isHexScene(scene) || !isPartyToken(token)) { ui.notifications.warn(t("noParty")); return; }

        const origin = coordsToOffset(token.center);
        const validKeys = validSearchKeys(spacesInRange(origin, 1));

        hud?.close?.();
        PrepareGroundFlow.selecting = true;

        const selection = new HexSelection("forgotten-woods-hex-selection-prepare-ground");
        selection.showHighlight();
        const onPointerDown = (event) => {
            const local = event.data?.getLocalPosition?.(canvas.app.stage)
                ?? event.getLocalPosition?.(canvas.app.stage);
            if (!local) return;
            const offset = coordsToOffset(local);
            if (!isValidSearchHex(validKeys, offset)) return;
            selection.select(offset);
        };
        canvas.stage.on("pointerdown", onPointerDown);
        const cleanup = () => {
            canvas.stage?.off("pointerdown", onPointerDown);
            selection.destroy();
            PrepareGroundFlow.selecting = false;
        };

        let confirmed = false;
        try {
            confirmed = await this.#promptSelection(selection);
        } finally {
            const chosen = selection.get();
            cleanup();
            if (!confirmed || !chosen) return;

            const dc = dcAt(scene, chosen);
            if (!dc) { ui.notifications.warn(t("noDC")); return; }

            const choices = actorSkillChoices(actor);
            if (!choices.length) return;
            const skill = await promptSkill(choices);
            if (!skill) return;
            if (!resolveSkillStatistic(actor, skill)) { ui.notifications.warn(t("noSkill")); return; }

            const outcome = await rollMapSkill(actor, skill, dc, []);
            const delta = deltaForDegree(outcome);
            requestApplyGroundwork(scene.id, offsetToKey(chosen), delta);
        }
    }

    static #promptSelection(selection) {
        return foundry.applications.api.DialogV2.wait({
            window: { title: t("selectPrompt.title") },
            content: `<p>${t("selectPrompt.label")}</p>`,
            modal: false,
            buttons: [
                { action: "confirm", label: t("selectPrompt.confirm"), default: true, callback: () => true },
                { action: "cancel", label: t("selectPrompt.cancel"), callback: () => false }
            ],
            rejectClose: false,
            render: (event, dialog) => {
                const btn = dialog.element.querySelector('button[data-action="confirm"]');
                if (!btn) return;
                btn.disabled = selection.get() == null;
                selection.onChange(() => { btn.disabled = selection.get() == null; });
            }
        }).catch(() => false);
    }
}
