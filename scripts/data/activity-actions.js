import { GROUP_ACTIVITIES, INDIVIDUAL_ACTIVITIES } from "./activities.js";

/** Slug d'une entrée d'index d'action : system.slug, sinon slugify du nom. */
function entrySlug(entry) {
    return entry?.system?.slug ?? entry?.name?.slugify?.({ strict: true }) ?? null;
}

/**
 * Indexe img et uuid des actions PF2E par slug.
 * @param {Array} indexEntries  entrées de l'index du compendium actionspf2e
 * @returns {{imgBySlug:Record<string,string>, uuidBySlug:Record<string,string>}}
 */
export function buildActionMaps(indexEntries) {
    const imgBySlug = {};
    const uuidBySlug = {};
    for (const e of indexEntries ?? []) {
        const slug = entrySlug(e);
        if (!slug) continue;
        if (e.img) imgBySlug[slug] = e.img;
        if (e.uuid) uuidBySlug[slug] = e.uuid;
    }
    return { imgBySlug, uuidBySlug };
}

/**
 * Icônes custom que pf2e-hud substitue aux icônes de compendium pour certaines actions.
 * Source : map statique dans pf2e-hud/scripts/main.js (minifié).
 */
const PF2E_HUD_ICON_OVERRIDES = {
    "recall-knowledge": "icons/spells/brain-drain.webp",
    "treat-wounds":     "icons/spells/delay-affliction.webp",
};

/**
 * Applique l'icône d'action résolue aux activités portant `iconAction`.
 * Priorité : overrides pf2e-hud > compendium (imgBySlug).
 * @param {Array} activities
 * @param {Record<string,string>} imgBySlug
 */
export function applyActivityIcons(activities, imgBySlug) {
    for (const a of activities) {
        if (!a.iconAction) continue;
        const override = PF2E_HUD_ICON_OVERRIDES[a.iconAction];
        if (override) { a.img = override; continue; }
        if (imgBySlug[a.iconAction]) a.img = imgBySlug[a.iconAction];
    }
}

const ACTION_MARKER = /@Action\[([\w-]+)\]\{([^}]*)\}/g;

/**
 * Remplace les marqueurs `@Action[slug]{label}` par `@UUID[uuid]{label}` si le
 * slug est connu, sinon par `label` seul (dégradation propre).
 * @param {string} html
 * @param {Record<string,string>} uuidBySlug
 * @returns {string}
 */
export function resolveActionMarkers(html, uuidBySlug) {
    return html.replace(ACTION_MARKER, (_m, slug, label) => {
        const uuid = uuidBySlug?.[slug];
        return uuid ? `@UUID[${uuid}]{${label}}` : label;
    });
}

/**
 * Choix de compétences/lores d'un acteur pour le prompt « toutes compétences ».
 * @param {object} actor
 * @returns {{value:string,label:string}[]}
 */
export function actorSkillChoices(actor) {
    const skills = actor?.skills ? Object.values(actor.skills) : [];
    return skills.map((s) => ({ value: s.slug, label: s.label }));
}

let _maps = null;
/**
 * Charge (et cache) les maps slug→img / slug→uuid depuis le compendium PF2E.
 * IO — non testé unitairement. Renvoie des maps vides si le pack est absent.
 * @returns {Promise<{imgBySlug:Record<string,string>, uuidBySlug:Record<string,string>}>}
 */
export async function loadActionMaps() {
    if (_maps) return _maps;
    const pack = game.packs.get("pf2e.actionspf2e");
    if (!pack) return (_maps = { imgBySlug: {}, uuidBySlug: {} });
    try {
        const index = await pack.getIndex({ fields: ["system.slug", "img"] });
        _maps = buildActionMaps([...index]);
    } catch (error) {
        console.warn("forgotten-woods-brasigen | échec du chargement des actions PF2e", error);
        _maps = { imgBySlug: {}, uuidBySlug: {} };
    }
    return _maps;
}

/** Pour les tests / le rechargement : vide le cache des maps. */
export function _resetActionMaps() { _maps = null; }

export const ALL_ACTIVITIES = [...GROUP_ACTIVITIES, ...INDIVIDUAL_ACTIVITIES];
