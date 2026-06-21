import { pointsAt } from "./mapping-points-store.js";
import { coordsToOffset, offsetToKey } from "../utils/hex.js";
import { requestMakeCamp } from "./gm-actions.js";

const t = (key) => game.i18n.localize(`FORGOTTEN_WOODS.makeCamp.${key}`);

/**
 * Monter le camp : clic puis vérification. ≥ 2 PC sur le Hex du Party requis.
 * IO — validé en jeu.
 */
export class MakeCampFlow {
    /** @param {Token} token  Token Party ancré au HUD */
    static async start(token) {
        if (!token || !canvas?.scene) return;
        const offset = coordsToOffset(token.center);
        if (pointsAt(canvas.scene, offset) < 2) {
            ui.notifications.warn(t("notEnoughPC"));
            return;
        }
        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: { title: t("title") },
            content: `<p>${t("confirm")}</p>`,
            modal: true
        });
        if (!confirmed) return;
        requestMakeCamp(canvas.scene.id, offsetToKey(offset));
    }
}
