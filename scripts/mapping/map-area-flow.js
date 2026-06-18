import { autoIncrement, agOptions } from "./auto-increment.js";
import { buildRangeDeltas, applyDeltas } from "./mapping-points-store.js";
import { coordsToOffset } from "../utils/hex.js";
import { slowestLandSpeed, groupActivityCount } from "../hud/party-counts.js";
import {
    isLockArbiter, tryAcquireLocal, releaseLocal,
    requestLock, sendApplyDeltas, sendRelease
} from "./map-lock.js";

const t = (key) => game.i18n.localize(`FORGOTTEN_WOODS.mapArea.${key}`);

export class MapAreaFlow {
    /**
     * Déroule le flux « Cartographier la zone » pour le client qui clique.
     * @param {Token} token  Token Party ancré au HUD
     * @param {object} actor  acteur Party (pour le compte d'AG)
     * @param {string} flavor  intitulé du jet 1d20 (label de l'activité)
     */
    static async start(token, actor, flavor) {
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

        // 2. Prompt AG.
        const ag = groupActivityCount(slowestLandSpeed(actor));
        const choice = await this.#promptAG(ag);
        if (choice == null) { release(); return; } // annulé → pas de jet

        // 3 & 4. Rayon + calcul des deltas (AG >= 2 uniquement).
        let deltas = null;
        if (choice >= 2) {
            const increased = await this.#promptRadius();
            if (increased == null) { release(); return; } // annulé → pas de jet
            const { radius, delta } = autoIncrement(choice, increased);
            deltas = buildRangeDeltas(coordsToOffset(token.center), radius, delta);
        }

        // 4bis. Application + libération du verrou.
        this.#commit(arbiter, deltas);

        // 5. Jet 1d20 en fin de séquence.
        await this.#roll(token, flavor);
    }

    /** Applique les deltas (ou relâche seulement si rien à écrire), selon le rôle. */
    static #commit(arbiter, deltas) {
        if (deltas && deltas.size > 0) {
            if (arbiter) { applyDeltas(canvas.scene, deltas); releaseLocal(); }
            else sendApplyDeltas(canvas.scene.id, Object.fromEntries(deltas));
        } else if (arbiter) {
            releaseLocal();
        } else {
            sendRelease();
        }
    }

    /** Prompt liste 1..ag. @returns {Promise<number|null>} null si annulé. */
    static async #promptAG(ag) {
        const opts = agOptions(ag).map((n) => `<option value="${n}">${n}</option>`).join("");
        const raw = await foundry.applications.api.DialogV2.prompt({
            window: { title: t("agPrompt.title") },
            content: `<p>${t("agPrompt.label")}</p><select name="ag" autofocus>${opts}</select>`,
            ok: { callback: (event, button) => Number(button.form.elements.ag.value) },
            modal: true
        });
        return raw == null || Number.isNaN(raw) ? null : raw;
    }

    /** Prompt Oui/Non. @returns {Promise<boolean|null>} null si fermé. */
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

    /** Jet 1d20 au chat (locuteur = Token Party). */
    static async #roll(token, flavor) {
        const roll = await new Roll("1d20").evaluate();
        return roll.toMessage({
            flavor,
            speaker: ChatMessage.getSpeaker({ token: token?.document })
        });
    }
}
