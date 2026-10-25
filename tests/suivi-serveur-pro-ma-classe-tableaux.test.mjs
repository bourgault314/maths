import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

// Serveur pro, lot 5c « Ma classe : les tableaux et la fenêtre de l'élève »
// (25/10/2026). Choix de Gwenaël (étape 4, maquettes 8, 9 et 10) : UNE
// fenêtre pour voir un élève, la même dans les quatre applis, ‹ › pour le
// suivant, la ligne entière se touche (plus de « Parcours », « Détail ▾ » ni
// fenêtre Anzan à part) ; au téléphone, le tableau compact (trois colonnes) ;
// la recherche d'un prénom au-dessus des tableaux ; plus de « Trier par »
// (les titres de colonnes trient) ; les trois cartes du haut de Défi tables
// côte à côte, même largeur, sans filet de couleur.
//
// Ces tests EXÉCUTENT les fonctions de la page, telles qu'elles y sont
// écrites, avec le VRAI moteur de Défi tables servi par le serveur, et un
// document de poche.

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = chemin => readFileSync(join(racine, chemin), "utf8");
const page = lire("_serveur/public/prof/index.php");
const BALISE = '<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">';
const script = (() => {
  const debut = page.indexOf(BALISE);
  const fin = page.indexOf("</script>", debut);
  assert.ok(debut > 0 && fin > debut, "le script en ligne doit être trouvé");
  return page.slice(debut, fin);
})();
const style = page.slice(page.indexOf("<style>"), page.indexOf("</style>"));
const PARCOURS = createRequire(import.meta.url)(join(racine, "_serveur/public/prof/defi_tables_mon_parcours.js"));
const REFERENCE = JSON.parse(lire("_serveur/tests/parcours-reference.json"));

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
  const m = new RegExp(`(?:async )?function ${nom}\\(`).exec(source);
  assert.ok(m, `la page doit définir ${nom}()`);
  return blocDepuis(source, m.index);
}
function constante(nom, source = script) {
  const position = source.indexOf(`const ${nom} = `);
  assert.ok(position > 0, `la page doit définir ${nom}`);
  let i = position + `const ${nom} = `.length, profondeur = 0, dansTexte = "";
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

// ------------------------------------------------------------ un document de poche

class Noeud {
  constructor(tag) {
    this.tag = tag; this.enfants = []; this.attributs = {}; this.dataset = {}; this.style = {};
    this.className = ""; this.hidden = false; this._texte = ""; this.ecouteurs = {}; this.parent = null;
    this.disabled = false; this.open = false; this.value = "";
  }
  get children() { return this.enfants.filter(e => e.tag !== "#texte"); }
  set textContent(v) { this.enfants = []; this._texte = v === null || v === undefined ? "" : String(v); }
  get textContent() { return this.enfants.length ? this.enfants.map(e => e.textContent).join("") : this._texte; }
  set innerHTML(_) { throw new Error("innerHTML interdit dans la fenêtre de l'élève"); }
  append(...noeuds) { noeuds.forEach(n => { const x = typeof n === "string" ? texte(n) : n; x.parent = this; this.enfants.push(x); }); }
  appendChild(n) { this.append(n); return n; }
  setAttribute(k, v) { this.attributs[k] = String(v); }
  removeAttribute(k) { delete this.attributs[k]; }
  addEventListener(type, f) { (this.ecouteurs[type] = this.ecouteurs[type] || []).push(f); }
  cliquer() { (this.ecouteurs.click || []).forEach(f => f()); }
  showModal() { this.open = true; }
  close() { this.open = false; (this.ecouteurs.close || []).forEach(f => f()); }
  tous(predicat, sortie = []) { this.enfants.forEach(e => { if (predicat(e)) sortie.push(e); e.tous(predicat, sortie); }); return sortie; }
  premier(predicat) { return this.tous(predicat)[0] || null; }
}
function texte(t) { const n = new Noeud("#texte"); n._texte = String(t); return n; }
const document = {createElement: tag => new Noeud(tag), createTextNode: t => texte(t)};
function creerZones() {
  const zones = new Map();
  return {zones, $: id => { if (!zones.has(id)) zones.set(id, new Noeud(id === "fenetre-eleve" ? "dialog" : "div")); return zones.get(id); }};
}
const aClasse = (noeud, classe) => (noeud.className || "").split(" ").includes(classe);

// ------------------------------------------------------------ la recherche

const RECHERCHE = ["nomAffiche", "sansAccents", "filtrerRecherche"].map(n => fonction(n)).join("\n");
const chercher = (liste, mot) => new Function("recherche", `${RECHERCHE}\nreturn filtrerRecherche;`)(mot)(liste);
const CLASSE = [{id: 1, prenom: "Léa", initiale: ""}, {id: 2, prenom: "Lucas", initiale: ""}, {id: 3, prenom: "Maëlys", initiale: "B"},
  {id: 4, prenom: "", initiale: ""}, {id: 5, prenom: "Léon", initiale: ""}];

test("la recherche : sans majuscules ni accents, dans l'ordre du tableau ; « sans prénom » trouve l'élève sans prénom ; vide, tout le monde", () => {
  const ids = (mot) => chercher(CLASSE, mot).map(e => e.id);
  assert.deepEqual(ids(""), [1, 2, 3, 4, 5]);
  assert.deepEqual(ids("   "), [1, 2, 3, 4, 5], "des espaces seuls : tout le monde");
  assert.deepEqual(ids("lea"), [1], "« lea » trouve Léa");
  assert.deepEqual(ids("LÉ"), [1, 5], "Léa puis Léon, l'ordre du tableau");
  assert.deepEqual(ids("mae"), [3], "« mae » trouve Maëlys");
  assert.deepEqual(ids("maëlys b"), [3], "avec l'initiale");
  assert.deepEqual(ids("sans"), [4]);
  assert.deepEqual(ids("zoé"), []);
  assert.equal(chercher(CLASSE, "lé")[0], CLASSE[0], "les mêmes objets : rien n'est recopié");
});

test("la recherche passe par la file de redessin, se vide à une autre classe et à la déconnexion ; la ligne du haut parle toujours de toute la classe", () => {
  assert.match(page, /<input type="search" id="chercher-eleve" placeholder="Chercher un élève" aria-label="Chercher un élève" autocomplete="off" spellcheck="false" maxlength="40">/);
  const ecoute = blocDepuis(script, script.indexOf('$("chercher-eleve").addEventListener("input"'));
  assert.match(ecoute, /recherche = String\(evenement\.target\.value \|\| ""\)\.slice\(0, 40\);\s*redessin\.demander\(\);/);
  assert.match(script, /const CHAMPS_A_VIDER = \[[^\]]*"chercher-eleve"[^\]]*\]/);
  assert.match(fonction("oublierEtat"), /recherche = "";\s*fenetreEleveId = null;\s*idsAffiches = \[\];/);
  assert.match(fonction("oublierRecherche"), /recherche = "";\s*const champ = \$\("chercher-eleve"\);\s*if \(champ\) champ\.value = "";/);
  const dessin = fonction("dessinerTableau");
  assert.match(dessin, /const toutes = elevesDeLOnglet\(\);\s*\/\/[^\n]*\n\s*\/\/[^\n]*\n\s*const lignes = filtrerRecherche\(toutes\);\s*idsAffiches = lignes\.map\(eleve => eleve\.id\);/);
  assert.match(dessin, /finirOnglet\(toutes\);\s*direAucun\(corps, toutes, lignes\);/, "la ligne du haut et « personne » : sur toute la classe");
  assert.match(dessin, /\$\("resume-classe"\)\.textContent = resumeDeLaClasse\(eleves\);/);
});

