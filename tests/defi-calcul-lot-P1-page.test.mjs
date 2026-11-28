// Défi calcul, lot P1 « tout ouvert » (refait, passe 2, 27/11/2026) : la
// page de l'élève, la feuille de style et le noyau, lus tels qu'ils sont
// (sans navigateur), plus le noyau joué (la sorte d'un calcul). Les écrans
// eux-mêmes sont joués au navigateur par tests/defi-calcul-lot-P1-ecrans.cjs ;
// le moteur et les données par defi-calcul-lot-P1-moteur et -donnees.
// Décisions : carte-et-cles\P1\defi-calcul-parcours-DECISIONS-26-11.md, § 8
// à 11 (planches P1-1, 2, 3, 5, 6, 7, 8, 9, options A).
//
//  1. la carte : sous chaque ceinture, « gagnée » ou « 17/33 » ; plus de
//     « Tente toute la ceinture » (bandeau, série, bilan, seuil) ; plus de
//     ceinture vide d'un étage fermé ;
//  2. la carte à l'ordinateur : les lignes ont la hauteur de l'étage le plus
//     haut (le même cadre, « Continuer » à la même place sur tous les
//     onglets) ; au téléphone, rien ;
//  3. l'accueil : « Aujourd'hui : la ligne … », les mots courts soudés ;
//     « Avant : tes N calculs du jour. » avec le vrai nombre, rien quand il
//     n'y en a pas ;
//  4. le panneau : « Plus facile » après un « Je tente » raté aujourd'hui ;
//  5. le bilan d'un « Je tente » réussi : « dans une semaine » quand le
//     moteur dit « du premier coup », sinon « demain » ;
//  6. le bilan d'un « Je tente » raté : « Continuer » d'abord, « J'apprends »
//     à côté, « Ensuite : … (plus facile) », la phrase quand il descend ; les
//     erreurs corrigées au bilan ;
//  7. « Séance terminée » en lignes ;
//  8. l'écran « Ceinture … ! » : sans « … s'ouvre » ; « Tu as fini Défi
//     calcul ! » quand toutes les ceintures sont gagnées ;
//  9. « Comment ça marche ? » : le texte choisi le 27/11 ;
// 10. Mes calculs du jour : la sorte (le noyau la numérote, la page la donne
//     au moteur), le 2e calcul de la même sorte, le retour suivant par la
//     sorte ratée, plus d'exemple au premier retour ;
// 11. les adresses de cache neuves, les copies du professeur.
// Ces tests ont été sabotés un par un (P1\refait\outils\sabotages-P1.py,
// « page ») : chaque sabotage en rougit au moins un.

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const lire = chemin => readFileSync(new URL(chemin, import.meta.url), "utf8");
const PAGE = lire("../outils/calcul_mental/defi_calcul_modules.html");
const CSS = lire("../outils/calcul_mental/defi_calcul.css");
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const CARTE = CORE.carte();
const plat = t => t.replace(/&nbsp;/g, " ").replace(/[\u00a0\u202f]/g, " ");
const JOUR = "2026-11-27";

// Le corps d'une fonction de la page (de « function nom( » à la suivante).
const corps = nom => {
  const debut = PAGE.indexOf(`function ${nom}(`);
  assert.ok(debut >= 0, `la page a ${nom}`);
  const suite = PAGE.slice(debut + 10).search(/\n {6}(?:async )?function |\n {6}const [A-Za-z_]+ = /);
  return PAGE.slice(debut, suite < 0 ? undefined : debut + 10 + suite);
};
// Les niveaux construits.
const NIVEAUX = CORE.MODULES.filter(m => m.construit).flatMap(m => m.niveaux.map(n => `${m.id}-${n.n}`));

