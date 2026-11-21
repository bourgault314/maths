import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import { LIGNE_COMPTEUR, insererLigne, pagesDuPlanDuSite, porteLeCompteur } from "../scripts/injecter-compteur.mjs";

// Lot « compteur de visites » (06/11/2026). Gwenaël voulait savoir quelles
// pages du site sont visitées, sans cookie, sans bannière et sans rien qui
// permette de reconnaître un élève. Le compteur est assets/js/compteur.js,
// écrit pour le site (pas le script de GoatCounter) ; ces tests tiennent sa
// promesse, celle écrite dans confidentialite.html.

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const codeCompteur = readFileSync(join(racine, "assets/js/compteur.js"), "utf8");

// ---------------------------------------------------------------------------
// 1. Chaque page du plan du site porte le compteur, une fois, à la même version.
// ---------------------------------------------------------------------------
test("chaque page HTML du plan du site charge le compteur une fois, à la même version", () => {
  const pages = pagesDuPlanDuSite(racine);
  assert.ok(pages.length > 100, `seulement ${pages.length} pages dans le plan du site`);
  const fautives = [];
  for (const relatif of pages) {
    const chemin = join(racine, relatif);
    if (!existsSync(chemin)) continue; // seo-publication.test.mjs s'en charge
    const html = readFileSync(chemin, "utf8");
    const nombre = html.split(LIGNE_COMPTEUR).length - 1;
    const balises = (html.match(/<script\b[^>]*compteur\.js[^>]*>/gi) ?? []).length;
    if (nombre !== 1 || balises !== 1) fautives.push(`${relatif} (${balises} balise(s), ${nombre} à la bonne version)`);
  }
  assert.deepEqual(fautives, [],
    "ces pages du plan du site n'ont pas le compteur, ou pas à la bonne version : "
      + "lance node scripts/injecter-compteur.mjs --apply\n  " + fautives.join("\n  "));
});

test("le serveur de suivi ne charge pas le compteur et ne cite pas GoatCounter", () => {
  const fautifs = [];
  (function parcourir(dossier) {
    for (const nom of readdirSync(dossier)) {
      const chemin = join(dossier, nom);
      if (statSync(chemin).isDirectory()) parcourir(chemin);
      else if (/\.(php|html|js)$/i.test(nom)) {
        const texte = readFileSync(chemin, "utf8");
        if (/compteur\.js|goatcounter/i.test(texte)) fautifs.push(chemin.slice(racine.length + 1));
      }
    }
  })(join(racine, "_serveur", "public"));
  assert.deepEqual(fautifs, []);
});

test("la ligne se pose avant </head>, dans la fin de ligne du fichier, et une seule fois", () => {
  assert.equal(
    insererLigne("<head>\n<title>x</title>\n</head><body>"),
    `<head>\n<title>x</title>\n${LIGNE_COMPTEUR}\n</head><body>`,
  );
  assert.equal(
    insererLigne("<head>\r\n<title>x</title>\r\n</head>\r\n<body>"),
    `<head>\r\n<title>x</title>\r\n${LIGNE_COMPTEUR}\r\n</head>\r\n<body>`,
  );
  assert.equal(insererLigne("<p>fragment</p>"), null);
  assert.ok(porteLeCompteur(insererLigne("<head></head>")));
  assert.ok(!porteLeCompteur('<script src="/assets/js/autre.js"></script>'));
});

