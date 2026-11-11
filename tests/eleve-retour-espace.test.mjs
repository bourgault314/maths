import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep } from "node:path";
import { posix } from "node:path";
import vm from "node:vm";

// L'élève connecté ne retombe jamais sur le site (règle de Gwenaël du
// 08/11/2026, AGENTS.md « Applis suivies — modèle commun »).
//
// 1. Les pages de navigation et les carrefours du site chargent
//    assets/js/eleve-retour-espace.js, qui renvoie à Mon espace un onglet
//    gardant le code d'un élève.
// 2. « Se déconnecter » de Mon espace passe par https://mathsgo.re/?sortie=1 :
//    le même script y vide la mémoire de l'onglet côté site, PUIS revient sur
//    https://suivi.mathsgo.re/?oublier=1.
// 3. Défi tables et Défi calcul, ressortis du cache arrière/avant sous un
//    code, se rechargent avant tout autre traitement (comme SPLAT!).
//
// Correctif après la relecture de Codex : les tests prouvent le VRAI
// chargement (le chemin mène au fichier, la balise s'exécute), l'ordre
// « vider puis partir », et la destination exacte.

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = "assets/js/eleve-retour-espace.js";
const source = readFileSync(join(racine, SCRIPT), "utf8");

function pagesPubliees() {
  const trouves = [];
  (function parcourir(dossier) {
    for (const nom of readdirSync(dossier)) {
      if (nom.startsWith(".") || nom.startsWith("_") || nom === "node_modules") continue;
      const chemin = join(dossier, nom);
      if (statSync(chemin).isDirectory()) parcourir(chemin);
      else if (nom.toLowerCase().endsWith(".html")) trouves.push(chemin);
    }
  })(racine);
  return trouves.sort();
}
const rel = (chemin) => relative(racine, chemin).split(sep).join("/");
const pages = pagesPubliees().map((chemin) => ({ chemin: rel(chemin), html: readFileSync(chemin, "utf8") }));
const pageDe = (chemin) => {
  const p = pages.find((x) => x.chemin === chemin);
  assert.ok(p, `${chemin} introuvable`);
  return p.html;
};
// Une balise qui VISE le script, même mal écrite (chemin faux, type faux) :
// les tests suivants disent si elle est bonne.
const balisesDuScript = (html) => (html.match(/<script\b[^>]*>/gi) || []).filter((b) => /eleve-retour-espace/.test(b));
const charge = (html) => balisesDuScript(html).length > 0;

// Les pages de navigation (celles de mention-confidentialite.js) et les
// carrefours (page des livrets SPLAT!, boîte à jeux) : un élève peut y retomber
// par Retour ou par un lien, et elles n'ont rien à lui offrir. Jamais une page
// qu'une appli suivie ouvre pour l'élève connecté.
const PAGES = [
  // navigation
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
  "outils/plateaux_manipulation/moulin_pythagore_fiches.html",
  "outils/soustraction-posee/index.html",
  "outils/toutes-les-ressources.html",
  // carrefours (correctif après Codex, 08/11/2026)
  "jeux-cadeaux/index.html",
  "outils/livrets_splat.html",
].sort();

// Les applis suivies, et les pages qu'elles ouvrent pour l'élève connecté (les
// films de SPLAT!) : y charger le script renverrait l'élève hors de son travail.
// Les pages courtes des QR des livrets (splat/*/livret/) non plus : avec ?f= ou
// ?s=, elles envoient sur un jeu, et elles n'ont aucun lien vers le site.
const JAMAIS = [
  "outils/calcul_mental/defi_tables.html",
  "outils/calcul_mental/defi_calcul_modules.html",
  "outils/calcul_mental/coffres_magiques_solo.html",
  "outils/calcul_mental/flash_anzan.html",
  "outils/splat_univers.html",
  "outils/splat.html",
  "outils/equasplat.html",
  "outils/splat_tache_barre.html",
  "outils/splat_intro.html",
  "splat/classique/livret/index.html",
  "splat/enquete/livret/index.html",
  "splat/equations/livret/index.html",
  "splat/relatifs/livret/index.html",
  "splat/systeme/livret/index.html",
];
// Le livret de cours (lot « cours-appli », 08/11/2026) : une destination de
// l'élève connecté, pas une page de navigation. Toutes les pages du dossier
// cours/ (y compris celles que le moteur du livret ajoutera) : jamais le
// renvoi, un retour vers Mon espace, aucun lien vers l'accueil ou le catalogue.
const COURS = pages.map((p) => p.chemin).filter((chemin) => chemin.startsWith("cours/"));

