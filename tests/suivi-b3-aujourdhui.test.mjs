// Lot B3 « Aujourd'hui : Aucun, et les portes de quelques élèves »
// (suivi.mathsgo.re, 21/11/2026 — planches B3-1 à B3-6 validées par Gwenaël
// après son groupe mixte 4e/3e, où chaque élève a SES chapitres) :
//  - un troisième choix dans la carte de Ma classe › Réglages, « Aucun » : pas
//    de bloc « Aujourd'hui » pour la classe ; Mon espace commence alors par
//    « Ma semaine », en grand, dans le bleu du bloc (variante C) ;
//  - « Ma liste » propose aussi les portes que seuls quelques élèves ont
//    (une appli en plus, Mes cours dès qu'un élève a un chapitre), dites
//    comme telles (« Anzan · 1 élève sur 4 ») ; un élève qui n'a pas une
//    étape la saute ; s'il n'en a aucune, il a le mode automatique.
//
// Ce test JOUE le vrai code des deux pages (comme tests/suivi-b2-ma-liste).
// Le serveur (« @aucun », les portes possibles, la liste réduite aux portes de
// chaque élève, pas de réécriture croisée) est gardé par _serveur/tests/lancer.php.

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
const applisPhp = lire("_serveur/public/lib/applis.php");
const NBSP = "\u00a0";

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

const NOMS = {"defi-tables": "Défi tables", "splat": "SPLAT!", "cours": "Mes cours", "coffres": "Coffres magiques",
  "flash-anzan": "Anzan", "defi-calcul": "Défi calcul"};
const APPLI = cle => ({cle, nom: NOMS[cle] || cle, url: `https://mathsgo.re/${cle}.html`, ancre: null, disponible: true});

function leBloc({applis, jour, faits = [], nCours = 2}) {
  const el = {};
  const $ = id => { if (!el[id]) el[id] = new Noeud(id); return el[id]; };
  const {poserJour, etapesDuJour} = new Function("document", "$", "icone", "adresseAppli", "ouvrirAppli",
    `${SECTION_JOUR}\nreturn {poserJour, etapesDuJour};`)(documentFaux, $, cle => `<svg data-icone="${cle}"></svg>`, appli => `${appli.url}#b=billet`, () => {});
  $("jour").hidden = true;   // comme dans la page : la carte est cachée tant qu'elle n'est pas posée
  poserJour(applis.map(APPLI), {}, {faits}, {billet: "b", jour}, "ABC234", nCours);
  const chemin = $("jour-chemin");
  return {cache: $("jour").hidden, nom: $("jour-nom").textContent, ensuite: $("jour-ensuite").textContent,
    chemin: chemin.hidden ? null : chemin.enfants.filter(e => e.className !== "fleche").map(e => `${e.className}:${e.textContent}`),
    etapes: etapesDuJour(applis.map(APPLI), jour).map(a => a.cle)};
}

const part = n => `${n}${NBSP}élève${n > 1 ? "s" : ""} sur${NBSP}4`;
const NOA = ["defi-tables", "flash-anzan", "defi-calcul", "splat", "cours"];   // Anzan en plus
const LINA = ["defi-tables", "defi-calcul", "splat", "cours"];                 // sans Anzan

test("« Aucun » : la liste [\"@aucun\"] ne donne aucune étape, la carte reste cachée — quoi que l'élève ait fait", () => {
  for (const faits of [[], ["defi-tables"], ["defi-tables", "splat"]]) {
    const bloc = leBloc({applis: NOA, jour: ["@aucun"], faits});
    assert.deepEqual([bloc.cache, bloc.etapes, bloc.nom], [true, [], ""], JSON.stringify(faits));
  }
  assert.equal(leBloc({applis: [], jour: ["@aucun"]}).cache, true, "sans aucune porte non plus");
  assert.match(fonctionDe(page, "poserJour"), /if \(!liste\.length\) \{ carte\.hidden = true; return; \}/, "aucune étape : la carte est cachée, rien d'autre n'est écrit");
});

test("« Aucun », c'est exactement [\"@aucun\"] : toute autre forme n'éteint pas le bloc", () => {
  for (const [jour, attendu] of [
    [["@aucun", "splat"], "SPLAT!"],          // mêlée (copie trafiquée) : la clé réservée n'est pas une porte, il reste SPLAT!
    [["splat", "@aucun"], "SPLAT!"],
    [["@aucun", "@aucun"], "Défi tables"],    // rien d'utilisable : le mode automatique
    [["@AUCUN"], "Défi tables"],
    [["@autre"], "Défi tables"],
    ["@aucun", "Défi tables"],
    [{0: "@aucun", length: 1}, "Défi tables"],
    [[["@aucun"]], "Défi tables"],
  ]) {
    const bloc = leBloc({applis: NOA, jour});
    assert.deepEqual([bloc.cache, bloc.nom], [false, attendu], JSON.stringify(jour));
  }
});

test("une étape que tous n'ont pas : l'élève qui ne l'a pas la saute ; s'il n'en a aucune, le mode automatique", () => {
  const jour = ["flash-anzan", "defi-tables", "cours"];
  const noa = leBloc({applis: NOA, jour});
  assert.deepEqual([noa.nom, noa.ensuite, noa.chemin], ["Anzan", `Ensuite${NBSP}: Défi tables`, ["en-cours:Anzan", "a-venir:Défi tables", "a-venir:Mes cours"]]);
  // Le serveur n'envoie à Lina que ses portes ; la page fait de même si la liste entière lui arrivait.
  for (const recu of [["defi-tables", "cours"], jour]) {
    const lina = leBloc({applis: LINA, jour: recu});
    assert.deepEqual([lina.nom, lina.ensuite, lina.chemin], ["Défi tables", `Ensuite${NBSP}: Mes cours`, ["en-cours:Défi tables", "a-venir:Mes cours"]], JSON.stringify(recu));
  }
  // Mes cours seulement pour qui a un chapitre : sans chapitre, « cours » n'est pas dans ses portes.
  const sansChapitre = leBloc({applis: ["defi-tables", "splat"], jour: ["splat", "cours"], nCours: 0});
  assert.deepEqual([sansChapitre.nom, sansChapitre.chemin], ["SPLAT!", null]);
  // Aucune étape de la liste : liste vide reçue du serveur, ou liste entière — le mode automatique.
  for (const recu of [[], ["flash-anzan"]]) {
    const auto = leBloc({applis: LINA, jour: recu});
    assert.deepEqual([auto.cache, auto.nom, auto.ensuite], [false, "Défi tables", `Ensuite${NBSP}: Mes cours`], JSON.stringify(recu));
  }
});

