import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");

// LOT 10 — scripts tiers du site (constat C-2 du plan de correction du 02/09/2026).
//
// Le site range les codes et les prénoms de Défi tables dans le stockage local du
// navigateur. Ce stockage appartient à l'origine mathsgo.re : N'IMPORTE QUEL script
// chargé par une page du site peut le lire, y compris un script venu d'ailleurs.
// Jusqu'au 04/09/2026, 21 pages chargeaient des bibliothèques depuis cdn.tailwindcss.com,
// unpkg.com (« lucide@latest », version non épinglée : le fichier pouvait changer sans
// prévenir), cdnjs, jsdelivr et geogebra.org, sans aucun sceau d'intégrité.
//
// Depuis le lot 10, toutes ces bibliothèques vivent dans assets/vendor/ et sont servies
// par mathsgo.re. Ces tests interdisent le retour en arrière.
//
// Si un jour une bibliothèque doit vraiment être chargée d'ailleurs, elle doit porter
// un attribut integrity= (le sceau qui fait refuser au navigateur un fichier modifié).

// ---------------------------------------------------------------------------
// Parcours des fichiers du site publié.
// Le workflow de publication assemble le site avec « rsync --exclude '.*' --exclude '_*' » :
// tout ce qui commence par un point ou un souligné n'est pas publié.
// ---------------------------------------------------------------------------
function fichiersDuSitePublie(extensions) {
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

const pagesDuSite = fichiersDuSitePublie([".html"]);

test("le site publié compte bien des pages à examiner", () => {
  assert.ok(pagesDuSite.length > 100,
    `seulement ${pagesDuSite.length} pages trouvées : le parcours des dossiers est cassé`);
});

// ---------------------------------------------------------------------------
// 1. LE BALAYAGE : aucune page ne charge un script d'un autre domaine sans sceau.
// ---------------------------------------------------------------------------
test("aucune page du site ne charge un script venu d'ailleurs sans sceau integrity=", () => {
  const fautives = [];
  for (const chemin of pagesDuSite) {
    const page = readFileSync(chemin, "utf8");
    for (const balise of page.match(/<script\b[^>]*>/gi) ?? []) {
      if (!/\bsrc\s*=\s*["']https?:\/\//i.test(balise)) continue;
      if (/\bintegrity\s*=\s*["']sha(256|384|512)-/i.test(balise)) continue;
      fautives.push(`${relative(racine, chemin).split(sep).join("/")} → ${balise.trim()}`);
    }
  }
  assert.deepEqual(fautives, [],
    "ces pages chargent un script d'un autre domaine sans sceau : mets une copie dans "
      + "assets/vendor/ (comme le lot 10), ou ajoute un attribut integrity=\"sha384-…\" "
      + "et crossorigin=\"anonymous\" :\n  " + fautives.join("\n  "));
});

// Le test ci-dessus ne lit que les balises <script src=…> écrites dans le HTML.
// Une page peut aussi fabriquer sa balise en JavaScript : c'est ce que faisaient les
// deux « boîtes à bonbons », en passant une adresse unpkg à leur fonction loadScript().
// Invisible pour une recherche de balises, mais le script s'exécutait bel et bien sur
// l'origine mathsgo.re. Ce second balayage cherche donc l'ADRESSE, où qu'elle soit
// écrite — balise, chaîne de caractères, commentaire — dans les pages ET dans les
// fichiers JavaScript du site.
//
// Angle mort du lot 10 repéré par Claude Code en relisant la PR #637, bouché au lot 10c.
// Google Tag Manager et Google Analytics ajoutés au lot 10b : c'était le dernier
// script tiers que le site pouvait encore charger (par JavaScript, après la bannière).
const HÔTES_INTERDITS = [
  /(^|\/\/)unpkg\.com\//,
  /cdnjs\.cloudflare\.com\//,
  /jsdelivr\.net\//,
  /cdn\.tailwindcss\.com/,
  /geogebra\.org\//,
  /esm\.sh\//,
  /skypack\.dev\//,
  /googletagmanager\.com/,
  /google-analytics\.com/,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/,
];

// Les fichiers du serveur de suivi : ses pages tournent avec la session du
// professeur, et son JavaScript manipule les codes et les prénoms. Le garde-fou
// doit y être au moins aussi strict que sur le site (angle mort du lot 10c
// signalé par Claude Code : seules les balises <script src> y étaient lues).
function fichiersDuServeur() {
  const trouves = [];
  (function parcourir(dossier) {
    for (const nom of readdirSync(dossier)) {
      if (nom === "node_modules") continue;
      const chemin = join(dossier, nom);
      if (statSync(chemin).isDirectory()) parcourir(chemin);
      else if (/\.(php|html|js|mjs|css)$/i.test(nom)) trouves.push(chemin);
    }
  })(join(racine, "_serveur", "public"));
  return trouves.sort();
}

const fichiersAExaminer = [
  ...pagesDuSite,
  ...fichiersDuSitePublie([".js", ".mjs", ".cjs", ".css"]),
  ...fichiersDuServeur(),
  // assets/vendor/ contient les bibliothèques elles-mêmes : leurs propres commentaires
  // peuvent citer une adresse. Elles sont scellées par leur empreinte, plus bas.
].filter((chemin) => !chemin.includes(`${sep}vendor${sep}`));

test("aucune adresse de CDN tiers ou de mesure d'audience n'est écrite nulle part (site et serveur)", () => {
  const fautives = [];
  for (const chemin of fichiersAExaminer) {
    const texte = readFileSync(chemin, "utf8");
    for (const url of texte.match(/https?:\/\/[^\s"'`)<>]+/g) ?? []) {
      if (HÔTES_INTERDITS.some((h) => h.test(url))) {
        fautives.push(`${relative(racine, chemin).split(sep).join("/")} → ${url}`);
      }
    }
  }
  assert.deepEqual(fautives, [],
    "ces fichiers citent encore l'adresse d'un CDN tiers ; même chargée par du "
      + "JavaScript, une bibliothèque venue d'ailleurs s'exécute sur l'origine "
      + "mathsgo.re et lit le même stockage local :\n  " + fautives.join("\n  "));
});

// ---------------------------------------------------------------------------
// LA RÈGLE (lot 10b) : la liste ci-dessus est une liste NOIRE, elle ne connaît
// que les hôtes qu'on lui a appris. Un loadScript() vers un CDN inconnu ajouté
// demain ne déclencherait rien. D'où cette LISTE BLANCHE : partout où une
// adresse absolue sert à CHARGER quelque chose qui s'exécute ou s'applique à la
// page — script, module, worker, feuille de style, police —, son hôte doit être
// mathsgo.re. Pas d'exception aujourd'hui, et c'est le mieux : en ajouter une
// se fait ici, dans ORIGINES_AUTORISEES, et se dit dans la notice du lot.
//
// Les simples liens (href d'un <a>, canonical, xmlns d'un SVG, adresses citées
// dans un texte) ne chargent rien : ils ne sont pas concernés.
// ---------------------------------------------------------------------------
const ORIGINES_AUTORISEES = ["mathsgo.re", "suivi.mathsgo.re"];

const CONTEXTES_DE_CHARGEMENT = [
  // HTML
  /<script\b[^>]*\bsrc\s*=\s*["']?(https?:\/\/[^"'\s>]+)/gi,
  /<link\b[^>]*\brel\s*=\s*["'][^"']*(?:stylesheet|preload|modulepreload|preconnect|dns-prefetch|prefetch|manifest|icon)[^"']*["'][^>]*\bhref\s*=\s*["']?(https?:\/\/[^"'\s>]+)/gi,
  /<link\b[^>]*\bhref\s*=\s*["']?(https?:\/\/[^"'\s>]+)["']?[^>]*\brel\s*=\s*["'][^"']*(?:stylesheet|preload|modulepreload|preconnect|dns-prefetch|prefetch|manifest|icon)/gi,
  /<(?:iframe|embed|object)\b[^>]*\b(?:src|data)\s*=\s*["']?(https?:\/\/[^"'\s>]+)/gi,
  // JavaScript : balise fabriquée, import dynamique ou statique, worker, script chargé par une fonction maison
  /\.src\s*=\s*["'`](https?:\/\/[^"'`]+)/g,
  /\bimport\s*\(\s*["'`](https?:\/\/[^"'`]+)/g,
  /\bfrom\s+["'](https?:\/\/[^"']+)/g,
  /\bimportScripts\s*\(\s*["'`](https?:\/\/[^"'`]+)/g,
  /\bnew\s+(?:Shared)?Worker\s*\(\s*["'`](https?:\/\/[^"'`]+)/g,
  /\bload(?:Script|Style|Css|Font)\w*\s*\(\s*["'`](https?:\/\/[^"'`]+)/gi,
  // CSS : @import et url() vers une police ou une feuille
  /@import\s+(?:url\()?\s*["']?(https?:\/\/[^"')\s]+)/gi,
  /\burl\(\s*["']?(https?:\/\/[^"')\s]+\.(?:css|js|mjs|woff2?|ttf|otf|eot)(?:[?#][^"')\s]*)?)/gi,
  // Toute chaîne qui désigne un fichier exécutable ou une police, quel que soit le contexte
  /["'`](https?:\/\/[^"'`\s]+\.(?:js|mjs|cjs|css|woff2?|ttf|otf)(?:[?#][^"'`\s]*)?)["'`]/gi,
];

function hoteAutorise(url) {
  try {
    return ORIGINES_AUTORISEES.includes(new URL(url).hostname);
  } catch (_erreur) {
    return false;
  }
}

test("tout ce qu'une page charge (script, module, worker, feuille, police) vient de mathsgo.re — liste blanche", () => {
  const fautives = [];
  for (const chemin of fichiersAExaminer) {
    const texte = readFileSync(chemin, "utf8");
    for (const motif of CONTEXTES_DE_CHARGEMENT) {
      motif.lastIndex = 0;
      for (const m of texte.matchAll(motif)) {
        const url = m[1];
        if (!hoteAutorise(url)) {
          fautives.push(`${relative(racine, chemin).split(sep).join("/")} → ${url}`);
        }
      }
    }
  }
  assert.deepEqual([...new Set(fautives)], [],
    "ces fichiers chargent quelque chose depuis un autre domaine que mathsgo.re. "
      + "Copie-le dans assets/vendor/ (voir LISEZMOI.md) ; si c'est vraiment impossible, "
      + "ajoute l'origine à ORIGINES_AUTORISEES et dis-le dans la notice du lot :\n  "
      + [...new Set(fautives)].join("\n  "));
});

test("la liste blanche voit bien une adresse fabriquée en JavaScript ou cachée dans du CSS", () => {
  // Les adresses des pièges sont assemblées en deux morceaux : ce fichier est lui-même
  // dans le site publié, et les balayages ci-dessus le lisent aussi.
  const h = (hote, chemin) => "https:" + "//" + hote + chemin;
  const pieges = [
    `const s = document.createElement("script"); s.src = "${h("cdn.autre-chose.io", "/lib.min.js")}";`,
    `await loadScript('${h("unpkg.com", "/three@0.160.0/build/three.min.js")}')`,
    `script.src = "${h("www.googletagmanager.com", "/gtag/js?id=")}" + id;`,
    `import("${h("esm.sh", "/lodash")}")`,
    `@import url("${h("fonts.googleapis.com", "/css2?family=Fredoka")}");`,
    `<link href="${h("fonts.googleapis.com", "/css2?family=Nunito")}" rel="stylesheet">`,
    "new Worker(`" + h("exemple.org", "/w.js") + "`)",
    `const url = "${h("exemple.org", "/dossier/police.woff2")}";`,
  ];
  for (const piege of pieges) {
    const vus = CONTEXTES_DE_CHARGEMENT.some((motif) => { motif.lastIndex = 0; return [...piege.matchAll(motif)].some((m) => !hoteAutorise(m[1])); });
    assert.ok(vus, `le piège n'est pas vu : ${piege}`);
  }
  for (const innocent of [
    `<a href="${h("www.cnil.fr", "/fr/plaintes")}">CNIL</a>`,
    '<svg xmlns="http:' + '//www.w3.org/2000/svg">',
    `<link rel="canonical" href="${h("mathsgo.re", "/outils/")}">`,
    `const s = document.createElement("script"); s.src = "${h("mathsgo.re", "/assets/js/x.js")}";`,
  ]) {
    const vus = CONTEXTES_DE_CHARGEMENT.some((motif) => { motif.lastIndex = 0; return [...innocent.matchAll(motif)].some((m) => !hoteAutorise(m[1])); });
    assert.ok(!vus, `fausse alerte sur : ${innocent}`);
  }
});

// ---------------------------------------------------------------------------
// 2. LE CLIQUET : la liste des domaines tiers encore utilisés par des FEUILLES DE STYLE.
//    Une feuille de style ne peut pas lire le stockage local, mais chaque page ouverte
//    fait connaître l'adresse de connexion de l'élève au domaine qui la sert.
//    Lot 10 : ["fonts.googleapis.com"] (36 pages). Lot 10b : VIDE, les polices
//    Fredoka, Nunito, Caveat et Montserrat vivent dans assets/vendor/polices/.
// ---------------------------------------------------------------------------
const DOMAINES_STYLE_TOLERES = [];

test("aucun domaine tiers ne sert de feuille de style au site", () => {
  const domaines = new Set();
  for (const chemin of pagesDuSite) {
    const page = readFileSync(chemin, "utf8");
    for (const balise of page.match(/<link\b[^>]*>/gi) ?? []) {
      if (!/\brel\s*=\s*["'][^"']*stylesheet/i.test(balise)) continue;
      const url = balise.match(/\bhref\s*=\s*["'](https?:\/\/[^"']+)["']/i);
      if (url) domaines.add(new URL(url[1]).host);
    }
  }
  assert.deepEqual([...domaines].sort(), [...DOMAINES_STYLE_TOLERES].sort(),
    "un domaine tiers sert une feuille de style au site ; depuis le lot 10b il ne doit "
      + "plus y en avoir aucun (polices : assets/vendor/polices/)");
});

// ---------------------------------------------------------------------------
// 3. LES COPIES LOCALES : chaque fichier de assets/vendor/ est scellé par son empreinte.
//    C'est ce que l'attribut integrity= apportait, appliqué ici à nos propres copies :
//    un fichier remplacé ou abîmé fait passer ce test au rouge.
//    Pour mettre une bibliothèque à jour : remplace le fichier, recalcule l'empreinte
//    (sha256sum), corrige la ligne ci-dessous, et dis-le dans la notice du lot.
//    polices/polices.css est le seul fichier de vendor/ écrit à la main : scellé lui
//    aussi, un @import ou une @font-face vers un autre domaine y ferait passer ce
//    test au rouge.
// ---------------------------------------------------------------------------
const EMPREINTES = [
  ["gsap-3.12.2/gsap.min.js", "efc85c7eb141819717cda0033484a84b1c890d13b02e355a2fec79d424b20e7a"],
  ["katex-0.16.9/katex.min.css", "505d5f829022bb7b4f24dfee0aa1141cd7bba67afe411d1240335f820960b5c3"],
  ["katex-0.16.9/katex.min.js", "dc84b296ec3e884de093158f760fd9d45b6c7abe58b5381557f4e138f46a58ae"],
  ["pdfjs-3.4.120/pdf.min.js", "519415484a0c6c9f36ff7b858ede2660e4d55472089ad929eeedcbe8b307ebf6"],
  ["pdfjs-3.4.120/pdf.worker.min.js", "e6a7f30b71ca739ee2738c2ada7e120390b3c6faa3f3d4aa172bb6ece586eab1"],
  ["polices/caveat-latin-ext-wght-normal.woff2", "f626b95c1efa95cf6b7c9b043d3bbe8862b6abbe5f55a082102f33f7de2fd4f9"],
  ["polices/caveat-latin-wght-normal.woff2", "891951df5e8b5b0f0bc760d31375405e795c666b5add70437de12d4a6482b33f"],
  ["polices/fredoka-latin-ext-wght-normal.woff2", "18a1723c878c0d8acc2e45a108fd62fbb976e408337804afa2908982fac13e2a"],
  ["polices/fredoka-latin-wght-normal.woff2", "99d6c78e043710d4f83ed90716779798b7b04eb690f73e0ad0e8f32d1f0e98c2"],
  ["polices/montserrat-latin-ext-wght-normal.woff2", "54d9a78b7ff60b689ad9f3017ffac8547b5d871afec733f6c1c3ae36577ee504"],
  ["polices/montserrat-latin-wght-normal.woff2", "06b16db7a969135d48d38c49183be7fb88d4452e2a3011957c7851941f4e4879"],
  ["polices/nunito-latin-ext-wght-normal.woff2", "2c8d792869818ecb253a46bc3c63c7013df7aac2f69291c3c85e5cdc94160960"],
  ["polices/nunito-latin-wght-normal.woff2", "ba344451eab25b217a165363b1982048a5e5830a0daf36577973955a04cac793"],
  ["polices/polices.css", "fa54e5292c15b1482b47c707aedc3baecbc8c64b4f20ad580b34483aeba55c64"],
  ["tailwind/tailwind-outils.css", "f683657e968f540d1262f36daff4f8f627d9fabaaff4ec0a34c591093931b675"],
  ["three-0.128.0/OrbitControls.js", "02bb4ade710f3e607329e37a21f098bc3ac70eb6e33daf8a65e79f4db785e7b2"],
  ["three-0.128.0/three.min.js", "9274bbcec8d96168626c732b5d31c775aa8cfb7eaa0599bec0c175908a2c1ce2"],
];

test("les copies locales des bibliothèques ont l'empreinte attendue", () => {
  for (const [nom, empreinte] of EMPREINTES) {
    const contenu = readFileSync(join(racine, "assets", "vendor", nom));
    const obtenue = createHash("sha256").update(contenu).digest("hex");
    assert.equal(obtenue, empreinte,
      `assets/vendor/${nom} n'est plus le fichier attendu (${contenu.length} octets)`);
  }
});

// ---------------------------------------------------------------------------
// 3b. LES POLICES DU SITE (lot 10b) : Fredoka, Nunito, Caveat et Montserrat étaient
//     demandées à fonts.googleapis.com par 36 pages. Elles vivent maintenant dans
//     assets/vendor/polices/, déclarées par une seule feuille que ces pages chargent.
// ---------------------------------------------------------------------------
const PAGES_AVEC_POLICES = 36;

test("les pages qui utilisent une police du site la prennent dans assets/vendor/polices/", () => {
  const css = readFileSync(join(racine, "assets/vendor/polices/polices.css"), "utf8");
  for (const famille of ["Fredoka", "Nunito", "Caveat", "Montserrat"]) {
    assert.ok(css.includes(`font-family: "${famille}";`), `polices.css ne déclare pas ${famille}`);
  }
  for (const fichier of css.match(/url\(\.\/([^)]+)\)/g).map((u) => u.slice(6, -1))) {
    assert.ok(existsSync(join(racine, "assets/vendor/polices", fichier)), `polices.css cite ${fichier}, qui n'existe pas`);
  }
  let chargeuses = 0;
  for (const chemin of pagesDuSite) {
    const page = readFileSync(chemin, "utf8");
    const lien = (page.match(/<link rel="stylesheet" href="(?:\.\.\/)*assets\/vendor\/polices\/polices\.css">/g) ?? []).length;
    assert.ok(lien <= 1, `${relative(racine, chemin)} charge ${lien} fois la feuille des polices`);
    chargeuses += lien;
    // Une page qui nomme une de ces polices dans ses styles doit charger la feuille,
    // sinon elle retombe en silence sur la police de secours.
    const styles = (page.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) ?? []).join("\n");
    const utilise = /font-family\s*:[^;}]*\b(Fredoka|Nunito|Caveat|Montserrat)\b/.test(styles);
    if (utilise && lien === 0) {
      assert.fail(`${relative(racine, chemin).split(sep).join("/")} utilise une police du site sans charger assets/vendor/polices/polices.css`);
    }
  }
  assert.equal(chargeuses, PAGES_AVEC_POLICES,
    `${chargeuses} pages chargent polices.css (${PAGES_AVEC_POLICES} attendues) : mets à jour PAGES_AVEC_POLICES si c'est voulu`);
});

test("les polices de KaTeX accompagnent sa feuille de style", () => {
  const polices = readdirSync(join(racine, "assets", "vendor", "katex-0.16.9", "fonts"));
  assert.ok(polices.length >= 20, `${polices.length} polices seulement dans katex-0.16.9/fonts/`);
  assert.ok(polices.every((n) => n.endsWith(".woff2")),
    "seules les polices .woff2 sont servies (tous les navigateurs depuis 2015 les lisent)");
  const css = readFileSync(join(racine, "assets", "vendor", "katex-0.16.9", "katex.min.css"), "utf8");
  assert.match(css, /fonts\/KaTeX_Main-Regular\.woff2/,
    "la feuille de KaTeX doit chercher ses polices dans son propre dossier fonts/");
});

// ---------------------------------------------------------------------------
// 4. TAILWIND : les 16 pages servent la feuille construite du dépôt, plus le compilateur
//    du CDN. La feuille est construite à la main (voir assets/vendor/LISEZMOI.md) :
//    tout ajout de classe Tailwind dans ces pages demande de la reconstruire ET de
//    bumper le ?v= partout, comme pour le catalogue.
// ---------------------------------------------------------------------------
const VERSION_TAILWIND = "scripts-tiers-20260904-1";
const PAGES_TAILWIND = [
  "outils/conversions/conversions_unites_aires.html",
  "outils/conversions/conversions_unites_volumes.html",
  "outils/fractions/disques_fractions.html",
  "outils/nombres_relatifs/nombres_relatifs_somme_difference.html",
  "outils/nombres_relatifs/nombres_relatifs_somme_differenceB.html",
  "outils/nombres_relatifs/nombres_relatifs_somme_differenceBClaire.html",
  "outils/nombres_relatifs/nombres_relatifs_somme_differenceC.html",
  "outils/nombres_relatifs/nombres_relatifs_somme_differenceD.html",
  "outils/plateaux_manipulation/cubes_construction.html",
  "outils/plateaux_manipulation/maitre_du_temps.html",
  "outils/plateaux_manipulation/moyennes.html",
  "outils/plateaux_manipulation/numeration_decimale.html",
  "outils/plateaux_manipulation/ratio.html",
  "outils/plateaux_manipulation/stats_city.html",
  "outils/tuiles_algebriques/tuiles_algebriques.html",
  "outils/tuiles_algebriques/tuiles_algebriques_mode_equation.html",
];

test("les 16 pages Tailwind servent la feuille du dépôt, avec la même version", () => {
  for (const relatif of PAGES_TAILWIND) {
    const page = readFileSync(join(racine, relatif), "utf8");
    const attendu = `<link rel="stylesheet" href="../../assets/vendor/tailwind/tailwind-outils.css?v=${VERSION_TAILWIND}">`;
    assert.equal(page.split(attendu).length - 1, 1,
      `${relatif} doit charger exactement une fois ${attendu}`);
    assert.ok(!page.includes("cdn.tailwindcss.com"),
      `${relatif} charge encore le compilateur Tailwind depuis le CDN`);
    // La feuille doit rester la DERNIÈRE de <head> : le CDN ajoutait ses styles en fin
    // de <head>, donc après le <style> de la page. Déplacer le lien plus haut changerait
    // qui gagne en cas d'égalité, et donc l'apparence de la page.
    const tete = page.slice(0, page.indexOf("</head>"));
    assert.ok(tete.lastIndexOf(attendu) > tete.lastIndexOf("</style>"),
      `${relatif} : le lien Tailwind doit être placé après le dernier <style> de <head>`);
  }
});

test("la feuille Tailwind construite contient bien les classes des pages", () => {
  const css = readFileSync(join(racine, "assets/vendor/tailwind/tailwind-outils.css"), "utf8");
  assert.ok(css.length > 20000, "la feuille construite est anormalement courte");
  for (const temoin of [
    ".flex{display:flex}",                                   // utilitaire de base
    "*,:after,:before{box-sizing:border-box",                // le « preflight » de Tailwind
    "w-\\[min\\(92vw\\2c 720px\\)\\]{width:min(92vw,720px)}", // valeur sur mesure d'une page
    "w-\\[min\\(92vw\\2c 820px\\)\\]{width:min(92vw,820px)}",
  ]) {
    assert.ok(css.includes(temoin),
      `la feuille Tailwind ne contient pas « ${temoin} » : reconstruis-la (assets/vendor/LISEZMOI.md)`);
  }
});

// ---------------------------------------------------------------------------
// 5. LUCIDE : les icônes sont écrites dans les pages, plus chargées depuis unpkg.
// ---------------------------------------------------------------------------
test("les icônes des plateaux sont écrites dans la page, pas chargées depuis unpkg", () => {
  for (const [relatif, minimum] of [
    ["outils/plateaux_manipulation/index.html", 14],
    ["outils/plateaux_manipulation/cubes_construction.html", 6],
  ]) {
    const page = readFileSync(join(racine, relatif), "utf8");
    assert.ok(!page.includes("unpkg.com"), `${relatif} charge encore lucide depuis unpkg`);
    assert.ok(!page.includes("data-lucide"),
      `${relatif} contient encore un <i data-lucide=…> que plus aucun script ne remplace`);
    assert.ok(!page.includes("lucide.createIcons"),
      `${relatif} appelle encore lucide.createIcons(), qui n'existe plus`);
    const icones = (page.match(/class="lucide lucide-[a-z0-9-]+/g) ?? []).length;
    assert.ok(icones >= minimum,
      `${relatif} : ${icones} icônes écrites dans la page, ${minimum} attendues au moins`);
  }
});

// ---------------------------------------------------------------------------
// 6. LES PAGES SORTIES DU SITE PUBLIÉ (lot 10, décision de Gwenaël du 04/09/2026).
//    Elles vivent maintenant dans _sources/, que la publication n'assemble pas
//    (« rsync --exclude '_*' »). Elles restent dans le dépôt, consultables et
//    reprenables, mais ne sont plus en ligne — et leurs scripts venus d'ailleurs
//    (GeoGebra, three@0.160.0) ne s'exécutent donc plus sur l'origine mathsgo.re.
// ---------------------------------------------------------------------------
test("les pages mises de côté (GeoGebra, prisme, boîtes à bonbons) ne sont plus publiées", () => {
  for (const parti of [
    "claire",
    "outils/plateaux_manipulation/prisme345_h6_patron.html",
    "outils/plateaux_manipulation/prisme345_h6_patron (1).html",
    "outils/plateaux_manipulation/boite_bonbons.html",
    "outils/plateaux_manipulation/boite_bonbons_3d_toutes_boites.html",
  ]) {
    assert.ok(!existsSync(join(racine, parti)),
      `${parti} est revenu dans le site publié : sa place est dans _sources/`);
  }
  for (const garde of [
    "_sources/claire/geometrie.html",
    "_sources/claire/index.html",
    "_sources/plateaux-manipulation/prisme345_h6_patron.html",
    "_sources/plateaux-manipulation/boite_bonbons.html",
    "_sources/plateaux-manipulation/boite_bonbons_3d_toutes_boites.html",
  ]) {
    assert.ok(existsSync(join(racine, garde)),
      `${garde} a disparu : ces pages sont gardées, pas supprimées`);
  }
  const catalogue = readFileSync(join(racine, "assets/js/catalogue-refonte-data.js"), "utf8");
  for (const nom of ["prisme345_h6_patron", "boite_bonbons"]) {
    assert.ok(!catalogue.includes(nom),
      `le catalogue déclare encore ${nom}, qui n'est plus publié`);
  }
});
