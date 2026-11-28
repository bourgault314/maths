import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";
import {createRequire} from "node:module";

// Défi calcul, lot 2b (31/10/2026) — Défi calcul dans « Ma classe » et dans
// Mon espace.
//
// Décisions de Gwenaël (05/10, puis planches du 31/10) : la page compte les
// compétences sues sur ce que l'appli propose (les modules construits : 14
// aujourd'hui), l'élève sur toute la carte (129) ; « À reprendre en classe »
// liste une compétence rouge chez au moins 2 élèves, ou mise de côté chez un
// seul ; la fenêtre d'un élève montre ses compétences palier par palier, ce
// qui coince chez lui et pourquoi (cause la plus fréquente + un exemple
// REGÉNÉRÉ depuis la fiche du module, jamais un calcul d'élève), ses erreurs,
// sa semaine ; deux feuilles en noir et blanc ; la tuile de Mon espace : une
// jauge et « N compétences sues sur 129 », rien tant qu'aucune n'est sue.
//
// Lot K2 « le professeur » (28/11/2026, planches K2-3, K2-4, K2-6) : l'onglet
// est refait sur les étoiles — « À aider » (avec les prénoms : chaque élève
// une fois, pour sa raison la plus forte), « À reprendre en classe » (les
// erreurs les plus fréquentes, ce que l'appli dit à l'élève ; les étoiles qui
// résistent), « Où en est chacun » (la grille), le tableau (« Étoiles », « À
// surveiller »), la fiche et ses feuilles dans les mots de la grille.
//
// Ces tests EXÉCUTENT les fonctions pures de la page avec les VRAIS moteurs
// servis par le serveur (prof/defi_calcul_core.js, prof/defi_calcul_mon_parcours.js).

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = chemin => readFileSync(join(racine, chemin), "utf8");
const page = lire("_serveur/public/prof/index.php");
// Les commentaires (et leurs apostrophes) ne gênent pas l'extraction des constantes.
const espace = lire("_serveur/public/index.php").replace(/^\s*\/\/.*$/gm, "");
const BALISE = '<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">';
const script = (() => {
  const debut = page.indexOf(BALISE);
  const fin = page.indexOf("</script>", debut);
  assert.ok(debut > 0 && fin > debut, "le script en ligne doit être trouvé");
  return page.slice(debut, fin);
})();
const exiger = createRequire(import.meta.url);
const CALCUL_CORE = exiger(join(racine, "_serveur/public/prof/defi_calcul_core.js"));
const CALCUL = exiger(join(racine, "_serveur/public/prof/defi_calcul_mon_parcours.js"));

function blocDepuis(source, position) {
  const ouvre = source.indexOf("{", position);
  let profondeur = 0;
  for (let i = ouvre; i < source.length; i += 1) {
    if (source[i] === "{") profondeur += 1;
    else if (source[i] === "}") {
      profondeur -= 1;
      if (profondeur === 0) return source.slice(position, i + 1);
    }
  }
  throw new Error("bloc non fermé");
}

function fonction(nom, source = script) {
  const motif = new RegExp(`(?:async )?function ${nom}\\(`);
  const m = motif.exec(source);
  assert.ok(m, `la page doit définir ${nom}()`);
  return blocDepuis(source, m.index);
}

function constante(nom, source = script) {
  const position = source.indexOf(`const ${nom} = `);
  assert.ok(position > 0, `la page doit définir ${nom}`);
  const debut = position + `const ${nom} = `.length;
  let i = debut, profondeur = 0, dansTexte = "";
  for (; i < source.length; i += 1) {
    const c = source[i];
    if (dansTexte) { if (c === dansTexte && source[i - 1] !== "\\") dansTexte = ""; continue; }
    if (c === '"' || c === "'" || c === "`") { dansTexte = c; continue; }
    if ("[{(".includes(c)) profondeur += 1;
    else if ("]})".includes(c)) profondeur -= 1;
    else if (c === ";" && profondeur === 0) break;
  }
  return source.slice(position, i + 1);
}

const sectionCalcul = script.slice(script.indexOf("// ------------------------------------------------------- l'onglet Défi calcul"),
  script.indexOf("// ---------------------------------------------------------------- feuille imprimée"));

// Les fonctions pures de l'onglet, exécutées avec les vrais moteurs et un
// document de poche (createElement minimal, textContent seulement).
function noeud(tag) {
  const n = {tag, enfants: [], className: "", _texte: "", attributs: {}, title: "", href: "", target: "", rel: "",
    append(...e) { e.forEach(x => this.enfants.push(typeof x === "string" ? {tag: "#texte", _texte: x, enfants: []} : x)); },
    get textContent() { return this._texte + this.enfants.map(e => e.textContent).join(""); },
    set textContent(v) { this._texte = String(v); this.enfants = []; },
    setAttribute(k, v) { this.attributs[k] = v; }
  };
  return n;
}
const document = {createElement: noeud, createTextNode: t => ({tag: "#texte", _texte: String(t), enfants: [], get textContent() { return this._texte; }})};
const fabrique = new Function("CALCUL_CORE", "CALCUL", "document", "eleves", `
  ${constante("APPLI_CALCUL", sectionCalcul)}
  ${constante("ETATS_GRILLE", sectionCalcul)}
  ${constante("MOTS_GRILLE", sectionCalcul)}
  ${constante("SIGNES_GRILLE", sectionCalcul)}
  ${constante("gagneeGrille", sectionCalcul)}
  ${constante("CLASSES_ETAGES", sectionCalcul)}
  ${constante("AIDER", sectionCalcul)}
  ${constante("RESISTE", sectionCalcul)}
  ${constante("ETOILE_VIDE", sectionCalcul)}
  ${constante("majuscule", sectionCalcul)}
  ${constante("etoilesDuPlan", sectionCalcul)}
  ${constante("etoileDe", sectionCalcul)}
  const exemplesCalcul = new Map();
  const grillesLues = new WeakMap();
  let planGrilleCalcul = null;
  const ordreDeLaFeuille = liste => liste;
  const elevesDeLOnglet = () => eleves;
  ${fonction("nomCompetenceCalcul", sectionCalcul)}
  ${fonction("nomModuleCalcul", sectionCalcul)}
  ${fonction("nomPalierCalcul", sectionCalcul)}
  ${fonction("nomCauseCalcul", sectionCalcul)}
  ${fonction("exempleErreur", sectionCalcul)}
  ${fonction("retourDeLErreur", sectionCalcul)}
  ${fonction("candidatsErreur", sectionCalcul)}
  ${fonction("lienOuvrirEnClasse", sectionCalcul)}
  ${fonction("planCalcul", sectionCalcul)}
  ${fonction("grilleDe", sectionCalcul)}
  ${fonction("compteEtoiles", sectionCalcul)}
  ${fonction("raisonsAider", sectionCalcul)}
  ${fonction("texteRaison", sectionCalcul)}
  ${fonction("aiderCalcul", sectionCalcul)}
  ${fonction("erreursFrequentesCalcul", sectionCalcul)}
  ${fonction("niveauAReprendre", sectionCalcul)}
  ${fonction("etoilesQuiResistent", sectionCalcul)}
  ${fonction("detailResiste", sectionCalcul)}
  ${fonction("suiteCalcul", sectionCalcul)}
  ${fonction("nomCourtPalier", sectionCalcul)}
  ${fonction("jourCourtCalcul", sectionCalcul)}
  return {nomCompetenceCalcul, nomModuleCalcul, nomPalierCalcul, nomCauseCalcul, exempleErreur, candidatsErreur, lienOuvrirEnClasse,
    planCalcul, etoilesDuPlan, etoileDe, compteEtoiles, raisonsAider, texteRaison, aiderCalcul, erreursFrequentesCalcul, niveauAReprendre,
    etoilesQuiResistent, detailResiste, suiteCalcul, nomCourtPalier, jourCourtCalcul, ETATS_GRILLE, MOTS_GRILLE, SIGNES_GRILLE};
`);
const outils = eleves => fabrique(CALCUL_CORE, CALCUL, document, eleves);
const CARTE = CALCUL_CORE.carte();
const JOUR = "2026-11-27";

