import { setCamp } from "./camp-store.js";
import { restHealAmount } from "./rest-heal.js";
import { resourceAmountForOutcome } from "./resource-amount.js";
import { addOrIncrement, RESOURCE_LABELS } from "./gpc-bridge.js";
import { membersNeedingScout } from "./scout-targets.js";
import { PARTY_EFFECTS, withEffect, withoutEffect } from "../data/party-effects.js";
import { searchPointsDeltas } from "./search-targets.js";
import { applyDeltas } from "./mapping-points-store.js";
import { temporaryItemName } from "./craft-logic.js";

const SCOUT_UUID = "Compendium.pf2e.other-effects.Item.EMqGwUi3VMhCjTlF";

const MODULE_ID = "forgotten-woods-brasigen";
const PARTY_EFFECTS_FLAG = "partyEffects";

const CHANNEL = "module.forgotten-woods-brasigen";
const t = (key, data) => game.i18n.format(`FORGOTTEN_WOODS.gm.${key}`, data ?? {});

/** @returns {boolean} vrai si ce client est le MJ actif (exécutant des actions). */
export function isActiveGM() {
    return game.users.activeGM?.isSelf === true;
}

/** Parse une clé "i,j" en offset. */
function parseKey(key) {
    const [i, j] = String(key).split(",").map(Number);
    return { i, j };
}

/** Joueur → MJ : monter le camp sur un hex (après confirmation joueur côté flow). */
export function requestMakeCamp(sceneId, offsetKey) {
    if (isActiveGM()) return handleMakeCamp({ sceneId, offsetKey });
    game.socket.emit(CHANNEL, { type: "campRequest", sceneId, offsetKey });
}

/** Joueur → MJ : repos du Party. */
export function requestRest(partyActorId) {
    if (isActiveGM()) return handleRest({ partyActorId });
    game.socket.emit(CHANNEL, { type: "restRequest", partyActorId });
}

/** Joueur → MJ : proposer l'ajout de ressources après un jet. */
export function requestResource(payload) {
    if (isActiveGM()) return handleResource(payload);
    game.socket.emit(CHANNEL, { type: "resourceRequest", ...payload });
}

/** Joueur → MJ : appliquer l'effet Reconnaissance à tous les PJ du Party. */
export function requestApplyScout(partyActorId) {
    if (isActiveGM()) return handleApplyScout({ partyActorId });
    game.socket.emit(CHANNEL, { type: "scoutRequest", partyActorId });
}

/**
 * Pose un marqueur d'effet de groupe (par clé) sur l'acteur Party, via un FLAG
 * (PF2E refuse les items effect sur l'acteur party). Sans doublon. MJ.
 */
async function setPartyEffect(partyActorId, key) {
    const party = game.actors.get(partyActorId);
    if (!party || !PARTY_EFFECTS[key]) return;
    const current = party.getFlag(MODULE_ID, PARTY_EFFECTS_FLAG) ?? [];
    if (current.includes(key)) { ui.notifications.info(t("partyEffectAlready")); return; }
    await party.setFlag(MODULE_ID, PARTY_EFFECTS_FLAG, withEffect(current, key));
    ui.notifications.info(t("partyEffectApplied"));
}

/** Retire un marqueur d'effet de groupe (par clé) de l'acteur Party. MJ. */
async function clearPartyEffect(partyActorId, key) {
    const party = game.actors.get(partyActorId);
    if (!party) return;
    const current = party.getFlag(MODULE_ID, PARTY_EFFECTS_FLAG) ?? [];
    if (!current.includes(key)) return;
    await party.setFlag(MODULE_ID, PARTY_EFFECTS_FLAG, withoutEffect(current, key));
    ui.notifications.info(t("partyEffectRemoved"));
}

/** Joueur → MJ : poser un marqueur d'effet sur le Party. */
export function requestSetPartyEffect(partyActorId, key) {
    if (isActiveGM()) return setPartyEffect(partyActorId, key);
    game.socket.emit(CHANNEL, { type: "partyEffectSet", partyActorId, key });
}

