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
const PAGES_AVEC_MENTION = 158;
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
// 2. Les pages chargent le script commun, une fois, et lui seul.
// ---------------------------------------------------------------------------
test("chaque page qui portait la bannière charge maintenant mention-confidentialite.js, une seule fois", () => {
  let chargeuses = 0;
  for (const chemin of pages) {
    const page = readFileSync(chemin, "utf8");
    const balises = page.match(/<script\b[^>]*mention-confidentialite\.js[^>]*>/g) ?? [];
    assert.ok(balises.length <= 1, `${rel(chemin)} charge ${balises.length} fois le script`);
    if (balises.length === 1) {
      chargeuses += 1;
      assert.match(balises[0], /^<script defer src="(?:\.\.\/)*assets\/js\/mention-confidentialite\.js">$/,
        `${rel(chemin)} : balise inattendue ${balises[0]}`);
    }
  }
  // 153 pages au lot 10b : exactement celles qui chargeaient l'ancienne bannière.
  // Une page nouvelle qui veut la mention charge le script, et ce nombre suit.
  assert.equal(chargeuses, PAGES_AVEC_MENTION,
    `${chargeuses} pages chargent le script (${PAGES_AVEC_MENTION} attendues) : mets à jour PAGES_AVEC_MENTION si c'est voulu`);
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
  // 26 au lot 10b ; ÉquaSplat pose l'attribut en JavaScript, en mode réception seulement.
  assert.ok(mentions >= 26, `${mentions} mentions écrites seulement`);
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
  assert.match(page, /Dernière mise à jour : 4 septembre 2026/);
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
  assert.match(page, /Cette mesure a été retirée/, "l'historique est dit franchement");
});
