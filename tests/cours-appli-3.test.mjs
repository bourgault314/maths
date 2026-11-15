// L'appli Cours, lot « cours-appli-3 » (14/11/2026). Choix de Gwenaël (question à choix du 14/11) :
// « En plus pour quelques élèves », comme SPLAT! et Coffres — dans « Régler les cours », sous ce qui est
// ouvert à toute la classe, une ligne par chapitre fermé à la classe (« Choisir… » déplie les élèves) et un
// raccourci « Tout le niveau 4e » ; on ajoute, on ne retire jamais rien à un élève ; même fenêtre, mêmes mots,
// même règle que les autres applis (« … · en plus pour N élèves ») ; rien ne part avant « Enregistrer » ;
// eleves.acces avec « avant » (409 si un autre onglet a écrit). L'élève range ses chapitres en plus dans
// « Mes cours » comme les autres (le serveur les lui donne avec ceux de sa classe). L'onglet Cours ne change
// pas, sauf qu'un élève « en plus » y est compté sur ses chapitres.
//
// Ces tests EXÉCUTENT les fonctions de la page (banc suivi-regler-banc.mjs, option « cours »).

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";
import {reglerRejoue, caseDe, cocher, lignesPlus, titres, fonction, constante} from "./suivi-regler-banc.mjs";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = chemin => readFileSync(join(racine, chemin), "utf8");
const catalogue = JSON.parse(lire("_serveur/public/lib/cours.json")).chapitres;
const ids = niveau => catalogue.filter(c => c.niveau === niveau).map(c => c.id);
const nom = id => catalogue.find(c => c.id === id).chapitre;

// La 405 : Cours avec quatre chapitres de 4e ; Lucas a « Fractions » (4e) en plus, Rania deux chapitres de 3e.
const classe405 = (o = {}) => Object.assign({id: 7, libelle: "405", applis: ["defi-tables", "cours"],
  reglages: {cours: {chapitres: ["4e-INE", "4e-PCT", "4e-CAL", "4e-REL"]}}}, o);
const ELEVES = () => [
  {id: 1, prenom: "Alice", initiale: "G"},
  {id: 16, prenom: "Lucas", initiale: "D", ajouts: {cours: {chapitres: ["4e-FRA"]}}},
  {id: 22, prenom: "Rania", initiale: "", ajouts: {cours: {chapitres: ["3e-PYT", "3e-THA"]}}},
  {id: 30, prenom: "Yanis", initiale: ""}
];
const banc = (o = {}) => reglerRejoue(Object.assign({classe: classe405(), eleves: ELEVES(), appli: "cours", cours: true}, o));
const quoi = l => l.premier(n => n.className === "quoi").textContent;
const qui = l => l.premier(n => n.classList.contains("qui")).textContent;
const ligne = (r, debut) => lignesPlus(r.corps()).find(l => quoi(l) === debut);
const niveau = (r, n) => r.corps().tous(n2 => n2.tag === "button" && n2.textContent.startsWith(n))[0];
const acces = r => r.serveur.appels.filter(a => a.action === "eleves.acces");

test("la fenêtre, classe ouverte : sous les chapitres de la classe, « En plus pour quelques élèves » — le raccourci du niveau, puis une ligne par chapitre FERMÉ à la classe", () => {
  const r = banc();
  r.f.ouvrirRegler("cours");
  assert.deepEqual(titres(r.corps()), ["Niveau", "Chapitres de 4e", "En plus pour quelques élèves"]);
  assert.equal(r.corps().tous(n => n.className === "aide").at(-1).textContent, "Les chapitres de 4e fermés à la 405. Rien n’est retiré à un élève : on ajoute.");
  const fermes = ids("4e").filter(id => !["4e-INE", "4e-PCT", "4e-CAL", "4e-REL"].includes(id));
  assert.deepEqual(lignesPlus(r.corps()).map(quoi), ["Tout le niveau 4e", ...fermes.map(nom)], "aucune ligne pour un chapitre ouvert à la classe");
  assert.equal(qui(ligne(r, nom("4e-FRA"))), "Lucas D.", "l'ajout rangé de Lucas");
  assert.equal(qui(ligne(r, "Tout le niveau 4e")), "personne", "personne n'a TOUS les chapitres fermés");
  // Le niveau 3e : la classe n'en a aucun, toutes les lignes ; Rania sur ses deux chapitres.
  niveau(r, "3e").declencher("click");
  assert.deepEqual(lignesPlus(r.corps()).map(quoi), ["Tout le niveau 3e", ...ids("3e").map(nom)]);
  assert.equal(qui(ligne(r, nom("3e-PYT"))), "Rania");
  assert.equal(qui(ligne(r, nom("3e-THA"))), "Rania");
  assert.ok(lignesPlus(r.corps()).every(l => l.classList.contains("cours-plus")), "la ligne qui laisse passer à la ligne un nom long");
});

