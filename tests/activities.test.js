import { describe, it, expect } from "vitest";
import {
    GROUP_ACTIVITIES,
    INDIVIDUAL_ACTIVITIES,
    activitySortKey
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

    it("chaque activité a une icône littérale non vide (chemins core ou pf2e)", () => {
        for (const a of ALL) {
            expect(a.img, a.id).toBeTruthy();
            expect(a.img, a.id).toMatch(/^(?:icons|systems)\//);
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
        expect(byId("craft").description).toContain("@Action[craft]{Fabriquer}");
        expect(byId("repair").description).toContain("@Action[repair]{Réparer}");
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

    it("investigate, treat-wounds, craft et repair n'ont pas de champ check (routés par id)", () => {
        expect(byId("investigate").check).toBeUndefined();
        expect(byId("treat-wounds").check).toBeUndefined();
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

describe("flag noRoll (v0.6 sp1)", () => {
    const byId = (id) => ALL.find((a) => a.id === id);
    it("Voyager, Défendre et Échapper aux regards portent noRoll:true", () => {
        for (const id of ["travel", "defend", "avoid-notice"]) {
            expect(byId(id).noRoll, id).toBe(true);
        }
    });
    it("Partir en reconnaissance NE porte PAS noRoll (garde son d20)", () => {
        expect(byId("scout").noRoll).toBeUndefined();
    });
    it("les activités à jet/ressource n'ont pas noRoll", () => {
        for (const id of ["map-area", "search", "cook", "scout", "hunt-and-gather", "gather-materials"]) {
            expect(byId(id).noRoll, id).toBeUndefined();
        }
    });
});

describe("textes v0.6 sp2", () => {
    const byId = (id) => ALL.find((a) => a.id === id);
    it("cook : nouveaux outcomes (crit succ économise, succ +1 lendemain, crit échec perd 1)", () => {
        const o = byId("cook").outcomes;
        expect(o.criticalSuccess).toContain("économisez un ingrédient frais");
        expect(o.success).toContain("bonus sans type de +1");
        expect(o.criticalFailure).toContain("Vous perdez 1 ingrédient frais");
        expect(o.failure).toBeUndefined();
    });
    it("craft : texte mis à jour (3 et 5 matériaux, batch de 2, marqueur @Action[craft])", () => {
        const d = byId("craft").description;
        expect(d).toContain("3 matériaux de fabrication");
        expect(d).toContain("5 matériaux de fabrication");
        expect(d).toContain("batch de 2 consommables");
        expect(d).toContain("@Action[craft]{Fabriquer}");
    });
    it("craft : outcomes listés sous le tiret (crit succ économise, succ fabrique, crit échec perd 1)", () => {
        const o = byId("craft").outcomes;
        expect(o.criticalSuccess).toBe("Vous fabriquez l'objet temporaire en économisant 1 matériau de fabrication.");
        expect(o.success).toBe("Vous fabriquez l'objet temporaire.");
        expect(o.criticalFailure).toBe("Votre tentative infructueuse a endommagé une partie des matériaux. Vous perdez 1 matériau de fabrication.");
        expect(o.failure).toBeUndefined();
        // la prose crit/échec a quitté la description (déplacée dans outcomes)
        expect(byId("craft").description).not.toContain("Une réussite critique au Craft");
    });
});
