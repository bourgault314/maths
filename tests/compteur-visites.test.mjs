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
  ongletRefuse = false,
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
  const onglet = new Map(codeOnglet === null ? [] : [["mathsgo-suivi-code", codeOnglet]]);
  const sessionStorage = {
    getItem(cle) { accesOnglet.push(["lire", cle]); if (ongletRefuse) throw new Error("refusé"); return onglet.has(cle) ? onglet.get(cle) : null; },
    setItem(cle) { accesOnglet.push(["écrire", cle]); },
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
  if (billet !== null) fenetre.MATHSGO_ENTREE = { billet, vue: "", ouvrir: "" };
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
  return { envoyes, alertes, accesStockage, accesOnglet, stock, cliquer };
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
  assert.ok(eleve.accesOnglet.every(([action, cle]) => action === "lire" && cle === "mathsgo-suivi-code"),
    `seule la case du code est LUE : ${JSON.stringify(eleve.accesOnglet)}`);
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
  assert.deepEqual(adresses, ["https://mathsgo.goatcounter.com/count"]);
  assert.doesNotMatch(codeCompteur, /document\.title/, "le titre de la page ne part jamais (Défi tables y met le prénom)");
  assert.doesNotMatch(codeCompteur, /location\.search|\.search\b/, "ce qui suit « ? » ne part jamais");
  assert.doesNotMatch(codeCompteur, /document\.cookie/);
});
