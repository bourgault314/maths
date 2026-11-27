// Défi calcul, lot K1 « la carte chez l'élève », passe 2 (25/11/2026) : la
// page, lue telle qu'elle est (sans navigateur). Les écrans eux-mêmes sont
// joués au navigateur par tests/defi-calcul-lot-K1-ecrans.cjs ; le moteur
// par defi-calcul-lot-K1-carte.test.mjs et defi-calcul-lot-K1-donnees.test.mjs ;
// la tuile de Mon espace par suivi-prof-defi-calcul, suivi-b1-mon-espace et
// suivi-s3-mon-espace.
//
//  1. la page n'appelle que ce qui existe : chaque PARCOURS.x, CORE.x et
//     PARCOURS.SEUILS.x.y qu'elle nomme est dans le moteur ou le noyau, et
//     plus rien de l'ancien moteur (Mon module, Mon parcours, le test de
//     module, le test de palier, les barrettes) ;
//  2. les textes validés par Gwenaël (conception § 12.3, § 12.7, § 12.8),
//     mot pour mot ;
//  3. le panneau d'une étoile se pose par-dessus la carte (rien ne bouge
//     dessous) ; Échap, × et le voile le ferment ;
//  4. le temps actif est versé AVANT chaque étape appliquée ; le mode
//     professeur n'enregistre rien ; une page ancienne ne recouvre rien ;
//  5. la ceinture du noyau : le nœud dessiné après les pans (on ne les voit
//     plus à travers), `rempli` quart par quart, `vide`.
// Ces tests ont été sabotés un par un (K1\_travail\passe-2\sabotages-page) :
// chaque sabotage en rougit au moins un.

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const lire = chemin => readFileSync(new URL(chemin, import.meta.url), "utf8");
const PAGE = process.env.K1_PAGE ? readFileSync(process.env.K1_PAGE, "utf8") : lire("../outils/calcul_mental/defi_calcul_modules.html");
const CSS = process.env.K1_CSS ? readFileSync(process.env.K1_CSS, "utf8") : lire("../outils/calcul_mental/defi_calcul.css");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const CORE = process.env.K1_CORE ? require(process.env.K1_CORE) : require("../outils/calcul_mental/defi_calcul_core.js");