test("1. la carte : « gagnée » ou « 17/33 » sous chaque ceinture ; plus de « Tente toute la ceinture » ni d'étage fermé", () => {
  const carte = corps("renderCarte");
  assert.ok(carte.includes('mot.textContent = e.ceinture ? "gagnée" : `${e.etoiles}/${e.total}`;'), "le compte sous la ceinture");
  assert.ok(!/"en cours"|: "fermée"/.test(carte), "plus de « en cours » ni de « fermée » sous les ceintures");
  for (const parti of ["carte-tente", "lancerTestCeinture", "renderBilanCeinture", "calculsDuTestDeCeinture", "appliquerTestCeinture", "SEUILS.ceinture.", "Tu sais déjà tout ça", "Toute la ceinture"]) {
    assert.ok(!PAGE.includes(parti), `${parti} : parti de la page`);
  }
  assert.ok(!/genre === "ceinture"|genre: "ceinture"/.test(PAGE), "plus de série « ceinture »");
  assert.ok(!/\.ck-tente/.test(CSS), "la règle du bandeau est partie de la feuille");
  const ceinture = corps("ceintureDeLEtage");
  assert.ok(!ceinture.includes("vide: true"), "plus de ceinture vide d'un étage fermé");
  assert.ok(!/\.ouvert\b/.test(ceinture), "la ceinture ne lit plus « ouvert »");
});

test("2. la carte à l'ordinateur : les lignes à la hauteur de l'étage le plus haut ; rien au téléphone", () => {
  const poser = corps("poserLignes");
  assert.ok(poser.includes('zone.style.minHeight = "";'), "la hauteur est remise à zéro à chaque fois");
  assert.ok(poser.includes("window.innerWidth > ECHELLE.telephone"), "hors téléphone seulement");
  assert.ok(/carte\.etages\.forEach\(e => \{\s*zone\.replaceChildren\(\.\.\.lignesDe\(e\)\);\s*haute = Math\.max\(haute, zone\.offsetHeight\);/.test(poser), "chaque étage mesuré");
  assert.ok(poser.includes("zone.style.minHeight = `${haute}px`;"), "la plus grande hauteur gardée");
  assert.ok(/if \(haute > 0\) zone\.style\.minHeight = `\$\{haute\}px`;\s*\}\s*zone\.replaceChildren\(\.\.\.lignesDe\(etage\)\);\s*\}/.test(poser), "l'étage affiché posé en dernier");
  assert.ok(corps("renderCarte").includes("poserLignes(carte, etage, lignesDe);"));
  // Les lignes restent serrées en haut : la place en trop est dessous.
  assert.match(CSS, /\.ck-lignes \{ display: grid; align-content: start;/);
});

test("3. l'accueil : « Aujourd'hui : la ligne … », les mots courts soudés ; « Avant : tes N calculs du jour. »", () => {
  const but = corps("texteBut");
  assert.ok(but.includes("soude(`Aujourd’hui : la ligne ${soudeCourts(but.ligne)}`)"));
  assert.ok(!PAGE.includes("Aujourd’hui : l’étoile"), "plus « l'étoile … »");
  // La soudure des mots courts, jouée.
  const m = PAGE.match(/const soudeCourts = texte => (String\(texte\)\.replace\([^\n]*\));/);
  assert.ok(m, "soudeCourts");
  const soudeCourts = new Function("texte", `return ${m[1]};`);
  assert.equal(soudeCourts("Décimaux : + et −"), "Décimaux : + et −");
  assert.equal(soudeCourts("Jusqu’à 20"), "Jusqu’à 20");
  assert.equal(soudeCourts("Doubles et moitiés"), "Doubles et moitiés");
  // « Avant : … » : le vrai nombre, rien quand il n'y en a pas.
  const accueil = corps("renderAccueil");
  assert.ok(accueil.includes('$("acc-but-avant").textContent = s.obligatoire ? texteAvant(s.obligatoire) : "";'));
  assert.ok(accueil.includes('$("acc-but-avant").hidden = !s.obligatoire;'));
  const avant = PAGE.match(/const texteAvant = n => (soude\([^\n]*\));/);
  assert.ok(avant);
  const texteAvant = new Function("n", "soude", `return ${avant[1]};`);
  assert.equal(texteAvant(6, t => t), "Avant : tes 6 calculs du jour.");
  assert.equal(texteAvant(1, t => t), "Avant : ton calcul du jour.");
  // Le but rendu par le moteur porte le nom de la ligne ; un élève neuf (tout
  // gagné du premier coup, la première semaine) n'a aucun calcul du jour.
  let p = P.creerParcours();
  const s0 = P.etatSeance(p, CARTE, {aujourdhui: JOUR});
  assert.equal(s0.but.ligne, "Jusqu’à 20");
  const six = Array.from({length: 6}, () => ({juste: true, ms: 1500}));
  for (let jour = 0; jour < 6; jour += 1) {
    const J = P.ajouterJours(JOUR, jour);
    for (let k = 0; k < 4; k += 1) {
      const c = P.etatSeance(p, CARTE, {aujourdhui: J}).continuer;
      if (c.type !== "etoile") break;
      p = P.appliquerTentative(p, {module: c.module, niveau: c.niveau, reponses: six}, {aujourdhui: J, carte: CARTE}).parcours;
    }
    assert.equal(P.etatSeance(p, CARTE, {aujourdhui: P.ajouterJours(J, 1)}).obligatoire, 0, `jour ${jour + 2} : aucun calcul du jour`);
  }
});

test("4. le panneau : « Plus facile » après un « Je tente » raté aujourd'hui, avec le nom de l'étoile ; il ouvre son panneau", () => {
  const panneau = corps("ouvrirPanneau");
  assert.ok(panneau.includes("facile = PARCOURS.plusFacile(parcours, CARTE, id, n, optionsSeance());"));
  assert.ok(/if \(e\.tente === "aujourdhui"\) \{[^}]*Tu pourras retenter demain\.[^}]*facile = PARCOURS\.plusFacile/.test(panneau), "seulement après un « Je tente » raté aujourd'hui");
  assert.ok(panneau.includes('boutons.push(["Plus facile", nomCompetence(facile.module, facile.niveau), "secondary", () => ouvrirPlusFacile(facile)]);'));
  const ouvrir = corps("ouvrirPlusFacile");
  assert.ok(ouvrir.includes("ouvrirPanneau(cible.module, cible.niveau, bouton);"));
  // Le moteur, joué : « Demis et quarts, avec 3/4 » raté → une étoile plus facile.
  let p = P.creerParcours();
  const c = P.etatSeance(p, CARTE, {aujourdhui: JOUR}).continuer;
  p = P.appliquerTentative(p, {module: c.module, niveau: c.niveau, reponses: [{juste: false}, {juste: false}]}, {aujourdhui: JOUR, carte: CARTE}).parcours;
  assert.equal(P.etatEtoile(p, CARTE, c.module, c.niveau, {aujourdhui: JOUR}).tente, "aujourdhui");
});