test("« Tout le niveau 3e » : cocher un élève lui donne tous les chapitres du niveau d'un coup ; le décocher les lui retire tous ; rien ne part avant « Enregistrer »", async () => {
  const r = banc();
  r.f.ouvrirRegler("cours");
  niveau(r, "3e").declencher("click");
  cocher(caseDe(ligne(r, "Tout le niveau 3e"), "Yanis"), true);
  assert.ok(ids("3e").every(id => qui(ligne(r, nom(id))).includes("Yanis")), "Yanis sur chaque ligne de 3e");
  assert.equal(qui(ligne(r, "Tout le niveau 3e")), "Yanis");
  assert.deepEqual(r.serveur.appels, [], "rien n'est parti");
  cocher(caseDe(ligne(r, "Tout le niveau 3e"), "Yanis"), false);
  assert.ok(ids("3e").every(id => !qui(ligne(r, nom(id))).includes("Yanis")));
  // Rania a deux chapitres sur seize : le raccourci la complète, puis décoché lui retire TOUT le niveau.
  cocher(caseDe(ligne(r, "Tout le niveau 3e"), "Rania"), true);
  assert.equal(qui(ligne(r, "Tout le niveau 3e")), "Rania");
  cocher(caseDe(ligne(r, "Tout le niveau 3e"), "Rania"), false);
  assert.ok(ids("3e").every(id => qui(ligne(r, nom(id))) === "personne"));
  // Yanis encore, puis Enregistrer : un seul appel pour lui, ses chapitres dans l'ordre du livret, avec « avant ».
  cocher(caseDe(ligne(r, "Tout le niveau 3e"), "Yanis"), true);
  cocher(caseDe(ligne(r, "Tout le niveau 3e"), "Rania"), true);
  cocher(caseDe(ligne(r, nom("3e-THA")), "Rania"), false);
  await r.f.enregistrerRegler();
  assert.deepEqual(r.serveur.appels.map(a => [a.action, a.corps]), [
    ["eleves.acces", {eleve_id: 22, avant: {cours: {chapitres: ["3e-PYT", "3e-THA"]}}, ajouts: {cours: {chapitres: ids("3e").filter(id => id !== "3e-THA")}}}],
    ["eleves.acces", {eleve_id: 30, avant: {}, ajouts: {cours: {chapitres: ids("3e")}}}]
  ], "la classe ne change pas : pas de classes.modifier");
  assert.equal(r.$("message-appli").textContent, "Cours : réglages enregistrés (2 élèves).");
});

test("on ne retire jamais rien : un chapitre ouvert à la classe n'a pas de ligne, et l'ajout qu'il recouvre est GARDÉ (D4)", async () => {
  const r = banc();
  r.f.ouvrirRegler("cours");
  cocher(caseDe(r.corps(), nom("4e-FRA")), true);
  assert.equal(ligne(r, nom("4e-FRA")), undefined, "Fractions ouvert à la classe : sa ligne part");
  await r.f.enregistrerRegler();
  assert.deepEqual(r.serveur.appels.map(a => a.action), ["classes.modifier"], "aucun eleves.acces");
  assert.deepEqual(r.serveur.etat.eleves.find(e => e.id === 16).ajouts, {cours: {chapitres: ["4e-FRA"]}}, "si la classe referme Fractions, Lucas le garde");
  // Décocher Lucas de Fractions (fermé à la classe) : sa clé « cours » PART — jamais « cours: {} » ni une liste vide.
  const l = banc();
  l.f.ouvrirRegler("cours");
  cocher(caseDe(ligne(l, nom("4e-FRA")), "Lucas"), false);
  await l.f.enregistrerRegler();
  assert.deepEqual(acces(l).map(a => a.corps), [{eleve_id: 16, avant: {cours: {chapitres: ["4e-FRA"]}}, ajouts: {}}]);
});

