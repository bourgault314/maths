import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Serveur pro, lot 5d « plus d'écran Mes classes » (25/10/2026).
//
// Choix de Gwenaël (question à choix du 25/10/2026) : l'écran « Mes classes »
// disparaît. À la connexion, une classe s'ouvre toujours ; le menu « 405 ▾ »
// se termine par « + Nouvelle classe » (à la place de « Toutes mes
// classes ») ; Professeurs (administrateur seulement) va dans Mon compte ; un
// collègue sans aucune classe voit « Crée ta première classe ». Ce que
// montraient les tuiles (la classe partagée, la séance restée ouverte) est
// dans la ligne du menu ; les deux bandeaux de l'année sont en haut de la
// classe ouverte. Les gestes sur un professeur passent derrière « ⋯ ».
//
// Ces tests EXÉCUTENT les fonctions de la page, telles qu'elles y sont
// écrites. Le vrai navigateur est joué par le banc du lot (planches 390 et
// 1440, voir la notice).

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const page = readFileSync(join(racine, "_serveur/public/prof/index.php"), "utf8");
const BALISE = '<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">';
const script = page.slice(page.indexOf(BALISE), page.indexOf("</script>", page.indexOf(BALISE)));

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

function section(id) {
  const debut = page.indexOf(`<section id="${id}"`);
  assert.ok(debut > 0, `la page doit avoir la section ${id}`);
  return page.slice(debut, page.indexOf("</section>", debut));
}

// Un nœud de poche : du texte, des enfants, jamais de HTML.
class Noeud {
  constructor(balise) {
    this.balise = balise; this.enfants = []; this.hidden = false; this.textContent = ""; this.className = "";
    const classes = new Set();
    this.classList = {add: c => classes.add(c), contains: c => classes.has(c)};
  }
  append(...noeuds) { noeuds.forEach(n => this.enfants.push(n)); }
  appendChild(n) { this.enfants.push(n); return n; }
  set innerHTML(_) { throw new Error("innerHTML interdit : les noms viennent du serveur"); }
  get texte() { return this.textContent + this.enfants.map(n => n.texte).join(""); }
}

// ------------------------------------------------------------ la classe à ouvrir

const classeAOuvrir = new Function(`${fonction("classeAOuvrir")}\nreturn classeAOuvrir;`)();
// Correctif des lots 5 (point 9) : « de cette année » se lit dans l'année
// de chaque classe et dans « annee_courante », toutes deux de classes.liste.
const LISTE = [
  {id: 2, libelle: "306", droit: "proprietaire", annee: "2026-2027"},
  {id: 1, libelle: "405", droit: "proprietaire", annee: "2026-2027"},
  {id: 3, libelle: "5e B", droit: "ecriture", annee: "2026-2027"},
  {id: 4, libelle: "605", droit: "proprietaire", annee: "2025-2026"}];
const ANNEE = "2026-2027";

test("la classe à ouvrir : la première des demandées encore dans SA liste (l'ancre, puis la dernière ouverte)", () => {
  assert.equal(classeAOuvrir(LISTE, [3, 1]), 3, "l'ancre de la séance en direct passe d'abord");
  assert.equal(classeAOuvrir(LISTE, [0, 1]), 1, "pas d'ancre : la dernière ouverte sur ce poste");
  assert.equal(classeAOuvrir(LISTE, [99, 1]), 1, "une classe qui n'est plus à lui (supprimée, partage retiré) n'ouvre rien");
  assert.equal(classeAOuvrir(LISTE, [4]), 4, "demandée, une classe de l'an dernier s'ouvre quand même");
});

