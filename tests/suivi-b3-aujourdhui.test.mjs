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
  assert.ok(regle(" .semaine-jours .case-jour").includes("width: 38px; height: 38px;"), "ronds de 38 px au téléphone");
  assert.ok(regle(" .semaine-jours li").includes("width: 46px;"));
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
  const petit = media("(max-width: 359px)");
  assert.ok(petit.includes(`${SEULE} .semaine-jours .case-jour { width: 32px; height: 32px; }`) && petit.includes(`${SEULE} .semaine-jours li { width: 38px; }`));
  const grand = media("(min-width: 900px)");
  assert.ok(grand.includes(`${SEULE} { grid-column: 1 / -1; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center;`), "sur toute la largeur, le titre, les jours, le compte");
  assert.ok(grand.includes(`${SEULE} .semaine-jours .case-jour { width: 50px; height: 50px; }`), "ronds de 50 px");
  assert.ok(grand.includes(`${SEULE} .semaine-jours li { width: 76px; gap: 10px; }`));
  assert.ok(grand.includes(`${SEULE} .semaine-jours { grid-column: 2; grid-row: 1; --ecart: 26px; }`), "les jours au milieu");
  const moyen = media("(min-width: 900px) and (max-width: 1099px)");
  assert.ok(moyen.includes(`${SEULE} .semaine-jours li { width: 64px; }`) && moyen.includes("--ecart: 14px;"), "le titre garde sa place");
  // Toutes les règles du lot partent du même sélecteur : dès qu'une carte se voit dans la zone
  // (la séance en direct, l'évaluation, le bloc), « Ma semaine » reprend sa petite taille.
  const selecteurs = [...b3.matchAll(/\n\s*(#ecran-espace[^{]*)\{/g)].map(m => m[1]);
  assert.ok(selecteurs.length >= 25 && selecteurs.every(s => s.startsWith(SEULE)), "aucune règle du lot ne touche « Ma semaine » quand le bloc est là");
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
const acces = (applis, chapitres = []) => ({acces: {applis, reglages: chapitres.length ? {cours: {chapitres}} : {}}});
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
  const elements = {};
  const $ = id => { if (!elements[id]) elements[id] = new Noeud(id); return elements[id]; };
  const messages = {};
  const etat = {classe, eleves, relues: 0, relire: null};
  const outils = new Function("document", "$", "messager", "etat", "appelBorne",
    `let classe = etat.classe; let eleves = etat.eleves; let reglageEnCours = false; let droitClasse = "proprietaire"; let generation = 1; let jeton = "j"; let vue = "reglages";
     const SANS_VERIFICATION = "…"; function surErreur() {} function poserQuiVoit() {}
     async function relireBornee() { etat.relues += 1; if (etat.relire) { const lu = etat.relire(); classe = lu.classe; eleves = lu.eleves; return true; } return false; }
     ${APPLIS_PROF}
     function nomDeLAppli(cle) { return (APPLIS.find(appli => appli.cle === cle) || {nom: cle}).nom; }
     ${fonctionDe(prof, "poserEtatDeClasse")}
     ${SECTION_CARTE}
     return {poserJourClasse, choisirEtapeDuJour, choisirModeDuJour, enregistrerJour, portesDuJour, classe: () => classe, poserEleves: liste => { eleves = liste; }};`)(
    documentFaux, $, (id, texte, type) => { messages[id] = [texte, type]; }, etat,
    typeof appels === "function" ? appels : async (action, corps) => { appels.push([action, corps]); return {ok: true, jour: corps.jour}; });
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

test("une porte retirée ailleurs au dernier élève qui l'avait : 409, la carte ne propose plus que les portes vraies et relit la classe", async () => {
  const groupe = groupeMixte();
  let reponse = null;
  const {outils, lu, messages, etat} = laCarte(groupe, async () => { throw reponse; });
  outils.poserJourClasse(true);
  outils.choisirModeDuJour("liste");
  outils.choisirEtapeDuJour(0, "flash-anzan");
  reponse = Object.assign(new Error("changée"), {statut: 409, donnees: {ok: false, applis: GROUPE, jour: [], portes: ["defi-tables", "defi-calcul", "splat", "cours"]}});
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
  assert.equal(outils.classe().portesJour, undefined, "une classe relue ne garde pas les portes d'un refus");
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
  assert.match(enregistrer, /erreur\.statut === 409\) \{\s*poserEtatDeClasse\(erreur\.donnees\);[\s\S]{0,400}await relireBornee\(classeId\);\s*if \(!encoreLa\(\) \|\| !memeClasse\(\)\) return;\s*reglageEnCours = false;\s*poserJourClasse\(true\);/);
  assert.match(fonctionDe(prof, "poserEtatDeClasse"), /if \(Array\.isArray\(donnees\.portes\)\) classe\.portesJour = donnees\.portes\.filter\(cle => typeof cle === "string"\);/);
  assert.match(fonctionDe(prof, "poserAccesDeLEleve"), /if \(classe\) delete classe\.portesJour;/, "un accès changé dans la page : les portes d'un ancien refus ne masquent plus rien");
  // La page compte à partir de ce que le serveur envoie déjà pour chaque élève (« acces ») : elle ne refait pas la règle « classe + ajouts ».
  assert.doesNotMatch(SECTION_CARTE, /\.ajouts\b/);
  assert.match(fonctionDe(prof, "eleveALaPorte"), /const acces = eleve && eleve\.acces;/);
});
