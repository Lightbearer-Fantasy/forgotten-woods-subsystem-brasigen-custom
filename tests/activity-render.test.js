import { describe, it, expect } from "vitest";
import { renderActivityHtml } from "../scripts/data/activity-render.js";

describe("renderActivityHtml", () => {
    const base = { label: "Voyager", traits: ["exploration", "move"], description: "Vous progressez." };

    it("rend le titre depuis label", () => {
        expect(renderActivityHtml(base)).toContain('<h3 class="fw-activity-title">Voyager</h3>');
    });

    it("rend une rangée de badges de traits", () => {
        const html = renderActivityHtml(base);
        expect(html).toContain('<div class="fw-traits">');
        expect(html).toContain('<span class="fw-trait">exploration</span>');
        expect(html).toContain('<span class="fw-trait">move</span>');
    });

    it("omet la rangée de traits quand traits est vide ou absent", () => {
        expect(renderActivityHtml({ label: "X", traits: [], description: "d" })).not.toContain("fw-traits");
        expect(renderActivityHtml({ label: "X", description: "d" })).not.toContain("fw-traits");
    });

    it("rend la description en préservant le HTML inline", () => {
        const html = renderActivityHtml({ label: "X", traits: [], description: "a<ul><li>b</li></ul>" });
        expect(html).toContain('<div class="fw-activity-desc">a<ul><li>b</li></ul></div>');
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

    it("enveloppe le tout dans .fw-activity", () => {
        expect(renderActivityHtml(base)).toMatch(/^<div class="fw-activity">.*<\/div>$/s);
    });
});