// ---------------------------------------------------------------------------
// Les pages
// ---------------------------------------------------------------------------
test("les pages de navigation et les carrefours, et eux seuls, chargent le renvoi vers Mon espace", () => {
  const chargent = pages.filter((p) => charge(p.html)).map((p) => p.chemin).sort();
  assert.deepEqual(chargent, PAGES);
});

test("toute page qui porte la mention de navigation porte aussi le renvoi (une nouvelle page de navigation ne l'oublie pas)", () => {
  for (const p of pages) {
    if (/assets\/js\/mention-confidentialite\.js/.test(p.html)) assert.ok(charge(p.html), `${p.chemin} : la mention sans le renvoi vers Mon espace`);
  }
});

test("aucune appli suivie, aucun jeu suivi, aucun film ne charge le renvoi", () => {
  for (const chemin of JAMAIS) assert.ok(!charge(pageDe(chemin)), `${chemin} renverrait l'élève hors de son travail`);
  for (const p of pages) {
    if (/splat-suivi\.js|coffres-suivi\.js|flash_anzan_suivi\.js|defi_tables_core\.js|defi_calcul_mon_parcours\.js/.test(p.html)) {
      assert.ok(!charge(p.html), `${p.chemin} est suivie et charge le renvoi`);
    }
  }
});

