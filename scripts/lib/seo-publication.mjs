import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

export const SITE_ORIGIN = "https://mathsgo.re/";

export const CURATED_PAGES = [
  {
    path: "index.html",
    title: "maths&go — Outils pédagogiques de mathématiques",
    description: "Outils interactifs et ressources de mathématiques pour manipuler, projeter, imprimer et s’entraîner, en classe comme à la maison."
  },
  {
    path: "mentions-legales.html",
    title: "Mentions légales | maths&go",
    description: "Mentions légales du site pédagogique maths&go."
  },
  {
    path: "licence.html",
    title: "Licence et réutilisation | maths&go",
    description: "Conditions de réutilisation des ressources de maths&go : licence Creative Commons CC BY-NC-SA 4.0."
  },
  {
    path: "confidentialite.html",
    title: "Confidentialité | maths&go",
    description: "Politique de confidentialité du site pédagogique maths&go : aucun cookie, aucune mesure d’audience, des données qui restent sur votre appareil."
  },
  {
    path: "outils/index.html",
    title: "Outils pédagogiques par thème | maths&go",
    description: "Explorez les outils maths&go par thème : mathématiques, jeux, ressources de rentrée et compétences psychosociales."
  },
  {
    path: "outils/toutes-les-ressources.html",
    title: "Toutes les ressources pédagogiques | maths&go",
    description: "La liste complète des outils interactifs, générateurs, exercices et documents à imprimer proposés par maths&go."
  },
  {
    path: "outils/angles/index.html",
    title: "Angles : outils de manipulation et matériel à imprimer | maths&go",
    description: "Manipulez, mesurez et construisez des angles avec les outils interactifs, générateurs et documents à imprimer de maths&go."
  },
  {
    path: "outils/automatismes/index.html",
    title: "Calcul mental et automatismes au collège | maths&go",
    description: "Ressources de calcul mental et d’automatismes pour s’entraîner au collège et préparer le DNB."
  },
  {
    path: "outils/bouliers/index.html",
    title: "Bouliers, abaques et Rekenrek | maths&go",
    description: "Découvrez les outils maths&go pour manipuler les nombres avec le Rekenrek, le boulier Montessori, le Soroban et l’abaque de Gerbert."
  },
  {
    path: "outils/calcul_litteral/index.html",
    title: "Calcul littéral et algèbre | maths&go",
    description: "Outils de manipulation, exercices et ressources pour comprendre le calcul littéral, les expressions et les équations."
  },
  {
    path: "outils/chat-cest-toi-le-chat-en-ligne.html",
    title: "Chat, c’est toi le chat ! — Jouer en ligne | maths&go",
    description: "Le jeu de repérage spatial à jouer en famille : lis les quatre cartes, place les chats dans les cercles, puis vérifie. 48 séries en 4 niveaux, de la maternelle au collège."
  },
  {
    path: "outils/chat-cest-toi-le-chat-projection.html",
    title: "Chat, c’est toi le chat ! — À projeter | maths&go",
    description: "Une activité collective de repérage spatial à projeter, de la maternelle au collège : toute la classe observe un placement, argumente puis vérifie les quatre cartes pas à pas."
  },
  {
    path: "outils/club_maths/index.html",
    title: "Jeux et explorations pour le club maths | maths&go",
    description: "Jeux de stratégie et explorations mathématiques pour chercher, conjecturer et raisonner en club maths ou en classe."
  },
  {
    path: "outils/conversions/index.html",
    title: "Conversions et grandeurs | maths&go",
    description: "Manipulations et exercices pour comprendre les conversions de longueurs, d’aires, de volumes et d’autres grandeurs."
  },
  {
    path: "outils/engrenages/index.html",
    title: "Engrenages : laboratoire et exercices | maths&go",
    description: "Explorez les rapports de transmission avec un plateau d’engrenages interactif et des exercices guidés."
  },
  {
    path: "outils/fabrication_materiel/index.html",
    title: "Fabrication de matériel pédagogique | maths&go",
    description: "Générez et imprimez du matériel de mathématiques personnalisable pour la classe."
  },
  {
    path: "outils/fractions/index_fractions.html",
    title: "Fractions : manipulations et générateurs | maths&go",
    description: "Manipulez les fractions avec des bandes, disques et murs, puis créez du matériel et des exercices personnalisés."
  },
  {
    path: "outils/nombres_relatifs/index.html",
    title: "Nombres relatifs : matériel et activités | maths&go",
    description: "Ressources et matériel à imprimer pour représenter, additionner et soustraire les nombres relatifs."
  },
  {
    path: "outils/plateaux_manipulation/index.html",
    title: "Plateaux de manipulation mathématique | maths&go",
    description: "Plateaux interactifs pour manipuler les nombres, les grandeurs, la géométrie, les statistiques et la résolution de problèmes."
  },
  {
    path: "outils/splat/index.html",
    title: "Splat et schémas en barres | maths&go",
    description: "Collection d’outils Splat, équaSplat et schémas en barres pour représenter les inconnues, manipuler et créer des problèmes."
  },
  {
    path: "outils/tuiles_algebriques/index.html",
    title: "Tuiles algébriques et calcul littéral | maths&go",
    description: "Manipulez des tuiles algébriques pour construire, réduire et développer des expressions, puis résoudre des équations."
  }
];