test("personne ne correspond : une ligne le dit, sur toute la largeur — rien quand la classe est vide", () => {
  const corps = new Noeud("tbody");
  const entete = Object.assign(new Noeud("tr"), {});
  for (let i = 0; i < 7; i += 1) entete.append(new Noeud("th"));
  const doc = Object.assign({}, document, {querySelector: () => entete});
  const direAucun = new Function("document", "recherche", `${fonction("direAucun")}\nreturn direAucun;`)(doc, " <b>lé</b> ");
  direAucun(corps, [], []);
  assert.equal(corps.children.length, 0, "classe vide : rien");
  direAucun(corps, CLASSE, [CLASSE[0]]);
  assert.equal(corps.children.length, 0, "quelqu'un correspond : rien");
  direAucun(corps, CLASSE, []);
  const cellule = corps.children[0].children[0];
  assert.equal(cellule.colSpan, 7);
  assert.equal(cellule.textContent, "Aucun élève ne correspond à « <b>lé</b> ».", "le mot cherché reste du texte");
});

// ------------------------------------------------------------ la ligne

test("la ligne entière ouvre la fenêtre : le prénom devient un bouton (du texte, même piégé), la flèche › au bout", () => {
  const ouverts = [];
  const finirLigne = new Function("document", "ouvrirFenetreEleve", `${fonction("finirLigne")}\nreturn finirLigne;`)(document, e => ouverts.push(e.id));
  const ligne = new Noeud("tr");
  const nom = new Noeud("td");
  nom.className = "nom";
  nom.textContent = "<img src=x onerror=alert(1)>";
  ligne.append(nom, new Noeud("td"));
  finirLigne(ligne, {id: 42}, nom);
  assert.equal(ligne.className, "cliquable");
  assert.equal(ligne.dataset.eleve, "42");
  const bouton = nom.children[0];
  assert.deepEqual([bouton.tag, bouton.className, bouton.type], ["button", "lien-eleve", "button"]);
  assert.equal(bouton.textContent, "<img src=x onerror=alert(1)>", "posé par textContent");
  const va = ligne.children[2];
  assert.deepEqual([va.className, va.textContent, va.attributs["aria-hidden"]], ["va", "›", "true"]);
  ligne.cliquer();
  assert.deepEqual(ouverts, [42]);
  // Le large : une cellule cachée au téléphone, sans perdre ses classes.
  const large = new Function(`${fonction("large")}\nreturn large;`)();
  const a = new Noeud("td"); large(a); assert.equal(a.className, "large");
  const b = new Noeud("td"); b.className = "sans"; large(b); assert.equal(b.className, "sans large");
});

