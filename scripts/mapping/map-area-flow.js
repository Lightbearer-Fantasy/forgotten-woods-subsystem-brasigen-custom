import { mapAreaPlan } from "./auto-increment.js";
import { coordsToOffset } from "../utils/hex.js";
import { dcAt } from "./mapping-dc-store.js";
import { chipsAt } from "./hex-chips-store.js";
import { slowestLandSpeed, groupActivityCount } from "../hud/party-counts.js";
import {
    isLockArbiter, tryAcquireLocal, releaseLocal,
    requestLock, sendRelease, startRound
} from "./map-lock.js";

const t = (key) => game.i18n.localize(`FORGOTTEN_WOODS.mapArea.${key}`);

export class MapAreaFlow {
    /**
     * Déroule « Cartographier la zone » pour le client qui clique.
     * @param {Token} token  Token Party ancré au HUD
     * @param {object} actor  acteur Party
     */
    static async start(token, actor) {
        if (!token) return;
        const arbiter = isLockArbiter();

        // 1. Verrou.
        const granted = arbiter ? tryAcquireLocal() : await requestLock();
        if (granted === null) { ui.notifications.warn(t("noGM")); return; }
        if (!granted) {
            await foundry.applications.api.DialogV2.prompt({
                window: { title: t("busy.title") },
                content: `<p>${t("busy.message")}</p>`,
                modal: true
            });
            return;
        }
        const release = () => (arbiter ? releaseLocal() : sendRelease());

        // 2. Prompt AG + rayon (réponse, sans encore calculer le plan).
        const ag = groupActivityCount(slowestLandSpeed(actor));
        const choice = await this.#promptAG(ag);
        if (choice == null) { release(); return; }

        let increased = false;
        if (choice >= 2) {
            const answer = await this.#promptRadius();
            if (answer == null) { release(); return; }
            increased = answer;
        }

        // 3. Position du Party (détermine les chips de terrain) + garde Hex DC.
        const scene = canvas.scene;
        const offset = coordsToOffset(token.center);
        const dc = dcAt(scene, offset);
        if (!dc) { ui.notifications.warn(t("noDC")); release(); return; }

        // 4. Plan (rayon modulé par les chips du Hex du Party) → délégation au MJ.
        const { radius, autoDelta } = mapAreaPlan(choice, increased, chipsAt(scene, offset));
        startRound({
            sceneId: scene.id, tokenId: token.id, offset, radius, autoDelta, dc
        });
    }

    /** Prompt liste 1..ag. @returns {Promise<number|null>} */
    static async #promptAG(ag) {
        const opts = Array.from({ length: Math.max(0, ag) }, (_, k) => k + 1)
            .map((n) => `<option value="${n}">${n}</option>`).join("");
        const raw = await foundry.applications.api.DialogV2.prompt({
            window: { title: t("agPrompt.title") },
            content: `<p>${t("agPrompt.label")}</p><select name="ag" autofocus>${opts}</select>`,
            ok: { callback: (event, button) => Number(button.form.elements.ag.value) },
            modal: true
        });
        return raw == null || Number.isNaN(raw) ? null : raw;
    }

    /** Prompt Oui/Non. @returns {Promise<boolean|null>} */
    static async #promptRadius() {
        return foundry.applications.api.DialogV2.wait({
            window: { title: t("radiusPrompt.title") },
            content: `<p>${t("radiusPrompt.label")}</p>`,
            buttons: [
                { action: "yes", label: t("radiusPrompt.yes"), callback: () => true },
                { action: "no", label: t("radiusPrompt.no"), default: true, callback: () => false }
            ]
        });
    }
}
