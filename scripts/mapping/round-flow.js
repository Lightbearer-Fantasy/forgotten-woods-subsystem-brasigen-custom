// scripts/mapping/round-flow.js
// Résolution des chips au début d'un Round d'Hexploration. MJ actif uniquement.
// La décision est pure (round-resolution.js) ; ici on applique les mutations PF2E.

import { resolveRoundChips } from "./round-resolution.js";
import { resolveCombatScene } from "./combat-scene.js";
import { isActiveGM } from "./gm-actions.js";
import { isHexScene } from "../utils/scene.js";
import { membersNeedingScout } from "./scout-targets.js";
import { COOK_EFFECT_UUID } from "../data/module-effects.js";

const MODULE_ID = "forgotten-woods-brasigen";
const PARTY_EFFECTS_FLAG = "partyEffects";

/** Personnages (type "character") du Party. */
function characters(party) {
    return (party?.members ?? []).filter((m) => m?.type === "character");
}

/** Acteur Party porté par un token de la scène du combat (Scene hex). */
function partyActorOnScene(scene) {
    const tokenDoc = scene?.tokens?.find?.((t) => t.actor?.type === "party");
    return tokenDoc?.actor ?? null;
}

/** Applique l'Effet: Cuisiner du module à chaque Personnage qui ne l'a pas (dédup sourceId). */
async function applyCookEffect(members) {
    const targets = membersNeedingScout(members, COOK_EFFECT_UUID);
    if (targets.length === 0) return;
    const src = (await fromUuid(COOK_EFFECT_UUID))?.toObject();
    if (!src) { ui.notifications.warn(game.i18n.localize("FORGOTTEN_WOODS.round.cookMissing")); return; }
    src.flags = src.flags ?? {};
    src.flags.core = { ...(src.flags.core ?? {}), sourceId: COOK_EFFECT_UUID };
    for (const actor of targets) await actor.createEmbeddedDocuments("Item", [src]);
}

/** Applique la condition PF2E `fatigued` à chaque Personnage (idempotent). */
async function applyFatigued(members) {
    for (const actor of members) {
        const has = actor.itemTypes?.condition?.some?.((c) => c.slug === "fatigued");
        if (!has) await actor.increaseCondition?.("fatigued");
    }
}

/** Retire la condition `fatigued` de chaque Personnage (pattern handleRest). */
async function removeFatigued(members) {
    for (const actor of members) {
        const c = actor.itemTypes?.condition?.find?.((x) => x.slug === "fatigued");
        if (c) await c.delete();
    }
}

/**
 * Au début d'un Round d'Hexploration : résout les chips en attente du Party.
 * @param {object} combat  document Combat
 * @param {object} change  diff (doit contenir `round`)
 */
export async function onCombatRoundAdvance(combat, change) {
    if (!isActiveGM()) return;
    if (!(change && "round" in change)) return;
    const scene = resolveCombatScene(combat);
    if (!isHexScene(scene)) return;
    const party = partyActorOnScene(scene);
    if (!party) return;

    const chips = party.getFlag(MODULE_ID, PARTY_EFFECTS_FLAG) ?? [];
    const decision = resolveRoundChips(chips);

    if (decision.blocked) {
        await foundry.applications.api.DialogV2.prompt({
            window: { title: game.i18n.localize("FORGOTTEN_WOODS.round.exclusiveTitle") },
            content: `<p>${game.i18n.localize("FORGOTTEN_WOODS.round.exclusiveBody")}</p>`,
            modal: true
        });
        return; // on stoppe sans rien appliquer ni vider les chips
    }

    const members = characters(party);
    if (decision.applyCook) {
        await applyCookEffect(members);
        await party.setFlag(MODULE_ID, "cookRound", { round: combat.round, combatId: combat.id });
    } else {
        await party.unsetFlag(MODULE_ID, "cookRound");
    }
    if (decision.applyFatigued) await applyFatigued(members);
    if (decision.removeFatigued) await removeFatigued(members);

    // Vide tous les chips en attente.
    await party.setFlag(MODULE_ID, PARTY_EFFECTS_FLAG, []);
}