// ------------------------------------------------------------ la fenêtre

const FENETRE = ["nomAffiche", "peutRevenir", "ouvrirFenetreEleve", "fermerFenetreEleve", "surFermetureFenetre", "eleveDeLaFenetre",
  "voisinDeLaFenetre", "changerEleveDeLaFenetre", "dessinerFenetreEleve", "paragrapheVide"].map(n => fonction(n)).join("\n");

function fenetre({eleves, ids, appli = "defi-tables", droit = "proprietaire", anzan = true} = {}) {
  const {$} = creerZones();
  const boite = $("fenetre-eleve");
  const journal = [];
  const f = new Function("document", "$", "classe", "droitClasse", "appliAffichee", "APPLIS", "ANZAN", "journal", "listes",
    `let eleves = listes.eleves, idsAffiches = listes.ids, fenetreEleveId = null, parcoursAnzanEleve = null;
     function contenuDefiTables(e) { journal.push("defi " + e.id); const d = document.createElement("div"); d.textContent = "DT " + e.id; return d; }
     function contenuCoffres(e) { journal.push("coffres " + e.id); return document.createElement("div"); }
     function contenuSplat(e) { journal.push("splat " + e.id); return document.createElement("div"); }
     function ouvrirParcoursAnzan(e) { journal.push("anzan " + e.id); parcoursAnzanEleve = e; }
     function dessinerParcoursAnzan() { journal.push("anzan redessin"); }
     function fermerParcoursAnzan() { parcoursAnzanEleve = null; }
     function messager(id, texte, type) { const bloc = $(id); bloc.textContent = texte || ""; bloc.className = "message " + (type || ""); bloc.hidden = !texte; }
     ${FENETRE}
     boite_ = $("fenetre-eleve"); boite_.addEventListener("close", surFermetureFenetre);
     return {ouvrirFenetreEleve, changerEleveDeLaFenetre, fermerFenetreEleve, dessinerFenetreEleve, id: () => fenetreEleveId, poserIds: l => { idsAffiches = l; }, poserEleves: l => { eleves = l; }};`)(
    document, $, {id: 7, libelle: "405"}, droit, appli,
    [{cle: "defi-tables", nom: "Défi tables"}, {cle: "coffres", nom: "Coffres magiques"}, {cle: "flash-anzan", nom: "Anzan"}, {cle: "splat", nom: "SPLAT!"}],
    anzan ? {} : null, journal, {eleves, ids});
  return {f, $, boite, journal};
}
const TROIS = () => [
  {id: 1, prenom: "Léa", initiale: "", lu: {parcours: {}}, restaurable: true, journees: []},
  {id: 2, prenom: "<b>Lucas</b>", initiale: "", lu: {parcours: null}, restaurable: false, journees: []},
  {id: 3, prenom: "", initiale: "", lu: {parcours: {}}, restaurable: false, journees: [{jour: "2026-10-20", calculs: 3}]}
];