test("la classe à ouvrir : sinon la première des SIENNES de cette année ; une classe partagée seulement après ; aucune : 0", () => {
  assert.equal(classeAOuvrir(LISTE, [], ANNEE), 2, "la première des siennes (306), dans l'ordre de la liste");
  const vieille = {id: 4, droit: "proprietaire", annee: "2025-2026"};
  assert.equal(classeAOuvrir([vieille, {id: 3, droit: "ecriture", annee: ANNEE}], [0, 0], ANNEE), 3,
    "jamais une classe de l'an dernier quand il y en a une de cette année");
  assert.equal(classeAOuvrir([vieille], [], ANNEE), 4, "seulement celle de l'an dernier : elle s'ouvre");
  assert.equal(classeAOuvrir([vieille, {id: 3, droit: "ecriture", annee: "2025-2026"}], [], ANNEE), 4,
    "rien de cette année : la sienne avant la partagée");
  assert.equal(classeAOuvrir([{id: 8, droit: "lecture", annee: ANNEE}, {id: 9, droit: "ecriture", annee: ANNEE}], [12], ANNEE), 8,
    "seulement des classes partagées : la première");
  assert.equal(classeAOuvrir([], [5, 1], ANNEE), 0, "aucune classe : « Crée ta première classe »");
  assert.equal(classeAOuvrir(undefined, undefined, undefined), 0);
  assert.equal(classeAOuvrir(LISTE, [], ""), 2, "l'année pas dite (vieux serveur) : la première des siennes");
});

test("correctif des lots 5, point 9 — une vieille classe encore utilisée (pas « échue ») ne passe pas avant celle de cette année", () => {
  // Le scénario de Codex : une 301 de l'an dernier, utilisée il y a moins de
  // 21 jours (donc absente de « echues »), et la 405 de cette année.
  const liste = [{id: 7, libelle: "301", droit: "proprietaire", annee: "2025-2026"}, {id: 1, libelle: "405", droit: "proprietaire", annee: ANNEE}];
  assert.equal(classeAOuvrir(liste, [0, 0], ANNEE), 1, "la 405");
  assert.doesNotMatch(fonction("classeAOuvrir"), /echues/, "« echues » ne sert plus qu'au bandeau");
  assert.match(fonction("chargerClasses"), /anneeCourante = String\(donnees\.annee_courante \|\| ""\);/);
  assert.match(fonction("allerDansUneClasse"), /classeAOuvrir\(classes, demandees, anneeCourante\)/);
});

// ------------------------------------------------------------ aller dans une classe

function allerRejoue({liste, erreur = null, ouverte = null, ecranClasse = false}) {
  const journal = [];
  const zones = {"ecran-classe": {hidden: !ecranClasse}, "ecran-premiere-classe": {hidden: true}, "ecran-compte": {hidden: true},
    "carte-premiere-classe": {hidden: false}, "carte-reessayer": {hidden: true}};
  const etat = {classe: ouverte};
  const f = new Function("journal", "zones", "etat", "liste", "erreurServeur",
    `let classes = [], classe = etat.classe, eleves = [{id: 1}], tableaux = {x: 1}, vue = "eleves", demandeAppli = 0;
     let generation = 0, anneeCourante = "", droitClasse = "lecture", idsAffiches = [1], evaluation = {}, evalContenu = {}, ligueRecords = {}, voitEleve = {};
     const jeton = "jeton";
     const $ = id => zones[id];
     async function chargerClasses(estAJour) { journal.push("classes.liste"); if (erreurServeur) throw erreurServeur; if (!estAJour()) return null; classes = liste; anneeCourante = "2026-2027"; return classes; }
     function montrer(ecran) { journal.push("montrer " + ecran); zones["ecran-premiere-classe"].hidden = ecran !== "ecran-premiere-classe"; }
     function oublierDerniereClasse() { journal.push("oublier la dernière"); }
     function fermerFenetreEleve() { journal.push("fenêtre fermée"); } function oublierRecherche() {}
     function arreterVeilleEvaluation() {} function viderLaClasse() { journal.push("document vidé"); }
     async function ouvrirClasse(id, options) { journal.push("ouvrir " + id + (options && options.remonter ? " (une panne remonte)" : "")); return true; }
     ${["classeAOuvrir", "zoneClasses", "quitterLaClasse", "montrerSansClasse", "allerDansUneClasse"].map(fonction).join("\n")}
     return {allerDansUneClasse, zoneClasses, etat: () => ({classe, eleves, tableaux, vue})};`)(
    journal, zones, etat, liste, erreur);
  return {f, journal, zones};
}