const COLLECTION_DESCRIPTIONS = {
  bouliers: "Choisissez un boulier ou un abaque pour représenter les nombres, calculer et construire des automatismes.",
  rekenrek: "Une progression complète d’outils Rekenrek pour représenter les nombres, travailler les compléments, les doubles et le calcul mental.",
  montessori: "Des bouliers Montessori interactifs pour placer les nombres et travailler les additions et soustractions.",
  soroban: "Des outils Soroban pour représenter les nombres et s’initier au calcul sur boulier japonais.",
  gerbert: "Une progression avec l’abaque de Gerbert pour représenter les nombres et effectuer des additions et soustractions.",
  "addition-posee": "Choisissez l’outil d’addition posée adapté : pas à pas projeté, entraînement interactif ou gabarits A4 pour entiers et décimaux.",
  "division-posee": "Une division euclidienne ou décimale expliquée pas à pas, avec deux gabarits A4 à imprimer et plastifier.",
  "tuiles-algebriques": "Des tuiles algébriques pour représenter les expressions littérales, développer, réduire et résoudre des équations.",
  splat: "Des outils Splat et équaSplat pour représenter une inconnue, manipuler une équation et créer des problèmes."
};

const COLLECTION_TITLES = {
  rekenrek: "Rekenrek : boulier interactif et activités de calcul | maths&go",
  "addition-posee": "Addition posée : comprendre, s’entraîner et imprimer | maths&go",
  "division-posee": "Division posée : comprendre, s’entraîner et imprimer | maths&go"
};

const GROUP_PRESENTATION = {
  manipuler: { title: "Manipuler et comprendre", badge: "Les bases", icon: "🧮", className: "cat-bases" },
  entrainer: { title: "S’entraîner", badge: "Activités interactives", icon: "🎯", className: "cat-add" },
  generer: { title: "Créer des fiches", badge: "Outils enseignant", icon: "🖨️", className: "cat-tools" },
  imprimer: { title: "Imprimer", badge: "Documents", icon: "📄", className: "cat-tools" },
  activites: { title: "Activités et séances", badge: "En classe", icon: "🔎", className: "cat-bases" },
  cours: { title: "Cours et progressions", badge: "Repères", icon: "📚", className: "cat-bases" },
  jeux: { title: "Jeux et explorations", badge: "Chercher", icon: "🎲", className: "cat-mult" }
};

export function loadCatalogue(root) {
  const source = fs.readFileSync(path.join(root, "assets/js/catalogue-refonte-data.js"), "utf8");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.window.MATHSGO_CATALOGUE;
}