test("la fenêtre : le prénom, « appli · classe · 2 sur 3 », ‹ › dans l'ordre du tableau à l'écran, désactivés aux bouts", () => {
  const r = fenetre({eleves: TROIS(), ids: [3, 1, 2]});
  r.f.ouvrirFenetreEleve(TROIS()[0]);
  assert.equal(r.boite.open, true);
  assert.equal(r.$("fe-titre").textContent, "Léa");
  assert.equal(r.$("fe-sous").textContent, "Défi tables · 405 · 2 sur 3", "Léa est la deuxième ligne du tableau (tri ou recherche)");
  assert.deepEqual([r.$("fe-precedent").disabled, r.$("fe-suivant").disabled], [false, false]);
  r.f.changerEleveDeLaFenetre(1);
  assert.equal(r.$("fe-titre").textContent, "<b>Lucas</b>", "un prénom piégé reste du texte");
  assert.equal(r.$("fe-sous").textContent, "Défi tables · 405 · 3 sur 3");
  assert.deepEqual([r.$("fe-precedent").disabled, r.$("fe-suivant").disabled], [false, true], "le dernier : › désactivé");
  r.f.changerEleveDeLaFenetre(1);
  assert.equal(r.f.id(), 2, "au bout, › ne fait rien");
  r.f.changerEleveDeLaFenetre(-1);
  r.f.changerEleveDeLaFenetre(-1);
  assert.equal(r.$("fe-titre").textContent, "Élève sans prénom");
  assert.deepEqual([r.$("fe-precedent").disabled, r.$("fe-suivant").disabled], [true, false], "le premier : ‹ désactivé");
  // Un seul élève à l'écran (une recherche) : pas de « 1 sur 1 », ni ‹ ni ›.
  const seul = fenetre({eleves: TROIS(), ids: [1]});
  seul.f.ouvrirFenetreEleve(TROIS()[0]);
  assert.equal(seul.$("fe-sous").textContent, "Défi tables · 405");
  assert.deepEqual([seul.$("fe-precedent").disabled, seul.$("fe-suivant").disabled], [true, true]);
});

test("la fenêtre : au bout du tableau, la flèche touchée se désactive et le focus passe à l'autre (le clavier la suit encore)", () => {
  const r = fenetre({eleves: TROIS(), ids: [3, 1, 2]});
  const suivi = [];
  r.$("fe-precedent").id = "fe-precedent"; r.$("fe-suivant").id = "fe-suivant";
  r.$("fe-precedent").focus = () => suivi.push("‹"); r.$("fe-suivant").focus = () => suivi.push("›");
  r.f.ouvrirFenetreEleve(TROIS()[0]);
  document.activeElement = r.$("fe-suivant");
  try {
    r.f.changerEleveDeLaFenetre(1);
    assert.equal(r.$("fe-suivant").disabled, true);
    assert.deepEqual(suivi, ["‹"], "› désactivé sous le doigt : le focus va sur ‹");
    document.activeElement = r.$("fe-precedent");
    r.f.changerEleveDeLaFenetre(-1);
    assert.deepEqual(suivi, ["‹"], "‹ reste actif : le focus ne bouge pas");
  } finally { delete document.activeElement; }
});

