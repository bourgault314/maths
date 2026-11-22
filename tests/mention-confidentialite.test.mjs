import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");

// LOT 10b — Google Analytics quitte le site (décision du 03/09/2026).
//
// Avant : 153 pages chargeaient assets/js/consentement.js, qui posait une bannière
// « Autoriser les statistiques ? » et, après accord, chargeait Google Analytics
// depuis googletagmanager.com — le dernier script tiers que le site pouvait encore
// exécuter sur l'origine mathsgo.re (celle où vivent les codes et les prénoms).
// Après : plus de mesure d'audience, plus de bannière, plus rien à demander. Un
// script commun, mention-confidentialite.js, efface les anciens témoins et pose
// la mention « Sans cookie ni traceur · Confidentialité » en pied de page.
//
// Ces tests interdisent le retour en arrière et vérifient que la mention est là.

const MENTION = "Sans cookie ni traceur";
const SCRIPT = "assets/js/mention-confidentialite.js";
const source = readFileSync(join(racine, SCRIPT), "utf8");

// Ce fichier est lui-même dans le site publié : les mots interdits y sont
// assemblés en morceaux pour ne pas se dénoncer eux-mêmes.
const j = (...m) => m.join("");
const INTERDITS = [
  j("consentement", ".js"),
  j("consentement", ".css"),
  j("Gérer mes ", "cookies"),
  j("mathsgo", "Consentement"),
  j("data-mathsgo-", "consent-open"),
  j("googletag", "manager"),
  j("google-", "analytics.com"),
  j("G-X8TV", "C83222"),
  j("gtag(", "\"config\""),
  j("MATHSGO_SUIVI", "_ELEVE"),
];

function fichiersPublies(extensions) {
  const trouves = [];
  (function parcourir(dossier) {
    for (const nom of readdirSync(dossier)) {
      if (nom.startsWith(".") || nom.startsWith("_") || nom === "node_modules") continue;
      const chemin = join(dossier, nom);
      if (statSync(chemin).isDirectory()) parcourir(chemin);
      else if (extensions.some((e) => nom.toLowerCase().endsWith(e))) trouves.push(chemin);
    }
  })(racine);
  return trouves.sort();
}
const rel = (chemin) => relative(racine, chemin).split(sep).join("/");
const pages = fichiersPublies([".html"]);

// ---------------------------------------------------------------------------
// 1. Plus aucune trace de la mesure d'audience ni de la bannière, nulle part.
// ---------------------------------------------------------------------------
test("les fichiers de l'ancienne bannière n'existent plus", () => {
  for (const parti of ["assets/js/consentement.js", "assets/css/consentement.css", "tests/consentement-suivi-eleve.test.mjs"]) {
    assert.ok(!existsSync(join(racine, parti)), `${parti} est revenu`);
  }
});

test("aucun fichier publié ni aucun fichier du serveur ne cite Google Analytics ou l'ancienne bannière", () => {
  const fautives = [];
  const fichiers = [
    ...fichiersPublies([".html", ".js", ".mjs", ".cjs", ".css"]),
    ...readdirSync(join(racine, "_serveur/public"), { recursive: true })
      .map((n) => join(racine, "_serveur/public", String(n)))
      .filter((c) => /\.(php|js|html|css)$/.test(c) && statSync(c).isFile()),
    // Les tests eux-mêmes peuvent raconter le passé (« consentement.js ne doit plus… ») :
    // aucune page ne les charge, ils sont laissés de côté ici.
  ].filter((c) => !c.includes(`${sep}vendor${sep}`) && !c.startsWith(join(racine, "tests") + sep));
  for (const chemin of fichiers) {
    const texte = readFileSync(chemin, "utf8");
    for (const mot of INTERDITS) {
      if (texte.includes(mot)) fautives.push(`${rel(chemin)} → ${mot}`);
    }
  }
  assert.deepEqual(fautives, [], "traces de la mesure d'audience ou de la bannière :\n  " + fautives.join("\n  "));
});