test("aller dans une classe : la liste relue, puis la classe choisie s'ouvre", async () => {
  const r = allerRejoue({liste: LISTE, echues: [{id: 4}]});
  assert.equal(await r.f.allerDansUneClasse(0, 99), true);
  assert.deepEqual(r.journal, ["classes.liste", "ouvrir 2 (une panne remonte)"]);
  const voulue = allerRejoue({liste: LISTE});
  await voulue.f.allerDansUneClasse(3);
  assert.deepEqual(voulue.journal, ["classes.liste", "ouvrir 3 (une panne remonte)"]);
});

test("aller dans une classe : déjà dedans, à l'écran — rien n'est relu ; cachée (retour de Mon compte) — elle est relue", async () => {
  const dedans = allerRejoue({liste: LISTE, ouverte: {id: 1}, ecranClasse: true});
  await dedans.f.allerDansUneClasse(1);
  assert.deepEqual(dedans.journal, ["classes.liste"], "la 405 reste ouverte (bandeau des classes échues traité, par exemple)");
  const cachee = allerRejoue({liste: LISTE, ouverte: {id: 1}, ecranClasse: false});
  await cachee.f.allerDansUneClasse(1);
  assert.deepEqual(cachee.journal, ["classes.liste", "ouvrir 1 (une panne remonte)"]);
  const partie = allerRejoue({liste: LISTE.filter(c => c.id !== 1), ouverte: {id: 1}, ecranClasse: true});
  await partie.f.allerDansUneClasse(1);
  // Correctif des lots 5 (point 2) : elle est oubliée TOUT DE SUITE — dans la
  // page et dans le document —, avant même d'ouvrir la suivante.
  assert.deepEqual(partie.journal, ["classes.liste", "fenêtre fermée", "document vidé", "ouvrir 2 (une panne remonte)"],
    "la classe ouverte vient d'être supprimée : elle est oubliée, puis une autre s'ouvre");
});

test("aller dans une classe : aucune classe — la page oublie la classe, puis « Crée ta première classe »", async () => {
  const r = allerRejoue({liste: [], ouverte: {id: 1, libelle: "405"}, ecranClasse: true});
  await r.f.allerDansUneClasse(1);
  assert.deepEqual(r.journal, ["classes.liste", "fenêtre fermée", "document vidé", "oublier la dernière", "montrer ecran-premiere-classe"]);
  assert.deepEqual(r.f.etat(), {classe: null, eleves: [], tableaux: {}, vue: "appli"}, "plus rien de la classe supprimée");
  assert.equal(r.f.zoneClasses(), "message-premiere-classe", "le message va sur l'écran à l'écran");
  assert.deepEqual([r.zones["carte-premiere-classe"].hidden, r.zones["carte-reessayer"].hidden], [false, true],
    "« Crée ta première classe », pas « Réessayer »");
});

test("aller dans une classe : la liste refusée — rien ne s'ouvre, et la panne REMONTE à l'appelant (correctif des lots 5)", async () => {
  const r = allerRejoue({liste: LISTE, erreur: new Error("Le serveur ne répond pas.")});
  await assert.rejects(r.f.allerDansUneClasse(1), /Le serveur ne répond pas\./,
    "c'est l'appelant qui la dit, avec ce qui a déjà réussi (« Classe 306 supprimée… »)");
  assert.deepEqual(r.journal, ["classes.liste"]);
});