test("la fenêtre : ce que montre chaque appli ; « Voir son parcours » pour Défi tables, même sans rien reçu (correctif des lots 5) ; « Revenir à… » en écriture seulement", () => {
  const r = fenetre({eleves: TROIS(), ids: [1, 2, 3]});
  r.f.ouvrirFenetreEleve({id: 1});
  assert.equal(r.$("fe-contenu").textContent, "DT 1");
  assert.deepEqual([r.$("fe-parcours").hidden, r.$("pa-imprimer").hidden, r.$("fe-anzan").hidden], [false, true, true]);
  assert.equal(r.$("fe-gestes").hidden, false, "Léa a une version à restaurer");
  r.$("fe-message").textContent = "Le parcours de Léa n’a pas pu s’ouvrir.";
  r.$("fe-message").hidden = false;
  r.f.changerEleveDeLaFenetre(1);
  // Correctif des lots 5 (relecture Codex, point 8) : rien reçu de Lucas —
  // « Voir son parcours » quand même : Mon parcours s'ouvre vierge, avec son
  // prénom, et sa fiche s'imprime (l'ancien « Parcours » de la ligne aussi).
  assert.equal(r.$("fe-parcours").hidden, false, "rien reçu de Lucas : « Voir son parcours » quand même");
  assert.deepEqual([r.$("fe-message").hidden, r.$("fe-message").textContent], [true, ""], "le message de Léa ne suit pas chez Lucas");
  assert.equal(r.$("fe-gestes").hidden, true, "rien à restaurer");
  r.f.changerEleveDeLaFenetre(1);
  assert.equal(r.$("fe-gestes").hidden, false, "une journée gardée suffit");
  const lecture = fenetre({eleves: TROIS(), ids: [1, 2, 3], droit: "lecture"});
  lecture.f.ouvrirFenetreEleve({id: 1});
  assert.equal(lecture.$("fe-gestes").hidden, true, "un collègue « voir seulement » : pas de « Revenir à… »");
  assert.equal(lecture.$("fe-parcours").hidden, false, "mais « Voir son parcours », oui (billet de lecture)");
  for (const [appli, attendu] of [["coffres", "coffres 1"], ["splat", "splat 1"]]) {
    const a = fenetre({eleves: TROIS(), ids: [1], appli});
    a.f.ouvrirFenetreEleve({id: 1});
    assert.deepEqual(a.journal, [attendu]);
    assert.deepEqual([a.$("fe-parcours").hidden, a.$("fe-anzan").hidden], [true, true]);
    assert.equal(a.$("fe-sous").textContent.startsWith(appli === "splat" ? "SPLAT! · 405" : "Coffres magiques · 405"), true);
  }
  const anzan = fenetre({eleves: TROIS(), ids: [1, 3], appli: "flash-anzan"});
  anzan.f.ouvrirFenetreEleve({id: 1});
  assert.equal(anzan.$("fe-anzan").hidden, false, "Anzan : ses séances");
  anzan.f.dessinerFenetreEleve();
  anzan.f.changerEleveDeLaFenetre(1);
  assert.deepEqual(anzan.journal, ["anzan 1", "anzan redessin", "anzan 3"], "le même élève redessiné garde ses séances montrées ; un autre repart à 10");
  const sansMoteur = fenetre({eleves: TROIS(), ids: [1], appli: "flash-anzan", anzan: false});
  sansMoteur.f.ouvrirFenetreEleve({id: 1});
  assert.equal(sansMoteur.$("fe-anzan").hidden, true);
  assert.equal(sansMoteur.$("fe-contenu").textContent, "Le moteur d’Anzan n’a pas pu être chargé.");
});