// ------------------------------------------------------------ la copie de l'onglet

function laCopie() {
  const magasin = {};
  const stockage = () => ({getItem: k => (k in magasin ? magasin[k] : null), setItem: (k, v) => { magasin[k] = String(v); }, removeItem: k => { delete magasin[k]; }});
  const code = page.slice(page.indexOf('  const CLE_COPIE = "mathsgo-suivi-espace";'), page.indexOf("  // Les tuiles du haut, notées à chaque lecture"));
  const outils = new Function("stockage", "lireCode", "hautCourant",
    `${code}\nreturn {lireCopie, garderCopie, ecrireCopie};`)(stockage, () => "ABC234", null);
  return {magasin, ...outils};
}

test("la copie de l'onglet garde « Aucun » : au retour d'une appli, le bloc ne revient jamais", () => {
  const {magasin, lireCopie, garderCopie, ecrireCopie} = laCopie();
  const donnees = {prenom: "Noa", classe: "Groupe", applis: NOA.map(APPLI)};
  // Une copie d'AVANT « Aucun » (automatique) : elle dessine le bloc une fois…
  garderCopie("ABC234", {...donnees, jour: []}, {});
  assert.deepEqual(lireCopie("ABC234").jour, []);
  assert.equal(leBloc({applis: NOA, jour: lireCopie("ABC234").jour}).cache, false);
  // … la réponse du serveur dit « Aucun » : gardée telle quelle, et relue telle quelle.
  garderCopie("ABC234", {...donnees, jour: ["@aucun"]}, {});
  assert.deepEqual(JSON.parse(magasin["mathsgo-suivi-espace"]).jour, ["@aucun"]);
  assert.deepEqual(lireCopie("ABC234").jour, ["@aucun"], "la clé réservée n'est pas une porte de la copie, et reste quand même");
  assert.equal(leBloc({applis: NOA, jour: lireCopie("ABC234").jour}).cache, true, "au retour : pas de bloc");
  // Même sans aucune porte dans la copie.
  ecrireCopie({code: "ABC234", applis: [], jour: ["@aucun"]});
  assert.deepEqual(lireCopie("ABC234").jour, ["@aucun"]);
  // Une copie trafiquée : « Aucun » mêlé n'est pas « Aucun » ; seules les portes de la copie restent.
  ecrireCopie({code: "ABC234", applis: NOA.map(APPLI), jour: ["@aucun", "splat"]});
  assert.deepEqual(lireCopie("ABC234").jour, ["splat"]);
  ecrireCopie({code: "ABC234", applis: NOA.map(APPLI), jour: ["@aucun", "@aucun"]});
  assert.deepEqual(lireCopie("ABC234").jour, []);
  for (const jour of ["@aucun", {0: "@aucun"}, [["@aucun"]], ["@AUCUN"]]) {
    ecrireCopie({code: "ABC234", applis: NOA.map(APPLI), jour});
    assert.deepEqual(lireCopie("ABC234").jour, [], JSON.stringify(jour));
  }
});

