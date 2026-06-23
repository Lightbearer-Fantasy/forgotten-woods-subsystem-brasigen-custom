import { temporaryItemName } from "./craft-logic.js";

const MODULE_ID = "forgotten-woods-brasigen";

/** Marqueurs one-shot : actorId → timestamp du lancement de Fabriquer. */
const pendingTempCrafts = new Map();

/**
 * Marque le prochain message de craft de cet acteur comme « temporaire » (notre flux).
 * @param {string} actorId
 * @param {number} [now=Date.now()]
 */
export function markTemporaryCraft(actorId, now = Date.now()) {
    if (actorId) pendingTempCrafts.set(actorId, now);
}

/**
 * Consomme (one-shot) le marqueur si présent et dans la fenêtre temporelle.
 * Purge une entrée expirée. Évite qu'un marqueur orphelin tague un craft ultérieur.
 * @param {string} actorId
 * @param {number} [windowMs=10000]
 * @param {number} [now=Date.now()]
 * @returns {boolean}
 */
export function consumeTemporaryCraftMark(actorId, windowMs = 10000, now = Date.now()) {
    const ts = pendingTempCrafts.get(actorId);
    if (ts === undefined) return false;
    pendingTempCrafts.delete(actorId);
    return (now - ts) <= windowMs;
}

/** Résout l'acteur d'un message de craft (contexte PF2E, puis speaker). */
function resolveMessageActor(message) {
    const ctx = message.flags?.pf2e?.context ?? {};
    return (ctx.actor && game.actors.get(ctx.actor))
        || (message.speaker?.token && canvas?.tokens?.get(message.speaker.token)?.actor)
        || (message.speaker?.actor && game.actors.get(message.speaker.actor))
        || null;
}

/** preCreateChatMessage : tague notre carte de craft via le marqueur one-shot. */
function onPreCreateCraftMessage(message) {
    if (message.flags?.pf2e?.context?.action !== "craft") return;
    const actorId = resolveMessageActor(message)?.id
        ?? message.flags?.pf2e?.context?.actor
        ?? message.speaker?.actor;
    if (!actorId) return;
    if (consumeTemporaryCraftMark(actorId)) {
        message.updateSource({ [`flags.${MODULE_ID}.tempCraft`]: true });
    }
}

/** Crée l'objet renommé « (temporaire) » et désactive le bouton. */
async function onReceiveTemp({ itemUuid, quantity, actor, button }) {
    if (!actor?.isOwner) return;
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
    if (button) button.disabled = true;
    await ChatMessage.create({
        author: game.user.id,
        content: `${actor.name} reçoit ${quantity} × ${source.name}.`,
        speaker: { alias: actor.name }
    });
}

/** renderChatMessageHTML : réécrit notre carte de craft (texte + bouton + gating). */
function onRenderCraftCard(message, html) {
    if (!message.getFlag(MODULE_ID, "tempCraft")) return;
    const card = html.querySelector("[data-crafting-result]");
    if (!card) return;
    const outcome = message.flags?.pf2e?.context?.outcome ?? null;

    // 1. Suffixe « (temporaire) » sur le lien d'objet de la carte.
    const link = card.querySelector(".card-content a");
    if (link) link.textContent = temporaryItemName(link.textContent);

    // 2. Bouton de réception (gating par outcome).
    const btnArea = card.querySelector(".card-buttons");
    if (!btnArea) return;
    if (outcome === "success" || outcome === "criticalSuccess") {
        const itemUuid = card.dataset.itemUuid;
        const quantity = Number(card.dataset.craftingQuantity) || 1;
        const actor = resolveMessageActor(message);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.action = "fw-receive-temp";
        btn.textContent = game.i18n.localize("PF2E.Actions.Craft.Details.ReceiveItem");
        btn.addEventListener("click", () => onReceiveTemp({ itemUuid, quantity, actor, button: btn }));
        btnArea.replaceChildren(btn);
    } else {
        // Échec critique : free:true afficherait « Recevoir » → on retire tout.
        btnArea.replaceChildren();
    }
}

/** Enregistre les hooks de carte de craft temporaire (appelé une fois au ready). */
export function registerCraftTempHooks() {
    Hooks.on("preCreateChatMessage", onPreCreateCraftMessage);
    Hooks.on("renderChatMessageHTML", (message, html) => onRenderCraftCard(message, html));
}
