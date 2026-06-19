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
        label: "Cartographier la zone",
        slug: null,
        img: PLACEHOLDER_IMG,
        traits: ["exploration", "concentrate"],
        description:
            "Vous prenez le temps de faire du repérage et de cartographier toutes les Hex adjacentes. Chaque aventurier doit effectuer un jet de Crafting, Society, Nature ou Survival (au choix) contre le DC de la zone. Chaque fois qu'un Skill est utilisé plus de 2 fois, le DC pour ce Skill subit une pénalité sans type de -2 cumulable. En fonction de l'Aspect, certains jets peuvent voir leur DC diminué, comme Nature dans l'Aspect Sauvage ou Society dans l'Aspect du Donjon, ou augmenté, comme Nature dans l'Aspect de Cendres. Le nombre de PC sur une Hex détermine la qualité de la carte effectuée. Pour chaque Activité de Groupe que vous dépensez au-delà de 1 pour Cartographier la zone, vous pouvez soit augmenter le rayon de repérage de 1 Hex (une fois) ou gagner automatiquement 1 PC (cumulable). Vous ne pouvez pas découvrir une nouvelle Ancre à distance si vous n'entendez pas le Chant." +
            "<ul>" +
            "<li><strong>1 PC :</strong> Vous ne parvenez pas à réaliser une carte satisfaisante des environs. Si vous avez une carte partielle de la zone, vous parvenez tout de même à révéler la position de ses points de repères si elles se trouvent sur ces Hex.</li>" +
            "<li><strong>2 PC :</strong> Vous repérez approximativement ce qui se trouve sur les Hex alentours. Le DC de toute activité ayant lieu sur ces Hex est réduit de 2, et vous révélez toutes les créatures non cachées et tous les points d'intérêt non secrets sur ces Hex. Vous pouvez Monter le camp sur ces Hex.</li>" +
            "<li><strong>3 PC :</strong> Comme pour 2 PC, mais l'aventurier ayant le plus de Perception lance un jet caché contre le DC de la zone pour vérifier si des créatures cachées ou des points d'intérêt secrets sont révélés sur ces Hex. Si vous avez connaissance de créatures cachées ou de points d'intérêt secrets sur ces Hex, vous les trouvez.</li>" +
            "<li><strong>4+ PC :</strong> Comme pour 3 PC, mais vous trouvez automatiquement toutes les créatures cachées et tous les points d'intérêt secrets sur ces Hex. Vous apprenez également, en étudiant la Boussole ou en écoutant le Chant, si une Ancre se trouve sur l'une de ces Hex.</li>" +
            "</ul>",
        outcomes: {
            criticalSuccess: "Les Hex cartographiés gagnent 2 Points de Cartographie.",
            success: "Les Hex cartographiés gagnent 1 Point de Cartographie.",
            criticalFailure: "Les Hex cartographiés perdent 1 Point de Cartographie."
        }
    },
    {
        id: "make-camp",
        label: "Monter le camp",
        slug: null,
        img: PLACEHOLDER_IMG,
        traits: ["exploration"],
        description:
            "Vous ne pouvez faire cela que dans un Hex ayant au moins 2 PC. Tant que vous restez sur ce Hex, votre groupe peut effectuer deux Activités Individuelles supplémentaires."
    },
    {
        id: "hustle",
        label: "Presser le pas",
        slug: null,
        img: PLACEHOLDER_IMG,
        traits: ["exploration", "move"],
        description:
            "Vous cessez d'avancer prudemment et accélérez la marche. Vous devez utiliser toutes les Activités de Groupe pour Presser le Pas. Quand vous le faites, chaque Activité de Groupe vous permet de Voyager deux fois. À l'issue, vous devenez Fatigued et perdez deux Activités de Groupe jusqu'à ce que vous vous reposiez."
    },
    {
        id: "rest",
        label: "Se reposer",
        slug: null,
        img: PLACEHOLDER_IMG,
        traits: ["exploration"],
        description:
            "Nécessite un camp. Lorsque vous vous Reposez, vous ne pouvez pas vous déplacer de la journée. Récupérez le triple du montant normal de points de vie récupéré lors d'un repos long. Si vous êtes Fatigued, lors des prochaines préparations quotidiennes, vous perdez la condition et vous récupérez deux Activités de Groupe."
    },
    {
        id: "travel",
        label: "Voyager",
        slug: null,
        img: PLACEHOLDER_IMG,
        traits: ["exploration", "move"],
        description:
            "Vous progressez en direction d'un Hex adjacent. Dans la forêt du Bois de l'Oubli, chaque Hex est traversé en une activité de Voyage. Traverser un Hex avec du terrain difficile, comme la montagne ou les marécages, nécessite 2 activités de Voyage, et au contraire sur une route bitumée ou un espace dégagé, vous pouvez traverser 2 Hex en 1 activité de Voyage. En arrivant sur un Hex, vous révélez si le Hex abrite une créature non caché ou un point d'intérêt non secret, et vous identifiez automatiquement les terrains des Hex adjacents. Vous révélez automatiquement une Ancre en arrivant sur sa Hex si avez une Boussole de Courant ou si vous entendez le Chant. De la même manière, la Boussole de Courant indique automatiquement si une Ancre se trouve sur une Hex adjacente."
    }
];

