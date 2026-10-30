import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Serveur pro, lot 5c « Ma classe : les tableaux et la fenêtre de l'élève »
// (25/10/2026). Choix de Gwenaël (étape 4, maquettes 8, 9 et 10) : UNE
// fenêtre pour voir un élève, la même dans les quatre applis, ‹ › pour le
// suivant, la ligne entière se touche (plus de « Parcours », « Détail ▾ » ni
// fenêtre Anzan à part) ; au téléphone, le tableau compact (trois colonnes) ;
// la recherche d'un prénom au-dessus des tableaux ; plus de « Trier par »
// (les titres de colonnes trient) ; les trois cartes du haut de Défi tables
// côte à côte, même largeur, sans filet de couleur.
//
// Serveur pro, lot 5f « la ligne ouvre le parcours » (retours de Gwenaël du
// 25 et du 26/10/2026) : à l'ordinateur, la ligne de Défi tables ouvre
// directement l'écran Mon parcours (la fenêtre répétait la ligne) ; au
// téléphone, où le tableau ne garde que trois colonnes, la fenêtre reste.
// « Revenir à… » quitte la fenêtre pour un « ⋯ » discret au bout de la
// ligne, dans les quatre applis. Coffres, SPLAT! et Anzan gardent leur
// fenêtre.
// Le 28/10/2026, Gwenaël choisit mieux : « ouvrir dans la même fenêtre avec
// une petite croix ». La ligne ouvre la fenêtre partout ; dans Défi tables,
// elle est grande et montre l'écran Mon parcours lui-même (mathsgo.re, dans
// un cadre enfermé), au téléphone comme à l'ordinateur — plus d'onglet par
// élève, ‹ › passent au suivant, ✕ ferme.
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
    const noeud = this;
    this.classList = {
      contains: c => aClasse(noeud, c),
      toggle: (c, oui) => {
        const liste = (noeud.className || "").split(" ").filter(x => x && x !== c);
        if (oui) liste.push(c);
        noeud.className = liste.join(" ");
      }
    };
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
  closest(selecteur) {
    for (let n = this; n; n = n.parent) if (selecteur.startsWith(".") && aClasse(n, selecteur.slice(1))) return n;
    return null;
  }
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

const LIGNE = ["peutRevenir", "boutonGeste", "menuGestes", "placerMenu", "finirLigne"].map(n => fonction(n)).join("\n");
function finir(eleve, {appli = "defi-tables", droit = "proprietaire", telephone = false} = {}) {
  const journal = [];
  const requetes = [];
  const fenetreNav = {innerHeight: 800, innerWidth: telephone ? 390 : 1440,
    matchMedia: requete => { requetes.push(requete); return {matches: telephone && requete === "(max-width: 700px)"}; }};
  const finirLigne = new Function("document", "window", "appliAffichee", "droitClasse", "ouvrirFenetreEleve", "voirFiche", "revenirA",
    `${LIGNE}\nreturn finirLigne;`)(document, fenetreNav, appli, droit,
    e => journal.push(`fenêtre ${e.id}`), e => journal.push(`onglet ${e.id}`), e => journal.push(`revenir ${e.id}`));
  const ligne = new Noeud("tr");
  const nom = new Noeud("td");
  nom.className = "nom";
  nom.textContent = eleve.prenom;
  ligne.append(nom, new Noeud("td"));
  finirLigne(ligne, eleve, nom);
  const toucher = cible => (ligne.ecouteurs.click || []).forEach(f => f({target: cible}));
  return {ligne, nom, journal, toucher, requetes, va: ligne.children[2], plus: ligne.premier(n => n.tag === "details")};
}