// ---------------------------------------------------------------------------
// 2. Ce qui part vraiment : on fait tourner compteur.js dans un faux navigateur.
// ---------------------------------------------------------------------------
function navigateur({
  adresse = "https://mathsgo.re/outils/splat_univers.html",
  provenance = "",
  titre = "Défi tables — Léa",
  cadre = false,
  robot = false,
  ignorer = false,
  stockageRefuse = false,
  codeOnglet = null,
  billet = null,
  vue = "",
  ongletRefuse = false,
  onglet: ongletPartage = null,
} = {}) {
  const url = new URL(adresse);
  const envoyes = [];
  const alertes = [];
  const ecouteurs = {};
  const accesStockage = [];
  const stock = new Map(ignorer ? [["mathsgo-compteur-ignorer", "1"]] : []);
  stock.set("mathsgo-suivi-code", "AB12CD");
  const localStorage = {
    getItem(cle) { accesStockage.push(["lire", cle]); if (stockageRefuse) throw new Error("refusé"); return stock.has(cle) ? stock.get(cle) : null; },
    setItem(cle, valeur) { accesStockage.push(["écrire", cle]); if (stockageRefuse) throw new Error("refusé"); stock.set(cle, String(valeur)); },
    removeItem(cle) { accesStockage.push(["effacer", cle]); stock.delete(cle); },
  };
  // La mémoire de l'onglet : là, et seulement là, les applis suivies rangent
  // le code de l'élève connecté (« mathsgo-suivi-code »).
  const accesOnglet = [];
  // « onglet » : la même mémoire d'une page à l'autre du MÊME onglet
  // (rechargement, page suivante, retour arrière).
  const onglet = ongletPartage ?? new Map();
  if (codeOnglet !== null) onglet.set("mathsgo-suivi-code", codeOnglet);
  const sessionStorage = {
    getItem(cle) { accesOnglet.push(["lire", cle]); if (ongletRefuse) throw new Error("refusé"); return onglet.has(cle) ? onglet.get(cle) : null; },
    setItem(cle, valeur) { accesOnglet.push(["écrire", cle]); if (ongletRefuse) throw new Error("refusé"); onglet.set(cle, String(valeur)); },
    removeItem(cle) { accesOnglet.push(["effacer", cle]); },
    clear() { accesOnglet.push(["vider", ""]); },
  };
  const fenetre = {
    location: { href: url.href, hostname: url.hostname, pathname: url.pathname, search: url.search, hash: url.hash },
    navigator: { webdriver: robot, sendBeacon(u) { envoyes.push(u); return true; } },
    screen: { width: 1366 },
    localStorage,
    sessionStorage,
    alert(message) { alertes.push(message); },
  };
  // Ce que le script du <head> d'une appli suivie pose avant ce fichier (defer).
  if (billet !== null) fenetre.MATHSGO_ENTREE = { billet, vue, ouvrir: "" };
  fenetre.top = cadre ? {} : fenetre;
  fenetre.self = fenetre;
  const document = {
    referrer: provenance,
    title: titre,
    visibilityState: "visible",
    addEventListener(type, fonction) { (ecouteurs[type] ??= []).push(fonction); },
  };
  const contexte = { window: fenetre, document, URL, Image: class { set src(u) { envoyes.push(u); } }, encodeURIComponent, decodeURIComponent, Math, String, Object };
  vm.runInNewContext(codeCompteur, contexte);
  const cliquer = (href, type = "click", button = 0) => {
    const lien = { getAttribute: () => href };
    for (const f of ecouteurs[type] ?? []) f({ type, button, target: { closest: () => lien } });
  };
  return { envoyes, alertes, accesStockage, accesOnglet, stock, onglet, cliquer };
}

const parametres = (u) => Object.fromEntries(new URL(u).searchParams);

test("une visite envoie le chemin seul, le site d'origine réduit à son nom et la largeur d'écran", () => {
  const { envoyes } = navigateur({
    adresse: "https://mathsgo.re/outils/splat_univers.html?eleve=1&parcours=m2e5&code=AB12CD#monde-3",
    provenance: "https://www.index-education.com/eleve.html?session=987654&identifiant=lea",
  });
  assert.equal(envoyes.length, 1);
  const envoi = envoyes[0];
  assert.ok(envoi.startsWith("https://mathsgo.goatcounter.com/count?"), envoi);
  const p = parametres(envoi);
  delete p.rnd;
  assert.deepEqual(p, { p: "/outils/splat_univers.html", r: "https://www.index-education.com", s: "1366" });
  for (const interdit of ["AB12CD", "parcours", "eleve", "monde-3", "session", "987654", "lea", "Léa", "L%C3%A9a", "Défi"]) {
    assert.ok(!envoi.includes(interdit), `« ${interdit} » est parti : ${envoi}`);
  }
});

