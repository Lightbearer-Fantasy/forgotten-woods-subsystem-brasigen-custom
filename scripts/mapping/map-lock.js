import { applyDeltas } from "./mapping-points-store.js";
import { SkillRound } from "./skill-round.js";
import { openSkillPrompt, showWaiting } from "../hud/skill-prompt.js";
import { rollMapSkill } from "./skill-roll.js";

const CHANNEL = "module.forgotten-woods-brasigen";
const TIMEOUT_MS = 120000;

/** Verrou en mémoire (autoritatif sur le MJ actif). @type {{userId:string,timestamp:number}|null} */
let lock = null;
/** Résolveurs en attente d'un lockResponse, côté client demandeur. @type {Map<string, Function>} */
const pendingResolvers = new Map();

/** Round actif côté MJ. @type {SkillRound|null} */
let activeRound = null;
/** Résolveurs de rollNow côté client : actorId -> Function. @type {Map<string, Function>} */
const rollResolvers = new Map();
/** Handle de la fenêtre d'attente côté client. */
let waitingHandle = null;

/**
 * Vrai si le verrou de cartographie est libre ou expiré.
 * @param {{ userId: string, timestamp: number }|null} lock
 * @param {number} now  horodatage courant (ms)
 * @param {number} [timeoutMs=120000]  durée d'expiration de sécurité
 * @returns {boolean}
 */
export function lockIsFree(lock, now, timeoutMs = 120000) {
    return !lock || (now - lock.timestamp > timeoutMs);
}

/** @returns {boolean} vrai si ce client est le MJ actif (arbitre du verrou). */
export function isLockArbiter() {
    return game.users.activeGM?.isSelf === true;
}

/** Pose le verrou local s'il est libre. @returns {boolean} accordé ou non. */
export function tryAcquireLocal(userId = game.user.id) {
    const now = Date.now();
    if (!lockIsFree(lock, now, TIMEOUT_MS)) return false;
    lock = { userId, timestamp: now };
    return true;
}

/** Relâche le verrou s'il appartient à userId. */
export function releaseLocal(userId = game.user.id) {
    if (lock?.userId === userId) lock = null;
}

/**
 * Demande le verrou au MJ actif via socket.
 * @returns {Promise<boolean|null>} true accordé, false refusé, null timeout (aucun MJ).
 */
export function requestLock(userId = game.user.id, timeoutMs = 5000) {
    return new Promise((resolve) => {
        pendingResolvers.set(userId, resolve);
        game.socket.emit(CHANNEL, { type: "requestLock", userId });
        setTimeout(() => {
            if (pendingResolvers.has(userId)) {
                pendingResolvers.delete(userId);
                resolve(null);
            }
        }, timeoutMs);
    });
}

/** Envoie au MJ actif les deltas à écrire (le MJ relâche le verrou après écriture). */
export function sendApplyDeltas(sceneId, deltas, userId = game.user.id) {
    game.socket.emit(CHANNEL, { type: "applyDeltas", userId, sceneId, deltas });
}

/** Demande au MJ actif de relâcher le verrou (annulation / AG=1 / delta<=0). */
export function sendRelease(userId = game.user.id) {
    game.socket.emit(CHANNEL, { type: "releaseLock", userId });
}