export function publicUrlForPath(filePath) {
  let relative = filePath.replace(/^\/+/, "");
  if (relative === "index.html") {
    relative = "";
  } else if (relative.endsWith("/index.html")) {
    relative = relative.slice(0, -"index.html".length);
  }
  return new URL(relative, SITE_ORIGIN).href;
}

export function relativeHref(fromFilePath, toFilePath) {
  const relative = path.posix.relative(path.posix.dirname(fromFilePath), toFilePath);
  return relative.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

export function brandedTitle(title) {
  return /maths\s*(?:&|&amp;)\s*go/i.test(title) ? title : `${title} | maths&go`;
}

export function metadataPages(catalogue) {
  const pages = new Map(CURATED_PAGES.map((page) => [page.path, { ...page, source: "curated" }]));

  for (const collection of catalogue.collections || []) {
    if (!collection.hub || pages.has(`outils/${collection.hub}`)) continue;
    const filePath = `outils/${collection.hub}`;
    pages.set(filePath, {
      path: filePath,
      title: COLLECTION_TITLES[collection.id] || brandedTitle(`${collection.title} : outils et activités`),
      description: COLLECTION_DESCRIPTIONS[collection.id] || `Découvrez les outils et activités de la collection ${collection.title} sur maths&go.`,
      source: "collection"
    });
  }

  for (const resource of catalogue.resources.filter(({ status }) => status === "published")) {
    if (!resource.path.endsWith(".html")) continue;
    pages.set(resource.path, {
      path: resource.path,
      title: brandedTitle(resource.title),
      description: resource.description,
      source: "catalogue"
    });
  }

  return [...pages.values()];
}

export function publicEntries(catalogue) {
  const entries = new Map();
  const add = (filePath, type) => {
    const url = publicUrlForPath(filePath);
    if (!entries.has(url)) entries.set(url, { filePath, url, type });
  };

  for (const page of CURATED_PAGES) add(page.path, "page");
  for (const collection of catalogue.collections || []) {
    if (collection.hub) add(`outils/${collection.hub}`, "collection");
  }
  for (const resource of catalogue.resources.filter(({ status }) => status === "published")) {
    // Les références extérieures (vidéo, article) ne sont pas des pages du site :
    // elles n'ont ni fichier, ni URL publique, ni entrée de sitemap.
    if (/^https?:\/\//i.test(resource.path)) continue;
    add(resource.path, "resource");
  }

  return [...entries.values()].sort((a, b) => {
    if (a.url === SITE_ORIGIN) return -1;
    if (b.url === SITE_ORIGIN) return 1;
    return a.url.localeCompare(b.url, "fr");
  });
}

export function allHtmlFilePaths(root) {
  const files = [];

  function walk(directory, relativeDirectory = "") {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name.startsWith("_") || entry.name === "node_modules") continue;
      const absolutePath = path.join(directory, entry.name);
      const relativePath = path.posix.join(relativeDirectory, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath, relativePath);
      } else if (/\.html?$/i.test(entry.name)) {
        files.push(relativePath);
      }
    }
  }

  walk(root);
  return files.sort((a, b) => a.localeCompare(b, "fr"));
}