/** Joueur → MJ : retirer un marqueur d'effet du Party. */
export function requestClearPartyEffect(partyActorId, key) {
    if (isActiveGM()) return clearPartyEffect(partyActorId, key);
    game.socket.emit(CHANNEL, { type: "partyEffectClear", partyActorId, key });
}

/** Joueur → MJ : confirmer puis appliquer une consommation de ressource (+ effet éventuel). */
export function requestConsumeResource(payload) {
    if (isActiveGM()) return handleConsumeResource(payload);
    game.socket.emit(CHANNEL, { type: "consumeRequest", ...payload });
}

/** Garde mémoire (côté MJ) contre les double-emits rapides sur un même message. */
const receivingTemp = new Set();

/** Joueur → MJ : réceptionner l'objet temporaire d'une carte de craft (first-click-wins). */
export function requestReceiveTemp(payload) {
    if (isActiveGM()) return handleReceiveTemp(payload);
    game.socket.emit(CHANNEL, { type: "receiveTempRequest", ...payload });
}

/**
 * MJ : crée l'objet « (temporaire) » UNE seule fois pour ce message, puis pose le flag
 * persistant `received` (re-rend le bouton désactivé sur tous les clients).
 * Idempotent : flag persistant + garde mémoire contre les emits concurrents.
 */
async function handleReceiveTemp({ messageId, actorId, itemUuid, quantity }) {
    const message = messageId ? game.messages.get(messageId) : null;
    if (message?.getFlag(MODULE_ID, "received")) return;          // déjà reçu (persistant)
    if (messageId && receivingTemp.has(messageId)) return;         // emit concurrent en cours
    if (messageId) receivingTemp.add(messageId);
    try {
        const actor = game.actors.get(actorId);
        if (!actor) return;
        const source = (await fromUuid(itemUuid))?.toObject();
        if (!source) {
            ui.notifications.warn(game.i18n.localize("PF2E.Actions.Craft.Warning.CantAddItem"));
            return;
        }
        source.name = temporaryItemName(source.name);
        source.system.quantity = quantity;
        source.system.temporary = true;
        if (!await actor.addToInventory(source)) {
            ui.notifications.warn(game.i18n.localize("PF2E.Actions.Craft.Warning.CantAddItem"));
            return;
        }
        await message?.setFlag(MODULE_ID, "received", true);
        await ChatMessage.create({
            author: game.user.id,
            content: `${actor.name} reçoit ${quantity} × ${source.name}.`,
            speaker: { alias: actor.name }
        });
    } finally {
        if (messageId) receivingTemp.delete(messageId);
    }
}

/** Joueur → MJ : appliquer un delta de PC sur un seul Hex (Fouiller). */
export function requestApplySearchPoints(sceneId, offsetKey, delta) {
    if (isActiveGM()) return handleApplySearchPoints({ sceneId, offsetKey, delta });
    game.socket.emit(CHANNEL, { type: "searchPoints", sceneId, offsetKey, delta });
}

async function handleConsumeResource({ resourceKey, activityLabel, skillLabel, outcome, amount, partyActorId, effectKey }) {
    // Ni perte ni effet (ex. échec simple) : rien à confirmer.
    if ((amount ?? 0) === 0 && !effectKey) return;
    const confirmed = await foundry.applications.api.DialogV2.confirm({
        window: { title: t("consumeTitle") },
        content: `<p>${t("consumePrompt", {
            activity: activityLabel,
            skill: skillLabel ?? "",
            outcome: game.i18n.localize(`FORGOTTEN_WOODS.gm.outcome.${outcome || "none"}`),
            amount: Math.abs(amount ?? 0),
            resource: RESOURCE_LABELS[resourceKey] ?? resourceKey
        })}${effectKey ? t("consumeEffectSuffix") : ""}</p>`,
        modal: true
    });
    if (!confirmed) return;
    if (amount) addOrIncrement(resourceKey, amount);
    if (effectKey && partyActorId) await setPartyEffect(partyActorId, effectKey);
}

