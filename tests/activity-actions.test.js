import { describe, it, expect } from "vitest";
import {
    buildActionMaps,
    applyActivityIcons,
    resolveActionMarkers,
    actorSkillChoices
} from "../scripts/data/activity-actions.js";

const INDEX = [
    { system: { slug: "balance" }, img: "icons/b.webp", uuid: "Compendium.pf2e.actionspf2e.Item.BBB" },
    { name: "Recall Knowledge", img: "icons/rk.webp", uuid: "Compendium.pf2e.actionspf2e.Item.RRR",
      slugify: () => "recall-knowledge" }
];

describe("buildActionMaps", () => {
    it("indexe img et uuid par slug (system.slug prioritaire)", () => {
        const { imgBySlug, uuidBySlug } = buildActionMaps([INDEX[0]]);
        expect(imgBySlug.balance).toBe("icons/b.webp");
        expect(uuidBySlug.balance).toBe("Compendium.pf2e.actionspf2e.Item.BBB");
    });
    it("retombe sur le slug du nom si system.slug absent", () => {
        const entry = { name: "Recall Knowledge", img: "icons/rk.webp",
            uuid: "u", system: {}, name_slug: "recall-knowledge" };
        // simulate name.slugify
        entry.name = Object.assign(new String("Recall Knowledge"),
            { slugify: () => "recall-knowledge" });
        const { imgBySlug } = buildActionMaps([entry]);
        expect(imgBySlug["recall-knowledge"]).toBe("icons/rk.webp");
    });
    it("ignore une entrée sans img", () => {
        const { imgBySlug } = buildActionMaps([{ system: { slug: "x" } }]);
        expect(imgBySlug.x).toBeUndefined();
    });
});

describe("applyActivityIcons", () => {
    it("remplace img des activités dont iconAction est résolu", () => {
        const acts = [
            { id: "a", img: "PH", iconAction: "balance" },
            { id: "b", img: "icons/lit.webp" }
        ];
        applyActivityIcons(acts, { balance: "icons/b.webp" });
        expect(acts[0].img).toBe("icons/b.webp");
        expect(acts[1].img).toBe("icons/lit.webp");
    });
    it("laisse img inchangé si iconAction introuvable", () => {
        const acts = [{ id: "a", img: "PH", iconAction: "missing" }];
        applyActivityIcons(acts, {});
        expect(acts[0].img).toBe("PH");
    });
});

describe("resolveActionMarkers", () => {
    const map = { "treat-wounds": "Compendium.pf2e.actionspf2e.Item.TW" };
    it("convertit @Action en @UUID quand le slug est connu", () => {
        const out = resolveActionMarkers("Vous pouvez @Action[treat-wounds]{Treat Wounds} ici", map);
        expect(out).toBe("Vous pouvez @UUID[Compendium.pf2e.actionspf2e.Item.TW]{Treat Wounds} ici");
    });
    it("retombe sur le label simple quand le slug est inconnu", () => {
        const out = resolveActionMarkers("X @Action[unknown]{créer} Y", map);
        expect(out).toBe("X créer Y");
    });
    it("gère plusieurs marqueurs", () => {
        const m = { aid: "U1", craft: "U2" };
        const out = resolveActionMarkers("@Action[aid]{Aid} @Action[craft]{créer}", m);
        expect(out).toBe("@UUID[U1]{Aid} @UUID[U2]{créer}");
    });
    it("laisse le texte sans marqueur intact", () => {
        expect(resolveActionMarkers("rien à faire", map)).toBe("rien à faire");
    });
});

describe("actorSkillChoices", () => {
    it("liste toutes les compétences + lores avec value/label", () => {
        const actor = { skills: {
            nature: { slug: "nature", label: "Nature" },
            "cooking-lore": { slug: "cooking-lore", label: "Cuisine (Lore)" }
        } };
        const choices = actorSkillChoices(actor);
        expect(choices).toContainEqual({ value: "nature", label: "Nature" });
        expect(choices).toContainEqual({ value: "cooking-lore", label: "Cuisine (Lore)" });
    });
    it("retourne [] si l'acteur n'a pas de skills", () => {
        expect(actorSkillChoices({})).toEqual([]);
    });
});
