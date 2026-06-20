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
    it("contient 5 activités de groupe et 12 individuelles", () => {
        expect(GROUP_ACTIVITIES).toHaveLength(5);
        expect(INDIVIDUAL_ACTIVITIES).toHaveLength(12);
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

    it("les activités à iconAction utilisent le placeholder en img (résolu au runtime)", () => {
        const withIcon = ALL.filter(a => a.iconAction);
        expect(withIcon.map(a => a.id).sort()).toEqual(
            ["avoid-notice", "hustle", "investigate", "travel", "treat-wounds"].sort()
        );
        for (const a of withIcon) expect(a.img, a.id).toBe(PLACEHOLDER_IMG);
    });

    it("les activités sans iconAction portent un chemin d'icône littéral (≠ placeholder)", () => {
        for (const a of ALL.filter(a => !a.iconAction)) {
            expect(a.img, a.id).not.toBe(PLACEHOLDER_IMG);
            expect(a.img, a.id).toMatch(/^icons\//);
        }
    });
});

describe("renommages et nouvelles activités v0.5", () => {
    const byId = (id) => ALL.find((a) => a.id === id);

    it("applique les libellés français v0.5", () => {
        expect(byId("avoid-notice").label).toBe("Échapper aux regards");
        expect(byId("defend").label).toBe("Défendre");
        expect(byId("investigate").label).toBe("Enquêter");
        expect(byId("scout").label).toBe("Partir en reconnaissance");
        expect(byId("search").label).toBe("Fouiller");
        expect(byId("treat-wounds").label).toBe("Soigner les blessures");
        expect(byId("hustle").label).toBe("S'empresser");
        expect(byId("aid").label).toBe("S'entraider");
    });

    it("scinde craft et repair en deux activités distinctes", () => {
        expect(byId("craft").label).toBe("Fabriquer");
        expect(byId("craft").slug).toBe("craft");
        expect(byId("repair").label).toBe("Réparer");
        expect(byId("repair").slug).toBe("repair");
    });

    it("ajoute Récupérer des matériaux (gather-materials)", () => {
        const g = byId("gather-materials");
        expect(g.label).toBe("Récupérer des matériaux");
        expect(g.check).toEqual({ allSkills: true, vsHexDC: true });
        expect(g.outcomes.failure).toBe("Vous revenez bredouille.");
        expect(g.outcomes.success).toContain("2 matériaux");
        expect(g.outcomes.criticalSuccess).toContain("3 matériaux");
    });

    it("le texte de S'empresser ne mentionne plus « Presser le Pas »", () => {
        expect(byId("hustle").description).not.toContain("Presser");
        expect(byId("hustle").description).toContain("Vous empresser");
    });
});

describe("marqueurs @Action (liens @UUID inline)", () => {
    const byId = (id) => ALL.find((a) => a.id === id);
    it("place le marqueur d'action sur le mot voulu", () => {
        expect(byId("treat-wounds").description).toContain("@Action[treat-wounds]{Treat Wounds}");
        expect(byId("investigate").description).toContain("@Action[recall-knowledge]{Recall Knowledge}");
        expect(byId("aid").description).toContain("@Action[aid]{Aid}");
        expect(byId("craft").description).toContain("@Action[craft]{créer}");
        expect(byId("repair").description).toContain("@Action[repair]{réparer}");
    });
    it("les activités sans action nommée n'ont pas de marqueur", () => {
        for (const id of ["defend", "scout", "avoid-notice", "search", "map-area"]) {
            expect(byId(id).description, id).not.toContain("@Action[");
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

    it("treat-wounds garde check.skills:[medicine] sans vsHexDC", () => {
        expect(byId("treat-wounds").check.skills).toEqual(["medicine"]);
        expect(byId("treat-wounds").check.vsHexDC).toBeUndefined();
    });

    it("investigate, craft et repair n'ont pas de champ check (routés par id)", () => {
        expect(byId("investigate").check).toBeUndefined();
        expect(byId("craft").check).toBeUndefined();
        expect(byId("repair").check).toBeUndefined();
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