test("/index.html et / comptent ensemble ; une page d'origine sur mathsgo.re n'est pas envoyée", () => {
  assert.equal(parametres(navigateur({ adresse: "https://mathsgo.re/outils/index.html" }).envoyes[0]).p, "/outils/");
  assert.equal(parametres(navigateur({ adresse: "https://mathsgo.re/" }).envoyes[0]).p, "/");
  const interne = navigateur({ provenance: "https://mathsgo.re/outils/splat_univers.html?code=AB12CD" }).envoyes[0];
  assert.equal(parametres(interne).r, undefined);
  assert.ok(!interne.includes("AB12CD"));
});

test("rien ne part en local, dans un cadre, pour un robot, ou chez l'auteur qui s'est retiré", () => {
  assert.deepEqual(navigateur({ adresse: "http://localhost:8000/outils/index.html" }).envoyes, []);
  assert.deepEqual(navigateur({ adresse: "https://suivi.mathsgo.re/eleve/" }).envoyes, []);
  assert.deepEqual(navigateur({ adresse: "https://bourgault314.github.io/maths/" }).envoyes, []);
  assert.deepEqual(navigateur({ cadre: true }).envoyes, []);
  assert.deepEqual(navigateur({ robot: true }).envoyes, []);
  assert.deepEqual(navigateur({ ignorer: true }).envoyes, []);
  assert.equal(navigateur({ stockageRefuse: true }).envoyes.length, 1, "stockage refusé : on compte quand même");
});

test("#ne-pas-me-compter range la case et ne compte pas ; #me-compter la retire", () => {
  const retrait = navigateur({ adresse: "https://mathsgo.re/#ne-pas-me-compter" });
  assert.deepEqual(retrait.envoyes, []);
  assert.equal(retrait.stock.get("mathsgo-compteur-ignorer"), "1");
  assert.equal(retrait.alertes.length, 1);
  const retour = navigateur({ adresse: "https://mathsgo.re/#me-compter", ignorer: true });
  assert.ok(!retour.stock.has("mathsgo-compteur-ignorer"));
  assert.equal(retour.envoyes.length, 1);
});

test("le compteur ne lit et n'écrit qu'une seule case du stockage : la sienne", () => {
  for (const essai of [navigateur(), navigateur({ adresse: "https://mathsgo.re/#ne-pas-me-compter" }), navigateur({ adresse: "https://mathsgo.re/#me-compter" })]) {
    for (const [, cle] of essai.accesStockage) assert.equal(cle, "mathsgo-compteur-ignorer");
  }
  const visite = navigateur();
  assert.ok(visite.accesStockage.every(([action]) => action === "lire"), "une visite ordinaire n'écrit rien");
});

// ---------------------------------------------------------------------------
// 3. Un élève connecté n'est pas compté (lot « petits correctifs de sécurité »,
//    11/11/2026, constat F07 de l'audit GPT : la règle du 30/08 — aucune
//    mesure d'audience dès qu'un élève est identifié — ne tenait plus pour le
//    compteur de novembre).
// ---------------------------------------------------------------------------
test("un élève connecté (son code dans l'onglet) : rien ne part, ni la visite ni une fiche PDF", () => {
  for (const code of ["AB2CD3", "ab2cd3", "AB2-CD3"]) {
    const eleve = navigateur({ adresse: "https://mathsgo.re/outils/calcul_mental/defi_tables.html", codeOnglet: code });
    assert.deepEqual(eleve.envoyes, [], `code « ${code} » dans l'onglet : la visite ne doit pas partir`);
    eleve.cliquer("https://mathsgo.re/outils/fiche.pdf");
    assert.deepEqual(eleve.envoyes, [], "ni le téléchargement d'une fiche");
  }
});

