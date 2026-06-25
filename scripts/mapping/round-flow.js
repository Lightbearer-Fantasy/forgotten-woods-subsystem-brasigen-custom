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
    // Durée "unlimited" : on gère nous-mêmes l'expiration (removeCookEffect au
    // Round suivant). PF2E ne suit donc PAS cet effet dans son EffectTracker et
    // ne tente pas de l'auto-supprimer. Sinon, comme tous les PJ portent un effet
    // expirant au MÊME tick, deux passes de refresh() suppriment le même id →
    // « Item does not exist! » (double-delete dans #removeExpired).
    src.system = src.system ?? {};
    src.system.duration = { value: -1, unit: "unlimited", expiry: null, sustained: false };
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

/** Retire l'Effet: Cuisiner (dédup sourceId) de chaque Personnage. */
async function removeCookEffect(members) {
    for (const actor of members) {
        const effects = (actor.itemTypes?.effect ?? []).filter(
            (e) => e?.flags?.core?.sourceId === COOK_EFFECT_UUID
        );
        for (const e of effects) await e.delete();
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

    // Ne déclencher qu'à l'AVANCÉE de Round (jamais au recul). On mémorise le
    // dernier Round vu sur le Combat ; un recul (ex. previousRound après le
    // message d'exclusivité, ou correction d'erreur des joueurs) met juste le
    // flag à jour et sort, sans re-jouer les effets ni boucler.
    const prevRound = combat.getFlag(MODULE_ID, "lastRound") ?? 0;
    const curRound = combat.round;
    await combat.setFlag(MODULE_ID, "lastRound", curRound);
    if (curRound <= prevRound) return;

    const chips = party.getFlag(MODULE_ID, PARTY_EFFECTS_FLAG) ?? [];
    const decision = resolveRoundChips(chips);

    if (decision.blocked) {
        await foundry.applications.api.DialogV2.prompt({
            window: { title: game.i18n.localize("FORGOTTEN_WOODS.round.exclusiveTitle") },
            content: `<p>${game.i18n.localize("FORGOTTEN_WOODS.round.exclusiveBody")}</p>`,
            modal: true
        });
        // Recule d'un Round : le MJ corrige les chips puis ré-avance pour
        // re-déclencher. Le recul est ignoré par la garde d'avancée ci-dessus.
        await combat.previousRound();
        return; // on stoppe sans rien appliquer ni vider les chips
    }

    const members = characters(party);
    // Expiration maîtrisée de l'Effet: Cuisiner : on retire systématiquement
    // celui du Round précédent (passe unique, pas de course avec PF2E), puis on
    // ré-applique si Cuisiner est de nouveau choisi ce Round.
    await removeCookEffect(members);
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

/**
 * Fin d'un Hex Encounter (et UNIQUEMENT lui — pas les combats hors Scene hex) :
 * purge sur le Token Party tout ce qui altère ses Activités de Groupe — chips,
 * marqueur Cuisiner, condition Fatigued et Effet: Cuisiner sur les PJ. L'Hex
 * Encounter tournant en background sur toute l'hexploration, sa fin (ex. fin de
 * quête) remet le Party à zéro.
 * @param {object} combat  document Combat supprimé
 */
export async function onCombatEnd(combat) {
    if (!isActiveGM()) return;
    const scene = resolveCombatScene(combat);
    if (!isHexScene(scene)) return;
    const party = partyActorOnScene(scene);
    if (!party) return;

    const members = characters(party);
    await party.setFlag(MODULE_ID, PARTY_EFFECTS_FLAG, []);
    await party.unsetFlag(MODULE_ID, "cookRound");
    await removeFatigued(members);
    await removeCookEffect(members);
}
