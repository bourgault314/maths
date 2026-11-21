// Lot B2 « Ta liste dans Ma classe » (suivi.mathsgo.re, 21/11/2026 — planches
// B2-1 à B2-7 validées par Gwenaël, ses choix par questions : le chemin de la
// journée sur ordinateur, « Ensuite : X » au téléphone, Mes cours toujours en
// dernier, les mots des planches).
//
// Ce que ce test garde, en JOUANT le vrai code de la page :
//  - Mon espace suit la liste choisie pour la classe (« jour ») : la première
//    étape pas encore faite aujourd'hui, puis la suivante, puis « C'est fait ! » ;
//    une porte fermée, une clé inconnue, Mes cours ailleurs qu'au bout sont
//    ignorées ; sans liste utilisable, le mode automatique du lot B1, inchangé ;
//  - la ligne du téléphone (« Ensuite : X » tant qu'il reste une étape après le
//    bouton) et le chemin de l'ordinateur (fait, en cours, à venir), écrits
//    tous les deux, la feuille de style choisit — pas de matchMedia ;
//  - la copie de l'onglet garde la liste, relue comme ce qui vient du serveur ;
//  - Ma classe › Réglages : la carte « Aujourd'hui, dans Mon espace » (ses
//    mots, son brouillon, Mes cours qui ferme la liste, ce qui part au serveur).
// Le serveur (jour_lu, jour_recu, classes.modifier) est gardé par
// _serveur/tests/lancer.php.

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = chemin => readFileSync(join(racine, chemin), "utf8");
const page = lire("_serveur/public/index.php");
const style = page.slice(page.indexOf("<style>"), page.indexOf("</style>"));
const prof = lire("_serveur/public/prof/index.php");
const NBSP = " ";

function blocDepuis(source, position) {
  const ouvre = source.indexOf("{", position);
  let profondeur = 0;
  for (let i = ouvre; i < source.length; i += 1) {
    if (source[i] === "{") profondeur += 1;
    else if (source[i] === "}") { profondeur -= 1; if (profondeur === 0) return source.slice(position, i + 1); }
  }
  throw new Error("bloc non fermé");
}
function fonctionDe(source, nom) {
  const m = new RegExp(`(?:async )?function ${nom}\\(`).exec(source);
  assert.ok(m, `la page doit définir ${nom}()`);
  return blocDepuis(source, m.index);
}

// ------------------------------------------------------------ un faux document

class Noeud {
  constructor(nom) { this.nom = nom; this.enfants = []; this.attributs = {}; this.dataset = {}; this.className = "";
    this.hidden = false; this.disabled = false; this.checked = false; this.value = ""; this._texte = ""; this.href = "";
    this.id = ""; this.onclick = null; this.innerHTML = ""; const n = this;
    this.style = {setProperty() {}};
    this.classList = {
      add(c) { if (!n.className.split(" ").includes(c)) n.className = `${n.className} ${c}`.trim(); },
      remove(c) { n.className = n.className.split(" ").filter(x => x && x !== c).join(" "); },
      contains(c) { return n.className.split(" ").includes(c); }
    };
  }
  set textContent(v) { this.enfants = []; this._texte = String(v); }
  get textContent() { return this.enfants.length ? this.enfants.map(e => (typeof e === "string" ? e : e.textContent)).join("") : this._texte; }
  append(...n) { this.enfants.push(...n); }
  setAttribute(k, v) { this.attributs[k] = String(v); }
  addEventListener() {}
}
const documentFaux = {createElement: nom => new Noeud(nom), createElementNS: (_e, nom) => new Noeud(nom), createTextNode: t => t};

// ------------------------------------------------------------ Mon espace, joué

const debutJour = page.indexOf("  // ===================================================== lot B1 : « Aujourd'hui »");
const finJour = page.indexOf("  // ------------------------------------------------------- la séance en direct");
assert.ok(debutJour > 0 && finJour > debutJour, "la section du bloc « Aujourd'hui »");
const SECTION_JOUR = page.slice(debutJour, finJour);

function jouerJour(elements) {
  const $ = id => { if (!elements[id]) elements[id] = new Noeud(id); return elements[id]; };
  return new Function("document", "$", "icone", "adresseAppli", "ouvrirAppli",
    `${SECTION_JOUR}\nreturn {poserJour, etapesDuJour};`)(
    documentFaux, $, cle => `<svg data-icone="${cle}"></svg>`, appli => `${appli.url}#b=billet`, () => {});
}

