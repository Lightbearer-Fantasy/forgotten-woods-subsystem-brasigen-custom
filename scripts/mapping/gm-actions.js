import { setCamp } from "./camp-store.js";
import { restHealAmount } from "./rest-heal.js";
import { resourceAmountForOutcome } from "./resource-amount.js";
import { addOrIncrement } from "./gpc-bridge.js";
import { hasScout, membersNeedingScout } from "./scout-targets.js";

const SCOUT_UUID = "Compendium.pf2e.other-effects.Item.EMqGwUi3VMhCjTlF";

const CHANNEL = "module.forgotten-woods-brasigen";
const t = (key, data) => game.i18n.format(`FORGOTTEN_WOODS.gm.${key}`, data ?? {});

/** @returns {boolean} vrai si ce client est le MJ actif (exécutant des actions). */
function isActiveGM() {
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

/** Applique un effet (par UUID) à l'acteur Party lui-même, sans doublon. MJ. */
async function applyPartyEffect(partyActorId, effectUuid) {
    const party = game.actors.get(partyActorId);
    if (!party) return;
    if (hasScout(party, effectUuid)) { ui.notifications.info(t("partyEffectAlready")); return; }
    const src = (await fromUuid(effectUuid))?.toObject();
    if (!src) { ui.notifications.warn(t("effectMissing")); return; }
    src.flags = src.flags ?? {};
    src.flags.core = { ...(src.flags.core ?? {}), sourceId: effectUuid };
    await party.createEmbeddedDocuments("Item", [src]);
    ui.notifications.info(t("partyEffectApplied"));
}

/** Joueur → MJ : appliquer un effet au Token Party. */
export function requestApplyPartyEffect(partyActorId, effectUuid) {
    if (isActiveGM()) return applyPartyEffect(partyActorId, effectUuid);
    game.socket.emit(CHANNEL, { type: "partyEffectRequest", partyActorId, effectUuid });
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
        else if (data?.type === "partyEffectRequest") applyPartyEffect(data.partyActorId, data.effectUuid);
    });
}