test("la clé réservée : la même partout, et ce n'est pas une appli", () => {
  assert.match(applisPhp, /\nconst JOUR_AUCUN = '@aucun';\n/);
  assert.match(SECTION_JOUR, /\n {2}const JOUR_AUCUN = "@aucun";\n/, "Mon espace");
  assert.match(fonctionDe(page, "lireCopie"), /copie\.jour\.length === 1 && copie\.jour\[0\] === "@aucun";\n\s*copie\.jour = copieSansBloc \? \["@aucun"\]/, "la copie de l'onglet (écrite en clair : lireCopie se rejoue seule)");
  assert.match(prof, /\n {2}const JOUR_AUCUN = "@aucun";\n/, "Ma classe");
  const catalogue = applisPhp.slice(applisPhp.indexOf("const CATALOGUE_APPLIS = ["), applisPhp.indexOf("\n];", applisPhp.indexOf("const CATALOGUE_APPLIS = [")));
  const cles = [...catalogue.matchAll(/\n {4}'([^']+)' => \[/g)].map(m => m[1]);
  assert.ok(cles.includes("defi-tables") && cles.includes("cours") && cles.length >= 7, "les clés du catalogue sont lues");
  assert.deepEqual(cles.filter(cle => cle.startsWith("@")), [], "aucune appli ne commence par « @ »");
  assert.doesNotMatch(prof.slice(prof.indexOf("  const APPLIS = ["), prof.indexOf("];", prof.indexOf("  const APPLIS = ["))), /cle: "@/);
});

// ------------------------------------------------------------ Mon espace sans le bloc (variante C)

const SEULE = "#ecran-espace > .jour-zone:not(:has(> .jour-carte:not([hidden]))) + .semaine";
const regle = suite => {
  const debut = style.indexOf(`  ${SEULE}${suite} {`);
  assert.ok(debut > 0, `la règle « … + .semaine${suite} »`);
  return style.slice(debut, style.indexOf("}", debut) + 1).replace(/\s+/g, " ");
};

test("sans carte à montrer, la zone du bloc ne prend aucune place ; « Ma semaine » devient la tête de la page (variante C)", () => {
  assert.match(style, /\n {2}\.jour-zone:not\(:has\(> \.jour-carte:not\(\[hidden\]\)\)\) \{ display: none; \}\n/, "la zone : ni hauteur ni marge");
  assert.match(page, /<\/section>\n {4}<\/div>\n {4}<section class="semaine" id="semaine" aria-labelledby="semaine-titre" hidden>/, "« Ma semaine » suit la zone : la règle « + » en dépend");
  const tete = regle("");
  for (const mot of ["display: grid;", "border-radius: 22px;", "background: var(--blue-dark);", "box-shadow: 0 10px 26px rgba(5, 47, 103, .18);"]) assert.ok(tete.includes(mot), mot);
  const titre = regle(" h2");
  for (const mot of ["position: static;", "clip: auto;", "color: #f9bf3b;", "font: 900 16px/20px var(--sans);", "white-space: nowrap;"]) assert.ok(titre.includes(mot), mot);
  assert.ok(regle(" .semaine-compte").includes("text-align: right;"), "le compte à droite");
  assert.ok(regle(" .semaine-jours").includes("justify-content: center;"), "les jours centrés");
  // Correctif Codex (point 14) : un jour (--jour) et un rond (--rond) de taille fixe, qui ne rétrécissent
  // pas ; le trait vaut exactement leur différence (mesuré au navigateur de 320 à 1366 px : 0 px d'écart).
  assert.ok(regle(" .semaine-jours").includes("--jour: 46px; --rond: 38px; --ecart: calc(var(--jour) - var(--rond));"), "ronds de 38 px dans des jours de 46 px au téléphone");
  assert.ok(regle(" .semaine-jours .case-jour").includes("width: var(--rond); height: var(--rond);"));
  assert.ok(regle(" .semaine-jours li").includes("flex: none; width: var(--jour);"), "les jours ne rétrécissent pas dans la rangée");
  assert.ok(regle(" .semaine-jours .aujourdhui .case-jour").includes("0 0 0 4px var(--orange)"), "le jour entouré d'orange");
  // Une « Ma semaine » cachée (l'élève n'a rien fait) le reste : suivi.css l'impose à tout élément hidden.
  assert.match(lire("_serveur/public/suivi.css"), /\n\[hidden\] \{ display: none !important; \}\n/);
});

test("« Ma semaine » seule : petit téléphone, ordinateur (toute la largeur, ronds de 50 px), jours resserrés de 900 à 1099 px", () => {
  const debut = style.indexOf(`  ${SEULE} {`);
  const b3 = style.slice(debut, style.indexOf("/* --- Les portes"));
  const media = cond => {
    const d = b3.indexOf(`  @media ${cond} {`);
    assert.ok(d > 0, cond);
    return blocDepuis(b3, d).replace(/\s+/g, " ");
  };
  // Correctif Codex (point 14) : au petit téléphone, sept jours de 36 px (252 px) tiennent à 320 px.
  const petit = media("(max-width: 359px)");
  assert.ok(petit.includes(`${SEULE} .semaine-jours { --jour: 36px; --rond: 30px; }`), "ronds de 30 px dans des jours de 36 px");
  const grand = media("(min-width: 900px)");
  assert.ok(grand.includes(`${SEULE} { grid-column: 1 / -1; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center;`), "sur toute la largeur, le titre, les jours, le compte");
  assert.ok(grand.includes(`${SEULE} .semaine-jours { grid-column: 2; grid-row: 1; --jour: 76px; --rond: 50px; }`), "les jours au milieu, ronds de 50 px");
  assert.ok(grand.includes(`${SEULE} .semaine-jours li { gap: 10px; }`));
  const moyen = media("(min-width: 900px) and (max-width: 1099px)");
  assert.ok(moyen.includes(`${SEULE} .semaine-jours { --jour: 64px; }`), "le titre garde sa place");
  // Toutes les règles du lot partent du même sélecteur : dès qu'une carte se voit dans la zone
  // (la séance en direct, l'évaluation, le bloc), « Ma semaine » reprend sa petite taille.
  // Correctif Codex (point 15) : TOUTES les règles du bloc sont lues, pas seulement celles qui
  // commencent par #ecran-espace — une règle devenue globale ferait rougir ce test.
  const sansCommentaires = b3.replace(/\/\*[\s\S]*?\*\//g, "");
  const selecteurs = [...sansCommentaires.matchAll(/([^{};]+)\{/g)].map(m => m[1].trim()).filter(x => !x.startsWith("@media"));
  assert.ok(selecteurs.length >= 20, `les règles du lot sont lues (${selecteurs.length})`);
  assert.deepEqual(selecteurs.filter(x => !x.startsWith(SEULE)), [], "aucune règle du lot ne touche « Ma semaine » quand le bloc est là");
  assert.match(style, /\.jour-carte \{ min-height: 182px; \}\n\s*@media \(max-width: 359px\) \{ \.jour-carte \{ min-height: 204px; \} \}/, "le bloc, lui, ne change pas");
  assert.doesNotMatch(page, /matchMedia/, "rien ne saute au redimensionnement");
});

// ------------------------------------------------------------ Ma classe › Réglages

const debutCarte = prof.indexOf("  // --------------------------------- « Aujourd'hui, dans Mon espace » (lot B2, 21/11/2026)");
const finCarte = prof.indexOf("  // ------------------------------------------- « Régler … » (serveur pro, lot 5b)");
assert.ok(debutCarte > 0 && finCarte > debutCarte, "la section de la carte");
const SECTION_CARTE = prof.slice(debutCarte, finCarte);
const APPLIS_PROF = prof.slice(prof.indexOf("  const APPLIS = ["), prof.indexOf("];", prof.indexOf("  const APPLIS = [")) + 2);

// Ce que le serveur envoie pour chaque élève (tableau : « acces », classe + ajouts).
// Correctif après la relecture Codex (points 1, 4, 6) : avec ses portes de la
// liste du jour (« portes »), calculées par le serveur — ici, Mes cours quand
// l'élève a un chapitre (le serveur exige un chapitre affichable : gardé par
// _serveur/tests/lancer.php).
const acces = (applis, chapitres = []) => ({acces: {applis, reglages: chapitres.length ? {cours: {chapitres}} : {},
  portes: applis.filter(cle => cle !== "cours" || chapitres.length)}});
// Et pour la classe (tableau : classe.portes_classe, classe.portes) : ses portes à
// elle, puis l'union avec celles de ses élèves, dans l'ordre du catalogue.
const ORDRE = ["defi-tables", "flash-anzan", "defi-calcul", "splat", "coffres", "cours"];
function portesDuServeur(classe, eleves) {
  const chapitres = classe.reglages && classe.reglages.cours && classe.reglages.cours.chapitres;
  const propres = ORDRE.filter(cle => (classe.applis || []).includes(cle) && (cle !== "cours" || (chapitres && chapitres.length)));
  const toutes = ORDRE.filter(cle => propres.includes(cle) || eleves.some(e => e.acces.portes.includes(cle)));
  return {portes_classe: propres, portes: toutes};
}
const GROUPE = ["defi-tables", "defi-calcul", "splat"];
function groupeMixte() {
  return {
    classe: {id: 9, libelle: "405", applis: GROUPE.slice(), reglages: {}, jour: []},
    eleves: [
      acces([...GROUPE, "cours"], ["3e-ARI", "3e-PYT"]),                               // Lina
      acces(["defi-tables", "flash-anzan", "defi-calcul", "splat", "cours"], ["4e-REL"]), // Noa : Anzan en plus
      acces([...GROUPE, "cours"], ["4e-PUI"]),                                         // Maël
      acces([...GROUPE, "cours"], ["4e-FRA"]),                                         // Sacha
    ],
  };
}
function laCarte({classe, eleves}, appels = []) {
  if (classe.portes === undefined) Object.assign(classe, portesDuServeur(classe, eleves));
  const elements = {};
  const $ = id => { if (!elements[id]) elements[id] = new Noeud(id); return elements[id]; };
  const messages = {};
  const etat = {classe, eleves, relues: 0, relire: null};
  const outils = new Function("document", "$", "messager", "etat", "appelBorne", "portesDuServeur",
    `let classe = etat.classe; let eleves = etat.eleves; let reglageEnCours = false; let droitClasse = "proprietaire"; let generation = 1; let jeton = "j"; let vue = "reglages"; let demandeAppli = 0;
     const SANS_VERIFICATION = "…"; function surErreur() {} function poserQuiVoit() {}
     async function relireBornee() { etat.relues += 1; if (etat.relire) { const lu = etat.relire(); if (lu.classe.portes === undefined) Object.assign(lu.classe, portesDuServeur(lu.classe, lu.eleves)); classe = lu.classe; eleves = lu.eleves; return true; } return false; }
     ${APPLIS_PROF}
     function nomDeLAppli(cle) { return (APPLIS.find(appli => appli.cle === cle) || {nom: cle}).nom; }
     ${fonctionDe(prof, "poserEtatDeClasse")}
     ${SECTION_CARTE}
     return {poserJourClasse, choisirEtapeDuJour, choisirModeDuJour, enregistrerJour, portesDuJour, viderCarteJour, classe: () => classe, poserEleves: liste => { eleves = liste; },
       naviguer: () => { demandeAppli += 1; }};`)(
    documentFaux, $, (id, texte, type) => { messages[id] = [texte, type]; }, etat,
    typeof appels === "function" ? appels : async (action, corps) => { appels.push([action, corps]); return {ok: true, jour: corps.jour}; }, portesDuServeur);
  const lu = () => ({
    mode: ["auto", "liste", "aucun"].filter(m => $(`jour-${m}`).checked), autoTexte: $("jour-auto-texte").textContent,
    etapesCachees: $("jour-etapes").hidden, choix: [1, 2, 3].map(n => $(`jour-${n}`).value),
    options: $("jour-1").enfants.map(o => o.textContent),
    apercu: $("jour-apercu").enfants.map(e => (typeof e === "string" ? e : e.textContent)).join(""),
    sauts: $("jour-apercu").enfants.filter(e => typeof e !== "string" && e.className === "jour-saut").map(e => e.textContent)
  });
  return {outils, lu, messages, etat, $};
}

test("la carte propose aussi les portes de quelques élèves, et le dit : dans la liste déroulante et sous l'aperçu", () => {
  const {outils, lu} = laCarte(groupeMixte());
  outils.poserJourClasse(true);
  let vu = lu();
  assert.deepEqual(vu.mode, ["auto"]);
  assert.deepEqual(vu.options, ["Défi tables", `Anzan · ${part(1)}`, "Défi calcul", "SPLAT!", "Mes cours"],
    "Anzan (un élève) est proposé et compté ; Mes cours, que tous ont par leurs chapitres, s'écrit sans rien");
  assert.equal(vu.autoTexte, "Défi tables, puis Mes cours.");
  assert.deepEqual(vu.sauts, [], "rien à signaler : tous ont les deux étapes");
  outils.choisirModeDuJour("liste");
  outils.choisirEtapeDuJour(0, "flash-anzan");
  outils.choisirEtapeDuJour(1, "defi-tables");
  outils.choisirEtapeDuJour(2, "cours");
  vu = lu();
  assert.deepEqual(vu.choix, ["flash-anzan", "defi-tables", "cours"]);
  assert.deepEqual(vu.sauts, [`Anzan${NBSP}: pour ${part(1)} seulement. Les autres sautent cette étape.`], "les mots de la planche B3-3");
  assert.ok(vu.apercu.startsWith(`Ce que voient les élèves${NBSP}: Anzan → Défi tables → Mes cours (Mes cours reste jusqu’au soir).`));
  // Une liste faite d'une seule porte de quelques élèves : les autres n'ont aucune étape.
  outils.choisirEtapeDuJour(1, "");
  vu = lu();
  assert.deepEqual(vu.choix, ["flash-anzan", "", ""]);
  assert.deepEqual(vu.sauts, [`Anzan${NBSP}: pour ${part(1)} seulement. Les autres sautent cette étape.`,
    `3${NBSP}élèves n’ont aucune de ces étapes${NBSP}: le mode automatique à la place.`]);
});

test("Mes cours pour quelques élèves seulement : comptée, dite dans l'automatique ; deux étapes de quelques élèves : « ces étapes »", () => {
  const groupe = groupeMixte();
  groupe.eleves[2] = acces(GROUPE);   // Maël n'a plus de chapitre
  groupe.eleves[3] = acces(GROUPE);   // Sacha non plus
  const {outils, lu} = laCarte(groupe);
  outils.poserJourClasse(true);
  let vu = lu();
  assert.deepEqual(vu.options, ["Défi tables", `Anzan · ${part(1)}`, "Défi calcul", "SPLAT!", `Mes cours · ${part(2)}`]);
  assert.equal(vu.autoTexte, `Défi tables, puis Mes cours (${part(2)}).`);
  assert.deepEqual(vu.sauts, [`Mes cours${NBSP}: pour ${part(2)} seulement. Les autres sautent cette étape.`], "l'automatique le dit aussi");
  outils.choisirModeDuJour("liste");
  outils.choisirEtapeDuJour(0, "flash-anzan");
  outils.choisirEtapeDuJour(1, "cours");
  vu = lu();
  assert.deepEqual(vu.sauts, [`Anzan${NBSP}: pour ${part(1)} seulement${NBSP}; Mes cours${NBSP}: pour ${part(2)} seulement. Les autres sautent ces étapes.`,
    `2${NBSP}élèves n’ont aucune de ces étapes${NBSP}: le mode automatique à la place.`]);
  // Une seule élève sans rien.
  groupe.eleves[2] = acces([...GROUPE, "cours"], ["4e-PUI"]);
  outils.poserEleves(groupe.eleves);
  outils.poserJourClasse(false);
  assert.equal(lu().sauts[1], `1${NBSP}élève n’a aucune de ces étapes${NBSP}: le mode automatique à la place.`);
  // L'automatique : l'activité est une porte de TOUTE la classe, jamais celle d'un seul élève.
  const sansTables = laCarte({classe: {id: 3, libelle: "5e A", applis: ["splat"], reglages: {}, jour: []},
    eleves: [acces(["coffres", "splat"]), acces(["splat"])]});
  sansTables.outils.poserJourClasse(true);
  assert.equal(sansTables.lu().autoTexte, "SPLAT!.", "Coffres (un élève) ne devient pas l'activité automatique de la classe");
  // Une classe sans élève : seulement ses portes à elle, sans compte.
  const vide = laCarte({classe: {id: 4, libelle: "6e B", applis: ["defi-tables", "cours"], reglages: {cours: {chapitres: ["4e-PYT"]}}, jour: []}, eleves: []});
  vide.outils.poserJourClasse(true);
  assert.deepEqual(vide.lu().options, ["Défi tables", "Mes cours"]);
});

test("le troisième choix, « Aucun » : ses mots, ce qui part au serveur ([\"@aucun\"] avec « avant »), le message, et le retour", async () => {
  const appels = [];
  const {outils, lu, messages} = laCarte(groupeMixte(), appels);
  outils.poserJourClasse(true);
  outils.choisirModeDuJour("aucun");
  let vu = lu();
  assert.deepEqual([vu.mode, vu.etapesCachees], [["aucun"], true], "les listes déroulantes sont rangées");
  assert.equal(vu.apercu, `Ce que voient les élèves${NBSP}: pas de grand bouton. Leur espace commence par Ma semaine et leurs activités.`);
  assert.equal(appels.length, 0, "rien n'est envoyé avant « Enregistrer »");
  await outils.enregistrerJour();
  assert.deepEqual(appels, [["classes.modifier", {classe_id: 9, jour: ["@aucun"],
    avant: {jour: [], applis: GROUPE, portes: ["defi-tables", "flash-anzan", "defi-calcul", "splat", "cours"]}}]]);
  assert.deepEqual(messages["message-jour"], [`Enregistré${NBSP}: pas de grand bouton pour les élèves de la 405.`, "ok"]);
  assert.deepEqual(lu().mode, ["aucun"], "la carte reste sur « Aucun »");
  await outils.enregistrerJour();
  assert.equal(appels.length, 1, "rien n'a changé : rien n'est envoyé");
  // Retour à l'automatique : « avant » dit ["@aucun"].
  outils.choisirModeDuJour("auto");
  await outils.enregistrerJour();
  assert.deepEqual(appels[1][1], {classe_id: 9, jour: [], avant: {jour: ["@aucun"], applis: GROUPE, portes: ["defi-tables", "flash-anzan", "defi-calcul", "splat", "cours"]}});
  // Une classe déjà sur « Aucun » : le troisième rond est coché à l'ouverture, « Ma liste » repart de l'automatique.
  const groupe = groupeMixte();
  groupe.classe.jour = ["@aucun"];
  const deja = laCarte(groupe);
  deja.outils.poserJourClasse(true);
  assert.deepEqual([deja.lu().mode, deja.lu().etapesCachees], [["aucun"], true]);
  deja.outils.choisirModeDuJour("liste");
  assert.deepEqual(deja.lu().choix, ["defi-tables", "cours", ""], "jamais « @aucun » dans une liste déroulante");
  assert.ok(!deja.lu().options.some(o => o.includes("@")));
});

test("une porte retirée ailleurs au dernier élève qui l'avait : 409, la carte prend les portes vraies du refus et relit la classe", async () => {
  const groupe = groupeMixte();
  let reponse = null;
  const {outils, lu, messages, etat} = laCarte(groupe, async () => { throw reponse; });
  outils.poserJourClasse(true);
  outils.choisirModeDuJour("liste");
  outils.choisirEtapeDuJour(0, "flash-anzan");
  reponse = Object.assign(new Error("changée"), {statut: 409, donnees: {ok: false, applis: GROUPE, jour: [],
    portes: ["defi-tables", "defi-calcul", "splat", "cours"], portes_classe: GROUPE}});
  // La relecture échoue (serveur muet) : la carte tient quand même les portes du refus.
  await outils.enregistrerJour();
  assert.equal(etat.relues, 1, "la classe est relue : ce que voit chaque élève a pu changer");
  assert.deepEqual(lu().options, ["Défi tables", "Défi calcul", "SPLAT!", "Mes cours"], "Anzan n'est plus proposé, même si la liste des élèves est encore l'ancienne");
  assert.deepEqual(lu().mode, ["auto"]);
  assert.deepEqual(messages["message-jour"], [`La 405 a été changée ailleurs${NBSP}: la carte montre l’état actuel, refais ton choix.`, "erreur"]);
  // La relecture réussit : la classe et ses élèves sont remplacés, les comptes repartent de là.
  const frais = groupeMixte();
  frais.eleves[1] = acces([...GROUPE, "cours"], ["4e-REL"]);
  frais.eleves[3] = acces(GROUPE);
  etat.relire = () => frais;
  outils.choisirModeDuJour("liste");
  await outils.enregistrerJour();
  assert.deepEqual(lu().options, ["Défi tables", "Défi calcul", "SPLAT!", `Mes cours · ${part(3)}`]);
  assert.equal(outils.classe().effectifsPerimes, undefined, "une classe relue : les comptes sont sûrs");
});

test("correctif Codex 1 — dans l'autre sens : Anzan donné ailleurs, « Aucun » refusé (409), la relecture échoue — la liste rendue est gardée ENTIÈRE, un second clic n'efface rien", async () => {
  const groupe = groupeMixte();
  groupe.eleves[1] = acces([...GROUPE, "cours"], ["4e-REL"]);   // la page croit que personne n'a Anzan
  delete groupe.classe.portes;
  const appels = [];
  let reponse = null;
  const {outils, lu, messages, etat} = laCarte(groupe, async (action, corps) => { appels.push(corps); if (reponse) throw reponse; return {ok: true, jour: corps.jour}; });
  outils.poserJourClasse(true);
  assert.ok(!lu().options.some(o => o.startsWith("Anzan")), "au départ, Anzan n'est la porte de personne");
  outils.choisirModeDuJour("aucun");
  // Ailleurs : Anzan donné à Noa, et la liste [Anzan] enregistrée.
  reponse = Object.assign(new Error("changée"), {statut: 409, donnees: {ok: false, applis: GROUPE, jour: ["flash-anzan"],
    portes: ["defi-tables", "flash-anzan", "defi-calcul", "splat", "cours"], portes_classe: GROUPE}});
  await outils.enregistrerJour();
  assert.equal(etat.relues, 1);
  let vu = lu();
  assert.deepEqual([vu.mode, vu.choix], [["liste"], ["flash-anzan", "", ""]], "la liste du refus, telle quelle — jamais « Liste vide, donc automatique »");
  assert.equal(vu.options[1], "Anzan · quelques élèves", "Anzan proposé : la porte vient du serveur ; le compte n'est pas sûr, il ne s'invente pas");
  assert.ok(!vu.apercu.includes("Liste vide"));
  assert.ok(vu.sauts.includes(`Le nombre d’élèves n’a pas pu être relu${NBSP}: recharge la page pour le voir.`), "et la carte le dit");
  assert.ok(!vu.sauts.some(t => t.includes("aucune de ces étapes")), "pas de compte des élèves sans étape, faux lui aussi");
  // Un second clic sur Enregistrer, sans rien retoucher : rien ne part.
  reponse = null;
  await outils.enregistrerJour();
  assert.equal(appels.length, 1, "rien n'est envoyé : la liste vraie est déjà en place");
  assert.deepEqual(messages["message-jour"], ["Aucune modification dans cet onglet.", "info"]);
});

test("correctif Codex 5 — une autre classe demandée pendant l'envoi : le 409 de la première ne la relit pas par-dessus (la navigation garde la priorité)", async () => {
  let lacher = null;
  const reponse = Object.assign(new Error("changée"), {statut: 409, donnees: {ok: false, applis: GROUPE, jour: [], portes: GROUPE, portes_classe: GROUPE}});
  const {outils, etat, lu} = laCarte(groupeMixte(), () => new Promise((_, refuser) => { lacher = () => refuser(reponse); }));
  outils.poserJourClasse(true);
  outils.choisirModeDuJour("aucun");
  const fin = outils.enregistrerJour();
  await new Promise(r => setImmediate(r));
  outils.naviguer();   // le professeur choisit la seconde classe : ouvrirClasse avance demandeAppli
  lacher();
  await fin;
  assert.equal(etat.relues, 0, "pas de relecture de la première classe : elle annulerait l'ouverture de la seconde");
  assert.equal(outils.classe().effectifsPerimes, true, "la carte (si on la revoit) sait que ses comptes sont à relire");
  assert.deepEqual(lu().mode, ["auto"], "l'état du refus est quand même posé");
  const enregistrer = fonctionDe(prof, "enregistrerJour");
  assert.match(enregistrer, /const navigation = demandeAppli;/);
  assert.match(enregistrer, /const relu = demandeAppli === navigation && await relireBornee\(classeId\);/);
  assert.equal((enregistrer.match(/relireBornee\(/g) || []).length, 1, "une seule relecture, toujours gardée");
  assert.match(fonctionDe(prof, "ouvrirClasse"), /demandeAppli \+= 1;\s*const numero = demandeAppli;/, "c'est bien ce compteur que la navigation avance");
});

test("correctif Codex 7 — enregistré : la confirmation dit le choix, la classe est relue avant de montrer les comptes", async () => {
  const appels = [];
  const {outils, messages, etat, lu} = laCarte(groupeMixte(), appels);
  // Pendant l'envoi, un autre onglet a donné Anzan à Lina aussi : la relecture le dit.
  const frais = groupeMixte();
  frais.eleves[0] = acces(["defi-tables", "flash-anzan", "defi-calcul", "splat", "cours"], ["3e-ARI"]);
  frais.classe.jour = ["flash-anzan"];
  etat.relire = () => frais;
  outils.poserJourClasse(true);
  outils.choisirModeDuJour("liste");
  outils.choisirEtapeDuJour(0, "flash-anzan");
  outils.choisirEtapeDuJour(1, "");
  await outils.enregistrerJour();
  assert.equal(etat.relues, 1, "relue après l'envoi réussi");
  assert.deepEqual(messages["message-jour"], [`Enregistré${NBSP}: la liste de la 405.`, "ok"], "pas « les élèves de la 405 voient Anzan » : seuls certains l'ont");
  assert.deepEqual(lu().sauts[0], `Anzan${NBSP}: pour ${part(2)} seulement. Les autres sautent cette étape.`, "le compte relu, pas celui d'avant l'envoi");
  outils.choisirModeDuJour("auto");
  await outils.enregistrerJour();
  assert.deepEqual(messages["message-jour"], [`Enregistré${NBSP}: la 405 est en automatique.`, "ok"]);
  // La relecture échoue : la carte garde les portes de la réponse, et ne présente pas ses comptes comme actuels.
  const panne = laCarte(groupeMixte(), async (action, corps) => ({ok: true, jour: corps.jour, portes: ["defi-tables", "flash-anzan", "defi-calcul", "splat", "cours"], portes_classe: GROUPE}));
  panne.outils.poserJourClasse(true);
  panne.outils.choisirModeDuJour("liste");
  panne.outils.choisirEtapeDuJour(0, "flash-anzan");
  await panne.outils.enregistrerJour();
  assert.equal(panne.outils.classe().effectifsPerimes, true);
  assert.equal(panne.lu().options[1], `Anzan · ${part(1)}`, "le dernier compte connu…");
  assert.ok(panne.lu().sauts.includes(`Le nombre d’élèves n’a pas pu être relu${NBSP}: recharge la page pour le voir.`), "… dit comme tel");
});

test("correctif Codex 13 — quitter la classe range toute la carte : les ronds, les listes, leur bloc", () => {
  const {outils, $, lu} = laCarte(groupeMixte());
  outils.poserJourClasse(true);
  outils.choisirModeDuJour("liste");
  assert.deepEqual([lu().mode, lu().etapesCachees], [["liste"], false]);
  outils.viderCarteJour();
  assert.deepEqual([lu().mode, lu().etapesCachees, lu().choix, lu().options, lu().apercu], [[], true, ["", "", ""], [], ""]);
  outils.poserJourClasse(true);
  outils.choisirModeDuJour("aucun");
  outils.viderCarteJour();
  assert.equal($("jour-aucun").checked, false, "le troisième rond aussi");
  assert.match(fonctionDe(prof, "viderLaClasse"), /viderCarteJour\(\);/);
  assert.match(fonctionDe(prof, "viderZones"), /viderCarteJour\(\);/, "et à la déconnexion");
});

test("correctif Codex 4 et 6 — la page ne refait pas la règle des portes ; les réponses de l'écriture et d'un tableau frais sont appliquées à la classe concernée", () => {
  // Les portes : celles du serveur, jamais recalculées depuis les applis ou les chapitres.
  for (const nom of ["porteDeLaClasse", "eleveALaPorte", "portesDuJour"]) {
    assert.doesNotMatch(fonctionDe(prof, nom), /chapitres|\.applis|reglages/, `${nom} : pas de règle recopiée`);
  }
  assert.match(fonctionDe(prof, "eleveALaPorte"), /clesLues\(eleve\.acces\.portes\)/);
  assert.match(fonctionDe(prof, "portesDuJour"), /clesLues\(classe\.portes\)/);
  // poserAccesDeLEleve : la réponse d'un envoi réussi, et les portes de SA classe seulement.
  const eleve = {id: 3, ajouts: {}, acces: {applis: ["defi-tables"], portes: ["defi-tables"]}};
  const reportes = [];
  const jouer = (classe, donnees) => new Function("classe", "reporterAccesDeLaListe",
    `${fonctionDe(prof, "clesLues")}\n${fonctionDe(prof, "poserPortesDeClasse")}\n${fonctionDe(prof, "poserAccesDeLEleve")}\nposerAccesDeLEleve(arguments[2], arguments[3]); return classe;`)(classe, l => reportes.push(l), eleve, donnees);
  const autre = jouer({id: 8, portes: ["defi-tables"]}, {ajouts: {"flash-anzan": {}}, acces: {applis: ["defi-tables", "flash-anzan"], portes: ["defi-tables", "flash-anzan"]},
    classe_portes: {classe_id: 9, portes: ["defi-tables", "flash-anzan"], portes_classe: ["defi-tables"]}});
  assert.deepEqual(eleve.acces.portes, ["defi-tables", "flash-anzan"], "ce que voit l'élève : la réponse");
  assert.deepEqual(reportes, [[eleve]], "reporté sur les listes des autres onglets");
  assert.deepEqual(autre.portes, ["defi-tables"], "les portes d'une AUTRE classe ne touchent pas la classe ouverte");
  const meme = jouer({id: 9, portes: ["defi-tables"]}, {classe_portes: {classe_id: 9, portes: ["defi-tables", "flash-anzan"], portes_classe: ["defi-tables"]}});
  assert.deepEqual([meme.portes, meme.portes_classe], [["defi-tables", "flash-anzan"], ["defi-tables"]]);
  const regler = fonctionDe(prof, "enregistrerRegler");
  assert.match(regler, /const reponse = await appelBorne\("eleves\.acces"[^;]*;\s*reussis\.push\(eleve\);[\s\S]{0,400}if \(encoreLa\(\) && memeClasse\(\)\) poserAccesDeLEleve\(eleve, reponse\);/, "la réponse d'un envoi réussi, après vérification de la classe");
  assert.match(regler, /erreur\.statut === 409 && encoreLa\(\) && memeClasse\(\)\) poserAccesDeLEleve\(eleve, erreur\.donnees\);/, "un 409 tardif : seulement si c'est encore la même classe");
  assert.match(regler, /const reponse = await appelBorne\("classes\.modifier"[^;]*;\s*classeEcrite = true;[\s\S]{0,200}poserPortesDeClasse\(reponse\);/);
  // Un tableau frais (changement d'onglet) : la classe ET ses élèves, ensemble, si c'est encore la classe ouverte.
  const afficher = fonctionDe(prof, "afficherAppli");
  assert.match(afficher, /if \(!classe \|\| classe\.id !== classeId\) return;\s*if \(donnees && donnees\.classe && donnees\.classe\.id === classeId\) reprendreLaClasse\(donnees\.classe\);/);
  const reprise = new Function("classe", `${fonctionDe(prof, "reprendreLaClasse")}\nreprendreLaClasse(arguments[1]); return classe;`)(
    {id: 9, libelle: "405", applis: ["splat"], jour: [], portes: ["splat"], droit: "proprietaire", effectifsPerimes: true},
    {id: 9, libelle: "405", applis: ["defi-tables"], reglages: {}, jour: ["@aucun"], portes: ["defi-tables", "flash-anzan"], portes_classe: ["defi-tables"], droit: "lecture"});
  assert.deepEqual(reprise, {id: 9, libelle: "405", applis: ["defi-tables"], reglages: {}, jour: ["@aucun"], portes: ["defi-tables", "flash-anzan"], portes_classe: ["defi-tables"], droit: "proprietaire"},
    "activités, liste et portes reprises ; le droit reste celui de l'ouverture ; les comptes redeviennent sûrs");
});

test("correctif Codex 10 — au retour dans l'onglet, « Aucun » reçu du serveur s'applique et se garde DÈS la réponse, avant les jauges", () => {
  const {jourPourLaCopie} = new Function("stockage", "lireCode", "hautCourant",
    `${page.slice(page.indexOf('  const CLE_COPIE = "mathsgo-suivi-espace";'), page.indexOf("  // Les tuiles du haut, notées à chaque lecture"))}\nreturn {jourPourLaCopie};`)(() => null, () => "", null);
  const applis = NOA.map(APPLI);
  assert.deepEqual(jourPourLaCopie({applis, jour: ["@aucun"]}), ["@aucun"]);
  assert.deepEqual(jourPourLaCopie({applis, jour: ["flash-anzan", "x", 3, "splat", "defi-tables", "cours"]}), ["flash-anzan", "splat", "defi-tables"], "comme lireCopie la relirait");
  assert.deepEqual(jourPourLaCopie({applis}), []);
  const ouvrir = fonctionDe(page, "ouvrir");
  const lecture = ouvrir.indexOf("const lecture = lireJauges(donnees, code)");
  const tout = ouvrir.indexOf("if (copie && JSON.stringify(jourPourLaCopie(donnees)) !== JSON.stringify(copie.jour || [])) {");
  const attente = ouvrir.indexOf("const jauges = copie ? await lecture");
  assert.ok(lecture > 0 && tout > lecture && attente > tout, "la lecture des jauges part, la liste du jour s'applique, PUIS on attend les jauges");
  assert.match(ouvrir.slice(tout, attente), /afficherEspace\(donnees, code, copie\.jauges\);\s*garderCopie\(code, donnees, copie\.jauges\);/, "dessinée et gardée avec les jauges de la copie");
});

test("la carte, côté page : trois choix dans UN groupe, dans l'ordre des planches ; « avant » dit les portes proposées ; rien en innerHTML", () => {
  const carte = prof.slice(prof.indexOf('<div id="bloc-jour">'), prof.indexOf('<p class="jour-apercu" id="jour-apercu"></p>'));
  const groupe = carte.slice(carte.indexOf('<div class="jour-modes" role="radiogroup"'));
  assert.equal((carte.match(/role="radiogroup"/g) || []).length, 1);
  assert.deepEqual([...groupe.matchAll(/<input type="radio" name="jour-mode" id="jour-([a-z]+)"/g)].map(m => m[1]), ["auto", "liste", "aucun"], "Automatique, Ma liste, puis le troisième");
  assert.ok(groupe.indexOf('id="jour-etapes"') > groupe.indexOf('id="jour-liste"') && groupe.indexOf('id="jour-etapes"') < groupe.indexOf('id="jour-aucun"'), "les trois listes restent collées à « Ma liste »");
  assert.ok(groupe.includes(`<span><b>Aucun${NBSP}:</b> pas de grand bouton, les élèves choisissent.</span>`), "les mots choisis par Gwenaël (planche B3-6)");
  assert.match(prof, /\n {2}\.jour-modes > label \{ display: flex;/, "les ronds seulement : les étiquettes « D'abord / Puis » gardent leur mise en forme");
  assert.match(prof, /\$\("jour-aucun"\)\.addEventListener\("change", \(\) => choisirModeDuJour\("aucun"\)\);/);
  assert.match(fonctionDe(prof, "dessinerJourClasse"), /\["jour-auto", "jour-liste", "jour-aucun", "jour-enregistrer"\]\.forEach\(id => \{ \$\(id\)\.disabled = occupe; \}\);/, "grisés ensemble pendant un enregistrement");
  assert.doesNotMatch(SECTION_CARTE, /innerHTML/);
  const enregistrer = fonctionDe(prof, "enregistrerJour");
  assert.match(enregistrer, /const portesProposees = portesDuJour\(\);/);
  assert.match(enregistrer, /erreur\.statut === 409\) \{\s*poserEtatDeClasse\(erreur\.donnees\);[\s\S]{0,600}await relireSiPermis\(\);\s*if \(!encoreLa\(\) \|\| !memeClasse\(\)\) return;\s*reglageEnCours = false;\s*poserJourClasse\(true\);/);
  assert.match(fonctionDe(prof, "poserEtatDeClasse"), /poserPortesDeClasse\(donnees\);/, "les portes vraies du refus (correctif : prises telles quelles)");
  assert.match(fonctionDe(prof, "poserAccesDeLEleve"), /portes\.classe_id === classe\.id\) poserPortesDeClasse\(portes\);/, "les portes d'une réponse d'élève : seulement pour SA classe");
  // La page compte à partir de ce que le serveur envoie (« acces.portes ») : elle ne refait pas la règle « classe + ajouts ».
  assert.doesNotMatch(SECTION_CARTE, /\.ajouts\b/);
});
