import { describe, it, expect } from "vitest";
import { renderActivityHtml } from "../scripts/data/activity-render.js";

describe("renderActivityHtml", () => {
    const base = { label: "Voyager", traits: ["exploration", "move"], description: "Vous progressez." };

    it("rend le titre depuis label", () => {
        expect(renderActivityHtml(base)).toContain('<h3 class="fw-activity-title">Voyager</h3>');
    });

    it("enveloppe le tout dans .item-summary", () => {
        expect(renderActivityHtml(base)).toMatch(/^<div class="item-summary">.*<\/div>$/s);
    });

    it("rend les badges de traits natifs PF2E (tags paizo-style + tag[data-trait])", () => {
        const html = renderActivityHtml(base);
        expect(html).toContain('<div class="tags paizo-style">');
        expect(html).toContain('<span class="tag" data-trait="exploration" data-tooltip="PF2E.TraitDescriptionExploration">exploration</span>');
        expect(html).toContain('<span class="tag" data-trait="move" data-tooltip="PF2E.TraitDescriptionMove">move</span>');
    });

    it("omet la rangée de traits quand traits est vide ou absent", () => {
        expect(renderActivityHtml({ label: "X", traits: [], description: "d" })).not.toContain("tags paizo-style");
        expect(renderActivityHtml({ label: "X", description: "d" })).not.toContain("tags paizo-style");
    });

    it("rend la description dans .description en préservant le HTML inline", () => {
        const html = renderActivityHtml({ label: "X", traits: [], description: "a<ul><li>b</li></ul>" });
        expect(html).toContain('<div class="description">a<ul><li>b</li></ul></div>');
    });

    it("préserve la syntaxe @Check littérale dans la description", () => {
        const html = renderActivityHtml({ label: "X", traits: [], description: "Faites un @Check[nature] ici." });
        expect(html).toContain("@Check[nature]");
    });

    it("rend le bloc d'outcomes avec les libellés FR", () => {
        const html = renderActivityHtml({
            label: "X", traits: [], description: "d",
            outcomes: { criticalSuccess: "2 PC.", success: "1 PC.", criticalFailure: "−1 PC." }
        });
        expect(html).toContain('<div class="fw-outcomes">');
        expect(html).toContain("<p><strong>Réussite critique</strong> 2 PC.</p>");
        expect(html).toContain("<p><strong>Réussite</strong> 1 PC.</p>");
        expect(html).toContain("<p><strong>Échec critique</strong> −1 PC.</p>");
    });

    it("omet une ligne de degré absente (ici Échec) et le bloc si outcomes absent", () => {
        const html = renderActivityHtml({
            label: "X", traits: [], description: "d",
            outcomes: { criticalSuccess: "2 PC.", success: "1 PC." }
        });
        expect(html).not.toContain("<strong>Échec</strong>");
        expect(html).not.toContain("<strong>Échec critique</strong>");
        expect(renderActivityHtml({ label: "X", traits: [], description: "d" })).not.toContain("fw-outcomes");
    });
});