const NOMS = {"defi-tables": "Défi tables", "splat": "SPLAT!", "cours": "Mes cours", "coffres": "Coffres magiques",
  "flash-anzan": "Anzan", "defi-calcul": "Défi calcul"};
const APPLI = cle => ({cle, nom: NOMS[cle] || cle, url: `https://mathsgo.re/${cle}.html`, ancre: null, disponible: true});
const CLASSE = ["defi-tables", "coffres", "splat", "cours"];

function leBloc({applis = CLASSE, jour, faits = [], jauges = {}, nCours = 3}) {
  const el = {};
  const {poserJour} = jouerJour(el);
  poserJour(applis.map(APPLI), jauges, {faits}, {billet: "b", jour}, "ABC234", nCours);
  const $ = id => el[id] || new Noeud(id);
  const chemin = $("jour-chemin");
  return {
    cache: $("jour").hidden, fini: $("jour").classList.contains("fini"), avecChemin: $("jour").classList.contains("avec-chemin"),
    nom: $("jour-nom").textContent, bouton: $("jour-bouton").hidden ? null : $("jour-bouton").textContent,
    ensuite: $("jour-ensuite").textContent,
    chemin: chemin.hidden ? null : chemin.enfants.filter(e => e.className !== "fleche").map(e => `${e.className}:${e.textContent}`),
    fleches: chemin.enfants.filter(e => e.className === "fleche").length,
    faits: $("jour-faits").hidden ? null : $("jour-faits").enfants.map(e => e.textContent)
  };
}

test("liste de deux (Défi tables, puis SPLAT!) : les trois états", () => {
  const jour = ["defi-tables", "splat"];
  const rien = leBloc({jour});
  assert.deepEqual([rien.nom, rien.bouton, rien.ensuite], ["Défi tables", "Commencer", `Ensuite${NBSP}: SPLAT!`]);
  assert.deepEqual(rien.chemin, ["en-cours:Défi tables", "a-venir:SPLAT!"]);
  assert.equal(rien.fleches, 1);
  assert.equal(rien.avecChemin, true, "deux étapes : le chemin, sur ordinateur");
  const un = leBloc({jour, faits: ["defi-tables"]});
  assert.deepEqual([un.nom, un.ensuite], ["SPLAT!", "✓ Défi tables"], "plus rien après SPLAT! : la ligne dit ce qui est fait (comme au B1)");
  assert.deepEqual(un.chemin, ["fait:✓ Défi tables", "en-cours:SPLAT!"]);
  const deux = leBloc({jour, faits: ["defi-tables", "splat"]});
  assert.deepEqual([deux.fini, deux.nom, deux.bouton, deux.faits, deux.ensuite, deux.chemin, deux.avecChemin],
    [true, `C’est fait${NBSP}!`, null, ["✓ Défi tables", "✓ SPLAT!"], "", null, false],
    "« C'est fait ! » : rien en haut à droite, ni ligne ni chemin");
});

test("liste de trois (Défi tables, SPLAT!, Mes cours) : « Ensuite : Mes cours » au téléphone, le chemin sur ordinateur", () => {
  const jour = ["defi-tables", "splat", "cours"];
  const rien = leBloc({jour});
  assert.deepEqual([rien.nom, rien.ensuite], ["Défi tables", `Ensuite${NBSP}: SPLAT!`]);
  assert.deepEqual(rien.chemin, ["en-cours:Défi tables", "a-venir:SPLAT!", "a-venir:Mes cours"]);
  assert.equal(rien.fleches, 2);
  const un = leBloc({jour, faits: ["defi-tables"]});
  assert.deepEqual([un.nom, un.ensuite], ["SPLAT!", `Ensuite${NBSP}: Mes cours`], "choix de Gwenaël (planche B2-6) : la suite, tant qu'il y en a une");
  assert.deepEqual(un.chemin, ["fait:✓ Défi tables", "en-cours:SPLAT!", "a-venir:Mes cours"]);
  const deux = leBloc({jour, faits: ["defi-tables", "splat"]});
  assert.deepEqual([deux.nom, deux.bouton, deux.fini, deux.ensuite], ["Mes cours", "Ouvrir mes cours", false, "✓ Défi tables  ✓ SPLAT!"],
    "Mes cours n'est jamais « faite » : elle reste jusqu'au soir");
  assert.deepEqual(deux.chemin, ["fait:✓ Défi tables", "fait:✓ SPLAT!", "en-cours:Mes cours"]);
  // Une étape faite plus loin dans la liste : sautée, la suivante pas faite est annoncée.
  const desordre = leBloc({jour, faits: ["splat"]});
  assert.deepEqual([desordre.nom, desordre.ensuite], ["Défi tables", `Ensuite${NBSP}: Mes cours`]);
  // Une activité finie pour de bon (SPLAT! entier) est sautée.
  const finie = leBloc({jour, faits: ["defi-tables"], jauges: {splat: {fait: 40, total: 40}}});
  assert.equal(finie.nom, "Mes cours");
});