// ---------------------------------------------------------------------------
// 2. Où la mention vit (décision de Gwenaël du 23/10/2026) : « tant que je suis
//    dans ce qui ressemble à l'accueil, on laisse ; dès que je rentre dans une
//    appli, on enlève ». Elle reste sur l'accueil, le catalogue, l'annuaire, les
//    pages légales et les pages d'entrée encore servies (les 17 anciens index
//    devenus des redirections le 23/10, PR #1047, n'ont plus de pied) ; elle quitte les applis,
//    les jeux et les fiches à jouer — sauf les deux menus des Automatismes, qu'il
//    garde exprès (ils avaient l'ancien lien « Gérer mes cookies » : la voir
//    disparaître là ferait croire que les cookies sont arrivés).
// ---------------------------------------------------------------------------
const PAGES_AVEC_MENTION = [
  "auto/index.html",
  "automatismes-v2/index.html",
  "confidentialite.html",
  "index.html",
  "licence.html",
  "mentions-legales.html",
  "outils/addition-posee/index.html",
  "outils/chat/index.html",
  "outils/division-posee/index.html",
  "outils/index.html",
  "outils/multiplication-posee/index.html",
  // les fiches du Moulin de Pythagore : une page du site (une liste de PDF), pas une
  // appli — rangée par erreur parmi les applis le 23/10, remise le 24/10 (Gwenaël)
  "outils/papiers-imprimer/index.html",
  "outils/plateaux_manipulation/moulin_pythagore_fiches.html",
  "outils/soustraction-posee/index.html",
  "outils/toutes-les-ressources.html",
];

test("la mention n'est chargée que par l'accueil, le catalogue, les pages légales, les pages de famille et les deux menus des Automatismes", () => {
  const chargeuses = [];
  for (const chemin of pages) {
    const page = readFileSync(chemin, "utf8");
    const balises = page.match(/<script\b[^>]*mention-confidentialite\.js[^>]*>/g) ?? [];
    assert.ok(balises.length <= 1, `${rel(chemin)} charge ${balises.length} fois le script`);
    if (balises.length === 1) {
      chargeuses.push(rel(chemin));
      assert.match(balises[0], /^<script defer src="(?:\.\.\/)*assets\/js\/mention-confidentialite\.js">$/,
        `${rel(chemin)} : balise inattendue ${balises[0]}`);
    }
  }
  // 153 pages au lot 10b, 167 au 22/10/2026, 150 après la PR #1047 ; 13 depuis ce lot, 14 avec les
  // fiches du Moulin de Pythagore (24/10/2026). Une nouvelle
  // appli ne charge PAS le script ; une nouvelle page de navigation l'ajoute ici.
  assert.deepEqual(chargeuses, PAGES_AVEC_MENTION);
});

