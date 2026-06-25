import { requestRest, requestSetPartyEffect } from "./gm-actions.js";

const t = (key) => game.i18n.localize(`FORGOTTEN_WOODS.rest.${key}`);

/**
 * Se reposer : confirmation joueur, puis soins + retrait Fatigued côté MJ.
 * (Le grisage sans camp est géré au rendu du HUD.) IO — validé en jeu.
 */
export class RestFlow {
    /** @param {Token} token  Token Party ancré au HUD */
    static async start(token) {
        const party = token?.actor;
        if (!party) return;
        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: { title: t("title") },
            content: `<p>${t("confirm")}</p>`,
            modal: true
        });
        if (!confirmed) return;
        requestRest(party.id);
        requestSetPartyEffect(party.id, "rest");
    }
}
