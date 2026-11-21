import test from "node:test";
import assert from "node:assert/strict";
import { page, script, fonction, constante, reglerRejoue, Noeud, caseDe, cocher, caseNumero, lignesPlus, titres, laisser, tic } from "./suivi-regler-banc.mjs";

// Serveur pro, lot 5b « qui voit quoi » (30/10/2026).
//
// Choix de Gwenaël (étape 4, planches 2, 3 et 7 du 25/10/2026 ; maquettes
// « Régler SPLAT! » et « Régler Coffres » du 30/10) : chaque appli a TOUJOURS
// son onglet — en clair quand la classe l'a, avec le nombre d'élèves quand
// quelques élèves seulement l'ont, grisé quand personne ne l'a. En haut de
// l'onglet, une ligne dit qui la voit, et « Régler … » (propriétaire) ouvre
// une fenêtre : la case de la classe, ses réglages pour la classe, et ce qui
// est fermé à la classe, à ouvrir EN PLUS à quelques élèves. Rien ne part
// avant « Enregistrer ». C'est la seule porte : la carte « Activités » de
// Réglages, la fenêtre « Ce que voit Léa » et la colonne « En plus »
// d'Élèves sont parties.
//
// Ces tests ré-épinglent pour la nouvelle fenêtre ce que garantissaient ceux
// des lots 3b, 3c et 3d de « Qui voit quoi » (l'état complet jamais « [] »,
// « avant » toujours envoyé, un 409 qui n'écrase rien, un délai borné, une
// réponse d'après la déconnexion ignorée, le propriétaire seul), et ce qui
// est nouveau (le brouillon, l'onglet grisé, la règle D4). Ils EXÉCUTENT les
// fonctions de la page telles qu'elles y sont écrites (banc
// suivi-regler-banc.mjs : un document de poche, un faux serveur qui range et
// refuse comme le vrai). Sabotages : sabotages5b.py dans le dossier du lot.

// La 405 du banc : Défi tables et SPLAT! (mondes 1, 2 et 5), Anzan pour Rania seule.
const classe405 = (o = {}) => Object.assign({id: 7, libelle: "405", applis: ["defi-tables", "splat"], reglages: {splat: {mondes: [1, 2, 5]}}}, o);
const ELEVES = () => [
  {id: 1, prenom: "Alice", initiale: "G", code: "UCF6AR"},
  {id: 16, prenom: "Lucas", initiale: "D", code: "VRASCL", ajouts: {splat: {mondes: [3]}}},
  {id: 22, prenom: "Rania", initiale: "", code: "DT2XEA", ajouts: {"flash-anzan": {}}},
  {id: 30, prenom: "Inès", initiale: "", code: "INES30"},
  {id: 31, prenom: "", initiale: "", code: "ZZZZ99"}
];
const banc = (o = {}) => reglerRejoue(Object.assign({classe: classe405(), eleves: ELEVES(), appli: "splat"}, o));
// Les tests qui tiennent le faux serveur et le relâchent eux-mêmes : le délai
// de garde de la page (40 ms réelles par défaut au banc) ne doit pas trancher
// avant eux. Sur une machine chargée (la CI), plus de 40 ms passent parfois
// avant le tour suivant : l'envoi était coupé et le test voyait « fini ».
const SANS_COUPURE = 60000;
const message = (r, id = "regler-message") => [r.$(id).textContent, r.$(id).className, r.$(id).hidden];
const ligneDe = (r, numero) => lignesPlus(r.corps()).find(l => l.premier(n => n.className === "quoi").textContent.startsWith(String(numero)));
const acces = r => r.serveur.appels.filter(a => a.action === "eleves.acces");

// ------------------------------------------------------------ la page : le HTML, les écouteurs, la déconnexion

test("le HTML : la ligne « qui voit », la carte d'un onglet fermé, la fenêtre « Régler … » ; l'ancien a disparu", () => {
  assert.match(page, /<div class="qui-voit" id="qui-voit" hidden>\s*<p class="etat" id="qui-voit-etat"><\/p>\s*(?:<!--[\s\S]*?-->\s*<a class="bouton secondaire" id="dc-mode-prof" href="https:\/\/mathsgo\.re\/outils\/calcul_mental\/defi_calcul_modules\.html\?prof=1" target="_blank" rel="noopener"[^>]*hidden>[\s\S]*?<\/a>\s*)?<button type="button" class="secondaire" id="regler-appli" hidden><svg [^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/svg><span class="mot" id="regler-appli-mot"><\/span><\/button>\s*<\/div>/);
  assert.match(page, /<div class="carte appli-fermee" id="appli-fermee" hidden>\s*<h2 id="af-titre"><\/h2>\s*<p id="af-texte"><\/p>\s*<div class="actions" id="af-actions">\s*<button type="button" class="secondaire" id="af-quelques">Choisir quelques élèves<\/button>\s*<button type="button" id="af-toute"><\/button>/);
  assert.match(page, /<dialog id="regler" class="fenetre regler" aria-labelledby="regler-titre">[\s\S]*?id="regler-croix" aria-label="Fermer sans enregistrer"[\s\S]*?<div class="fenetre-corps" id="regler-corps"><\/div>[\s\S]*?<p class="message" id="regler-message" role="status" hidden><\/p>\s*<button type="button" class="secondaire" id="regler-annuler">Annuler<\/button>\s*<button type="button" id="regler-enregistrer">Enregistrer<\/button>/);
  const debutAppli = page.indexOf('<div id="vue-appli">');
  assert.ok(page.indexOf('id="qui-voit"') > debutAppli && page.indexOf('id="appli-fermee"') > debutAppli, "en haut de la vue de l'activité");
  assert.ok(page.indexOf('id="qui-voit"') < page.indexOf('id="message-appli"'));
  for (const parti of ['id="voit"', 'id="voit-liste"', 'id="bloc-activites"', 'id="liste-activites"', 'id="message-activites"', 'class="th-plus"', 'class="en-plus-pour"', 'id="case-records"', 'id="mondes-ouverts"', 'id="coffres-reglages"']) {
    assert.ok(!page.includes(parti), `parti : ${parti}`);
  }
  for (const partie of ["ouvrirCeQueVoit", "changerCeQueVoit", "envoyerCeQueVoit", "voitFiles", "voitAttentes", "poserActivites", "changerActivite", "changerMonde",
    "changerReglageCoffres", "changerRecords", "celluleEnPlus", "pastillesEnPlus", "poserEnPlusPour", "enPlusDe", "reporterAcces(", "texteEnregistre"]) {
    assert.ok(!script.includes(partie), `parti : ${partie}`);
  }
  assert.match(page, /<p class="sous note-regler">Les applis de la classe se règlent dans leur onglet : « Régler Défi tables », « Régler SPLAT! »…<\/p>/, "une note dans Réglages, à la place des cases");
});

test("les écouteurs : « Régler … » et « Choisir quelques élèves » ouvrent la fenêtre de l'onglet regardé ; Annuler, ✕ et Échap ne ferment pas pendant un enregistrement", () => {
  assert.match(script, /\$\("regler-appli"\)\.addEventListener\("click", \(\) => ouvrirRegler\(appliAffichee\)\);/);
  assert.match(script, /\$\("af-quelques"\)\.addEventListener\("click", \(\) => ouvrirRegler\(appliAffichee\)\);/);
  assert.match(script, /\$\("af-toute"\)\.addEventListener\("click", ouvrirATouteLaClasse\);/);
  assert.match(script, /\$\("regler-annuler"\)\.addEventListener\("click", \(\) => \{ if \(!reglageEnCours\) \$\("regler"\)\.close\(\); \}\);/);
  assert.match(script, /\$\("regler-croix"\)\.addEventListener\("click", \(\) => \{ if \(!reglageEnCours\) \$\("regler"\)\.close\(\); \}\);/);
  assert.match(script, /\$\("regler-enregistrer"\)\.addEventListener\("click", enregistrerRegler\);/);
  assert.match(script, /\$\("regler"\)\.addEventListener\("cancel", evenement => \{ if \(reglageEnCours\) evenement\.preventDefault\(\); \}\);/);
  assert.match(script, /\$\("regler"\)\.addEventListener\("close", fermerRegler\);/);
  assert.match(fonction("poserAppli"), /poserQuiVoit\(\);/, "la ligne suit chaque dessin de l'onglet");
});

test("« Se déconnecter » et une classe partie : la fenêtre se ferme, ses prénoms, la ligne et la carte partent, le brouillon est oublié", () => {
  const ZONES_TEXTE = new Function(`${constante("ZONES_TEXTE")}\nreturn ZONES_TEXTE;`)();
  for (const id of ["regler-titre", "regler-sous", "regler-corps", "qui-voit-etat", "af-titre", "af-texte"]) assert.ok(ZONES_TEXTE.includes(id), id);
  assert.match(constante("ZONES_MESSAGE"), /"regler-message"/);
  assert.match(constante("MESSAGES_DE_LA_CLASSE"), /"regler-message"/);
  assert.match(constante("BLOCS_A_CACHER"), /"qui-voit", "appli-fermee"\]/);
  assert.match(fonction("viderZones"), /\["boite", "secret", "eval-modele", "eval-ouvrir", "regler", "fenetre-eleve"\]\.forEach/);
  assert.match(fonction("viderLaClasse"), /\["eval-modele", "eval-ouvrir", "regler", "fenetre-eleve"\]\.forEach/);
  assert.match(fonction("oublierEtat"), /reglage = null;\s*reglageEnCours = false;/, "une reconnexion peut rouvrir « Régler … » tout de suite");
  assert.match(fonction("oublierEtat"), /generation \+= 1;/, "un envoi encore en route est périmé");
  assert.match(fonction("quitterLaClasse"), /reglage = null;/);
});