test("la fenêtre se ferme et oublie l'élève : Fermer, Échap, son élève parti du tableau, une autre classe, la déconnexion", () => {
  const r = fenetre({eleves: TROIS(), ids: [1, 2, 3]});
  r.f.ouvrirFenetreEleve({id: 2});
  r.boite.close();
  assert.equal(r.f.id(), null, "Échap (événement close)");
  assert.deepEqual(["fe-titre", "fe-sous", "fe-contenu", "fe-message"].map(id => r.$(id).textContent), ["", "", "", ""], "plus aucun prénom dans la fenêtre");
  r.f.ouvrirFenetreEleve({id: 2});
  r.f.poserEleves(TROIS().filter(e => e.id !== 2));
  r.f.dessinerFenetreEleve();
  assert.equal(r.boite.open, false, "l'élève a été supprimé : la fenêtre se ferme");
  assert.equal(r.f.id(), null);
  r.f.ouvrirFenetreEleve({id: 9});
  assert.equal(r.boite.open, false, "un élève inconnu : rien ne s'ouvre");
  assert.match(script, /\$\("fe-fermer"\)\.addEventListener\("click", fermerFenetreEleve\);/);
  assert.match(script, /\$\("fenetre-eleve"\)\.addEventListener\("close", surFermetureFenetre\);/);
  assert.match(fonction("ouvrirClasse"), /oublierRecherche\(\);\s*fermerFenetreEleve\(\);/);
  assert.match(fonction("viderZones"), /"voit", "fenetre-eleve"\]/);
  assert.match(fonction("dessinerTableau"), /if \(fenetreEleveId !== null\) dessinerFenetreEleve\(\);/, "elle suit chaque nouveau dessin du tableau");
});

test("‹ › au clavier (flèches gauche et droite), pas avec Ctrl, Alt ou Cmd", () => {
  const ecoute = blocDepuis(script, script.indexOf('$("fenetre-eleve").addEventListener("keydown"'));
  assert.match(ecoute, /if \(evenement\.altKey \|\| evenement\.ctrlKey \|\| evenement\.metaKey\) return;/);
  assert.match(ecoute, /evenement\.key === "ArrowLeft"\) \{ evenement\.preventDefault\(\); changerEleveDeLaFenetre\(-1\); \}/);
  assert.match(ecoute, /evenement\.key === "ArrowRight"\) \{ evenement\.preventDefault\(\); changerEleveDeLaFenetre\(1\); \}/);
});

// ------------------------------------------------------------ Défi tables dans la fenêtre

function contenuDefi(eleve, record) {
  const lireProgression = new Function("PARCOURS", `${fonction("lireProgression")}\nreturn lireProgression;`)(PARCOURS);
  const f = new Function("document", "PARCOURS", `${["dateLisible", "joursSansRien", "ficheChiffres", "paragrapheVide", "contenuDefiTables"].map(n => fonction(n)).join("\n")}\nreturn contenuDefiTables;`)(document, PARCOURS);
  return f(Object.assign({id: 1, maj_le: "2026-10-23T08:00:00Z", record}, eleve, {lu: lireProgression(eleve.parcours)}));
}
const moins = garder => Object.assign(JSON.parse(JSON.stringify(REFERENCE)), {tables: Object.fromEntries(Object.entries(REFERENCE.tables).filter(([k]) => garder.includes(k)))});