test("5. « Je tente » réussi : « dans une semaine » quand l'étoile est gagnée du premier coup, sinon « demain »", () => {
  const bilan = corps("renderBilanTente");
  assert.ok(bilan.includes('const gain = (suivi.evenements || []).find(e => e.type === "gagnee" && e.module === serie.module && e.niveau === serie.niveau);'));
  assert.ok(bilan.includes('const quand = gain && gain.duPremierCoup ? "Elle reviendra dans une semaine dans tes calculs du jour." : "Elle reviendra demain dans tes calculs du jour.";'));
  assert.ok(bilan.includes("texte: `${suivi.justes} justes sur ${suivi.total}. ${quand}`"));
  // Après J'apprends, « … revient demain. » ne change pas.
  assert.ok(PAGE.includes("{reussi: `${nomCompetence(serie.module, serie.niveau)} revient demain.`"));
  // Le moteur : du premier coup, puis après un raté.
  const six = Array.from({length: 6}, () => ({juste: true, ms: 1500}));
  let p = P.creerParcours();
  const c = P.etatSeance(p, CARTE, {aujourdhui: JOUR}).continuer;
  const r1 = P.appliquerTentative(p, {module: c.module, niveau: c.niveau, reponses: six}, {aujourdhui: JOUR, carte: CARTE});
  assert.equal(r1.evenements.find(e => e.type === "gagnee").duPremierCoup, true);
  p = P.appliquerTentative(P.creerParcours(), {module: c.module, niveau: c.niveau, reponses: [{juste: false}, {juste: false}]}, {aujourdhui: JOUR, carte: CARTE}).parcours;
  const r2 = P.appliquerTentative(p, {module: c.module, niveau: c.niveau, reponses: six}, {aujourdhui: P.ajouterJours(JOUR, 1), carte: CARTE});
  assert.equal(r2.evenements.find(e => e.type === "gagnee").duPremierCoup, false);
});