async function handleApplySearchPoints({ sceneId, offsetKey, delta }) {
    const scene = game.scenes.get(sceneId);
    if (!scene) return;
    const deltas = searchPointsDeltas(offsetKey, delta);
    if (deltas.size === 0) return;       // échec simple (delta 0) : rien à écrire
    return applyDeltas(scene, deltas);   // applyDeltas re-garde isGM + clamp [0,MAX]
}

async function handleMakeCamp({ sceneId, offsetKey }) {
    const scene = game.scenes.get(sceneId);
    if (!scene) return;
    await setCamp(scene, parseKey(offsetKey), true);
    ui.notifications.info(t("madeCamp"));
}

async function handleRest({ partyActorId }) {
    const party = game.actors.get(partyActorId);
    const members = (party?.members ?? []).filter((m) => m?.type === "character");
    for (const actor of members) {
        const conMod = actor.system?.abilities?.con?.mod ?? 0;
        const level = actor.system?.details?.level?.value ?? 1;
        const heal = restHealAmount(conMod, level);
        const hp = actor.system?.attributes?.hp;
        if (hp) {
            const next = Math.min(hp.max, (hp.value ?? 0) + heal);
            await actor.update({ "system.attributes.hp.value": next });
        }
        const fatigued = actor.itemTypes?.condition?.find?.((c) => c.slug === "fatigued");
        if (fatigued) await fatigued.delete();
    }
    ui.notifications.info(t("rested"));
}

async function handleResource({ resourceKey, activityLabel, skillLabel, outcome }) {
    const confirmed = await foundry.applications.api.DialogV2.confirm({
        window: { title: t("resourceTitle") },
        content: `<p>${t("resourcePrompt", {
            activity: activityLabel, skill: skillLabel,
            outcome: game.i18n.localize(`FORGOTTEN_WOODS.gm.outcome.${outcome || "none"}`)
        })}</p>`,
        modal: true
    });
    if (!confirmed) return;
    addOrIncrement(resourceKey, resourceAmountForOutcome(outcome));
}

async function handleApplyScout({ partyActorId }) {
    const party = game.actors.get(partyActorId);
    const members = (party?.members ?? []).filter((m) => m?.type === "character");
    const targets = membersNeedingScout(members, SCOUT_UUID);
    if (targets.length === 0) {
        ui.notifications.info(t("scoutAlready"));
        return;
    }
    const src = (await fromUuid(SCOUT_UUID))?.toObject();
    if (!src) {
        ui.notifications.warn(t("scoutMissing"));
        return;
    }
    // Marque la source pour rendre la dédup déterministe au prochain clic.
    src.flags = src.flags ?? {};
    src.flags.core = { ...(src.flags.core ?? {}), sourceId: SCOUT_UUID };
    for (const actor of targets) {
        await actor.createEmbeddedDocuments("Item", [src]);
    }
    ui.notifications.info(t("scoutApplied", { count: targets.length }));
}

/** Écouteur socket : seul le MJ actif traite les requêtes. À appeler au ready. */
export function registerGmActions() {
    game.socket.on(CHANNEL, (data) => {
        if (!isActiveGM()) return;
        if (data?.type === "campRequest") handleMakeCamp(data);
        else if (data?.type === "restRequest") handleRest(data);
        else if (data?.type === "resourceRequest") handleResource(data);
        else if (data?.type === "scoutRequest") handleApplyScout(data);
        else if (data?.type === "partyEffectSet") setPartyEffect(data.partyActorId, data.key);
        else if (data?.type === "partyEffectClear") clearPartyEffect(data.partyActorId, data.key);
        else if (data?.type === "consumeRequest") handleConsumeResource(data);
        else if (data?.type === "searchPoints") handleApplySearchPoints(data);
        else if (data?.type === "receiveTempRequest") handleReceiveTemp(data);
    });
}
