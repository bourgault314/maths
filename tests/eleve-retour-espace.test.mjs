import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep } from "node:path";
import vm from "node:vm";

// L'élève connecté ne retombe jamais sur le site (règle de Gwenaël du
// 08/11/2026, AGENTS.md « Applis suivies — modèle commun »). Les pages de
// navigation du site chargent assets/js/eleve-retour-espace.js, qui renvoie à
// Mon espace un onglet gardant le code d'un élève. Ces tests tiennent la liste
// des pages, la place du script (avant que la page ne se dessine), son absence
// des applis suivies, et ce qu'il fait.

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
const charge = (html) => /<script\b[^>]*\bsrc="[^"]*assets\/js\/eleve-retour-espace\.js"/.test(html);

// Les pages de navigation : celles où un élève peut retomber par Retour ou par
// un lien, et qui n'ont rien à lui offrir.
const PAGES = [
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
];

// Les applis suivies : y charger le script renverrait l'élève hors de son
// travail dès qu'il l'ouvre.
const APPLIS_SUIVIES = [
  "outils/calcul_mental/defi_tables.html",
  "outils/calcul_mental/defi_calcul_modules.html",
  "outils/calcul_mental/coffres_magiques_solo.html",
  "outils/calcul_mental/flash_anzan.html",
  "outils/splat_univers.html",
  "outils/splat.html",
  "outils/equasplat.html",
  "outils/splat_tache_barre.html",
];

test("les pages de navigation du site, et elles seules, chargent le renvoi vers Mon espace", () => {
  const chargent = pages.filter((p) => charge(p.html)).map((p) => p.chemin);
  assert.deepEqual(chargent, PAGES);
});

test("toute page qui porte la mention de navigation porte aussi le renvoi (une nouvelle page de navigation ne l'oublie pas)", () => {
  for (const p of pages) {
    if (/assets\/js\/mention-confidentialite\.js/.test(p.html)) assert.ok(charge(p.html), `${p.chemin} : la mention sans le renvoi vers Mon espace`);
  }
});

test("aucune appli suivie, aucun jeu suivi ne charge le renvoi", () => {
  for (const chemin of APPLIS_SUIVIES) {
    const page = pages.find((p) => p.chemin === chemin);
    assert.ok(page, `${chemin} introuvable`);
    assert.ok(!charge(page.html), `${chemin} renverrait l'élève hors de son travail`);
  }
  for (const p of pages) {
    if (/splat-suivi\.js|coffres-suivi\.js|flash_anzan_suivi\.js|defi_tables_core\.js|defi_calcul_mon_parcours\.js/.test(p.html)) {
      assert.ok(!charge(p.html), `${p.chemin} est suivie et charge le renvoi`);
    }
  }
});

test("le renvoi est le premier script du <head>, sans defer ni async : il passe avant que la page ne se dessine", () => {
  for (const chemin of PAGES) {
    const html = pages.find((p) => p.chemin === chemin).html;
    const tete = html.slice(0, html.search(/<\/head>/i));
    const scripts = tete.match(/<script\b[^>]*>/gi) || [];
    assert.ok(scripts.length > 0 && /eleve-retour-espace\.js/.test(scripts[0]), `${chemin} : le renvoi n'est pas le premier script du <head>`);
    assert.ok(!/\b(defer|async)\b/i.test(scripts[0]), `${chemin} : le renvoi est différé`);
    assert.ok(!/type="module"/i.test(scripts[0]), `${chemin} : un module est différé`);
  }
});

// ---------------------------------------------------------------------------
// Ce que fait le script, dans une fausse fenêtre.
// ---------------------------------------------------------------------------
function jouer({ code, stockageCasse = false } = {}) {
  const remplacements = [];
  const ecouteurs = {};
  const style = {};
  const fenetre = {
    sessionStorage: {
      getItem(cle) {
        if (stockageCasse) throw new Error("SecurityError");
        return cle === "mathsgo-suivi-code" && code !== undefined ? code : null;
      },
    },
    location: { replace: (adresse) => remplacements.push(adresse) },
    addEventListener: (type, fn) => { ecouteurs[type] = fn; },
  };
  const contexte = { window: fenetre, document: { documentElement: { style } } };
  vm.runInNewContext(source, contexte);
  return { remplacements, ecouteurs, style, fenetre, changerCode: (c) => { code = c; } };
}

test("un onglet qui garde le code d'un élève part vers Mon espace, en remplaçant la page, sans la montrer", () => {
  const r = jouer({ code: "UDQRGG" });
  assert.deepEqual(r.remplacements, ["https://suivi.mathsgo.re/"]);
  assert.equal(r.style.visibility, "hidden");
});

test("le code est lu comme le lisent les applis (minuscules, tirets)", () => {
  assert.deepEqual(jouer({ code: "udq-rgg" }).remplacements, ["https://suivi.mathsgo.re/"]);
});

test("sans code, avec un code incomplet, ou sans accès au stockage : le site s'affiche comme avant", () => {
  for (const cas of [{}, { code: "" }, { code: "ABC" }, { code: "ABCDEFG" }, { stockageCasse: true }]) {
    const r = jouer(cas);
    assert.deepEqual(r.remplacements, [], JSON.stringify(cas));
    assert.equal(r.style.visibility, undefined, JSON.stringify(cas));
  }
});

test("une page ressortie du cache par le bouton Retour revérifie l'onglet", () => {
  const r = jouer({});
  assert.deepEqual(r.remplacements, []);
  r.changerCode("UDQRGG");
  r.ecouteurs.pageshow({ persisted: false });
  assert.deepEqual(r.remplacements, [], "un chargement ordinaire a déjà été vérifié");
  r.ecouteurs.pageshow({ persisted: true });
  assert.deepEqual(r.remplacements, ["https://suivi.mathsgo.re/"]);
});

test("le script ne lit le code que dans l'onglet et ne l'envoie nulle part", () => {
  assert.doesNotMatch(source, /localStorage|fetch\(|XMLHttpRequest|sendBeacon|document\.cookie/);
  assert.doesNotMatch(source, /ESPACE\s*\+/, "le code n'entre jamais dans l'adresse");
});
