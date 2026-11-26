// Défi calcul, lot 2 « J'apprends en une étape » (12/11/2026, planches
// validées par Gwenaël ; décisions 7 et 8 de « fonctionnement 3 »). Le
// moteur : la file ne rend plus « Je m'entraîne » ; J'apprends reçoit les
// réponses. Le cœur : les 15 cartes « par cœur ». La page : les moments de
// J'apprends, J'écris une fois, « ✓ Réussi ! » au-dessus d'À retenir.
// Les écrans au navigateur : tests/defi-calcul-ecrans.cjs.

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
// Lot F4 : ces tests suivent le parcours module par module — les tests de
// palier y sont déjà joués (tests/defi-calcul-lot-F4.test.mjs les joue).
const sansTestDePalier = p => Object.assign(p, {paliers: ["2026-01-01", "2026-01-01", "2026-01-01", "2026-01-01"]});
const CARTE = CORE.carte();
const PAGE = readFileSync(new URL("../outils/calcul_mental/defi_calcul_modules.html", import.meta.url), "utf8");
const CSS = readFileSync(new URL("../outils/calcul_mental/defi_calcul.css", import.meta.url), "utf8");
const J = "2026-11-16";
const reussie = () => [{juste: true, outil: "manip"}, {juste: true, outil: "manip"}, {juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))];
const ratee = () => Array.from({length: 25}, (_, i) => ({juste: i % 3 !== 0, outil: "aucun"}));
const types = (p, jour = J) => P.fileSeance(p, CARTE, {aujourdhui: jour}).etapes.map(e => e.type);
const apprendre = (p, module, niveau, reponses = reussie(), jour = J) =>
  P.appliquerSerie(p, {module, niveau, genre: "apprends", reponses}, {aujourdhui: jour, carte: CARTE, seance: true});
const tester = (p, module, marche) => P.appliquerTest(p, {module, marche,
  niveaux: Array.from({length: Math.min(P.NIVEAUX[module], marche + 1)}, (_, i) => ({niveau: i + 1, justes: i < marche ? 3 : 1, total: 3}))},
  {aujourdhui: J, carte: CARTE, seance: true});

// (Lot 7e-2 : « Différences et trous jusqu'à 20 » et « Compléments à la
// dizaine » deviennent des procédures, puis « Compléments à 100 : dizaines » — 12 cartes.)
// (Lot 7b : « Moitié des impairs jusqu'à 15 » — 13 cartes.)
// (Lot C2 : 15 — les moitiés jusqu'à 40 et des nombres usuels ont leur carte.)
test("les cartes « par cœur » : les niveaux « par cœur » construits (17 depuis le lot K1b), et eux seuls", () => {
  const parCoeur = CORE.ORDRE.filter(cle => { const t = CORE.niveauDe(cle); return t && t.module.construit && t.niveau.type === "F"; });
  // (Lot K1b : « Doubles de 11 à 20 » et « Moitiés de 22 à 40 », M1-7 et M1-8, au CE2 — les moitiés
  // du haut de M1-1 et M1-2 gardent leur carte ; M5-1 avant M1-6 : l'ordre du CE2 de LA-COUPE.)
  assert.deepEqual(parCoeur, ["A1-1", "A1-2", "M1-1", "M1-2", "M4-1", "M4-2", "M1-7", "M1-8", "M1-5", "M5-1", "M1-6", "F2-1", "F1-1", "F2-2", "D8-1", "F1-2", "F1-3"]);
  parCoeur.forEach(cle => assert.ok(CORE.carteParCoeur(cle), cle));
  CORE.ORDRE.filter(cle => !parCoeur.includes(cle)).forEach(cle => assert.equal(CORE.carteParCoeur(cle), null, cle));
  assert.ok(Object.isFrozen(CORE.carteParCoeur("M4-1").blocs[0].table[1]));
});