test("un élève qui arrive par un billet (avant l'échange) : rien ne part ; le professeur qui ouvre une fiche non plus", () => {
  assert.deepEqual(navigateur({ adresse: "https://mathsgo.re/outils/splat_univers.html", billet: "0123456789abcdef0123456789abcdef" }).envoyes, []);
  assert.deepEqual(navigateur({ adresse: "https://mathsgo.re/outils/calcul_mental/defi_tables.html", billet: "fedcba9876543210fedcba9876543210" }).envoyes, []);
});

test("un outil SPLAT! ouvert avec le billet dans l'adresse, sans MATHSGO_ENTREE, avant l'échange : rien ne part (relecture Codex D4)", () => {
  const billet = "0123456789abcdef0123456789abcdef";
  for (const adresse of [
    `https://mathsgo.re/outils/splat.html?eleve=1&parcours=m1e1#b=${billet}`,
    `https://mathsgo.re/outils/splat.html?eleve=1&parcours=m1e1#vue=x&b=${billet}`,
  ]) {
    const n = navigateur({ adresse });
    assert.deepEqual(n.envoyes, [], adresse);
    n.cliquer("https://mathsgo.re/outils/fiche.pdf");
    assert.deepEqual(n.envoyes, [], "ni une fiche PDF pendant l'échange");
  }
  // Une ancre ordinaire ou un autre nom finissant par b : on compte. (Un
  // « #b= » vide est un billet depuis le lot « compteur-silence-suivi » :
  // voir la partie 4.)
  for (const ancre of ["#monde-3", "#ab=12", "#enq-bonus"]) {
    assert.equal(navigateur({ adresse: `https://mathsgo.re/outils/splat.html${ancre}` }).envoyes.length, 1, ancre);
  }
});

test("cas témoins : un visiteur, un code mal formé, un billet vide ou un onglet illisible — la visite part, une fois", () => {
  const cas = [
    {},                                           // visiteur ordinaire
    { codeOnglet: "" },                           // case vide
    { codeOnglet: "AB2C" },                       // trop court
    { codeOnglet: "AB2CD1" },                     // « 1 » n'est pas dans l'alphabet des codes
    { codeOnglet: "OOOOOO" },                     // ni « O »
    { billet: "" },                               // appli sans billet : MATHSGO_ENTREE.billet vide
    { ongletRefuse: true },                       // mémoire de l'onglet refusée
  ];
  for (const options of cas) {
    assert.equal(navigateur(options).envoyes.length, 1, `devrait compter : ${JSON.stringify(options)}`);
  }
});

test("le code lu dans l'onglet ne sort jamais, et l'onglet n'est jamais modifié", () => {
  const eleve = navigateur({ codeOnglet: "AB2CD3" });
  assert.ok(eleve.accesOnglet.every(([action, cle]) => action === "lire" && ["mathsgo-suivi-code", "mathsgo-compteur-taire"].includes(cle)),
    `seules la case du code et la marque du compteur sont LUES : ${JSON.stringify(eleve.accesOnglet)}`);
  // Un code invalide laisse compter : la visite part, sans le code.
  const visiteur = navigateur({ codeOnglet: "AB2CD1" });
  assert.equal(visiteur.envoyes.length, 1);
  assert.ok(!visiteur.envoyes[0].includes("AB2CD1"));
});

test("les cinq applis suivies posent MATHSGO_ENTREE dans le <head>, avant le compteur chargé en defer", () => {
  const applis = [
    "outils/calcul_mental/defi_tables.html",
    "outils/calcul_mental/defi_calcul_modules.html",
    "outils/calcul_mental/flash_anzan.html",
    "outils/calcul_mental/coffres_magiques_solo.html",
    "outils/splat_univers.html",
  ];
  for (const relatif of applis) {
    const html = readFileSync(join(racine, relatif), "utf8");
    const pose = html.indexOf("window.MATHSGO_ENTREE = entree;");
    const balise = html.search(/<script\b[^>]*compteur\.js[^>]*>/i);
    assert.ok(pose > 0, `${relatif} : MATHSGO_ENTREE n'est plus posé`);
    assert.ok(html.slice(0, pose).includes("<head") && !html.slice(0, pose).includes("</head>"), `${relatif} : MATHSGO_ENTREE doit être posé dans le <head>`);
    assert.ok(balise > 0, `${relatif} : le compteur manque`);
    assert.match(html.slice(balise, html.indexOf(">", balise) + 1), /\bdefer\b/, `${relatif} : le compteur doit rester en defer`);
    assert.match(html, /cle === "b"\) entree\.billet = valeur/, `${relatif} : le billet doit être rangé dans entree.billet`);
  }
});

