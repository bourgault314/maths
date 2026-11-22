import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Serveur pro, correctif des lots 5a, 5c, 5c-bis et 5d après la relecture
// unique de Codex (25/10/2026, RELECTURE-CODEX-lots-5.md, douze points).
//
// Chaque test rejoue un point avec les VRAIES fonctions de la page (extraites
// telles qu'elles y sont écrites) et rougit sans le correctif. Le navigateur
// est joué à part, sur le banc du lot (repro.py : les douze scénarios de
// Codex, réponses retardées, refusées ou coupées).

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const page = readFileSync(join(racine, "_serveur/public/prof/index.php"), "utf8");
const BALISE = '<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">';
const script = page.slice(page.indexOf(BALISE), page.indexOf("</script>", page.indexOf(BALISE)));
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

function fonction(nom) {
  const m = new RegExp(`(?:async )?function ${nom}\\(`).exec(script);
  assert.ok(m, `la page doit définir ${nom}()`);
  return blocDepuis(script, m.index);
}

// « const NOM = […]; » ou « const NOM = {…}; », tel qu'écrit dans la page.
function constante(nom) {
  const debut = script.indexOf(`const ${nom} = `);
  assert.ok(debut >= 0, `la page doit définir ${nom}`);
  return script.slice(debut, script.indexOf(";\n", debut) + 1);
}

function ecouteur(id) {
  const debut = script.indexOf(`$("${id}").addEventListener`);
  assert.ok(debut >= 0, `la page doit écouter #${id}`);
  return blocDepuis(script, debut);
}

const tic = () => new Promise(r => setTimeout(r, 0));

// Une réponse du serveur qu'on livre quand on veut (le réseau qui traîne).
function enAttente() {
  let livrer, refuser;
  const promesse = new Promise((ok, ko) => { livrer = ok; refuser = ko; });
  return {promesse, livrer, refuser};
}

// Un nœud de poche : du texte, une valeur, ouvert ou fermé.
class Noeud {
  constructor(id) { this.id = id; this.textContent = ""; this.value = ""; this.hidden = false; this.className = ""; this.open = false; this.enfants = []; this.style = {}; }
  close() { this.open = false; }
  appendChild(n) { this.enfants.push(n); return n; }
  append(...n) { this.enfants.push(...n); }
  closest() { return null; }
  getBoundingClientRect() { return this.rect || {left: 0, right: 0, top: 0, bottom: 0}; }
  set innerHTML(_) { throw new Error("innerHTML interdit"); }
}
function zones() {
  const carte = new Map();
  const $ = id => { if (!carte.has(id)) carte.set(id, new Noeud(id)); return carte.get(id); };
  return {carte, $};
}

// ------------------------------------------------- point 1 : les réponses périmées

// allerDansUneClasse et chargerClasses, les vraies ; le serveur répond quand
// le test le décide. « seDeconnecter » fait ce que fait oublierEtat sur ces
// compteurs (le test de lot 4b-bis rejoue la vraie) ; « autreGeste » ce que fait
// une classe ouverte depuis le menu ou un onglet (demandeAppli avance).
function navigation({ecranClasse = true} = {}) {
  const journal = [];
  const reponses = [];
  const z = zones();
  z.$("ecran-classe").hidden = !ecranClasse;
  z.$("ecran-premiere-classe").hidden = true;
  z.$("ecran-compte").hidden = true;
  const f = new Function("journal", "reponses", "$",
    `let classes = [{id: 1, libelle: "405", annee: "2026-2027", droit: "proprietaire"}], classe = {id: 1, libelle: "405"};
     let eleves = [{id: 1}], tableaux = {}, vue = "appli", droitClasse = "proprietaire", idsAffiches = [];
     let evaluation = null, evalContenu = null, ligueRecords = null, voitEleve = null;
     let demandeAppli = 0, generation = 0, anneeCourante = "", jeton = "jeton";
     async function api(action) { journal.push(action); const r = enAttente(); reponses.push(r); return r.promesse; }
     function enAttente() { let livrer, refuser; const promesse = new Promise((ok, ko) => { livrer = ok; refuser = ko; }); return {promesse, livrer, refuser}; }
     function annoncerFinAnnee(donnees) { journal.push("bandeaux " + (donnees.classes || []).length); }
     function montrer(ecran) { journal.push("montrer " + ecran); }
     function oublierDerniereClasse() {} function fermerFenetreEleve() {} function oublierRecherche() {}
     function arreterVeilleEvaluation() {} function viderLaClasse() { journal.push("document vidé"); }
     async function ouvrirClasse(id) { journal.push("ouvrir " + id); return true; }
     ${["chargerClasses", "classeAOuvrir", "quitterLaClasse", "montrerSansClasse", "allerDansUneClasse"].map(fonction).join("\n")}
     return {allerDansUneClasse, classes: () => classes, classe: () => classe,
       seDeconnecter() { jeton = ""; classes = []; classe = null; demandeAppli += 1; generation += 1; },
       seReconnecter() { jeton = "autre-jeton"; },
       autreGeste() { demandeAppli += 1; }};`)(journal, reponses, z.$);
  return {f, journal, reponses, $: z.$};
}
const LISTE_VIDE = {ok: true, classes: [], echues: [], annee_courante: "2026-2027"};
const LISTE_2 = {ok: true, classes: [{id: 1, libelle: "405", annee: "2026-2027", droit: "proprietaire"},
  {id: 2, libelle: "306", annee: "2026-2027", droit: "proprietaire"}], echues: [], annee_courante: "2026-2027"};