test("Défi tables : les cinq chiffres, ses neuf tables (passées en vert, en cours encadrée), ses calculs en retard écrits", () => {
  const bloc = contenuDefi({parcours: moins(["2", "5", "10"])});
  const chiffres = bloc.premier(n => n.tag === "dl").children.map(div => div.children[0].textContent);
  assert.deepEqual(chiffres, ["Tables passées", "En cours", "Cette semaine", "En retard", "Dernière activité"]);
  assert.equal(bloc.premier(n => n.tag === "dl").children[0].children[1].textContent, "3 / 9");
  const cases = bloc.premier(n => aClasse(n, "cases-tables")).children;
  assert.deepEqual(cases.map(li => li.textContent), ["2", "3", "4", "5", "6", "7", "8", "9", "10"]);
  assert.deepEqual(cases.filter(li => li.className === "passee").map(li => li.textContent), ["2", "5", "10"]);
  const enCours = cases.filter(li => li.className === "encours").map(li => li.textContent);
  assert.ok(enCours.length <= 1, "au plus une table encadrée pour « table de N »");
  assert.equal(cases[0].attributs["aria-label"], "table de 2 : passée", "lu à voix haute");
  assert.equal(bloc.premier(n => aClasse(n, "aide")).textContent, "En vert : passée · encadrée : en cours.");
  const retard = bloc.premier(n => aClasse(n, "fe-retard"));
  if (retard) {
    assert.ok(retard.children.every(li => /^\d+ × \d+$/.test(li.textContent)), "« 7 × 8 », les mots du moteur (libelleFait)");
    assert.match(bloc.tous(n => n.tag === "h3").map(h => h.textContent).join(" | "), /Ses calculs en retard \(\d+\)/);
  }
  // Rien reçu : la phrase, rien d'autre.
  const vide = contenuDefi({parcours: null, maj_le: null});
  assert.equal(vide.textContent, "Rien reçu pour l’instant.");
  // Toutes passées : neuf cases vertes, et le record d'une Légende.
  const legende = contenuDefi({parcours: REFERENCE}, {meilleur: 102000});
  assert.equal(legende.premier(n => aClasse(n, "cases-tables")).children.filter(li => li.className === "passee").length, 9);
  if (PARCOURS.formatTemps) assert.match(legende.textContent, /record : /);
});

// ------------------------------------------------------------ le tri par les titres