test("APPLIS, l'onglet, l'en-tête, les tris, le lecteur, le chargement des deux moteurs, la fenêtre, les feuilles", () => {
  const APPLIS = new Function(`${constante("APPLIS")}\nreturn APPLIS;`)();
  assert.deepEqual(APPLIS[3], {cle: "defi-calcul", nom: "Défi calcul", unite: ["séance", "séances"]}, "après Anzan, comme au catalogue");
  assert.match(page, /<button type="button" data-appli="flash-anzan" aria-pressed="false">Anzan<\/button>\s*<button type="button" data-appli="defi-calcul" aria-pressed="false">Défi calcul<\/button>\s*<button type="button" data-appli="splat"/);
  const entete = page.slice(page.indexOf('<tr id="entete-defi-calcul" hidden>'), page.indexOf("</tr>", page.indexOf('<tr id="entete-defi-calcul" hidden>')));
  assert.deepEqual([...entete.matchAll(/<th(?: class="([\w-]+)")?>(?:<button type="button" data-tri="(\w+)">)?([^<]*)/g)].map(m => `${m[3]}${m[2] ? `:${m[2]}` : ""}${m[1] ? ` (${m[1]})` : ""}`),
    // Lot 4 « les ceintures » : la colonne « Ceinture », cachée au téléphone.
    // Lot K2 : « Étoiles » et « À surveiller ».
    ["Élève:prenom", "Ceinture:ceinture (large)", "Étoiles:etoiles", "À surveiller:surveiller (large)", "Séances · 4 semaines:seances (large)", "Dernière activité:date", "", " (fin)"],
    "au téléphone : l'élève, les étoiles, le dernier jour");
  const TRIS = new Function(`${constante("TRIS")}\nreturn TRIS;`)();
  assert.deepEqual(TRIS["defi-calcul"], ["prenom", "ceinture", "etoiles", "surveiller", "seances", "date"]);
  assert.match(fonction("elevesLus"), /cle === "defi-calcul" \? lireCalcul/);
  assert.match(fonction("dessinerTableau"), /if \(appliAffichee === "defi-calcul"\) \{ dessinerTableauCalcul\(corps, ecriture, lignes\); fin\(\); return; \}/);
  assert.match(fonction("chargerMoteurDe"), /if \(cle === "defi-calcul"\) return chargerMoteurCalcul\(\);/);
  assert.match(fonction("chargerMoteurCalcul"), /charger\(MOTEUR_CALCUL_CORE, "MATHSGO_DEFI_CALCUL_CORE"\)[\s\S]*charger\(MOTEUR_CALCUL, "MATHSGO_DEFI_CALCUL_MON_PARCOURS"\)/, "le noyau d'abord, puis la progression");
  assert.match(script, /const MOTEUR_CALCUL_CORE = "defi_calcul_core\.js\?v=<\?= htmlspecialchars\(\$versionCalculCore, ENT_QUOTES\) \?>";/);
  assert.match(script, /const MOTEUR_CALCUL = "defi_calcul_mon_parcours\.js\?v=<\?= htmlspecialchars\(\$versionCalcul, ENT_QUOTES\) \?>";/);
  assert.match(page, /\$versionCalculCore = is_file\(\$moteurCalculCore\) \? substr\(md5_file\(\$moteurCalculCore\), 0, 10\) : '0';/);
  assert.match(page, /\$versionCalcul = is_file\(\$moteurCalcul\) \? substr\(md5_file\(\$moteurCalcul\), 0, 10\) : '0';/);
  assert.doesNotMatch(page, /<script src="defi_calcul/, "pas chargés d'office");
  assert.match(fonction("poserAppli"), /\$\("entete-defi-calcul"\)\.hidden = !calcul;/);
  assert.match(fonction("dessinerFenetreEleve"), /else if \(appli === "defi-calcul"\) zone\.append\(contenuCalcul\(eleve\)\);/, "lot S2 : l'onglet Défi calcul de la fiche");
  assert.match(page, /<button type="button" id="dc-imprimer" hidden>Imprimer sa fiche<\/button>/);
  assert.match(page, /<button type="button" class="secondaire" id="dc-imprimer-grille"[^>]*hidden>Imprimer la grille<\/button>/);
  assert.match(page, /<div class="carte dc-reprendre" id="dc-reprendre" hidden>/);
  assert.match(page, /<div class="fiche-defi-calcul" id="fiche-defi-calcul">/);
  assert.match(page, /<div class="grille-defi-calcul" id="grille-defi-calcul">/);
  // À l'impression : la feuille seule, la fenêtre ne sort pas, la note d'impression non plus.
  assert.match(page, /body\.imprime-defi-calcul \.fiche-defi-calcul, body\.imprime-defi-calcul-grille \.grille-defi-calcul \{ display: block; \}/);
  assert.match(page, /body\.imprime-defi-calcul dialog, body\.imprime-defi-calcul-grille dialog \{ display: none !important; \}/);
  assert.match(page, /#ecran-classe > \*:not\(\.fiche\):not\(\.bandelettes\):not\(\.note-impression\):not\(\.fiche-anzan\):not\(\.fiche-defi-calcul\):not\(\.grille-defi-calcul\) \{ display: none !important; \}/);
  assert.match(constante("MODES_IMPRESSION"), /"imprime-defi-calcul", "imprime-defi-calcul-grille"/);
  // Relecture Codex : la grille sort en A4 paysage, ses titres passent à la
  // ligne ; dans la fiche, une compétence par ligne (rien de large en nowrap).
  assert.match(page, /\.grille-defi-calcul \{ page: grille-defi-calcul; \}\s*@page grille-defi-calcul \{ size: A4 landscape; margin: 12mm; \}/);
  assert.match(page, /\.grille-defi-calcul th\.fd-mod \{ white-space: normal; font-weight: 700; \}/);
  assert.match(page, /\.fiche-defi-calcul td\.fd-etats span \{ display: block; \}/);
  assert.doesNotMatch(page, /\.fiche-defi-calcul td\.fd-etats \{ white-space: nowrap; \}/);
  assert.match(fonction("remplirFicheCalcul"), /td\.append\(el\("span", "", `\$\{SIGNES_GRILLE\[etoileDe\(lu, x\.cle\)\.etat\]\} /, "une étoile par ligne, avec son signe");
  // Relecture Codex : une liste lue sans son moteur est relue quand le moteur arrive.
  assert.match(fonction("afficherAppli"), /if \(tableaux\[cle\] && tableaux\[cle\]\.some\(eleve => eleve\.parcours && eleve\.lu && eleve\.lu\.lisible === false\)\) \{\s*tableaux\[cle\] = elevesLus\(cle, tableaux\[cle\]\);/);
  // Les deux feuilles portent le logo et la signature, une fois chacune.
  for (const id of ["fiche-defi-calcul", "grille-defi-calcul"]) {
    const feuille = page.slice(page.indexOf(`id="${id}">`), page.indexOf("</div>\n    </div>", page.indexOf(`id="${id}">`)));
    assert.equal([...feuille.matchAll(/mathsgo-logo-print\.png/g)].length, 1, `${id} : un seul logo`);
    assert.match(feuille, /mathsgo\.re · CC BY-NC-SA 4\.0/);
  }
  // Rien par innerHTML dans l'onglet, aucun code d'élève écrit.
  assert.doesNotMatch(sectionCalcul, /innerHTML/);
  assert.doesNotMatch(sectionCalcul, /eleve\.code|celluleCode/);
  // Aucun total écrit en dur : 129 et 14 viennent du moteur.
  assert.doesNotMatch(sectionCalcul.replace(/\/\/.*$/gm, ""), /\b129\b|\b14\b/);
});

// Lot 4 « les ceintures » (14/11/2026) : la ceinture devant le compte, et le
// compte sur ce que l'appli propose (les modules construits, 95), jusqu'au
// palier réglé pour l'élève — plus sur les 125 de la carte.
test("Mon espace : la tuile Défi calcul charge le noyau puis le moteur, et dit « Ceinture blanche-jaune · N étoiles sur 14 » dès la première (lot K1 ; lot K1b : six étages)", () => {
  const JAUGES = new Function("window", `${constante("JAUGES", espace)}\nreturn JAUGES;`.replace(/<\?= .*? \?>/g, "x"))({MATHSGO_DEFI_CALCUL_CORE: CALCUL_CORE});
  const jauge = JAUGES["defi-calcul"];
  assert.deepEqual(jauge.avant, {url: "prof/defi_calcul_core.js?v=x", global: "MATHSGO_DEFI_CALCUL_CORE"});
  assert.equal(jauge.url, "prof/defi_calcul_mon_parcours.js?v=x");
  assert.equal(jauge.global, "MATHSGO_DEFI_CALCUL_MON_PARCOURS");
  assert.equal(jauge.lecteur(CALCUL, null), null, "rien reçu : pas de jauge");
  // Lot K1 : le compte est celui de l'accueil de l'appli (les étoiles de
  // l'étage en cours) ; la ceinture de cet étage, remplie quart par quart.
  const SIX = Array.from({length: 6}, () => ({juste: true, ms: 2000}));
  const carte = CALCUL_CORE.carte();
  const gagner = (p, cles) => cles.reduce((q, k) => { const [m, n] = k.split("-"); const r = CALCUL.appliquerTentative(q, {module: m, niveau: Number(n), reponses: SIX}, {aujourdhui: JOUR, carte}); return r.refuse ? q : r.parcours; }, p);
  let p = CALCUL.creerParcours();
  assert.equal(jauge.lecteur(CALCUL, p), null, "aucune étoile : pas de jauge (une barre vide ressemble à un reproche)");
  // (Lot K1b : le premier étage est le CP, 14 étoiles, la ceinture blanche-jaune ; le suivant, le CE1, la jaune.)
  p = gagner(p, carte.ordre.slice(0, 1));
  assert.deepEqual(jauge.lecteur(CALCUL, p), {fait: 1, total: 14, compte: "Ceinture blanche-jaune · 1 étoile sur 14", ceinture: {n: 1, rempli: 0}, bonus: ""});
  p = gagner(p, carte.ordre.slice(1, 4));
  assert.deepEqual(jauge.lecteur(CALCUL, p).ceinture, {n: 1, rempli: .25}, "4 étoiles sur 14 : un quart");
  assert.equal(jauge.lecteur(CALCUL, p, {"defi-calcul": {etage: 1}}).compte, "Ceinture blanche-jaune · 4 étoiles sur 14", "jusqu’à l’étage réglé : le CP");
  assert.equal(jauge.lecteur(CALCUL, p, {"defi-calcul": {palier: 1}}).compte, "Ceinture blanche-jaune · 4 étoiles sur 14", "l'ancien réglage (1 : les bases, jusqu'au CE2) : le même étage en cours");
  // Tout l'étage gagné : l'étage jaune s'ouvre, sans étoile ; l'insigne montre la blanche-jaune, pleine.
  const bases = CALCUL.carteEleve(p, carte, {aujourdhui: JOUR}).etages[0].lignes.flatMap(l => l.etoiles.map(e => e.cle));
  p = gagner(p, carte.ordre.filter(k => bases.includes(k)));
  const plein = jauge.lecteur(CALCUL, p);
  assert.equal(plein.compte, "Ceinture jaune · 0 étoile sur 20");
  assert.deepEqual(plein.ceinture, {n: 1, rempli: 1});
  // Réglé jusqu'au CP : il n'y a pas d'étage suivant — le compte reste celui du CP, plein.
  assert.equal(jauge.lecteur(CALCUL, p, {"defi-calcul": {etage: 1}}).compte, "Ceinture blanche-jaune · 14 étoiles sur 14");
  assert.match(fonction("chargerMoteur", espace), /jauge\.avant \? chargerScript\(jauge\.avant\.url, jauge\.avant\.global\)/, "le script d'avant, puis le moteur");
  assert.match(fonction("chargerMoteur", espace), /prealable \? chargerScript\(jauge\.url, jauge\.global\) : null/, "sans le noyau, pas de moteur ni de jauge");
});

test("les noms viennent du noyau : compétence, module, palier, cause ; « ouvrir en classe » mène au niveau en mode professeur", () => {
  const o = outils([]);
  assert.equal(o.nomCompetenceCalcul("A2", 3), "Compléments à 100");
  assert.equal(o.nomCompetenceCalcul("A5", 1), "ajouter 9");
  assert.equal(o.nomModuleCalcul("M2"), "× 10, × 100, × 1 000 (entiers)");
  // (Lot K1b : six étages, un par classe — plus de « Les bases (CP · CE1 · CE2) ».)
  assert.equal(o.nomPalierCalcul(1), "Le CP");
  assert.equal(o.nomPalierCalcul(3), "Le CE2");
  assert.equal(o.nomPalierCalcul(4), "Le CM1", "les classes ne sont pas répétées quand le nom les dit");
  assert.equal(o.nomPalierCalcul(6), "La 6e");
  assert.equal(o.nomCauseCalcul("A5", 1), "retour oublié");
  assert.equal(o.nomCauseCalcul("A5", 9), "", "une cause inconnue de la fiche : rien");
  assert.equal(o.nomCourtPalier(3), "CE2");
  assert.equal(o.nomCourtPalier(5), "CM2");
  assert.equal(o.jourCourtCalcul("2026-11-27"), "ven. 27/11");
  assert.equal(o.jourCourtCalcul(null), "");
  const lien = o.lienOuvrirEnClasse("A2", 3);
  assert.equal(lien.href, "https://mathsgo.re/outils/calcul_mental/defi_calcul_modules.html?prof=1&module=A2&niveau=3");
  assert.deepEqual([lien.target, lien.rel], ["_blank", "noopener"]);
});

test("exempleErreur : un calcul regénéré pour chacune des 199 causes des 53 modules construits (lot « la 6e complète » : 24 de plus ; 17 des pilotes, 14 des modules lot 1, 24 des modules lot 2, 15 des modules lot 3, 16 des modules lot 4, 13 des modules lot 5, 15 des modules lot 6, 9 des modules lot 6b, 9 du lot 7a, 12 du lot 7b, 12 du lot 7c, 15 du lot 7d, 3 du lot 6 « fraction à deux cases », 1 du lot 6 « programmes 2 »), jamais un calcul d'élève", () => {
  const o = outils([]);
  let trouves = 0;
  CALCUL_CORE.MODULES.filter(m => m.construit).forEach(fiche => {
    fiche.erreurs.forEach(erreur => {
      const exemple = o.exempleErreur(fiche.id, erreur.c);
      assert.ok(exemple, `${fiche.id} cause ${erreur.c} (${erreur.nom}) : un exemple`);
      assert.match(exemple.texte, /□/, "le calcul, avec sa case");
      assert.ok(exemple.reponse.length > 0, "la réponse fausse, formatée");
      // La réponse fausse est bien reconnue par CETTE cause, par le noyau.
      const calcul = CALCUL_CORE.genererSerie(`${fiche.id}-${fiche.niveaux[0].n}`, {graine: 1, total: 1});
      assert.ok(calcul.length, "le niveau génère");
      trouves += 1;
    });
  });
  assert.equal(trouves, 199);
  // Lot « la 6e complète » : « Où va la virgule ? », la réponse fausse est une des deux autres
  // valeurs proposées ; F11-3 a ses trois causes, sur ses calculs.
  [1, 2].forEach(cause => {
    const e = o.exempleErreur("D16", cause);
    assert.match(e.texte, /est proche de □|donc .* = □/);
  });
  [7, 8, 9].forEach(cause => assert.match(o.exempleErreur("F11", cause).texte, /\d+\/\d+ × \d+ = □|\d+ × \d+\/\d+ = □/, `F11 cause ${cause}`));
  // Lot 6 « programmes 2 » : « × 0 : le nombre recopié » (7 × 0 → 7).
  assert.match(o.exempleErreur("M4", 4, 1).texte, / × 0 = □|0 × /);
  // Lot 6 « fraction à deux cases » : la réponse fausse s'écrit en fraction
  // (« 3 × ?/? = 2 → 3/2 »), jamais en nombre à virgule.
  assert.match(o.exempleErreur("F11", 4, 2).reponse, /^\d+\/\d+$/);
  [5, 6].forEach(cause => assert.match(o.exempleErreur("F11", cause, 2).reponse, /^\d+$/));
  // Le niveau qui coince d'abord : A2 cause 2 au niveau 4 donne un complément à 1 000.
  assert.match(o.exempleErreur("A2", 2, 4).texte, /1 000|centaine|[0-9]{3}/);
  // Une cause inconnue : null, sans erreur.
  assert.equal(o.exempleErreur("A2", 42), null);
  assert.equal(o.exempleErreur("ZZ9", 1), null);
});

// ------------------------------------------------------------ lot K2 « le professeur »
//
// Les étoiles telles que la page les lit (le moteur, resumeProf : grille,
// tentes, arrets…), « À aider » règle par règle, « À reprendre en classe »,
// ce que l'appli va faire d'une étoile, les mots et les signes de la grille.
// Ces tests ont été sabotés un par un (chaque règle d'« À aider » cassée à
// son tour dans la page : un test tombe à chaque fois).

const J = "2026-06-01";
const plus = n => CALCUL.ajouterJours(J, n);
const de = cle => { const [module, niveau] = cle.split("-"); return {module, niveau: Number(niveau)}; };
const o6 = jour => ({aujourdhui: jour, carte: CARTE, seance: false, source: 7});
const justes = () => Array.from({length: 6}, () => ({juste: true, ms: 1500}));
const rates = () => [{juste: false, ms: 1500}, {juste: false, ms: 1500}];
const arretee = () => Array.from({length: 25}, (_, i) => ({juste: i % 3 !== 0, outil: "aucun"}));
const exigerK2 = (r, quoi) => { assert.equal(r.refuse, undefined, `${quoi} : ${r.refuse}`); return r.parcours; };
const tenter = (p, cle, jour) => exigerK2(CALCUL.appliquerTentative(p, Object.assign(de(cle), {reponses: justes()}), o6(jour)), `Je tente ${cle}`);
const rater = (p, cle, jour) => exigerK2(CALCUL.appliquerTentative(p, Object.assign(de(cle), {reponses: rates()}), o6(jour)), `Je tente raté ${cle}`);
const arreter = (p, cle, jour) => exigerK2(CALCUL.appliquerSerie(p, Object.assign(de(cle), {genre: "apprends", reponses: arretee()}), o6(jour)), `J'apprends arrêté ${cle}`);
const retour = (p, cle, jour, juste) => exigerK2(CALCUL.appliquerRetour(p, Object.assign(de(cle), {juste, ms: 1500, type: "P"}), {aujourdhui: jour, carte: CARTE}), `retour ${cle}`);
const rateRetour = (p, cle, jour) => retour(retour(p, cle, jour, false), cle, jour, false);
const luDe = (p, jour = plus(10)) => CALCUL.resumeProf(p, CARTE, jour);
// Un élève « fabriqué » (la forme que rend resumeProf) : `etoiles`, une table
// « A2-1 » → {etat, tentes, arrets, perdues} ; `recentes`, ses dernières
// séances ; `causes`.
function faux({etoiles = {}, recentes = [], causes = []} = {}) {
  const modules = new Map();
  Object.entries(etoiles).forEach(([cle, e]) => {
    const {module, niveau} = de(cle);
    const m = modules.get(module) || {id: module, grille: [], tentes: [], arrets: [], perdues: [], tenteLe: [], echeances: [], entrees: []};
    for (let i = m.grille.length; i < niveau; i += 1) { m.grille[i] = "vide"; m.tentes[i] = 0; m.arrets[i] = 0; m.perdues[i] = 0; m.tenteLe[i] = null; m.echeances[i] = null; m.entrees[i] = null; }
    Object.assign(m, {});
    m.grille[niveau - 1] = e.etat;
    m.tentes[niveau - 1] = e.tentes || 0;
    m.arrets[niveau - 1] = e.arrets || 0;
    m.perdues[niveau - 1] = e.perdues || 0;
    m.echeances[niveau - 1] = e.echeance || null;
    modules.set(module, m);
  });
  return {lisible: true, commence: true, modules: [...modules.values()], recentes, causes, seances: {semaine: 1, quatreSemaines: 1}};
}
const seance = (calculs, justesN, nouveautes = 0, prouvees = 0) => ({jour: J, calculs, justes: justesN, nouveautes, prouvees, rouges: 0});

test("lot K2 — le plan de la carte : six étages, 151 étoiles, chacune avec son étage et sa ligne", () => {
  const o = outils([]);
  const plan = o.planCalcul();
  assert.deepEqual(plan.map(e => e.etage), [1, 2, 3, 4, 5, 6]);
  const etoiles = o.etoilesDuPlan();
  assert.equal(etoiles.length, plan.reduce((s, e) => s + e.total, 0));
  assert.equal(etoiles.length, CALCUL.carteEleve(CALCUL.creerParcours(), CARTE, {aujourdhui: JOUR}).total);
  assert.deepEqual(etoiles[0], {cle: "A1-1", module: "A1", niveau: 1, etage: 1, ligne: "Jusqu’à 20"});
  assert.equal(new Set(etoiles.map(x => x.cle)).size, etoiles.length, "chaque étoile une fois");
});

test("lot K2 — etoileDe et compteEtoiles : l'état de la grille rendu par le moteur ; « gagnées » = a réussi un retour, gagnée, ratée au dernier retour", () => {
  const o = outils([]);
  let p = tenter(CALCUL.creerParcours(), "A1-1", J);
  p = retour(p, "A1-1", plus(7), true);
  p = tenter(p, "A1-2", plus(7));
  p = tenter(p, "A1-3", plus(7));
  p = rateRetour(p, "A1-3", plus(14));
  p = rater(p, "A10-1", plus(14));
  const lu = luDe(p, plus(14));
  assert.deepEqual(["A1-1", "A1-2", "A1-3", "A10-1", "A10-2"].map(cle => o.etoileDe(lu, cle).etat), ["tenu", "gagnee", "rate", "essai", "vide"]);
  const c = o.compteEtoiles(lu);
  assert.deepEqual([c.gagnees, c.tenues, c.total], [3, 1, o.etoilesDuPlan().length]);
  assert.deepEqual(c.etages[0], {etage: 1, total: 14, gagnees: 3, touchees: 4});
  assert.equal(o.etoileDe({lisible: false, commence: true, modules: []}, "A1-1").etat, "vide", "illisible : tout est vide");
});

test("lot K2 — « À aider », règle 1 : à voir en classe (J'apprends arrêté 3 fois, ou perdue 3 fois)", () => {
  const o = outils([]);
  let p = CALCUL.creerParcours();
  p = arreter(p, "A1-1", J); p = arreter(p, "A1-1", plus(1)); p = arreter(p, "A1-1", plus(2));
  const r = o.raisonsAider(luDe(p, plus(2)));
  assert.deepEqual([r[0].rang, r[0].texte, r[0].etoile.cle], [1, "J’apprends arrêté 3 fois", "A1-1"]);
  assert.equal(o.texteRaison(r[0]), `J’apprends arrêté 3 fois : ${o.nomCompetenceCalcul("A1", 1).replace(/^./, c => c.toUpperCase())}`);
  const perdue = o.raisonsAider(faux({etoiles: {"A2-1": {etat: "classe", perdues: 3}}}));
  assert.deepEqual([perdue[0].rang, perdue[0].texte], [1, "perdue 3 fois"]);
});

test("lot K2 — « À aider », règle 2 : « Je tente » raté 2 fois sur une étoile pas gagnée (une fois ne suffit pas)", () => {
  const o = outils([]);
  let p = rater(CALCUL.creerParcours(), "A1-1", J);
  assert.deepEqual(o.raisonsAider(luDe(p, J)), [], "un seul raté : rien");
  p = rater(p, "A1-1", plus(1));
  const r = o.raisonsAider(luDe(p, plus(1)));
  assert.deepEqual([r.length, r[0].rang, r[0].texte], [1, 2, "« Je tente » raté 2 fois"]);
});

test("lot K2 — « À aider », règle 3 : perdue au retour (deux retours ratés de suite) ; un seul retour raté n'y est pas", () => {
  const o = outils([]);
  let p = tenter(CALCUL.creerParcours(), "A1-1", J);
  p = rateRetour(p, "A1-1", plus(7));
  assert.deepEqual(o.raisonsAider(luDe(p, plus(7))), [], "ratée une fois : elle reste, rien à signaler");
  p = rateRetour(p, "A1-1", plus(8));
  const r = o.raisonsAider(luDe(p, plus(8)));
  assert.deepEqual([r.length, r[0].rang, r[0].texte], [1, 3, "perdue au retour"]);
});

test("lot K2 — « À aider », règle 4 : J'apprends arrêté 2 fois (une fois ne suffit pas)", () => {
  const o = outils([]);
  let p = arreter(CALCUL.creerParcours(), "A1-1", J);
  assert.deepEqual(o.raisonsAider(luDe(p, J)), []);
  p = arreter(p, "A1-1", plus(1));
  const r = o.raisonsAider(luDe(p, plus(1)));
  assert.deepEqual([r.length, r[0].rang, r[0].texte], [1, 4, "J’apprends arrêté 2 fois"]);
});

test("lot K2 — « À aider », règle 5 : rien gagné depuis 5 séances, s'il reste quelque chose à gagner", () => {
  const o = outils([]);
  const rien = Array.from({length: 5}, () => seance(10, 9));
  assert.deepEqual(o.raisonsAider(faux({recentes: rien})).map(r => [r.rang, r.texte]), [[5, "rien gagné depuis 5 séances"]]);
  assert.deepEqual(o.raisonsAider(faux({recentes: rien.slice(1)})), [], "4 séances : rien");
  assert.deepEqual(o.raisonsAider(faux({recentes: [...rien.slice(1), seance(10, 9, 1, 0)]})), [], "une étoile gagnée par J'apprends : rien");
  assert.deepEqual(o.raisonsAider(faux({recentes: [seance(10, 9, 0, 1), ...rien.slice(1)]})), [], "une étoile gagnée à « Je tente » dans les 5 : rien");
  assert.deepEqual(o.raisonsAider(faux({recentes: [{...rien[0], nouveautes: null}, ...rien.slice(1)]})), [], "une séance pas connue : rien");
  const tout = Object.fromEntries(o.etoilesDuPlan().map(x => [x.cle, {etat: "tenu"}]));
  assert.deepEqual(o.raisonsAider(faux({etoiles: tout, recentes: rien})), [], "tout gagné : plus rien à gagner, rien à dire");
});

test("lot K2 — « À aider », règle 6 : calculs du jour, moins de 60 % de justes sur les 3 dernières séances, 8 calculs au moins", () => {
  const o = outils([]);
  const r = o.raisonsAider(faux({recentes: [seance(20, 20, 1), seance(10, 5, 1), seance(10, 6, 1), seance(10, 6, 1)]}));
  assert.deepEqual(r.map(x => [x.rang, x.texte]), [[6, "calculs du jour : 17 justes sur 30 (3 dernières séances)"]]);
  assert.deepEqual(o.raisonsAider(faux({recentes: [seance(3, 1, 1), seance(4, 1, 1)]})), [], "7 calculs : trop peu pour dire");
  assert.deepEqual(o.raisonsAider(faux({recentes: [seance(10, 6, 1)]})), [], "60 % pile : rien");
  assert.equal(o.raisonsAider(faux({recentes: [seance(8, 4, 1)]}))[0].rang, 6, "8 calculs, 50 % : oui");
});

test("lot K2 — « À aider » : la raison la plus forte d'abord, puis l'ordre de la carte ; une ligne par élève ; « et N autres choses »", () => {
  const o = outils([]);
  const lu = faux({etoiles: {"A1-1": {etat: "essai", arrets: 2}, "A1-2": {etat: "essai", tentes: 2}, "A1-3": {etat: "perdue"}, "A2-1": {etat: "essai", tentes: 2}},
    recentes: [seance(10, 2, 1)]});
  const r = o.raisonsAider(lu);
  assert.deepEqual(r.map(x => [x.rang, x.etoile && x.etoile.cle]), [[2, "A1-2"], [2, "A2-1"], [3, "A1-3"], [4, "A1-1"], [6, null]]);
  const eleves = [{id: 1, prenom: "Léa", lu}, {id: 2, prenom: "Tom", lu: faux()}, {id: 3, prenom: "Zoé", lu: {lisible: true, commence: false}}];
  const aider = outils(eleves).aiderCalcul();
  assert.deepEqual(aider.map(a => [a.eleve.prenom, a.raisons.length]), [["Léa", 5]], "Tom n'a rien, Zoé n'a pas commencé");
});

test("lot K2 — « À reprendre » : les erreurs les plus fréquentes chez 2 élèves ou plus, 3 au plus, un exemple et ce que l'appli dit", () => {
  const causes = c => faux({causes: c});
  const eleves = [
    {id: 1, lu: causes([{module: "A5", cause: 1, n: 4}, {module: "A5", cause: 3, n: 9}, {module: "A2", cause: 2, n: 1}, {module: "M1", cause: 1, n: 1}])},
    {id: 2, lu: causes([{module: "A5", cause: 1, n: 1}, {module: "A2", cause: 2, n: 2}, {module: "M1", cause: 1, n: 1}])},
    {id: 3, lu: causes([{module: "A5", cause: 1, n: 1}, {module: "A2", cause: 2, n: 1}, {module: "M1", cause: 1, n: 5}, {module: "ZZ9", cause: 1, n: 7}])},
    {id: 4, lu: causes([{module: "M1", cause: 1, n: 1}])}
  ];
  const o = outils(eleves);
  const e = o.erreursFrequentesCalcul();
  assert.deepEqual(e.map(x => [`${x.module}:${x.cause}`, x.eleves.length, x.n]), [["M1:1", 4, 8], ["A5:1", 3, 6], ["A2:2", 3, 4]],
    "les plus partagées d'abord ; A5:3 (un seul élève) et une cause inconnue n'y sont pas ; 3 au plus");
  const ex = o.exempleErreur("A5", 1);
  assert.equal(typeof ex.dit, "string");
  assert.ok(ex.dit.length > 5, `ce que l'appli dit : « ${ex.dit} »`);
  assert.doesNotMatch(ex.dit, /\s{2}|\n/, "sur une ligne");
  assert.equal(outils([]).erreursFrequentesCalcul().length, 0);
  assert.deepEqual(outils(eleves.slice(0, 2)).erreursFrequentesCalcul().map(x => `${x.module}:${x.cause}`), ["A5:1", "A2:2", "M1:1"]);
  assert.deepEqual(outils([eleves[0], {id: 9, lu: causes([{module: "A5", cause: 1, n: 1}])}]).erreursFrequentesCalcul().map(x => `${x.module}:${x.cause}`), ["A5:1"],
    "une erreur d'un seul élève n'y est pas");
  // « ouvrir en classe » : la première étoile du module qu'un de ces élèves n'a pas tenue.
  const a = {id: 1, lu: faux({etoiles: {"A1-1": {etat: "tenu"}, "A1-2": {etat: "gagnee"}}})};
  const b = {id: 2, lu: faux({etoiles: {"A1-1": {etat: "tenu"}, "A1-2": {etat: "tenu"}}})};
  assert.equal(o.niveauAReprendre("A1", [a, b]), 2);
  assert.equal(o.niveauAReprendre("A1", [b, {id: 3, lu: faux({etoiles: {"A1-1": {etat: "tenu"}, "A1-2": {etat: "tenu"}, "A1-3": {etat: "tenu"}}})}]), 3);
});

test("lot K2 — « À reprendre » : les étoiles qui résistent chez 2 élèves ou plus ; « à voir en classe » d'abord, 3 au plus ; le détail en mots", () => {
  const eleves = [
    {id: 1, lu: faux({etoiles: {"A1-2": {etat: "essai", tentes: 1}, "A2-1": {etat: "classe", arrets: 3}, "A1-3": {etat: "perdue"}, "M1-1": {etat: "rate"}, "A10-1": {etat: "essai", arrets: 1}}})},
    {id: 2, lu: faux({etoiles: {"A1-2": {etat: "essai", tentes: 2}, "A2-1": {etat: "essai", tentes: 1}, "A1-3": {etat: "rate"}, "M1-1": {etat: "gagnee"}, "A10-1": {etat: "essai", arrets: 2}}})},
    {id: 3, lu: faux({etoiles: {"A1-2": {etat: "rate"}, "A1-3": {etat: "tenu"}, "A10-1": {etat: "essai", tentes: 1}}})}
  ];
  const r = outils(eleves).etoilesQuiResistent();
  assert.deepEqual(r.map(x => [x.etoile.cle, x.qui.length]), [["A2-1", 2], ["A1-2", 3], ["A10-1", 3]],
    "à voir en classe d'abord, puis les plus partagées, puis l'ordre de la carte ; M1-1 (une seule) n'y est pas ; 3 au plus (A1-3 attend)");
  assert.deepEqual(outils(eleves.slice(0, 1)).etoilesQuiResistent(), [], "un seul élève : rien ne résiste « chez plusieurs »");
  const o = outils([]);
  assert.equal(o.detailResiste(r[1].par), "2 « Je tente » ratés · 1 ratée au retour");
  assert.equal(o.detailResiste(r[0].par), "1 « Je tente » raté · 1 à voir en classe");
  assert.equal(o.detailResiste(r[2].par), "1 « Je tente » raté · 2 J’apprends arrêtés");
});

test("lot K2 — suiteCalcul : ce que l'appli va faire d'une étoile, avec les règles d'aujourd'hui (P1, § 10)", () => {
  const o = outils([]);
  const demain = CALCUL.ajouterJours(CALCUL.jourLocal(), 1);
  const plusTard = CALCUL.ajouterJours(CALCUL.jourLocal(), 6);
  assert.equal(o.suiteCalcul({etat: "rate", echeance: demain}), "ratée à son dernier retour · elle reste et revient demain ; ratée encore, elle part");
  assert.equal(o.suiteCalcul({etat: "perdue", perdues: 1}), "perdue au retour (deux retours ratés de suite) · à regagner par « Je tente » ou J’apprends");
  assert.equal(o.suiteCalcul({etat: "perdue", perdues: 2}), "perdue au retour (deux retours ratés de suite) · à regagner par « Je tente » ou J’apprends · perdue 2 fois");
  assert.equal(o.suiteCalcul({etat: "essai", tentes: 2}), "« Je tente » raté 2 fois · seulement J’apprends, jusqu’à ce qu’elle soit gagnée");
  assert.equal(o.suiteCalcul({etat: "essai", tentes: 1, tenteLe: "2026-11-27"}), "« Je tente » raté le ven. 27/11");
  assert.equal(o.suiteCalcul({etat: "essai", arrets: 2}), "J’apprends arrêté 2 fois · au 3e arrêt, elle sera à voir en classe");
  assert.equal(o.suiteCalcul({etat: "classe", arrets: 3, echeance: plusTard}), `J’apprends arrêté 3 fois : à voir en classe · elle revient dans ses étoiles le ${o.jourCourtCalcul(plusTard)}`);
  assert.equal(o.suiteCalcul({etat: "classe", arrets: 3, echeance: null}), "J’apprends arrêté 3 fois : à voir en classe · elle se rejoue déjà");
  assert.equal(o.suiteCalcul({etat: "classe", arrets: 0, perdues: 3}), "perdue 3 fois : à voir en classe");
  // Aucun des textes d'avant la carte.
  const tout = fonction("suiteCalcul", sectionCalcul) + fonction("contenuCalcul", sectionCalcul) + fonction("remplirFicheCalcul", sectionCalcul) + fonction("seancesCalcul");
  for (const mot of ["un entraînement avec l’aide à sa prochaine séance", "prouvée", "nouveauté", "compétences sues", "Compétences sues", "mise de côté", "J’apprends et un entraînement"]) {
    assert.ok(!tout.includes(mot), `plus de « ${mot} »`);
  }
});

test("lot K2 — les sept états : leurs mots (la légende), leurs signes en noir et blanc, tous différents", () => {
  const o = outils([]);
  assert.deepEqual(o.ETATS_GRILLE, ["tenu", "gagnee", "rate", "perdue", "essai", "classe", "vide"]);
  assert.deepEqual(o.MOTS_GRILLE, {tenu: "a réussi un retour", gagnee: "gagnée", rate: "ratée au dernier retour", perdue: "perdue, à regagner",
    essai: "essayée, pas encore gagnée", classe: "à voir en classe", vide: "pas encore"});
  assert.equal(new Set(Object.values(o.SIGNES_GRILLE)).size, 7, "un signe par état");
  // La note d'impression nomme les deux boutons de Défi calcul.
  assert.match(page, /Onglet Anzan ou Défi calcul : touche la ligne d’un élève, puis/);
  assert.match(page, /Défi calcul a aussi <strong>« Imprimer la grille »<\/strong>/);
});

test("lot K2 — la page : l'ordre des cartes, sans prénom à l'écran dans « À reprendre », aucun temps, rien par innerHTML", () => {
  // L'ordre du HTML : À aider, Notre classe, …, À reprendre ; puis la grille, Qui s'entraîne, le tableau.
  const ordre = ["id=\"dc-aider\"", "id=\"objectif\"", "id=\"dc-reprendre\"", "id=\"dc-ouest\"", "id=\"dc-qui\"", "id=\"tableau\""].map(m => page.indexOf(m));
  assert.ok(ordre.every((x, i) => x > 0 && (i === 0 || x > ordre[i - 1])), "l'ordre de la planche K2-3");
  assert.match(page, /<strong>À aider<\/strong>\s*<p class="sous">Les élèves qui butent en ce moment · avec les prénoms : à ne pas projeter<\/p>/);
  assert.match(page, /<p class="sous">Ce qui coince chez plusieurs élèves · aucun prénom à l’écran : on peut projeter<\/p>/);
  assert.match(page, /<summary class="dc-tete"><strong>Où en est chacun<\/strong>/);
  // Les cartes du haut : À aider à gauche, Notre classe dessous, À reprendre à droite (CSS).
  assert.match(page, /grid-template-areas: "aider reprendre" "objectif reprendre";/);
  // « À reprendre » n'écrit aucun prénom : seulement des nombres qui se touchent.
  const reprendre = fonction("dessinerReprendre", sectionCalcul);
  assert.doesNotMatch(reprendre.replace(/popPrenoms\([^)]*\)/g, ""), /nomAffiche|prenom/);
  // Aucun temps montré (choix du 07/11, redit le 28/11).
  assert.doesNotMatch(sectionCalcul.replace(/\/\/.*$/gm, ""), /minutes\b|secondes|\.ms\b/);
  assert.doesNotMatch(fonction("dessinerOuEnEst") + fonction("dessinerQuiSentraine") + fonction("etoilesEnCases"), /innerHTML/);
  // La grille : les prénoms collés à gauche, la ligne « Gagnée par ».
  assert.match(page, /\.dc-g-nom \{ position: sticky; left: 0;/);
  assert.match(fonction("dessinerOuEnEst"), /el\("td", "dc-g-nom dc-g-total", "Gagnée par"\)/);
  // Plus de barres par module (lot S2) : ni leur code, ni leur fenêtre.
  for (const mort of ["ouvrirPopOuEnEst", "fermerPopOuEnEst", "etatModulePalier", "dc-ouest-barre", "dc-ouest-pop", "dc-ouest-liste", "palierOuEnEst"]) {
    assert.ok(!page.includes(mort), `plus de ${mort}`);
  }
  // Qui s'entraîne : moins de 3 séances cette semaine, pas le lundi.
  assert.match(fonction("dessinerQuiSentraine"), /if \(aujourdhui !== lundi\) \{[\s\S]*Moins de 3 séances cette semaine : /);
});

test("lot K2 — « Recommencer Défi calcul à zéro » : la confirmation de la planche K2-6, rien d'autre que l'élève et l'appli envoyé", () => {
  const f = fonction("recommencerCalcul");
  assert.match(f, /`Recommencer Défi calcul à zéro pour \$\{nom \|\| "l’élève"\} \?`/);
  assert.match(f, /detail: "Ses étoiles, sa ceinture et ses séances repartent de zéro, sur tous ses appareils\. Pendant 7\\u00a0jours, «\\u00a0Revenir à…\\u00a0» \(dans le même menu «\\u00a0⋯\\u00a0»\) permet de faire marche arrière\."/);
  assert.match(f, /oui: `Recommencer à zéro pour \$\{nom \|\| "l’élève"\}`, danger: true/);
  assert.ok(f.indexOf("await demander(") < f.indexOf('api("eleves.recommencer"'), "on confirme AVANT d'appeler le serveur");
  assert.match(f, /api\("eleves\.recommencer", \{eleve_id: eleve\.id, appli: "defi-calcul"\}\)/);
  assert.match(fonction("demander"), /if \(options && options\.detail\) \$\("boite-texte"\)\.append\(el\("span", "boite-detail", options\.detail\)\);/);
});

// ---------------------------------------------- lot K2, correctif (relecture Codex du 28/11/2026)

test("lot K2, correctif — « Revenir à… » nomme l'état gardé par « Recommencer à zéro » : « avant la remise à zéro du … »", () => {
  const proposees = new Function("APPLIS", "appliAffichee", "dateLisible", "jourLisible",
    `${fonction("versionsProposees")}\nreturn versionsProposees;`)(
    [{cle: "defi-calcul", unite: ["calcul", "calculs"]}], "defi-calcul", () => "", j => j);
  const eleve = {restaurable: false, journees: [{jour: "2026-11-28", calculs: 30, remise: true}, {jour: "2026-11-27", calculs: 1}]};
  assert.deepEqual(proposees(eleve).map(o => [o.valeur, o.libelle]), [
    ["2026-11-28", "avant la remise à zéro du 2026-11-28 — 30 calculs"],
    ["2026-11-27", "fin de journée du 2026-11-27 — 1 calcul"]]);
});

test("lot K2, correctif — une série ouverte quand le professeur remet l'élève à zéro ne s'applique pas au parcours neuf", () => {
  const modules = lire("outils/calcul_mental/defi_calcul_modules.html");
  // Les deux endroits où un parcours du serveur remplace celui de la page.
  assert.match(modules, /marquerSeriePerimee\(recu\.parcours\);\s*parcours = recu\.parcours;/);
  assert.match(modules, /marquerSeriePerimee\(fusion\);\s*parcours = fusion;/);
  const marquer = modules.slice(modules.indexOf("function marquerSeriePerimee"), modules.indexOf("function arreterActivite"));
  const state = {running: true, serie: {}};
  let parcours = {epoque: 4};
  const f = new Function("state", "parcoursDe", `let parcours = parcoursDe; ${marquer}; return marquerSeriePerimee;`);
  f(state, parcours)({epoque: 4});
  assert.equal(state.serie.perimee, undefined, "même époque : la série continue");
  f(state, parcours)({epoque: 5});
  assert.equal(state.serie.perimee, true, "époque plus haute : la série est périmée");
  const autre = {running: false, serie: {}};
  f(autre, parcours)({epoque: 9});
  assert.equal(autre.serie.perimee, undefined, "pas de série en cours : rien");
  // À la fin, la série périmée se referme comme quand on la quitte ; les retours ne se notent plus.
  assert.match(modules, /function finish\(\) \{\s*if \(!state\.running\) return;\s*const serie = state\.serie;\s*if \(serie && serie\.perimee\) \{ quitterSerie\(\); return; \}/);
  assert.match(modules, /if \(serie\.genre === "jour" && !serie\.perimee\) \{\s*const mouvement = noterRetour\(/);
});