test("aller dans une classe : c'est le chemin de la connexion, d'une classe supprimée, du retour de Mon compte, du mot de passe changé", () => {
  // Correctif des lots 5 : chacun passe par allerSansPerdre, qui dit une
  // panne avec ce qui a déjà réussi, dans l'écran affiché.
  assert.match(fonction("demarrer"), /return allerSansPerdre\("", duLien, lireDerniereClasse\(\)\);/);
  const supprimer = blocDepuis(script, script.indexOf('$("supprimer-classe").addEventListener'));
  assert.match(supprimer, /const partie = classe\.libelle;\s*try \{ await api\("classes\.supprimer", \{classe_id: classe\.id\}\); \}/,
    "le nom de la classe partie est gardé AVANT : une autre classe s'est ouverte depuis");
  assert.match(supprimer, /quitterLaClasse\(\);[\s\S]*?const dit = `Classe \$\{partie\} supprimée : il n’en reste rien\.`;\s*if \(await allerSansPerdre\(dit\)\) messager\(zoneClasses\(\), dit, "ok"\);/);
  const echues = blocDepuis(script, script.indexOf('$("supprimer-echues").addEventListener'));
  assert.equal((echues.match(/await allerSansPerdre\((?:"", |dit, )ouverte\)/g) || []).length, 2, "après la suppression, et après un refus");
  assert.match(script, /\$\("retour-compte"\)\.addEventListener\("click", \(\) => \{ vue = "appli"; allerSansPerdre\("", classe && classe\.id\); \}\);/);
  const mdp = blocDepuis(script, script.indexOf('$("form-motdepasse").addEventListener'));
  assert.match(mdp, /if \(await allerSansPerdre\(dit, duLien, classe && classe\.id, lireDerniereClasse\(\)\)\) messager\(zoneClasses\(\), dit, "ok"\);/);
  assert.match(fonction("creerClasse"), /messager\(zoneClasses\(\), "Donne un nom à la classe\.", "erreur"\)/);
  assert.match(fonction("ouvrirClasse"), /if \(numero !== demandeAppli \|\| !jeton\) return false;\s*(?:\/\/[^\n]*\n\s*)?if \(erreur && erreur\.name === "AbortError"\) return false;\s*if \(options && options\.remonter\) throw erreur;\s*surErreur\(erreur, zoneClasses\(\)\);/,
    "une lecture arrêtée par sa garde (relireBornee, correctif 5b) ne dit rien ; une panne remonte ou se dit");
  assert.doesNotMatch(script, /rouvrirDerniereClasse|rouvrirClasseDemandee|chargerClasses\(\)\.then/);
});

// ------------------------------------------------------------ les écrans

