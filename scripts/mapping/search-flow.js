// scripts/mapping/search-flow.js
import { HexSelection } from "../canvas/hex-selection.js";
import { spacesInRange, coordsToOffset, offsetToKey } from "../utils/hex.js";
import { validSearchKeys, isValidSearchHex } from "./search-targets.js";
import { dcAt } from "./mapping-dc-store.js";
import { rollMapSkill, resolveSkillStatistic } from "./skill-roll.js";
import { deltaForDegree } from "./skill-outcome.js";
import { promptSkill, skillLabel } from "./skill-prompt.js";
import { requestApplySearchPoints } from "./gm-actions.js";
import { isHexScene, isPartyToken } from "../utils/scene.js";

const t = (key) => game.i18n.localize(`FORGOTTEN_WOODS.search.${key}`);

const SEARCH_SKILLS = ["perception", "stealth", "survival"];

/**
 * Flux de l'activité Fouiller. Le Joueur sélectionne 1 Hex adjacent au Token
 * Party, choisit une compétence (Perception/Stealth/Survival) opposée au DC du
 * Hex, et l'outcome ajoute des PC sur ce seul Hex (échec critique = -1 PC).
 * IO — validé en jeu.
 */
export class SearchFlow {
    /**
     * @param {Token} token   Token Party ancré au HUD
     * @param {object} actor  personnage du Joueur qui clique (porte le jet)
     */
    static async start(token, actor) {
        if (!token || !actor) return;
        const scene = canvas?.scene ?? null;
        if (!isHexScene(scene) || !isPartyToken(token)) {
            ui.notifications.warn(t("noParty"));
            return;
        }

        // 1. Hex valides = centre sous le Token Party + 6 voisins.
        const origin = coordsToOffset(token.center);
        const validKeys = validSearchKeys(spacesInRange(origin, 1));

        // 2. Sélection mono-hex restreinte, surbrillance dédiée au flux.
        const selection = new HexSelection("forgotten-woods-hex-selection-search");
        selection.showHighlight();
        const onPointerDown = (event) => {
            const local = event.data?.getLocalPosition?.(canvas.app.stage)
                ?? event.getLocalPosition?.(canvas.app.stage);
            if (!local) return;
            const offset = coordsToOffset(local);
            if (!isValidSearchHex(validKeys, offset)) return; // hors zone : ignoré
            selection.select(offset);
        };
        canvas.stage.on("pointerdown", onPointerDown);
        const cleanup = () => {
            canvas.stage?.off("pointerdown", onPointerDown);
            selection.destroy();
        };

        // 3. Fenêtre non-modale Confirmer/Annuler pendant que le Joueur clique.
        let confirmed = false;
        try {
            confirmed = await this.#promptSelection(selection);
        } finally {
            // On nettoie le handler + highlight AVANT le reste (jet, dialog skill).
            const chosen = selection.get();
            cleanup();
            if (!confirmed || !chosen) return;

            // 4. DC du Hex choisi.
            const dc = dcAt(scene, chosen);
            if (!dc) { ui.notifications.warn(t("noDC")); return; }

            // 5. Compétence + jet (publicroll) sur le perso du Joueur.
            const choices = SEARCH_SKILLS.map((s) => ({ value: s, label: skillLabel(s) }));
            const skill = await promptSkill(choices);
            if (!skill) return;
            if (!resolveSkillStatistic(actor, skill)) { ui.notifications.warn(t("noSkill")); return; }
            const outcome = await rollMapSkill(actor, skill, dc, []);

            // 6. Application des PC sur le seul Hex (via relais MJ).
            const delta = deltaForDegree(outcome);
            requestApplySearchPoints(scene.id, offsetToKey(chosen), delta);
        }
    }

    /**
     * Fenêtre non-modale : le bouton Confirmer reste désactivé tant qu'aucun Hex
     * n'est sélectionné (activé via selection.onChange).
     * @param {HexSelection} selection
     * @returns {Promise<boolean>} true si Confirmer, false sinon
     */
    static #promptSelection(selection) {
        return foundry.applications.api.DialogV2.wait({
            window: { title: t("selectPrompt.title") },
            content: `<p>${t("selectPrompt.label")}</p>`,
            modal: false,
            buttons: [
                {
                    action: "confirm",
                    label: t("selectPrompt.confirm"),
                    default: true,
                    callback: () => true
                },
                {
                    action: "cancel",
                    label: t("selectPrompt.cancel"),
                    callback: () => false
                }
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
