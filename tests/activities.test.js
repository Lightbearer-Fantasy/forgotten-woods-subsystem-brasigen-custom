import { describe, it, expect } from "vitest";
import {
    GROUP_ACTIVITIES,
    INDIVIDUAL_ACTIVITIES,
    activitySortKey,
    PLACEHOLDER_IMG
} from "../scripts/data/activities.js";
import { renderActivityHtml } from "../scripts/data/activity-render.js";

const ALL = [...GROUP_ACTIVITIES, ...INDIVIDUAL_ACTIVITIES];

describe("activitySortKey", () => {
    it("ignore le préfixe « Se » devant reposer", () => {
        expect(activitySortKey("Se reposer")).toBe("reposer");
    });
    it("ignore le préfixe « S' » devant entraider", () => {
        expect(activitySortKey("S'entraider")).toBe("entraider");
    });
    it("ne strippe pas un mot commençant par Se sans espace (Search)", () => {
        expect(activitySortKey("Search")).toBe("search");
    });
});

describe("données d'activités", () => {
    it("contient 5 activités de groupe et 10 individuelles", () => {
        expect(GROUP_ACTIVITIES).toHaveLength(5);
        expect(INDIVIDUAL_ACTIVITIES).toHaveLength(10);
    });

    it("chaque activité a id, label, img, traits (array), description, et une propriété slug", () => {
        for (const a of ALL) {
            expect(a.id, JSON.stringify(a)).toBeTruthy();
            expect(a.label).toBeTruthy();
            expect(a.img).toBeTruthy();
            expect(Array.isArray(a.traits), a.id).toBe(true);
            expect(a.description, a.id).toBeTruthy();
            expect(a).toHaveProperty("slug");
        }
    });

    it("plus aucune activité ne porte de champ chatText", () => {
        for (const a of ALL) expect(a, a.id).not.toHaveProperty("chatText");
    });

    it("les id sont uniques", () => {
        const ids = ALL.map(a => a.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("les descriptions sont distinctes pour chaque activité", () => {
        const texts = ALL.map(a => a.description);
        expect(new Set(texts).size).toBe(texts.length);
    });

    it("chaque panneau est trié par activitySortKey", () => {
        for (const list of [GROUP_ACTIVITIES, INDIVIDUAL_ACTIVITIES]) {
            const keys = list.map(a => activitySortKey(a.label));
            const sorted = [...keys].sort((x, y) => x.localeCompare(y));
            expect(keys).toEqual(sorted);
        }
    });

    it("toutes les activités custom utilisent l'image placeholder par défaut", () => {
        for (const a of ALL) {
            if (a.slug === null) expect(a.img).toBe(PLACEHOLDER_IMG);
        }
    });
});

describe("contenu reformaté PF2E", () => {
    const byId = (id) => ALL.find((a) => a.id === id);

    it("le libellé de map-area est « Cartographier la zone »", () => {
        expect(byId("map-area").label).toBe("Cartographier la zone");
    });

    it("aucune description ne contient le placeholder « à venir »", () => {
        for (const a of ALL) {
            expect(a.description.toLowerCase()).not.toContain("à venir");
        }
    });

    it("les textes clés sont présents (via le rendu)", () => {
        expect(renderActivityHtml(byId("travel"))).toContain("Hex adjacent");
        expect(renderActivityHtml(byId("map-area"))).toContain("Point de Cartographie");
        expect(renderActivityHtml(byId("search"))).toContain("Le Hex gagne 1 PC");
        expect(renderActivityHtml(byId("cook"))).toContain("camp");
    });

    it("map-area expose ses degrés sans afficher d'Échec (0 PC = aucun effet)", () => {
        const o = byId("map-area").outcomes;
        expect(o.criticalSuccess).toBeTruthy();
        expect(o.success).toBeTruthy();
        expect(o.criticalFailure).toBeTruthy();
        expect(o.failure).toBeUndefined();
    });

    it("search, hunt-and-gather et cook n'affichent pas d'Échec", () => {
        for (const id of ["search", "hunt-and-gather", "cook"]) {
            expect(byId(id).outcomes.failure, id).toBeUndefined();
        }
    });

    it("les traits attendus sont en place (EN)", () => {
        expect(byId("map-area").traits).toEqual(["exploration", "concentrate"]);
        expect(byId("travel").traits).toEqual(["exploration", "move"]);
        expect(byId("cook").traits).toEqual(["exploration", "manipulate"]);
        expect(byId("treat-wounds").traits).toEqual(["exploration", "healing", "manipulate"]);
    });

    it("les activités de zone ont check.skills + vsHexDC:true", () => {
        expect(byId("hunt-and-gather").check).toEqual({ skills: ["nature", "survival"], vsHexDC: true });
        expect(byId("search").check).toEqual({ skills: ["perception", "stealth", "survival"], vsHexDC: true });
        expect(byId("cook").check).toEqual({ skills: ["crafting", "cooking-lore"], vsHexDC: true });
    });

    it("les placeholders (Treat Wounds/Craft/Investigate) ont check.skills sans vsHexDC", () => {
        expect(byId("treat-wounds").check.skills).toEqual(["medicine"]);
        expect(byId("treat-wounds").check.vsHexDC).toBeUndefined();
        expect(byId("repair").check.skills).toEqual(["crafting"]);
        expect(byId("repair").check.vsHexDC).toBeUndefined();
        expect(byId("investigate").check.skills).toContain("nature");
        expect(byId("investigate").check.vsHexDC).toBeUndefined();
    });

    it("map-area n'a pas de champ check (routé vers MapAreaFlow)", () => {
        expect(byId("map-area").check).toBeUndefined();
    });

    it("les activités sans jet n'ont pas de champ check", () => {
        for (const id of ["make-camp", "travel", "rest", "hustle", "avoid-notice", "defend", "aid", "scout"]) {
            expect(byId(id).check, id).toBeUndefined();
        }
    });

    it("les descriptions de zone contiennent les @Check attendus", () => {
        expect(byId("map-area").description).toContain("@Check[crafting]");
        expect(byId("map-area").description).toContain("@Check[survival]");
        expect(byId("hunt-and-gather").description).toContain("@Check[nature]");
        expect(byId("hunt-and-gather").description).toContain("@Check[survival]");
        expect(byId("search").description).toContain("@Check[perception]");
        expect(byId("cook").description).toContain("@Check[crafting]");
        expect(byId("cook").description).toContain("@Check[cooking-lore]");
    });
});