test("ajoutsApres, chapitres : l'ordre du livret, jamais « cours: {} », jamais une liste vide ; les autres applis de l'élève ne bougent pas", () => {
  const r = banc();
  const apres = r.f.ajoutsApres;
  const ordre = r.f.COURS.map(c => c.id);
  assert.deepEqual(apres({}, {cle: "cours", chapitre: "3e-THA", ouvre: true}), {cours: {chapitres: ["3e-THA"]}});
  assert.deepEqual(apres({cours: {chapitres: ["3e-THA"]}, splat: {mondes: [3]}}, {cle: "cours", chapitre: "4e-FRA", ouvre: true}),
    {cours: {chapitres: ["4e-FRA", "3e-THA"]}, splat: {mondes: [3]}}, "la 4e d'abord : l'ordre du livret");
  assert.deepEqual(apres({cours: {chapitres: ["3e-THA"]}, "flash-anzan": {}}, {cle: "cours", chapitre: "3e-THA", ouvre: false}), {"flash-anzan": {}});
  // 2 000 suites de gestes au hasard.
  let graine = 7;
  const hasard = n => { graine = (graine * 1103515245 + 12345) % 2147483648; return graine % n; };
  for (let essai = 0; essai < 2000; essai += 1) {
    let ajouts = hasard(2) ? {} : {splat: {mondes: [3]}};
    for (let g = 0; g < 8; g += 1) ajouts = apres(ajouts, {cle: "cours", chapitre: ordre[hasard(ordre.length)], ouvre: hasard(3) > 0});
    if (ajouts.cours) {
      assert.deepEqual(Object.keys(ajouts.cours), ["chapitres"]);
      assert.ok(ajouts.cours.chapitres.length > 0, "jamais une liste vide");
      assert.deepEqual(ajouts.cours.chapitres, ordre.filter(id => ajouts.cours.chapitres.includes(id)), "rangés comme le livret, sans doublon");
    }
  }
  // ajoutsCanoniques range des textes (avant : « a - b », NaN, un ordre au hasard).
  assert.equal(r.f.memesAjouts({cours: {chapitres: ["4e-FRA", "3e-THA"]}}, {cours: {chapitres: ["3e-THA", "4e-FRA"]}}), true);
  assert.equal(r.f.memesAjouts({cours: {chapitres: ["4e-FRA"]}}, {cours: {chapitres: ["3e-THA"]}}), false);
});

test("la ligne du haut : « · en plus pour N élèves » ; rien pour la classe : « aucun chapitre pour toute la classe » ; la carte d'un onglet fermé propose « Choisir quelques élèves »", () => {
  const r = banc();
  r.f.poserQuiVoit();
  assert.equal(r.$("qui-voit-etat").textContent, "Ouvert à toute la 405 · 4 chapitres ouverts · en plus pour 2 élèves");
  const rien = banc({classe: classe405({reglages: {}})});
  rien.f.poserQuiVoit();
  assert.equal(rien.$("qui-voit-etat").textContent, "Ouvert à toute la 405 · aucun chapitre pour toute la classe · en plus pour 2 élèves");
  const personne = banc({classe: classe405({reglages: {}}), eleves: [{id: 1, prenom: "Alice"}]});
  personne.f.poserQuiVoit();
  assert.equal(personne.$("qui-voit-etat").textContent, "Ouvert à toute la 405 · aucun chapitre ouvert : la tuile « Mes cours » n’apparaît pas encore");
  // Fractions ouvert à la classe : l'ajout de Lucas, rattrapé, n'est plus « en plus » (D4).
  const rattrape = banc({classe: classe405({reglages: {cours: {chapitres: ["4e-FRA"]}}})});
  rattrape.f.poserQuiVoit();
  assert.equal(rattrape.$("qui-voit-etat").textContent, "Ouvert à toute la 405 · 1 chapitre ouvert · en plus pour 1 élève");
  // La classe sans Cours, personne en plus : la carte, avec « Choisir quelques élèves ».
  const ferme = banc({classe: classe405({applis: ["defi-tables"]}), eleves: [{id: 1, prenom: "Alice"}]});
  ferme.f.poserQuiVoit();
  assert.equal(ferme.$("appli-fermee").hidden, false);
  assert.equal(ferme.$("af-quelques").hidden, false);
  // Quelques élèves seulement.
  const quelques = banc({classe: classe405({applis: ["defi-tables"]})});
  quelques.f.poserQuiVoit();
  assert.equal(quelques.$("qui-voit-etat").textContent, "Ouvert à quelques élèves · Lucas D., Rania");
});