test("le livret de cours (dossier cours/) : jamais le renvoi, le retour vers Mon espace, aucun lien vers l'accueil ou le catalogue du site", () => {
  assert.ok(COURS.length >= 1, "les pages du livret sont là");
  for (const chemin of COURS) {
    const html = pageDe(chemin);
    assert.ok(!charge(html), `${chemin} renverrait l'élève hors de son cours`);
    assert.match(html, /var SITE = \{"retour": "https:\/\/suivi\.mathsgo\.re\/#cours=", /, `${chemin} : le retour vers Mon espace`);
    // Les seuls liens écrits en clair : les icônes de la page. Les autres sont
    // fabriqués par le moteur (le retour, et les pages du livret lui-même).
    for (const [, href] of html.matchAll(/href="([^"'+]*)"/g)) {
      assert.match(href, /^\/(?:favicon\.(?:ico|svg)|assets\/img\/[a-z0-9-]+\.png)$/, `${chemin} : lien en clair ${href}`);
    }
    for (const [, href] of html.matchAll(/href:'([^']*)'/g)) assert.match(href, /^\/cours\//, `${chemin} : lien ${href} hors du livret`);
    assert.doesNotMatch(html, /mention-confidentialite\.js|toutes-les-ressources|outils\/index\.html|catalogue-refonte/, `${chemin} : rien du site autour`);
  }
});

test("chaque page charge VRAIMENT le script : le chemin, résolu depuis la page, mène au fichier, et la balise s'exécute", () => {
  for (const chemin of PAGES) {
    const balises = balisesDuScript(pageDe(chemin));
    assert.equal(balises.length, 1, `${chemin} : une seule balise du renvoi`);
    const balise = balises[0];
    const src = (balise.match(/\bsrc="([^"]*)"/i) || [])[1];
    assert.ok(src, `${chemin} : la balise n'a pas de src`);
    assert.ok(!/^[a-z]+:|^\/\//i.test(src), `${chemin} : le script vient du site lui-même, pas d'une autre adresse`);
    const sansQuestion = src.split(/[?#]/)[0];
    const resolu = sansQuestion.startsWith("/") ? sansQuestion.slice(1) : posix.normalize(posix.join(posix.dirname(chemin), sansQuestion));
    assert.equal(resolu, SCRIPT, `${chemin} : ${src} ne mène pas au script`);
    assert.ok(existsSync(join(racine, resolu)), `${chemin} : ${resolu} n'existe pas`);
    const type = (balise.match(/\btype="([^"]*)"/i) || [])[1];
    assert.ok(type === undefined || /^text\/javascript$/i.test(type.trim()), `${chemin} : type="${type}" n'est jamais exécuté comme script classique`);
  }
});

test("le renvoi est le premier script du <head>, sans defer ni async : il passe avant que la page ne se dessine", () => {
  for (const chemin of PAGES) {
    const html = pageDe(chemin);
    const tete = html.slice(0, html.search(/<\/head>/i));
    const scripts = tete.match(/<script\b[^>]*>/gi) || [];
    assert.ok(scripts.length > 0 && /eleve-retour-espace\.js/.test(scripts[0]), `${chemin} : le renvoi n'est pas le premier script du <head>`);
    assert.ok(!/\b(defer|async)\b/i.test(scripts[0]), `${chemin} : le renvoi est différé`);
  }
});

// ---------------------------------------------------------------------------
// Ce que fait le script, dans une fausse fenêtre. Le journal garde l'ordre
// exact des gestes : « vider » puis « partir ».
// ---------------------------------------------------------------------------
function jouer({ code, stockageCasse = false, recherche = "" } = {}) {
  const journal = [];
  const ecouteurs = {};
  const style = {};
  const fenetre = {
    sessionStorage: {
      getItem(cle) {
        if (stockageCasse) throw new Error("SecurityError");
        return cle === "mathsgo-suivi-code" && code !== undefined ? code : null;
      },
      clear() {
        if (stockageCasse) throw new Error("SecurityError");
        journal.push("vider");
        code = undefined;
      },
    },
    location: { search: recherche, hash: "", replace: (adresse) => journal.push("partir " + adresse) },
    addEventListener: (type, fn) => { ecouteurs[type] = fn; },
  };
  vm.runInNewContext(source, { window: fenetre, document: { documentElement: { style } }, URLSearchParams });
  const departs = () => journal.filter((g) => g.startsWith("partir "));
  return { journal, departs, ecouteurs, style, changerCode: (c) => { code = c; } };
}

test("un onglet qui garde le code d'un élève part vers Mon espace, en remplaçant la page, sans la montrer, sans rien vider", () => {
  const r = jouer({ code: "UDQRGG" });
  assert.deepEqual(r.journal, ["partir https://suivi.mathsgo.re/"]);
  assert.equal(r.style.visibility, "hidden");
});

test("le code est lu comme le lisent les applis (minuscules, tirets, six premiers caractères, alphabet des codes)", () => {
  assert.deepEqual(jouer({ code: "udq-rgg" }).departs(), ["partir https://suivi.mathsgo.re/"]);
  assert.deepEqual(jouer({ code: "UDQRGGX" }).departs(), ["partir https://suivi.mathsgo.re/"], "les applis gardent les six premiers");
  for (const pasUnCode of ["UDQRG0", "UDQRGO", "UDQRG1", "UDQRGI"]) {
    assert.deepEqual(jouer({ code: pasUnCode }).departs(), [], `${pasUnCode} : 0, O, 1 et I ne sont pas dans l'alphabet des codes`);
  }
});

test("sans code, avec un code incomplet, ou sans accès au stockage : le site s'affiche comme avant", () => {
  for (const cas of [{}, { code: "" }, { code: "ABC" }, { stockageCasse: true }]) {
    const r = jouer(cas);
    assert.deepEqual(r.journal, [], JSON.stringify(cas));
    assert.equal(r.style.visibility, undefined, JSON.stringify(cas));
  }
});

test("une page ressortie du cache par le bouton Retour revérifie l'onglet", () => {
  const r = jouer({});
  assert.deepEqual(r.journal, []);
  r.changerCode("UDQRGG");
  r.ecouteurs.pageshow({ persisted: false });
  assert.deepEqual(r.journal, [], "un chargement ordinaire a déjà été vérifié");
  r.ecouteurs.pageshow({ persisted: true });
  assert.deepEqual(r.journal, ["partir https://suivi.mathsgo.re/"]);
});

test("?sortie=1 vide la mémoire de l'onglet AVANT de partir, vers exactement https://suivi.mathsgo.re/?oublier=1, et rien d'autre", () => {
  for (const code of ["UDQRGG", undefined]) {
    const r = jouer({ code, recherche: "?sortie=1" });
    assert.deepEqual(r.journal, ["vider", "partir https://suivi.mathsgo.re/?oublier=1"], `code dans l'onglet : ${code || "aucun"}`);
    assert.equal(r.style.visibility, "hidden", "l'accueil ne se montre pas");
  }
});

test("?sortie=1 ne reprend rien de l'adresse reçue : la destination reste fixe", () => {
  for (const recherche of ["?sortie=1&vers=https://exemple.org", "?vers=//exemple.org&sortie=1", "?sortie=1&oublier=0"]) {
    assert.deepEqual(jouer({ code: "UDQRGG", recherche }).departs(), ["partir https://suivi.mathsgo.re/?oublier=1"], recherche);
  }
});

test("un stockage refusé n'empêche pas le retour sur l'écran du code", () => {
  assert.deepEqual(jouer({ stockageCasse: true, recherche: "?sortie=1" }).departs(), ["partir https://suivi.mathsgo.re/?oublier=1"]);
});

test("seul le paramètre exact sortie=1 est une sortie", () => {
  for (const recherche of ["?sortie=10", "?sortie=", "?sortie=oui", "?xsortie=1", "?sorties=1"]) {
    const r = jouer({ code: "UDQRGG", recherche });
    assert.ok(!r.journal.includes("vider"), `${recherche} ne vide rien`);
    assert.deepEqual(r.departs(), ["partir https://suivi.mathsgo.re/"], `${recherche} : le renvoi ordinaire`);
  }
});

test("le script ne lit le code que dans l'onglet et ne l'envoie nulle part ; le localStorage n'est jamais touché", () => {
  // Le code seul, sans les commentaires (qui expliquent, eux, pourquoi le
  // localStorage n'est pas touché).
  const code = source.replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(code, /localStorage|fetch\(|XMLHttpRequest|sendBeacon|document\.cookie/);
  assert.doesNotMatch(code, /(ESPACE|ECRAN_DU_CODE)\s*\+/, "aucune adresse fabriquée : les deux destinations sont fixes");
});

// ---------------------------------------------------------------------------
// « Se déconnecter » de Mon espace
// ---------------------------------------------------------------------------
test("« Se déconnecter » de Mon espace fait son ménage puis mène à https://mathsgo.re/?sortie=1", () => {
  const espace = readFileSync(join(racine, "_serveur/public/index.php"), "utf8");
  assert.match(espace, /const SORTIE_PAR_LE_SITE = "https:\/\/mathsgo\.re\/\?sortie=1";/);
  // Lot « code en cases » : « Se déconnecter » est une fonction (seDeconnecter),
  // appelée par le bouton ET par « Non, ce n'est pas moi » de la question.
  assert.match(espace, /\$\("changer"\)\.addEventListener\("click", seDeconnecter\);/);
  const debut = espace.indexOf("function seDeconnecter()");
  assert.ok(debut > 0);
  const bloc = espace.slice(debut, espace.indexOf("\n  }", debut));
  const menage = bloc.indexOf("revenirAuCode();");
  const depart = bloc.indexOf("window.location.replace(SORTIE_PAR_LE_SITE)");
  assert.ok(menage >= 0, "le ménage de la page reste fait sur place, d'abord (même si le site ne répond pas)");
  assert.ok(depart > menage, "puis l'onglet part vider la mémoire du site, sans entrée d'historique (replace)");
  // La politique de contenu de la page ne bride pas la navigation (pas de
  // navigate-to), et l'accueil qui reçoit ?sortie=1 charge le script.
  const entetes = readFileSync(join(racine, "_serveur/public/lib/entetes.php"), "utf8");
  assert.doesNotMatch(entetes, /navigate-to/);
  assert.ok(charge(pageDe("index.html")), "l'accueil, qui reçoit ?sortie=1, charge le script");
});

// ---------------------------------------------------------------------------
// Défi tables et Défi calcul ressortis du cache arrière/avant
// ---------------------------------------------------------------------------
function ecouteurRechargement(chemin) {
  const html = pageDe(chemin);
  const debut = html.indexOf('window.addEventListener("pageshow"');
  assert.ok(debut > 0, `${chemin} : aucun écouteur « pageshow »`);
  const fin = html.indexOf("\n        });", debut);
  const bloc = html.slice(debut, fin + "\n        });".length);
  assert.match(bloc, /location\.reload\(\)/, `${chemin} : le PREMIER écouteur « pageshow » de la page doit être celui qui recharge`);
  return bloc;
}

for (const chemin of ["outils/calcul_mental/defi_tables.html", "outils/calcul_mental/defi_calcul_modules.html"]) {
  test(`${chemin} : ressortie du cache sous un code, la page se recharge avant tout autre traitement`, () => {
    const bloc = ecouteurRechargement(chemin);
    const jouerEcouteur = ({ codeSuivi = "", codeOnglet = "", persisted = true }) => {
      const gestes = [];
      const ecouteurs = [];
      const contexte = {
        window: { addEventListener: (type, fn) => ecouteurs.push([type, fn]), location: { reload: () => gestes.push("recharger") } },
        PARCOURS: { chargerCode: () => codeOnglet },
        stockageSession: () => ({}),
        codeSuivi,
      };
      vm.runInNewContext(bloc, contexte);
      assert.equal(ecouteurs.length, 1);
      assert.equal(ecouteurs[0][0], "pageshow");
      ecouteurs[0][1]({ persisted, stopImmediatePropagation: () => gestes.push("arrêter les autres") });
      return gestes;
    };
    assert.deepEqual(jouerEcouteur({ codeSuivi: "UDQRGG" }), ["arrêter les autres", "recharger"], "la page suivait un élève (l'onglet a été vidé depuis)");
    assert.deepEqual(jouerEcouteur({ codeOnglet: "TZW9G5" }), ["arrêter les autres", "recharger"], "l'onglet garde un code (un autre élève est entré)");
    assert.deepEqual(jouerEcouteur({}), [], "sans code ni avant ni maintenant : rien à faire");
    assert.deepEqual(jouerEcouteur({ codeSuivi: "UDQRGG", persisted: false }), [], "un chargement ordinaire n'est pas un retour du cache");
  });
}
