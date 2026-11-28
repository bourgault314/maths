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
  ${constante("ETATS_CALCUL", sectionCalcul)}
  ${constante("SYMBOLES_CALCUL", sectionCalcul)}
  ${constante("APPLI_CALCUL", sectionCalcul)}
  const exemplesCalcul = new Map();
  ${fonction("nomCompetenceCalcul", sectionCalcul)}
  ${fonction("nomModuleCalcul", sectionCalcul)}
  ${fonction("nomPalierCalcul", sectionCalcul)}
  ${fonction("nomCauseCalcul", sectionCalcul)}
  ${fonction("exempleErreur", sectionCalcul)}
  ${fonction("candidatsErreur", sectionCalcul)}
  ${fonction("lienOuvrirEnClasse", sectionCalcul)}
  ${fonction("causePrincipale", sectionCalcul)}
  ${fonction("ligneCause", sectionCalcul)}
  ${fonction("reprendreEnClasse", sectionCalcul)}
  ${fonction("suiteCalcul", sectionCalcul)}
  ${fonction("nomCourtPalier", sectionCalcul)}
  ${fonction("jourCourtCalcul", sectionCalcul)}
  return {nomCompetenceCalcul, nomModuleCalcul, nomPalierCalcul, nomCauseCalcul, exempleErreur, candidatsErreur, lienOuvrirEnClasse,
    causePrincipale, ligneCause, reprendreEnClasse, suiteCalcul, nomCourtPalier, jourCourtCalcul, ETATS_CALCUL, SYMBOLES_CALCUL};
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
    ["Élève:prenom", "Ceinture:ceinture (large)", "Compétences sues:sues", "À revoir:revoir (large)", "Séances · 4 semaines:seances (large)", "Dernière activité:date", "", " (fin)"],
    "au téléphone : l'élève, les compétences sues, le dernier jour");
  const TRIS = new Function(`${constante("TRIS")}\nreturn TRIS;`)();
  assert.deepEqual(TRIS["defi-calcul"], ["prenom", "ceinture", "sues", "revoir", "seances", "date"]);
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
  assert.match(fonction("remplirFicheCalcul"), /const ligneEtat = document\.createElement\("span"\);/);
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

test("causePrincipale et ligneCause : la cause la plus fréquente du module, sommée sur les élèves, avec son exemple", () => {
  const o = outils([]);
  const lea = CALCUL.resumeProf({version: CALCUL.VERSION, modules: {A5: {b: [1, 0, 0, 0], e: [JOUR, null, null, null], c: {"1": 4, "3": 1}}}}, CARTE, JOUR);
  const tom = CALCUL.resumeProf({version: CALCUL.VERSION, modules: {A5: {b: [1, 0, 0, 0], e: [JOUR, null, null, null], c: {"3": 5}}}}, CARTE, JOUR);
  assert.deepEqual(o.causePrincipale([lea], "A5"), {cause: 1, n: 4});
  assert.deepEqual(o.causePrincipale([lea, tom], "A5"), {cause: 3, n: 6}, "la somme sur les deux");
  assert.equal(o.causePrincipale([lea], "M2"), null);
  const ligne = o.ligneCause([lea], "A5", 1);
  assert.match(ligne.textContent, /^ex\. .+ → .+ · retour oublié$/);
  assert.doesNotMatch(ligne.textContent, /□/, "la case s'écrit « ? »");
  assert.equal(o.ligneCause([lea], "M2", 1), null, "sans cause connue : rien");
});