// ---------------------------------------------------------------------------
// 4. Le compteur se tait après un passage par le suivi de classe (lot
//    « compteur-silence-suivi », 21/11/2026, diagnostic GoatCounter du même
//    jour : quatre chemins par lesquels une visite venue du suivi partait
//    encore). Trois signes : la provenance suivi.mathsgo.re, un billet (même
//    vide), la marque d'onglet « mathsgo-compteur-taire ».
// ---------------------------------------------------------------------------
const SUIVI_MA_CLASSE = "https://suivi.mathsgo.re/prof/classe.php?id=3";
const SUIVI_ESPACE = "https://suivi.mathsgo.re/eleve/";
const DEFI_TABLES = "https://mathsgo.re/outils/calcul_mental/defi_tables.html";
const UN_BILLET = "0123456789abcdef0123456789abcdef";

function rienNePart(n, message) {
  assert.deepEqual(n.envoyes, [], message);
  n.cliquer("https://mathsgo.re/outils/fiche.pdf");
  assert.deepEqual(n.envoyes, [], `${message} — ni une fiche PDF`);
}

test("provenance suivi : une page ouverte depuis suivi.mathsgo.re ne compte pas, et pose la marque d'onglet", () => {
  for (const provenance of [SUIVI_MA_CLASSE, SUIVI_ESPACE, "https://suivi.mathsgo.re", "https://suivi.mathsgo.re/"]) {
    const n = navigateur({ adresse: DEFI_TABLES, provenance });
    rienNePart(n, `venu de ${provenance}`);
    assert.equal(n.onglet.get("mathsgo-compteur-taire"), "1", `marque posée (venu de ${provenance})`);
  }
  // Ni r=https://suivi.mathsgo.re, ni rien d'autre : l'envoi n'a pas lieu du tout.
  // Un AUTRE sous-domaine, ou http://, n'est pas le suivi : on compte.
  for (const provenance of ["https://www.mathsgo.re/outils/", "http://suivi.mathsgo.re/eleve/", "https://exemple.fr/?suivi.mathsgo.re"]) {
    assert.equal(navigateur({ adresse: DEFI_TABLES, provenance }).envoyes.length, 1, provenance);
  }
});

test("chemin 1 — Ma classe ouvre une fiche dans un onglet, puis le professeur recharge : rien ne part", () => {
  const onglet = new Map();
  // Arrivée : billet de fiche rangé par le <head>, adresse déjà nettoyée.
  rienNePart(navigateur({ adresse: DEFI_TABLES, provenance: SUIVI_MA_CLASSE, billet: UN_BILLET, vue: "fiche", onglet }), "arrivée depuis Ma classe");
  assert.equal(onglet.get("mathsgo-compteur-taire"), "1");
  // Rechargement : plus de billet (il a été effacé de l'adresse), la vue
  // professeur ne range aucun code ; la provenance reste celle du suivi.
  rienNePart(navigateur({ adresse: DEFI_TABLES, provenance: SUIVI_MA_CLASSE, billet: "", onglet }), "rechargement");
  // Et même si le navigateur ne redonnait pas la provenance : la marque suffit.
  rienNePart(navigateur({ adresse: DEFI_TABLES, billet: "", onglet }), "rechargement sans provenance");
});

