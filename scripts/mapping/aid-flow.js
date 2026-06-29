// scripts/mapping/aid-flow.js
import { allyChoices } from "./aid-targets.js";
import { actorSkillChoices } from "../data/activity-actions.js";

const t = (key) => game.i18n.localize(`FORGOTTEN_WOODS.aid.${key}`);

/**
 * S'entraider : jusqu'à 2 cycles séquentiels. Chaque cycle = un dialogue
 * (allié + compétence) → action Aid native PF2E (jet immédiat, DC 15).
 * IO — clés d'options de `.use()` confirmées par sonde runtime + validation en jeu.
 */
export class AidFlow {
    static async start(token, actor) {
        if (!token || !actor) return;
        const party = token.actor;
        const aided = [];
        for (let i = 0; i < 2; i++) {
            const allies = allyChoices(party, actor.id, aided);
            if (allies.length === 0) {
                if (i === 0) ui.notifications.info(t("noAlly"));
                return;
            }
            const choice = await this.#prompt(allies, actorSkillChoices(actor));
            if (!choice) return;                       // Passer / fermeture → on arrête
            const ally = party.members.find((m) => m.id === choice.allyId);
            if (!ally) continue;
            aided.push(ally.id);
            const aidAction = game.pf2e.actions?.get?.("aid");
            // Clés d'options ajustées selon la sonde runtime (validation en jeu).
            await aidAction?.use?.({
                actors: [actor],
                statistic: choice.skill,
                difficultyClass: { value: 15 },
                target: ally
            });
        }
    }

    /**
     * @param {{id:string,name:string}[]} allies
     * @param {{value:string,label:string}[]} skills
     * @returns {Promise<{allyId:string, skill:string}|null>}
     */
    static #prompt(allies, skills) {
        const allyOpts = allies.map((a) => `<option value="${a.id}">${a.name}</option>`).join("");
        const skillOpts = skills.map((s) => `<option value="${s.value}">${s.label}</option>`).join("");
        return foundry.applications.api.DialogV2.wait({
            window: { title: t("dialogTitle") },
            content:
                `<p>${t("selectAllyLabel")}</p>` +
                `<select name="ally" autofocus>${allyOpts}</select>` +
                `<p style="margin-top:.5em">${t("selectSkillLabel")}</p>` +
                `<select name="skill">${skillOpts}</select>`,
            buttons: [
                {
                    action: "aid",
                    label: t("aidButton"),
                    default: true,
                    callback: (event, button) => ({
                        allyId: button.form.elements.ally.value,
                        skill: button.form.elements.skill.value
                    })
                },
                { action: "pass", label: t("passButton"), callback: () => null }
            ],
            rejectClose: false
        });
    }
}