test("la liste ne garde que les portes de l'élève : fermée, inconnue, en double, Mes cours ailleurs qu'au bout, Mes cours sans chapitre", () => {
  assert.equal(leBloc({jour: ["flash-anzan", "splat"]}).nom, "SPLAT!", "Anzan n'est pas une porte de l'élève : sautée");
  assert.deepEqual(leBloc({jour: ["<img>", "splat", "splat", "defi-tables"]}).chemin, ["en-cours:SPLAT!", "a-venir:Défi tables"]);
  assert.deepEqual(leBloc({jour: ["cours", "splat"]}).chemin, null, "Mes cours d'abord (copie trafiquée) : retirée — il reste une étape, pas de chemin");
  assert.equal(leBloc({jour: ["cours", "splat"]}).nom, "SPLAT!");
  assert.deepEqual(leBloc({jour: ["defi-tables", "splat", "cours", "coffres"]}).chemin.length, 3, "trois au plus");
  // Mes cours sans chapitre ouvert n'est pas une porte (afficherEspace la retire de visibles).
  const sansCours = leBloc({applis: ["defi-tables", "coffres", "splat"], jour: ["splat", "cours"]});
  assert.deepEqual([sansCours.nom, sansCours.chemin], ["SPLAT!", null]);
  // Rien d'utilisable : le mode automatique.
  const auto = leBloc({jour: ["flash-anzan"]});
  assert.deepEqual([auto.nom, auto.ensuite, auto.chemin], ["Défi tables", `Ensuite${NBSP}: Mes cours`, ["en-cours:Défi tables", "a-venir:Mes cours"]]);
});

test("sans liste : le mode automatique du lot B1, inchangé (le chemin aussi sur ordinateur dès deux étapes)", () => {
  for (const jour of [undefined, null, [], "splat", {0: "splat"}]) {
    const bloc = leBloc({jour});
    assert.deepEqual([bloc.nom, bloc.ensuite], ["Défi tables", `Ensuite${NBSP}: Mes cours`], JSON.stringify(jour));
  }
  const ensuite = leBloc({jour: [], faits: ["defi-tables"]});
  assert.deepEqual([ensuite.nom, ensuite.ensuite, ensuite.chemin], ["Mes cours", "✓ Défi tables", ["fait:✓ Défi tables", "en-cours:Mes cours"]]);
  const seule = leBloc({applis: ["splat", "coffres"], jour: [], nCours: 0});
  assert.deepEqual([seule.nom, seule.chemin, seule.avecChemin], ["SPLAT!", null, false], "une seule étape : pas de chemin, la ligne du B1");
});