test("plus de « Trier par » : chaque titre qui trie a sa clé dans TRIS, et TRIS rien de plus ; la flèche suit aria-sort", () => {
  assert.doesNotMatch(page, /id="tri"|Trier&nbsp;par|ligne-tri/);
  const TRIS = new Function(`${constante("TRIS")}\nreturn TRIS;`)();
  for (const [id, cle] of [["entete-defi-tables", "defi-tables"], ["entete-coffres", "coffres"], ["entete-anzan", "flash-anzan"], ["entete-splat", "splat"]]) {
    const debut = page.indexOf(`<tr id="${id}"`);
    const rangee = page.slice(debut, page.indexOf("</tr>", debut));
    assert.deepEqual([...rangee.matchAll(/data-tri="(\w+)"/g)].map(m => m[1]), TRIS[cle], `${cle} : les titres et TRIS disent la même chose`);
  }
  // poserTris : une colonne que l'appli ne connaît pas repart au prénom ; aria-sort sur le seul titre trié.
  const titres = ["prenom", "acquises", null, "date"].map(cle => {
    const th = new Noeud("th");
    const bouton = cle ? Object.assign(new Noeud("button"), {dataset: {tri: cle}}) : null;
    th.querySelector = () => bouton;
    return th;
  });
  const poser = (tri, appli) => new Function("document", "TRIS", "appliAffichee", "triInitial",
    `let tri = triInitial;\n${fonction("poserTris")}\nposerTris();\nreturn tri;`)({querySelectorAll: () => titres}, TRIS, appli, tri);
  assert.deepEqual(poser({colonne: "acquises", sens: -1}, "defi-tables"), {colonne: "acquises", sens: -1});
  assert.deepEqual(titres.map(th => th.attributs["aria-sort"] || null), [null, "descending", null, null]);
  assert.deepEqual(poser({colonne: "acquises", sens: -1}, "splat"), {colonne: "prenom", sens: 1}, "SPLAT! ne connaît pas « Tables passées »");
  assert.deepEqual(titres.map(th => th.attributs["aria-sort"] || null), ["ascending", null, null, null]);
  assert.match(style, /#tableau th\[aria-sort="ascending"\] button::after \{ content: " ▲";/);
  assert.match(style, /#tableau th\[aria-sort="descending"\] button::after \{ content: " ▼";/);
  assert.match(fonction("dessinerTableau"), /poserTris\(\);/, "la flèche suit chaque tri");
});

// ------------------------------------------------------------ le téléphone, les cartes, la charte

test("au téléphone : le tableau compact (trois colonnes), plus de cartes d'élèves ; la fenêtre tient dans 390 px", () => {
  const telephone = style.slice(style.indexOf("Serveur pro, lot 5c (choix de Gwenaël, planche 5"));
  assert.match(telephone, /@media \(max-width: 700px\) \{\s*#tableau th\.large, #tableau td\.large \{ display: none; \}\s*#tableau th\.seul-telephone, #tableau td\.seul-telephone \{ display: table-cell; \}/);
  assert.match(telephone, /#tableau th:last-child:empty, #tableau td\.va \{ display: none; \}/, "toute la ligne se touche : pas de flèche");
  assert.match(style, /#tableau \.seul-telephone \{ display: none; \}/, "« Trésors » (Coffres) n'existe qu'au téléphone");
  assert.doesNotMatch(style, /#tableau td::before \{ content: attr\(data-libelle\)/, "plus de cartes d'élèves");
  assert.doesNotMatch(script, /dataset\.libelle/, "plus de libellés de cartes");
  assert.match(telephone, /\.fiche-chiffres \{ grid-template-columns: 1fr 1fr; \}/);
  assert.match(telephone, /\.fenetre-eleve \.tableau-operations th \{ font-size: \.68rem; line-height: 1\.2; letter-spacing: 0; text-transform: none; \}/,
    "le tableau par opération de Coffres tient dans la fenêtre (mesuré : 318 px pour 318)");
});

test("les trois cartes du haut de Défi tables : côte à côte (.grille-cartes), même largeur, sans filet de couleur", () => {
  const debut = page.indexOf('<div class="grille-cartes cartes-haut">');
  assert.ok(debut > 0);
  const avant = page.indexOf('id="objectif"'), milieu = page.indexOf('id="fragiles"'), fin = page.indexOf('id="bloc-evaluations"');
  assert.ok(debut < avant && avant < milieu && milieu < fin && fin < page.indexOf('id="outils-tableau"'), "les trois cartes dans la grille, la recherche dessous");
  assert.doesNotMatch(style, /\.objectif \{[^}]*border-left|\.fragiles \{[^}]*border-left|\.eval-carte \{[^}]*border-left/, "sans filet de couleur");
  assert.doesNotMatch(style, /\.eval-carte \{[^}]*max-width/, "même largeur que les deux autres");
});

test("et un pirate ? La fenêtre ne demande rien au serveur, n'écrit aucun HTML et aucun code d'élève", () => {
  const nouvelles = ["finirLigne", "sansAccents", "filtrerRecherche", "direAucun", "ouvrirFenetreEleve", "fermerFenetreEleve", "surFermetureFenetre",
    "eleveDeLaFenetre", "voisinDeLaFenetre", "changerEleveDeLaFenetre", "dessinerFenetreEleve", "ficheChiffres", "paragrapheVide",
    "contenuDefiTables", "contenuCoffres", "contenuSplat", "poserTris", "peutRevenir"].map(n => fonction(n)).join("\n");
  assert.doesNotMatch(nouvelles, /\bapi\(|fetch\(|innerHTML|insertAdjacentHTML|outerHTML|\.code\b/);
  // « Voir son parcours » : le billet de lecture d'avant (voirFiche), au clic.
  assert.match(script, /\$\("fe-parcours"\)\.addEventListener\("click", \(\) => \{\s*const eleve = eleveDeLaFenetre\(\);\s*if \(eleve\) voirFiche\(eleve, \$\("fe-parcours"\)\);\s*\}\);/);
  assert.match(fonction("voirFiche"), /api\("eleves\.fiche", \{eleve_id: eleve\.id\}\)/);
});
