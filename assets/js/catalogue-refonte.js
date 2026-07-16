(() => {
  "use strict";

  const catalogue = window.MATHSGO_CATALOGUE;
  if (!catalogue) return;

  const rootPrefix = document.body.dataset.rootPrefix || "";
  const published = catalogue.resources.filter((resource) => resource.status === "published");
  const domainMap = new Map(catalogue.domains.map((domain) => [domain.id, domain]));
  const notionMap = new Map(catalogue.notions.map((notion) => [notion.id, notion]));
  const collectionMap = new Map((catalogue.collections || []).map((collection) => [collection.id, collection]));
  const typeMap = new Map(catalogue.types.map((type) => [type.id, type]));
  const facetMap = new Map((catalogue.facets || []).map((facet) => [facet.id, facet]));
  const resourceClassifications = catalogue.resourceClassifications || {};
  const resourceFamilies = catalogue.resourceFamilies || [];
  const resourceFamilyByPath = new Map();
  resourceFamilies.forEach((family) => {
    (family.paths || []).forEach((path) => resourceFamilyByPath.set(path, family));
  });
  const mainDomainIds = [
    "nombres-calculs",
    "algebre",
    "proportionnalite-mesures",
    "geometrie",
    "donnees",
    "informatique"
  ];

  const domainDesign = {
    "nombres-calculs": { icon: "factor-tree" },
    algebre: { icon: "splat" },
    "proportionnalite-mesures": { icon: "equal-volume-vase" },
    geometrie: { icon: "seigaiha" },
    donnees: { icon: "frequencies" },
    informatique: { icon: "koch" },
    "jeux-recherches": { icon: "strategy" },
    cps: { icon: "cps" }
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
      hub: "calcul_litteral/index.html",
      hiddenFromBrowse: true
    },
    equations: {
      description: "Représenter l’inconnue et résoudre des équations.",
      keywords: "équation balance equasplat equabarre inconnue",
      icon: "splat",
      hub: "splat/index.html",
      hiddenFromBrowse: true
    },
    "schemas-barres": {
      description: "Modéliser les problèmes avec des schémas en barres.",
      keywords: "problème résolution partie tout barres singapour enquête",
      icon: "bars"
    },
    patterns: {
      description: "Observer, prolonger et généraliser des motifs.",
      keywords: "suite motif algèbre généralisation",
      icon: "patterns",
      hub: "labo-des-regularites.html"
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
      description: "Organiser, représenter et interpréter des données, notamment avec la moyenne.",
      keywords: "statistique graphique diagramme données moyenne répartition équilibrer barres",
      icon: "stats"
    },
    probabilites: {
      description: "Expérimenter le hasard et quantifier les chances.",
      keywords: "probabilité hasard dé pièce urne fréquence événement",
      icon: "probability",
      showWhenEmpty: true
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
    },
    "bilans-cps": {
      description: "Se connaître, faire le point et choisir un petit pas pour progresser.",
      keywords: "cps compétences psychosociales bilan élève émotions coopération engagement",
      icon: "cps"
    }
  };

  const collectionDesign = {
    bouliers: {
      description: "Choisir entre Rekenrek, Montessori, Soroban et abaque de Gerbert.",
      icon: "abacus",
      inlineGroup: "manipuler"
    },
    rekenrek: {
      description: "Suivre une progression structurée avec le Rekenrek.",
      icon: "abacus",
      thumbnail: "assets/img/thumbnails/bouliers/rekenrek-photo.svg?v=1"
    },
    montessori: {
      description: "Manipuler les nombres et les opérations avec le boulier Montessori.",
      icon: "abacus",
      thumbnail: "assets/img/thumbnails/bouliers/montessori-photo.svg?v=1"
    },
    soroban: {
      description: "Découvrir et utiliser le boulier japonais.",
      icon: "abacus",
      thumbnail: "assets/img/thumbnails/bouliers/soroban-photo.svg?v=1"
    },
    gerbert: {
      description: "Découvrir les outils de l’abaque de Gerbert.",
      icon: "abacus",
      thumbnail: "assets/img/thumbnails/bouliers/gerbert-photo.svg?v=1"
    },
    "tuiles-algebriques": {
      description: "Retrouver les plateaux, générateurs et livrets de tuiles algébriques.",
      icon: "tiles"
    },
    splat: {
      description: "Retrouver Splat, Petit Splat, Splat Équations et ÉquaSplat.",
      icon: "splat"
    }
  };

  const state = {
    domain: new URLSearchParams(window.location.search).get("domain") || "",
    query: "",
    notion: new URLSearchParams(window.location.search).get("notion") || "",
    collection: new URLSearchParams(window.location.search).get("collection") || ""
  };

  const domainGrid = document.getElementById("domain-grid");
  const notionGrid = document.getElementById("notion-grid");
  const resourceGrid = document.getElementById("resource-grid");
  const title = document.getElementById("results-title");
  const summary = document.getElementById("results-summary");
  const pageTitle = document.getElementById("page-title");
  const heroLead = document.getElementById("hero-lead");
  const breadcrumb = document.getElementById("catalogue-breadcrumb");
  const searchInput = document.getElementById("catalogue-search");
  const clearButton = document.getElementById("search-clear");
  const mainPanel = document.querySelector(".main-panel");

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

  function stateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    state.domain = params.get("domain") || "";
    state.notion = params.get("notion") || "";
    state.collection = params.get("collection") || "";
    state.query = "";

    if (state.notion && !notionMap.has(state.notion)) state.notion = "";
    if (state.collection && !collectionMap.has(state.collection)) state.collection = "";
    if (state.domain && !domainMap.has(state.domain)) state.domain = "";
    if (state.notion) state.domain = notionMap.get(state.notion)?.domain || state.domain;
    if (state.collection) state.domain = collectionMap.get(state.collection)?.domain || state.domain;
  }

  function viewLevel() {
    if (state.collection) return "collection";
    if (state.notion) return "notion";
    if (state.domain) return "domain";
    return state.query ? "search" : "entry";
  }

  function catalogueUrl() {
    const params = new URLSearchParams();
    if (state.domain) params.set("domain", state.domain);
    if (state.notion) params.set("notion", state.notion);
    if (state.collection) params.set("collection", state.collection);
    const query = params.toString();
    return `${window.location.pathname}${query ? `?${query}` : ""}`;
  }

  function rememberCurrentScroll() {
    try {
      history.replaceState({
        ...(history.state || {}),
        catalogue: true,
        level: viewLevel(),
        scrollY: window.scrollY
      }, "", catalogueUrl());
    } catch (_error) {
      // L'ouverture directe depuis un dossier Windows peut interdire l'API History.
      // La navigation doit continuer à fonctionner dans ce cas.
    }
  }

  function writeHistory(mode, fromLevel = null) {
    const previousEntryOffset = Number.isInteger(history.state?.entryHistoryOffset)
      ? history.state.entryHistoryOffset
      : 0;
    const entryHistoryOffset = mode === "push"
      ? (fromLevel === "entry" ? 1 : (fromLevel === "domain" && previousEntryOffset ? previousEntryOffset + 1 : 0))
      : previousEntryOffset;
    const historyState = {
      catalogue: true,
      level: viewLevel(),
      fromLevel,
      entryHistoryOffset,
      scrollY: 0
    };

    try {
      history[mode === "push" ? "pushState" : "replaceState"](historyState, "", catalogueUrl());
    } catch (_error) {
      // Même repli que ci-dessus pour une consultation hors serveur web.
    }
  }

  function moveToTopAndFocus() {
    window.scrollTo({ top: 0, behavior: "auto" });
    window.requestAnimationFrame(() => pageTitle.focus({ preventScroll: true }));
  }

  function renderBreadcrumb(level, selectedDomain, selectedNotion, selectedCollection) {
    breadcrumb.hidden = level === "entry";
    if (level === "entry") {
      breadcrumb.innerHTML = "";
      return;
    }

    if (level === "search") {
      breadcrumb.innerHTML = `<button type="button" data-breadcrumb-target="search">← Effacer la recherche</button>`;
      return;
    }

    const parts = [
      `<button type="button" class="breadcrumb-back" data-breadcrumb-target="entry"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg> Tous les domaines</button>`
    ];

    if (selectedDomain && level !== "domain") {
      parts.push(`<button type="button" data-breadcrumb-target="domain">${escapeHtml(selectedDomain.title)}</button>`);
    }

    breadcrumb.innerHTML = parts.join("");
  }

  function icon(name) {
    const icons = window.MATHSGO_ICON_LIBRARY || {};
    return icons[name] || icons.explorations;
  }

  function collectionVisual(collection) {
    const design = collectionDesign[collection.id] || {};
    if (design.thumbnail) {
      return `<span class="notion-icon collection-thumbnail"><img src="${escapeHtml(rootPrefix + design.thumbnail)}" alt="" loading="lazy"></span>`;
    }
    return `<span class="notion-icon">${icon(design.icon)}</span>`;
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
    return resourceDisplayCount(published.filter((resource) => resource.domains.includes(domainId)));
  }

  function resourceClassification(resource) {
    return resourceClassifications[resource.path] || {};
  }

  function resourceBelongsToNotion(resource, notionId) {
    const primaryNotion = resourceClassification(resource).primaryNotion;
    return primaryNotion ? primaryNotion === notionId : resource.notions.includes(notionId);
  }

  function resourcePrimaryNotion(resource) {
    return resourceClassification(resource).primaryNotion || resource.notions[0] || "";
  }

  function resourceCollections(resource) {
    const collections = new Set(resourceClassification(resource).collections || resource.collections || []);
    if (resource.path.startsWith("outils/bouliers/")) collections.add("bouliers");
    if (resource.path.startsWith("outils/bouliers/rekenrek/")) collections.add("rekenrek");
    if (resource.path.startsWith("outils/bouliers/boulier_montessori/")) collections.add("montessori");
    if (resource.path.startsWith("outils/bouliers/soroban/")) collections.add("soroban");
    if (resource.path.startsWith("outils/bouliers/abaque_de_gerbert/")) collections.add("gerbert");
    return [...collections];
  }

  function resourceTags(resource) {
    return [...(resource.tags || []), ...(resourceClassification(resource).tags || [])];
  }

  function displayItems(resources) {
    const items = [];
    const seenFamilies = new Set();
    resources.forEach((resource) => {
      const family = resourceFamilyByPath.get(resource.path);
      if (!family) {
        items.push({ resource });
        return;
      }
      if (seenFamilies.has(family.id)) return;
      seenFamilies.add(family.id);
      const variants = (family.paths || [])
        .map((path) => published.find((candidate) => candidate.path === path))
        .filter(Boolean);
      if (variants.length) items.push({ family, variants });
    });
    return items;
  }

  function resourceDisplayCount(resources) {
    return displayItems(resources).length;
  }

  function notionResourceCount(notionId, domainId = "") {
    return resourceDisplayCount(published.filter((resource) => (
      (!domainId || resource.domains.includes(domainId)) &&
      resourceBelongsToNotion(resource, notionId)
    )));
  }

  function collectionResourceCount(collectionId) {
    return resourceDisplayCount(published.filter((resource) => resourceCollections(resource).includes(collectionId)));
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

    ["jeux-recherches", "cps"].forEach((domainId) => {
      const domain = domainMap.get(domainId);
      const count = domainResourceCount(domainId);
      const directCps = domainId === "cps";
      const tag = directCps ? "a" : "button";
      const attributes = directCps
        ? `href="${escapeHtml(rootPrefix + "cps/bilan-s1.html")}" data-domain-card="cps" data-domain-direct="true"`
        : `type="button" data-domain-card="${escapeHtml(domainId)}"`;
      cards.push(`<${tag} class="domain-card domain-card-secondary" ${attributes} style="${domainStyle(domainId)}">
        <span class="domain-card-icon">${icon(domainDesign[domainId].icon)}</span>
        <span class="domain-card-copy"><strong>${escapeHtml(domain.title)}</strong><small>${escapeHtml(domain.short)}</small><em>${count ? `${count} ressource${count > 1 ? "s" : ""}` : "Bientôt"}</em></span>
        <span class="domain-card-arrow" aria-hidden="true">→</span>
      </${tag}>`);
    });
    domainGrid.innerHTML = cards.join("");
  }

  function matchingNotions() {
    return catalogue.notions.filter((notion) => {
      if (state.domain && notion.domain !== state.domain) return false;
      if (notionDesign[notion.id]?.hiddenFromBrowse) return false;
      if (!notionResourceCount(notion.id, notion.domain) && !notionDesign[notion.id]?.showWhenEmpty) return false;
      if (state.query && !allWordsMatch(notionHaystack(notion), state.query)) return false;
      return true;
    });
  }

  function matchingCollections() {
    return (catalogue.collections || []).filter((collection) => {
      if (state.domain && collection.domain !== state.domain) return false;
      if (collection.parent) return false;
      if (collection.hiddenFromBrowse) return false;
      return collectionResourceCount(collection.id) > 0;
    });
  }

  function collectionRootId(collectionId) {
    let collection = collectionMap.get(collectionId);
    const visited = new Set();
    while (collection?.parent && !visited.has(collection.id)) {
      visited.add(collection.id);
      collection = collectionMap.get(collection.parent) || collection;
    }
    return collection?.id || collectionId;
  }

  function matchingSearchCollections() {
    if (!state.query) return [];
    const candidates = (catalogue.collections || []).filter((collection) => {
      if (!collectionResourceCount(collection.id)) return false;
      const design = collectionDesign[collection.id] || {};
      const notionTitles = (collection.notions || []).map((id) => notionMap.get(id)?.title || "");
      return allWordsMatch([
        collection.title,
        design.description,
        ...notionTitles
      ].join(" "), state.query);
    });
    const titleMatches = candidates.filter((collection) => allWordsMatch(collection.title, state.query));
    if (!titleMatches.length) return candidates;
    const titleMatchIds = new Set(titleMatches.map((collection) => collection.id));
    return titleMatches.filter((collection) => {
      let parentId = collection.parent;
      while (parentId) {
        if (titleMatchIds.has(parentId)) return false;
        parentId = collectionMap.get(parentId)?.parent || "";
      }
      return true;
    });
  }

  function matchingNotionCollections(notionId) {
    if (!notionId) return [];
    return (catalogue.collections || []).filter((collection) => (
      !collection.parent
      && collection.collapseInNotion
      && (collection.notions || []).includes(notionId)
      && collectionResourceCount(collection.id) > 0
    ));
  }

  function childCollections(collectionId) {
    return (catalogue.collections || []).filter((collection) => (
      collection.parent === collectionId && collectionResourceCount(collection.id) > 0
    ));
  }

  function resourceHaystack(resource) {
    const domains = resource.domains.map((id) => domainMap.get(id)?.title || "");
    const notions = resource.notions.map((id) => notionMap.get(id)?.title || "");
    const collections = resourceCollections(resource).map((id) => collectionMap.get(id)?.title || id);
    return [
      resource.title,
      resource.description,
      ...(resource.keywords || []),
      ...resourceTags(resource),
      ...domains,
      ...notions,
      ...collections
    ].join(" ");
  }

  function matchingResources() {
    const collectionTitleMatches = state.query && !state.notion && !state.collection
      ? new Set((catalogue.collections || [])
        .filter((collection) => allWordsMatch(collection.title, state.query))
        .map((collection) => collectionRootId(collection.id)))
      : new Set();
    return published.filter((resource) => {
      if (state.domain && !resource.domains.includes(state.domain)) return false;
      if (state.notion && !resourceBelongsToNotion(resource, state.notion)) return false;
      if (state.notion && resourceCollections(resource).some((id) => collectionMap.get(id)?.collapseInNotion)) return false;
      if (state.collection && !resourceCollections(resource).includes(state.collection)) return false;
      if (collectionTitleMatches.size && resourceCollections(resource).some((id) => collectionTitleMatches.has(collectionRootId(id)))) return false;
      if (state.query && !allWordsMatch(resourceHaystack(resource), state.query)) return false;
      return true;
    });
  }

  function notionHref(notion) {
    return `?domain=${encodeURIComponent(notion.domain)}&notion=${encodeURIComponent(notion.id)}`;
  }

  function collectionHref(collection) {
    if (collection.navigation === "hub" && collection.hub) return collection.hub;
    return `?domain=${encodeURIComponent(collection.domain)}&collection=${encodeURIComponent(collection.id)}`;
  }

  function renderNotions(notions, collections) {
    domainGrid.hidden = true;
    notionGrid.hidden = false;
    resourceGrid.hidden = true;
    resourceGrid.innerHTML = "";
    const notionCards = notions.map((notion) => {
      const design = notionDesign[notion.id] || {};
      const count = notionResourceCount(notion.id, notion.domain);
      return `<a class="notion-card" data-notion-card="${escapeHtml(notion.id)}" href="${escapeHtml(notionHref(notion))}" style="${domainStyle(notion.domain)}">
        <span class="notion-top">
          <span class="notion-icon">${icon(design.icon)}</span>
          <h3>${escapeHtml(notion.title)}</h3>
        </span>
        <p>${escapeHtml(design.description || "Découvrir les outils de ce thème.")}</p>
        <span class="notion-count">${count ? `${count} ressource${count > 1 ? "s" : ""}` : "Bientôt"}</span>
      </a>`;
    });
    const collectionCards = collections.map((collection) => {
      const design = collectionDesign[collection.id] || {};
      const count = collectionResourceCount(collection.id);
      const hasThumbnail = Boolean(design.thumbnail);
      return `<a class="notion-card collection-card${hasThumbnail ? " collection-card-visual" : ""}" data-collection-card="${escapeHtml(collection.id)}" href="${escapeHtml(collectionHref(collection))}" style="${domainStyle(collection.domain)}">
        ${hasThumbnail ? `<span class="resource-thumbnail collection-card-thumbnail"><img src="${escapeHtml(rootPrefix + design.thumbnail)}" alt="" loading="lazy"></span>` : ""}
        <span class="collection-label">Collection</span>
        <span class="notion-top">
          ${hasThumbnail ? "" : collectionVisual(collection)}
          <h3>${escapeHtml(collection.title)}</h3>
        </span>
        <p>${escapeHtml(design.description || "Retrouver cette collection d’outils.")}</p>
        <span class="notion-count">${count} ressource${count > 1 ? "s" : ""}</span>
      </a>`;
    });
    notionGrid.innerHTML = [...notionCards, ...collectionCards].join("") || `<p class="empty-state">Aucun thème ne correspond à cette recherche.</p>`;
  }

  function resourceMeta(resource) {
    const notion = notionMap.get(resourcePrimaryNotion(resource));
    const facetLabels = [...resourceFacets(resource)].slice(0, 2).map((id) => facetMap.get(id)?.label).filter(Boolean);
    const fallback = (resource.types || []).map((id) => typeMap.get(id)?.label).find(Boolean);
    return [notion?.title, ...facetLabels, facetLabels.length ? "" : (fallback || "Outil interactif")].filter(Boolean).join(" · ");
  }

  const resourceGroups = [
    { id: "manipuler", label: "Manipuler et visualiser" },
    { id: "generer", label: "Générer et personnaliser" },
    { id: "imprimer", label: "Imprimer et fabriquer" },
    { id: "activites", label: "Activités et séances" },
    { id: "cours", label: "Cours et synthèses" },
    { id: "jeux", label: "Jouer et explorer" }
  ];

  const resourceGroupIds = new Set(resourceGroups.map((group) => group.id));

  function displayResourceGroup(item) {
    const familyGroup = item.family?.group;
    if (familyGroup && resourceGroupIds.has(familyGroup)) return familyGroup;
    const representative = item.resource || item.variants?.[0];
    return primaryResourceGroup(representative);
  }

  function primaryResourceGroup(resource) {
    const explicitGroup = resourceClassification(resource).primaryGroup;
    if (explicitGroup && resourceGroups.some((group) => group.id === explicitGroup)) return explicitGroup;
    const facets = resourceFacets(resource);
    if (facets.has("jeux")) return "jeux";
    if (facets.has("cours")) return "cours";
    if (facets.has("generer")) return "generer";
    if (facets.has("gabarits")) return "imprimer";
    if (facets.has("activites")) return "activites";
    if (facets.has("manipuler")) return "manipuler";
    if (facets.has("imprimer")) return "imprimer";
    return "manipuler";
  }

  function resourceCard(resource) {
    const domainId = resource.domains[0] || "nombres-calculs";
    const classification = resourceClassification(resource);
    const thumbnail = classification.thumbnail || resource.thumbnail;
    const description = classification.cardDescription || resource.description;
    return `<a class="resource-card${thumbnail ? " resource-card-visual" : ""}" href="${escapeHtml(rootPrefix + resource.path)}" style="${domainStyle(domainId)}">
      ${thumbnail
        ? `<span class="resource-thumbnail"><img src="${escapeHtml(rootPrefix + thumbnail)}" alt="" loading="lazy"></span>`
        : `<span class="resource-type-icon">${typeIcon(resource)}</span>`}
      <span class="resource-copy"><h3>${escapeHtml(resource.title)}</h3>${thumbnail ? `<span class="resource-description">${escapeHtml(description)}</span>` : `<span class="resource-meta">${escapeHtml(resourceMeta(resource))}</span>`}</span>
      <span class="resource-arrow" aria-hidden="true">→</span>
    </a>`;
  }

  function variantLabel(resource, family) {
    const explicitLabel = family?.labels?.[resource.path];
    if (explicitLabel) return explicitLabel;
    const parts = resource.title.split("—");
    return (parts.length > 1 ? parts.at(-1) : resource.title).trim();
  }

  function resourceFamilyCard(family, variants) {
    const representative = variants[0];
    const domainId = representative?.domains?.[0] || "nombres-calculs";
    const versionLabel = `${variants.length} version${variants.length > 1 ? "s" : ""}`;
    const thumbnail = family.thumbnail;
    const description = family.cardDescription || family.description || "Choisir une version.";
    return `<details class="resource-family-card${thumbnail ? " resource-family-card-visual" : ""}" style="${domainStyle(domainId)}">
      <summary class="resource-family-summary">
        ${thumbnail
          ? `<span class="resource-thumbnail"><img src="${escapeHtml(rootPrefix + thumbnail)}" alt="" loading="lazy"></span>`
          : `<span class="resource-type-icon">${typeIcon(representative)}</span>`}
        <span class="resource-copy"><h3>${escapeHtml(family.title)}</h3>${thumbnail ? `<span class="resource-description">${escapeHtml(`${versionLabel} · ${description}`)}</span>` : `<span class="resource-meta">${escapeHtml(`${versionLabel} · ${description}`)}</span>`}</span>
        <span class="resource-family-toggle" aria-hidden="true">⌄</span>
      </summary>
      <div class="resource-variants" aria-label="${escapeHtml(`Versions de ${family.title}`)}">
        ${variants.map((resource) => `<a href="${escapeHtml(rootPrefix + resource.path)}"><span>${escapeHtml(variantLabel(resource, family))}</span><span aria-hidden="true">→</span></a>`).join("")}
      </div>
    </details>`;
  }

  function collectionResourceCard(collection) {
    const design = collectionDesign[collection.id] || {};
    return `<a class="resource-card resource-card-visual collection-resource-card" data-collection-card="${escapeHtml(collection.id)}" href="${escapeHtml(collectionHref(collection))}" style="${domainStyle(collection.domain)}">
      <span class="resource-thumbnail collection-resource-icon">${icon(design.icon)}</span>
      <span class="resource-copy"><h3>${escapeHtml(collection.title)}</h3><span class="resource-description">${escapeHtml(design.description || "Retrouver cette collection d’outils.")}</span></span>
      <span class="resource-arrow" aria-hidden="true">→</span>
    </a>`;
  }

  function renderResources(resources, directCollections = [], directTitle = "Accès direct") {
    domainGrid.hidden = true;
    notionGrid.hidden = true;
    resourceGrid.hidden = false;
    notionGrid.innerHTML = "";
    if (!resources.length && !directCollections.length) {
      resourceGrid.innerHTML = `<p class="empty-state">${state.notion ? "Cet univers est prêt à accueillir ses premiers outils." : "Aucun outil ne correspond à cette recherche."}</p>`;
      return;
    }

    const inlineCollections = directCollections.filter((collection) => collectionDesign[collection.id]?.inlineGroup);
    const separateCollections = directCollections.filter((collection) => !collectionDesign[collection.id]?.inlineGroup);

    const directAccess = separateCollections.length
      ? `<section class="search-direct" aria-labelledby="search-direct-title">
        <div class="resource-group-heading">
          <h2 id="search-direct-title">${escapeHtml(directTitle)}</h2>
        </div>
        <div class="search-direct-grid">${separateCollections.map((collection) => {
          const design = collectionDesign[collection.id] || {};
          return `<a class="notion-card collection-card" data-collection-card="${escapeHtml(collection.id)}" href="${escapeHtml(collectionHref(collection))}" style="${domainStyle(collection.domain)}">
            <span class="collection-label">Collection</span>
            <span class="notion-top">
              ${collectionVisual(collection)}
              <h3>${escapeHtml(collection.title)}</h3>
            </span>
            <p>${escapeHtml(design.description || "Retrouver cette collection d’outils.")}</p>
          </a>`;
        }).join("")}</div>
      </section>`
      : "";

    const grouped = new Map(resourceGroups.map((group) => [group.id, []]));
    const groupedCollections = new Map(resourceGroups.map((group) => [group.id, []]));
    displayItems(resources).forEach((item) => {
      grouped.get(displayResourceGroup(item)).push(item);
    });
    inlineCollections.forEach((collection) => {
      groupedCollections.get(collectionDesign[collection.id]?.inlineGroup)?.push(collection);
    });
    const groupedResources = resourceGroups.map((group) => {
      const groupItems = grouped.get(group.id);
      const groupCollections = groupedCollections.get(group.id);
      const groupCount = groupItems.length + groupCollections.length;
      if (!groupCount) return "";
      return `<section class="resource-group" aria-labelledby="resource-group-${escapeHtml(group.id)}">
        <div class="resource-group-heading">
          <h2 id="resource-group-${escapeHtml(group.id)}">${escapeHtml(group.label)}</h2>
          <span>${groupCount} entrée${groupCount > 1 ? "s" : ""}</span>
        </div>
        <div class="resource-group-grid">${groupCollections.map(collectionResourceCard).join("")}${groupItems.map((item) => item.family
          ? resourceFamilyCard(item.family, item.variants)
          : resourceCard(item.resource)).join("")}</div>
      </section>`;
    }).join("");
    resourceGrid.innerHTML = directAccess + groupedResources;
  }

  function render() {
    clearButton.hidden = !state.query;

    const selectedNotion = notionMap.get(state.notion);
    const selectedCollection = collectionMap.get(state.collection);
    const selectedDomain = domainMap.get(state.domain);
    const showResources = Boolean(state.notion || state.collection || state.query);
    const level = viewLevel();

    mainPanel.classList.toggle("catalogue-deep-view", level === "domain" || level === "notion" || level === "collection");
    document.body.classList.toggle("catalogue-is-deep", level === "domain" || level === "notion" || level === "collection");
    mainPanel.dataset.catalogueView = level;
    renderBreadcrumb(level, selectedDomain, selectedNotion, selectedCollection);

    if (!state.domain && !state.notion && !state.query) {
      renderDomains();
      pageTitle.textContent = "Explorer les outils";
      heroLead.textContent = "Recherchez un outil ou choisissez un domaine.";
      title.textContent = "Choisissez un domaine";
      summary.textContent = "";
      return;
    }

    if (showResources) {
      const children = selectedCollection ? childCollections(selectedCollection.id) : [];
      if (children.length) {
        renderNotions([], children);
        pageTitle.textContent = selectedCollection.title;
        heroLead.textContent = collectionDesign[selectedCollection.id]?.description || "Choisissez une famille d’outils.";
        title.textContent = `Choisissez un outil — ${selectedCollection.title}`;
        summary.textContent = `${children.length} famille${children.length > 1 ? "s" : ""}`;
        return;
      }

      const resources = matchingResources();
      const directCollections = selectedNotion
        ? matchingNotionCollections(selectedNotion.id)
        : (state.query ? matchingSearchCollections() : []);
      renderResources(resources, directCollections, selectedNotion ? "Choisir une famille" : "Accès direct");

      if (selectedCollection) {
        pageTitle.textContent = selectedCollection.title;
        heroLead.textContent = collectionDesign[selectedCollection.id]?.description || "Les outils disponibles dans cette collection.";
        title.textContent = `Les outils — ${selectedCollection.title}`;
      } else if (selectedNotion) {
        pageTitle.textContent = selectedNotion.title;
        heroLead.textContent = notionDesign[selectedNotion.id]?.description || "Les outils disponibles pour ce thème.";
        title.textContent = `Les outils — ${selectedNotion.title}`;
      } else {
        pageTitle.textContent = "Résultats de la recherche";
        heroLead.textContent = `Les outils correspondant à « ${state.query.trim()} ».`;
        title.textContent = "Outils trouvés";
      }

      summary.textContent = [
        directCollections.length
          ? `${directCollections.length} ${selectedNotion ? `famille${directCollections.length > 1 ? "s" : ""}` : `accès direct${directCollections.length > 1 ? "s" : ""}`}`
          : "",
        resourceDisplayCount(resources)
          ? `${resourceDisplayCount(resources)} entrée${resourceDisplayCount(resources) > 1 ? "s" : ""}`
          : ""
      ].filter(Boolean).join(" · ");
      return;
    }

    const notions = matchingNotions();
    const collections = matchingCollections();
    renderNotions(notions, collections);
    pageTitle.textContent = selectedDomain ? selectedDomain.title : "Choisissez une notion";
    heroLead.textContent = selectedDomain
      ? `Les thèmes de ${selectedDomain.title.toLowerCase()} présents sur maths&go.`
      : "Retrouvez les notions illustrées de maths&go.";
    title.textContent = state.query
      ? "Notions trouvées"
      : (selectedDomain?.id === "algebre"
        ? "Choisissez un univers"
        : (selectedDomain ? "Choisissez une notion ou une collection" : "Les notions"));
    summary.textContent = notions.length || collections.length
      ? [
        notions.length ? `${notions.length} notion${notions.length > 1 ? "s" : ""}` : "",
        collections.length ? `${collections.length} collection${collections.length > 1 ? "s" : ""}` : ""
      ].filter(Boolean).join(" · ")
      : "Cette porte est prête pour les prochaines ressources.";
  }

  domainGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-domain-card]");
    if (!button || button.dataset.domainDirect === "true") return;
    const fromLevel = viewLevel();
    rememberCurrentScroll();
    state.domain = button.dataset.domainCard || "";
    state.notion = "";
    state.collection = "";
    state.query = "";
    searchInput.value = "";
    writeHistory("push", fromLevel);
    render();
    moveToTopAndFocus();
  });

  function openNotionOrCollection(event) {
    const link = event.target.closest("[data-notion-card], [data-collection-card]");
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const collection = collectionMap.get(link.dataset.collectionCard);
    const notion = notionMap.get(link.dataset.notionCard);
    if (!collection && !notion) return;
    if (collection?.navigation === "hub" && collection.hub) return;
    event.preventDefault();
    const fromLevel = viewLevel();
    rememberCurrentScroll();
    state.domain = collection?.domain || notion.domain;
    state.notion = notion?.id || "";
    state.collection = collection?.id || "";
    state.query = "";
    searchInput.value = "";
    writeHistory("push", fromLevel);
    render();
    moveToTopAndFocus();
  }

  notionGrid.addEventListener("click", openNotionOrCollection);
  resourceGrid.addEventListener("click", openNotionOrCollection);

  searchInput.addEventListener("input", () => {
    state.query = searchInput.value;
    state.notion = "";
    state.collection = "";
    render();
  });

  clearButton.addEventListener("click", () => {
    searchInput.value = "";
    state.query = "";
    searchInput.focus();
    render();
  });

  breadcrumb.addEventListener("click", (event) => {
    const control = event.target.closest("[data-breadcrumb-target]");
    if (!control) return;
    const target = control.dataset.breadcrumbTarget;

    if (target === "search") {
      state.query = "";
      searchInput.value = "";
      render();
      searchInput.focus();
      return;
    }

    if (target === "domain") {
      if ((state.notion || state.collection) && history.state?.fromLevel === "domain") {
        history.back();
        return;
      }
      state.domain = notionMap.get(state.notion)?.domain || collectionMap.get(state.collection)?.domain || state.domain;
      state.notion = "";
      state.collection = "";
      writeHistory("replace");
      render();
      moveToTopAndFocus();
      return;
    }

    if (target === "entry") {
      const entryHistoryOffset = history.state?.entryHistoryOffset || 0;
      if (entryHistoryOffset > 0) {
        history.go(-entryHistoryOffset);
        return;
      }
      state.domain = "";
      state.notion = "";
      state.collection = "";
      state.query = "";
      searchInput.value = "";
      writeHistory("replace");
      render();
      moveToTopAndFocus();
    }
  });

  window.addEventListener("popstate", (event) => {
    stateFromUrl();
    searchInput.value = "";
    render();
    const scrollY = Number.isFinite(event.state?.scrollY) ? event.state.scrollY : 0;
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, behavior: "auto" });
    }));
  });

  stateFromUrl();
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  writeHistory("replace", history.state?.fromLevel || null);
  render();
})();