test("aucun code d'élève, aucun HTML : la section « Régler … » écrit tout par createElement et textContent", () => {
  const section = script.slice(script.indexOf("// ------------------------------------------- « Régler … » (serveur pro, lot 5b)"), script.indexOf("  function dessinerTableau() {"));
  assert.ok(section.length > 8000, "la section du lot");
  assert.doesNotMatch(section, /\.code\b|celluleCode|innerHTML|insertAdjacentHTML|outerHTML/);
  assert.equal([...script.matchAll(/celluleCode\(/g)].length, 2, "celluleCode : sa définition et UN appel (l'onglet Élèves)");
  for (const nom of ["poserOnglets", "ouvrirMenuApplis", "poserQuiVoit"]) assert.doesNotMatch(fonction(nom), /innerHTML|insertAdjacentHTML/, nom);
});

test("un prénom piégé reste du texte : dans la ligne du haut, les cases et le message", async () => {
  const piege = "<img src=x onerror=alert(1)>";
  const r = banc({eleves: [{id: 5, prenom: piege, ajouts: {coffres: {}}}], appli: "coffres"});
  r.f.poserQuiVoit();
  assert.equal(r.$("qui-voit-etat").textContent, `Ouvert à quelques élèves · ${piege}`);
  r.f.ouvrirRegler("coffres");
  assert.equal(caseDe(r.corps(), piege).checked, true);
  assert.equal(r.$("regler-message").textContent, `${piege} le voit dans son espace.`);
  // Le document de poche refuse innerHTML : un seul usage aurait fait échouer le test.
  assert.throws(() => { new Noeud("p").innerHTML = "x"; });
});

// ------------------------------------------------------------ la ligne du haut et la carte d'un onglet fermé

test("la ligne « qui voit » : ouvert à toute la classe, avec ses réglages et ceux qui ont un monde en plus", () => {
  const r = banc();
  r.f.poserQuiVoit();
  assert.equal(r.$("qui-voit").hidden, false);
  assert.equal(r.$("appli-fermee").hidden, true);
  assert.equal(r.$("qui-voit-etat").textContent, "Ouvert à toute la 405 · mondes 1, 2, 5 · en plus pour 1 élève", "Lucas a le monde 3 en plus");
  assert.equal(r.$("qui-voit-etat").premier(n => n.tag === "strong").textContent, "Ouvert à toute la 405");
  assert.deepEqual([r.$("regler-appli").hidden, r.$("regler-appli-mot").textContent, r.$("regler-appli").attributs["aria-label"]], [false, "Régler SPLAT!", "Régler SPLAT!"]);
  r.f.poser({appli: "defi-tables"});
  r.f.poserQuiVoit();
  assert.equal(r.$("qui-voit-etat").textContent, "Ouvert à toute la 405 · les records sont ouverts");
  const sansRecords = banc({classe: classe405({reglages: {"defi-tables": {records: false}}}), appli: "defi-tables"});
  sansRecords.f.poserQuiVoit();
  assert.equal(sansRecords.$("qui-voit-etat").textContent, "Ouvert à toute la 405 · sans les records");
  const tout = banc({classe: classe405({reglages: {}}), eleves: [{id: 1, prenom: "Alice", ajouts: {splat: {mondes: [3]}}}]});
  tout.f.poserQuiVoit();
  assert.equal(tout.$("qui-voit-etat").textContent, "Ouvert à toute la 405", "tous les mondes à la classe : l'ajout de Lucas, rattrapé, n'est plus « en plus » (D4)");
});

test("la ligne « qui voit » : ouvert à quelques élèves seulement — trois prénoms au plus, dans l'ordre de la feuille", () => {
  const r = banc({appli: "flash-anzan"});
  r.f.poserQuiVoit();
  assert.equal(r.$("qui-voit-etat").textContent, "Ouvert à quelques élèves · Rania");
  assert.ok(r.$("qui-voit-etat").premier(n => n.tag === "i").classList.contains("quelques"), "le point dans la couleur « quelques »");
  const cinq = banc({appli: "coffres", eleves: ["Zoé", "Anaïs", "Lucas", "Léa", ""].map((prenom, i) => ({id: i + 1, prenom, code: `C${i}`, ajouts: {coffres: {}}}))});
  cinq.f.poserQuiVoit();
  assert.equal(cinq.$("qui-voit-etat").textContent, "Ouvert à quelques élèves · Anaïs, Léa, Lucas et 2 autres");
  const deux = banc({appli: "coffres", eleves: [{id: 1, prenom: "", ajouts: {coffres: {}}}, {id: 2, prenom: "Zoé", ajouts: {coffres: {}}}]});
  deux.f.poserQuiVoit();
  assert.equal(deux.$("qui-voit-etat").textContent, "Ouvert à quelques élèves · Zoé, un élève sans prénom");
});

test("personne ne voit l'appli : pas de ligne, la carte « … est fermé à la 405 » ; un collègue la lit sans boutons", () => {
  const r = banc({appli: "coffres"});
  r.f.poserQuiVoit();
  assert.equal(r.$("qui-voit").hidden, true);
  assert.equal(r.$("appli-fermee").hidden, false);
  assert.equal(r.$("af-titre").textContent, "Coffres magiques est fermé à la 405");
  assert.equal(r.$("af-texte").textContent, "Aucun élève de la 405 ne le voit dans son espace. Ouvre-le à toute la classe, ou seulement à quelques élèves.");
  assert.equal(r.$("af-toute").textContent, "Ouvrir à toute la 405");
  assert.equal(r.$("af-actions").hidden, false);
  for (const droit of ["ecriture", "lecture"]) {
    const c = banc({appli: "coffres", droit});
    c.f.poserQuiVoit();
    assert.equal(c.$("af-actions").hidden, true, droit);
    assert.equal(c.$("af-texte").textContent, "Aucun élève de la 405 ne le voit dans son espace.", droit);
    const l = banc({droit});
    l.f.poserQuiVoit();
    assert.deepEqual([l.$("qui-voit").hidden, l.$("regler-appli").hidden], [false, true], `${droit} : la ligne se lit, « Régler » n'est pas là`);
  }
  // Hors de la vue de l'activité (Élèves, Réglages) : ni ligne ni carte.
  r.f.poser({vue: "reglages"});
  r.f.poserQuiVoit();
  assert.deepEqual([r.$("qui-voit").hidden, r.$("appli-fermee").hidden], [true, true]);
});

test("« Ouvrir à toute la 306 » : un seul appel (la liste des applis), la classe relue, le mot ; un collègue ne peut pas", async () => {
  const r = banc({classe: classe405({libelle: "306"}), appli: "coffres"});
  await r.f.ouvrirATouteLaClasse();
  assert.deepEqual(r.serveur.appels.map(a => [a.action, a.corps]), [["classes.modifier", {classe_id: 7, applis: ["defi-tables", "splat", "coffres"], avant: {applis: ["defi-tables", "splat"]}}]],
    "avec « avant » : la liste telle que la page la connaît (correctif 5b)");
  assert.deepEqual(r.journal, ["ouvrirClasse 7"]);
  assert.deepEqual(message(r, "message-appli"), ["Coffres magiques ouvert à toute la 306 : la tuile apparaît dans l’espace des élèves.", "message ok", false]);
  assert.deepEqual([r.$("af-toute").disabled, r.$("af-quelques").disabled, r.f.etat().reglageEnCours], [false, false, false], "les deux boutons et le verrou se libèrent");
  const c = banc({appli: "coffres", droit: "ecriture"});
  await c.f.ouvrirATouteLaClasse();
  assert.deepEqual(c.serveur.appels, []);
  const panne = banc({appli: "coffres"});
  panne.serveur.panne("classes.modifier", panne.serveur.erreur("Le serveur a eu un souci.", 500));
  await panne.f.ouvrirATouteLaClasse();
  assert.deepEqual(panne.journal, ["ouvrirClasse 7"], "relue quand même (il a peut-être écrit) ; le refus est dit par la page, pas par surErreur");
  assert.deepEqual(message(panne, "message-appli"), ["Le serveur a eu un souci.", "message erreur", false]);
  assert.equal(panne.$("af-toute").disabled, false, "le bouton se libère");
  // Un 401 : la déconnexion, comme partout.
  const fini = banc({appli: "coffres"});
  fini.serveur.panne("classes.modifier", fini.serveur.erreur("Session expirée.", 401));
  await fini.f.ouvrirATouteLaClasse();
  assert.deepEqual(fini.journal, ["surErreur message-appli 401"]);
  assert.equal(fini.f.etat().jeton, "");
});

// ------------------------------------------------------------ la fenêtre : le brouillon

test("propriétaire seulement : un collègue n'ouvre pas la fenêtre et n'enregistre rien ; le serveur le refuse aussi", async () => {
  for (const droit of ["ecriture", "lecture"]) {
    const r = banc({droit});
    r.f.ouvrirRegler("splat");
    assert.equal(r.boite().open, false, droit);
    assert.equal(r.f.etat().reglage, null);
    await r.f.enregistrerRegler();
    assert.deepEqual(r.serveur.appels, [], droit);
  }
  // Ouverte par le propriétaire, puis le droit change (classe relue ailleurs) : rien ne part.
  const r = banc();
  r.f.ouvrirRegler("splat");
  cocher(caseNumero(r.corps(), "mondes", 4), true);
  r.f.poser({droit: "ecriture"});
  await r.f.enregistrerRegler();
  assert.deepEqual(r.serveur.appels, []);
  const api = (await import("node:fs")).readFileSync(new URL("../_serveur/public/api/prof.php", import.meta.url), "utf8");
  assert.match(api, /'classes\.modifier' => 'proprietaire',/, "côté serveur aussi : propriétaire seulement");
  assert.match(api, /'eleves\.acces' => 'proprietaire',/);
});

test("rien ne part avant « Enregistrer » : Annuler, ✕ ou Échap ferment sans appel, oublient le brouillon ; rouverte, la fenêtre montre l'état vrai", () => {
  const r = banc();
  r.f.ouvrirRegler("splat");
  assert.equal(r.boite().open, true);
  assert.equal(r.$("regler-titre").textContent, "Régler SPLAT!");
  assert.equal(r.$("regler-sous").textContent, "Ce que trouvent les élèves de la 405 dans leur espace.");
  cocher(caseNumero(r.corps(), "mondes", 4), true);
  cocher(caseDe(ligneDe(r, 3), "Alice"), true);
  r.f.annuler();
  assert.equal(r.boite().open, false);
  assert.deepEqual(r.serveur.appels, [], "Annuler n'envoie rien");
  assert.equal(r.f.etat().reglage, null, "le brouillon est oublié");
  assert.deepEqual(["regler-titre", "regler-sous", "regler-corps"].map(id => r.$(id).textContent), ["", "", ""], "plus aucun prénom dans la fenêtre fermée");
  r.f.ouvrirRegler("splat");
  assert.equal(caseNumero(r.corps(), "mondes", 4).checked, false, "rouverte : le monde 4 est toujours fermé");
  assert.equal(caseDe(ligneDe(r, 3), "Alice").checked, false);
  assert.equal(caseDe(ligneDe(r, 3), "Lucas").checked, true, "l'ajout rangé de Lucas");
  assert.equal(r.f.echap(), false, "Échap ferme");
  assert.equal(r.boite().open, false);
  assert.deepEqual(r.serveur.appels, []);
});

test("SPLAT! à la classe : « Pour la classe » (les mondes), puis une ligne par monde FERMÉ — « Choisir… » déplie les élèves, et le reste quand la fenêtre se redessine", () => {
  const r = banc();
  r.f.ouvrirRegler("splat");
  assert.equal(caseDe(r.corps(), "Ouvert à toute la 405").checked, true);
  assert.ok(caseDe(r.corps(), "Ouvert à toute la 405").parent.classList.contains("case-classe"));
  assert.deepEqual(titres(r.corps()), ["Pour la classe", "Un monde en plus pour quelques élèves"]);
  assert.equal(r.corps().tous(n => n.className === "aide").map(n => n.textContent)[0], "Les mondes fermés à la 405. Rien n’est retiré à un élève : on ajoute.");
  assert.deepEqual(lignesPlus(r.corps()).map(l => [l.premier(n => n.className === "quoi").textContent, l.premier(n => n.classList.contains("qui")).textContent, l.premier(n => n.className === "choisir").textContent]),
    [["3Enquête", "Lucas D.", "Choisir…"], ["4Système", "personne", "Choisir…"], ["6Relatifs", "personne", "Choisir…"]]);
  assert.ok(ligneDe(r, 3).premier(n => n.classList.contains("qui")).classList.contains("quelquun"));
  // La grille d'une ligne : l'ordre et les numéros de la feuille prénom ↔ code.
  assert.deepEqual(ligneDe(r, 4).tous(n => n.tag === "label").map(l => l.textContent.trim()), ["Alice G.", "Inès", "Lucas D.", "Rania", "n° 5 (sans prénom)"]);
  // Dépliée, puis un monde coché pour la classe : la fenêtre se redessine, la ligne 4 a disparu, la 6 reste dépliée.
  ligneDe(r, 6).open = true;
  ligneDe(r, 6).declencher("toggle");
  cocher(caseNumero(r.corps(), "mondes", 4), true);
  assert.deepEqual(lignesPlus(r.corps()).map(l => l.premier(n => n.className === "quoi").textContent), ["3Enquête", "6Relatifs"]);
  assert.equal(ligneDe(r, 6).open, true, "la ligne dépliée le reste");
  cocher(caseDe(ligneDe(r, 6), "Inès"), true);
  assert.equal(ligneDe(r, 6).premier(n => n.classList.contains("qui")).textContent, "Inès", "le résumé suit la case, tout de suite");
});

test("Enregistrer : la classe d'abord (seul ce qui a changé), puis chaque élève qui change — l'état COMPLET de ses ajouts, avec « avant » ; tout relu ; fenêtre fermée, le mot", async () => {
  const r = banc();
  r.f.ouvrirRegler("splat");
  cocher(caseNumero(r.corps(), "mondes", 4), true);
  cocher(caseDe(ligneDe(r, 3), "Alice"), true);
  cocher(caseDe(ligneDe(r, 3), "Lucas D."), false);
  cocher(caseDe(ligneDe(r, 6), "Rania"), true);
  await r.f.enregistrerRegler();
  assert.deepEqual(r.serveur.appels.map(a => [a.action, a.corps]), [
    ["classes.modifier", {classe_id: 7, reglages: {splat: {mondes: [1, 2, 4, 5]}}, avant: {applis: ["defi-tables", "splat"], reglages: {splat: {mondes: [1, 2, 5]}}}}],
    ["eleves.acces", {eleve_id: 1, avant: {}, ajouts: {splat: {mondes: [3]}}}],
    ["eleves.acces", {eleve_id: 16, avant: {splat: {mondes: [3]}}, ajouts: {}}],
    ["eleves.acces", {eleve_id: 22, avant: {"flash-anzan": {}}, ajouts: {"flash-anzan": {}, splat: {mondes: [6]}}}]
  ], "Rania garde Anzan : son état complet part, pas seulement SPLAT!");
  assert.deepEqual(r.journal, ["ouvrirClasse 7"], "tout est relu une fois, après");
  assert.equal(r.boite().open, false);
  assert.deepEqual(message(r, "message-appli"), ["SPLAT! : réglages enregistrés (la 405 et 3 élèves).", "message ok", false]);
  assert.equal(r.f.etat().reglageEnCours, false);
  assert.deepEqual(r.serveur.etat.eleves.find(e => e.id === 16).ajouts, {}, "le retrait SUPPRIME la clé, jamais {splat: {}} (= SPLAT! entière)");
  // Rien de changé : Enregistrer ferme, sans appel.
  const rien = banc();
  rien.f.ouvrirRegler("splat");
  await rien.f.enregistrerRegler();
  assert.deepEqual([rien.serveur.appels, rien.journal, rien.boite().open], [[], [], false]);
  // Un élève seul : son prénom dans le mot.
  const un = banc();
  un.f.ouvrirRegler("splat");
  cocher(caseDe(ligneDe(un, 4), "Inès"), true);
  await un.f.enregistrerRegler();
  assert.deepEqual(un.serveur.appels.map(a => a.action), ["eleves.acces"], "la classe ne change pas : pas de classes.modifier");
  assert.equal(un.$("message-appli").textContent, "SPLAT! : réglages enregistrés (Inès).");
});

test("pendant l'enregistrement : la fenêtre est grisée, Annuler / ✕ / Échap ne la ferment pas, un second Enregistrer et « Régler » ne partent pas", async () => {
  const r = banc({delai: SANS_COUPURE});
  r.serveur.tenir(true);
  r.f.ouvrirRegler("splat");
  cocher(caseNumero(r.corps(), "mondes", 4), true);
  const fin = r.f.enregistrerRegler();
  await tic();
  assert.equal(r.f.etat().reglageEnCours, true);
  assert.deepEqual(message(r), ["Enregistrement…", "message info", false]);
  assert.ok(r.corps().tous(n => n.tag === "input").every(c => c.disabled), "les cases sont grisées");
  assert.ok(r.corps().tous(n => n.tag === "summary").every(s => s.tabIndex === -1), "les « Choisir… » ne se prennent plus au clavier");
  assert.deepEqual(["regler-enregistrer", "regler-annuler", "regler-croix"].map(id => r.$(id).disabled), [true, true, true]);
  assert.equal(r.corps().attributs["aria-busy"], "true");
  r.f.annuler();
  assert.equal(r.f.echap(), true, "Échap est retenu");
  assert.equal(r.boite().open, true, "la fenêtre attend la fin");
  await r.f.enregistrerRegler();
  r.f.ouvrirRegler("coffres");
  assert.equal(r.f.etat().reglage.brouillon.cle, "splat", "« Régler Coffres » ne remplace pas la fenêtre en route");
  assert.equal(r.serveur.appels.length, 1, "un seul envoi");
  r.serveur.lacher();
  await fin;
  assert.equal(r.boite().open, false);
  assert.equal(r.corps().attributs["aria-busy"], "false");
});

// ------------------------------------------------------------ la classe décochée : l'appli pour quelques élèves (D3, D4)

test("la classe décochée : « Ou seulement pour quelques élèves » — l'appli ENTIÈRE ; le pied dit qui la verra", () => {
  const r = banc({appli: "flash-anzan"});
  r.f.ouvrirRegler("flash-anzan");
  assert.equal(caseDe(r.corps(), "Ouvert à toute la 405").checked, false);
  assert.deepEqual(titres(r.corps()), ["Ou seulement pour quelques élèves"]);
  assert.equal(r.corps().premier(n => n.className === "aide").textContent, "Ils ont Anzan dans leur espace.");
  assert.equal(caseDe(r.corps(), "Rania").checked, true);
  assert.deepEqual(message(r), ["Rania le voit dans son espace.", "message info", false]);
  cocher(caseDe(r.corps(), "Lucas D."), true);
  assert.equal(r.$("regler-message").textContent, "Lucas D. et Rania le voient dans leur espace.");
  cocher(caseDe(r.corps(), "Alice G."), true);
  cocher(caseDe(r.corps(), "Inès"), true);
  assert.equal(r.$("regler-message").textContent, "4 élèves le voient dans leur espace.");
  ["Alice G.", "Inès", "Lucas D.", "Rania"].forEach(nom => cocher(caseDe(r.corps(), nom), false));
  assert.equal(r.$("regler-message").textContent, "Personne ne verra Anzan.");
});

test("décocher la classe : la question d'abord (« sauf ceux qui l'ont en plus », rien n'est effacé) ; oui → la liste des applis, puis l'appli entière pour les élèves cochés", async () => {
  const r = banc({appli: "splat"});
  r.f.ouvrirRegler("splat");
  cocher(caseDe(r.corps(), "Ouvert à toute la 405"), false);
  assert.deepEqual(titres(r.corps()), ["Ou seulement pour quelques élèves"]);
  assert.equal(caseDe(r.corps(), "Lucas D.").checked, true, "Lucas a un ajout SPLAT! : il est coché");
  assert.equal(caseDe(r.corps(), "Lucas D.").parent.premier(n => n.tag === "small").textContent, "seulement : monde 3", "son ajout ne nomme que le monde 3 (D4) : on le dit");
  cocher(caseDe(r.corps(), "Inès"), true);
  await r.f.enregistrerRegler();
  assert.deepEqual(r.questions.map(q => q.texte), ["Retirer SPLAT! de la classe 405 ? La tuile disparaît de l’espace des élèves (sauf ceux qui l’ont en plus). Leur travail reste enregistré : rien n’est effacé."]);
  assert.deepEqual(r.serveur.appels.map(a => [a.action, a.corps]), [
    ["classes.modifier", {classe_id: 7, applis: ["defi-tables"], avant: {applis: ["defi-tables", "splat"], reglages: {splat: {mondes: [1, 2, 5]}}}}],
    ["eleves.acces", {eleve_id: 30, avant: {}, ajouts: {splat: {}}}]
  ], "Lucas n'est pas touché : son « seulement monde 3 » reste tel quel");
  assert.deepEqual(r.serveur.etat.eleves.find(e => e.id === 16).ajouts, {splat: {mondes: [3]}});
  // Lucas décoché : son ajout part — la clé SUPPRIMÉE.
  const l = banc({appli: "splat", classe: classe405({applis: ["defi-tables"]})});
  l.f.ouvrirRegler("splat");
  cocher(caseDe(l.corps(), "Lucas D."), false);
  await l.f.enregistrerRegler();
  assert.deepEqual(l.questions, [], "la classe ne change pas : pas de question");
  assert.deepEqual(acces(l).map(a => a.corps), [{eleve_id: 16, avant: {splat: {mondes: [3]}}, ajouts: {}}]);
});

test("D4 — un ajout rattrapé par la classe est GARDÉ : ouvrir le monde 3 à la classe ne touche pas à l'ajout de Lucas", async () => {
  const r = banc();
  r.f.ouvrirRegler("splat");
  cocher(caseNumero(r.corps(), "mondes", 3), true);
  assert.equal(ligneDe(r, 3), undefined, "le monde 3 n'est plus fermé : sa ligne part de la fenêtre");
  await r.f.enregistrerRegler();
  assert.deepEqual(r.serveur.appels.map(a => a.action), ["classes.modifier"], "aucun eleves.acces : ce qu'on ne voit pas n'est pas touché");
  assert.deepEqual(r.serveur.etat.eleves.find(e => e.id === 16).ajouts, {splat: {mondes: [3]}}, "si la classe referme le monde 3, Lucas le garde");
  // gestesDe, la règle : seulement les numéros fermés dans le brouillon ; la classe décochée, seulement l'appli entière.
  const gestes = r.f.gestesDe;
  const depart = {cle: "splat", classeOuverte: true, listes: {mondes: new Set([1, 2])}, entiers: new Set([16]), parNumero: {"mondes:3": new Set([16]), "mondes:4": new Set()}};
  const brouillon = {cle: "splat", classeOuverte: true, listes: {mondes: new Set([1, 2, 3])}, entiers: new Set([16]), parNumero: {"mondes:3": new Set(), "mondes:4": new Set([16])}};
  assert.deepEqual(gestes({id: 16}, depart, brouillon), [{cle: "splat", liste: "mondes", numero: 4, ouvre: true}], "le monde 3, ouvert à la classe, est ignoré même décoché");
  assert.deepEqual(gestes({id: 16}, depart, Object.assign({}, brouillon, {classeOuverte: false, entiers: new Set()})), [{cle: "splat", ouvre: false}]);
  assert.deepEqual(gestes({id: 16}, depart, Object.assign({}, brouillon, {classeOuverte: false})), [], "toujours coché : rien");
});

// ------------------------------------------------------------ la dernière case, la dernière appli, Anzan, les records

test("une classe garde au moins une activité, un monde, un niveau, une opération : refusé sans appel, avec le mot", async () => {
  const seule = banc({classe: classe405({applis: ["splat"]})});
  seule.f.ouvrirRegler("splat");
  cocher(caseDe(seule.corps(), "Ouvert à toute la 405"), false);
  await seule.f.enregistrerRegler();
  assert.deepEqual([seule.serveur.appels, seule.questions], [[], []]);
  assert.deepEqual(message(seule), ["Une classe garde au moins une activité.", "message erreur", false]);
  const DERNIER = new Function(`${constante("DERNIER_NUMERO")}\nreturn DERNIER_NUMERO;`)();
  assert.deepEqual(DERNIER, {mondes: "Une classe garde au moins un monde ouvert.", niveaux: "Une classe garde au moins un niveau ouvert.", operations: "Une classe garde au moins une opération ouverte."});
  const mondes = banc({classe: classe405({reglages: {splat: {mondes: [5]}}})});
  mondes.f.ouvrirRegler("splat");
  cocher(caseNumero(mondes.corps(), "mondes", 5), false);
  assert.equal(caseNumero(mondes.corps(), "mondes", 5).checked, true);
  assert.equal(mondes.$("regler-message").textContent, DERNIER.mondes);
});

test("Anzan à la classe : rien à régler pour elle — « Toute la 405 le voit déjà. »", async () => {
  const r = banc({classe: classe405({applis: ["defi-tables", "flash-anzan", "splat"]}), appli: "flash-anzan"});
  r.f.ouvrirRegler("flash-anzan");
  assert.deepEqual(titres(r.corps()), []);
  assert.equal(r.corps().premier(n => n.className === "deja").textContent, "Toute la 405 le voit déjà.");
  r.f.poserQuiVoit();
  assert.equal(r.$("qui-voit-etat").textContent, "Ouvert à toute la 405");
  await r.f.enregistrerRegler();
  assert.deepEqual(r.serveur.appels, []);
});

test("🏆 Les records : une case « Pour la classe » de Défi tables ; décochée → reglages {records: false} à « Enregistrer »", async () => {
  const r = banc({appli: "defi-tables"});
  r.f.ouvrirRegler("defi-tables");
  assert.deepEqual(titres(r.corps()), ["Pour la classe"]);
  const records = caseDe(r.corps(), "🏆 Les records");
  assert.equal(records.checked, true, "ouverts par défaut");
  assert.equal(records.parent.premier(n => n.tag === "small").textContent, "Le concours de temps des Légendes des tables. Décoché : la 405 ne le voit pas et n’y apparaît pas.");
  assert.equal(r.corps().premier(n => n.className === "deja").textContent, "Toute la 405 le voit déjà.");
  cocher(records, false);
  await r.f.enregistrerRegler();
  assert.deepEqual(r.serveur.appels.map(a => a.corps), [{classe_id: 7, reglages: {"defi-tables": {records: false}}, avant: {applis: ["defi-tables", "splat"], reglages: {"defi-tables": {}}}}]);
  const ferme = banc({appli: "defi-tables", classe: classe405({reglages: {"defi-tables": {records: false}}})});
  ferme.f.ouvrirRegler("defi-tables");
  assert.equal(caseDe(ferme.corps(), "🏆 Les records").checked, false);
});

// ------------------------------------------------------------ quand le serveur refuse : 409, panne, délai, 401

test("409 — un autre onglet a changé ce que voit Inès : rien n'est écrasé, les autres élèves passent, la fenêtre reste, relue, et dit ce qui manque", async () => {
  const r = banc();
  r.f.ouvrirRegler("splat");
  cocher(caseNumero(r.corps(), "mondes", 6), true);
  cocher(caseDe(ligneDe(r, 3), "Alice G."), true);
  cocher(caseDe(ligneDe(r, 3), "Inès"), true);
  cocher(caseDe(ligneDe(r, 3), "n° 5"), true);
  r.serveur.ecrireAilleurs(30, {coffres: {}});   // pendant ce temps, dans un autre onglet
  await r.f.enregistrerRegler();
  assert.deepEqual(acces(r).map(a => a.corps.eleve_id), [1, 30, 31], "chacun tente, un refus n'arrête pas les suivants");
  assert.deepEqual(r.serveur.etat.eleves.find(e => e.id === 31).ajouts, {splat: {mondes: [3]}}, "l'élève d'après Inès est enregistré");
  assert.deepEqual(r.serveur.etat.eleves.find(e => e.id === 30).ajouts, {coffres: {}}, "le serveur garde ce que l'autre onglet a écrit : jamais écrasé");
  assert.deepEqual(r.serveur.etat.eleves.find(e => e.id === 1).ajouts, {splat: {mondes: [3]}});
  assert.equal(r.boite().open, true, "la fenêtre reste");
  assert.deepEqual(r.journal, ["ouvrirClasse 7"], "relue");
  assert.equal(caseNumero(r.corps(), "mondes", 6).checked, true, "redessinée sur l'état relu : le monde 6 est ouvert à la classe");
  assert.equal(caseDe(ligneDe(r, 3), "Inès").checked, false, "Inès : décochée — ce qui est rangé");
  assert.equal(caseDe(ligneDe(r, 3), "Alice G.").checked, true);
  assert.deepEqual(message(r), ["Enregistré : la 405 et 2 élèves. Pas enregistré pour Inès : un autre onglet l’a changé entre-temps. La fenêtre montre ce qui est enregistré maintenant : refais ce qui manque.", "message erreur", false]);
  assert.equal(r.f.etat().reglageEnCours, false);
  assert.ok(r.corps().tous(n => n.tag === "input").every(c => !c.disabled), "la fenêtre se libère");
  // Refaire ce qui manque : cette fois « avant » est l'état relu, le serveur accepte.
  cocher(caseDe(ligneDe(r, 3), "Inès"), true);
  await r.f.enregistrerRegler();
  assert.deepEqual(acces(r).at(-1).corps, {eleve_id: 30, avant: {coffres: {}}, ajouts: {coffres: {}, splat: {mondes: [3]}}});
  assert.equal(r.boite().open, false);
});

test("la classe refusée : rien n'est envoyé pour les élèves (le brouillon forme un tout), la fenêtre le dit", async () => {
  const r = banc();
  r.serveur.panne("classes.modifier", r.serveur.erreur("Le serveur a eu un souci.", 500));
  r.f.ouvrirRegler("splat");
  cocher(caseDe(r.corps(), "Ouvert à toute la 405"), false);
  cocher(caseDe(r.corps(), "Inès"), true);
  await r.f.enregistrerRegler();
  assert.deepEqual(r.serveur.appels.map(a => a.action), ["classes.modifier"], "« seulement pour Inès » n'a de sens que si la classe est fermée");
  assert.equal(r.boite().open, true);
  assert.equal(caseDe(r.corps(), "Ouvert à toute la 405").checked, true, "relue : la classe a toujours SPLAT!");
  assert.equal(r.$("regler-message").textContent, "Rien d’enregistré pour la 405 : Le serveur a eu un souci. La fenêtre montre ce qui est enregistré maintenant : refais ce qui manque.");
});

test("le serveur ne répond jamais : l'attente est bornée (DELAI_ACCES_MS), la fenêtre le dit et se libère, tout est relu", {timeout: 3000}, async () => {
  assert.match(script, /const DELAI_ACCES_MS = 15000;/, "15 s sur la vraie page");
  assert.match(fonction("appelBorne"), /const garde = new AbortController\(\);\s*const minuteur = setTimeout\(\(\) => garde\.abort\(\), DELAI_ACCES_MS\);/);
  assert.match(fonction("appelBorne"), /finally \{\s*clearTimeout\(minuteur\);\s*\}/);
  const r = banc({delai: 30});
  r.serveur.muet(true);
  r.f.ouvrirRegler("splat");
  cocher(caseDe(ligneDe(r, 4), "Inès"), true);
  const debut = Date.now();
  await r.f.enregistrerRegler();
  assert.ok(Date.now() - debut < 1000, "borné");
  assert.equal(r.boite().open, true);
  assert.deepEqual(message(r), ["Pas enregistré pour Inès : Le serveur ne répond pas. La fenêtre montre ce qui est enregistré maintenant : refais ce qui manque.", "message erreur", false]);
  assert.equal(r.f.etat().reglageEnCours, false);
  assert.deepEqual(r.journal, ["ouvrirClasse 7"], "relue : il a peut-être écrit");
  // Le réseau coupé (TypeError) dit la même chose, en français.
  const coupe = banc();
  coupe.serveur.panne("eleves.acces", Object.assign(new TypeError("Failed to fetch")));
  coupe.f.ouvrirRegler("splat");
  cocher(caseDe(ligneDe(coupe, 4), "Inès"), true);
  await coupe.f.enregistrerRegler();
  assert.match(coupe.$("regler-message").textContent, /Pas enregistré pour Inès : Le serveur ne répond pas\./);
});

test("une réponse arrivée après « Se déconnecter » n'est pas posée : ni relecture, ni message, ni envoi suivant ; un vieux 401 ne déconnecte pas la session neuve", async () => {
  const r = banc();
  r.serveur.tenir(true);
  r.f.ouvrirRegler("splat");
  cocher(caseNumero(r.corps(), "mondes", 4), true);
  cocher(caseDe(ligneDe(r, 3), "Alice G."), true);
  const fin = r.f.enregistrerRegler();
  await tic();
  r.f.deconnecter();
  assert.equal(r.boite().open, false);
  assert.equal(r.f.etat().reglageEnCours, false, "remis à faux par la déconnexion");
  r.f.reconnecter();
  r.serveur.lacher();
  await fin;
  assert.deepEqual(r.serveur.appels.map(a => a.action), ["classes.modifier"], "l'envoi pour Alice ne part pas après la déconnexion");
  assert.deepEqual(r.journal, [], "ni relecture, ni erreur");
  assert.equal(r.$("message-appli").textContent, "");
  // Le 401 de la vieille session arrive après la reconnexion : il ne touche à rien.
  const s = banc();
  s.serveur.tenir(true);
  s.serveur.panne("eleves.acces", s.serveur.erreur("Session expirée.", 401));
  s.f.ouvrirRegler("splat");
  cocher(caseDe(ligneDe(s, 4), "Inès"), true);
  const fin2 = s.f.enregistrerRegler();
  await tic();
  s.f.deconnecter();
  s.f.reconnecter();
  // Une nouvelle fenêtre s'ouvre tout de suite, et son enregistrement est en route quand la vieille réponse tombe.
  s.f.ouvrirRegler("splat");
  assert.equal(s.boite().open, true, "« Régler » s'ouvre tout de suite après la reconnexion");
  cocher(caseNumero(s.corps(), "mondes", 6), true);
  const fin3 = s.f.enregistrerRegler();
  await tic();
  s.serveur.lacher();   // le vieux 401
  await fin2;
  assert.deepEqual(s.journal, [], "pas de « Session terminée » pour la session neuve");
  assert.equal(s.f.etat().jeton, "jeton-2");
  assert.equal(s.f.etat().reglageEnCours, true, "l'enregistrement neuf est toujours en route : le vieux ne l'a pas libéré");
  s.serveur.lacher();
  await fin3;
  assert.deepEqual(s.journal, ["ouvrirClasse 7"]);
  assert.equal(s.$("message-appli").textContent, "SPLAT! : réglages enregistrés (la 405).");
});

test("un 401 dans la session : « Session terminée », la déconnexion — rien d'autre ne part", async () => {
  const r = banc();
  r.serveur.panne("eleves.acces", r.serveur.erreur("Session expirée.", 401), 1);
  r.f.ouvrirRegler("splat");
  cocher(caseDe(ligneDe(r, 3), "Alice G."), true);
  cocher(caseDe(ligneDe(r, 4), "Inès"), true);
  await r.f.enregistrerRegler();
  assert.deepEqual(acces(r).map(a => a.corps.eleve_id), [1], "Inès n'est pas tentée après le 401");
  assert.deepEqual(r.journal, ["surErreur regler-message 401"]);
  assert.equal(r.f.etat().jeton, "");
  const c = banc();
  c.serveur.panne("classes.modifier", c.serveur.erreur("Session expirée.", 401));
  c.f.ouvrirRegler("splat");
  cocher(caseNumero(c.corps(), "mondes", 4), true);
  cocher(caseDe(ligneDe(c, 6), "Inès"), true);
  await c.f.enregistrerRegler();
  assert.deepEqual(c.serveur.appels.map(a => a.action), ["classes.modifier"]);
  assert.deepEqual(c.journal, ["surErreur regler-message 401"]);
});

// ------------------------------------------------------------ le correctif de la relecture Codex (30/10/2026)
//
// Huit points, tous fondés, corrigés d'un coup. Les tests « réels »
// (reel: true) jouent la VRAIE api() sur un faux fetch sensible au signal et
// la VRAIE ouvrirClasse() ; les autres, le banc simple (ouvrirClasse remplacée,
// pilotable : relue, en panne, pendante).

const reel = (o = {}) => banc(Object.assign({reel: true}, o));
const fetchDe = (r, action) => r.serveur.appelsFetch.filter(a => a.action === action);
// Fini avant `ms` millisecondes ? (sans bloquer le test si ce n'est pas le cas)
const finiAvant = (promesse, ms) => Promise.race([promesse.then(() => true), new Promise(r => setTimeout(() => r(false), ms))]);

test("conflit de classe (point 1) — un autre onglet a changé la 405 : « avant » part, le serveur refuse (409), rien n'est écrasé, aucun élève n'est envoyé, la fenêtre se remet sur l'état relu et le dit", async () => {
  // Le scénario de Codex : B ferme le monde 5 ; A, resté sur [1, 2, 5], ouvre le 4 et coche Alice au monde 3.
  const r = banc();
  r.f.ouvrirRegler("splat");
  cocher(caseNumero(r.corps(), "mondes", 4), true);
  cocher(caseDe(ligneDe(r, 3), "Alice"), true);
  r.serveur.changerLaClasseAilleurs({reglages: {splat: {mondes: [1, 2]}}});
  await r.f.enregistrerRegler();
  assert.deepEqual(r.serveur.appels.map(a => [a.action, a.corps]), [
    ["classes.modifier", {classe_id: 7, reglages: {splat: {mondes: [1, 2, 4, 5]}}, avant: {applis: ["defi-tables", "splat"], reglages: {splat: {mondes: [1, 2, 5]}}}}]
  ], "« avant » : ce que la page croyait ; le refus arrête tout — Alice n'est pas envoyée");
  assert.deepEqual(r.serveur.etat.classe.reglages, {splat: {mondes: [1, 2]}}, "le monde 5 n'est PAS rouvert");
  assert.deepEqual(r.serveur.etat.eleves.find(e => e.id === 1).ajouts, {}, "Alice : rien");
  assert.deepEqual(r.journal, ["ouvrirClasse 7"], "relue");
  assert.equal(r.boite().open, true, "la fenêtre reste");
  assert.deepEqual([4, 5].map(n => caseNumero(r.corps(), "mondes", n).checked), [false, false], "redessinée sur l'état relu : ni le 4 ni le 5");
  assert.deepEqual(message(r), ["La 405 a été changée ailleurs : la fenêtre montre l’état actuel, refais ton réglage.", "message erreur", false]);
  assert.equal(r.f.etat().reglageEnCours, false);
  assert.ok(r.corps().tous(n => n.tag === "input").every(c => !c.disabled), "libre");
  // A refait son geste : cette fois « avant » est l'état relu, le serveur accepte, le 4 seul s'ouvre.
  cocher(caseNumero(r.corps(), "mondes", 4), true);
  await r.f.enregistrerRegler();
  assert.deepEqual(r.serveur.appels.at(-1).corps, {classe_id: 7, reglages: {splat: {mondes: [1, 2, 4]}}, avant: {applis: ["defi-tables", "splat"], reglages: {splat: {mondes: [1, 2]}}}});
  assert.deepEqual(r.serveur.etat.classe.reglages, {splat: {mondes: [1, 2, 4]}});
  assert.equal(r.boite().open, false);
  // Les applis : B a ajouté Anzan ; A, en retard, ouvre Coffres à la classe → refusé, Anzan reste.
  const a = banc({appli: "coffres"});
  a.f.ouvrirRegler("coffres");
  cocher(caseDe(a.corps(), "Ouvert à toute la 405"), true);
  a.serveur.changerLaClasseAilleurs({applis: ["defi-tables", "flash-anzan", "splat"]});
  await a.f.enregistrerRegler();
  assert.deepEqual(a.serveur.appels.at(-1).corps.avant, {applis: ["defi-tables", "splat"], reglages: {coffres: {}}});
  assert.deepEqual(a.serveur.etat.classe.applis, ["defi-tables", "flash-anzan", "splat"], "Anzan n'est pas retiré");
  assert.equal(caseDe(a.corps(), "Ouvert à toute la 405").checked, false, "relue : Coffres toujours fermé");
  assert.equal(a.$("regler-message").textContent, "La 405 a été changée ailleurs : la fenêtre montre l’état actuel, refais ton réglage.");
  cocher(caseDe(a.corps(), "Ouvert à toute la 405"), true);
  await a.f.enregistrerRegler();
  assert.deepEqual(a.serveur.etat.classe.applis, ["defi-tables", "flash-anzan", "splat", "coffres"], "refait : Coffres s'ajoute, Anzan reste");
  // Le raccourci aussi envoie « avant », et dit le conflit (l'onglet relu).
  const c = banc({appli: "coffres"});
  c.serveur.changerLaClasseAilleurs({applis: ["defi-tables", "flash-anzan", "splat"]});
  await c.f.ouvrirATouteLaClasse();
  assert.deepEqual(c.serveur.appels.at(-1).corps, {classe_id: 7, applis: ["defi-tables", "splat", "coffres"], avant: {applis: ["defi-tables", "splat"]}});
  assert.deepEqual(c.serveur.etat.classe.applis, ["defi-tables", "flash-anzan", "splat"]);
  assert.deepEqual(message(c, "message-appli"), ["La 405 a été changée ailleurs : l’onglet montre l’état actuel, réessaie.", "message erreur", false]);
  assert.deepEqual(c.f.etat().classe.applis, ["defi-tables", "flash-anzan", "splat"], "la page a l'état vrai");
  // Le serveur : « avant » comparé sous le verrou de la ligne, 409 avec l'état actuel.
  const api = (await import("node:fs")).readFileSync(new URL("../_serveur/public/api/prof.php", import.meta.url), "utf8");
  const modifier = api.slice(api.indexOf("case 'classes.modifier':"), api.indexOf("case 'classes.supprimer':"));
  assert.match(modifier, /avant_de_classe_recu\(\$corps\['avant'\]\)/);
  assert.match(modifier, /'SELECT \* FROM classes WHERE id = \?' \. pour_mise_a_jour\(\$pdo\)/, "la ligne verrouillée");
  assert.match(modifier, /if \(\$avant !== null && !meme_etat_de_classe\(\$avant, \$ligne, \$enPlus\)\) \{\s*transaction_annuler\(\$pdo\);\s*return \['conflit' => true/); // (lot B3 : la liste du jour se compare avec les portes de quelques élèves)
  assert.match(modifier, /\], 409\);/);
  assert.doesNotMatch(modifier, /CREATE TRIGGER/);
});

test("raccourci et fenêtre en même temps (point 2) — un seul verrou : « Ouvrir à toute la … » en route, « Choisir quelques élèves » et « Régler » attendent ; le brouillon se construit sur l'état relu", async () => {
  for (const mode of ["simple", "reel"]) {
    const r = mode === "reel" ? reel({appli: "coffres", delai: SANS_COUPURE}) : banc({appli: "coffres", delai: SANS_COUPURE});
    r.f.poserQuiVoit();
    r.serveur.tenir(true);
    const rapide = r.f.ouvrirATouteLaClasse();
    await tic();
    assert.equal(r.f.etat().reglageEnCours, true, `${mode} : le raccourci tient le verrou`);
    assert.deepEqual([r.$("af-toute").disabled, r.$("af-quelques").disabled], [true, true], `${mode} : les deux boutons attendent`);
    r.f.ouvrirRegler("coffres");
    assert.equal(r.boite().open, false, `${mode} : la fenêtre ne s'ouvre pas pendant le raccourci`);
    assert.equal(r.f.etat().reglage, null);
    await r.f.enregistrerRegler();
    assert.equal(r.serveur.appels.length, 1, `${mode} : rien d'autre ne part`);
    r.serveur.lacher();                 // la réponse de classes.modifier
    if (mode === "reel") { await laisser(); r.serveur.lacher(); }   // puis celle du tableau
    await rapide;
    assert.deepEqual(r.serveur.etat.classe.applis, ["defi-tables", "splat", "coffres"]);
    assert.equal(r.f.etat().reglageEnCours, false, `${mode} : le verrou est rendu`);
    assert.deepEqual([r.$("af-toute").disabled, r.$("af-quelques").disabled], [false, false]);
    r.f.ouvrirRegler("coffres");
    assert.equal(r.boite().open, true);
    assert.equal(caseDe(r.corps(), "Ouvert à toute la 405").checked, true, `${mode} : le brouillon part de l'état relu — Coffres est ouvert à la classe`);
    // L'autre ordre : la fenêtre enregistre, le raccourci ne part pas.
    const f = mode === "reel" ? reel({appli: "coffres", delai: SANS_COUPURE}) : banc({appli: "coffres", delai: SANS_COUPURE});
    f.serveur.tenir(true);
    f.f.ouvrirRegler("coffres");
    cocher(caseDe(f.corps(), "Alice"), true);
    const fin = f.f.enregistrerRegler();
    await tic();
    await f.f.ouvrirATouteLaClasse();
    assert.deepEqual(f.serveur.appels.map(a => a.action), ["eleves.acces"], `${mode} : le raccourci attend — Coffres n'est pas ouvert à la classe derrière le dos de « seulement Alice »`);
    f.serveur.lacher();
    if (mode === "reel") { await laisser(); f.serveur.lacher(); }
    await fin;
    assert.deepEqual(f.serveur.etat.classe.applis, ["defi-tables", "splat"], `${mode} : la classe n'a pas Coffres`);
    assert.deepEqual(f.serveur.etat.eleves.find(e => e.id === 1).ajouts, {coffres: {}}, `${mode} : Alice seule`);
    assert.deepEqual([f.$("af-toute").disabled, f.$("af-quelques").disabled, f.f.etat().reglageEnCours], [false, false, false],
      `${mode} : après l'enregistrement de la fenêtre, les boutons de la carte (grisés pendant la relecture) sont libres`);
  }
});

test("ancienne session dans le raccourci (point 3) — une réponse d'avant « Se déconnecter » (succès ou 401) ne fait rien : ni relecture, ni message, ni déconnexion de la session neuve ; une autre classe ouverte entre-temps non plus", async () => {
  for (const mode of ["simple", "reel"]) {
    for (const refuse of [false, true]) {
      const r = mode === "reel" ? reel({appli: "coffres", delai: SANS_COUPURE}) : banc({appli: "coffres", delai: SANS_COUPURE});
      r.serveur.tenir(true);
      if (refuse) r.serveur.panne("classes.modifier", r.serveur.erreur("Session expirée.", 401));
      const fin = r.f.ouvrirATouteLaClasse();
      await tic();
      r.f.deconnecter();
      assert.equal(r.f.etat().reglageEnCours, false, "la déconnexion rend le verrou");
      r.f.reconnecter();
      // La session neuve enregistre déjà quelque chose quand la vieille réponse tombe.
      r.f.ouvrirRegler("coffres");
      cocher(caseDe(r.corps(), "Alice"), true);
      const neuf = r.f.enregistrerRegler();
      await tic();
      r.serveur.lacher();   // la vieille réponse
      await fin;
      const quoi = `${mode}, ${refuse ? "401" : "succès"}`;
      assert.deepEqual(r.journal, [], `${quoi} : ni relecture ni « Session terminée »`);
      assert.equal(r.f.etat().jeton, "jeton-2", `${quoi} : la session neuve tient`);
      assert.equal(r.$("message-appli").textContent, "", `${quoi} : pas de message`);
      assert.equal(r.f.etat().reglageEnCours, true, `${quoi} : le verrou de la session neuve n'est pas rendu par la vieille`);
      assert.equal(r.serveur.appels.filter(a => a.action === "tableau").length, 0, `${quoi} : aucune lecture avec le nouveau jeton`);
      r.serveur.lacher();
      if (mode === "reel") { await laisser(); r.serveur.lacher(); }
      await neuf;
      assert.equal(r.f.etat().reglageEnCours, false);
    }
    // Une autre classe ouverte pendant l'attente : la réponse ne la relit pas, ne dit rien.
    const autre = mode === "reel" ? reel({appli: "coffres", delai: SANS_COUPURE}) : banc({appli: "coffres", delai: SANS_COUPURE});
    autre.serveur.tenir(true);
    const fin = autre.f.ouvrirATouteLaClasse();
    await tic();
    autre.f.poser({classe: {id: 8, libelle: "306", applis: ["defi-tables"], reglages: {}}});
    autre.serveur.lacher();
    await fin;
    assert.deepEqual(autre.journal, [], `${mode} : la 306 n'est pas relue par la réponse de la 405`);
    assert.equal(autre.$("message-appli").textContent, "");
    assert.equal(autre.f.etat().reglageEnCours, false, "le verrou est rendu (même session)");
  }
});

test("relecture bornée (point 4) — le tableau qui ne répond pas après l'écriture : la fenêtre se libère dans le délai et dit que la vérification n'a pas pu se faire ; le raccourci aussi", {timeout: 5000}, async () => {
  assert.match(fonction("relireBornee"), /ouvrirClasse\(classeId, \{signal: garde\.signal\}\)/);
  assert.match(fonction("relireBornee"), /setTimeout\(\(\) => garde\.abort\(\), DELAI_ACCES_MS\)/);
  assert.match(fonction("enregistrerRegler"), /const relu = await relireBornee\(classeId\);/);
  assert.match(fonction("enregistrerRegler"), /\} finally \{\s*if \(encoreLa\(\)\) \{\s*reglageEnCours = false;/, "le verrou rendu dans un finally gardé par la génération");
  assert.match(fonction("ouvrirATouteLaClasse"), /const relu = await relireBornee\(classeId\);/);
  // Le banc simple : la relecture pendante.
  const r = banc({delai: 60});
  r.serveur.relecture("attente");
  r.f.ouvrirRegler("splat");
  cocher(caseNumero(r.corps(), "mondes", 4), true);
  const debut = Date.now();
  await r.f.enregistrerRegler();
  assert.ok(Date.now() - debut < 1000, "borné");
  assert.deepEqual(r.serveur.etat.classe.reglages, {splat: {mondes: [1, 2, 4, 5]}}, "écrit");
  assert.equal(r.f.etat().reglageEnCours, false, "libérée");
  assert.ok(r.corps().tous(n => n.tag === "input").every(c => !c.disabled));
  assert.deepEqual(["regler-enregistrer", "regler-annuler", "regler-croix"].map(id => r.$(id).disabled), [false, false, false]);
  assert.equal(r.boite().open, true, "la fenêtre reste : rien n'a été vérifié");
  assert.equal(caseNumero(r.corps(), "mondes", 4).checked, true, "pas redessinée sur des données non relues : le brouillon tel quel");
  assert.deepEqual(message(r), ["Enregistré : la 405. La vérification n’a pas pu se faire : recharge la page pour voir l’état.", "message erreur", false]);
  r.f.annuler();
  assert.equal(r.boite().open, false, "Annuler ferme");
  // Le vrai ouvrirClasse, le vrai fetch : le tableau retenu, puis le délai le coupe (le signal arrive au fetch).
  const v = reel({delai: 200});
  v.serveur.tenir(true);
  v.f.ouvrirRegler("splat");
  cocher(caseDe(ligneDe(v, 3), "Lucas D."), false);
  const fin = v.f.enregistrerRegler();
  await tic();
  v.serveur.lacher();          // eleves.acces répond ; le tableau, lui, reste retenu
  await laisser();
  assert.deepEqual(v.serveur.etat.eleves.find(e => e.id === 16).ajouts, {}, "écrit");
  assert.equal(await finiAvant(fin, 100), false, "à 100 ms, la relecture est pendante : la fenêtre attend encore");
  assert.equal(v.f.etat().reglageEnCours, true);
  assert.equal(await finiAvant(fin, 400), true, "à 300 ms, le délai (200 ms) a tranché");
  const tableau = fetchDe(v, "tableau");
  assert.equal(tableau.length, 1);
  assert.ok(tableau[0].signal instanceof AbortSignal && tableau[0].signal.aborted, "le tableau a reçu le signal, et il a été coupé");
  assert.equal(v.f.etat().reglageEnCours, false);
  assert.deepEqual(message(v), ["Enregistré : Lucas D. La vérification n’a pas pu se faire : recharge la page pour voir l’état.", "message erreur", false]);
  assert.deepEqual(v.f.etat().eleves.find(e => e.id === 16).ajouts, {splat: {mondes: [3]}}, "la page garde l'ancien état (rien de relu) — son prochain « avant » est périmé, le serveur tranchera");
  // Le moteur qui ne finit pas de se charger est coupé aussi.
  const m = reel({delai: 60, appli: "coffres"});
  m.serveur.moteurLent(true);
  m.f.ouvrirRegler("coffres");
  cocher(caseDe(m.corps(), "Alice"), true);
  assert.equal(await finiAvant(m.f.enregistrerRegler(), 1000), true, "le moteur lent ne bloque pas");
  assert.match(m.$("regler-message").textContent, /La vérification n’a pas pu se faire/);
  // Le raccourci, relecture pendante.
  const c = banc({appli: "coffres", delai: 60});
  c.serveur.relecture("attente");
  assert.equal(await finiAvant(c.f.ouvrirATouteLaClasse(), 1000), true);
  assert.deepEqual(c.serveur.etat.classe.applis, ["defi-tables", "splat", "coffres"]);
  assert.deepEqual(message(c, "message-appli"), ["Coffres magiques ouvert à toute la 405. La vérification n’a pas pu se faire : recharge la page pour voir l’état.", "message erreur", false]);
  assert.equal(c.f.etat().reglageEnCours, false);
  // La relecture arrivée tard ne rend plus le verrou d'un enregistrement neuf.
  const t = banc({delai: 60});
  t.serveur.relecture("attente");
  t.f.ouvrirRegler("splat");
  cocher(caseNumero(t.corps(), "mondes", 4), true);
  await t.f.enregistrerRegler();
  t.serveur.relecture("ok");
  t.serveur.tenir(true);
  cocher(caseNumero(t.corps(), "mondes", 6), true);
  const second = t.f.enregistrerRegler();
  await tic();
  t.serveur.lacherRelecture(true);   // la première relecture, enfin
  await laisser();
  assert.equal(t.f.etat().reglageEnCours, true, "l'enregistrement en cours garde son verrou");
  t.serveur.lacher();
  await second;
  // Le second envoi partait avec un « avant » périmé (rien n'avait été relu) :
  // le serveur a refusé, la fenêtre est relue — le 4 (écrit la première fois)
  // est là, le 6 reste à refaire. Le refus a protégé.
  assert.equal(t.boite().open, true);
  assert.equal(t.$("regler-message").textContent, "La 405 a été changée ailleurs : la fenêtre montre l’état actuel, refais ton réglage.");
  assert.deepEqual([4, 6].map(n => caseNumero(t.corps(), "mondes", n).checked), [true, false]);
  t.serveur.tenir(false);
  cocher(caseNumero(t.corps(), "mondes", 6), true);
  await t.f.enregistrerRegler();
  assert.equal(t.boite().open, false);
  assert.deepEqual(t.serveur.etat.classe.reglages, {splat: {mondes: [1, 2, 4, 5, 6]}});
});

test("relecture en échec (point 5) — la relecture refusée n'est pas prise pour réussie : la fenêtre reste, rien n'est redessiné sur l'ancien ; le contenu d'un 409 d'élève est appliqué", async () => {
  // Le banc simple : eleves.acces passe, la relecture tombe en panne.
  const r = banc();
  r.serveur.relecture("panne");
  r.f.ouvrirRegler("splat");
  cocher(caseDe(ligneDe(r, 3), "Lucas D."), false);
  await r.f.enregistrerRegler();
  assert.deepEqual(r.serveur.etat.eleves.find(e => e.id === 16).ajouts, {}, "écrit");
  assert.equal(r.boite().open, true, "la fenêtre ne se ferme pas sur une relecture en panne");
  assert.equal(r.$("message-appli").textContent, "", "pas de « réglages enregistrés » triomphant");
  assert.deepEqual(message(r), ["Enregistré : Lucas D. La vérification n’a pas pu se faire : recharge la page pour voir l’état.", "message erreur", false]);
  assert.equal(caseDe(ligneDe(r, 3), "Lucas D.").checked, false, "le brouillon tel quel, pas un « actuel » reconstruit sur l'ancien");
  // Le vrai ouvrirClasse : le tableau répond 500.
  const v = reel();
  v.serveur.panne("tableau", v.serveur.erreur("Panne tableau.", 500));
  v.f.ouvrirRegler("splat");
  cocher(caseDe(ligneDe(v, 3), "Lucas D."), false);
  await v.f.enregistrerRegler();
  assert.deepEqual(v.journal, ["surErreur message-classes 500"], "ouvrirClasse dit sa panne, et rend faux");
  assert.equal(v.boite().open, true);
  assert.equal(v.$("message-appli").textContent, "");
  assert.match(v.$("regler-message").textContent, /^Enregistré : Lucas D\. La vérification n’a pas pu se faire/);
  assert.equal(v.f.etat().reglageEnCours, false);
  // Un 409 pour Inès, puis la relecture en panne : l'état vrai d'Inès vient du 409 ; le prochain « avant » est juste.
  const c = banc();
  c.serveur.relecture("panne");
  c.f.ouvrirRegler("splat");
  cocher(caseDe(ligneDe(c, 3), "Inès"), true);
  c.serveur.ecrireAilleurs(30, {coffres: {}});
  await c.f.enregistrerRegler();
  assert.deepEqual(c.f.etat().eleves.find(e => e.id === 30).ajouts, {coffres: {}}, "le contenu du 409 est posé sur Inès");
  assert.deepEqual(c.f.etat().eleves.find(e => e.id === 30).acces.applis, ["defi-tables", "splat", "coffres"]);
  assert.deepEqual(message(c), ["Pas enregistré pour Inès : un autre onglet l’a changé entre-temps. La vérification n’a pas pu se faire : recharge la page pour voir l’état.", "message erreur", false]);
  c.serveur.relecture("ok");
  await c.f.enregistrerRegler();
  assert.deepEqual(acces(c).at(-1).corps, {eleve_id: 30, avant: {coffres: {}}, ajouts: {coffres: {}, splat: {mondes: [3]}}}, "« avant » = ce que le 409 a dit : accepté");
  assert.equal(c.boite().open, false);
  // Un 409 de la classe, puis la relecture en panne : l'état vrai de la classe vient du 409.
  const k = banc();
  k.serveur.relecture("panne");
  k.f.ouvrirRegler("splat");
  cocher(caseNumero(k.corps(), "mondes", 4), true);
  k.serveur.changerLaClasseAilleurs({reglages: {splat: {mondes: [1, 2]}}});
  await k.f.enregistrerRegler();
  assert.deepEqual(k.f.etat().classe.reglages, {splat: {mondes: [1, 2]}}, "posé depuis le 409");
  assert.deepEqual(message(k), ["La 405 a été changée ailleurs : rien n’est enregistré. La vérification n’a pas pu se faire : recharge la page pour voir l’état.", "message erreur", false]);
  assert.equal(caseNumero(k.corps(), "mondes", 4).checked, true, "pas redessinée");
});

test("réponse perdue (point 6) — le serveur a écrit, la réponse s'est perdue : relu, c'est « enregistré » ; pas relu, c'est « peut-être » — jamais « pas enregistré » à tort", async () => {
  for (const mode of ["simple", "reel"]) {
    const faire = o => (mode === "reel" ? reel(o) : banc(o));
    // Un élève.
    const r = faire();
    r.serveur.perdre("eleves.acces");
    r.f.ouvrirRegler("splat");
    cocher(caseDe(ligneDe(r, 3), "Alice G."), true);
    await r.f.enregistrerRegler();
    assert.deepEqual(r.serveur.etat.eleves.find(e => e.id === 1).ajouts, {splat: {mondes: [3]}}, `${mode} : le serveur a écrit`);
    assert.equal(r.boite().open, false, `${mode} : relu et en place — la fenêtre se ferme`);
    assert.deepEqual(message(r, "message-appli"), ["SPLAT! : réglages enregistrés (Alice G.).", "message ok", false], `${mode}`);
    // La classe.
    const c = faire();
    c.serveur.perdre("classes.modifier");
    c.f.ouvrirRegler("splat");
    cocher(caseNumero(c.corps(), "mondes", 4), true);
    cocher(caseDe(ligneDe(c, 6), "Inès"), true);
    await c.f.enregistrerRegler();
    assert.deepEqual(c.serveur.appels.map(a => a.action).filter(a => a !== "tableau"), ["classes.modifier"], `${mode} : sans réponse pour la classe, les élèves ne partent pas (le brouillon forme un tout)`);
    assert.equal(c.boite().open, true);
    assert.equal(caseNumero(c.corps(), "mondes", 4).checked, true, `${mode} : relue : le 4 est bien ouvert`);
    assert.deepEqual(message(c), ["Enregistré : la 405. Pas enregistré pour Inès : la 405 n’avait pas répondu. La fenêtre montre ce qui est enregistré maintenant : refais ce qui manque.", "message erreur", false], `${mode} : la classe est confirmée, Inès reste à refaire`);
    cocher(caseDe(ligneDe(c, 6), "Inès"), true);
    await c.f.enregistrerRegler();
    assert.equal(c.boite().open, false);
    assert.deepEqual(c.serveur.etat.eleves.find(e => e.id === 30).ajouts, {splat: {mondes: [6]}});
  }
  // Perdue ET pas relue : « peut-être ».
  const p = banc();
  p.serveur.perdre("eleves.acces");
  p.serveur.relecture("panne");
  p.f.ouvrirRegler("splat");
  cocher(caseDe(ligneDe(p, 3), "Alice G."), true);
  await p.f.enregistrerRegler();
  assert.deepEqual(message(p), ["Peut-être enregistré pour Alice G. (le serveur n’a pas répondu). La vérification n’a pas pu se faire : recharge la page pour voir l’état.", "message erreur", false]);
  const q = banc();
  q.serveur.perdre("classes.modifier");
  q.serveur.relecture("panne");
  q.f.ouvrirRegler("splat");
  cocher(caseNumero(q.corps(), "mondes", 4), true);
  await q.f.enregistrerRegler();
  assert.deepEqual(message(q), ["Peut-être enregistré pour la 405 (le serveur n’a pas répondu). La vérification n’a pas pu se faire : recharge la page pour voir l’état.", "message erreur", false]);
  // Pas écrit du tout (muet) et relu : « pas enregistré » — vrai, celui-là (le test « ne répond jamais » le joue aussi).
  const m = banc({delai: 30});
  m.serveur.muet(true);
  m.f.ouvrirRegler("splat");
  cocher(caseNumero(m.corps(), "mondes", 4), true);
  await m.f.enregistrerRegler();
  assert.deepEqual(message(m), ["Pas enregistré pour la 405 : Le serveur ne répond pas. La fenêtre montre ce qui est enregistré maintenant : refais ce qui manque.", "message erreur", false]);
  // Un refus certain reste « rien d'enregistré », même si l'état relu ressemble par hasard.
  const n = banc();
  n.serveur.panne("classes.modifier", n.serveur.erreur("Le serveur a eu un souci.", 500));
  n.f.ouvrirRegler("splat");
  cocher(caseNumero(n.corps(), "mondes", 4), true);
  n.serveur.changerLaClasseAilleurs({reglages: {splat: {mondes: [1, 2, 4, 5]}}});
  await n.f.enregistrerRegler();
  assert.match(n.$("regler-message").textContent, /^Rien d’enregistré pour la 405 : Le serveur a eu un souci\./);
  // Le raccourci : la réponse perdue, relue → ouvert ; pas relue → peut-être.
  const s = banc({appli: "coffres"});
  s.serveur.perdre("classes.modifier");
  await s.f.ouvrirATouteLaClasse();
  assert.deepEqual(message(s, "message-appli"), ["Coffres magiques ouvert à toute la 405 : la tuile apparaît dans l’espace des élèves.", "message ok", false]);
  const u = banc({appli: "coffres"});
  u.serveur.perdre("classes.modifier");
  u.serveur.relecture("panne");
  await u.f.ouvrirATouteLaClasse();
  assert.deepEqual(message(u, "message-appli"), ["Coffres magiques : peut-être ouvert à la 405 (le serveur n’a pas répondu). La vérification n’a pas pu se faire : recharge la page pour voir l’état.", "message erreur", false]);
  const w = reel({appli: "coffres", delai: 30});
  w.serveur.muet(true);
  await w.f.ouvrirATouteLaClasse();
  assert.deepEqual(message(w, "message-appli"), ["Coffres magiques : peut-être ouvert à la 405 (le serveur n’a pas répondu). La vérification n’a pas pu se faire : recharge la page pour voir l’état.", "message erreur", false], "muet : l'écriture ET la relecture sans réponse");
  assert.match(fonction("ajoutsCanoniques"), /\.sort\(\)/);
  const memes = new Function(`${fonction("ajoutsCanoniques")}\n${fonction("memesAjouts")}\nreturn memesAjouts;`)();
  assert.ok(memes({splat: {mondes: [3, 1]}, coffres: {}}, {coffres: {}, splat: {mondes: [1, 3, 3]}}));
  assert.ok(!memes({splat: {mondes: [3]}}, {splat: {}}), "un monde n'est pas l'appli entière");
  assert.ok(memes({splat: {mondes: []}}, {}), "une liste vide ne compte pas");
});

test("nettoyage (point 7) — « Ouvrir à toute la 405 » et « Régler SPLAT! » sont vidés à la déconnexion et quand la classe part : plus aucun texte dans les zones", () => {
  const constantes = ["ZONES_TEXTE", "ZONES_MESSAGE", "CHAMPS_A_VIDER", "BLOCS_A_CACHER", "ZONES_HORS_CLASSE", "ZONES_DE_LA_CLASSE", "MESSAGES_DE_LA_CLASSE"].map(constante).join("\n");
  const r = banc({appli: "coffres"});
  r.f.poserQuiVoit();
  assert.equal(r.$("af-toute").textContent, "Ouvrir à toute la 405");
  r.f.poser({appli: "splat"});
  r.f.poserQuiVoit();
  assert.equal(r.$("regler-appli-mot").textContent, "Régler SPLAT!");
  const outils = new Function("$", "quitterImpressions", `${constantes}\n${fonction("viderZones")}\n${fonction("viderLaClasse")}\nreturn {viderZones, viderLaClasse, ZONES_TEXTE, ZONES_DE_LA_CLASSE};`)(r.$, () => {});
  for (const id of ["af-toute", "regler-appli-mot"]) {
    assert.ok(outils.ZONES_TEXTE.includes(id), `${id} dans ZONES_TEXTE`);
    assert.ok(outils.ZONES_DE_LA_CLASSE.includes(id), `${id} vidé aussi quand la classe part`);
  }
  // Tout ce que la page a pu écrire, puis le nettoyage : plus rien.
  outils.ZONES_TEXTE.forEach(id => { r.$(id).textContent = `texte de ${id}`; });
  outils.viderLaClasse();
  const restes = outils.ZONES_DE_LA_CLASSE.filter(id => r.$(id).textContent !== "");
  assert.deepEqual(restes, [], "viderLaClasse : les zones de la classe sont vides");
  assert.equal(r.$("af-toute").textContent, "");
  assert.equal(r.$("regler-appli-mot").textContent, "");
  outils.ZONES_TEXTE.forEach(id => { r.$(id).textContent = `texte de ${id}`; });
  outils.viderZones();
  assert.deepEqual(outils.ZONES_TEXTE.filter(id => r.$(id).textContent !== ""), [], "viderZones : tout est vide");
});

test("le signal arrive au vrai fetch (point 8) — la vraie api() borne l'écriture ET la relecture ; sans signal transmis, ce test rougit", {timeout: 5000}, async () => {
  assert.match(fonction("api"), /signal: options\.signal/);
  const r = reel({delai: 40});
  r.serveur.muet(true);
  r.f.ouvrirRegler("splat");
  cocher(caseDe(ligneDe(r, 4), "Inès"), true);
  const debut = Date.now();
  assert.equal(await finiAvant(r.f.enregistrerRegler(), 2000), true, "fini : l'écriture puis la relecture sont bornées");
  assert.ok(Date.now() - debut < 1000);
  const envois = r.serveur.appelsFetch;
  assert.deepEqual(envois.map(a => a.action), ["eleves.acces", "tableau"]);
  for (const envoi of envois) {
    assert.ok(envoi.signal instanceof AbortSignal, `${envoi.action} : fetch a reçu un AbortSignal`);
    assert.equal(envoi.signal.aborted, true, `${envoi.action} : coupé par la garde`);
    assert.equal(envoi.url, "../api/prof.php");
    assert.equal(envoi.corps.jeton, "jeton-1", "le jeton voyage dans le corps");
    assert.equal(envoi.entetes.Authorization, "Bearer jeton-1");
  }
  assert.equal(r.f.etat().reglageEnCours, false);
  assert.deepEqual(message(r), ["Peut-être enregistré pour Inès (le serveur n’a pas répondu). La vérification n’a pas pu se faire : recharge la page pour voir l’état.", "message erreur", false]);
  // Et un 409 d'élève de bout en bout (le JSON du refus lu par la vraie api).
  const c = reel();
  c.f.ouvrirRegler("splat");
  cocher(caseDe(ligneDe(c, 3), "Inès"), true);
  c.serveur.ecrireAilleurs(30, {coffres: {}});
  await c.f.enregistrerRegler();
  assert.equal(c.boite().open, true);
  assert.deepEqual(c.serveur.etat.eleves.find(e => e.id === 30).ajouts, {coffres: {}}, "rien d'écrasé");
  assert.deepEqual(message(c), ["Pas enregistré pour Inès : un autre onglet l’a changé entre-temps. La fenêtre montre ce qui est enregistré maintenant : refais ce qui manque.", "message erreur", false]);
  assert.equal(caseDe(ligneDe(c, 3), "Inès").checked, false, "relue par le vrai ouvrirClasse");
  cocher(caseDe(ligneDe(c, 3), "Inès"), true);
  await c.f.enregistrerRegler();
  assert.equal(c.boite().open, false);
  assert.deepEqual(c.serveur.etat.eleves.find(e => e.id === 30).ajouts, {coffres: {}, splat: {mondes: [3]}});
  // Le raccourci, de bout en bout : avant, la relecture, le mot.
  const s = reel({appli: "coffres"});
  await s.f.ouvrirATouteLaClasse();
  assert.deepEqual(s.serveur.appelsFetch.map(a => a.action), ["classes.modifier", "tableau"]);
  assert.deepEqual(s.serveur.appelsFetch[0].corps.avant, {applis: ["defi-tables", "splat"]});
  assert.deepEqual(s.f.etat().classe.applis, ["defi-tables", "splat", "coffres"], "la page a relu la classe");
  assert.equal(s.$("message-appli").textContent, "Coffres magiques ouvert à toute la 405 : la tuile apparaît dans l’espace des élèves.");
});

// ------------------------------------------------------------ ajoutsApres : l'état complet, jamais « [] »

const ajoutsApresRejoue = () => new Function(`${constante("LISTES_PAR_ELEVE")}\n${fonction("ajoutsApres")}\nreturn ajoutsApres;`)();

test("qui voit quoi — ce que la fenêtre envoie : tout l'état, une appli entière = {} ; un retrait SUPPRIME la clé, jamais [] ni {} à la place", () => {
  const apres = ajoutsApresRejoue();
  const cas = [
    [{}, {cle: "coffres", ouvre: true}, {coffres: {}}],
    [{coffres: {}}, {cle: "coffres", ouvre: false}, {}],
    [{splat: {mondes: [3]}}, {cle: "coffres", ouvre: true}, {splat: {mondes: [3]}, coffres: {}}],
    [{splat: {mondes: [3]}}, {cle: "splat", liste: "mondes", numero: 4, ouvre: true}, {splat: {mondes: [3, 4]}}],
    [{}, {cle: "splat", liste: "mondes", numero: 5, ouvre: true}, {splat: {mondes: [5]}}],
    // LE piège du lot 2 : vider la liste ne doit pas laisser {"splat": {}} (= SPLAT! entière) ni {"splat": {"mondes": []}}.
    [{splat: {mondes: [3]}}, {cle: "splat", liste: "mondes", numero: 3, ouvre: false}, {}],
    [{coffres: {niveaux: [2]}, splat: {mondes: [3]}}, {cle: "coffres", liste: "niveaux", numero: 2, ouvre: false}, {splat: {mondes: [3]}}],
    [{coffres: {niveaux: [2], operations: [3]}}, {cle: "coffres", liste: "niveaux", numero: 2, ouvre: false}, {coffres: {operations: [3]}}],
    // Une appli donnée entière, puis un numéro décoché : « tout, sauf lui ».
    [{splat: {}}, {cle: "splat", liste: "mondes", numero: 6, ouvre: false}, {splat: {mondes: [1, 2, 3, 4, 5]}}],
    [{coffres: {}}, {cle: "coffres", liste: "niveaux", numero: 3, ouvre: false}, {coffres: {niveaux: [1, 2], operations: [1, 2, 3, 4]}}],
    // Une valeur illisible n'est ni recopiée ni changée en « appli entière ».
    [{splat: {mondes: "3"}, coffres: []}, {cle: "defi-tables", ouvre: true}, {"defi-tables": {}}],
    [null, {cle: "splat", liste: "mondes", numero: 3, ouvre: true}, {splat: {mondes: [3]}}],
  ];
  for (const [avant, geste, attendu] of cas) {
    const copie = JSON.stringify(avant);
    assert.deepEqual(apres(avant, geste), attendu, `${copie} + ${JSON.stringify(geste)}`);
    assert.equal(JSON.stringify(avant), copie, "l'état d'avant n'est pas touché (il sert si le serveur refuse)");
  }
});

test("qui voit quoi — 2 000 suites de clics au hasard : jamais « [] », jamais une liste vide, jamais {} sauf une appli ouverte entière", () => {
  const apres = ajoutsApresRejoue();
  let graine = 7;
  // Lot 3b (relecture Codex) : les bits BAS de ce générateur tournent en rond
  // (graine % n donnait 15 921 ouvertures pour 79 retraits) — on prend les bits hauts.
  const hasard = n => { graine = (graine * 1103515245 + 12345) % 2147483648; return Math.floor(graine / 65536) % n; };
  const compte = {ouvertures: 0, retraits: 0, retraitsEffectifs: 0, dernierRetire: 0};
  const LISTES = {coffres: {niveaux: 3, operations: 4}, splat: {mondes: 6}};
  for (let essai = 0; essai < 2000; essai += 1) {
    let etat = {};
    const entieres = new Set();
    for (let clic = 0; clic < 8; clic += 1) {
      const cle = ["defi-tables", "coffres", "splat"][hasard(3)];
      const listes = Object.keys(LISTES[cle] || {});
      let geste;
      if (!listes.length || hasard(3) === 0) {
        geste = {cle, ouvre: hasard(2) === 0};
        if (geste.ouvre) entieres.add(cle); else entieres.delete(cle);
      } else {
        const liste = listes[hasard(listes.length)];
        const presents = (etat[cle] && etat[cle][liste]) || [];
        // Un retrait sur deux vise un numéro PRÉSENT (souvent le dernier de sa liste).
        const ouvre = hasard(2) === 0;
        const numero = !ouvre && presents.length && hasard(2) === 0 ? presents[hasard(presents.length)] : 1 + hasard(LISTES[cle][liste]);
        geste = {cle, liste, numero, ouvre};
        entieres.delete(cle);
      }
      const avant = JSON.stringify(etat);
      etat = apres(etat, geste);
      if (geste.ouvre) compte.ouvertures += 1;
      else {
        compte.retraits += 1;
        if (JSON.stringify(etat) !== avant) compte.retraitsEffectifs += 1;
        if (geste.liste && avant.includes(`"${geste.liste}":[${geste.numero}]`)) compte.dernierRetire += 1;
      }
      const texte = JSON.stringify(etat);
      assert.doesNotMatch(texte, /\[\]/, texte);
      for (const [une, ajout] of Object.entries(etat)) {
        assert.ok(ajout && typeof ajout === "object" && !Array.isArray(ajout), texte);
        if (!Object.keys(ajout).length) assert.ok(entieres.has(une), `{} seulement pour une appli ouverte entière : ${texte} après ${JSON.stringify(geste)}`);
        Object.values(ajout).forEach(numeros => assert.ok(Array.isArray(numeros) && numeros.length, texte));
      }
    }
  }
  // La couverture, mesurée : autant de retraits que d'ouvertures, des milliers qui changent
  // vraiment l'état, et des centaines qui retirent le DERNIER numéro d'une liste (le piège).
  assert.ok(compte.retraits > 0.4 * (compte.ouvertures + compte.retraits), JSON.stringify(compte));
  assert.ok(compte.retraitsEffectifs > 2000, JSON.stringify(compte));
  assert.ok(compte.dernierRetire > 300, JSON.stringify(compte));
});