test("chemin 2 — nouvel onglet depuis le suivi avec un billet vide, usé ou périmé : rien ne part", () => {
  // Billet vide : le <head> ne l'efface pas de l'adresse, MATHSGO_ENTREE.billet vaut "".
  for (const provenance of [SUIVI_ESPACE, ""]) {
    const onglet = new Map();
    rienNePart(navigateur({ adresse: `${DEFI_TABLES}#b=`, provenance, billet: "", onglet }), `#b= vide (provenance « ${provenance} »)`);
    assert.equal(onglet.get("mathsgo-compteur-taire"), "1");
    rienNePart(navigateur({ adresse: "https://mathsgo.re/outils/splat.html?eleve=1&parcours=m1e1#b=", provenance, onglet: new Map() }), "#b= vide sans MATHSGO_ENTREE");
    rienNePart(navigateur({ adresse: "https://mathsgo.re/outils/splat.html#vue=x&b=", provenance, onglet: new Map() }), "&b= vide");
  }
  // Billet usé ou périmé : il est rangé, l'échange échouera, aucun code n'arrivera.
  for (const usé of ["ffffffffffffffffffffffffffffffff", "a"]) {
    const onglet = new Map();
    rienNePart(navigateur({ adresse: DEFI_TABLES, provenance: SUIVI_ESPACE, billet: usé, onglet }), `billet « ${usé} »`);
    // Page suivante du même onglet, sans code : la marque tient.
    rienNePart(navigateur({ adresse: "https://mathsgo.re/outils/index.html", provenance: DEFI_TABLES, onglet }), "page suivante après l'échec");
  }
});

test("chemin 3 — billet refusé par le serveur, puis rechargement : rien ne part", () => {
  const onglet = new Map();
  // Provenance retirée exprès (lien en rel=noreferrer) : seul le billet parle.
  rienNePart(navigateur({ adresse: DEFI_TABLES, billet: UN_BILLET, onglet }), "arrivée avec le billet");
  assert.equal(onglet.get("mathsgo-compteur-taire"), "1");
  assert.ok(!onglet.has("mathsgo-suivi-code"), "refusé : aucun code dans l'onglet");
  // Rechargement : adresse nettoyée, billet vide, aucune provenance, aucun code.
  rienNePart(navigateur({ adresse: DEFI_TABLES, billet: "", onglet }), "rechargement après le refus");
});

test("chemin 4 — déconnexion puis retour arrière : rien ne part", () => {
  const onglet = new Map();
  rienNePart(navigateur({ adresse: DEFI_TABLES, provenance: SUIVI_ESPACE, billet: UN_BILLET, onglet }), "arrivée de l'élève");
  onglet.set("mathsgo-suivi-code", "AB2CD3"); // l'échange a réussi
  rienNePart(navigateur({ adresse: DEFI_TABLES, provenance: SUIVI_ESPACE, billet: "", onglet }), "élève connecté");
  // « Sortir » (eleve-retour-espace.js, ?sortie=1) vide TOUT l'onglet,
  // marque comprise, puis ouvre l'écran du code sur le suivi.
  onglet.clear();
  // Retour arrière : la page de l'appli ressort avec sa provenance d'origine.
  const retour = navigateur({ adresse: DEFI_TABLES, provenance: SUIVI_ESPACE, billet: "", onglet });
  rienNePart(retour, "retour arrière après la déconnexion");
  assert.equal(onglet.get("mathsgo-compteur-taire"), "1", "la provenance repose la marque");
});