test("les cartes disent vrai : chaque calcul de la carte est juste", () => {
  const val = t => {
    const s = String(t).replace(/[\s\u00a0\u202f]/g, "").replace(",", ".");
    if (s.includes("/")) { const [a, b] = s.split("/"); return Number(a) / Number(b); }
    return Number(s);
  };
  // « a + b − c = … » : les termes et leurs signes ; « double de n ».
  // (Lot 7e-2 : « double de 2 000 + double de 500 », le × avant le + .)
  // (Lot C2 : « moitié de 1 000 + moitié de 400 ».)
  const terme = t => { const d = t.trim().match(/^(double|moitié) de (.+)$/); return d ? (d[1] === "double" ? 2 : 0.5) * val(d[2]) : val(t); };
  const produit = t => t.split(" × ").map(terme).reduce((a, b) => a * b, 1);
  const calculer = membre => {
    const morceaux = membre.trim().replace(/[\u00a0\u202f]/g, " ").split(/ ([+−]) /);
    let r = produit(morceaux[0]);
    for (let i = 1; i < morceaux.length; i += 2) {
      const x = produit(morceaux[i + 1]);
      r = morceaux[i] === "+" ? r + x : r - x;
    }
    return r;
  };
  // Lot 7e-2 : une ligne peut dire d'où vient son calcul (« 100 = 5 × 20,
  // car 5 × 2 = 10 » ; « 4 + 6 = 10, donc 40 + 60 = 100 ») : chaque
  // égalité est juste. Le petit calcul d'un bloc (`chemin`) aussi.
  const verifierLigne = (cle, ligne) => String(ligne).split(/, (?:car|donc) /).forEach(texte => {
    if (!texte.includes("=")) return;
    const membres = texte.split(" = ").map(calculer);
    membres.forEach(v => assert.ok(Math.abs(v - membres[0]) < 1e-9, `${cle} : ${texte}`));
  });
  CORE.ORDRE.forEach(cle => {
    const carte = CORE.carteParCoeur(cle);
    if (!carte) return;
    carte.blocs.forEach(bloc => {
      if (bloc.chemin) verifierLigne(cle, bloc.chemin.replace(/[\u00a0\u202f]/g, " "));
      if (bloc.table) {
        const [tete, ...lignes] = bloc.table;
        // (Lot 7e-2 : sous chaque nombre, ce qui manque pour aller à 100 — `total`.)
        if (bloc.ligneTete && bloc.total) { assert.deepEqual(lignes[0], tete.map(n => bloc.total - n), `${cle} : ce qui fait ${bloc.total}`); return; }
        // (Lot 7b : D8-1, sous chaque nombre, sa moitié.)
        if (bloc.ligneTete && bloc.moitie) { assert.deepEqual(lignes[0], tete.map(n => n / 2), `${cle} : les moitiés`); return; }
        if (bloc.ligneTete) { assert.deepEqual(lignes[0], tete.map(n => 2 * n), `${cle} : les doubles`); return; }
        // (Lot 3b : une case vide — au-delà de 10 —, une case {texte, fort}.)
        const lire = v => (v && typeof v === "object" ? Number(v.texte) : v);
        if (tete[0] === "×" || tete[0] === "+") lignes.forEach(l => l.slice(1).forEach((v, j) => v === "" || assert.equal(lire(v), tete[0] === "×" ? l[0] * tete[j + 1] : l[0] + tete[j + 1], `${cle} ${l[0]} ${tete[0]} ${tete[j + 1]}`)));
        else assert.deepEqual(lignes[0].slice(1), tete.slice(1).map(n => 2 * n), `${cle} : les doubles`);
        return;
      }
      // (Lot 3b : une phrase, puis son calcul après « : » ; une phrase seule.)
      bloc.liste.forEach(ligne => verifierLigne(cle, ligne.split(/\s:\s/).pop()));
    });
  });
});