test("la classe sans Cours : « Ou seulement pour quelques élèves », les mêmes lignes ; le pied dit qui le verra ; décocher la classe garde les élèves cochés", async () => {
  const r = banc({classe: classe405({applis: ["defi-tables"]})});
  r.f.ouvrirRegler("cours");
  assert.deepEqual(titres(r.corps()), ["Niveau", "Ou seulement pour quelques élèves", "Leurs fiches"]);
  assert.equal(r.corps().tous(n => n.className === "aide")[0].textContent, "« Mes cours » n’est pas ouvert à toute la 405.",
    "correctif Codex 3 : la phrase ne dit plus que personne ne l'a");
  assert.equal(r.$("regler-message").textContent, "Lucas D. et Rania le voient dans leur espace.");
  assert.equal(niveau(r, "4e").textContent, "4e", "pas de nombre : la classe n'a pas l'appli");
  assert.deepEqual(lignesPlus(r.corps()).map(quoi), ["Tout le niveau 4e", ...ids("4e").map(nom)], "tous les chapitres, la classe n'en a aucun");
  cocher(caseDe(ligne(r, nom("4e-PUI")), "Yanis"), true);
  assert.equal(r.$("regler-message").textContent, "Lucas D., Rania et Yanis le voient dans leur espace.");
  await r.f.enregistrerRegler();
  assert.deepEqual(r.serveur.appels.map(a => [a.action, a.corps]), [["eleves.acces", {eleve_id: 30, avant: {}, ajouts: {cours: {chapitres: ["4e-PUI"]}}}]]);
  // Décocher la classe : la question, puis la liste des applis ; les ajouts restent.
  const d = banc();
  d.f.ouvrirRegler("cours");
  cocher(caseDe(d.corps(), "Ouvert à toute la 405"), false);
  await d.f.enregistrerRegler();
  assert.deepEqual(d.questions.map(q => q.texte), ["Retirer Cours de la classe 405 ? La tuile disparaît de l’espace des élèves (sauf ceux qui l’ont en plus). "]);
  assert.deepEqual(d.serveur.appels.map(a => a.action), ["classes.modifier"]);
  assert.deepEqual(d.serveur.etat.eleves.find(e => e.id === 22).ajouts, {cours: {chapitres: ["3e-PYT", "3e-THA"]}});
});