test("6. « Je tente » raté : « Continuer » d'abord, « J'apprends » à côté, « Ensuite : … (plus facile) », la phrase ; les erreurs au bilan", () => {
  const bilan = corps("renderBilanTente");
  assert.ok(bilan.includes('basDeBilan(fin, ["Continuer", "primary", continuerSeance], ["J’apprends", "secondary", apprendre])'));
  assert.ok(bilan.includes('const facile = etoile && c.raison === "plusFacile";'));
  assert.ok(bilan.includes('if (facile) carteR.append(phrase(soude("On cherche par où commencer : «\\u00a0Continuer\\u00a0» te propose plus facile.")));'), "les guillemets soudés à « Continuer »");
  // (Lot « la 6e complète » : le nom s'écrit avec ses fractions ; ecrireAvecFractions soude le texte.)
  assert.ok(bilan.includes('ecrireAvecFractions(ensuite, `Ensuite : ${nomCompetence(c.module, c.niveau)}${facile ? " (plus\\u00a0facile)" : ""}`);'), "« (plus facile) » jamais coupé");
  assert.ok(bilan.includes("const etoile = !fin && c.type === \"etoile\";"), "rien de plus quand la séance est finie");
  // Les erreurs de « Je tente » : rien pendant le test, corrigées au bilan.
  const suite = corps("suiteDuBilan");
  assert.ok(/if \(arrete\) \$\("corrections"\)\.replaceChildren\(\);\s*else renderCorrections\(serie\);/.test(suite));
  assert.ok(!/genre === "tente"[^\n]*\$\("corrections"\)\.replaceChildren/.test(suite), "« Je tente » n'efface plus les corrections");
  assert.ok(corps("montrerRetour").includes('const auTest = serie.genre === "tente";'), "pendant le test, ✓ ou ✗ seulement");
  assert.match(CSS, /\.ck-ensuite \{[^}]*text-align: center;/);
});