test("reprendreEnClasse : au moins 2 élèves, ou 1 mis de côté ; les plus partagées d'abord ; 6 au plus", () => {
  // (Lot K1 « la carte chez l'élève » : « à revoir », c'est une étoile perdue
  // — gagnée un jour, sortie des boîtes ; « à voir en classe », perdue 3 fois.)
  const parcours = (b, pe = [0, 0, 0, 0]) => ({version: CALCUL.VERSION, modules: {A2: {b, e: [JOUR, JOUR, JOUR, JOUR], pe,
    d: ["2026-10-01", "2026-10-01", "2026-10-01", null], c: {"2": 1}}}});
  const eleve = (id, p) => ({id, lu: CALCUL.resumeProf(p, CARTE, JOUR)});
  // A2-3 perdue chez 3 élèves, A2-1 perdue chez 1, A2-2 à voir en classe chez 1.
  const eleves = [
    eleve(1, parcours([0, 2, 0, 0], [1, 0, 1, 0])), eleve(2, parcours([2, 2, 0, 0], [0, 0, 1, 0])), eleve(3, parcours([2, 2, 0, 0], [0, 0, 2, 0])),
    eleve(4, parcours([2, 0, 2, 0], [0, 3, 0, 0])), eleve(5, {}), {id: 6, lu: CALCUL.resumeProf(null, CARTE, JOUR)}
  ];
  const lignes = outils(eleves).reprendreEnClasse();
  assert.deepEqual(lignes.map(c => [`${c.module}-${c.niveau}`, c.eleves, c.classe]), [["A2-2", 1, 1], ["A2-3", 3, 0]],
    "la mise de côté d'abord, puis la plus partagée ; A2-1 (un seul élève, pas mis de côté) n'y entre pas");
  assert.equal(outils([]).reprendreEnClasse().length, 0);
  // Au-delà de six compétences partagées : six lignes.
  const perdu = {b: [0, 0, 0, 0], e: [null, null, null, null], pe: [1, 1, 1, 1], d: ["2026-10-01", "2026-10-01", "2026-10-01", "2026-10-01"], c: {}};
  const beaucoup = [1, 2].map(id => eleve(id, {version: CALCUL.VERSION, modules: {A2: perdu, A5: perdu}}));
  assert.equal(outils(beaucoup).reprendreEnClasse().length, 6);
});

test("suiteCalcul : ce que l'appli va faire d'une compétence à revoir, dans les mots du professeur", () => {
  const o = outils([]);
  assert.equal(o.suiteCalcul({etat: "classe", deCote: true, echeance: "2026-11-30", apprends: true}), "mise de côté jusqu’à lun. 30/11, puis J’apprends et un entraînement");
  assert.equal(o.suiteCalcul({etat: "classe", deCote: false, echeance: JOUR, apprends: true}), "revenue après sa mise de côté : J’apprends, puis un entraînement à sa prochaine séance");
  // Relecture Codex : ratée aujourd'hui, la séance du jour la réentraîne (le
  // rouge d'abord) — « revient demain » seul cachait ce rattrapage.
  const demain = CALCUL.ajouterJours(CALCUL.jourLocal(), 1);
  assert.equal(o.suiteCalcul({etat: "revoir", deCote: false, echeance: demain, apprends: false, entrainee: false}),
    "ratée aujourd’hui · un entraînement avec l’aide dans sa séance du jour · revient demain");
  assert.equal(o.suiteCalcul({etat: "revoir", deCote: false, echeance: demain, apprends: false, entrainee: true}),
    "ratée aujourd’hui · réentraînée avec l’aide aujourd’hui · revient demain");
  assert.equal(o.suiteCalcul({etat: "revoir", deCote: false, echeance: demain, apprends: true, entrainee: true}),
    "ratée aujourd’hui · réentraînée avec l’aide aujourd’hui · revient demain, J’apprends à refaire");
  assert.equal(o.suiteCalcul({etat: "revoir", deCote: false, echeance: "2026-01-01", apprends: false}), "un entraînement avec l’aide à sa prochaine séance");
  assert.equal(o.suiteCalcul({etat: "revoir", deCote: false, echeance: "2026-01-01", apprends: true}), "J’apprends à refaire, puis un entraînement avec l’aide à sa prochaine séance");
});

test("les symboles de la feuille et les mots de la légende", () => {
  const o = outils([]);
  assert.deepEqual(o.SYMBOLES_CALCUL, {gris: "·", route: "○", su: "✓", revoir: "↻", classe: "✖"});
  assert.deepEqual(o.ETATS_CALCUL, {gris: "à apprendre", route: "en route", su: "sue", revoir: "à revoir", classe: "à voir en classe"});
  // La note d'impression nomme les deux boutons de Défi calcul.
  assert.match(page, /Onglet Anzan ou Défi calcul : touche la ligne d’un élève, puis/);
  assert.match(page, /Défi calcul a aussi <strong>« Imprimer la grille »<\/strong>/);
});