// Le code de la page (les scripts sans « src »).
const SCRIPT = [...PAGE.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join("\n");
// Le texte, comme l'élève le lit : espaces insécables et &nbsp; en espaces.
const plat = t => t.replace(/&nbsp;/g, " ").replace(/[  ]/g, " ").replace(/\\u00a0/g, " ");
const PAGE_PLATE = plat(PAGE);
function corps(nom) {
  const debut = SCRIPT.indexOf(`function ${nom}(`);
  assert.ok(debut >= 0, `function ${nom}`);
  let profondeur = 0;
  for (let i = SCRIPT.indexOf("{", debut); i < SCRIPT.length; i += 1) {
    if (SCRIPT[i] === "{") profondeur += 1;
    else if (SCRIPT[i] === "}" && --profondeur === 0) return SCRIPT.slice(debut, i + 1);
  }
  throw new Error(nom);
}

// ------------------------------------------------------------------ 1.

test("1. la page n'appelle que ce qui existe dans le moteur et le noyau", () => {
  for (const [nom, M] of [["PARCOURS", P], ["CORE", CORE]]) {
    const noms = new Set([...SCRIPT.matchAll(new RegExp(`\\b${nom}\\.([A-Za-z_]\\w*)`, "g"))].map(m => m[1]));
    assert.ok(noms.size > 20, `${nom} : ${noms.size} noms`);
    const manque = [...noms].filter(n => !(n in M));
    assert.deepEqual(manque, [], `${nom} : la page appelle ce qui n'existe pas`);
  }
  // Les réglages lus par la page : chaque chemin existe.
  const chemins = new Set([...SCRIPT.matchAll(/PARCOURS\.SEUILS((?:\.[A-Za-z_]\w*)+)/g)].map(m => m[1].slice(1)));
  assert.ok(chemins.size >= 6);
  for (const chemin of chemins) {
    const valeur = chemin.split(".").reduce((o, k) => (o == null ? undefined : o[k]), P.SEUILS);
    assert.notEqual(valeur, undefined, `PARCOURS.SEUILS.${chemin}`);
  }
});

test("1. plus rien de l'ancien moteur ni des écrans partis (Mon module, Mon parcours, test de module, barrettes)", () => {
  ["fileSeance", "moduleCourant", "etatModule", "competenceCourante", "appliquerTest", "appliquerTestPalier", "calculsDuTestDePalier",
    "marchesDuTest", "estIntact", "NOUVEAUTE", "PLAN.nouveaute", "SEUILS.test", "SEUILS.palier", "SEUILS.revision.test",
    "palierATester", "testDeReprise", "estSu", "estDeCote"].forEach(mot => assert.ok(!new RegExp(`\\b${mot.replace(".", "\\.")}\\b`).test(SCRIPT), `« ${mot} » est parti`));
  ["ecran-parcours", "acc-seance", "acc-module", "acc-soirs", "acc-changer", "module-changer", 'id="module"', "renderParcoursPaliers",
    "ouvrirParcours", "carteDeSeance", "renderSemaine", "feteBarrette", "barretteGagnee", "CARTE_CONSTRUITE", "Tu connais déjà ce module"]
    .forEach(mot => assert.ok(!PAGE.includes(mot), `« ${mot} » est parti`));
  assert.ok(!/show\("module"\)/.test(SCRIPT), "plus d'écran « Mon module »");
  assert.match(SCRIPT, /const ECRANS = Object\.freeze\(\["intro", "ecran-carte", "play", "result", "notice"\]\);/);
});

// ------------------------------------------------------------------ 2.

test("2. les textes validés (conception § 12.3, § 12.7, § 12.8), mot pour mot", () => {
  [
    // L'accueil, la carte (§ 12.3)
    // (Lot P1 : « Aujourd'hui : la ligne … » ; plus de « Tente toute la ceinture ».)
    "Aujourd’hui : la ligne ", "Avant : tes ", " calculs du jour.", "Tout est gagné.", "S’entraîner ne fait perdre aucune étoile.",
    "Continuer", "Ensuite : ", "D’abord : ",
    // Le panneau d'une étoile (planches K0-2, K1-2, K1-4)
    "6 calculs. 5 justes : l’étoile est à toi.", "On te montre, puis tu t’entraînes.", "Fermée.", " D’abord : ",
    "Tu as déjà tenté aujourd’hui. ", "Tu pourras retenter demain.", "Ce calcul, on l’apprend ensemble.",
    "Ce calcul, ton professeur le reverra avec toi.", " En attendant, continue sur les autres lignes.",
    "Tu l’avais gagnée.", "Regagne ton étoile.", "On reprend là où tu en étais.",
    // « Je tente », les bilans
    "justes pour l’étoile", "Étoile gagnée", "Étoile suivante", "La carte", "Elle reviendra demain dans tes calculs du jour.",
    "Ceinture suivante", "Toutes les étoiles sont gagnées",
    // L'étoile qui part (§ 12.8)
    "Deux calculs faux : l’étoile est partie. Tu peux la regagner quand tu veux.", "Tes calculs du jour sont faits.",
    // La séance
    "Séance terminée", "C’est fait.", "Encore une séance", "À demain", "On continue demain", "Arrêter la séance",
    "Page ancienne : recharge la page."
  ].forEach(texte => assert.ok(PAGE_PLATE.includes(texte), `« ${texte} »`));
  // « Comment ça marche ? » (texte validé le 25/11 à 20 h 20), mot pour mot.
  const notice = plat(PAGE.slice(PAGE.indexOf('<div class="notice">'), PAGE.indexOf("</div>", PAGE.indexOf('<div class="notice">'))))
    .replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  assert.equal(notice, [
    // (Lot P1, planche P1-9 A, choix de Gwenaël du 27/11.)
    "Ma séance. 10 minutes : d’abord mes calculs du jour, puis je gagne des étoiles sur la carte. « Continuer » me dit quoi faire ; si c’est trop dur, il me propose plus facile. Je peux refaire une séance si je veux.",
    "Mes calculs du jour. Mes étoiles reviennent pour voir si elles tiennent. Gagnée du premier coup : dans une semaine. Apprise : demain, puis dans 3 jours, 7 jours… Un calcul faux ? Un autre du même genre. Deux faux : l’étoile revient demain ; encore deux faux, elle part, et je peux la regagner quand je veux.",
    "Je tente. 6 calculs sans aide. 5 justes : l’étoile est à moi. Raté ? Je peux essayer plus facile, ou apprendre.",
    "J’apprends. On me montre, puis je fais avec l’aide ; c’est réussi à 5 justes sur les 6 derniers, sans aide. Ici, se tromper ne compte pas.",
    "Mes ceintures. Tout est ouvert. Une ceinture est à moi quand j’ai toutes ses étoiles. Six ceintures, de la blanche-jaune à la bleue, à gagner dans l’ordre que je veux."
  ].join(" "));
  // Un nombre et son unité ne se séparent jamais : les textes de la page passent par soude.
  assert.match(SCRIPT, /\$\("acc-minutes"\)\.textContent = soude\(`\$\{s\.minutes\}\u00a0minutes`\);/);
  assert.match(PAGE, /<span id="acc-minutes" class="ck-minutes">10&nbsp;minutes<\/span>/);
  // « Séance terminée » sans la ligne des jours (25/11, 20 h 50) ; aucun mot genré.
  assert.ok(!/texteSoirs|cette semaine/.test(corps("renderFinDeSeance")), "pas de ligne des jours");
  const sansNotes = PAGE_PLATE.replace(/<!--[\s\S]*?-->/g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  [/\bchampion/i, /\bil a\b/, /\bvenu\b/, /\bprêt\b/, /\bBienvenu\b/, /\bfier\b/].forEach(mot => assert.doesNotMatch(sansNotes, mot, "aucun mot genré"));
});

// ------------------------------------------------------------------ 3.

test("3. le panneau d'une étoile se pose par-dessus la carte ; rien ne bouge dessous ; Échap, × et le voile le ferment", () => {
  assert.match(CSS, /\.ck-voile \{ position: fixed; inset: 0;/);
  assert.match(CSS, /\.ck-panneau \{ position: fixed;/);
  assert.match(PAGE, /<div id="carte-panneau" class="ck-panneau" role="dialog" aria-modal="true" aria-labelledby="panneau-titre" hidden>/);
  const ouvrir = corps("ouvrirPanneau");
  assert.ok(!/scrollTo|scrollIntoView\(\)|show\(/.test(ouvrir), "ouvrir le panneau ne fait pas défiler la carte et ne change pas d'écran");
  assert.match(SCRIPT, /\$\("panneau-fermer"\)\.addEventListener\("click", \(\) => fermerPanneau\(\)\);/);
  assert.match(SCRIPT, /\$\("carte-voile"\)\.addEventListener\("click", \(\) => fermerPanneau\(\)\);/);
  assert.match(SCRIPT, /key === "Escape"[\s\S]{0,120}fermerPanneau\(\)/);
  assert.ok(!/scrollTo/.test(corps("fermerPanneau")), "le fermer non plus");
  // Changer d'écran le referme.
  assert.match(corps("show"), /if \(name !== "ecran-carte"\) fermerPanneau\(false\);/);
});

// ------------------------------------------------------------------ 4.

test("4. le temps est versé avant chaque étape appliquée ; le professeur n'enregistre rien ; une page ancienne ne recouvre rien", () => {
  const fin = corps("finish");
  const verse = fin.indexOf("verserTempsActif();");
  assert.ok(verse > 0);
  // (Lot P1 : « Tente toute la ceinture », appliquerTestCeinture, n'existe plus.)
  ["PARCOURS.terminerCalculsDuJour", "PARCOURS.appliquerTentative", "PARCOURS.appliquerSerie"]
    .forEach(appel => assert.ok(fin.indexOf(appel) > verse, `${appel} après le temps`));
  assert.match(fin, /seance: enSeance\(\) && !MODE_PROF, palier: palierRegle\(\)/);
  assert.equal(SCRIPT.split("PARCOURS.noterTemps(").length - 1, 1, "un seul endroit verse le temps");
  // Le mode professeur : la carte toute ouverte, rien d'enregistré.
  assert.match(SCRIPT, /const optionsCarte = \(\) => \(\{aujourdhui: jourCourant\(\), palier: palierRegle\(\), prof: MODE_PROF\}\);/);
  assert.match(corps("sauverCase"), /if \(MODE_PROF\) return;/);
  assert.match(corps("sauverParcours"), /sauverCase\(\);\s*if \(pageAncienne\) return;/);
  // Une page plus ancienne que la progression : lecture seule, rien n'est envoyé.
  assert.match(SCRIPT, /pageAncienne/);
  assert.match(corps("peutEffacer"), /!pageAncienne/);
  // Une écriture refusée parce que le serveur garde plus récent : la ligne le dit, plus rien ne part.
  assert.match(corps("traiterReponseEnvoi"), /if \(reponse\.statut === 400 && donnees && donnees\.erreur === "Page ancienne : recharge la page\."\) \{\s*erreurDefinitive = true;\s*pageAncienne = true;\s*renderRepere\(\);\s*return;/);
  // Une séance ouverte sans rien à jouer se ferme à l'accueil (jamais en mode professeur, jamais en page ancienne).
  // (Correctif K1 : la règle a son nom, fermerSeanceFinie, appelée par l'accueil.)
  assert.match(corps("renderAccueil"), /fermerSeanceFinie\(\);/);
  assert.match(corps("fermerSeanceFinie"), /if \(MODE_PROF \|\| suiviAttendu \|\| pageAncienne \|\| !etatDuJour\(\)\.aFermer\) return;/);
});

// ------------------------------------------------------------------ 5.

test("5. la ceinture du noyau : le nœud dessiné après les pans ; rempli quart par quart ; vide", () => {
  // Lot K1b : sept ceintures — la jaune a le numéro 2 (1 avant) ; la 1 et la 3 ont deux couleurs
  // (tests/defi-calcul-lot-K1b-carte.test.mjs) ; une ceinture fermée a son pointillé dans la
  // couleur de son étage (gris pour la blanche seulement).
  const dessin = (n, o) => CORE.dessinCeinture(n, o);
  const moitie = dessin(2, {rempli: .5});
  // L'ordre des calques : fond des pans, couleur, trait ; PUIS fond du nœud, couleur, trait.
  const fonds = [...moitie.matchAll(/<g fill="#ffffff">/g)].map(m => m.index);
  const traits = [...moitie.matchAll(/<g fill="none" stroke="#143451"/g)].map(m => m.index);
  assert.equal(fonds.length, 2, "un fond pour les pans, un pour le nœud");
  assert.equal(traits.length, 2);
  assert.ok(traits[0] < fonds[1], "le trait des pans est posé AVANT le fond du nœud : il ne se voit plus à travers");
  assert.ok(moitie.indexOf('x="24.5"') > traits[0], "le nœud vient après");
  // Rempli à moitié : la couleur coupée à 32 sur 64 ; plein : sans coupe ; zéro : aucune couleur.
  const jaune = CORE.CEINTURES[2].couleur;
  assert.deepEqual([CORE.CEINTURES[2].court, jaune], ["jaune", "#f9bf3b"]);
  assert.match(moitie, /<clipPath id="mgc\d+"><rect x="0" y="0" width="32.00" height="40"\/><\/clipPath>/);
  assert.equal((moitie.match(new RegExp(`<g fill="${jaune}" clip-path="url\\(#mgc\\d+\\)">`, "g")) || []).length, 2);
  assert.ok(!dessin(2, {rempli: 1}).includes("clipPath") && dessin(2, {rempli: 1}).includes(`fill="${jaune}"`));
  assert.ok(!dessin(2, {rempli: 0}).includes(jaune) && !dessin(2, {rempli: 0}).includes("clipPath"));
  [.25, .5, .75].forEach(r => [2, 4, 1, 3].forEach(n => assert.match(dessin(n, {rempli: r}), new RegExp(`width="${(64 * r).toFixed(2)}"`))));
  // Vide : blanche dedans, au trait en pointillés — gris pour la ceinture blanche, dans la
  // couleur de l'étage pour les autres (lot K1b ; toutes grises au lot K1) ; jamais d'aplat.
  assert.match(dessin(0, {vide: true}), /stroke="#9fb4c4"[^>]*stroke-dasharray="3 2\.4"/);
  const vide = dessin(4, {vide: true});
  assert.match(vide, new RegExp(`fill="none" stroke="${CORE.CEINTURES[4].couleur}" stroke-width="2"[^>]*stroke-dasharray="3 2\\.4"`));
  assert.ok(!vide.includes(`fill="${CORE.CEINTURES[4].couleur}"`) && !vide.includes("#143451") && !vide.includes("#9fb4c4"));
  // La page : l'étage gagné plein, en cours rempli. (Lot P1 : tout est
  // ouvert — plus de ceinture vide d'un étage fermé.)
  const etage = corps("ceintureDeLEtage");
  assert.doesNotMatch(etage, /\{vide: true, taille\}/);
  assert.match(etage, /\{rempli: etage\.quarts \/ PARCOURS\.SEUILS\.ceintures\.quarts, taille\}/);
});