test("7. « Séance terminée » en lignes : ✓ Mes calculs du jour (« 9 retrouvés sur 10 »), les ceintures, « N étoiles gagnées »", () => {
  const fin = corps("renderFinDeSeance");
  assert.ok(fin.includes('morceaux.push(ligneDeFin(coche, "Mes calculs du jour", `${retrouves.justes} ${retrouves.justes > 1 ? "retrouvés" : "retrouvé"} sur ${retrouves.total}`, large));'));
  assert.ok(fin.includes("`${nomCeinture(n)} gagnée`, `Les ${etage ? etage.total : \"\"} étoiles.`, large)"));
  // Plus de 4 étoiles : deux colonnes à l'ordinateur (le cadre tient entier à 1366 × 657).
  assert.ok(fin.includes("const large = gagnees.length > FIN_LARGE;"));
  assert.ok(PAGE.includes("const FIN_LARGE = 4;"));
  assert.match(CSS, /@media \(min-width: 621px\) \{\s*\.ck-fin-ligne\.large, \.ck-liste\.large \{ max-width: 660px; \}\s*\.ck-liste\.large \{ grid-template-columns: 1fr 1fr; \}/);
  assert.ok(fin.includes('titre.textContent = soude(`${gagnees.length} ${gagnees.length > 1 ? "étoiles gagnées" : "étoile gagnée"}`);'));
  // L'ordre : les calculs du jour, les ceintures, les étoiles, le but, les boutons.
  // (Chaque morceau est posé sans condition de plus que la sienne.)
  assert.match(fin, /if \(retrouves && retrouves\.total > 0\) \{\n(?:\s+[^\n]*\n){4}\s+morceaux\.push\(ligneDeFin\(coche, "Mes calculs du jour"/);
  const ordre = ["Mes calculs du jour", "gagnée`", "étoiles gagnées", "texteBut(but)", "Encore une séance"].map(t => fin.indexOf(t));
  assert.deepEqual([...ordre].sort((a, b) => a - b), ordre);
  assert.ok(ordre.every(i => i > 0));
  // La page compte ce que la séance a retrouvé (un retour réglé, pas raté) et ses ceintures.
  const noter = corps("noterRetour");
  assert.ok(/if \(m\.regle && !m\.perime && state\.seance\) \{[\s\S]*?r\.total \+= 1;\s*if \(!m\.rate\) r\.justes \+= 1;\s*garderRetrouves\(r\);/.test(noter));
  assert.ok(corps("finish").includes("noterCeintures(gagnees);"));
  // (Correctif P1 : le compte repris dans l'onglet après un rechargement.)
  assert.ok(corps("nouvelleSeance").includes("retrouves: retrouvesGardes(), ceintures: []"));
  assert.match(CSS, /\.ck-fin-ligne \{ display: flex;/);
});

test("8. l'écran « Ceinture … ! » : sans « … s'ouvre » ; « Tu as fini Défi calcul ! » quand toutes les ceintures sont gagnées", () => {
  const ecran = corps("montrerCeintures");
  assert.ok(ecran.includes('$("ceinture-phrase").textContent = soude(`Tu as gagné les ${total} étoiles.`);'));
  assert.ok(!/s’ouvre|s'ouvre\./.test(ecran.replace(/\/\/.*$/gm, "")));
  assert.ok(ecran.includes("const derniere = liste.length === 1 && !suivante && carte.etages.every(e => e.ceinture || e.etage === n);"));
  assert.ok(ecran.includes("const suivante = pasGagnees.find(e => e.etage > n) || pasGagnees[0] || null;"), "« Ceinture suivante » : la prochaine pas gagnée");
  assert.ok(!PAGE.includes("s’ouvre."), "nulle part dans la page");
});

test("9. « Comment ça marche ? » : le texte choisi le 27/11 (planche P1-9 A)", () => {
  const notice = plat(PAGE.slice(PAGE.indexOf('<div class="notice">'), PAGE.indexOf("</div>", PAGE.indexOf('<div class="notice">'))));
  for (const phrase of [
    "« Continuer » me dit quoi faire ; si c’est trop dur, il me propose plus facile. Je peux refaire une séance si je veux.",
    "Mes étoiles reviennent pour voir si elles tiennent. Gagnée du premier coup : dans une semaine. Apprise : demain, puis dans 3 jours, 7 jours… Un calcul faux ? Un autre du même genre. Deux faux : l’étoile revient demain ; encore deux faux, elle part, et je peux la regagner quand je veux.",
    "6 calculs sans aide. 5 justes : l’étoile est à moi. Raté ? Je peux essayer plus facile, ou apprendre.",
    "On me montre, puis je fais avec l’aide ; c’est réussi à 5 justes sur les 6 derniers, sans aide. Ici, se tromper ne compte pas.",
    "Tout est ouvert. Une ceinture est à moi quand j’ai toutes ses étoiles. Six ceintures, de la blanche-jaune à la bleue, à gagner dans l’ordre que je veux."
  ]) assert.ok(notice.includes(phrase), phrase.slice(0, 50));
  assert.ok(!/Tente toute|s’ouvre|Ma classe/.test(notice));
});

test("10. Mes calculs du jour : la sorte numérotée par le noyau et donnée au moteur ; le 2e calcul de la même sorte ; plus d'exemple au premier retour", () => {
  // La page.
  assert.ok(corps("noterRetour").includes("sorte: CORE.numeroDeSorte(calcul)"));
  const serie = corps("repondreSerie");
  assert.ok(serie.includes("{autreQue: question.calcul, memeSorte: true}"), "le 2e calcul, tout de suite après le faux");
  const jour = corps("lancerCalculsDuJour");
  assert.ok(jour.includes("{tour: tour + rang, sorte: tire.sorte || 0}"), "le retour commence par la sorte rendue par le moteur");
  assert.ok(jour.includes("{autreQue: premierCalcul(tire, tire.premierLe || aujourdhui), memeSorte: true}"), "le 2e calcul qui attendait");
  assert.ok(!PAGE.includes("premierRetourSansLecon"), "la page ne demande plus l'exemple du premier retour");
  assert.ok(/if \(jour\) return false;/.test(corps("poserExemple")));
  // Le noyau : chaque niveau construit a ses sortes numérotées (1 à 60).
  for (const cle of NIVEAUX) {
    const sortes = CORE.sortesNumerotees(cle);
    assert.ok(sortes.length >= 1 && sortes.length <= CORE.SORTES_MAX, `${cle} : ${sortes.length} sortes`);
    assert.equal(CORE.sortesNumerotees(cle), sortes, "gardées");
  }
  assert.equal(CORE.SORTES_MAX, P.SEUILS.sortes, "le noyau et le moteur ont la même borne");
  // Joué sur tous les niveaux : un calcul a son numéro ; le 2e calcul est de
  // la même sorte avec d'autres nombres ; `sorte` rend un calcul de cette
  // sorte ; le même jour, `sorte` et `tour` donnent le même calcul.
  let joues = 0;
  for (const cle of NIVEAUX) {
    for (let g = 1; g <= 4; g += 1) {
      const premier = CORE.genererUn(cle, g * 8191, {tour: g * 3});
      if (!premier) continue;
      joues += 1;
      const k = CORE.numeroDeSorte(premier);
      assert.ok(k >= 1 && k <= CORE.SORTES_MAX, `${cle} : ${premier.texte} a un numéro`);
      const second = CORE.genererUn(cle, g * 977, {autreQue: premier, memeSorte: true});
      assert.equal(CORE.numeroDeSorte(second), k, `${cle} : le 2e calcul de la même sorte (${premier.texte} → ${second.texte})`);
      assert.notEqual(second.texte, premier.texte, `${cle} : d'autres nombres`);
      assert.equal(CORE.numeroDeSorte(CORE.genererUn(cle, g * 31, {sorte: k})), k, `${cle} : la sorte imposée`);
      assert.equal(CORE.genererUn(cle, g * 8191, {tour: g * 3, sorte: k}).texte, premier.texte, `${cle} : le même calcul le même jour`);
    }
  }
  assert.ok(joues > 400, `${joues} calculs joués`);
  // Sans `memeSorte`, `autreQue` garde l'ancien sens (une autre sorte quand il y en a une).
  const a = CORE.genererUn("A3-4", 5, {tour: 0});
  const b = CORE.genererUn("A3-4", 6, {autreQue: a});
  assert.notEqual(CORE.sorteDe(b), CORE.sorteDe(a));
  // Le moteur garde la sorte et la rend au retour suivant.
  const six = Array.from({length: 6}, () => ({juste: true, ms: 1500}));
  let p = P.appliquerTentative(P.creerParcours(), {module: "A1", niveau: 1, reponses: six}, {aujourdhui: JOUR, carte: CARTE}).parcours;
  const J = P.ajouterJours(JOUR, 7);
  const [tire] = P.tirerCalculsDuJour(p, CARTE, {aujourdhui: J});
  assert.equal(tire.sorte, 0);
  const calcul = CORE.genererUn("A1-1", 3, {tour: 4});
  const sorte = CORE.numeroDeSorte(calcul);
  p = P.appliquerRetour(p, {module: "A1", niveau: 1, juste: false, ms: 3000, sorte}, {aujourdhui: J, carte: CARTE}).parcours;
  assert.equal(P.tirerCalculsDuJour(p, CARTE, {aujourdhui: J})[0].sorte, sorte, "le 2e calcul : la sorte du premier");
  p = P.appliquerRetour(p, {module: "A1", niveau: 1, juste: false, ms: 3000, sorte}, {aujourdhui: J, carte: CARTE}).parcours;
  const lendemain = P.tirerCalculsDuJour(p, CARTE, {aujourdhui: P.ajouterJours(J, 1)});
  assert.equal(lendemain[0].sorte, sorte, "la règle B : le retour du lendemain commence par la sorte ratée");
  assert.equal(CORE.numeroDeSorte(CORE.genererUn("A1-1", 99, {tour: 12, sorte: lendemain[0].sorte})), sorte);
});

test("11. les adresses de cache neuves ; les copies du professeur, octet pour octet", () => {
  assert.match(PAGE, /<link rel="stylesheet" href="\.\/defi_calcul\.css\?v=20261127-2">/);
  assert.match(PAGE, /<script src="\.\/defi_calcul_core\.js\?v=20261127-2"><\/script>/);
  assert.match(PAGE, /<script src="\.\/defi_calcul_mon_parcours\.js\?v=20261127-2"><\/script>/);
  for (const vieux of ["defi_calcul_core.js?v=20261126-2", "defi_calcul_mon_parcours.js?v=20261126-2", "defi_calcul.css?v=20261126-2"]) {
    assert.ok(!PAGE.includes(vieux), `${vieux} : l'ancienne adresse est partie`);
  }
  assert.equal(lire("../_serveur/public/prof/defi_calcul_core.js"), lire("../outils/calcul_mental/defi_calcul_core.js"));
  assert.equal(lire("../_serveur/public/prof/defi_calcul_mon_parcours.js"), lire("../outils/calcul_mental/defi_calcul_mon_parcours.js"));
  // La page ne passe aucune classe au moteur.
  assert.ok(!/classe/.test(corps("optionsSeance")));
  assert.ok(!PAGE.includes("definirClasse"));
});