test("correctif Codex 2 — la classe sans Cours : « Leurs fiches » règle les fiches des chapitres en plus ; « sans » et « avec » partent SEULS, sans rouvrir l'appli à la classe", async () => {
  const boite = (r, id) => r.corps().tous(n => n.className === "cours-boite").find(b => b.textContent.startsWith(nom(id)));
  const r = banc({classe: classe405({applis: ["defi-tables"], reglages: {cours: {chapitres: ["4e-INE"]}}})});
  r.f.ouvrirRegler("cours");
  assert.deepEqual(r.corps().tous(n => n.className === "cours-boite").map(b => b.premier(n => n.className === "cours-boite-nom").textContent.startsWith(nom("4e-FRA"))), [true],
    "en 4e : Fractions, le seul chapitre qu'un élève a en plus — sans case de classe");
  assert.equal(r.corps().tous(n => n.className === "cours-boite").every(b => !b.premier(n => n.tag === "input" && n.parent && n.parent.classList && n.parent.classList.contains("case-a-cocher") && n.parent.parent && n.parent.parent.className === "cours-boite-tete")), true);
  // « Les fiches ▾ », puis fermer la fiche 2 de Fractions et ouvrir une fiche du nouveau programme de Puissances (Yanis l'a en plus).
  boite(r, "4e-FRA").premier(n => n.tag === "button").declencher("click");
  const deuxieme = catalogue.find(c => c.id === "4e-FRA").fiches[1];
  const caseFiche = boite(r, "4e-FRA").tous(n => n.tag === "label").find(l => l.textContent.startsWith(`${deuxieme.n}. `)).premier(n => n.tag === "input");
  assert.equal(caseFiche.checked, true);
  assert.ok(!boite(r, "4e-FRA").premier(n => n.classList.contains("cours-fiches")).classList.contains("eteintes"), "pas grisées : elles valent pour Lucas");
  cocher(caseFiche, false);
  cocher(caseDe(ligne(r, nom("4e-PUI")), "Yanis"), true);
  const pui = catalogue.find(c => c.id === "4e-PUI");
  const nouvelle = pui.fiches.find(f => f.nouveau);
  assert.ok(nouvelle, "4e-PUI a une fiche du nouveau programme");
  boite(r, "4e-PUI").premier(n => n.tag === "button").declencher("click");
  cocher(boite(r, "4e-PUI").tous(n => n.tag === "label").find(l => l.textContent.startsWith(`${nouvelle.n}. `)).premier(n => n.tag === "input"), true);
  await r.f.enregistrerRegler();
  assert.deepEqual(r.serveur.appels.map(a => [a.action, a.corps]), [
    ["classes.modifier", {classe_id: 7, reglages: {cours: {sans: [deuxieme.id], avec: [nouvelle.id]}}, avant: {applis: ["defi-tables"], reglages: {cours: {chapitres: ["4e-INE"]}}}}],
    ["eleves.acces", {eleve_id: 30, avant: {}, ajouts: {cours: {chapitres: ["4e-PUI"]}}}]
  ], "ni « applis », ni « chapitres » : la classe reste sans Cours, ses chapitres ne bougent pas");
  assert.deepEqual(r.questions, [], "pas de question : rien n'est retiré à la classe");
  assert.deepEqual(r.serveur.etat.classe.applis, ["defi-tables"]);
  assert.deepEqual(r.serveur.etat.classe.reglages.cours, {chapitres: ["4e-INE"], sans: [deuxieme.id], avec: [nouvelle.id]});
  assert.equal(r.boite().open, false, "enregistré, relu, fermé");
  // Classe ouverte : les fiches d'un chapitre fermé à la classe mais donné en plus ne sont plus grisées.
  const o = banc();
  o.f.ouvrirRegler("cours");
  const fra = o.corps().tous(n => n.className === "cours-boite").find(b => b.textContent.startsWith(nom("4e-FRA")));
  fra.premier(n => n.tag === "button").declencher("click");
  const fra2 = o.corps().tous(n => n.className === "cours-boite").find(b => b.textContent.startsWith(nom("4e-FRA")));
  assert.ok(!fra2.premier(n => n.classList.contains("cours-fiches")).classList.contains("eteintes"));
  const rac = o.corps().tous(n => n.className === "cours-boite").find(b => b.textContent.startsWith(nom("4e-RAC")));
  rac.premier(n => n.tag === "button").declencher("click");
  const rac2 = o.corps().tous(n => n.className === "cours-boite").find(b => b.textContent.startsWith(nom("4e-RAC")));
  assert.ok(rac2.premier(n => n.classList.contains("cours-fiches")).classList.contains("eteintes"), "personne ne l'a : grisées");
});

test("un autre onglet a écrit entre-temps : 409, rien n'est écrasé, la fenêtre se remet sur l'état vrai et le dit", async () => {
  const r = banc();
  r.f.ouvrirRegler("cours");
  cocher(caseDe(ligne(r, nom("4e-PUI")), "Lucas"), true);
  r.serveur.ecrireAilleurs(16, {cours: {chapitres: ["4e-FRA", "4e-ARI"]}});
  await r.f.enregistrerRegler();
  assert.deepEqual(acces(r).map(a => a.corps), [{eleve_id: 16, avant: {cours: {chapitres: ["4e-FRA"]}}, ajouts: {cours: {chapitres: ["4e-FRA", "4e-PUI"]}}}]);
  assert.deepEqual(r.serveur.etat.eleves.find(e => e.id === 16).ajouts, {cours: {chapitres: ["4e-FRA", "4e-ARI"]}}, "l'écriture d'ailleurs est gardée");
  assert.equal(r.boite().open, true, "la fenêtre reste");
  assert.match(r.$("regler-message").textContent, /Pas enregistré pour Lucas D\. : un autre onglet l’a changé entre-temps\./);
  assert.equal(qui(ligne(r, nom("4e-ARI"))), "Lucas D.", "la fenêtre montre l'état relu");
  assert.equal(qui(ligne(r, nom("4e-PUI"))), "personne");
});

