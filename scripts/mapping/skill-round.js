import { tallySkills } from "./skill-malus.js";
import { composeModifiers } from "./skill-modifiers.js";
import { sumDeltas } from "./skill-outcome.js";
import { aspectOf } from "./aspect-store.js";
import { effectiveDefault, writeDefault } from "../data/skill-memory.js";
import { buildSignedRangeDeltas, applyDeltas } from "./mapping-points-store.js";
import { readChips } from "./hex-chips-store.js";
import { filterMappableDeltas, occludeBehindMountains } from "./mountain-occlusion.js";
import { gridCorridor } from "../utils/hex.js";

/**
 * Associe chaque membre PJ à un propriétaire connecté (joueur), sinon null
 * (le MJ prendra le relais). Pur — testable hors Foundry.
 * @param {{id: string}[]} members
 * @param {Set<string>} activeUserIds  ids des joueurs connectés (hors MJ)
 * @param {(member: object, userId: string) => boolean} isOwner
 * @returns {{actorId: string, ownerId: string|null}[]}
 */
export function resolveParticipants(members, activeUserIds, isOwner) {
    return members.map((m) => {
        const ownerId = [...activeUserIds].find((uid) => isOwner(m, uid)) ?? null;
        return { actorId: m.id, ownerId };
    });
}

/**
 * Orchestrateur du round de cartographie. Instancié et piloté côté MJ actif.
 * Collecte les choix de compétence, déclenche les jets simultanés, agrège et
 * applique les PC, mémorise les choix, puis relâche le verrou.
 */
export class SkillRound {
    /** @type {Map<string, string>} actorId -> skill choisi */
    #choices = new Map();
    /** @type {Set<string>} actorId encore attendus */
    #pending = new Set();
    /** @type {Function|null} résolveur quand tous ont répondu */
    #resolveAll = null;
    #ctx = null;

    /**
     * @param {object} deps  injection des helpers socket (Task 13) :
     *   askSkill(ownerId, actorId, defaultSkill), rollNow(ownerId, actorId, skill, dc, modifiers),
     *   refreshLock(), releaseLock(), promptLocal(actorId, defaultSkill), rollLocal(actor, skill, dc, modifiers)
     */
    constructor(deps) {
        this.deps = deps;
    }

    /** @param {{sceneId, tokenId, offset, radius, autoDelta, dc}} ctx */
    async run(ctx) {
        this.#ctx = ctx;
        const scene = game.scenes.get(ctx.sceneId);
        const token = scene?.tokens?.get(ctx.tokenId);
        const party = token?.actor;
        const members = (party?.members ?? []).filter((m) => m?.type === "character");

        const activeIds = new Set(
            game.users.filter((u) => u.active && !u.isGM).map((u) => u.id)
        );
        const isOwner = (m, uid) => m.testUserPermission?.(game.users.get(uid), "OWNER");
        const participants = resolveParticipants(members, activeIds, isOwner);

        // 1. Heartbeat du verrou pendant toute la collecte.
        const heartbeat = setInterval(() => this.deps.refreshLock(), 30000);

        // 2. Demander la compétence à chacun.
        this.#pending = new Set(participants.map((p) => p.actorId));
        const allChosen = new Promise((resolve) => { this.#resolveAll = resolve; });
        for (const { actorId, ownerId } of participants) {
            const actor = members.find((m) => m.id === actorId);
            const def = effectiveDefault(actor);
            if (ownerId) this.deps.askSkill(ownerId, actorId, def);
            else void this.#promptOrphan(actorId, def); // fire-and-forget : résolution via onChosen/onAbandon
        }
        if (this.#pending.size === 0) this.#resolveAll();
        await allChosen;
        clearInterval(heartbeat);

        // 3. Malus/aspect puis jets simultanés.
        const aspect = aspectOf(scene);
        const tally = tallySkills([...this.#choices.values()]);
        const results = await this.#rollAll(members, participants, aspect, tally, ctx.dc);

        // 4. Agrégation et application unique. Montagne : pas de PC posé SUR une Montagne,
        // ni AU-DELÀ d'une Montagne (occlusion), tant que le Party n'est pas sur une Montagne.
        const total = ctx.autoDelta + sumDeltas(results);
        const raw = buildSignedRangeDeltas(ctx.offset, ctx.radius, total);
        const chipMap = readChips(scene);
        const isMtn = (key) => chipMap[key]?.includes("montagne") ?? false;
        const originIsMountain = isMtn(`${ctx.offset.i},${ctx.offset.j}`);
        let visible = raw;
        if (!originIsMountain) {
            const originCenter = canvas.grid.getCenterPoint(ctx.offset);
            const candidates = [...raw.keys()].map((key) => {
                const [i, j] = key.split(",").map(Number);
                return { key, center: canvas.grid.getCenterPoint({ i, j }), mountain: isMtn(key) };
            });
            const keep = new Set(occludeBehindMountains(originCenter, candidates, gridCorridor()).map((c) => c.key));
            visible = new Map([...raw].filter(([key]) => keep.has(key)));
        }
        const deltas = filterMappableDeltas(visible, originIsMountain, isMtn);
        if (deltas.size > 0) applyDeltas(scene, deltas);

        // 5. Mémorisation des choix et libération.
        for (const [actorId, skill] of this.#choices) {
            writeDefault(members.find((m) => m.id === actorId), skill);
        }
        this.deps.releaseLock();
    }

    /** Le MJ ouvre lui-même le prompt d'un PJ orphelin. */
    async #promptOrphan(actorId, def) {
        const skill = await this.deps.promptLocal(actorId, def);
        if (skill == null) this.onAbandon(actorId);
        else this.onChosen(actorId, skill);
    }

    /** Reçu via socket (ou local) : un participant a choisi. */
    onChosen(actorId, skill) {
        if (!this.#pending.has(actorId)) return;
        this.#choices.set(actorId, skill);
        this.#pending.delete(actorId);
        if (this.#pending.size === 0) this.#resolveAll?.();
    }

    /** Reçu via socket (ou déconnexion) : un participant abandonne → exclu. */
    onAbandon(actorId) {
        if (!this.#pending.has(actorId)) return;
        this.#pending.delete(actorId);
        if (this.#pending.size === 0) this.#resolveAll?.();
    }

    /** Lance tous les jets (propriétaires via socket, orphelins en local) et collecte les degrés. */
    async #rollAll(members, participants, aspect, tally, dc) {
        const results = [];
        const remoteWaiters = [];
        for (const { actorId, ownerId } of participants) {
            if (!this.#choices.has(actorId)) continue; // exclu
            const skill = this.#choices.get(actorId);
            const modifiers = composeModifiers(skill, aspect, tally);
            if (ownerId) {
                remoteWaiters.push(
                    this.deps.rollNow(ownerId, actorId, skill, dc, modifiers)
                        .then((degree) => results.push({ actorId, degree }))
                );
            } else {
                const actor = members.find((m) => m.id === actorId);
                const degree = await this.deps.rollLocal(actor, skill, dc, modifiers);
                results.push({ actorId, degree });
            }
        }
        await Promise.all(remoteWaiters);
        return results;
    }
}