test("la ligne : le prénom devient un bouton (du texte, même piégé), « › » au bout ; elle ouvre la fenêtre, dans les quatre applis, au téléphone comme à l'ordinateur (lot 5f)", () => {
  const r = finir({id: 42, prenom: "<img src=x onerror=alert(1)>", restaurable: false, journees: []});
  assert.equal(r.ligne.className, "cliquable");
  assert.equal(r.ligne.dataset.eleve, "42");
  const bouton = r.nom.children[0];
  assert.deepEqual([bouton.tag, bouton.className, bouton.type], ["button", "lien-eleve", "button"]);
  assert.equal(bouton.textContent, "<img src=x onerror=alert(1)>", "posé par textContent");
  assert.equal(r.va.className, "va");
  assert.deepEqual(r.va.children.map(n => [n.tag, n.className, n.textContent, n.attributs["aria-hidden"]]), [["span", "fleche", "›", "true"]],
    "rien à restaurer : la flèche seule, pas de « ⋯ »");
  assert.equal(r.va.attributs["aria-hidden"], undefined, "la case n'est plus cachée aux lecteurs d'écran : le « ⋯ » y vit");
  // Choix de Gwenaël du 28/10 : plus d'onglet par élève — la fenêtre, où
  // Défi tables montre son parcours. Un élève qui n'a rien envoyé aussi.
  for (const appli of ["defi-tables", "coffres", "splat", "flash-anzan"]) {
    for (const telephone of [false, true]) {
      const a = finir({id: 3, prenom: "Léa", restaurable: true, journees: [], lu: {parcours: null}}, {appli, telephone});
      a.toucher(a.ligne.children[1]);
      a.toucher(a.nom.children[0]);
      assert.deepEqual(a.journal, ["fenêtre 3", "fenêtre 3"], `${appli} : la ligne ouvre la fenêtre`);
      assert.deepEqual(a.requetes, [], `${appli} : la largeur de l'écran ne compte plus`);
    }
  }
  assert.doesNotMatch(script, /function tableauCompact\(/, "plus de choix selon la largeur");
  const large = new Function(`${fonction("large")}\nreturn large;`)();
  const a = new Noeud("td"); large(a); assert.equal(a.className, "large");
  const b = new Noeud("td"); b.className = "sans"; large(b); assert.equal(b.className, "sans large");
});

test("« Revenir à… » dans un « ⋯ » discret au bout de la ligne : en écriture, s'il y a une version ; le « ⋯ » n'ouvre pas la ligne (lot 5f)", () => {
  for (const appli of ["defi-tables", "coffres", "splat", "flash-anzan"]) {
    for (const telephone of [false, true]) {
      const r = finir({id: 1, prenom: "Léa", restaurable: true, journees: []}, {appli, telephone});
      assert.ok(r.plus, `${appli} : un « ⋯ »`);
      assert.deepEqual(r.va.children.map(n => n.className), ["plus", "fleche"], "le « ⋯ » puis la flèche");
      const poignee = r.plus.children[0];
      assert.deepEqual([poignee.tag, poignee.textContent, poignee.attributs["aria-label"]], ["summary", "⋯", "Autres actions"]);
      const menu = r.plus.children[1];
      assert.deepEqual(menu.children.map(b => [b.textContent, b.className, b.title]),
        [["Revenir à…", "secondaire", "Revenir à une version précédente de sa progression"]], "un seul geste : Revenir à…");
      r.toucher(poignee);
      r.toucher(menu.children[0]);
      assert.deepEqual(r.journal, [], `${appli} : toucher le « ⋯ » ou son menu n'ouvre ni le parcours ni la fenêtre`);
      menu.children[0].cliquer();
      assert.deepEqual(r.journal, ["revenir 1"], "le bouton lance les deux questions de Revenir à…");
    }
  }
  assert.ok(finir({id: 1, prenom: "Léa", restaurable: false, journees: [{jour: "2026-10-20", calculs: 3}]}).plus, "une journée gardée suffit");
  assert.equal(finir({id: 1, prenom: "Léa", restaurable: false, journees: []}).plus, null, "rien à restaurer : pas de « ⋯ »");
  assert.equal(finir({id: 1, prenom: "Léa", restaurable: true, journees: []}, {droit: "lecture"}).plus, null, "un collègue « voir seulement » : pas de « ⋯ »");
  assert.ok(finir({id: 1, prenom: "Léa", restaurable: true, journees: []}, {droit: "ecriture"}).plus, "un collègue « voir et modifier » : le « ⋯ »");
  // Les deux questions n'ont pas changé : on choisit, PUIS on confirme.
  assert.match(fonction("revenirA"), /\{oui: "Suivant"\}[\s\S]*\{oui: "Restaurer cette version"\}/);
});

// ------------------------------------------------------------ la fenêtre

const FENETRE = ["nomAffiche", "peutRevenir", "ouvrirFenetreEleve", "fermerFenetreEleve", "surFermetureFenetre", "eleveDeLaFenetre",
  "voisinDeLaFenetre", "changerEleveDeLaFenetre", "dessinerFenetreEleve", "paragrapheVide", "seElide", "deNom", "montrerParcours"].map(n => fonction(n)).join("\n");

function fenetre({eleves, ids, appli = "defi-tables", droit = "proprietaire", anzan = true, api = null} = {}) {
  const {$} = creerZones();
  const boite = $("fenetre-eleve");
  boite.className = "fenetre fenetre-eleve";
  const journal = [];
  const demandes = [];
  // Le serveur de poche : chaque billet attend qu'on le libère (dans l'ordre voulu).
  const apiPoche = api || ((action, corps) => new Promise((ok, non) => demandes.push({action, corps, ok, non})));
  const f = new Function("document", "$", "classe", "droitClasse", "appliAffichee", "APPLIS", "ANZAN", "journal", "listes", "api",
    `let eleves = listes.eleves, idsAffiches = listes.ids, fenetreEleveId = null, parcoursAnzanEleve = null, demandeParcours = 0;
     function surErreur(e, zone) { journal.push("surErreur " + zone + " " + e.statut); }
     function raisonDe(e) { return e.message; }
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
    anzan ? {} : null, journal, {eleves, ids}, apiPoche);
  const cadre = () => $("fe-contenu").premier(n => aClasse(n, "fe-cadre"));
  const vue = () => $("fe-contenu").premier(n => n.tag === "iframe");
  const attendre = () => new Promise(r => setTimeout(r, 0));
  return {f, $, boite, journal, demandes, cadre, vue, attendre};
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

test("la fenêtre : ce que montre chaque appli ; Défi tables, la grande fenêtre et son parcours, même sans rien reçu (correctif des lots 5, lot 5f) ; plus de « Revenir à… » dedans", async () => {
  const r = fenetre({eleves: TROIS(), ids: [1, 2, 3]});
  r.f.ouvrirFenetreEleve({id: 1});
  assert.ok(r.boite.classList.contains("avec-parcours"), "la grande fenêtre");
  assert.equal(r.cadre().textContent, "Ouverture du parcours de Léa…", "le temps du billet");
  assert.deepEqual(r.demandes.map(d => [d.action, d.corps]), [["eleves.fiche", {eleve_id: 1}]], "le billet de lecture d'avant");
  assert.deepEqual([r.$("fe-parcours").hidden, r.$("pa-imprimer").hidden, r.$("fe-anzan").hidden], [false, true, true], "« Ouvrir dans un onglet », sous le prénom");
  r.demandes[0].ok({ok: true, billet: "a1b2"});
  await r.attendre();
  assert.equal(r.cadre().children.length, 1, "la phrase d'attente laisse la place au cadre");
  assert.equal(r.vue().src, "https://mathsgo.re/outils/calcul_mental/defi_tables.html#b=a1b2&vue=fiche");
  assert.equal(r.vue().title, "Mon parcours de Léa");
  assert.equal(r.vue().attributs.sandbox, "allow-scripts allow-same-origin allow-modals allow-popups allow-popups-to-escape-sandbox");
  // Le tableau redessiné (toutes les minutes, un prénom changé…) : le parcours reste, sans nouveau billet.
  const vu = r.vue();
  r.f.dessinerFenetreEleve();
  assert.equal(r.demandes.length, 1, "pas de nouveau billet");
  assert.equal(r.vue(), vu, "le même cadre, pas rechargé");
  // › : Lucas, rien reçu — son parcours vierge, par un nouveau billet.
  r.$("fe-message").textContent = "Le parcours de Léa n’a pas pu s’ouvrir.";
  r.$("fe-message").hidden = false;
  r.f.changerEleveDeLaFenetre(1);
  assert.deepEqual([r.$("fe-message").hidden, r.$("fe-message").textContent], [true, ""], "le message de Léa ne suit pas chez Lucas");
  assert.equal(r.vue(), null, "le parcours de Léa est parti");
  assert.equal(r.cadre().textContent, "Ouverture du parcours de <b>Lucas</b>…", "un prénom piégé reste du texte");
  assert.deepEqual(r.demandes.at(-1).corps, {eleve_id: 2}, "rien reçu de Lucas : son parcours quand même");
  r.demandes.at(-1).ok({ok: true, billet: "c3d4"});
  await r.attendre();
  assert.match(r.vue().src, /#b=c3d4&vue=fiche$/);
  // Un collègue « voir seulement » : la même chose (la classe en lecture suffit au billet).
  const lecture = fenetre({eleves: TROIS(), ids: [1, 2, 3], droit: "lecture"});
  lecture.f.ouvrirFenetreEleve({id: 1});
  assert.equal(lecture.demandes.length, 1);
  assert.equal(lecture.$("fe-parcours").hidden, false);
  for (const [appli, attendu] of [["coffres", "coffres 1"], ["splat", "splat 1"]]) {
    const a = fenetre({eleves: TROIS(), ids: [1], appli});
    a.f.ouvrirFenetreEleve({id: 1});
    assert.deepEqual(a.journal, [attendu]);
    assert.deepEqual([a.$("fe-parcours").hidden, a.$("fe-anzan").hidden], [true, true]);
    assert.equal(a.boite.classList.contains("avec-parcours"), false, `${appli} : la fenêtre de toujours`);
    assert.equal(a.demandes.length, 0, `${appli} : rien demandé au serveur`);
    assert.equal(a.$("fe-sous").textContent.startsWith(appli === "splat" ? "SPLAT! · 405" : "Coffres magiques · 405"), true);
  }
  const anzan = fenetre({eleves: TROIS(), ids: [1, 3], appli: "flash-anzan"});
  anzan.f.ouvrirFenetreEleve({id: 1});
  assert.equal(anzan.$("fe-anzan").hidden, false, "Anzan : ses séances");
  anzan.f.dessinerFenetreEleve();
  anzan.f.changerEleveDeLaFenetre(1);
  assert.deepEqual(anzan.journal, ["anzan 1", "anzan redessin", "anzan 3"], "le même élève redessiné garde ses séances montrées ; un autre repart à 10");
  assert.equal(anzan.boite.classList.contains("avec-parcours"), false);
  // Lot 5f : « Revenir à… » n'est plus dans la fenêtre (le « ⋯ » de la ligne).
  assert.doesNotMatch(page, /id="fe-gestes"|id="fe-revenir"/);
  assert.doesNotMatch(fonction("dessinerFenetreEleve"), /peutRevenir|fe-gestes/);
  const sansMoteur = fenetre({eleves: TROIS(), ids: [1], appli: "flash-anzan", anzan: false});
  sansMoteur.f.ouvrirFenetreEleve({id: 1});
  assert.equal(sansMoteur.$("fe-anzan").hidden, true);
  assert.equal(sansMoteur.$("fe-contenu").textContent, "Le moteur d’Anzan n’a pas pu être chargé.");
});

test("le parcours dans la fenêtre : une réponse en retard ne remplace jamais l'élève affiché ; refusé, le message est DANS la fenêtre ; session terminée, la fenêtre se ferme (lot 5f)", async () => {
  const r = fenetre({eleves: TROIS(), ids: [1, 2, 3]});
  r.f.ouvrirFenetreEleve({id: 1});
  r.f.changerEleveDeLaFenetre(1);
  // Le billet de Léa arrive après le › : il est oublié.
  r.demandes[0].ok({ok: true, billet: "lea"});
  await r.attendre();
  assert.equal(r.vue(), null, "pas le parcours de Léa sous le prénom de Lucas");
  r.demandes[1].ok({ok: true, billet: "lucas"});
  await r.attendre();
  assert.match(r.vue().src, /#b=lucas&/);
  // Un refus en retard (Léa) ne s'écrit pas sous le prénom de Lucas.
  const tardif = fenetre({eleves: TROIS(), ids: [1, 2, 3]});
  tardif.f.ouvrirFenetreEleve({id: 1});
  tardif.f.changerEleveDeLaFenetre(1);
  tardif.demandes[0].non(Object.assign(new Error("Refusé."), {statut: 403}));
  await tardif.attendre();
  assert.deepEqual([tardif.$("fe-message").hidden, tardif.$("fe-message").textContent], [true, ""], "pas le refus de Léa chez Lucas");
  assert.equal(tardif.cadre().textContent, "Ouverture du parcours de <b>Lucas</b>…", "Lucas attend toujours son billet");
  // Fermée avant la réponse : rien ne se rouvre, aucun prénom ne revient.
  const f2 = fenetre({eleves: TROIS(), ids: [1, 2, 3]});
  f2.f.ouvrirFenetreEleve({id: 1});
  f2.boite.close();
  f2.demandes[0].ok({ok: true, billet: "tard"});
  await f2.attendre();
  assert.deepEqual([f2.boite.open, f2.$("fe-contenu").textContent, f2.vue()], [false, "", null]);
  assert.equal(f2.$("fe-contenu").dataset.eleve, undefined, "rouverte, elle redemandera un billet");
  // Refusé : le message dans la fenêtre, au-dessus du cadre ; un nouveau dessin redemande.
  const f3 = fenetre({eleves: TROIS(), ids: [1, 2, 3]});
  f3.f.ouvrirFenetreEleve({id: 1});
  f3.demandes[0].non(Object.assign(new Error("Cet élève n’est plus dans tes classes."), {statut: 403}));
  await f3.attendre();
  assert.deepEqual([f3.$("fe-message").hidden, f3.$("fe-message").textContent],
    [false, "Le parcours de Léa n’a pas pu s’ouvrir. Cet élève n’est plus dans tes classes."]);
  assert.equal(f3.cadre().textContent, "", "plus de « Ouverture… » sous le message");
  assert.equal(f3.boite.open, true);
  f3.f.dessinerFenetreEleve();
  assert.equal(f3.demandes.length, 2, "il réessaie au dessin suivant");
  // Session terminée : la fenêtre se ferme, la page demande la reconnexion.
  const f4 = fenetre({eleves: TROIS(), ids: [1, 2, 3]});
  f4.f.ouvrirFenetreEleve({id: 1});
  f4.demandes[0].non(Object.assign(new Error("Session expirée."), {statut: 401}));
  await f4.attendre();
  assert.equal(f4.boite.open, false);
  assert.deepEqual(f4.journal, ["surErreur message-appli 401"]);
});

test("la fenêtre se ferme et oublie l'élève : Fermer, Échap, son élève parti du tableau, une autre classe, la déconnexion", () => {
  const r = fenetre({eleves: TROIS(), ids: [1, 2, 3]});
  r.f.ouvrirFenetreEleve({id: 2});
  r.boite.close();
  assert.equal(r.f.id(), null, "Échap (événement close)");
  assert.deepEqual(["fe-titre", "fe-sous", "fe-contenu", "fe-message"].map(id => r.$(id).textContent), ["", "", "", ""], "plus aucun prénom dans la fenêtre");
  assert.match(script, /\$\("fe-croix"\)\.addEventListener\("click", fermerFenetreEleve\);/, "le ✕ en haut (lot 5f)");
  assert.match(page, /<button type="button" class="secondaire" id="fe-suivant"[^>]*>›<\/button>\s*<button type="button" class="secondaire" id="fe-croix" aria-label="Fermer" title="Fermer">✕<\/button>/);
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
  assert.match(fonction("viderZones"), /"regler", "fenetre-eleve"\]/, "lot 5b : « Ce que voit » est parti, « Régler … » se ferme aussi");
  assert.match(fonction("dessinerTableau"), /if \(fenetreEleveId !== null\) dessinerFenetreEleve\(\);/, "elle suit chaque nouveau dessin du tableau");
});

test("‹ › au clavier (flèches gauche et droite), pas avec Ctrl, Alt ou Cmd", () => {
  const ecoute = blocDepuis(script, script.indexOf('$("fenetre-eleve").addEventListener("keydown"'));
  assert.match(ecoute, /if \(evenement\.altKey \|\| evenement\.ctrlKey \|\| evenement\.metaKey\) return;/);
  assert.match(ecoute, /evenement\.key === "ArrowLeft"\) \{ evenement\.preventDefault\(\); changerEleveDeLaFenetre\(-1\); \}/);
  assert.match(ecoute, /evenement\.key === "ArrowRight"\) \{ evenement\.preventDefault\(\); changerEleveDeLaFenetre\(1\); \}/);
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

test("au téléphone : le tableau compact (trois colonnes et le « ⋯ »), plus de cartes d'élèves ; la fenêtre tient dans 390 px", () => {
  const telephone = style.slice(style.indexOf("Serveur pro, lot 5c (choix de Gwenaël, planche 5"));
  assert.match(telephone, /@media \(max-width: 700px\) \{\s*#tableau th\.large, #tableau td\.large \{ display: none; \}\s*#tableau th\.seul-telephone, #tableau td\.seul-telephone \{ display: table-cell; \}/);
  // Lot 5f : le « ⋯ » reste au téléphone, la flèche part ; les titres passent
  // sur deux lignes (mesuré : 356 px pour 356 à 390 de large, avec le « ⋯ »).
  assert.match(telephone, /#tableau td\.va \{ padding-right: 6px; \}\s*#tableau td\.va \.fleche \{ display: none; \}\s*#tableau th button\[data-tri\] \{ white-space: normal; text-align: left; \}/);
  assert.doesNotMatch(telephone, /#tableau td\.va \{ display: none; \}/, "le « ⋯ » ne disparaît pas au téléphone");
  assert.match(style, /#tableau td\.va \.plus \{ display: inline-block; margin: -9px 0; vertical-align: middle; \}/, "le « ⋯ » ne grandit pas la ligne");
  // Lot 5f : le parcours d'un élève prend tout l'écran du téléphone ; à l'ordinateur, une grande fenêtre.
  assert.match(telephone, /dialog\.fenetre-eleve\.avec-parcours \{ width: 100%; max-width: none; height: 100vh; height: 100dvh; max-height: none;\s*margin: 0; border-radius: 0; \}/);
  assert.match(style, /dialog\.fenetre-eleve\.avec-parcours \{ max-width: 1180px; height: calc\(100vh - 32px\); \}/);
  assert.match(style, /\.avec-parcours \.fenetre-pied \{ display: none; \}/, "le ✕ suffit : le parcours garde la place");
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

test("et un pirate ? La fenêtre n'écrit aucun HTML ni aucun code d'élève ; le seul appel est le billet de lecture d'avant ; le cadre est enfermé", () => {
  const nouvelles = ["finirLigne", "sansAccents", "filtrerRecherche", "direAucun", "ouvrirFenetreEleve", "fermerFenetreEleve", "surFermetureFenetre",
    "eleveDeLaFenetre", "voisinDeLaFenetre", "changerEleveDeLaFenetre", "dessinerFenetreEleve", "ficheChiffres", "paragrapheVide",
    "contenuCoffres", "contenuSplat", "poserTris", "peutRevenir"].map(n => fonction(n)).join("\n");
  assert.doesNotMatch(nouvelles, /\bapi\(|fetch\(|innerHTML|insertAdjacentHTML|outerHTML|\.code\b/);
  // Lot 5f : le parcours dans la fenêtre — un seul appel, le billet de lecture
  // (eleves.fiche, comme « Voir son parcours » avant), aucun HTML, aucun code.
  const parcours = fonction("montrerParcours");
  assert.deepEqual([...parcours.matchAll(/\bapi\("([^"]+)"/g)].map(m => m[1]), ["eleves.fiche"]);
  assert.doesNotMatch(parcours, /fetch\(|innerHTML|insertAdjacentHTML|outerHTML|\.code\b|srcdoc/);
  // Enfermé : ni allow-top-navigation (changer l'adresse de cette page), ni rien d'autre que mathsgo.re.
  assert.doesNotMatch(parcours, /allow-top-navigation|allow-forms|allow-storage-access/);
  assert.match(parcours, /vue\.src = `https:\/\/mathsgo\.re\/outils\/calcul_mental\/defi_tables\.html#b=\$\{encodeURIComponent\(reponse\.billet\)\}&vue=fiche`;/);
  // La politique de contenu de cette page laisse entrer mathsgo.re dans un cadre, et rien d'autre ;
  // aucune page ne se laisse, elle, mettre dans un cadre (lib/entetes.php, testé par le serveur).
  assert.match(page, /\$nonce = entetes_page\('https:\/\/mathsgo\.re'\);/);
  const entetes = lire("_serveur/public/lib/entetes.php");
  assert.match(entetes, /"form-action 'self'; frame-ancestors 'none'"\s*\. \(\$cadres !== '' \? "; frame-src \$cadres" : ''\)\);/);
  // « Ouvrir dans un onglet » : le billet de lecture d'avant (voirFiche), au clic.
  assert.match(script, /\$\("fe-parcours"\)\.addEventListener\("click", \(\) => \{\s*const eleve = eleveDeLaFenetre\(\);\s*if \(eleve\) voirFiche\(eleve, \$\("fe-parcours"\)\);\s*\}\);/);
  assert.match(fonction("voirFiche"), /api\("eleves\.fiche", \{eleve_id: eleve\.id\}\)/);
});
