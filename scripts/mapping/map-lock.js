import { applyDeltas } from "./mapping-points-store.js";

const CHANNEL = "module.forgotten-woods-brasigen";
const TIMEOUT_MS = 120000;

/** Verrou en mémoire (autoritatif sur le MJ actif). @type {{userId:string,timestamp:number}|null} */
let lock = null;
/** Résolveurs en attente d'un lockResponse, côté client demandeur. @type {Map<string, Function>} */
const pendingResolvers = new Map();

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
            const scene = game.scenes.get(data.sceneId);
            if (scene) applyDeltas(scene, new Map(Object.entries(data.deltas)));
            if (lock?.userId === data.userId) lock = null;
            break;
        }
        case "releaseLock": {
            if (lock?.userId === data.userId) lock = null;
            break;
        }
    }
}

/** Enregistre l'écouteur socket et la libération du verrou à la déconnexion. À appeler sur "ready". */
export function registerSocket() {
    game.socket.on(CHANNEL, onSocketMessage);
    Hooks.on("userConnected", (user, connected) => {
        if (!connected && isLockArbiter() && lock?.userId === user.id) lock = null;
    });
}