test("l'écran d'un professeur sans classe : « Crée ta première classe », un bouton, et ce qui arrive avec un partage", () => {
  const ecran = section("ecran-premiere-classe");
  assert.match(ecran, /<h1>Crée ta première classe<\/h1>/);
  assert.match(ecran, /<button type="button" id="premiere-classe"><svg [^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/svg>Nouvelle classe<\/button>/);
  assert.match(ecran, /Si un collègue partage une de ses classes avec toi, elle s’ouvrira ici à ta prochaine connexion\./);
  assert.match(ecran, /<p class="message" id="message-premiere-classe" hidden><\/p>/);
  assert.match(fonction("montrer"), /\["ecran-connexion", "ecran-premiere-classe", "ecran-classe", "ecran-compte"\]/);
  assert.match(script, /const ZONES_MESSAGE = \[[^\]]*"message-premiere-classe"/, "son message part à la déconnexion");
});

test("les bandeaux de l'année et le message des classes : en haut de la classe ouverte, avant les onglets", () => {
  const classe = section("ecran-classe");
  const avantOnglets = classe.slice(0, classe.indexOf('<div id="repere-onglets">'));
  for (const id of ["message-classes", "bandeau-annee", "bandeau-echues", "supprimer-echues", "echues-plus-tard"]) {
    assert.ok(avantOnglets.includes(`id="${id}"`), `${id} en haut de la classe`);
  }
  assert.ok(avantOnglets.indexOf('id="resume-classe"') < avantOnglets.indexOf('id="bandeau-echues"'), "sous le nom et le résumé de la classe");
  assert.match(script, /const BLOCS_A_CACHER = \[[^\]]*"bandeau-echues"/);
});

// ------------------------------------------------------------ Professeurs, dans Mon compte

test("Professeurs : dans Mon compte, caché d'office ; montré à l'administrateur seulement, jamais avec un mot de passe temporaire", () => {
  const compte = section("ecran-compte");
  assert.match(compte, /<div id="bloc-profs" hidden>\s*<h2>Professeurs<\/h2>/);
  assert.match(compte, /<ul class="profs comptes" id="liste-profs"><\/ul>/);
  assert.match(compte, /Pour qu’un collègue voie une de tes classes : ouvre-la, puis Réglages, « Partager cette classe »\./);
  assert.match(compte, /id="retour-compte"><svg[\s\S]*?<\/svg>Ma classe<\/button>/);
  const ouvrir = fonction("ouvrirCompte");
  assert.match(ouvrir, /const avecProfs = estAdmin && !mdpTemporaire;\s*\$\("bloc-profs"\)\.hidden = !avecProfs;/);
  assert.match(ouvrir, /if \(avecProfs\) chargerProfs\(\);/);
  assert.doesNotMatch(script, /crée d’abord un compte depuis « Mes classes »/);
  assert.match(script, /crée d’abord son compte dans « Mon compte », partie Professeurs\./);
});

function profsRejoues(profs) {
  const zones = {"liste-profs": new Noeud("ul")};
  const gestes = [];
  const f = new Function("$", "document", "api", "gestes", "surErreur",
    `const identifiant = "gwenael"; let demandeProfs = 0, generation = 0; const jeton = "jeton";
     function reinitialiserProf() {} function desactiverProf() {} function reactiverProf() {} function supprimerProf() {}
     function boutonGeste(texte, classeCss) { return {texte, classeCss}; }
     function menuGestes(li, boutons) { gestes.push({li, boutons}); li.appendChild(Object.assign(new (li.constructor)("details"), {className: "plus"})); }
     ${fonction("chargerProfs")}\nreturn chargerProfs;`)(
    id => zones[id], {createElement: b => new Noeud(b)}, async () => ({profs}), gestes, e => { throw e; });
  return {f, liste: zones["liste-profs"], gestes};
}

test("Professeurs : une ligne par professeur, soi d'abord ; les gestes derrière « ⋯ », un seul rouge ; tout en texte", async () => {
  const r = profsRejoues([
    {id: 2, identifiant: "<img src=x onerror=alert(1)>", classes: 1, eleves: 4, partagees: 1, actif: true},
    {id: 1, identifiant: "gwenael", admin: true, classes: 3, eleves: 13, partagees: 1, actif: true},
    {id: 3, identifiant: "jacquie", classes: 0, eleves: 0, actif: false}]);
  await r.f();
  const lignes = r.liste.enfants;
  assert.deepEqual(lignes.map(li => li.enfants[0].enfants[0].textContent), ["gwenael", "<img src=x onerror=alert(1)>", "jacquie"],
    "son compte en premier ; un identifiant n'est jamais du HTML");
  assert.equal(lignes[0].enfants[0].enfants[1].textContent, "toi · administrateur · 3 classes créées (13 élèves) · 1 reçue en partage");
  assert.equal(lignes[0].enfants.length, 1, "pas de « ⋯ » sur son propre compte");
  assert.deepEqual(r.gestes.map(g => g.boutons.map(b => `${b.texte}/${b.classeCss}`)), [
    ["Nouveau mot de passe/secondaire", "Désactiver/secondaire", "Supprimer/danger"],
    ["Nouveau mot de passe/secondaire", "Réactiver/secondaire", "Supprimer/danger"]], "un seul bouton rouge par collègue, dans le menu");
  assert.ok(lignes[2].classList.contains("eteint"), "un compte désactivé se lit en gris");
  assert.equal(lignes[2].enfants[0].enfants[1].textContent, "désactivé · 0 classe créée");
  assert.doesNotMatch(fonction("chargerProfs"), /innerHTML|style\.opacity|className = "fin"/);
});

// ------------------------------------------------------------ et un pirate ?

test("et un pirate ? les mêmes appels au serveur qu'avant, rien n'est écrit comme du HTML, Professeurs reste réservé", () => {
  for (const nom of ["poserMenuClasses", "chargerClasses", "allerDansUneClasse", "chargerProfs", "quitterLaClasse"]) {
    assert.doesNotMatch(fonction(nom), /innerHTML|insertAdjacentHTML|outerHTML/, nom);
  }
  const appels = new Set([...script.matchAll(/api\("([a-z_.]+)"/g)].map(m => m[1]));
  for (const action of ["classes.liste", "classes.creer", "classes.supprimer", "classes.supprimer_echues", "profs.liste", "profs.ajouter",
    "profs.reinitialiser", "profs.desactiver", "profs.reactiver", "profs.supprimer"]) {
    assert.ok(appels.has(action), action);
  }
  // Le menu ne montre que les classes que le serveur a rendues : classes.liste, et rien d'autre.
  assert.match(fonction("poserMenuClasses"), /classes\.forEach\(uneClasse => \{/);
  assert.match(script, /let estAdmin = false;/);
  assert.match(fonction("oublierEtat"), /estAdmin = false;/);
});