export function nonPublicHtmlPaths(root, catalogue) {
  const publicPaths = new Set(
    publicEntries(catalogue)
      .map(({ filePath }) => filePath)
      .filter((filePath) => filePath.endsWith(".html"))
  );
  return allHtmlFilePaths(root).filter((filePath) => !publicPaths.has(filePath));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeXml(value) {
  return escapeHtml(value).replaceAll("'", "&apos;");
}

function upsertHeadElement(head, matcher, replacement, insertAfter) {
  if (matcher.test(head)) return head.replace(matcher, replacement);
  return head.replace(insertAfter, (match) => `${match}\n  ${replacement}`);
}

export function updateHtmlMetadata(html, page) {
  const headMatch = html.match(/<head\b[^>]*>[\s\S]*?<\/head>/i);
  if (!headMatch) throw new Error(`${page.path}: élément <head> introuvable`);

  let head = headMatch[0];
  const title = `<title>${escapeHtml(page.title)}</title>`;
  const description = `<meta name="description" content="${escapeHtml(page.description)}">`;
  const canonical = `<link rel="canonical" href="${escapeHtml(publicUrlForPath(page.path))}">`;
  const robots = '<meta name="robots" content="index, follow, max-image-preview:large">';

  if (/<title\b[^>]*>[\s\S]*?<\/title>/i.test(head)) {
    head = head.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, title);
  } else {
    head = head.replace(/<head\b[^>]*>/i, (match) => `${match}\n  ${title}`);
  }

  head = upsertHeadElement(
    head,
    /<meta\b(?=[^>]*\bname\s*=\s*["']description["'])[^>]*>/i,
    description,
    /<title\b[^>]*>[\s\S]*?<\/title>/i
  );
  head = upsertHeadElement(
    head,
    /<link\b(?=[^>]*\brel\s*=\s*["'][^"']*\bcanonical\b[^"']*["'])[^>]*>/i,
    canonical,
    /<meta\b(?=[^>]*\bname\s*=\s*["']description["'])[^>]*>/i
  );
  head = upsertHeadElement(
    head,
    /<meta\b(?=[^>]*\bname\s*=\s*["']robots["'])[^>]*>/i,
    robots,
    /<link\b(?=[^>]*\brel\s*=\s*["'][^"']*\bcanonical\b[^"']*["'])[^>]*>/i
  );

  // Quelques outils historiques sont en CRLF. Les balises que le générateur
  // remplace utilisent volontairement LF afin que Git ne considère pas le
  // retour chariot comme une espace finale sur les nouvelles lignes.
  const managedTags = [title, description, canonical, robots];
  head = head.split("\n").map((line) => (
    managedTags.some((tag) => line.includes(tag)) ? line.replace(/\r$/, "") : line
  )).join("\n");

  return html.replace(headMatch[0], head);
}

export function hasNoindexDirective(html) {
  const robots = html.match(/<meta\b(?=[^>]*\bname\s*=\s*["']robots["'])[^>]*>/i)?.[0] || "";
  return /\bnoindex\b/i.test(robots);
}

export function updateHtmlNoindex(html, pagePath) {
  if (hasNoindexDirective(html)) return html;

  const headMatch = html.match(/<head\b[^>]*>[\s\S]*?<\/head>/i);
  if (!headMatch) throw new Error(`${pagePath}: élément <head> introuvable`);

  let head = headMatch[0];
  const robots = '<meta name="robots" content="noindex, follow">';
  const robotsMatcher = /<meta\b(?=[^>]*\bname\s*=\s*["']robots["'])[^>]*>/i;
  if (robotsMatcher.test(head)) {
    head = head.replace(robotsMatcher, robots);
  } else if (/<title\b[^>]*>[\s\S]*?<\/title>/i.test(head)) {
    head = head.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, (match) => `${match}\n  ${robots}`);
  } else {
    head = head.replace(/<head\b[^>]*>/i, (match) => `${match}\n  ${robots}`);
  }

  return html.replace(headMatch[0], head);
}

function collectionIdsForResource(catalogue, resource) {
  return catalogue.resourceClassifications?.[resource.path]?.collections || resource.collections || [];
}

export function publishedCollectionResources(catalogue, collectionId) {
  return catalogue.resources.filter((resource) => (
    resource.status === "published" && collectionIdsForResource(catalogue, resource).includes(collectionId)
  ));
}

export function buildCollectionResourceSections(catalogue, collectionId, hubPath = "outils/bouliers/rekenrek/index.html") {
  const classifications = catalogue.resourceClassifications || {};
  const grouped = new Map();
  for (const resource of publishedCollectionResources(catalogue, collectionId)) {
    const groupId = classifications[resource.path]?.primaryGroup || "manipuler";
    if (!grouped.has(groupId)) grouped.set(groupId, []);
    grouped.get(groupId).push(resource);
  }

  const order = Object.keys(GROUP_PRESENTATION);
  return order.filter((groupId) => grouped.has(groupId)).map((groupId) => {
    const presentation = GROUP_PRESENTATION[groupId];
    const resources = grouped.get(groupId).sort((a, b) => a.title.localeCompare(b.title, "fr"));
    const cards = resources.map((resource) => `        <a href="${escapeHtml(relativeHref(hubPath, resource.path))}" class="card-link">
            <div class="icon-box">${presentation.icon}</div>
            <h3>${escapeHtml(resource.title)}</h3>
            <p>${escapeHtml(resource.description)}</p>
        </a>`).join("\n");
    return `    <h2 class="section-title">${presentation.title} <span class="badge">${presentation.badge}</span></h2>
    <section class="grid ${presentation.className}">
${cards}
    </section>`;
  }).join("\n\n");
}

export function updateRekenrekHub(html, catalogue) {
  const sections = buildCollectionResourceSections(catalogue, "rekenrek");
  const main = `<main class="wrapper">
    <section class="hub-intro" aria-labelledby="rekenrek-intro-title">
        <h2 id="rekenrek-intro-title">Découvrir et utiliser le Rekenrek</h2>
        <p>Manipulez un rekenrek en ligne, puis travaillez la numération, les compléments, les doubles et le passage de la dizaine. Les activités et générateurs ci-dessous suivent le catalogue publié de maths&amp;go.</p>
    </section>

${sections}
</main>`;
  if (!/<main\s+class=["']wrapper["']>[\s\S]*?<\/main>/i.test(html)) {
    throw new Error("outils/bouliers/rekenrek/index.html : contenu principal introuvable");
  }
  return html.replace(/<main\s+class=["']wrapper["']>[\s\S]*?<\/main>/i, main);
}

export function buildSitemapXml(catalogue) {
  const urls = publicEntries(catalogue)
    .map(({ url }) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function resourceGroups(catalogue) {
  const notionById = new Map(catalogue.notions.map((notion) => [notion.id, notion]));
  const classifications = catalogue.resourceClassifications || {};
  const groups = new Map(catalogue.domains.map((domain) => [domain.id, new Map()]));

  function directoryNotionId(resource) {
    const classification = classifications[resource.path] || {};
    const primaryNotionId = classification.primaryNotion || resource.notions?.[0];
    if ((classification.hiddenFromNotions || []).includes(primaryNotionId)) return "autres";
    return primaryNotionId;
  }

  for (const resource of catalogue.resources.filter(({ status }) => status === "published")) {
    const primaryNotionId = directoryNotionId(resource);
    const notion = notionById.get(primaryNotionId);
    const domainId = notion?.domain || resource.domains?.[0];
    if (!groups.has(domainId)) groups.set(domainId, new Map());
    const notions = groups.get(domainId);
    const notionId = notion?.id || "autres";
    if (!notions.has(notionId)) notions.set(notionId, []);
    notions.get(notionId).push(resource);
  }

  for (const notions of groups.values()) {
    for (const resources of notions.values()) {
      resources.sort((a, b) => a.title.localeCompare(b.title, "fr"));
    }
  }
  return groups;
}

export function buildDirectoryHtml(catalogue) {
  const groups = resourceGroups(catalogue);
  const activeDomains = catalogue.domains.filter((domain) => (groups.get(domain.id)?.size || 0) > 0);
  const notionById = new Map(catalogue.notions.map((notion) => [notion.id, notion]));
  const collectionCards = (catalogue.collections || []).map((collection) => {
    const href = publicUrlForPath(`outils/${collection.hub}`);
    const description = COLLECTION_DESCRIPTIONS[collection.id] || `Découvrez les outils et activités de la collection ${collection.title}.`;
    return `          <li><a href="${escapeHtml(href)}"><strong>${escapeHtml(collection.title)}</strong><span>${escapeHtml(description)}</span></a></li>`;
  }).join("\n");

  const domainSections = catalogue.domains.map((domain) => {
    const notions = groups.get(domain.id);
    if (!notions || notions.size === 0) return "";
    const notionSections = [...notions.entries()].map(([notionId, resources]) => {
      const notionTitle = notionById.get(notionId)?.title || "Autres ressources";
      const resourceItems = resources.map((resource) => {
        const href = publicUrlForPath(resource.path);
        const type = resource.path.endsWith(".pdf") ? '<span class="file-type">PDF</span>' : "";
        return `              <li><a href="${escapeHtml(href)}"><strong>${escapeHtml(resource.title)} ${type}</strong><span>${escapeHtml(resource.description)}</span></a></li>`;
      }).join("\n");
      return `          <section class="notion" aria-labelledby="notion-${escapeHtml(notionId)}">\n            <h3 id="notion-${escapeHtml(notionId)}">${escapeHtml(notionTitle)}</h3>\n            <ul class="resource-list">\n${resourceItems}\n            </ul>\n          </section>`;
    }).join("\n");
    return `      <section class="domain" id="${escapeHtml(domain.id)}" style="--accent:${escapeHtml(domain.color)};--soft:${escapeHtml(domain.soft)}">\n        <h2>${escapeHtml(domain.title)}</h2>\n        <p>${escapeHtml(domain.short)}</p>\n${notionSections}\n      </section>`;
  }).filter(Boolean).join("\n");

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Toutes les ressources de mathématiques | maths&amp;go</title>
  <meta name="description" content="La liste complète des outils interactifs, générateurs, exercices et documents à imprimer proposés par maths&amp;go.">
  <link rel="canonical" href="https://mathsgo.re/outils/toutes-les-ressources.html">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="../assets/css/annuaire-ressources.css?v=20260810-1">
  <script defer src="../assets/js/mention-confidentialite.js"></script>
</head>
<body>
  <a class="skip-link" href="#ressources">Aller aux ressources</a>
  <header class="site-header">
    <a class="brand" href="/" aria-label="Accueil maths&go"><img src="../assets/img/mathsgo-logo.png" alt="maths&go" width="1338" height="622"></a>
    <nav aria-label="Navigation principale"><a href="/outils/">Catalogue interactif</a><a href="/auto/">Automatismes DNB</a></nav>
  </header>
  <main id="ressources">
    <header class="hero">
      <p class="eyebrow">Répertoire permanent</p>
      <h1>Toutes les ressources maths&amp;go</h1>
      <p>Une page simple qui donne un accès direct à chaque outil, exercice et document publié. Pour filtrer par usage, utilisez le <a href="/outils/">catalogue interactif</a>.</p>
    </header>
    <nav class="domain-nav" aria-label="Accès rapide aux domaines">
${activeDomains.map((domain) => `      <a href="#${escapeHtml(domain.id)}">${escapeHtml(domain.title)}</a>`).join("\n")}
    </nav>
    <section class="collections" aria-labelledby="collections-title">
      <h2 id="collections-title">Parcours et familles d’outils</h2>
      <ul>
${collectionCards}
      </ul>
    </section>
${domainSections}
  </main>
  <footer>
    <span>Gwenaël Bourgault</span><span aria-hidden="true">·</span>
    <a href="mailto:gwenael@mathsgo.re?subject=Contact%20depuis%20mathsgo.re">Me contacter</a><span aria-hidden="true">·</span>
    <a href="/outils/">Catalogue</a><span aria-hidden="true">·</span>
    <a href="/mentions-legales.html">Mentions légales</a><span aria-hidden="true">·</span>
    <a href="/confidentialite.html">Confidentialité</a><span aria-hidden="true">·</span>
    <a href="/licence.html">Licence</a><span aria-hidden="true">·</span>
    <span data-mathsgo-confidentialite>Sans cookie ni traceur</span>
  </footer>
</body>
</html>
`;
}