test("marque d'onglet : elle tait le compteur sur les pages suivantes du même onglet, ne contient que « 1 », et ne passe pas à un autre onglet", () => {
  const onglet = new Map();
  navigateur({ adresse: DEFI_TABLES, provenance: SUIVI_ESPACE, onglet });
  assert.deepEqual([...onglet], [["mathsgo-compteur-taire", "1"]], "la seule case écrite, et sa seule valeur");
  for (const adresse of ["https://mathsgo.re/", "https://mathsgo.re/outils/index.html", "https://mathsgo.re/outils/splat_univers.html#monde-3"]) {
    rienNePart(navigateur({ adresse, provenance: "https://mathsgo.re/outils/", onglet }), `page suivante ${adresse}`);
  }
  // Une marque posée à la main (n'importe quelle autre valeur) ne compte pas.
  assert.equal(navigateur({ onglet: new Map([["mathsgo-compteur-taire", "oui"]]) }).envoyes.length, 1);
  // Un autre onglet (une autre mémoire) compte.
  assert.equal(navigateur({ onglet: new Map() }).envoyes.length, 1);
  // Mémoire de l'onglet refusée : le signe de la page suffit, sans erreur.
  assert.deepEqual(navigateur({ provenance: SUIVI_ESPACE, ongletRefuse: true }).envoyes, []);
  // Un visiteur ordinaire n'écrit rien dans l'onglet.
  const visiteur = navigateur({ provenance: "https://www.google.com/" });
  assert.ok(visiteur.accesOnglet.every(([action]) => action === "lire"), JSON.stringify(visiteur.accesOnglet));
  assert.equal(visiteur.onglet.size, 0);
});

test("témoin : un visiteur venu de Google, sans billet, EST compté (une fois, avec r=https://www.google.com)", () => {
  for (const adresse of [DEFI_TABLES, "https://mathsgo.re/", "https://mathsgo.re/outils/splat_univers.html"]) {
    const n = navigateur({ adresse, provenance: "https://www.google.com/", billet: adresse === DEFI_TABLES ? "" : null });
    assert.equal(n.envoyes.length, 1, adresse);
    const p = parametres(n.envoyes[0]);
    assert.equal(p.r, "https://www.google.com", adresse);
  }
});

test("un clic sur une fiche PDF du site est compté comme événement, avec le nom du fichier", () => {
  const n = navigateur({ adresse: "https://mathsgo.re/outils/index.html?q=pythagore" });
  n.cliquer("../outils/pythabarre_recto_verso.pdf?v=3#page=2");
  n.cliquer("https://mathsgo.re/outils/fiche%20tables.pdf", "auxclick", 1);
  n.cliquer("splat_univers.html");                        // pas un PDF
  n.cliquer("https://exemple.org/document.pdf");          // PDF d'un autre site
  n.cliquer("https://mathsgo.re/outils/autre.pdf", "auxclick", 2); // clic droit
  const evenements = n.envoyes.slice(1).map(parametres);
  for (const e of evenements) delete e.rnd;
  assert.deepEqual(evenements, [
    { p: "/outils/pythabarre_recto_verso.pdf", t: "pythabarre_recto_verso.pdf", e: "true" },
    { p: "/outils/fiche%20tables.pdf", t: "fiche tables.pdf", e: "true" },
  ]);
});

test("compteur.js ne contacte qu'une adresse : celle de GoatCounter", () => {
  const adresses = [...new Set(codeCompteur.match(/https?:\/\/[^\s"'`)]+/g) ?? [])]
    .filter((a) => !/^https?:\/\/exemple\.fr/.test(a));
  // https://suivi.mathsgo.re (lot « compteur-silence-suivi ») n'est jamais
  // contacté : il n'est que comparé à document.referrer, pour se taire.
  assert.deepEqual(adresses.sort(), ["https://mathsgo.goatcounter.com/count", "https://suivi.mathsgo.re"]);
  assert.equal(codeCompteur.match(/PROVENANCE_SUIVI/g).length, 2, "déclarée, puis lue une seule fois");
  assert.match(codeCompteur, /String\(document\.referrer \|\| ""\)\.indexOf\(PROVENANCE_SUIVI\) === 0/);
  assert.doesNotMatch(codeCompteur, /document\.title/, "le titre de la page ne part jamais (Défi tables y met le prénom)");
  assert.doesNotMatch(codeCompteur, /location\.search|\.search\b/, "ce qui suit « ? » ne part jamais");
  assert.doesNotMatch(codeCompteur, /document\.cookie/);
});