test("point 1 — la liste des classes arrivée APRÈS « Se déconnecter » ne pose rien : ni liste, ni bandeau, ni écran", async () => {
  const r = navigation({ecranClasse: false});
  const aller = r.f.allerDansUneClasse(1);
  await tic();
  r.f.seDeconnecter();
  r.reponses[0].livrer(LISTE_VIDE);
  assert.equal(await aller, false, "périmé");
  assert.deepEqual(r.journal, ["classes.liste"], "pas de « Crée ta première classe » sur l'écran de connexion, pas de bandeau");
  assert.deepEqual(r.f.classes(), [], "la liste vidée par la déconnexion reste vide");
  // Même chose si quelqu'un s'est reconnecté entre-temps (nouveau jeton).
  const s = navigation({ecranClasse: false});
  const vieux = s.f.allerDansUneClasse(1);
  await tic();
  s.f.seDeconnecter();
  s.f.seReconnecter();
  s.reponses[0].livrer(LISTE_2);
  assert.equal(await vieux, false);
  assert.deepEqual(s.journal, ["classes.liste"]);
});

test("point 1 — deux « Ma classe » : la première réponse, arrivée en dernier, n'ouvre plus rien ; une classe ouverte depuis le menu non plus", async () => {
  const r = navigation({ecranClasse: false});
  const premier = r.f.allerDansUneClasse(1);
  await tic();
  const second = r.f.allerDansUneClasse(1);
  await tic();
  r.reponses[1].livrer(LISTE_2);
  assert.equal(await second, true);
  r.f.autreGeste();   // 306 ouverte par le menu
  r.reponses[0].livrer(LISTE_2);
  assert.equal(await premier, false, "la vieille navigation est périmée");
  assert.deepEqual(r.journal.filter(l => l.startsWith("ouvrir")), ["ouvrir 1"], "une seule ouverture : celle de la réponse à jour");
  // Une panne d'une navigation périmée ne se dit pas non plus.
  const p = navigation({ecranClasse: false});
  const vieille = p.f.allerDansUneClasse(1);
  await tic();
  p.f.autreGeste();
  p.reponses[0].refuser(new Error("Le serveur ne répond pas."));
  assert.equal(await vieille, false, "une panne périmée ne remonte pas");
});

test("point 1 — Professeurs : la liste arrivée après « Se déconnecter », ou après une lecture plus récente, n'est pas posée", async () => {
  const z = zones();
  const reponses = [];
  const etat = {generation: 0, jeton: "jeton"};
  const f = new Function("$", "document", "api", "surErreur", "etat",
    `const identifiant = "gwenael"; let demandeProfs = 0;
     let generation = 0; let jeton = "jeton";
     function menuGestes() {} function boutonGeste() { return {}; }
     function reinitialiserProf() {} function desactiverProf() {} function reactiverProf() {} function supprimerProf() {}
     ${fonction("chargerProfs")}
     return {chargerProfs, deconnecter() { jeton = ""; generation += 1; demandeProfs += 1; }};`)(
    z.$, {createElement: b => Object.assign(new Noeud(b), {classList: {add() {}}})},
    () => { const r = enAttente(); reponses.push(r); return r.promesse; }, e => { throw e; }, etat);
  const lecture = f.chargerProfs();
  await tic();
  f.deconnecter();
  reponses[0].livrer({ok: true, profs: [{id: 2, identifiant: "collegue", classes: 1, eleves: 4}]});
  await lecture;
  assert.equal(z.$("liste-profs").enfants.length, 0, "aucun identifiant de collègue réintroduit dans le document");
  // Deux lectures (après « Nouveau mot de passe ») : seule la dernière se pose.
  const g = new Function("$", "document", "api",
    `const identifiant = "gwenael"; let demandeProfs = 0, generation = 0; const jeton = "jeton";
     function surErreur(e) { throw e; } function menuGestes() {} function boutonGeste() { return {}; }
     function reinitialiserProf() {} function desactiverProf() {} function reactiverProf() {} function supprimerProf() {}
     ${fonction("chargerProfs")}\nreturn chargerProfs;`)(
    z.$, {createElement: b => Object.assign(new Noeud(b), {classList: {add() {}}})},
    () => { const r = enAttente(); reponses.push(r); return r.promesse; });
  const a = g();
  await tic();
  const b = g();
  await tic();
  reponses[2].livrer({ok: true, profs: [{id: 1, identifiant: "gwenael", classes: 0}]});
  await b;
  reponses[1].livrer({ok: true, profs: [{id: 1, identifiant: "gwenael", classes: 0}, {id: 2, identifiant: "collegue", classes: 0}]});
  await a;
  assert.equal(z.$("liste-profs").enfants.length, 1, "la vieille lecture n'ajoute pas ses lignes à la nouvelle");
});