// Activités Individuelles (10) — déjà triées par activitySortKey.
export const INDIVIDUAL_ACTIVITIES = [
    {
        id: "avoid-notice",
        label: "Avoid Notice",
        slug: "avoid-notice",
        img: PLACEHOLDER_IMG,
        traits: ["exploration"],
        description:
            "Vous et les membres de votre groupe qui le souhaitent peuvent effectuer leur jet d'initiative avec leur Stealth."
    },
    {
        id: "hunt-and-gather",
        label: "Chasser et cueillir",
        slug: null,
        img: PLACEHOLDER_IMG,
        traits: ["exploration"],
        description:
            "Vous essayez de trouver des ingrédients frais sur le trajet. Effectuez un jet de Nature ou de Survie contre le DC de la zone.",
        outcomes: {
            criticalSuccess: "Vous trouvez 3 ingrédients frais.",
            success: "Vous trouvez 2 ingrédients frais."
        }
    },
    {
        id: "repair",
        label: "Craft - Repair",
        slug: "repair",
        img: PLACEHOLDER_IMG,
        traits: ["exploration", "manipulate"],
        description:
            "Fonctionne comme les activités Craft ou Repair, et vous pouvez Craft ou Repair un item ou un batch de 4 items par Activité. Une Réussite réduit le coût de Craft de 10% et une Réussie Critique de 20%."
    },
    {
        id: "cook",
        label: "Cuisiner",
        slug: null,
        img: PLACEHOLDER_IMG,
        traits: ["exploration", "manipulate"],
        description:
            "Nécessite un camp. Vous cuisinez des ingrédients frais pour vous remplir la panse et galvaniser le moral de vos compagnons. En cas d'échec, vous ne parvenez pas à cuisiner un plat satisfaisant mais vous économisez les ingrédients frais.",
        outcomes: {
            criticalSuccess: "Comme la Réussite, et vous gagnez un bonus sans type de +1 au prochain jet d'attaque, de sauvegarde ou de compétence que vous effectuez le lendemain.",
            success: "Vous gagnez une Activité de Groupe supplémentaire le lendemain."
        }
    },
    {
        id: "defend",
        label: "Defend",
        slug: "defend",
        img: PLACEHOLDER_IMG,
        traits: ["exploration"],
        description:
            "Vous commencez toute Rencontre avec le bouclier levé et votre réaction. La nuit au camp, si une embuscade nocturne survient, vous montez la garde, vous empêchant vous et vos compagnons d'être surpris."
    },
    {
        id: "aid",
        label: "S'entraider",
        slug: null,
        img: PLACEHOLDER_IMG,
        traits: ["exploration"],
        description:
            "Choisissez deux alliés qui n'utilisent ou ne bénéficient pas de cette activité. La première fois dans la journée que chacun de ces alliés effectue un jet de compétence, vous pouvez Aid comme si vous aviez préparé la réaction correspondante."
    },
    {
        id: "investigate",
        label: "Investigate",
        slug: "investigate",
        img: PLACEHOLDER_IMG,
        traits: ["exploration", "secret"],
        description:
            "Permet de Recall Knowledge deux fois, sur n'importe quel élément d'un Hex révélé. Par exemple les créatures présentes sur un Hex sont-elles hostiles ? Existe-t-il un lieu à proximité de ce Hex ayant davantage d'ingrédients frais que la moyenne ? Certains résultats du RK pourront finir documentés dans la Bibliothèque de la Guilde (comme l'obtention d'informations sur une créature)."
    },
    {
        id: "scout",
        label: "Scout",
        slug: "scout",
        img: PLACEHOLDER_IMG,
        traits: ["exploration", "concentrate"],
        description:
            "Vous patrouillez en tout temps dans les environs pour avoir un coup d'avance. Vous déterminez si des créatures hostiles, cachées ou non, sont présentes sur une Hex adjacente. Vous et vos compagnons gagnez un bonus de circonstance de +1 à tous vos jets d'initiative."
    },
    {
        id: "search",
        label: "Search",
        slug: "search",
        img: PLACEHOLDER_IMG,
        traits: ["exploration", "concentrate"],
        description:
            "Choisissez un Hex adjacent. Vous faites un jet de Perception, Stealth ou Survival contre le DC de la zone pour essayer de glaner des informations dans la zone. Le Hex gagne des PC comme pour Cartographier la zone. Si vous avez la Boussole de Courant, vous apprenez si une Ancre se trouve sur le Hex ou à proximité du Hex.",
        outcomes: {
            criticalSuccess: "Le Hex gagne 2 PC.",
            success: "Le Hex gagne 1 PC."
        }
    },
    {
        id: "treat-wounds",
        label: "Treat Wounds",
        slug: "treat-wounds",
        img: PLACEHOLDER_IMG,
        traits: ["exploration", "healing", "manipulate"],
        description:
            "Vous pouvez Treat Wounds chaque aventurier. Comme d'habitude, vous lancez un jet distinct pour chaque aventurier. Si vous avez Ward Medic, vous pouvez choisir de lancer un seul jet et appliquer le résultat à tous les aventuriers. Si vous avez Continuous Recovery, vous pouvez Treat Wounds deux fois chaque aventurier."
    }
];