// Ce qu'une page peut AFFICHER : son texte hors commentaires, balises et styles (espaces
// et retours à la ligne ramenés à un seul espace), plus le code de ses scripts sans leurs
// commentaires (un script peut écrire la mention). Les commentaires qui racontent
// l'histoire de la mention ne comptent pas. Relecture Codex du 24/10 : l'ancienne
// recherche exigeait « > » ou « " » collé devant la phrase, et laissait passer
// « <p>⏎  Sans cookie ni traceur⏎</p> ».
const MENTION_SOUPLE = /Sans\s+cookie\s+ni\s+traceur/;
// Retire les commentaires d'un code JavaScript en lisant caractère par caractère : ce
// qui est entre guillemets (', ", `) est une chaîne et reste ; « // » ou « /* » hors
// chaîne ouvre un commentaire (contre-relecture Codex du 24/10 : `"exemple"// …`).
function sansCommentairesJs(code) {
  let sortie = "";
  let chaine = "";
  for (let i = 0; i < code.length; i += 1) {
    const c = code[i];
    if (chaine) {
      sortie += c;
      if (c === "\\") { sortie += code[i + 1] ?? ""; i += 1; }
      else if (c === chaine) chaine = "";
      continue;
    }
    if (c === "/" && code[i + 1] === "/") {
      while (i < code.length && code[i] !== "\n") i += 1;
      sortie += "\n";
      continue;
    }
    if (c === "/" && code[i + 1] === "*") {
      const fin = code.indexOf("*/", i + 2);
      i = fin < 0 ? code.length : fin + 1;
      sortie += " ";
      continue;
    }
    if (c === "'" || c === '"' || c === "`") chaine = c;
    sortie += c;
  }
  return sortie;
}
// Les espaces que le navigateur affiche comme des espaces : entités nommées, décimales
// et hexadécimales (contre-relecture Codex du 24/10 : `&#xA0;`).
function decoderEntites(texte) {
  return texte
    .replace(/&#x([0-9a-f]+);?/gi, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);?/g, (_m, d) => String.fromCodePoint(Number(d)))
    .replace(/&(nbsp|ensp|emsp|thinsp|NonBreakingSpace);/g, " ");
}
function afficheLaMention(source, estHtml) {
  if (!estHtml) return MENTION_SOUPLE.test(sansCommentairesJs(source));
  const sansCommentaires = source.replace(/<!--[\s\S]*?-->/g, " ");
  const scripts = [...sansCommentaires.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  if (scripts.some((code) => MENTION_SOUPLE.test(sansCommentairesJs(code)))) return true;
  const texte = sansCommentaires
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return MENTION_SOUPLE.test(decoderEntites(texte).replace(/[\s\u00a0\u202f\u2007]+/g, " "));
}

test("le détecteur voit la mention écrite sur plusieurs lignes ou par un script, pas dans un commentaire", () => {
  assert.ok(afficheLaMention("<p>\n  Sans cookie ni traceur\n</p>", true), "sabotage de Codex : texte seul sur sa ligne");
  assert.ok(afficheLaMention("<span>Sans&nbsp;cookie ni traceur</span>", true));
  assert.ok(afficheLaMention("<script>el.textContent = 'Sans cookie ni traceur';</script>", true), "écrite par un script de la page");
  assert.ok(afficheLaMention("const t = `Sans cookie\n ni traceur`;", false), "dans un fichier .js");
  assert.ok(!afficheLaMention("<!-- la mention « Sans cookie ni traceur » est partie -->", true));
  assert.ok(!afficheLaMention("<style>/* Sans cookie ni traceur */</style>", true));
  assert.ok(!afficheLaMention("<script>// page, « Sans cookie ni traceur · Confidentialité »\nvar a = 1;</script>", true));
  assert.ok(!afficheLaMention("/* Sans cookie ni traceur */ var a = 1; // Sans cookie ni traceur", false));
  // contre-relecture Codex du 24/10
  assert.ok(afficheLaMention("<p>Sans&#xA0;cookie ni traceur</p>", true), "espace insécable en hexadécimal");
  assert.ok(afficheLaMention("<p>Sans&#160;cookie&#x20;ni traceur</p>", true), "entités décimale et hexadécimale");
  assert.ok(afficheLaMention("<p>Sans <strong>cookie</strong>\n ni\ttraceur</p>", true));
  assert.ok(!afficheLaMention('<script>const note = "exemple"// Sans cookie ni traceur\nvar b = 2;</script>', true), "commentaire collé à une chaîne");
  assert.ok(afficheLaMention('<script>const url = "https://mathsgo.re"; el.textContent = "Sans cookie ni traceur";</script>', true), "« // » dans une chaîne n'ouvre pas de commentaire");
  assert.ok(!afficheLaMention("const s = 'a'; /* Sans cookie\n ni traceur */", false));
});

test("aucune appli, aucun jeu, aucune fiche à jouer n'affiche « Sans cookie ni traceur »", () => {
  // scripts/ : outils de construction et de contrôle (aucune page ne les charge) ;
  // seo-publication.mjs y fabrique le pied de « Toutes les ressources », qui garde la mention.
  const permises = new Set([...PAGES_AVEC_MENTION, "automatismes-v2/app.js", SCRIPT]);
  const fautives = fichiersPublies([".html", ".js", ".mjs"])
    .filter((c) => !c.startsWith(join(racine, "tests") + sep) && !c.startsWith(join(racine, "scripts") + sep))
    .filter((c) => !c.includes(`${sep}vendor${sep}`) && !/\.test\.m?js$/.test(c))
    .filter((c) => !permises.has(rel(c)))
    .filter((c) => afficheLaMention(readFileSync(c, "utf8"), c.endsWith(".html")))
    .map(rel);
  assert.deepEqual(fautives, []);
});

// ---------------------------------------------------------------------------
// 3. La mention écrite dans les pieds de page : jamais de lien « Confidentialité »
//    en double, et un lien qui mène bien à la page.
// ---------------------------------------------------------------------------
test("la mention écrite dans un pied de page respecte la règle « un seul lien Confidentialité »", () => {
  let mentions = 0;
  for (const chemin of pages) {
    const page = readFileSync(chemin, "utf8");
    for (const m of page.matchAll(/<(span|a)\b([^>]*)data-mathsgo-confidentialite([^>]*)>([^<]*)<\/\1>/g)) {
      mentions += 1;
      const [tout, balise, avant, apres, texte] = m;
      const attrs = avant + apres;
      const debut = page.lastIndexOf("<footer", m.index);
      const fin = page.indexOf("</footer>", m.index);
      const pied = debut >= 0 && fin >= 0 ? page.slice(debut, fin) : "";
      const lienDeja = /href="[^"]*confidentialite\.html"/.test(pied.replace(tout, ""));
      if (balise === "span") {
        assert.equal(texte, MENTION, `${rel(chemin)} : texte de la mention ${texte}`);
        assert.ok(lienDeja, `${rel(chemin)} : mention sans lien alors que le pied n'a pas de lien Confidentialité`);
      } else if (texte === "Confidentialité") {
        // Accueil : la marque est sur le lien Confidentialité lui-même, sans texte ajouté.
        assert.match(attrs, /href="(?:\.\.\/)*confidentialite\.html"/, `${rel(chemin)} : le lien marqué ne mène pas à confidentialite.html`);
      } else {
        assert.equal(texte, `${MENTION} · Confidentialité`, `${rel(chemin)} : texte du lien ${texte}`);
        assert.match(attrs, /href="(?:\.\.\/)*confidentialite\.html"/, `${rel(chemin)} : le lien ne mène pas à confidentialite.html`);
        assert.ok(!lienDeja, `${rel(chemin)} : deux liens Confidentialité dans le même pied`);
      }
    }
  }
  // 26 au lot 10b ; 12 depuis le 23/10/2026 (les applis ne l'écrivent plus, les anciens index sont des redirections) ;
  // 13 depuis le 24/10/2026 (les fiches du Moulin de Pythagore, une page du site, la retrouvent).
  // 14 depuis le 12/11/2026 : la page de téléchargement des papiers est une page de navigation.
  assert.equal(mentions, 14, `${mentions} mentions écrites`);
});

test("les trois pages légales et l'annuaire écrivent la mention dans leur pied", () => {
  for (const relatif of ["confidentialite.html", "mentions-legales.html", "licence.html", "outils/toutes-les-ressources.html"]) {
    const page = readFileSync(join(racine, relatif), "utf8");
    assert.match(page, new RegExp(`<span[^>]*data-mathsgo-confidentialite>${MENTION}</span>`), relatif);
  }
});

// L'accueil est la seule page SANS la mention (décision de Gwenaël du 04/09/2026 :
// son pied tient sur une ligne à toute largeur, et il a déjà son lien Confidentialité).
// La marque est posée sur ce lien : le script commun ne pose rien, mais il continue
// d'effacer les anciens cookies de mesure — c'est la page la plus visitée.
test("l'accueil garde son pied d'une ligne : pas de mention, la marque est sur le lien Confidentialité", () => {
  const page = readFileSync(join(racine, "index.html"), "utf8");
  assert.ok(!page.includes(MENTION), "pas de « Sans cookie ni traceur » sur l'accueil");
  assert.match(page, /<a class="footer-link" href="confidentialite\.html" data-mathsgo-confidentialite>Confidentialité<\/a>/);
  assert.match(page, /<script defer src="assets\/js\/mention-confidentialite\.js"><\/script>/, "le script reste chargé (nettoyage des anciens cookies)");
  assert.ok(!page.includes('<a class="footer-link" href="licence.html">Licence</a><span aria-hidden="true">·</span>'),
    "plus de séparateur orphelin après « Licence »");
});

// ---------------------------------------------------------------------------
// 4. Le script, EXÉCUTÉ dans un faux navigateur : ce qu'il fait vraiment.
// ---------------------------------------------------------------------------
function fauxElement(tagName) {
  const el = {
    tagName, className: "", textContent: "", enfants: [], attributs: {},
    classList: { toggle(nom, actif) { el.classes = el.classes || new Set(); actif ? el.classes.add(nom) : el.classes.delete(nom); } },
    appendChild(e) { el.enfants.push(e); return e; },
    setAttribute(n, v) { el.attributs[n] = v; },
  };
  return el;
}

function jouer({ cookies = "", rangement = new Map(), mentionEcrite = false, overflow = "visible", display = "block", hote = "mathsgo.re" } = {}) {
  const head = fauxElement("head");
  const body = fauxElement("body");
  const ecritures = [];
  const document = {
    currentScript: { src: "https:" + "//" + hote + "/assets/js/mention-confidentialite.js" },
    readyState: "complete",
    head, body, documentElement: fauxElement("html"),
    get cookie() { return cookies; },
    set cookie(v) { ecritures.push(v); },
    createElement: (tag) => fauxElement(tag),
    createTextNode: (t) => t,
    querySelector: (sel) => (sel === "[data-mathsgo-confidentialite]" && mentionEcrite ? fauxElement("span") : null),
    addEventListener() {},
  };
  const window = {
    location: { hostname: hote },
    localStorage: { removeItem: (k) => rangement.delete(k) },
    getComputedStyle: () => ({ overflow, overflowY: overflow, display, flexDirection: "column" }),
  };
  new Function("window", "document", "URL", source)(window, document, URL);
  return { head, body, ecritures, rangement };
}

test("le script efface les cookies _ga et le choix de consentement qu'une ancienne visite avait laissés", () => {
  const rangement = new Map([["mathsgo:consentement:v1", "{}"], ["soley-save-v5", "garde"]]);
  const r = jouer({ cookies: "_ga=GA1.1.1; _ga_X8TVC83222=GS1.1; autre=1", rangement });
  assert.equal(r.ecritures.filter((e) => e.startsWith("_ga=") && e.includes("Max-Age=0")).length, 3, "_ga effacé sur les 3 domaines");
  assert.equal(r.ecritures.filter((e) => e.startsWith("_ga_X8TVC83222=")).length, 3);
  assert.ok(r.ecritures.every((e) => !e.startsWith("autre=")), "les autres cookies ne sont pas touchés");
  assert.ok(!rangement.has("mathsgo:consentement:v1"), "le choix de consentement est retiré");
  assert.ok(rangement.has("soley-save-v5"), "les sauvegardes des jeux ne sont pas touchées");
});

test("sans mention écrite dans la page, le script en pose une en bas, avec le lien vers confidentialite.html", () => {
  const r = jouer();
  assert.equal(r.body.enfants.length, 1);
  const slot = r.body.enfants[0];
  assert.equal(slot.className, "mg-mention-slot");
  assert.ok(!(slot.classes && slot.classes.has("mg-mention-slot--fixe")), "page qui défile : mention sous le contenu");
  const mention = slot.enfants[0];
  assert.equal(mention.className, "mg-mention");
  assert.equal(mention.enfants[0], `${MENTION} · `);
  assert.equal(mention.enfants[1].textContent, "Confidentialité");
  assert.equal(mention.enfants[1].href, "https://mathsgo.re/confidentialite.html");
  assert.equal(r.head.enfants.length, 1, "un seul <style>, injecté par le script");
  assert.equal(r.head.enfants[0].tagName, "style");
});

test("sur une page verrouillée en plein écran, la mention se pose en bas à droite", () => {
  const r = jouer({ overflow: "hidden" });
  assert.ok(r.body.enfants[0].classes.has("mg-mention-slot--fixe"));
});

test("si la page écrit déjà la mention dans son pied, le script n'ajoute rien", () => {
  const r = jouer({ mentionEcrite: true, cookies: "_ga=1" });
  assert.equal(r.body.enfants.length, 0);
  assert.equal(r.head.enfants.length, 0);
  assert.ok(r.ecritures.length > 0, "mais il efface quand même les anciens témoins");
});

test("le script ne charge rien et ne contacte personne", () => {
  assert.doesNotMatch(source, /https?:\/\//, "aucune adresse absolue");
  assert.doesNotMatch(source, /fetch|XMLHttpRequest|sendBeacon|navigator\.|createElement\("script"\)|setItem/, "il ne lit ni n'écrit rien d'autre");
});

// ---------------------------------------------------------------------------
// 5. La page Confidentialité dit la vérité d'après le lot 10b.
// ---------------------------------------------------------------------------
test("confidentialite.html annonce zéro cookie, zéro traceur tiers, et décrit ce qui reste sur l'appareil", () => {
  const page = readFileSync(join(racine, "confidentialite.html"), "utf8");
  assert.match(page, /n’utilise aucun cookie de mesure ni aucun traceur tiers/);
  assert.match(page, /gardent sur votre appareil, et seulement là, vos réglages et votre progression/);
  assert.match(page, /rien n’est transmis/);
  assert.match(page, /Dernière mise à jour : 22 novembre 2026/);
  // Lot « compteur de visites » (06/11/2026) : la page dit ce que reçoit le compteur, et ce qu'il ne garde pas.
  assert.match(page, /un simple compteur de visites, GoatCounter, sans cookie\./);
  assert.match(page, /sans ce qui suit le «&nbsp;\?&nbsp;»/);
  assert.match(page, /Il ne garde ni votre adresse IP ni aucun identifiant/);
  // Lot « confidentialite-compteur-eleves » (22/11/2026) : la page dit en clair quand le compteur se tait pour les élèves.
  assert.match(page, /Les élèves suivis ne sont pas comptés\. Le compteur se tait pour un élève connecté avec son code, et pour un élève venu de son espace élève/);
  assert.match(page, /le temps de l’onglet, une marque sans aucune donnée/);
  assert.match(page, /Il n’envoie jamais ce qu’il regarde pour décider/);
  assert.match(page, /Les pages du suivi de classe ne le chargent pas/);
  assert.match(page, /<code>mathsgo-compteur-ignorer<\/code>/, "la case durable du compteur est déclarée");
  // Lot « compteur-silence-suivi » (21/11/2026) : la marque d'onglet du compteur est déclarée, et dit ce qu'elle est.
  assert.match(page, /<li><code>mathsgo-compteur-taire<\/code> — stockage de session \(le temps d’un onglet\), valeur «&nbsp;1&nbsp;», aucune donnée, effacée à la fermeture de l’onglet&nbsp;: ne pas compter les élèves venus de leur espace\.<\/li>/);
  assert.doesNotMatch(page, /Mesure d’audience&nbsp;: aucune|pas de statistiques|aucune page n’appelle de serveur tiers/, "plus de phrase devenue fausse");
  assert.match(page, /mathsgo-suivi-identite/, "la clé d'identité de l'onglet (lot 8) est déclarée");
  assert.doesNotMatch(page, /<code>_ga<\/code>/, "plus de ligne _ga dans le tableau");
  assert.doesNotMatch(page, /mathsgo:consentement:v1/, "plus de clé de consentement dans le tableau");
  assert.doesNotMatch(page, /Après votre accord|Uniquement après accord|Refuser les statistiques/);
  // Retours de Gwenaël du 04/09 : une intro générale (pas seulement Défi tables), le suivi
  // présenté comme son usage et non comme un service ouvert, et plus de tableau technique.
  assert.match(page, /Plusieurs jeux et outils gardent sur votre appareil/);
  assert.match(page, /Ce n’est pas un service ouvert/);
  assert.doesNotMatch(page, /<table class="privacy-table">/, "le tableau technique a laissé place à une liste en français");
  assert.match(page, /<details class="legal-details">[\s\S]*soley-save-v5[\s\S]*mathsgo-suivi-identite[\s\S]*<\/details>/, "les clés exactes restent dans le repliable");
  assert.doesNotMatch(page, /Un professeur peut ouvrir/);
  assert.match(page, /Google Analytics, proposé avec votre accord jusqu’au 4 septembre 2026, a été retiré/, "l'historique est dit franchement");
  // Retours de Gwenaël du 03/10 : page raccourcie (plus de doublon « En bref » / suivi, plus de
  // « tableau ci-dessus » qui n'existait pas, plus de « retirer votre consentement » sans consentement).
  assert.doesNotMatch(page, /tableau ci-dessus|retirer votre consentement/);
  // 08/11/2026 : l'espace élève est annoncé (bouton « Mon espace » de l'accueil) sans lister
  // ici ce qui est enregistré : le détail est donné aux élèves et aux familles sur la page Infos
  // de leur espace (_serveur/public/infos.php).
  assert.match(page, /<h2 id="suivi">L’espace élève<\/h2>/);
  assert.match(page, /expliqué aux élèves et à leurs familles sur la page Infos de leur espace/);
  assert.doesNotMatch(page, /initiale du nom|nombre de réussites|date de la dernière activité/, "la liste des données reste sur la page Infos de l'espace");
});
