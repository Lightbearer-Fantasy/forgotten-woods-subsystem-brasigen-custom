// Image placeholder garantie présente dans Foundry core (image de token par défaut).
export const PLACEHOLDER_IMG = "icons/svg/mystery-man.svg";

/**
 * Clé de tri alphabétique : minuscule, en ignorant les préfixes
 * « se  » (devant « Se reposer ») et « s' » (devant « S'entraider »).
 * @param {string} label
 * @returns {string}
 */
export function activitySortKey(label) {
    const lower = label.toLowerCase();
    if (lower.startsWith("se ")) return lower.slice(3);
    if (lower.startsWith("s'")) return lower.slice(2);
    return lower;
}

// Activités de Groupe (5) — déjà triées par activitySortKey.
export const GROUP_ACTIVITIES = [
    {
        id: "map-area",
        label: "Cartographier une zone",
        slug: null,
        img: PLACEHOLDER_IMG,
        chatText: "<strong>Cartographier une zone</strong> — Texte d'activité à venir."
    },
    {
        id: "make-camp",
        label: "Monter le camp",
        slug: null,
        img: PLACEHOLDER_IMG,
        chatText: "<strong>Monter le camp</strong> — Texte d'activité à venir."
    },
    {
        id: "hustle",
        label: "Presser le pas",
        slug: null,
        img: PLACEHOLDER_IMG,
        chatText: "<strong>Presser le pas</strong> — Texte d'activité à venir."
    },
    {
        id: "rest",
        label: "Se reposer",
        slug: null,
        img: PLACEHOLDER_IMG,
        chatText: "<strong>Se reposer</strong> — Texte d'activité à venir."
    },
    {
        id: "travel",
        label: "Voyager",
        slug: null,
        img: PLACEHOLDER_IMG,
        chatText: "<strong>Voyager</strong> — Texte d'activité à venir."
    }
];

// Activités Individuelles (10) — déjà triées par activitySortKey.
export const INDIVIDUAL_ACTIVITIES = [
    {
        id: "avoid-notice",
        label: "Avoid Notice",
        slug: "avoid-notice",
        img: PLACEHOLDER_IMG,
        chatText: "<strong>Avoid Notice</strong> — Texte d'activité à venir."
    },
    {
        id: "hunt-and-gather",
        label: "Chasser et cueillir",
        slug: null,
        img: PLACEHOLDER_IMG,
        chatText: "<strong>Chasser et cueillir</strong> — Texte d'activité à venir."
    },
    {
        id: "repair",
        label: "Craft - Repair",
        slug: "repair",
        img: PLACEHOLDER_IMG,
        chatText: "<strong>Craft - Repair</strong> — Texte d'activité à venir."
    },
    {
        id: "cook",
        label: "Cuisiner",
        slug: null,
        img: PLACEHOLDER_IMG,
        chatText: "<strong>Cuisiner</strong> — Texte d'activité à venir."
    },
    {
        id: "defend",
        label: "Defend",
        slug: "defend",
        img: PLACEHOLDER_IMG,
        chatText: "<strong>Defend</strong> — Texte d'activité à venir."
    },
    {
        id: "aid",
        label: "S'entraider",
        slug: null,
        img: PLACEHOLDER_IMG,
        chatText: "<strong>S'entraider</strong> — Texte d'activité à venir."
    },
    {
        id: "investigate",
        label: "Investigate",
        slug: "investigate",
        img: PLACEHOLDER_IMG,
        chatText: "<strong>Investigate</strong> — Texte d'activité à venir."
    },
    {
        id: "scout",
        label: "Scout",
        slug: "scout",
        img: PLACEHOLDER_IMG,
        chatText: "<strong>Scout</strong> — Texte d'activité à venir."
    },
    {
        id: "search",
        label: "Search",
        slug: "search",
        img: PLACEHOLDER_IMG,
        chatText: "<strong>Search</strong> — Texte d'activité à venir."
    },
    {
        id: "treat-wounds",
        label: "Treat Wounds",
        slug: "treat-wounds",
        img: PLACEHOLDER_IMG,
        chatText: "<strong>Treat Wounds</strong> — Texte d'activité à venir."
    }
];