test("le chemin et la ligne : écrits tous les deux, la feuille de style choisit (900 px) ; rien en innerHTML ; même hauteur", () => {
  assert.match(page, /<div class="jour-haut"><h2 class="jour-tete" id="jour-tete">Aujourd’hui<\/h2><p class="jour-ensuite" id="jour-ensuite"><\/p><p class="jour-chemin" id="jour-chemin" hidden><\/p><\/div>/);
  assert.match(style, /\n {2}\.jour-chemin \{ display: none; \}\n/, "au téléphone, jamais le chemin");
  const grand = style.slice(style.indexOf("@media (min-width: 900px) {"));
  assert.match(grand, /\.jour-carte\.avec-chemin \.jour-ensuite \{ display: none; \}/);
  assert.match(grand, /\.jour-carte\.avec-chemin \.jour-chemin:not\(\[hidden\]\) \{ display: flex; \}/);
  assert.match(grand, /\.jour-chemin > span \{ flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; \}/, "un nom trop long : une ellipse, pas une deuxième ligne");
  assert.match(grand, /\.jour-tete \{ flex: none; \}/, "« Aujourd'hui » jamais coupé");
  assert.doesNotMatch(page, /matchMedia/, "rien ne saute au redimensionnement");
  assert.deepEqual(SECTION_JOUR.match(/innerHTML[^;]*;/g), ["innerHTML = CHECK_BLANC;", "innerHTML = icone(appli.cle);"], "seulement les dessins de la page");
  assert.doesNotMatch(fonctionDe(page, "poserJour"), /\.style\.|scroll/);
  assert.match(style, /\.jour-carte \{ min-height: 182px; \}\n\s*@media \(max-width: 359px\) \{ \.jour-carte \{ min-height: 204px; \} \}/);
  assert.match(style, /\.jour-carte, \.jour-carte\.fini \{ min-height: 164px;/);
  const piege = leBloc({applis: ["defi-tables", "splat"], jour: ["defi-tables", "splat"], nCours: 0});
  assert.ok(piege.chemin.every(x => !x.includes("<")), "du texte");
});

// ------------------------------------------------------------ la copie de l'onglet

function laCopie() {
  const magasin = {};
  const stockage = () => ({getItem: k => (k in magasin ? magasin[k] : null), setItem: (k, v) => { magasin[k] = String(v); }, removeItem: k => { delete magasin[k]; }});
  const code = page.slice(page.indexOf('  const CLE_COPIE = "mathsgo-suivi-espace";'), page.indexOf("  // Les tuiles du haut, notées à chaque lecture"));
  const outils = new Function("stockage", "lireCode", "JAUGES", "hautCourant",
    `${code}\nreturn {lireCopie, garderCopie, ecrireCopie};`)(stockage, () => "ABC234", {"defi-tables": {}, "splat": {}, "coffres": {}}, null);
  return {magasin, ...outils};
}

test("la copie de l'onglet garde la liste du jour ; une copie trafiquée ne garde que des clés connues, trois au plus", () => {
  const {magasin, lireCopie, garderCopie, ecrireCopie} = laCopie();
  garderCopie("ABC234", {prenom: "Léa", classe: "405", applis: [APPLI("defi-tables"), APPLI("splat")], jour: ["defi-tables", "splat", 7]}, {});
  assert.deepEqual(JSON.parse(magasin["mathsgo-suivi-espace"]).jour, ["defi-tables", "splat"], "gardée (sans ce qui n'est pas une clé)");
  assert.deepEqual(lireCopie("ABC234").jour, ["defi-tables", "splat"], "relue : au retour d'une appli, le bloc ne saute pas");
  garderCopie("ABC234", {prenom: "Léa", classe: "405", applis: []}, {});
  assert.deepEqual(lireCopie("ABC234").jour, [], "pas de liste : automatique");
  ecrireCopie({code: "ABC234", applis: [], jour: ["<img>", "__proto__", "toString", "cours", "splat", "defi-tables", "coffres"]});
  assert.deepEqual(lireCopie("ABC234").jour, ["cours", "splat", "defi-tables"], "inconnues retirées, trois au plus");
  for (const jour of ["splat", {a: 1}, null, 3]) {
    ecrireCopie({code: "ABC234", applis: [], jour});
    assert.deepEqual(lireCopie("ABC234").jour, [], JSON.stringify(jour));
  }
  assert.match(fonctionDe(page, "afficherEspace"), /poserJour\(visibles, jauges \|\| \{\}, espace, donnees, code, nCours\);/,
    "la liste arrive par « donnees » : la réponse du serveur ou la copie, la même règle");
});

// ------------------------------------------------------------ Ma classe › Réglages

const debutCarte = prof.indexOf("  // --------------------------------- « Aujourd'hui, dans Mon espace » (lot B2, 21/11/2026)");
const finCarte = prof.indexOf("  // ------------------------------------------- « Régler … » (serveur pro, lot 5b)");
assert.ok(debutCarte > 0 && finCarte > debutCarte, "la section de la carte");
const SECTION_CARTE = prof.slice(debutCarte, finCarte);
const APPLIS_PROF = prof.slice(prof.indexOf("  const APPLIS = ["), prof.indexOf("];", prof.indexOf("  const APPLIS = [")) + 2);

function laCarte(classe, appels = []) {
  const elements = {};
  const $ = id => { if (!elements[id]) elements[id] = new Noeud(id); return elements[id]; };
  const messages = {};
  const etat = {classe, reglageEnCours: false};
  const outils = new Function("document", "$", "messager", "etat", "appelBorne",
    `let classe = etat.classe; let reglageEnCours = false; let droitClasse = "proprietaire"; let generation = 1; let jeton = "j";
     const SANS_VERIFICATION = "…"; function surErreur() {} function poserEtatDeClasse() {} async function relireBornee() { return false; }
     ${APPLIS_PROF}
     function nomDeLAppli(cle) { return (APPLIS.find(appli => appli.cle === cle) || {nom: cle}).nom; }
     ${SECTION_CARTE}
     return {poserJourClasse, choisirEtapeDuJour, choisirModeDuJour, enregistrerJour, jourAutomatique, brouillon: () => jourBrouillon};`)(
    documentFaux, $, (id, texte, type) => { messages[id] = [texte, type]; }, etat,
    async (action, corps) => { appels.push([action, corps]); return {ok: true, jour: corps.jour}; });
  const lu = () => ({
    auto: $("jour-auto").checked, liste: $("jour-liste").checked, autoTexte: $("jour-auto-texte").textContent,
    etapesCachees: $("jour-etapes").hidden,
    choix: [1, 2, 3].map(n => $(`jour-${n}`).value), grises: [1, 2, 3].map(n => $(`jour-${n}`).disabled),
    options: [1, 2, 3].map(n => $(`jour-${n}`).enfants.map(o => o.textContent)),
    apercu: $("jour-apercu").textContent
  });
  return {outils, lu, messages, elements};
}

test("la carte : sans réglage, « Automatique » cochée avec ce que calcule Mon espace ; les noms vus par l'élève", () => {
  const {outils, lu} = laCarte({id: 1, libelle: "306", applis: ["defi-tables", "coffres", "splat", "cours"], jour: []});
  outils.poserJourClasse(true);
  const vu = lu();
  assert.deepEqual([vu.auto, vu.liste, vu.etapesCachees], [true, false, true]);
  assert.equal(vu.autoTexte, "Défi tables, puis Mes cours.");
  assert.equal(vu.apercu, `Ce que voient les élèves${NBSP}: Défi tables → Mes cours (Mes cours reste jusqu’au soir).`);
  assert.deepEqual(vu.options[0], ["Défi tables", "Coffres magiques", "SPLAT!", "Mes cours"], "les portes de la classe, « Mes cours » et pas « Cours »");
  assert.deepEqual(vu.options[1][0], "— rien —");
  const sansTables = laCarte({id: 3, libelle: "5e A", applis: ["splat", "coffres"], jour: []});
  sansTables.outils.poserJourClasse(true);
  assert.equal(sansTables.lu().autoTexte, "Coffres magiques.", "sans Défi tables : la première activité dans l'ordre du catalogue (comme Mon espace), pas de Mes cours");
});

test("la carte : liste de deux, liste de trois ; Mes cours ferme la liste et grise la suite ; pas de doublon", () => {
  const {outils, lu} = laCarte({id: 2, libelle: "405", applis: ["defi-tables", "coffres", "splat", "cours"], jour: ["defi-tables", "splat"]});
  outils.poserJourClasse(true);
  let vu = lu();
  assert.deepEqual([vu.liste, vu.etapesCachees, vu.choix, vu.grises], [true, false, ["defi-tables", "splat", ""], [false, false, false]]);
  assert.equal(vu.apercu, `Ce que voient les élèves${NBSP}: Défi tables → SPLAT!, puis «${NBSP}C’est fait${NBSP}!${NBSP}».`);
  outils.choisirEtapeDuJour(2, "cours");
  vu = lu();
  assert.deepEqual(vu.choix, ["defi-tables", "splat", "cours"]);
  assert.equal(vu.apercu, `Ce que voient les élèves${NBSP}: Défi tables → SPLAT! → Mes cours (Mes cours reste jusqu’au soir).`);
  outils.choisirEtapeDuJour(1, "cours");
  vu = lu();
  assert.deepEqual([vu.choix, vu.grises], [["defi-tables", "cours", ""], [false, false, true]], "Mes cours en deuxième : la troisième est vide et grisée");
  outils.choisirEtapeDuJour(2, "splat");
  assert.deepEqual(lu().choix, ["defi-tables", "cours", ""], "rien après Mes cours, même si la liste grisée était forcée");
  outils.choisirEtapeDuJour(1, "");
  vu = lu();
  assert.deepEqual([vu.choix, vu.grises], [["defi-tables", "", ""], [false, false, true]], "« — rien — » : la suite se vide");
  outils.choisirEtapeDuJour(0, "splat");
  outils.choisirEtapeDuJour(1, "splat");
  assert.deepEqual(lu().choix, ["splat", "", ""], "SPLAT! déjà choisi : pas une deuxième fois");
  outils.choisirEtapeDuJour(1, "defi-tables");
  outils.choisirEtapeDuJour(0, "defi-tables");
  assert.deepEqual(lu().choix, ["defi-tables", "", ""], "la même porte remontée en premier : pas de doublon derrière");
  outils.choisirModeDuJour("auto");
  assert.deepEqual([lu().auto, lu().etapesCachees], [true, true]);
});

test("Enregistrer : rien n'est envoyé avant ; puis classes.modifier avec la liste et « avant » ; automatique = liste vide", async () => {
  const appels = [];
  const {outils, messages} = laCarte({id: 2, libelle: "405", applis: ["defi-tables", "coffres", "splat", "cours"], jour: []}, appels);
  outils.poserJourClasse(true);
  outils.choisirModeDuJour("liste");
  outils.choisirEtapeDuJour(1, "splat");
  assert.equal(appels.length, 0, "rien n'est envoyé avant « Enregistrer »");
  await outils.enregistrerJour();
  assert.deepEqual(appels, [["classes.modifier", {classe_id: 2, jour: ["defi-tables", "splat"], avant: {jour: []}}]]);
  assert.deepEqual(messages["message-jour"], [`Enregistré${NBSP}: les élèves de la 405 voient Défi tables, puis SPLAT!`, "ok"]);
  outils.choisirModeDuJour("auto");
  await outils.enregistrerJour();
  assert.deepEqual(appels[1], ["classes.modifier", {classe_id: 2, jour: [], avant: {jour: ["defi-tables", "splat"]}}]);
  await outils.enregistrerJour();
  assert.equal(appels.length, 2, "rien n'a changé : rien n'est envoyé");
});

test("la carte, côté page : en tête des Réglages, les mots des planches, propriétaire seulement, même verrou, rien en innerHTML", () => {
  const reglages = prof.slice(prof.indexOf('<div class="reglages" id="vue-reglages" hidden>'), prof.indexOf("<!-- Ce qui sort de l'imprimante"));
  assert.ok(reglages.indexOf('id="bloc-jour"') > 0 && reglages.indexOf('id="bloc-jour"') < reglages.indexOf('id="bloc-partage"'), "en tête, avant le partage");
  for (const mots of ["Aujourd’hui, dans Mon espace",
    "Le grand bouton en haut de l’espace des élèves. Il propose la première étape pas encore faite aujourd’hui, puis la suivante. Toutes les applis restent ouvertes.",
    `<b>Automatique${NBSP}:</b>`, "<b>Ma liste, dans l’ordre</b>", '<label for="jour-1">D’abord</label>', '<label for="jour-2">Puis</label>', '<label for="jour-3">Puis</label>',
    '<button type="button" id="jour-enregistrer">Enregistrer</button>']) {
    assert.ok(reglages.includes(mots), mots);
  }
  assert.doesNotMatch(SECTION_CARTE, /innerHTML/);
  const enregistrer = fonctionDe(prof, "enregistrerJour");
  assert.match(enregistrer, /droitClasse !== "proprietaire"/);
  assert.match(enregistrer, /reglageEnCours = true;/, "le même verrou que « Régler … »");
  assert.match(enregistrer, /appelBorne\("classes\.modifier", \{classe_id: classeId, jour: voulue, avant: \{jour: b\.depart\.slice\(\)\}\}\)/);
  assert.match(enregistrer, /erreur\.statut === 409[\s\S]*poserEtatDeClasse\(erreur\.donnees\)/, "un 409 : l'état relu");
  assert.match(fonctionDe(prof, "poserEtatDeClasse"), /classe\.jour = donnees\.jour\.filter/);
  assert.match(fonctionDe(prof, "ouvrirReglages"), /poserJourClasse\(true\);/);
  assert.match(fonctionDe(prof, "poserVue"), /if \(vue === "reglages" && classe\) poserJourClasse\(false\);/);
  assert.match(fonctionDe(prof, "oublierEtat"), /jourBrouillon = null;/);
  assert.match(fonctionDe(prof, "viderLaClasse"), /jourBrouillon = null;/);
  assert.ok((prof.match(/"message-jour"\]/g) || []).length >= 2, "le message de la carte est vidé avec les autres");
});
