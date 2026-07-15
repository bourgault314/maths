(() => {
  "use strict";

  const catalogue = window.MATHSGO_CATALOGUE;
  if (!catalogue) return;

  const rootPrefix = document.body.dataset.rootPrefix || "";
  const published = catalogue.resources.filter((resource) => resource.status === "published");
  const domainMap = new Map(catalogue.domains.map((domain) => [domain.id, domain]));
  const notionMap = new Map(catalogue.notions.map((notion) => [notion.id, notion]));
  const typeMap = new Map(catalogue.types.map((type) => [type.id, type]));
  const facetMap = new Map((catalogue.facets || []).map((facet) => [facet.id, facet]));
  const mainDomainIds = [
    "nombres-calculs",
    "algebre",
    "proportionnalite-mesures",
    "geometrie",
    "donnees",
    "informatique"
  ];

  const domainDesign = {
    "nombres-calculs": { icon: "ulam" },
    algebre: { icon: "splat" },
    "proportionnalite-mesures": { icon: "pantograph" },
    geometrie: { icon: "seigaiha" },
    donnees: { icon: "frequencies" },
    informatique: { icon: "koch" },
    "jeux-recherches": { icon: "strategy" }
  };

  const notionDesign = {
    numeration: {
      description: "Bouliers, abaques et représentations des nombres.",
      keywords: "boulier rekenrek soroban décimaux nombres",
      icon: "abacus",
      hub: "bouliers/index.html"
    },
    fractions: {
      description: "Relier fractions, quotients et nombres rationnels.",
      keywords: "bandes disques mur partage quotient rationnel",
      icon: "fractions",
      hub: "fractions/index_fractions.html"
    },
    relatifs: {
      description: "Donner du sens aux nombres positifs et négatifs.",
      keywords: "jetons positif négatif somme différence",
      icon: "relatifs",
      hub: "nombres_relatifs/index.html"
    },
    divisibilite: {
      description: "Explorer les entiers, diviseurs, multiples et PGCD.",
      keywords: "entier diviseur multiple pgcd sachets mur nombre premier",
      icon: "divisibilite"
    },
    puissances: {
      description: "Construire et visualiser les puissances.",
      keywords: "exposant carré feuille pliage",
      icon: "powers"
    },
    "racines-carrees": {
      description: "Comprendre la racine carrée par les aires et les longueurs.",
      keywords: "racine carré irrationnel aire longueur pythagore",
      icon: "roots"
    },
    "calcul-mental": {
      description: "S’entraîner, automatiser et projeter en classe.",
      keywords: "automatismes dnb calcul mental cahier",
      icon: "automatismes",
      hub: "../auto/",
      hiddenFromBrowse: true
    },
    proportionnalite: {
      description: "Ratios, grandeurs et situations proportionnelles.",
      keywords: "ratio échelle proportion partage",
      icon: "ratio"
    },
    pourcentages: {
      description: "Visualiser et calculer les pourcentages.",
      keywords: "pourcent grille cent taux",
      icon: "percent"
    },
    fonctions: {
      description: "Relier formules, tableaux de valeurs et graphiques.",
      keywords: "fonction image antécédent graphique tableau dépendance affine linéaire",
      icon: "functions"
    },
    conversions: {
      description: "Convertir les longueurs, aires et volumes.",
      keywords: "unités longueur aire volume glisse",
      icon: "conversions",
      hub: "conversions/index.html"
    },
    "aires-perimetres": {
      description: "Comparer, mesurer et raisonner sur les figures.",
      keywords: "aire périmètre surface rectangle triangle",
      icon: "area"
    },
    "temps-durees": {
      description: "Lire l’heure et comprendre les durées.",
      keywords: "horloge heure minute durée temps",
      icon: "clock"
    },
    "calcul-litteral": {
      description: "Généraliser et manipuler les expressions algébriques.",
      keywords: "développer réduire expression tuiles x",
      icon: "tiles",
      hub: "calcul_litteral/index.html"
    },
    equations: {
      description: "Représenter l’inconnue et résoudre des équations.",
      keywords: "équation balance equasplat equabarre inconnue",
      icon: "splat",
      hub: "splat/index.html"
    },
    "schemas-barres": {
      description: "Modéliser les problèmes avec des schémas en barres.",
      keywords: "splat problème partie tout barres singapour",
      icon: "bars",
      hub: "splat/index.html"
    },
    patterns: {
      description: "Observer, prolonger et généraliser des motifs.",
      keywords: "suite motif algèbre généralisation",
      icon: "patterns",
      hub: "patterns.html"
    },
    angles: {
      description: "Mesurer, construire et manipuler les angles.",
      keywords: "rapporteur gabarit triangle bandes",
      icon: "angles",
      hub: "angles/index.html"
    },
    reperage: {
      description: "Lire et placer des points sur une droite ou dans un repère.",
      keywords: "abscisse ordonnée coordonnées droite graduée plan repère",
      icon: "coordinates"
    },
    transformations: {
      description: "Faire agir symétries, rotations et translations sur les figures.",
      keywords: "symétrie axiale centrale demi-tour translation rotation image",
      icon: "transformations"
    },
    triangles: {
      description: "Construire, caractériser et raisonner avec les triangles.",
      keywords: "triangle médiane hauteur médiatrice bissectrice cercle circonscrit",
      icon: "triangles"
    },
    parallelogrammes: {
      description: "Construire et caractériser les parallélogrammes.",
      keywords: "parallélogramme rectangle losange carré diagonales quadrilatère",
      icon: "parallelograms"
    },
    "espace-constructions": {
      description: "Représenter les solides, leurs patrons et leurs sections.",
      keywords: "cube solide patron prisme pyramide 3d",
      icon: "cube"
    },
    pythagore: {
      description: "Voir et comprendre le théorème de Pythagore.",
      keywords: "triangle rectangle carré hypoténuse moulin",
      icon: "pythagore"
    },
    thales: {
      description: "Mesurer des longueurs et raisonner avec des droites parallèles.",
      keywords: "thales parallèles pyramide ombre agrandissement réduction",
      icon: "thales",
      showWhenEmpty: true
    },
    statistiques: {
      description: "Organiser et représenter des données.",
      keywords: "statistique graphique diagramme données",
      icon: "stats"
    },
    moyennes: {
      description: "Donner du sens à la moyenne par la manipulation.",
      keywords: "moyenne répartition équilibrer barres",
      icon: "average"
    },
    probabilites: {
      description: "Expérimenter le hasard et quantifier les chances.",
      keywords: "probabilité hasard dé pièce urne fréquence événement",
      icon: "probability"
    },
    "pensee-informatique": {
      description: "Décomposer un problème et construire des algorithmes.",
      keywords: "algorithme programmation blocs variable boucle condition scratch",
      icon: "computing"
    },
    strategie: {
      description: "Anticiper, raisonner et élaborer une stratégie.",
      keywords: "jeu nim yavalath stratégie plateau",
      icon: "strategy",
      hub: "club_maths/index.html"
    },
    explorations: {
      description: "Chercher, conjecturer et découvrir des structures.",
      keywords: "engrenages chaos tables modulaires recherche",
      icon: "gears",
      hub: "club_maths/index.html"
    }
  };

  const state = {
    domain: new URLSearchParams(window.location.search).get("domain") || "",
    query: "",
    facet: new URLSearchParams(window.location.search).get("facet") || "",
    notion: new URLSearchParams(window.location.search).get("notion") || ""
  };

  const domainGrid = document.getElementById("domain-grid");
  const notionGrid = document.getElementById("notion-grid");
  const resourceGrid = document.getElementById("resource-grid");
  const title = document.getElementById("results-title");
  const summary = document.getElementById("results-summary");
  const pageTitle = document.getElementById("page-title");
  const heroLead = document.getElementById("hero-lead");
  const backButton = document.getElementById("back-themes");
  const searchInput = document.getElementById("catalogue-search");
  const clearButton = document.getElementById("search-clear");
  const controls = document.querySelector(".catalogue-controls");
  const domainBox = document.querySelector(".domain-box");
  const facetBox = document.querySelector(".facet-box");
  const domainSelect = document.getElementById("domain-filter");
  const facetSelect = document.getElementById("facet-filter");

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalise(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function words(value) {
    return normalise(value).split(" ").filter(Boolean);
  }

  function allWordsMatch(haystack, query) {
    const target = normalise(haystack);
    return words(query).every((word) => target.includes(word));
  }

  function syncQueryString() {
    try {
      const params = new URLSearchParams();
      if (state.domain) params.set("domain", state.domain);
      if (state.notion) params.set("notion", state.notion);
      if (state.facet) params.set("facet", state.facet);
      const query = params.toString();
      history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    } catch (_error) {
      // L'ouverture directe depuis un dossier Windows peut interdire l'API History.
      // Le filtrage doit continuer à fonctionner dans ce cas.
    }
  }

  function icon(name) {
    const icons = {
      ulam: `<svg viewBox="0 0 64 52" aria-hidden="true"><rect x="6.5" y="1.5" width="49" height="49" rx="2" fill="#eff6ff" stroke="#1d4ed8" stroke-width="1.2"/><g stroke="#bfdbfe" stroke-width=".65"><path d="M13.5 1.5v49M20.5 1.5v49M27.5 1.5v49M34.5 1.5v49M41.5 1.5v49M48.5 1.5v49M6.5 8.5h49M6.5 15.5h49M6.5 22.5h49M6.5 29.5h49M6.5 36.5h49M6.5 43.5h49"/></g><g fill="#0f766e" stroke="#fff" stroke-width=".75"><circle cx="38" cy="26" r="2.35"/><circle cx="38" cy="19" r="2.35"/><circle cx="24" cy="19" r="2.35"/><circle cx="24" cy="33" r="2.35"/><circle cx="45" cy="26" r="2.35"/><circle cx="45" cy="12" r="2.35"/><circle cx="17" cy="12" r="2.35"/><circle cx="17" cy="26" r="2.35"/><circle cx="31" cy="40" r="2.35"/><circle cx="52" cy="19" r="2.35"/><circle cx="52" cy="5" r="2.35"/><circle cx="10" cy="5" r="2.35"/><circle cx="10" cy="33" r="2.35"/><circle cx="10" cy="47" r="2.35"/><circle cx="38" cy="47" r="2.35"/></g><circle cx="31" cy="26" r="2.8" fill="#f97316" stroke="#9a3412" stroke-width=".8"/></svg>`,
      pantograph: `<svg viewBox="0 0 82 52" aria-hidden="true"><path d="M8 45c4-7 9-7 14 0" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round"/><path d="M56 45c6-12 14-12 21 0" fill="none" stroke="#f97316" stroke-width="2.2" stroke-linecap="round"/><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11 47 11 59 35 30 35Z" stroke="#0f766e" stroke-width="3"/><path d="M30 35 18 45M47 11 72 33" stroke="#c2410c" stroke-width="2.4"/></g><g fill="#fbbf24" stroke="#92400e" stroke-width="1"><circle cx="18" cy="11" r="2.7"/><circle cx="47" cy="11" r="2.7"/><circle cx="59" cy="35" r="2.7"/><circle cx="30" cy="35" r="2.7"/></g><circle cx="18" cy="45" r="2.2" fill="#2563eb"/><path d="m70 30 4 5-3 2Z" fill="#f97316" stroke="#9a3412" stroke-width=".7"/></svg>`,
      thales: `<svg viewBox="0 0 82 52" aria-hidden="true"><path d="M4 44h74" stroke="#7c2d12" stroke-width="1.7" stroke-linecap="round"/><g fill="#fbbf24" stroke="#c2410c" stroke-width="1.35" stroke-linecap="round"><circle cx="10" cy="10" r="4.4"/><path d="M10 1.5v3M10 15.5v3M1.5 10h3M15.5 10h3M4 4l2.2 2.2M13.8 13.8 16 16M16 4l-2.2 2.2M6.2 13.8 4 16"/></g><path d="M15 31v13" fill="none" stroke="#9a3412" stroke-width="2.1" stroke-linecap="round"/><path d="m37 44 10-31 10 31Z" fill="#fdba74" stroke="#9a3412" stroke-width="1.6" stroke-linejoin="round"/><path d="M47 13v31" fill="none" stroke="#dc2626" stroke-width="1.5"/><g fill="none" stroke="#0f766e" stroke-width="2.15" stroke-linecap="round"><path d="M15 31 26 44M47 13 73.23 44"/></g><g stroke="#f97316" stroke-width="2.5" stroke-linecap="round"><path d="M15 44h11M47 44h26.23"/></g></svg>`,
      seigaiha: `<svg viewBox="0 0 76 52" aria-hidden="true"><rect width="76" height="52" rx="4" fill="#eef2ff"/><g fill="none" stroke-linecap="round"><g stroke="#1d4ed8" stroke-width="1.8"><path d="M2 27A18 18 0 0 1 38 27M38 27A18 18 0 0 1 74 27"/><path d="M-16 49A18 18 0 0 1 20 49M20 49A18 18 0 0 1 56 49M56 49A18 18 0 0 1 92 49"/></g><g stroke="#0f766e" stroke-width="1.65"><path d="M8 27A12 12 0 0 1 32 27M44 27A12 12 0 0 1 68 27"/><path d="M-10 49A12 12 0 0 1 14 49M26 49A12 12 0 0 1 50 49M62 49A12 12 0 0 1 86 49"/></g><g stroke="#f97316" stroke-width="1.55"><path d="M14 27A6 6 0 0 1 26 27M50 27A6 6 0 0 1 62 27"/><path d="M-4 49A6 6 0 0 1 8 49M32 49A6 6 0 0 1 44 49M68 49A6 6 0 0 1 80 49"/></g></g></svg>`,
      frequencies: `<svg viewBox="0 0 78 52" aria-hidden="true"><rect x="3" y="11" width="26" height="26" rx="6" fill="#fce7f3" stroke="#be3e68" stroke-width="1.7"/><g fill="#9d174d"><circle cx="10" cy="18" r="2"/><circle cx="22" cy="18" r="2"/><circle cx="16" cy="24" r="2"/><circle cx="10" cy="30" r="2"/><circle cx="22" cy="30" r="2"/></g><path d="M38 45h37M38 45V12" fill="none" stroke="#475569" stroke-width="1.5" stroke-linecap="round"/><path d="m34.8 15.5 3.2-3.5 3.2 3.5" fill="none" stroke="#475569" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M39 28h35" stroke="#7c3aed" stroke-width="1.2" stroke-dasharray="3 2"/><g stroke="#9d174d" stroke-width=".8"><rect x="42" y="30" width="4.2" height="15" rx="1" fill="#f9a8d4"/><rect x="47.6" y="27" width="4.2" height="18" rx="1" fill="#fb7185"/><rect x="53.2" y="29" width="4.2" height="16" rx="1" fill="#f9a8d4"/><rect x="58.8" y="26" width="4.2" height="19" rx="1" fill="#be3e68"/><rect x="64.4" y="31" width="4.2" height="14" rx="1" fill="#f9a8d4"/><rect x="70" y="28" width="4.2" height="17" rx="1" fill="#fb7185"/></g></svg>`,
      koch: `<svg viewBox="0 0 72 52" aria-hidden="true"><polygon points="12,35 17.33,35 20,39.62 22.67,35 28,35 30.67,39.62 28,44.24 33.33,44.24 36,48.86 38.67,44.24 44,44.24 41.33,39.62 44,35 49.33,35 52,39.62 54.67,35 60,35 57.33,31.22 59.27,27.02 54.67,27.44 52,23.67 53.94,19.47 58.54,19.05 55.88,15.27 57.81,11.07 53.21,11.49 50.54,7.71 48.6,11.91 44,12.33 41.33,8.56 43.27,4.36 38.67,4.78 36,1 33.33,4.78 28.73,4.36 30.67,8.56 28,12.33 23.4,11.91 21.46,7.71 18.79,11.49 14.19,11.07 16.12,15.27 13.46,19.05 18.06,19.47 20,23.67 17.33,27.44 12.73,27.02 14.67,31.22" fill="#eef0ff" stroke="#4f5fb3" stroke-width="1.35" stroke-linejoin="round"/><polyline points="12,35 17.33,35 20,39.62 22.67,35" fill="none" stroke="#f97316" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><g transform="translate(9 35)" stroke="#166534" stroke-width=".9" stroke-linecap="round"><ellipse cx="0" cy="0" rx="4.8" ry="3.2" fill="#22c55e"/><path d="M-2-2.6-4.5-5M-2 2.6-4.5 5M2-2.6 3.5-5M2 2.6 3.5 5" fill="none"/><circle cx="5" cy="0" r="2.1" fill="#facc15"/><circle cx="5.6" cy="-.6" r=".45" fill="#312e81" stroke="none"/></g></svg>`,
      abacus: `<svg viewBox="0 0 108 54" aria-hidden="true"><rect x="3" y="4" width="102" height="46" rx="5" fill="#fff4cf" stroke="#9a5b12" stroke-width="2"/><path d="M8 19h92M8 36h92" stroke="#7c4810" stroke-width="1.6"/><g fill="#ef655e" stroke="#7f1d1d" stroke-width=".85"><circle cx="15" cy="19" r="3.6"/><circle cx="24" cy="19" r="3.6"/><circle cx="33" cy="19" r="3.6"/><circle cx="42" cy="19" r="3.6"/><circle cx="51" cy="19" r="3.6"/><circle cx="15" cy="36" r="3.6"/><circle cx="24" cy="36" r="3.6"/><circle cx="33" cy="36" r="3.6"/><circle cx="42" cy="36" r="3.6"/><circle cx="51" cy="36" r="3.6"/></g><g fill="#fff" stroke="#475569" stroke-width=".85"><circle cx="60" cy="19" r="3.6"/><circle cx="69" cy="19" r="3.6"/><circle cx="78" cy="19" r="3.6"/><circle cx="87" cy="19" r="3.6"/><circle cx="96" cy="19" r="3.6"/><circle cx="60" cy="36" r="3.6"/><circle cx="69" cy="36" r="3.6"/><circle cx="78" cy="36" r="3.6"/><circle cx="87" cy="36" r="3.6"/><circle cx="96" cy="36" r="3.6"/></g></svg>`,
      fractions: `<svg viewBox="0 0 88 56" aria-hidden="true"><rect x="1" y="1" width="86" height="10.8" fill="#2dd4bf"/><rect x="1" y="11.8" width="86" height="10.8" fill="#facc15"/><rect x="1" y="22.6" width="86" height="10.8" fill="#38bdf8"/><rect x="1" y="33.4" width="86" height="10.8" fill="#fde68a"/><rect x="1" y="44.2" width="86" height="10.8" fill="#fca5a5"/><g fill="none" stroke="#334155" stroke-width="1.15"><rect x="1" y="1" width="86" height="54" rx="1"/><path d="M1 11.8H87M1 22.6H87M1 33.4H87M1 44.2H87M44 11.8v10.8M29.7 22.6v10.8M58.3 22.6v10.8M22.5 33.4v10.8M44 33.4v10.8M65.5 33.4v10.8M18.2 44.2V55M35.4 44.2V55M52.6 44.2V55M69.8 44.2V55"/></g></svg>`,
      relatifs: `<svg viewBox="0 0 70 48" aria-hidden="true"><ellipse cx="31" cy="24" rx="29" ry="20" fill="none" stroke="#64748b" stroke-width="2"/><circle cx="22" cy="24" r="12" fill="#39c979" stroke="#111827" stroke-width="1.7"/><circle cx="43" cy="24" r="12" fill="#ef655e" stroke="#111827" stroke-width="1.7"/><text x="14" y="28" font-family="Arial" font-size="10" font-weight="900">+1</text><text x="36" y="28" font-family="Arial" font-size="10" font-weight="900">−1</text><text x="61" y="28" fill="#475569" font-family="Arial" font-size="14" font-weight="900">0</text></svg>`,
      divisibilite: `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="4" y="7" width="56" height="34" rx="4" fill="#ecfdf5" stroke="#15803d" stroke-width="1.7"/><path d="M4 19h56M4 30h56M18 7v12M32 7v12M46 7v12M13 19v11M25 19v11M39 19v11M51 19v11M18 30v11M32 30v11M46 30v11" stroke="#22c55e" stroke-width="1.2"/><text x="32" y="27" text-anchor="middle" fill="#166534" font-family="Arial" font-size="9" font-weight="900">PGCD</text></svg>`,
      powers: `<svg viewBox="0 0 88 52" aria-hidden="true"><g stroke="#4c1d95" stroke-width="1.35"><rect x="2" y="34" width="13" height="13" rx="2" fill="#c4b5fd"/><rect x="20" y="34" width="13" height="13" rx="2" fill="#a78bfa"/><rect x="33" y="34" width="13" height="13" rx="2" fill="#a78bfa"/><rect x="50" y="21" width="13" height="13" rx="2" fill="#8b5cf6"/><rect x="63" y="21" width="13" height="13" rx="2" fill="#8b5cf6"/><rect x="50" y="34" width="13" height="13" rx="2" fill="#8b5cf6"/><rect x="63" y="34" width="13" height="13" rx="2" fill="#8b5cf6"/></g><g fill="#5b21b6" font-family="Arial" font-weight="900" text-anchor="middle"><text x="8.5" y="27" font-size="10.5">2⁰</text><text x="33" y="27" font-size="10.5">2¹</text><text x="63" y="15" font-size="11">2²</text><text x="83" y="43" font-size="17">?</text></g></svg>`,
      roots: `<svg viewBox="0 0 70 54" aria-hidden="true"><rect x="20" y="2" width="30" height="30" rx="3" fill="#ede9fe" stroke="#6d28d9" stroke-width="2"/><text x="35" y="22.5" text-anchor="middle" fill="#5b21b6" font-family="Georgia,serif" font-size="14" font-weight="700">2</text><path d="M18 44l4 1.5 3 5.5 5-14h22" fill="none" stroke="#c2410c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><text x="40" y="50" text-anchor="middle" fill="#c2410c" font-family="Georgia,serif" font-size="14" font-weight="700">2</text></svg>`,
      automatismes: `<svg viewBox="0 0 64 48" aria-hidden="true"><g transform="rotate(-8 17 26)"><rect x="5" y="10" width="25" height="33" rx="4" fill="#e0f2fe" stroke="#0369a1" stroke-width="1.5"/><path d="m12 21 11 13M23 21 12 34" stroke="#0284c7" stroke-width="2.3" stroke-linecap="round"/></g><g transform="rotate(4 33 23)"><rect x="20" y="5" width="27" height="36" rx="4" fill="#fef3c7" stroke="#a16207" stroke-width="1.5"/><circle cx="33.5" cy="16" r="2.8" fill="#f59e0b"/><circle cx="33.5" cy="31" r="2.8" fill="#f59e0b"/><path d="M27 23.5h13" stroke="#92400e" stroke-width="2" stroke-linecap="round"/></g><rect x="39" y="10" width="21" height="33" rx="4" fill="#fce7f3" stroke="#9d174d" stroke-width="1.6"/><text x="43" y="31" fill="#be185d" font-family="Arial" font-size="14" font-weight="900">x²</text></svg>`,
      ratio: `<svg viewBox="0 0 76 50" aria-hidden="true"><rect x="4" y="17" width="22" height="16" rx="5" fill="#ffedd5" stroke="#c2410c" stroke-width="1.5"/><text x="15" y="28.5" text-anchor="middle" fill="#9a3412" font-family="Arial" font-size="10" font-weight="900">2</text><rect x="50" y="17" width="22" height="16" rx="5" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1.5"/><text x="61" y="28.5" text-anchor="middle" fill="#1e40af" font-family="Arial" font-size="10" font-weight="900">5</text><path d="M29 21h16m-4-4 4 4-4 4" fill="none" stroke="#ea580c" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M47 29H31m4-4-4 4 4 4" fill="none" stroke="#0f766e" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      percent: `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="8" y="3" width="40" height="40" rx="2" fill="#fff" stroke="#1d4ed8" stroke-width="1.5"/><g><rect x="8" y="3" width="4" height="4" fill="#93c5fd"/><rect x="12" y="3" width="4" height="4" fill="#93c5fd"/><rect x="16" y="3" width="4" height="4" fill="#93c5fd"/><rect x="20" y="3" width="4" height="4" fill="#93c5fd"/><rect x="24" y="3" width="4" height="4" fill="#93c5fd"/><rect x="28" y="3" width="4" height="4" fill="#93c5fd"/><rect x="32" y="3" width="4" height="4" fill="#93c5fd"/><rect x="36" y="3" width="4" height="4" fill="#93c5fd"/><rect x="40" y="3" width="4" height="4" fill="#93c5fd"/><rect x="44" y="3" width="4" height="4" fill="#93c5fd"/><rect x="8" y="7" width="4" height="4" fill="#93c5fd"/><rect x="12" y="7" width="4" height="4" fill="#93c5fd"/><rect x="16" y="7" width="4" height="4" fill="#93c5fd"/><rect x="20" y="7" width="4" height="4" fill="#93c5fd"/><rect x="24" y="7" width="4" height="4" fill="#93c5fd"/><rect x="28" y="7" width="4" height="4" fill="#93c5fd"/><rect x="32" y="7" width="4" height="4" fill="#93c5fd"/><rect x="36" y="7" width="4" height="4" fill="#93c5fd"/><rect x="40" y="7" width="4" height="4" fill="#93c5fd"/><rect x="44" y="7" width="4" height="4" fill="#93c5fd"/><rect x="8" y="11" width="4" height="4" fill="#93c5fd"/><rect x="12" y="11" width="4" height="4" fill="#93c5fd"/><rect x="16" y="11" width="4" height="4" fill="#93c5fd"/><rect x="20" y="11" width="4" height="4" fill="#93c5fd"/><rect x="24" y="11" width="4" height="4" fill="#93c5fd"/><rect x="28" y="11" width="4" height="4" fill="#93c5fd"/><rect x="32" y="11" width="4" height="4" fill="#93c5fd"/><rect x="36" y="11" width="4" height="4" fill="#93c5fd"/><rect x="40" y="11" width="4" height="4" fill="#93c5fd"/><rect x="44" y="11" width="4" height="4" fill="#93c5fd"/><rect x="8" y="15" width="4" height="4" fill="#93c5fd"/><rect x="12" y="15" width="4" height="4" fill="#93c5fd"/><rect x="16" y="15" width="4" height="4" fill="#93c5fd"/><rect x="20" y="15" width="4" height="4" fill="#93c5fd"/><rect x="24" y="15" width="4" height="4" fill="#93c5fd"/><rect x="28" y="15" width="4" height="4" fill="#93c5fd"/><rect x="32" y="15" width="4" height="4" fill="#93c5fd"/></g><g stroke="#94a3b8" stroke-width=".42"><path d="M8 3v40M8 3h40"/><path d="M12 3v40M8 3h40"/><path d="M16 3v40M8 3h40"/><path d="M20 3v40M8 3h40"/><path d="M24 3v40M8 3h40"/><path d="M28 3v40M8 3h40"/><path d="M32 3v40M8 3h40"/><path d="M36 3v40M8 3h40"/><path d="M40 3v40M8 3h40"/><path d="M44 3v40M8 3h40"/><path d="M8 3v40M8 7h40"/><path d="M12 3v40M8 7h40"/><path d="M16 3v40M8 7h40"/><path d="M20 3v40M8 7h40"/><path d="M24 3v40M8 7h40"/><path d="M28 3v40M8 7h40"/><path d="M32 3v40M8 7h40"/><path d="M36 3v40M8 7h40"/><path d="M40 3v40M8 7h40"/><path d="M44 3v40M8 7h40"/><path d="M8 3v40M8 11h40"/><path d="M12 3v40M8 11h40"/><path d="M16 3v40M8 11h40"/><path d="M20 3v40M8 11h40"/><path d="M24 3v40M8 11h40"/><path d="M28 3v40M8 11h40"/><path d="M32 3v40M8 11h40"/><path d="M36 3v40M8 11h40"/><path d="M40 3v40M8 11h40"/><path d="M44 3v40M8 11h40"/><path d="M8 3v40M8 15h40"/><path d="M12 3v40M8 15h40"/><path d="M16 3v40M8 15h40"/><path d="M20 3v40M8 15h40"/><path d="M24 3v40M8 15h40"/><path d="M28 3v40M8 15h40"/><path d="M32 3v40M8 15h40"/><path d="M36 3v40M8 15h40"/><path d="M40 3v40M8 15h40"/><path d="M44 3v40M8 15h40"/><path d="M8 3v40M8 19h40"/><path d="M12 3v40M8 19h40"/><path d="M16 3v40M8 19h40"/><path d="M20 3v40M8 19h40"/><path d="M24 3v40M8 19h40"/><path d="M28 3v40M8 19h40"/><path d="M32 3v40M8 19h40"/><path d="M36 3v40M8 19h40"/><path d="M40 3v40M8 19h40"/><path d="M44 3v40M8 19h40"/><path d="M8 3v40M8 23h40"/><path d="M12 3v40M8 23h40"/><path d="M16 3v40M8 23h40"/><path d="M20 3v40M8 23h40"/><path d="M24 3v40M8 23h40"/><path d="M28 3v40M8 23h40"/><path d="M32 3v40M8 23h40"/><path d="M36 3v40M8 23h40"/><path d="M40 3v40M8 23h40"/><path d="M44 3v40M8 23h40"/><path d="M8 3v40M8 27h40"/><path d="M12 3v40M8 27h40"/><path d="M16 3v40M8 27h40"/><path d="M20 3v40M8 27h40"/><path d="M24 3v40M8 27h40"/><path d="M28 3v40M8 27h40"/><path d="M32 3v40M8 27h40"/><path d="M36 3v40M8 27h40"/><path d="M40 3v40M8 27h40"/><path d="M44 3v40M8 27h40"/><path d="M8 3v40M8 31h40"/><path d="M12 3v40M8 31h40"/><path d="M16 3v40M8 31h40"/><path d="M20 3v40M8 31h40"/><path d="M24 3v40M8 31h40"/><path d="M28 3v40M8 31h40"/><path d="M32 3v40M8 31h40"/><path d="M36 3v40M8 31h40"/><path d="M40 3v40M8 31h40"/><path d="M44 3v40M8 31h40"/><path d="M8 3v40M8 35h40"/><path d="M12 3v40M8 35h40"/><path d="M16 3v40M8 35h40"/><path d="M20 3v40M8 35h40"/><path d="M24 3v40M8 35h40"/><path d="M28 3v40M8 35h40"/><path d="M32 3v40M8 35h40"/><path d="M36 3v40M8 35h40"/><path d="M40 3v40M8 35h40"/><path d="M44 3v40M8 35h40"/><path d="M8 3v40M8 39h40"/><path d="M12 3v40M8 39h40"/><path d="M16 3v40M8 39h40"/><path d="M20 3v40M8 39h40"/><path d="M24 3v40M8 39h40"/><path d="M28 3v40M8 39h40"/><path d="M32 3v40M8 39h40"/><path d="M36 3v40M8 39h40"/><path d="M40 3v40M8 39h40"/><path d="M44 3v40M8 39h40"/></g><text x="28" y="28" text-anchor="middle" fill="#be3e68" font-family="Arial" font-size="10.5" font-weight="900">37%</text></svg>`,
      functions: `<svg viewBox="0 0 70 48" aria-hidden="true"><g stroke="#cbd5e1" stroke-width=".65"><path d="M12 8v34M23 8v34M34 8v34M45 8v34M56 8v34M7 15h55M7 25h55M7 35h55"/></g><path d="M7 40h56M12 44V6" fill="none" stroke="#334155" stroke-width="1.5" stroke-linecap="round"/><path d="m60 37 3 3-3 3M9 9l3-3 3 3" fill="none" stroke="#334155" stroke-width="1.4" stroke-linejoin="round"/><path d="M14 36 54 10" fill="none" stroke="#f97316" stroke-width="2.5" stroke-linecap="round"/><g fill="#0d9488" stroke="#fff" stroke-width="1"><circle cx="20" cy="32" r="2.7"/><circle cx="34" cy="23" r="2.7"/><circle cx="48" cy="14" r="2.7"/></g><text x="56" y="12" fill="#0f766e" font-family="Arial" font-size="8" font-weight="900">f</text></svg>`,
      conversions: `<svg viewBox="0 0 78 50" aria-hidden="true"><rect x="3" y="17" width="25" height="16" rx="5" fill="#ffedd5" stroke="#c2410c" stroke-width="1.5"/><text x="15.5" y="28.5" text-anchor="middle" fill="#9a3412" font-family="Arial" font-size="10" font-weight="900">m</text><rect x="50" y="17" width="25" height="16" rx="5" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1.5"/><text x="62.5" y="28.5" text-anchor="middle" fill="#1e40af" font-family="Arial" font-size="9" font-weight="900">cm</text><path d="M31 21h16m-4-4 4 4-4 4" fill="none" stroke="#ea580c" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M47 29H31m4-4-4 4 4 4" fill="none" stroke="#0f766e" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      area: `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="4" y="10" width="31" height="28" fill="#bfdbfe" stroke="#2563eb" stroke-width="2"/><path d="M4 19h31M4 28h31M14 10v28M24 10v28" stroke="#fff" stroke-width="1"/><path d="m41 38 9-29 11 29Z" fill="#fed7aa" stroke="#ea580c" stroke-width="2"/><path d="M50 9v29" stroke="#f97316" stroke-width="1.2" stroke-dasharray="3 2"/></svg>`,
      clock: `<svg viewBox="0 0 78 48" aria-hidden="true"><circle cx="23" cy="23" r="18" fill="#fff7ed" stroke="#c2410c" stroke-width="2"/><g stroke="#9a3412" stroke-width="1.3"><path d="M23 7v4M23 35v4M7 23h4M35 23h4"/></g><path d="M23 23 15 16M23 23V12" stroke="#2563eb" stroke-width="2.6" stroke-linecap="round"/><circle cx="23" cy="23" r="2.5" fill="#f97316"/><text x="58" y="27" text-anchor="middle" fill="#0f766e" font-family="Arial" font-size="8.5" font-weight="900">60 min</text></svg>`,
      tiles: `<svg viewBox="0 0 70 48" aria-hidden="true"><rect x="4" y="5" width="32" height="32" rx="4" fill="#75bfff" stroke="#2563eb" stroke-width="1.8"/><rect x="41" y="5" width="24" height="13" rx="3" fill="#75bfff" stroke="#2563eb" stroke-width="1.5"/><rect x="41" y="23" width="24" height="13" rx="3" fill="#fde76f" stroke="#ca8a04" stroke-width="1.5"/><rect x="27" y="31" width="12" height="12" rx="2" fill="#fde76f" stroke="#ca8a04" stroke-width="1.3"/><text x="13" y="27" fill="#1d4ed8" font-family="Arial" font-size="15" font-weight="900">x²</text><text x="49" y="15" fill="#1d4ed8" font-family="Arial" font-size="10" font-weight="900">x</text><text x="46" y="33" fill="#92400e" font-family="Arial" font-size="9" font-weight="900">−x</text><text x="33" y="40" text-anchor="middle" fill="#92400e" font-family="Arial" font-size="8" font-weight="900">1</text></svg>`,
      splat: `<svg viewBox="-2 -2 28 28" aria-hidden="true"><path d="M21.45 12c.529.493 1.283 1.157 1.472 1.73.189.573-.034 1.225-.337 1.709-.303.485-.991.847-1.481 1.2-.49.352-.965.666-1.459.916-.494.25-.993.462-1.506.584-.513.122-1.142.006-1.572.147-.43.141-.732.251-1.007.701-.274.451-.335 1.345-.64 2-.305.656-.703 1.578-1.19 1.935-.487.357-1.175.346-1.73.208-.555-.138-1.112-.681-1.598-1.038-.487-.357-.932-.712-1.322-1.105-.391-.392-.747-.801-1.022-1.251-.274-.45-.358-1.085-.625-1.45-.267-.365-.465-.619-.978-.741-.513-.122-1.382.097-2.1.01-.718-.088-1.718-.182-2.208-.535-.49-.352-.692-1.01-.732-1.581-.04-.57.304-1.267.493-1.841.189-.573.389-1.105.642-1.598.253-.493.531-.958.875-1.358.343-.4.921-.676 1.185-1.043.265-.367.445-.634.403-1.159-.043-.526-.52-1.285-.658-1.995-.139-.709-.358-1.689-.174-2.264.184-.575.747-.971 1.277-1.185.53-.215 1.3-.103 1.903-.1.604.003 1.172.028 1.719.117.547.088 1.075.209 1.562.412.487.203.927.667 1.358.805.431.138.74.227 1.227.024.486-.202 1.061-.89 1.693-1.241.632-.352 1.497-.863 2.1-.866.604-.003 1.155.411 1.522.849.368.438.499 1.204.683 1.779.184.575.335 1.123.42 1.67.085.548.133 1.088.091 1.613-.043.526-.348 1.088-.346 1.541.001.452.012.774.356 1.174.343.4 1.175.734 1.704 1.227Z" fill="#8b5cf6" stroke="#5b21b6" stroke-width="1.05"/><text x="12" y="15.3" text-anchor="middle" fill="#fff" font-family="Arial" font-size="7" font-weight="900">?</text></svg>`,
      bars: `<svg viewBox="0 0 72 46" aria-hidden="true"><g stroke-width="1.35"><path d="M6 6h18v16H6Z" fill="#86efac" stroke="#15803d"/><path d="M24 6h25v16H24Z" fill="#bbf7d0" stroke="#15803d"/><path d="M49 6h15v16H49Z" fill="#fde68a" stroke="#b45309"/><path d="M6 22h12v16H6Z" fill="#bfdbfe" stroke="#2563eb"/><path d="M18 22h20v16H18Z" fill="#dbeafe" stroke="#2563eb"/><path d="M38 22h26v16H38Z" fill="#fed7aa" stroke="#ea580c"/></g><g font-family="Arial" font-size="8.5" font-weight="900" text-anchor="middle"><text x="15" y="17.2" fill="#166534">5</text><text x="36.5" y="17.2" fill="#166534">7</text><text x="56.5" y="17.2" fill="#92400e">4</text><text x="12" y="33.2" fill="#1d4ed8">2</text><text x="28" y="33.2" fill="#1d4ed8">4</text><text x="51" y="33.2" fill="#c2410c">x</text></g></svg>`,
      patterns: `<svg viewBox="0 0 76 48" aria-hidden="true"><g stroke="#1e3a5f" stroke-width=".9"><rect x="2" y="37" width="7" height="7" rx="1" fill="#38bdf8"/><rect x="19" y="29" width="7" height="7" rx="1" fill="#f97316"/><rect x="19" y="37" width="7" height="7" rx="1" fill="#f97316"/><rect x="36" y="21" width="7" height="7" rx="1" fill="#38bdf8"/><rect x="36" y="29" width="7" height="7" rx="1" fill="#f97316"/><rect x="36" y="37" width="7" height="7" rx="1" fill="#f97316"/><rect x="53" y="5" width="7" height="7" rx="1" fill="#f97316"/><rect x="53" y="13" width="7" height="7" rx="1" fill="#f97316"/><rect x="53" y="21" width="7" height="7" rx="1" fill="#38bdf8"/><rect x="53" y="29" width="7" height="7" rx="1" fill="#f97316"/><rect x="53" y="37" width="7" height="7" rx="1" fill="#f97316"/></g><text x="70" y="43" fill="#334155" font-family="Arial" font-size="15" font-weight="900">?</text></svg>`,
      angles: `<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M7 39h52M7 39 45 7" fill="none" stroke="#2563eb" stroke-width="5" stroke-linecap="round"/><path d="M27 39a20 20 0 0 0-5-13" fill="none" stroke="#f97316" stroke-width="3.5" stroke-linecap="round"/></svg>`,
      coordinates: `<svg viewBox="0 0 70 48" aria-hidden="true"><g stroke="#cbd5e1" stroke-width=".7"><path d="M12 5v38M23 5v38M34 5v38M45 5v38M56 5v38M6 12h58M6 23h58M6 34h58"/></g><path d="M6 34h58M23 44V5" fill="none" stroke="#334155" stroke-width="1.6"/><path d="m61 31 3 3-3 3M20 8l3-3 3 3" fill="none" stroke="#334155" stroke-width="1.4" stroke-linejoin="round"/><path d="M23 12h33v22" fill="none" stroke="#f97316" stroke-width="1.4" stroke-dasharray="3 2"/><circle cx="56" cy="12" r="3.4" fill="#0d9488" stroke="#fff" stroke-width="1.2"/><text x="60" y="9" fill="#0f766e" font-family="Arial" font-size="8" font-weight="900">A</text></svg>`,
      transformations: `<svg viewBox="0 0 70 48" aria-hidden="true"><path d="M35 4v40" stroke="#94a3b8" stroke-width="1.4" stroke-dasharray="3 3"/><path d="m8 36 18-25 4 25Z" fill="#fed7aa" stroke="#c2410c" stroke-width="1.8"/><path d="m62 36-18-25-4 25Z" fill="#99f6e4" stroke="#0f766e" stroke-width="1.8"/><path d="M25 7c7-5 14-5 21 0" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round"/><path d="m43 3 4 4-5 2" fill="none" stroke="#4f46e5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 31h13M45 31h13" stroke="#fff" stroke-width="1.4"/></svg>`,
      triangles: `<svg viewBox="0 0 72 48" aria-hidden="true"><path d="M8 42 34 5l31 37Z" fill="#e0f2fe" stroke="#2563eb" stroke-width="2" stroke-linejoin="round"/><g fill="none" stroke="#0d9488" stroke-width="1.5"><path d="M34 5v37M8 42 41.5 13.9M65 42 26.8 15.2"/></g><g fill="none" stroke="#f97316" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><path d="M34 37h5v5"/><path d="M38.9 10.9 35.9 13.5 38.4 16.5"/><path d="M29.1 11.9 32.4 14.2 30.1 17.5"/></g></svg>`,
      parallelograms: `<svg viewBox="0 0 70 48" aria-hidden="true"><path d="M16 8h43L49 40H6Z" fill="#dcfce7" stroke="#15803d" stroke-width="2" stroke-linejoin="round"/><path d="M16 8 49 40M59 8 6 40" fill="none" stroke="#2563eb" stroke-width="1.6"/><circle cx="32.5" cy="24" r="2.5" fill="#f97316" stroke="#fff" stroke-width="1"/><path d="M27 10h10M27 38h10M10 21l5 2M50 25l5 2" stroke="#15803d" stroke-width="1.4" stroke-linecap="round"/></svg>`,
      cube: `<svg viewBox="0 0 64 48" aria-hidden="true"><path d="m10 15 23-10 21 11-23 11Z" fill="#dbeafe" stroke="#2563eb" stroke-width="1.7"/><path d="m10 15 21 12v17L10 32Z" fill="#93c5fd" stroke="#2563eb" stroke-width="1.7"/><path d="m31 27 23-11v17L31 44Z" fill="#bfdbfe" stroke="#2563eb" stroke-width="1.7"/><path d="m21 10 22 11M21 21l23-10" stroke="#fff" stroke-width="1" opacity=".8"/></svg>`,
      pythagore: `<svg viewBox="0 0 70 48" aria-hidden="true"><path d="M13 17h12v12H13Z" fill="#bfdbfe" stroke="#2563eb" stroke-width="1.25"/><path d="M25 29h16v16H25Z" fill="#fde68a" stroke="#ca8a04" stroke-width="1.25"/><path d="M25 17 37 1l16 12-12 16Z" fill="#fecaca" stroke="#dc2626" stroke-width="1.25"/><path d="M25 17v12h16Z" fill="#ecfeff" stroke="#0f766e" stroke-width="1.8"/><path d="M25 25h4v4" fill="none" stroke="#f97316" stroke-width="1.6"/><text x="19" y="25" text-anchor="middle" fill="#1d4ed8" font-family="Arial" font-size="5.8" font-weight="900">A²</text><text x="33" y="39" text-anchor="middle" fill="#92400e" font-family="Arial" font-size="5.8" font-weight="900">B²</text><text x="39" y="18" text-anchor="middle" fill="#991b1b" font-family="Arial" font-size="5.8" font-weight="900">C²</text></svg>`,
      stats: `<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M7 42h51M9 42V5" stroke="#475569" stroke-width="1.7" stroke-linecap="round"/><rect x="14" y="28" width="9" height="14" rx="1.5" fill="#f9a8d4"/><rect x="28" y="18" width="9" height="24" rx="1.5" fill="#fb7185"/><rect x="42" y="8" width="9" height="34" rx="1.5" fill="#be3e68"/><path d="m14 22 13-7 12 5 15-15" fill="none" stroke="#0f766e" stroke-width="2.2" stroke-linecap="round"/></svg>`,
      average: `<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M5 42h54" stroke="#475569" stroke-width="1.6"/><rect x="8" y="28" width="10" height="14" rx="2" fill="#93c5fd"/><rect x="21" y="10" width="10" height="32" rx="2" fill="#fca5a5"/><rect x="34" y="20" width="10" height="22" rx="2" fill="#fde68a"/><rect x="47" y="16" width="10" height="26" rx="2" fill="#86efac"/><path d="M6 22h53" stroke="#7c3aed" stroke-width="2" stroke-dasharray="4 3"/></svg>`,
      probability: `<svg viewBox="0 0 70 48" aria-hidden="true"><rect x="4" y="7" width="27" height="27" rx="6" fill="#fce7f3" stroke="#be3e68" stroke-width="1.8"/><g fill="#9d174d"><circle cx="11" cy="14" r="2.1"/><circle cx="24" cy="14" r="2.1"/><circle cx="11" cy="27" r="2.1"/><circle cx="24" cy="27" r="2.1"/></g><path d="M44 8h14l-2.5 6c6 5 8.5 16 6.5 26H40c-2-10 .5-21 6.5-26Z" fill="#fff7ed" stroke="#be3e68" stroke-width="1.8" stroke-linejoin="round"/><path d="M44 8h14" stroke="#9d174d" stroke-width="2" stroke-linecap="round"/><circle cx="47" cy="29" r="4" fill="#60a5fa" stroke="#1d4ed8" stroke-width="1"/><circle cx="55" cy="31" r="4" fill="#facc15" stroke="#a16207" stroke-width="1"/><circle cx="51" cy="22" r="4" fill="#39c979" stroke="#15803d" stroke-width="1"/></svg>`,
      computing: `<svg viewBox="0 0 76 50" aria-hidden="true"><rect x="6" y="4" width="64" height="42" rx="4" fill="#eff6ff" stroke="#2563eb" stroke-width="1.3"/><g stroke="#bfdbfe" stroke-width="1"><path d="M22 4v42M38 4v42M54 4v42M6 18h64M6 32h64"/></g><circle cx="14" cy="39" r="4" fill="#22c55e" stroke="#15803d" stroke-width="1.2"/><path d="M14 39h16V25h16V11h14" fill="none" stroke="#7c3aed" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><path d="m56 7 5 4-5 4" fill="none" stroke="#7c3aed" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M64 7v15" stroke="#c2410c" stroke-width="1.8"/><path d="m64 8 8 3-8 4Z" fill="#f97316" stroke="#c2410c" stroke-width="1"/></svg>`,
      strategy: `<svg viewBox="0 0 48 36" aria-hidden="true"><g stroke="#312e81" stroke-width=".75" stroke-linejoin="round"><path d="M24 2 19 10h10Z" fill="#f97316"/><path d="m14 18 5-8 5 8Z" fill="#06b6d4"/><path d="m34 18-5-8-5 8Z" fill="#6366f1"/><path d="m14 18-5 8h10Z" fill="#6366f1"/><path d="M4 34l5-8 5 8Z" fill="#facc15"/><path d="m24 34-5-8-5 8Z" fill="#06b6d4"/><path d="m34 18-5 8h10Z" fill="#facc15"/><path d="m24 34 5-8 5 8Z" fill="#f97316"/><path d="m44 34-5-8-5 8Z" fill="#6366f1"/></g></svg>`,
      gears: `<svg viewBox="0 0 70 52" aria-hidden="true"><g fill="#2dd4bf" stroke="#0f766e" stroke-width="1.35"><g transform="translate(22 22)"><rect x="-3" y="-20" width="6" height="9" rx="1"/><rect x="-3" y="-20" width="6" height="9" rx="1" transform="rotate(45)"/><rect x="-3" y="-20" width="6" height="9" rx="1" transform="rotate(90)"/><rect x="-3" y="-20" width="6" height="9" rx="1" transform="rotate(135)"/><rect x="-3" y="-20" width="6" height="9" rx="1" transform="rotate(180)"/><rect x="-3" y="-20" width="6" height="9" rx="1" transform="rotate(225)"/><rect x="-3" y="-20" width="6" height="9" rx="1" transform="rotate(270)"/><rect x="-3" y="-20" width="6" height="9" rx="1" transform="rotate(315)"/><circle r="13"/></g></g><circle cx="22" cy="22" r="5" fill="#ecfeff" stroke="#0f766e" stroke-width="1.5"/><g fill="#facc15" stroke="#b45309" stroke-width="1.2"><g transform="translate(49 31)"><rect x="-2.6" y="-14" width="5.2" height="7" rx=".8"/><rect x="-2.6" y="-14" width="5.2" height="7" rx=".8" transform="rotate(45)"/><rect x="-2.6" y="-14" width="5.2" height="7" rx=".8" transform="rotate(90)"/><rect x="-2.6" y="-14" width="5.2" height="7" rx=".8" transform="rotate(135)"/><rect x="-2.6" y="-14" width="5.2" height="7" rx=".8" transform="rotate(180)"/><rect x="-2.6" y="-14" width="5.2" height="7" rx=".8" transform="rotate(225)"/><rect x="-2.6" y="-14" width="5.2" height="7" rx=".8" transform="rotate(270)"/><rect x="-2.6" y="-14" width="5.2" height="7" rx=".8" transform="rotate(315)"/><circle r="9"/></g></g><circle cx="49" cy="31" r="3.2" fill="#fffbeb" stroke="#b45309" stroke-width="1.3"/></svg>`
    };
    return icons[name] || icons.explorations;
  }

  function typeIcon(resource) {
    const types = resource.types || [];
    if (resource.kind === "document" || types.includes("imprimable")) {
      return `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 3h12l6 6v20H7Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M19 3v7h6M11 16h10M11 21h10" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
    }
    if (types.includes("generateur")) {
      return `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 8h18M7 16h18M7 24h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="8" r="3" fill="#fff" stroke="currentColor" stroke-width="1.7"/><circle cx="21" cy="16" r="3" fill="#fff" stroke="currentColor" stroke-width="1.7"/><circle cx="15" cy="24" r="3" fill="#fff" stroke="currentColor" stroke-width="1.7"/></svg>`;
    }
    if (types.includes("exerciseur")) {
      return `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="5" width="24" height="21" rx="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m10 15 4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }
    return `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m4 9 18-4 6 15-18 5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="11" cy="13" r="2.5" fill="currentColor"/><rect x="18" y="10" width="5" height="5" rx="1" fill="currentColor"/><path d="M13 21h9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
  }

  function domainStyle(domainId) {
    const domain = domainMap.get(domainId) || catalogue.domains[0];
    return `--accent:${escapeHtml(domain.color)};--soft:${escapeHtml(domain.soft)}`;
  }

  function notionHaystack(notion) {
    const design = notionDesign[notion.id] || {};
    return [notion.title, design.description, design.keywords].join(" ");
  }

  function domainResourceCount(domainId) {
    return published.filter((resource) => resource.domains.includes(domainId)).length;
  }

  function notionResourceCount(notionId) {
    return published.filter((resource) => resource.notions.includes(notionId)).length;
  }

  function resourceFacets(resource) {
    const facets = new Set();
    const types = resource.types || [];
    const uses = resource.uses || [];
    const source = normalise([resource.title, resource.path, resource.description, ...(resource.keywords || [])].join(" "));

    if (uses.includes("manipuler") || types.includes("plateau")) facets.add("manipuler");
    if (types.includes("generateur") || source.includes("generateur") || source.includes("maker")) facets.add("generer");
    if (
      source.match(/gabarit|rapporteur|materiel|cartes|grille|patron|tuiles a decouper/) ||
      (resource.filters || []).includes("materiel-imprimer")
    ) facets.add("gabarits");
    if (resource.kind === "document" || types.includes("imprimable") || uses.includes("imprimer")) facets.add("imprimer");
    if (source.match(/activite|seance|recherche|enquete|detective|puzzle|problemes|narration|feuille coupee/)) facets.add("activites");
    if (source.match(/cours|synthese/) || resource.path.includes("livret_litteral")) facets.add("cours");
    if (resource.domains.includes("jeux-recherches") || source.match(/jeu de|yavalath|chaos|tables modulaires|grand pari/)) facets.add("jeux");
    return facets;
  }

  function renderDomains() {
    domainGrid.hidden = false;
    notionGrid.hidden = true;
    resourceGrid.hidden = true;
    notionGrid.innerHTML = "";
    resourceGrid.innerHTML = "";

    const cards = mainDomainIds.map((domainId) => {
      const domain = domainMap.get(domainId);
      const count = domainResourceCount(domainId);
      const design = domainDesign[domainId] || {};
      return `<button class="domain-card" type="button" data-domain-card="${escapeHtml(domainId)}" style="${domainStyle(domainId)}">
        <span class="domain-card-icon">${icon(design.icon)}</span>
        <span class="domain-card-copy"><strong>${escapeHtml(domain.title)}</strong><small>${escapeHtml(domain.short)}</small><em>${count ? `${count} ressource${count > 1 ? "s" : ""}` : "Bientôt"}</em></span>
        <span class="domain-card-arrow" aria-hidden="true">→</span>
      </button>`;
    });

    const games = domainMap.get("jeux-recherches");
    const gamesCount = domainResourceCount("jeux-recherches");
    cards.push(`<button class="domain-card domain-card-secondary" type="button" data-domain-card="jeux-recherches" style="${domainStyle("jeux-recherches")}">
      <span class="domain-card-icon">${icon(domainDesign["jeux-recherches"].icon)}</span>
      <span class="domain-card-copy"><strong>${escapeHtml(games.title)}</strong><small>${escapeHtml(games.short)}</small><em>${gamesCount} ressource${gamesCount > 1 ? "s" : ""}</em></span>
      <span class="domain-card-arrow" aria-hidden="true">→</span>
    </button>`);
    domainGrid.innerHTML = cards.join("");
  }

  function matchingNotions() {
    return catalogue.notions.filter((notion) => {
      if (state.domain && notion.domain !== state.domain) return false;
      if (notionDesign[notion.id]?.hiddenFromBrowse) return false;
      if (!notionResourceCount(notion.id) && !notionDesign[notion.id]?.showWhenEmpty) return false;
      if (state.query && !allWordsMatch(notionHaystack(notion), state.query)) return false;
      return true;
    });
  }

  function resourceHaystack(resource) {
    const domains = resource.domains.map((id) => domainMap.get(id)?.title || "");
    const notions = resource.notions.map((id) => notionMap.get(id)?.title || "");
    return [resource.title, resource.description, ...(resource.keywords || []), ...domains, ...notions].join(" ");
  }

  function matchingResources() {
    return published.filter((resource) => {
      if (state.domain && !resource.domains.includes(state.domain)) return false;
      if (state.notion && !resource.notions.includes(state.notion)) return false;
      if (state.facet && !resourceFacets(resource).has(state.facet)) return false;
      if (state.query && !allWordsMatch(resourceHaystack(resource), state.query)) return false;
      return true;
    });
  }

  function notionHref(notion) {
    const design = notionDesign[notion.id] || {};
    if (design.hub) return design.hub;
    return `index.html?notion=${encodeURIComponent(notion.id)}`;
  }

  function renderNotions(notions) {
    domainGrid.hidden = true;
    notionGrid.hidden = false;
    resourceGrid.hidden = true;
    resourceGrid.innerHTML = "";
    notionGrid.innerHTML = notions.map((notion) => {
      const design = notionDesign[notion.id] || {};
      const count = notionResourceCount(notion.id);
      return `<a class="notion-card" href="${escapeHtml(notionHref(notion))}" style="${domainStyle(notion.domain)}">
        <span class="notion-top">
          <span class="notion-icon">${icon(design.icon)}</span>
          <h3>${escapeHtml(notion.title)}</h3>
        </span>
        <p>${escapeHtml(design.description || "Découvrir les outils de ce thème.")}</p>
        <span class="notion-count">${count ? `${count} ressource${count > 1 ? "s" : ""}` : "Bientôt"}</span>
      </a>`;
    }).join("") || `<p class="empty-state">Aucun thème ne correspond à cette recherche.</p>`;
  }

  function resourceMeta(resource) {
    const notion = notionMap.get(resource.notions[0]);
    const facetLabels = [...resourceFacets(resource)].slice(0, 2).map((id) => facetMap.get(id)?.label).filter(Boolean);
    const fallback = (resource.types || []).map((id) => typeMap.get(id)?.label).find(Boolean);
    return [notion?.title, ...facetLabels, facetLabels.length ? "" : (fallback || "Outil interactif")].filter(Boolean).join(" · ");
  }

  function renderResources(resources) {
    domainGrid.hidden = true;
    notionGrid.hidden = true;
    resourceGrid.hidden = false;
    notionGrid.innerHTML = "";
    resourceGrid.innerHTML = resources.map((resource) => {
      const domainId = resource.domains[0] || "nombres-calculs";
      return `<a class="resource-card" href="${escapeHtml(rootPrefix + resource.path)}" style="${domainStyle(domainId)}">
        <span class="resource-type-icon">${typeIcon(resource)}</span>
        <span class="resource-copy"><h3>${escapeHtml(resource.title)}</h3><span class="resource-meta">${escapeHtml(resourceMeta(resource))}</span></span>
        <span class="resource-arrow" aria-hidden="true">→</span>
      </a>`;
    }).join("") || `<p class="empty-state">${state.notion ? "Cet univers est prêt à accueillir ses premiers outils." : "Aucun outil ne correspond à ces critères."}</p>`;
  }

  function syncControls() {
    const hasDomain = Boolean(state.domain);
    controls.classList.toggle("has-domain", hasDomain);
    domainBox.hidden = !hasDomain;
    facetBox.hidden = !hasDomain;
    domainSelect.value = state.domain;
    facetSelect.value = state.facet;
  }

  function render() {
    syncControls();
    clearButton.hidden = !state.query;

    const selectedNotion = notionMap.get(state.notion);
    const selectedDomain = domainMap.get(state.domain);
    const queryHasNotionMatches = Boolean(state.query && matchingNotions().length);
    const showResources = Boolean(state.notion || state.facet || (state.query && !queryHasNotionMatches));

    backButton.hidden = !(state.domain || state.notion || state.facet || state.query);

    if (!state.domain && !state.notion && !state.facet && !state.query) {
      renderDomains();
      pageTitle.textContent = "Choisissez un domaine";
      heroLead.textContent = "Entrez par un domaine, puis choisissez une notion pour retrouver ses outils illustrés.";
      title.textContent = "Les domaines";
      summary.textContent = "";
      return;
    }

    if (showResources) {
      const resources = matchingResources();
      renderResources(resources);

      if (selectedNotion) {
        pageTitle.textContent = selectedNotion.title;
        heroLead.textContent = notionDesign[selectedNotion.id]?.description || "Les outils disponibles pour ce thème.";
        title.textContent = `Les outils — ${selectedNotion.title}`;
      } else if (state.facet) {
        const facet = facetMap.get(state.facet);
        pageTitle.textContent = facet?.label || "Accès direct";
        heroLead.textContent = selectedDomain ? `Les ressources de ${selectedDomain.title.toLowerCase()} correspondant à ce besoin.` : "Toutes les ressources correspondant à ce besoin.";
        title.textContent = selectedDomain ? `${facet?.label} — ${selectedDomain.title}` : (facet?.label || "Outils");
      } else {
        pageTitle.textContent = "Résultats de la recherche";
        heroLead.textContent = `Les outils correspondant à « ${state.query.trim()} ».`;
        title.textContent = "Outils trouvés";
      }

      summary.textContent = `${resources.length} outil${resources.length > 1 ? "s" : ""}`;
      return;
    }

    const notions = matchingNotions();
    renderNotions(notions);
    pageTitle.textContent = selectedDomain ? selectedDomain.title : "Choisissez une notion";
    heroLead.textContent = selectedDomain
      ? `Les thèmes de ${selectedDomain.title.toLowerCase()} présents sur maths&go.`
      : "Retrouvez les notions illustrées de maths&go.";
    title.textContent = state.query ? "Notions trouvées" : (selectedDomain ? "Choisissez une notion" : "Les notions");
    summary.textContent = notions.length
      ? `${notions.length} notion${notions.length > 1 ? "s" : ""}`
      : "Cette porte est prête pour les prochaines ressources.";
  }

  domainGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-domain-card]");
    if (!button) return;
    state.domain = button.dataset.domainCard || "";
    state.notion = "";
    state.query = "";
    searchInput.value = "";
    syncQueryString();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  domainSelect.addEventListener("change", () => {
    state.domain = domainSelect.value;
    state.notion = "";
    if (!state.domain) state.facet = "";
    state.query = "";
    searchInput.value = "";
    syncQueryString();
    render();
  });

  facetSelect.addEventListener("change", () => {
    state.facet = facetSelect.value;
    state.notion = "";
    syncQueryString();
    render();
  });

  searchInput.addEventListener("input", () => {
    state.query = searchInput.value;
    state.notion = "";
    syncQueryString();
    render();
  });

  clearButton.addEventListener("click", () => {
    searchInput.value = "";
    state.query = "";
    searchInput.focus();
    render();
  });

  backButton.addEventListener("click", () => {
    if (state.notion) {
      state.domain = notionMap.get(state.notion)?.domain || state.domain;
      state.notion = "";
    } else if (state.facet) {
      state.facet = "";
    } else {
      state.domain = "";
      state.facet = "";
      state.query = "";
      searchInput.value = "";
    }
    syncQueryString();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  if (state.notion && !notionMap.has(state.notion)) state.notion = "";
  if (state.domain && !domainMap.has(state.domain)) state.domain = "";
  if (state.facet && !facetMap.has(state.facet)) state.facet = "";
  if (state.notion && !state.domain) state.domain = notionMap.get(state.notion)?.domain || "";
  if (state.facet && !state.domain) state.facet = "";
  render();
})();