test("point 1 — « moi » demandé avant une déconnexion ne touche plus à la page ; oublierEtat avance la session", () => {
  const demarrer = fonction("demarrer");
  assert.match(demarrer, /const depart = generation;\s*return api\("moi"\)\.then\(donnees => \{\s*if \(depart !== generation\) return undefined;/);
  assert.match(demarrer, /\}\)\.catch\(erreur => \{\s*if \(depart !== generation\) return;/);
  assert.match(fonction("oublierEtat"), /demandeAppli \+= 1;[\s\S]*?generation \+= 1;\s*demandeProfs \+= 1;/);
});

// ------------------------------------------------- point 2 : la classe partie

function purge() {
  const z = zones();
  const f = new Function("$", "quitterImpressions",
    `${["ZONES_TEXTE", "ZONES_MESSAGE", "ZONES_HORS_CLASSE", "ZONES_DE_LA_CLASSE", "MESSAGES_DE_LA_CLASSE"].map(constante).join("\n")}
     let classe = {id: 1}, eleves = [{id: 1}], tableaux = {x: 1}, vue = "eleves", droitClasse = "lecture", idsAffiches = [1, 2, 3];
     let evaluation = {}, evalContenu = {}, ligueRecords = {}, voitEleve = {}, demandeAppli = 0, fenetreEleveId = 2, recherche = "léa";
     function fermerFenetreEleve() { $("fenetre-eleve").close(); fenetreEleveId = null; }
     function oublierRecherche() { recherche = ""; }
     function arreterVeilleEvaluation() {}
     function viderCarteJour() {}   // (lot B3, correctif Codex point 13 : joué par tests/suivi-b3-aujourdhui)
     ${["viderLaClasse", "quitterLaClasse"].map(fonction).join("\n")}
     return {quitterLaClasse, ZONES_DE_LA_CLASSE, etat: () => ({classe, eleves, tableaux, vue, idsAffiches, evaluation, ligueRecords, demandeAppli})};`)(
    z.$, () => { z.$("bandelettes").textContent = ""; });
  return {f, $: z.$};
}

test("point 2 — la classe partie (supprimée, partage retiré) : ses prénoms, ses codes, son nom et ses fenêtres quittent le document tout de suite", () => {
  const r = purge();
  const restes = {"corps": "Hugo Jade Liam", "corps-eleves": "HU-12 JA-34", "titre-classe": "306", "titre-classe-colle": "306",
    "resume-classe": "3 élèves", "fe-titre": "Hugo", "fe-contenu": "7 × 8", "records-semaine": "Jade 1:02", "menu-classes-liste": "306",
    "liste-partages": "collegue", "regler-corps": "Liam", "qui-voit-etat": "Ouvert à quelques élèves · Liam", "af-titre": "SPLAT! est fermé à la 306"};
  Object.entries(restes).forEach(([id, texte]) => { r.$(id).textContent = texte; });
  r.$("nom-classe").value = "306";
  r.$("chercher-eleve").value = "hu";
  r.$("message-appli").textContent = "Version restaurée : Hugo";
  r.$("message-appli").hidden = false;
  r.$("fenetre-eleve").open = true;
  r.$("regler").open = true;
  r.$("liste-profs").textContent = "collegue · 1 classe";
  r.$("echues-texte").textContent = "1 classe de l'année 2025-2026";
  r.f.quitterLaClasse();
  for (const id of Object.keys(restes)) assert.equal(r.$(id).textContent, "", `${id} vidé`);
  assert.deepEqual([r.$("nom-classe").value, r.$("chercher-eleve").value], ["", ""], "le nom de la classe et la recherche");
  assert.deepEqual([r.$("message-appli").textContent, r.$("message-appli").hidden], ["", true]);
  assert.deepEqual([r.$("fenetre-eleve").open, r.$("regler").open], [false, false], "les fenêtres se ferment (lot 5b : « Régler … »)");
  assert.equal(r.$("liste-profs").textContent, "collegue · 1 classe", "Professeurs n'est pas à la classe : il reste");
  assert.equal(r.$("echues-texte").textContent, "1 classe de l'année 2025-2026", "le bandeau de l'année non plus");
  const e = r.f.etat();
  assert.deepEqual([e.classe, e.eleves, e.tableaux, e.vue, e.idsAffiches, e.evaluation, e.ligueRecords], [null, [], {}, "appli", [], null, null]);
  assert.equal(e.demandeAppli, 1, "un onglet ou une classe encore en route ne revient pas");
  for (const id of ["corps", "corps-eleves", "titre-classe", "fe-contenu", "bandelettes-liste"]) assert.ok(r.f.ZONES_DE_LA_CLASSE.includes(id), id);
  assert.ok(!r.f.ZONES_DE_LA_CLASSE.includes("liste-profs"));
});

// ------------------------------------------------- points 3 et 4 : les transitions ratées

function transition({ecran, classe = null}) {
  const z = zones();
  const journal = [];
  ["ecran-connexion", "ecran-premiere-classe", "ecran-classe", "ecran-compte"].forEach(id => { z.$(id).hidden = id !== ecran; });
  const f = new Function("$", "journal", "classeOuverte",
    `let classe = classeOuverte;
     function deconnecter(o) { journal.push("déconnexion " + o.message); }
     function montrer(e) { journal.push("montrer " + e); ["ecran-connexion", "ecran-premiere-classe", "ecran-classe", "ecran-compte"].forEach(id => { $(id).hidden = id !== e; }); }
     ${["messager", "raisonDe", "montrerSansClasse", "echecDeLaTransition"].map(fonction).join("\n")}
     return echecDeLaTransition;`)(z.$, journal, classe);
  return {f, $: z.$, journal};
}
const panne = Object.assign(new TypeError("Failed to fetch"));
const refus = Object.assign(new Error("Le serveur a eu un souci."), {statut: 500});

test("point 3 — supprimée, puis la liste en panne : ni l'ancienne classe ni « Crée ta première classe », mais « Réessayer » et les DEUX nouvelles", () => {
  const r = transition({ecran: "ecran-classe"});   // la classe partie a été oubliée : classe = null
  r.f(panne, "Classe 306 supprimée : il n’en reste rien.");
  assert.equal(r.$("ecran-premiere-classe").hidden, false);
  assert.deepEqual([r.$("carte-premiere-classe").hidden, r.$("carte-reessayer").hidden], [true, false]);
  assert.equal(r.$("message-premiere-classe").textContent,
    "Classe 306 supprimée : il n’en reste rien. Ta classe n’a pas pu s’ouvrir. Le serveur ne répond pas.",
    "ce qui a réussi, puis ce qui a échoué — en français, pas « Failed to fetch »");
  const t = transition({ecran: "ecran-classe"});
  t.f(refus, "Classe 306 supprimée : il n’en reste rien.");
  assert.match(t.$("message-premiere-classe").textContent, /Ta classe n’a pas pu s’ouvrir\. Le serveur a eu un souci\.$/, "le tableau refusé : le message du serveur");
  // La classe ouverte reste valable (bandeau des classes échues) : on le dit là où on est.
  const reste = transition({ecran: "ecran-classe", classe: {id: 1}});
  reste.f(panne, "1 classe supprimée (605). Il n’en reste rien.");
  assert.equal(reste.$("message-classes").textContent, "1 classe supprimée (605). Il n’en reste rien. La liste de tes classes n’a pas pu être relue. Le serveur ne répond pas.");
  const fin = transition({ecran: "ecran-classe"});
  fin.f(Object.assign(new Error("x"), {statut: 401}), "");
  assert.deepEqual(fin.journal, ["déconnexion Session terminée, reconnecte-toi."], "une session finie reste une session finie");
});

test("point 3 — la classe supprimée est oubliée AVANT de relire la liste ; sa panne garde le message de la suppression ; « Réessayer » repart", () => {
  const supprimer = ecouteur("supprimer-classe");
  assert.match(supprimer, /try \{ await api\("classes\.supprimer", \{classe_id: classe\.id\}\); \}\s*catch \(erreur\) \{ surErreur\(erreur, "message-supprimer"\); bouton\.disabled = false; return; \}/,
    "refusée : la classe est toujours là, le message sous le bouton");
  assert.ok(supprimer.indexOf("quitterLaClasse();") < supprimer.indexOf("allerSansPerdre(dit)"), "oubliée d'abord");
  assert.doesNotMatch(supprimer, /messager\(zoneClasses\(\), `Classe \$\{partie\} supprimée : il n’en reste rien\.`, "ok"\);\s*\} catch/,
    "plus de « supprimée » qui écrase la panne");
  const echues = ecouteur("supprimer-echues");
  assert.match(echues, /if \(ouverte && liste\.some\(uneClasse => uneClasse\.id === ouverte\)\) quitterLaClasse\(\);\s*if \(await allerSansPerdre\(dit, ouverte\)\)/,
    "le bandeau : la classe ouverte, si elle était du lot, est oubliée avant");
  assert.match(script, /\$\("reessayer-classe"\)\.addEventListener\("click", \(\) => \{ vue = "appli"; allerSansPerdre\("", lireDerniereClasse\(\)\); \}\);/);
  const ecran = page.slice(page.indexOf('<section id="ecran-premiere-classe"'), page.indexOf("</section>", page.indexOf('<section id="ecran-premiere-classe"')));
  assert.match(ecran, /<div class="carte premiere-classe" id="carte-reessayer" hidden>\s*<h1>Ta classe n’a pas pu s’ouvrir<\/h1>/);
  assert.match(ecran, /<button type="button" id="reessayer-classe">Réessayer<\/button>/);
});

test("point 3 — allerDansUneClasse : la classe partie oubliée tout de suite ; le tableau de la suivante refusé, la panne remonte", async () => {
  const r = navigation({ecranClasse: true});
  const aller = r.f.allerDansUneClasse();
  await tic();
  r.reponses[0].livrer({ok: true, classes: [{id: 2, libelle: "306", annee: "2026-2027", droit: "proprietaire"}], annee_courante: "2026-2027"});
  await aller;
  assert.deepEqual(r.journal, ["classes.liste", "bandeaux 1", "document vidé", "ouvrir 2"], "la 405 (partie) quitte la page AVANT l'ouverture de la 306");
  assert.equal(r.f.classe(), null);
  assert.match(fonction("allerDansUneClasse"), /return ouvrirClasse\(id, \{remonter: true\}\);/);
  assert.match(fonction("ouvrirClasse"), /if \(options && options\.remonter\) throw erreur;/, "ouvrirClasse ne l'avale plus : l'appelant ne croit plus la transition finie");
  assert.match(fonction("allerSansPerdre"), /try \{ return await allerDansUneClasse\(\.\.\.demandees\); \}\s*catch \(erreur\) \{ echecDeLaTransition\(erreur, avant\); return false; \}/);
});

test("point 4 — Mon compte → « Ma classe » en panne : le message sur Mon compte (pas dans la connexion cachée), et « Ma classe » reste", () => {
  const r = transition({ecran: "ecran-compte", classe: {id: 1}});
  r.f(panne, "");
  assert.equal(r.$("ecran-compte").hidden, false, "on reste sur Mon compte");
  assert.equal(r.$("message-compte").textContent, "Ta classe n’a pas pu s’ouvrir. Le serveur ne répond pas. Réessaie avec « Ma classe ».");
  assert.equal(r.$("erreur-connexion").textContent, "");
  assert.deepEqual(r.journal, ["montrer ecran-compte"], "montrer() : « Ma classe » revient aussi après un mot de passe temporaire changé");
  const mdp = transition({ecran: "ecran-compte"});
  mdp.f(refus, "Mot de passe changé. Tes autres appareils sont déconnectés.");
  assert.match(mdp.$("message-compte").textContent, /^Mot de passe changé\. Tes autres appareils sont déconnectés\. Ta classe n’a pas pu s’ouvrir\. Le serveur a eu un souci\./);
  assert.match(ecouteur("retour-compte"), /allerSansPerdre\("", classe && classe\.id\)/);
});

test("point 4 — surErreur : une zone cachée renvoie le message à l'écran AFFICHÉ, plus toujours à la connexion", () => {
  const z = zones();
  ["ecran-connexion", "ecran-premiere-classe", "ecran-classe", "ecran-compte"].forEach(id => { z.$(id).hidden = id !== "ecran-compte"; });
  // message-classes est dans l'écran de la classe, caché.
  z.$("message-classes").closest = () => z.$("ecran-classe");
  z.$("message-compte").closest = () => z.$("ecran-compte");
  const surErreur = new Function("$", `function deconnecter() {}\n${constante("ZONE_DE_L_ECRAN")}\n${["messager", "zoneVisible", "zoneDeLEcranAffiche", "surErreur"].map(fonction).join("\n")}\nreturn surErreur;`)(z.$);
  surErreur(new Error("Le serveur ne répond pas."), "message-classes");
  assert.equal(z.$("message-compte").textContent, "Le serveur ne répond pas.");
  assert.equal(z.$("erreur-connexion").textContent, "");
  assert.match(fonction("zoneClasses"), /if \(!\$\("ecran-compte"\)\.hidden\) return "message-compte";/);
});

// ------------------------------------------------- point 5 : « Voir son parcours » refusé

function fiche({fenetreOuverte}) {
  const z = zones();
  z.$("fenetre-eleve").open = fenetreOuverte;
  const onglet = {fermee: false, close() { this.fermee = true; }, location: {}};
  const messages = [];
  const voirFiche = new Function("$", "window", "api", "surErreur",
    `${["messager", "zoneVisible", "raisonDe", "seElide", "deNom", "nomAffiche"].map(fonction).join("\n")}\n${fonction("voirFiche")}\nreturn voirFiche;`)(
    z.$, {open: () => onglet}, async () => { throw Object.assign(new Error("Cet élève n’est plus dans tes classes."), {statut: 403}); },
    (e, zone) => messages.push([zone, e.message]));
  return {voirFiche, $: z.$, onglet, messages};
}

test("point 5 — « Voir son parcours » refusé, la fenêtre de l'élève ouverte : le message est DANS la fenêtre", async () => {
  const r = fiche({fenetreOuverte: true});
  await r.voirFiche({id: 4, prenom: "Léa", initiale: ""}, null);
  assert.equal(r.onglet.fermee, true, "l'onglet blanc se referme");
  assert.deepEqual([r.$("fe-message").hidden, r.$("fe-message").textContent],
    [false, "Le parcours de Léa n’a pas pu s’ouvrir. Cet élève n’est plus dans tes classes."]);
  assert.deepEqual(r.messages, [], "rien derrière la fenêtre");
  const fermee = fiche({fenetreOuverte: false});
  await fermee.voirFiche({id: 4, prenom: "Inès", initiale: ""}, null);
  // Lot 5f : fenêtre fermée entre-temps, l'écran de la classe affiché — au-dessus du tableau.
  assert.deepEqual([fermee.$("message-appli").hidden, fermee.$("message-appli").textContent],
    [false, "Le parcours d’Inès n’a pas pu s’ouvrir. Cet élève n’est plus dans tes classes."], "fenêtre fermée entre-temps : au-dessus du tableau");
  assert.deepEqual(fermee.messages, []);
  // Lot 5f : en haut du corps de la fenêtre, au-dessus du cadre du parcours.
  assert.match(page, /<div class="fenetre-corps"(?: id="fe-corps")?>\s*<!--[^>]*-->\s*<p class="message" id="fe-message" hidden><\/p>\s*<div id="fe-contenu"><\/div>/);
  assert.match(constante("ZONES_MESSAGE"), /"fe-message"/, "il part à la déconnexion");
});

// Lot 5f : « Ouvrir dans un onglet », puis la fenêtre fermée avant la réponse
// du serveur. Un refus se lit alors au-dessus du tableau, et la page y remonte
// (la 25e ligne) — la règle du point 5 tient : jamais dans un écran caché.
test("point 5 (lot 5f) — la fenêtre fermée pendant l'attente du billet : le message au-dessus du tableau, la page y remonte", async () => {
  const z = zones();
  z.$("ecran-classe").hidden = false;
  z.$("message-appli").closest = () => z.$("ecran-classe");
  const vus = [];
  z.$("message-appli").scrollIntoView = options => vus.push(options);
  const onglet = {fermee: false, close() { this.fermee = true; }, location: {}};
  const messages = [];
  const bouton = {disabled: false};
  let reponse = Object.assign(new Error("Cet élève n’est plus dans tes classes."), {statut: 403});
  const voirFiche = new Function("$", "window", "api", "surErreur",
    `${["messager", "zoneVisible", "raisonDe", "seElide", "deNom", "nomAffiche"].map(fonction).join("\n")}\n${fonction("voirFiche")}\nreturn voirFiche;`)(
    z.$, {open: () => onglet}, async () => { throw reponse; }, (e, zone) => messages.push([zone, e.message]));
  await voirFiche({id: 4, prenom: "Inès", initiale: ""}, bouton);
  assert.equal(onglet.fermee, true);
  assert.deepEqual([z.$("message-appli").hidden, z.$("message-appli").textContent],
    [false, "Le parcours d’Inès n’a pas pu s’ouvrir. Cet élève n’est plus dans tes classes."]);
  assert.deepEqual(vus, [{block: "nearest"}], "la page remonte jusqu'au message");
  assert.match(page, /#message-appli \{ scroll-margin-top: 84px; \}/, "sous la ligne des onglets collée en haut, pas derrière");
  assert.equal(bouton.disabled, false, "le prénom se rallume");
  assert.deepEqual(messages, []);
  // Session terminée : la reconnexion (surErreur), pas un message.
  reponse = Object.assign(new Error("Session expirée."), {statut: 401});
  z.$("message-appli").textContent = ""; z.$("message-appli").hidden = true;
  await voirFiche({id: 4, prenom: "Léa", initiale: ""}, bouton);
  assert.deepEqual(messages, [["message-appli", "Session expirée."]]);
  assert.equal(z.$("message-appli").textContent, "");
  // L'écran de la classe n'est plus affiché : surErreur choisit l'écran visible.
  reponse = Object.assign(new Error("Le serveur ne répond pas."), {statut: 500});
  z.$("ecran-classe").hidden = true;
  await voirFiche({id: 4, prenom: "Léa", initiale: ""}, null);
  assert.deepEqual(messages.at(-1), ["message-appli", "Le serveur ne répond pas."]);
});

// ------------------------------------------------- point 6 : 390 px

test("point 6 — un menu ouvert recule jusqu'à 16 px du bord droit, sans passer à gauche des 16 px de l'autre bord", () => {
  const garder = new Function("document", `${fonction("garderDansLEcran")}\nreturn garderDansLEcran;`)({documentElement: {clientWidth: 390}});
  const menu = new Noeud("menu-applis");
  menu.rect = {left: 98, right: 398};   // le menu des applis depuis la barre collée (Codex)
  garder(menu);
  assert.equal(menu.style.marginLeft, "-24px", "fin à 374 px : dans l'écran");
  menu.rect = {left: 16, right: 356};
  garder(menu);
  assert.equal(menu.style.marginLeft, "", "déjà dedans : rien");
  menu.rect = {left: 30, right: 420};
  garder(menu);
  assert.equal(menu.style.marginLeft, "-14px", "jamais à gauche de 16 px");
  assert.match(fonction("ouvrirMenuApplis"), /\$\("menu-applis"\)\.hidden = false;\s*garderDansLEcran\(\$\("menu-applis"\)\);/);
  assert.match(fonction("ouvrirMenuClasses"), /garderDansLEcran\(menu\);/);
  assert.match(fonction("fermerMenuApplis"), /menu\.style\.marginLeft = "";/);
  assert.match(fonction("fermerMenuClasses"), /menu\.style\.marginLeft = "";/);
});

test("point 6 — un nom de classe long : il rétrécit dans la barre collée (« … ») et passe à la ligne dans « Ouvrir pour la … »", () => {
  assert.match(style, /\.classe-collee \{ flex: 0 4 auto; min-width: 0; max-width: 45%;/, "il ne pousse plus Élèves et Réglages hors de l'écran");
  assert.match(style, /\.classe-collee span \{ min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; \}/);
  assert.match(style, /\.eval-modeles \.gestes button \{ max-width: 100%; padding: 0 12px; white-space: normal; text-align: center; \}/,
    "« Ouvrir pour la Troisième groupe de remédiation » élargissait la page à 451 px");
});

// ------------------------------------------------- point 10 : le lien et le mot de passe temporaire

test("point 10 — arrivé par « #classe=2 » avec un mot de passe temporaire : la classe du lien est gardée, puis ouverte d'abord, une fois", async () => {
  const journal = [];
  const z = zones();
  const f = new Function("$", "journal",
    `let identifiant = "", estAdmin = false, mdpTemporaire = false, classeApresMotDePasse = 0, generation = 0, venaitDeSeConnecter = false;
     const veille = {reprendre() {}};
     async function api() { return {identifiant: "gwenael", admin: true, mdp_temporaire: true}; }
     function classeDemandee() { journal.push("ancre lue et effacée"); return 2; }
     function lireDerniereClasse() { return 1; }
     function ouvrirCompte() { journal.push("Mon compte"); }
     async function allerSansPerdre(...a) { journal.push("aller " + a.join(",")); return true; }
     function deconnecter() { journal.push("déconnexion"); } function messager() {}
     ${fonction("demarrer")}
     return {demarrer, garde: () => classeApresMotDePasse};`)(z.$, journal);
  await f.demarrer();
  assert.deepEqual(journal, ["ancre lue et effacée", "Mon compte"], "l'ancre est consommée tout de suite, pas rejouée au prochain rechargement");
  assert.equal(f.garde(), 2, "et gardée pour après le changement");
  const mdp = ecouteur("form-motdepasse");
  assert.match(mdp, /const duLien = classeApresMotDePasse;\s*classeApresMotDePasse = 0;/, "elle ne sert qu'une fois");
  assert.match(mdp, /allerSansPerdre\(dit, duLien, classe && classe\.id, lireDerniereClasse\(\)\)/, "d'abord (si elle est dans SA liste)");
  assert.match(fonction("oublierEtat"), /classeApresMotDePasse = 0;/);
});

// ------------------------------------------------- point 11 : le menu à jour

test("point 11 — le menu « 405 ▾ » : la classe ouverte telle qu'elle est maintenant (renommée, des élèves en plus ou en moins)", () => {
  const z = zones();
  z.$("menu-classes-liste");
  const el = (b, c, t) => Object.assign(new Noeud(b), {className: c || "", textContent: t === undefined ? "" : t, setAttribute() {}, addEventListener() {}});
  const doc = {createElement: b => el(b)};
  const texte = n => n.textContent + n.enfants.map(texte).join("");
  const poser = new Function("$", "el", "document", "classes", "classe", "eleves",
    `const LIBELLES_DIRECT = {};\nfunction fermerMenuClasses() {} function ouvrirClasse() {}\n${fonction("poserMenuClasses")}\nreturn poserMenuClasses;`)(
    z.$, el, doc, [{id: 2, libelle: "301", eleves: 3, droit: "proprietaire"}, {id: 1, libelle: "405", eleves: 10, droit: "proprietaire"}],
    {id: 2, libelle: "301 renommée"}, [{id: 7}, {id: 8}]);
  poser();
  assert.deepEqual(z.$("menu-classes-liste").enfants.map(li => texte(li)), ["301 renommée2 élèves", "40510 élèves"]);
  assert.match(fonction("ouvrirClasse"), /connue\.libelle = classe\.libelle;\s*connue\.eleves = \(donnees\.eleves \|\| \[\]\)\.length;/,
    "la ligne de la liste suit aussi, à chaque ouverture");
});

// ------------------------------------------------- point 12 et la déconnexion

test("point 12 — « Se déconnecter » vide aussi le nom de la classe, les records et leur plein écran", () => {
  assert.match(constante("CHAMPS_A_VIDER"), /"nom-classe"/);
  assert.match(constante("ZONES_TEXTE"), /"records-semaine", "records-toujours"/);
  assert.match(fonction("viderZones"), /\["evaluation-plein", "records-plein"\]\.forEach/);
  assert.match(fonction("oublierEtat"), /ligueRecords = null;/);
});

// ------------------------------------------------- et un pirate ?

test("et un pirate ? les mêmes appels au serveur qu'avant le correctif, rien n'est écrit comme du HTML", () => {
  // Lot 5b : « Régler … » passe par appelBorne (le même api(), borné dans le temps).
  const appels = [...new Set([...script.matchAll(/(?:api|appelBorne)\("([a-z_.]+)"/g)].map(m => m[1]))].sort();
  assert.deepEqual(appels, ["classes.creer", "classes.liste", "classes.modifier", "classes.supprimer", "classes.supprimer_echues",
    "eleves.acces", "eleves.ajouter", "eleves.fiche", "eleves.nommer", "eleves.regenerer", "eleves.reglages", "eleves.restaurer", "eleves.supprimer",
    "evaluation.enregistrer_modele", "evaluation.etat", "evaluation.fermer", "evaluation.fichier", "evaluation.modeles", "evaluation.ouvrir",
    "evaluation.repasser", "evaluation.supprimer_modele", "evaluation.terminer", "moi", "partages.ajouter", "partages.liste",
    "partages.supprimer", "profs.ajouter", "profs.annuaire", "profs.desactiver", "profs.liste", "profs.motdepasse", "profs.reactiver",
    "profs.reinitialiser", "profs.supprimer", "records.ligue", "records.retirer", "tableau"], "aucun appel ajouté ni retiré");
  for (const nom of ["allerDansUneClasse", "echecDeLaTransition", "allerSansPerdre", "montrerSansClasse", "viderLaClasse", "quitterLaClasse",
    "garderDansLEcran", "poserMenuClasses", "voirFiche", "chargerProfs"]) {
    assert.doesNotMatch(fonction(nom), /innerHTML|insertAdjacentHTML|outerHTML/, nom);
  }
});