/** Traite un message socket. Les réponses sont gérées par tout client ; les requêtes par le MJ actif. */
function onSocketMessage(data) {
    // Réponse adressée à un demandeur.
    if (data?.type === "lockResponse") {
        if (data.toUserId !== game.user.id) return;
        const resolve = pendingResolvers.get(game.user.id);
        if (resolve) {
            pendingResolvers.delete(game.user.id);
            resolve(!!data.granted);
        }
        return;
    }
    // Messages adressés à un utilisateur précis (client destinataire).
    if (data?.type === "askSkill" && data.toUserId === game.user.id) {
        openSkillPrompt(data.defaultSkill, game.actors.get(data.actorId)).then((res) => {
            if (res.type === "skill") {
                game.socket.emit(CHANNEL, { type: "skillChosen", actorId: data.actorId, skill: res.skill });
                waitingHandle = showWaiting();
            } else if (res.type === "pass") {
                game.socket.emit(CHANNEL, { type: "skillPass", actorId: data.actorId });
            } else { // "closed"
                game.socket.emit(CHANNEL, { type: "skillClosed", actorId: data.actorId });
            }
        });
        return;
    }
    if (data?.type === "rollNow" && data.toUserId === game.user.id) {
        waitingHandle?.close();
        waitingHandle = null;
        const actor = game.actors.get(data.actorId);
        rollMapSkill(actor, data.skill, data.dc, data.modifiers).then((degree) => {
            game.socket.emit(CHANNEL, { type: "rollResult", actorId: data.actorId, degree });
        });
        return;
    }
    if (data?.type === "cancelRound") {
        waitingHandle?.close();
        waitingHandle = null;
        return;
    }
    if (data?.type === "askRestart" && data.toUserId === game.user.id) {
        promptRestart().then(async (again) => {
            if (again) {
                const { MapAreaFlow } = await import("./map-area-flow.js");
                const token = canvas.scene?.tokens?.get(data.tokenId);
                if (token?.actor) MapAreaFlow.start(token, token.actor);
            }
        });
        return;
    }
    // Requêtes : seul le MJ actif arbitre.
    if (!isLockArbiter()) return;
    switch (data?.type) {
        case "requestLock": {
            const now = Date.now();
            const granted = lockIsFree(lock, now, TIMEOUT_MS);
            if (granted) lock = { userId: data.userId, timestamp: now };
            game.socket.emit(CHANNEL, { type: "lockResponse", toUserId: data.userId, granted });
            break;
        }
        case "applyDeltas": {
            if (lock?.userId !== data.userId) break;
            const scene = game.scenes.get(data.sceneId);
            if (scene) applyDeltas(scene, new Map(Object.entries(data.deltas)));
            if (lock?.userId === data.userId) lock = null;
            break;
        }
        case "releaseLock": {
            if (lock?.userId === data.userId) lock = null;
            break;
        }
        case "startRound": {
            activeRound = new SkillRound(roundDeps());
            activeRound.run({
                sceneId: data.sceneId, tokenId: data.tokenId, offset: data.offset,
                radius: data.radius, autoDelta: data.autoDelta, dc: data.dc,
                initiatorId: data.initiatorId
            });
            break;
        }
        case "skillChosen": {
            activeRound?.onChosen(data.actorId, data.skill);
            break;
        }
        case "skillPass": {
            activeRound?.onPass(data.actorId);
            break;
        }
        case "skillClosed": {
            activeRound?.onClosed(data.actorId);
            break;
        }
        case "rollResult": {
            const resolve = rollResolvers.get(data.actorId);
            if (resolve) { rollResolvers.delete(data.actorId); resolve(data.degree); }
            break;
        }
    }
}

/** Rafraîchit l'horodatage du verrou (arbitre, pendant un round). */
export function refreshLockLocal() {
    if (lock) lock.timestamp = Date.now();
}

/** Relâche inconditionnellement le verrou (fin de round, arbitre). */
export function forceReleaseLocal() {
    lock = null;
}

/** Dépendances injectées dans SkillRound côté MJ. */
function roundDeps() {
    return {
        refreshLock: () => refreshLockLocal(),
        releaseLock: () => forceReleaseLocal(),
        askSkill: (ownerId, actorId, defaultSkill) =>
            game.socket.emit(CHANNEL, { type: "askSkill", toUserId: ownerId, actorId, defaultSkill }),
        rollNow: (ownerId, actorId, skill, dc, modifiers) => new Promise((resolve) => {
            rollResolvers.set(actorId, resolve);
            game.socket.emit(CHANNEL, { type: "rollNow", toUserId: ownerId, actorId, skill, dc, modifiers });
        }),
        promptLocal: (actorId, defaultSkill) => openSkillPrompt(defaultSkill, game.actors.get(actorId)),
        rollLocal: (actor, skill, dc, modifiers) => rollMapSkill(actor, skill, dc, modifiers),
        roundClosed: (initiatorId, tokenId) => {
            game.socket.emit(CHANNEL, { type: "cancelRound" });
            game.socket.emit(CHANNEL, { type: "askRestart", toUserId: initiatorId, tokenId });
        }
    };
}

/** Démarre un round : émet au MJ, ou exécute localement si on est l'arbitre. */
export function startRound(payload) {
    if (isLockArbiter()) {
        activeRound = new SkillRound(roundDeps());
        activeRound.run(payload);
    } else {
        game.socket.emit(CHANNEL, { type: "startRound", ...payload });
    }
}

const t = (key) => game.i18n.localize(`FORGOTTEN_WOODS.mapArea.${key}`);

/** Demande à l'initiateur s'il veut relancer Cartographier après une fermeture. */
function promptRestart() {
    return foundry.applications.api.DialogV2.wait({
        window: { title: t("restart.title") },
        content: `<p>${t("restart.message")}</p>`,
        buttons: [
            { action: "yes", label: t("restart.yes"), callback: () => true },
            { action: "no", label: t("restart.no"), default: true, callback: () => false }
        ],
        rejectClose: false
    }).then((v) => v === true);
}

/** Enregistre l'écouteur socket et la libération du verrou à la déconnexion. À appeler sur "ready". */
export function registerSocket() {
    game.socket.on(CHANNEL, onSocketMessage);
    Hooks.on("userConnected", (user, connected) => {
        if (!connected && isLockArbiter() && lock?.userId === user.id) lock = null;
    });
}