test("l'onglet Cours : un élève en plus est compté sur SES chapitres ; « ouvert par N élèves sur M », M = ceux qui voient le chapitre", () => {
  const avecOuvertures = ELEVES().map(e => Object.assign(e, {ouvertes: {
    1: {"4e-PCT-01": "2026-11-12"}, 16: {"4e-FRA-01": "2026-11-13"}, 22: {"3e-PYT-02": "2026-11-14", "4e-PCT-01": "2026-11-02"}, 30: {}
  }[e.id]}));
  const r = banc({eleves: avecOuvertures});
  r.f.dessinerCoursProf();
  const panneau = r.$("cours-prof");
  assert.equal(panneau.hidden, false);
  const tetes = panneau.tous(n => n.tag === "button" && n.classList.contains("cours-chap-tete")).map(t => t.textContent);
  // Lot « cours-pct-calculatrice » (15/11/2026) : 4e-PCT-09 rejoint le chapitre (avant : 5 fiches sur 7).
  assert.deepEqual(tetes, [
    "4eInégalité triangulaire · 3 fiches sur 3pas encore ouvert",
    "4ePourcentages · 6 fiches sur 8ouvert par 2 élèves sur 4",
    "4eCalcul · 6 fiches sur 6pas encore ouvert",
    "4eNombres relatifs · 10 fiches sur 10pas encore ouvert",
    "4eFractions · 13 fiches sur 13 · en plus pour 1 élèveouvert par 1 élève sur 1",
    "3eLe triangle rectangle · 8 fiches sur 8 · en plus pour 1 élèveouvert par 1 élève sur 1",
    "3eThéorème de Thalès · 5 fiches sur 5 · en plus pour 1 élèvepas encore ouvert"
  ].map(t => t.replace("Inégalité triangulaire", nom("4e-INE")).replace("Pourcentages", nom("4e-PCT")).replace("Calcul ·", `${nom("4e-CAL")} ·`)
    .replace("Nombres relatifs", nom("4e-REL")).replace("Fractions", nom("4e-FRA")).replace("Le triangle rectangle", nom("3e-PYT")).replace("Théorème de Thalès", nom("3e-THA"))));
  assert.equal(panneau.premier(n => n.className === "cours-semaine").textContent, "Cette semaine, 3 élèves sur 4 ont ouvert au moins une fiche.");
  // La classe sans Cours : le panneau reste pour ceux qui l'ont en plus ; personne : il part.
  const ferme = banc({classe: classe405({applis: ["defi-tables"]}), eleves: avecOuvertures});
  ferme.f.dessinerCoursProf();
  assert.equal(ferme.$("cours-prof").hidden, false);
  assert.equal(ferme.$("cours-prof").premier(n => n.className === "cours-semaine").textContent, "Cette semaine, 2 élèves sur 2 ont ouvert au moins une fiche.");
  const vide = banc({classe: classe405({applis: ["defi-tables"]}), eleves: [{id: 1, prenom: "Alice"}]});
  vide.f.dessinerCoursProf();
  assert.equal(vide.$("cours-prof").hidden, true);
  // La fiche d'un élève : la liste de Cours se lit aussi quand seuls quelques élèves l'ont.
  assert.equal(ferme.f.coursALire(), true);
  assert.equal(vide.f.coursALire(), false);
});

test("le serveur : un ajout « cours » = des chapitres, lus strictement ; acces_de_l_eleve fait l'union, les fiches suivent la classe ; AGENTS.md à jour", () => {
  const applis = lire("_serveur/public/lib/applis.php");
  assert.doesNotMatch(applis, /'par_eleve'/, "plus de « par_eleve » : Cours se donne par élève");
  assert.match(applis, /function cours_de_classe_et_ajout\(array \$classe, bool \$parClasse, \?array \$ajout\): array/);
  assert.match(applis, /if \(\$cle === 'cours'\) \$reglage \+= cours_de_classe_et_ajout\(\$classe, \$parClasse, \$ajouts\['cours'\] \?\? null\);/);
  assert.match(applis, /if \(array_keys\(\$ajout\) !== \['chapitres'\]\) \{/, "rien d'autre que « chapitres » (ni {}, ni « sans », ni « avec »)");
  const agents = lire("AGENTS.md");
  assert.doesNotMatch(agents, /Pas d'ajout par élève/);
  assert.match(agents, /« En plus pour quelques élèves »/);
  // La page n'écrit toujours aucun code d'élève ni HTML dans la partie du lot.
  const section = fonction("dessinerCoursEnPlus") + fonction("ligneCoursPlus") + fonction("ligneNiveauCours") + fonction("elevesCoursEnPlus");
  assert.doesNotMatch(section, /\.code\b|innerHTML|insertAdjacentHTML/);
  assert.ok(constante("LISTES_PAR_ELEVE").length > 0);
});