test("la page : on te montre (le 1er temps de la leçon), puis la série « apprends », J'écris une fois, puis sans aide", () => {
  assert.match(PAGE, /temps: tempsDe\(id, n\)\.slice\(0, 1\), index: 0, revoir, montre: true/);
  assert.match(PAGE, /const NOM_MONTRE = "On te montre";/);
  assert.match(PAGE, /perles: "Avec les perles", glisse: "Avec le glisse-nombres"/);
  assert.match(PAGE, /const NOM_DESSIN = "Avec le dessin";/);
  assert.match(PAGE, /const NOM_SANS_AIDE = "Sans aide";/);
  assert.match(PAGE, /if \(serie\.genre === "apprends" && !serie\.ecrisFait && suivi\.outil === "aucun"\) \{ lancerEcris\(serie\); return; \}/);
  assert.match(PAGE, /temps: tempsDe\(pratique\.module, pratique\.niveau\)\.slice\(-1\), index: 0, revoir: false, pratique\};/);
  // Les calculs qui changent : jamais ceux de la leçon ; les sortes couvertes à la fin.
  assert.match(PAGE, /genre: "entraine", total: PARCOURS\.SEUILS\.entraine\.maximum, exclure: lecon\.base\.textes/);
  assert.match(PAGE, /if \(serie\.genre !== "entraine" && serie\.genre !== "apprends"\) return true;/);
  // La fin d'un temps n'enregistre plus rien : J'apprends se termine dans finish.
  const avancer = PAGE.slice(PAGE.indexOf("function avancerTemps()"), PAGE.indexOf("function commencerPratique("));
  assert.ok(!avancer.includes("appliquerSerie") && !avancer.includes("noterEtape"));
  // Une barre pour toute l'étape, qui ne redescend plus sous J'écris.
  assert.match(PAGE, /const BARRE_APPRENDS = Object\.freeze\(\{montre: 8, outil: 15, dessin: 35, ecris: 58, sansAide: 65\}\);/);
  assert.match(PAGE, /if \(serie\.ecrisFait\) avance = Math\.max\(BARRE_APPRENDS\.sansAide, avance\);/);
});

test("la page : J'apprends réussi — « ✓ Réussi ! » et À retenir sur un seul écran ; la carte « par cœur »", () => {
  assert.match(PAGE, /<p id="retenir-reussi" class="dc-reussi" hidden><\/p>\s*<div id="result-retenir" class="dc-retenir" hidden>/);
  assert.match(PAGE, /fort\.textContent = soude\("✓ Réussi !"\);/);
  // (Lot K1 : J'apprends réussi donne l'étoile ; elle revient toujours demain.)
  assert.match(PAGE, /\{reussi: `\$\{nomCompetence\(serie\.module, serie\.niveau\)\} revient demain\.`, finDeSeance: fin\}/);
  assert.ok(!PAGE.includes('"Je m’entraîne →"'), "plus de bouton « Je m'entraîne → » sous À retenir");
  // (Lot 3b : la carte vient sur son écran, « Ma carte à apprendre ».)
  // (Lot 7e-2 : une carte en deux parties, seule la première s'apprend par cœur.)
  assert.match(PAGE, /!surCarte \? "Je recopie cela dans mon cahier\." : enDeux \? "Je la note dans mon cahier et j’apprends la première partie par cœur\." : "Je la note dans mon cahier et je l’apprends par cœur\."/);
  assert.match(PAGE, /const coeur = CORE\.carteParCoeur\(`\$\{serie\.module\}-\$\{serie\.niveau\}`\);/);
  assert.match(CSS, /\.dc-reussi b \{ color: #147447; \}/);
  assert.match(CSS, /\.dc-coeur \{[^}]*border: 2px solid var\(--ink\);/);
  // « Comment ça marche ? » (sans mot genré). (Lot K1 : la carte de séance
  // et sa ligne « on me montre, puis à moi » sont parties avec l'ancien accueil.)
  assert.match(PAGE, /c’est réussi à 5&nbsp;justes sur les 6&nbsp;derniers, sans aide\./); // (correctif F4 : la règle des 6 derniers)
  assert.ok(!/justes de suite, seul\./.test(PAGE));
});
