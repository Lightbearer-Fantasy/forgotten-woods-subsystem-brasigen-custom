import { describe, it, expect } from "vitest";
import { resolveParticipants } from "../scripts/mapping/skill-round.js";

describe("resolveParticipants", () => {
    const members = [
        { id: "pc1", ownership: { u1: 3 } },           // u1 propriétaire
        { id: "pc2", ownership: { u2: 3, u3: 1 } },    // u2 propriétaire
        { id: "pc3", ownership: {} }                    // orphelin
    ];
    const isOwner = (m, uid) => (m.ownership[uid] ?? 0) >= 3;

    it("associe chaque PJ à un propriétaire connecté, sinon null", () => {
        const result = resolveParticipants(members, new Set(["u1"]), isOwner);
        expect(result).toEqual([
            { actorId: "pc1", ownerId: "u1" },
            { actorId: "pc2", ownerId: null },
            { actorId: "pc3", ownerId: null }
        ]);
    });
    it("tous orphelins si personne n'est connecté", () => {
        const result = resolveParticipants(members, new Set(), isOwner);
        expect(result.every((p) => p.ownerId === null)).toBe(true);
    });
});
