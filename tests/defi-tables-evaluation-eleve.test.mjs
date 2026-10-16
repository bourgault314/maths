// Lot E2 « les évaluations en classe » (15/10/2026) — l'appli de l'élève.
//
// Ce que ces tests tiennent :
//  - la page : le bloc [evaluation], ses branches dans next() / updateTimer() /
//    renderQuestion(), la carte, le cache-buster du moteur, pas de hasard ;
//  - le moteur : retenirErreurs ;
//  - en marche (faux monde) : la veille, « Je commence », la série tirée avec
//    les graines du serveur, chaque réponse appliquée au parcours comme Mon
//    mélange puis envoyée AVANT la suivante, la reprise après un onglet fermé,
//    les fins (fini, fermée, fenêtre passée, « Faire repasser »), le score.
//
// Sabotages attendus (chacun rend un test rouge) :
//  a) tirer les questions autrement (Math.random, generateQuestions) ;
//  b) retirer appliquerReponse ou retenirErreurs de appliquerReponseEvaluation ;
//  c) avancer à la question suivante sans attendre la réponse du serveur ;
//  d) appeler appliquerSerie à la fin ;
//  e) ne plus bumper le ?v= de mon_parcours.js.
//
// Lot E3b (16/10/2026, décisions de Gwenaël) — « À retenir » pendant
// l'évaluation. Sabotages attendus :
//  f) le filtre retiré (les réponses des ratés de l'évaluation affichées
//     pendant qu'elle est ouverte) ;
//  g) le filtre qui ne retombe pas à la fermeture ;
//  h) « À retenir » montré avant qu'il ait fini son passage ;
//  i) « À retenir » montré avant la première réponse du serveur ;
//  j) l'accueil pas redessiné après la première réponse (« À retenir »
//     resterait caché) ;
//  k) l'ancien libellé « À revoir ».

import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {PARCOURS, CORE, html, entre, fauxStockage, demarrerAppli, sansPrenom, parcoursAvecTravail} from "./defi-tables-faux-monde.mjs";

const BLOC = entre("// [evaluation:debut]", "// [evaluation:fin]");
const source = nom => {
  const debut = html.indexOf(`function ${nom}(`);
  assert.ok(debut > 0, `la page doit définir ${nom}`);
  const fin = html.indexOf("\n      }\n", debut);
  return html.slice(debut, fin);
};

// ------------------------------------------------------------------ la page

test("la page : le bloc de l'évaluation, sans hasard, sans innerHTML, sans appliquerSerie", () => {
  assert.ok(BLOC.length > 2000, "le bloc existe");
  assert.doesNotMatch(BLOC, /Math\.random|generateQuestions\(/, "a) jamais un autre tirage que celui des graines");
  assert.match(BLOC, /CORE\.genererEvaluationDeClasse\(etat\.modele, etat\.graines\)/, "le même tirage que Ma classe");
  assert.match(BLOC, /CORE\.corrigerEvaluationDeClasse\(questionsDeLEvaluation\(etat\), etat\.reponses\)/, "le score sur ses propres réponses relues");
  assert.doesNotMatch(BLOC, /innerHTML/, "tout vient du serveur : textContent seulement");
  assert.doesNotMatch(BLOC, /appliquerSerie/, "d) pas une série du parcours");
  assert.match(BLOC, /PARCOURS\.appliquerReponse\(parcours, question\.factKey, \{correcte\}\)/, "b) chaque réponse comme Mon mélange");
  assert.match(BLOC, /if \(!correcte\) \{[\s\S]*?PARCOURS\.retenirErreurs\(parcours, \[\[premier, second\]\]\)/, "b) les ratés dans « À retenir »");
  assert.match(BLOC, /appliquerReponseEvaluation\(question, correct\);\s*envoyerReponseEvaluation\(\{numero: question\.numero, reponse: valeur === null \? "" : String\(Number\(valeur\)\), dixiemes\}\);/, "appliquée, puis envoyée");
  // c) La suivante n'arrive qu'avec la réponse du serveur (« suivant »).
  assert.match(BLOC, /state\.index = Math\.min\(state\.questions\.length - 1, etat\.suivant - 1\);\s*state\.answer = "";\s*renderQuestionEvaluation\(\);/, "c) la question suivante est celle que le serveur attend");
  assert.doesNotMatch(source("repondreEvaluation"), /state\.index \+= 1|renderQuestion/, "c) répondre n'avance pas tout seul");
  // Le serveur dit tout : fermée, fini, close, refusée → l'accueil.
  assert.match(BLOC, /if \(!etat \|\| etat\.etat !== "ouverte" \|\| !etat\.commence \|\| etat\.fini \|\| etat\.close \|\| donnees\.enregistree === false\) \{\s*terminerEvaluation\(\);/);
  assert.match(BLOC, /if \(reponse\.statut === 409 \|\| reponse\.statut === 404\) \{[\s\S]*?terminerEvaluation\(\);/, "« Faire repasser » (409) ramène à l'accueil");
  // Sans code : rien.
  assert.match(BLOC, /function evaluationPossible\(\) \{\s*return suiviActif\(\) && !sync\.detache;\s*\}/);
});

test("la page : les branches — next(), updateTimer(), renderQuestion(), majSortieJeu() ; la carte dans l'accueil ; le CSS", () => {
  assert.match(source("next"), /if \(!state\.running\) return;\s*(\/\/[^\n]*\s*)*if \(enEvaluation\(\)\) \{ nextEvaluation\(skip\); return; \}/, "next() : la branche avant toute correction");
  assert.match(source("updateTimer"), /if \(enEvaluation\(\)\) \{ updateTimerEvaluation\(\); return; \}/);
  assert.match(source("renderQuestion"), /\} else if \(enEvaluation\(\)\) \{\s*\$\("question-count"\)\.textContent = `📝 Évaluation · \$\{state\.index \+ 1\} \/ \$\{TOTAL\}`;/);
  assert.match(source("majSortieJeu"), /bouton\.hidden = enEvaluation\(\);/, "pas de retour pendant");
  assert.match(source("reprendreAuRetour"), /if \(state\.running && enEvaluation\(\) && state\.timer === null\)/, "le chrono repart au retour de la page");
  assert.match(source("renderAccueil"), /renderCarteEvaluation\(\);/);
  assert.match(source("demarrerSuivi"), /veillerEvaluation\(\);/, "la veille part avec le suivi");
  // Les trois chronos.
  assert.match(BLOC, /duration: modele\.chrono === "global" \? modele\.secondes : null,/);
  assert.match(BLOC, /\$\("skip"\)\.hidden = modele\.chrono === "question";/, "par question : pas de « Passer »");
  assert.match(BLOC, /if \(!restant\) repondreEvaluation\(null\);/, "à zéro, une réponse vide part");
  assert.match(BLOC, /state\.endAt = DURATION === null \? 0 : state\.startAt \+ Math\.max\(0, DURATION - etat\.ecoule\) \* 1000;/, "en tout : le temps écoulé que dit le serveur");
  // La carte et la ligne.
  for (const texte of ["Ton professeur a ouvert une évaluation", "Ton évaluation est commencée", "Je commence", "Je continue", "📝 Évaluation ${etat.fini ? \"envoyée ✓\" : \"terminée\"}"]) {
    assert.ok(BLOC.includes(texte), `la carte dit « ${texte} »`);
  }
  assert.match(html, /\.evalc \{ order: -3;/, "en tête de l'accueil");
  assert.match(html, /\.evalc-ligne\.is-close \{/, "la ligne grise");
  assert.match(html, /#play \.status strong\.anneau \{/, "l'anneau du chrono par question");
  assert.match(html, /\.acc\.en-decouverte > :not\(\.matable\):not\(\.acc-bas\):not\(#acc-notice\):not\(\.evalc\):not\(\.evalc-ligne\) \{ display: none; \}/, "visible même sur l'écran de bienvenue");
});

test("e) le moteur a changé : nouveau numéro de cache, copie serveur identique", async () => {
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261016-1/);
  const moteur = await readFile(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url), "utf8");
  const copie = await readFile(new URL("../_serveur/public/prof/defi_tables_mon_parcours.js", import.meta.url), "utf8");
  assert.equal(moteur, copie);
  assert.match(moteur, /function retenirErreurs\(parcours, paires, date\)/);
});

// ----------------------------------------------------------------- le moteur

test("retenirErreurs : les paires rejoignent la liste du jour, une fois chacune ; rien d'autre ne bouge", () => {
  let p = PARCOURS.normaliserParcours({});
  const avant = JSON.stringify(p);
  const apres = PARCOURS.retenirErreurs(p, [[4, 7], [7, 4], [3, 6], ["x", 2]], "2026-10-15");
  assert.deepEqual(PARCOURS.aRetenir(apres, "2026-10-15"), [[4, 7], [3, 6]]);
  assert.deepEqual(PARCOURS.aRetenir(apres, "2026-10-16"), [], "un autre jour : rien");
  assert.equal(JSON.stringify(p), avant, "le parcours d'origine n'est pas touché");
  assert.deepEqual({...apres, retenir: null}, {...p, retenir: null}, "seule la liste a changé");
  const encore = PARCOURS.retenirErreurs(apres, [[4, 7], [2, 9]], "2026-10-15");
  assert.deepEqual(PARCOURS.aRetenir(encore, "2026-10-15"), [[4, 7], [3, 6], [2, 9]]);
});

// ------------------------------------------------- en marche (faux monde)

const CODE = "AXKQ7T";
const MODELE = {tables: [3, 4, 6], types: ["direct", "missing", "division"], n: 20, chrono: "sans", secondes: null, tirage: "memes", exclus: [], imposes: []};

// Un faux serveur de suivi qui tient aussi l'évaluation (api/direct.php) :
// l'état de la classe, « Je commence » (graines tirées ici), les réponses
// (la suivante seulement), « fini » à la vingtième.
function serveurAvecEvaluation({modele = MODELE, ouverte = true, progression = null} = {}) {
  const appels = [];
  const reponse = (status, donnees) => ({status, json: async () => donnees, headers: {get: () => null}});
  const etat = {ouverte, commence: false, fini: false, close: false, graines: null, reponses: {}, debut: 0, forcer: null, enregistree: true};
  const vue = () => etat.ouverte === null ? null : {
    etat: etat.ouverte ? "ouverte" : "fermee", nom: "Tables 3, 4 et 6", modele,
    commence: etat.commence, fini: etat.fini, close: etat.close,
    suivant: etat.commence ? Math.min(modele.n, Object.keys(etat.reponses).length + 1) : null,
    graines: etat.graines, reponses: {...etat.reponses}, ecoule: etat.commence ? 30 : null
  };
  const fetch = (url, options) => {
    const corps = options && options.body ? JSON.parse(String(options.body)) : {};
    const chemin = url.split("/").pop();
    appels.push({chemin, corps});
    if (chemin === "direct.php") {
      if (etat.forcer) return Promise.resolve(reponse(etat.forcer.statut, etat.forcer.donnees || {ok: false}));
      if (corps.commencer === true) {
        if (!etat.ouverte) return Promise.resolve(reponse(409, {ok: false, erreur: "L'évaluation est fermée."}));
        if (!etat.commence) { etat.commence = true; etat.graines = {seance: 123456, eleve: 654321}; }
        return Promise.resolve(reponse(200, {ok: true, direct: null, evaluation: vue(), rythme: 6000}));
      }
      if (corps.reponse !== undefined) {
        if (!etat.commence) return Promise.resolve(reponse(409, {ok: false, erreur: "Commence d'abord l'évaluation."}));
        const attendu = Object.keys(etat.reponses).length + 1;
        const prise = etat.enregistree && etat.ouverte && !etat.fini && !etat.close && corps.numero === attendu;
        if (prise) etat.reponses[String(corps.numero)] = `${corps.reponse}|${corps.dixiemes}`;
        if (Object.keys(etat.reponses).length >= modele.n) etat.fini = true;
        return Promise.resolve(reponse(200, {ok: true, direct: null, evaluation: vue(), enregistree: prise, rythme: 6000}));
      }
      return Promise.resolve(reponse(200, {ok: true, direct: null, evaluation: vue(), rythme: 6000}));
    }
    if (chemin === "eleve.php") return Promise.resolve(reponse(200, {ok: true, prenom: "Léa", classe: "405", reglages: {}}));
    if (corps.lire) return Promise.resolve(reponse(200, {ok: true, existe: Boolean(progression), parcours: progression, maj_le: null, revision: progression ? 1 : 0}));
    return Promise.resolve(reponse(200, {ok: true, maj_le: "2026-10-15", revision: (corps.base_revision || 0) + 1}));
  };
  return {fetch, appels, etat, direct: () => appels.filter(a => a.chemin === "direct.php").map(a => a.corps)};
}

async function appliEnEvaluation(options = {}) {
  const serveur = serveurAvecEvaluation(options);
  const appli = demarrerAppli({reseau: serveur, codeOnglet: CODE, local: fauxStockage()});
  appli.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  return {serveur, appli};
}

test("en marche : la veille lit l'évaluation à l'ouverture, par le code dans le corps ; l'accueil se redessine ; sans code, rien", async () => {
  const {serveur, appli} = await appliEnEvaluation();
  assert.deepEqual(serveur.direct(), [{code: CODE}], "une lecture, rien d'autre");
  assert.equal(appli.api.evalEtat.etat, "ouverte");
  assert.equal(appli.api.evalEtat.commence, false);
  assert.deepEqual(appli.api.evalEtat.modele, MODELE);
  assert.ok(appli.rendus.includes("accueil"));
  // Sans code : aucun appel.
  const sansCode = serveurAvecEvaluation();
  const a2 = demarrerAppli({reseau: sansCode, local: fauxStockage()});
  a2.api.demarrerSuivi();
  a2.api.veillerEvaluation();
  await a2.api.lireEvaluation();
  await new Promise(r => setTimeout(r, 5));
  assert.deepEqual(sansCode.direct(), [], "sans code, la veille ne demande rien");
  assert.equal(a2.api.evalEtat, null);
  a2.api.renderCarteEvaluation();
  assert.equal(a2.document.getElementById(".acc").enfants.length, 0, "et aucune carte");
  // Un état mal formé n'est pas gardé.
  assert.equal(appli.api.lireEtatEvaluation({etat: "ouverte", modele: {tables: [11]}}), null);
  assert.equal(appli.api.lireEtatEvaluation({etat: "bizarre", modele: MODELE}), null);
  assert.equal(appli.api.lireEtatEvaluation(null), null);
});

test("en marche : « Je commence » — la graine vient du serveur, la série est tirée avec, l'écran de question s'ouvre sans retour ni « Passer » (par question)", async () => {
  const {serveur, appli} = await appliEnEvaluation({modele: {...MODELE, chrono: "question", secondes: 8}});
  await appli.api.commencerEvaluation();
  await new Promise(r => setTimeout(r, 5));
  assert.deepEqual(serveur.direct().at(-1), {code: CODE, commencer: true});
  assert.equal(appli.api.enEvaluation(), true);
  assert.equal(appli.state.configuration.mode, "evalclasse");
  assert.equal(appli.state.configuration.duration, null, "par question : pas de chrono de série");
  assert.equal(appli.api.TOTAL, 20);
  assert.equal(appli.state.questions.length, 20);
  const attendues = CORE.genererEvaluationDeClasse(MODELE, {seance: 123456, eleve: 654321});
  assert.deepEqual(appli.state.questions.map(q => q.prompt), attendues.map(q => q.prompt), "a) exactement le tirage des graines");
  assert.equal(appli.state.index, 0);
  assert.equal(appli.state.running, true);
  assert.ok(appli.rendus.includes("show:play") && appli.rendus.includes("question:1"));
  assert.equal(appli.document.getElementById("skip").hidden, true, "pas de « Passer » par question");
  assert.ok(appli.document.getElementById("time").classes.has("anneau"));
});

test("en marche : chaque réponse est appliquée au parcours comme Mon mélange (boîtes, À retenir), puis envoyée ; la suivante n'arrive qu'avec la réponse du serveur", async () => {
  const {serveur, appli} = await appliEnEvaluation({progression: sansPrenom(parcoursAvecTravail("", 3))});
  await appli.api.commencerEvaluation();
  await new Promise(r => setTimeout(r, 5));
  const q1 = appli.state.questions[0];
  const q2 = appli.state.questions[1];
  // Bonne réponse à la 1 : envoyée, les boîtes bougent (jour travaillé), la 2 arrive.
  appli.api.repondreEvaluation(String(q1.answer));
  assert.equal(appli.state.waitingForContinue, true, "le pavé se tait pendant l'envoi");
  await new Promise(r => setTimeout(r, 5));
  const envoi1 = serveur.direct().at(-1);
  assert.equal(envoi1.numero, 1);
  assert.equal(envoi1.reponse, String(q1.answer));
  assert.ok(Number.isInteger(envoi1.dixiemes) && envoi1.dixiemes >= 0);
  assert.equal(appli.state.index, 1, "c) la 2 — celle que le serveur attend");
  assert.ok(appli.rendus.includes("question:2"));
  const fait1 = appli.api.parcours.calculs[PARCOURS.cleFait(q1.factKey)];
  if (PARCOURS.cleFait(q1.factKey)) assert.ok(fait1 && fait1.boite >= 1, "le calcul est entré dans une boîte");
  assert.ok(appli.api.parcours.jours.includes(PARCOURS.jourLocal()), "le jour compte comme travaillé");
  assert.deepEqual(PARCOURS.aRetenir(appli.api.parcours), [], "juste : rien à retenir");
  // Mauvaise réponse à la 2 : dans « À retenir », et aucune correction à l'écran.
  appli.api.repondreEvaluation(String(q2.answer + 1));
  await new Promise(r => setTimeout(r, 5));
  assert.equal(serveur.direct().at(-1).reponse, String(q2.answer + 1));
  assert.deepEqual(PARCOURS.aRetenir(appli.api.parcours), [[q2.first, q2.second]], "b) le raté est à retenir");
  assert.equal(appli.state.index, 2);
  assert.equal(appli.document.getElementById("answer-feedback").textContent, "", "aucune correction affichée");
  // « Passer » (ou le chrono tombé) : une réponse vide part.
  appli.api.nextEvaluation(true);
  await new Promise(r => setTimeout(r, 5));
  assert.equal(serveur.direct().at(-1).reponse, "");
  assert.equal(appli.state.index, 3);
  // Une réponse mal tapée ne part pas.
  appli.state.answer = "";
  appli.api.nextEvaluation(false);
  assert.ok(appli.rendus.includes("erreur de saisie"));
  assert.equal(serveur.direct().filter(c => c.numero === 4).length, 0);
  // Le serveur refuse (fenêtre passée, fermée pendant) : retour à l'accueil, rien d'inventé.
  serveur.etat.enregistree = false;
  appli.api.repondreEvaluation("5");
  await new Promise(r => setTimeout(r, 5));
  assert.equal(appli.api.enEvaluation(), false);
  assert.equal(appli.api.evalSerie, null);
  assert.ok(appli.rendus.includes("show:intro"));
});

test("en marche : vingt réponses — fini, le score affiché est celui de ses réponses relues ; fermée, plus rien", async () => {
  const {serveur, appli} = await appliEnEvaluation();
  await appli.api.commencerEvaluation();
  await new Promise(r => setTimeout(r, 5));
  let justes = 0;
  for (let i = 0; i < 20; i++) {
    const q = appli.state.questions[appli.state.index];
    const juste = i % 4 !== 0;
    if (juste) justes += 1;
    appli.api.repondreEvaluation(String(juste ? q.answer : q.answer + 2));
    await new Promise(r => setTimeout(r, 5));
  }
  assert.equal(serveur.etat.fini, true);
  assert.equal(appli.api.enEvaluation(), false, "fini : retour à l'accueil");
  assert.deepEqual(appli.api.scoreDeLEvaluation(appli.api.evalEtat), {score: justes, total: 20});
  assert.equal(justes, 15);
  // Le score vient des réponses RELUES du serveur, pas d'un compte local :
  // avec les réponses d'un autre passage, il change.
  const q1 = appli.state.questions[0];
  assert.deepEqual(appli.api.scoreDeLEvaluation({...appli.api.evalEtat, reponses: {"1": `${q1.answer}|10`}}), {score: 1, total: 20});
  // La carte : la ligne « envoyée ✓ · 15 / 20 », et dessous (lot E3) les
  // cinq questions ratées, telles qu'elles ont été posées (correctif 1 :
  // jamais « a × b », qui montre la réponse d'un nombre manquant ou d'une
  // division) ; « Tes erreurs » depuis le lot E3b.
  appli.api.renderCarteEvaluation();
  const acc = appli.document.getElementById(".acc");
  const ligne = acc.enfants[0];
  assert.ok(ligne.classes.has("evalc-ligne") && !ligne.classes.has("is-close"));
  assert.equal(ligne.enfants[0].textContent, "📝 Évaluation envoyée ✓ · 15 / 20");
  const rates = appli.state.questions.filter((q, i) => i % 4 === 0);
  assert.ok(ligne.classes.has("a-revoir"));
  assert.ok(ligne.enfants[1].classes.has("evalc-revoir"));
  assert.equal(ligne.enfants[1].textContent, "Tes erreurs\u00a0: " + rates.map(q => q.prompt.replace(/ /g, "\u00a0")).join(" · "), "k) « Tes erreurs », plus « À revoir »");
  const items = ligne.enfants[1].textContent.replace(/^Tes erreurs\u00a0: /, "").split(" · ");
  assert.equal(items.length, 5);
  for (const item of items) assert.equal((item.match(/\?/g) || []).length, 1, `« ${item} » garde son « ? » à la place de la réponse`);
  // Fermée : plus rien.
  serveur.etat.ouverte = false;
  await appli.api.lireEvaluation();
  appli.api.renderCarteEvaluation();
  assert.equal(acc.enfants.filter(n => !n.retire && (n.classes.has("evalc") || n.classes.has("evalc-ligne"))).length, 0);
});

test("en marche : onglet fermé puis rouvert — la carte « Je continue », la reprise à la question du serveur, le temps écoulé retiré du chrono en tout ; « Faire repasser » renvoie à « Je commence »", async () => {
  const serveur = serveurAvecEvaluation({modele: {...MODELE, chrono: "global", secondes: 90}});
  serveur.etat.commence = true;
  serveur.etat.graines = {seance: 123456, eleve: 654321};
  const questions = CORE.genererEvaluationDeClasse(MODELE, serveur.etat.graines);
  for (let i = 1; i <= 6; i++) serveur.etat.reponses[String(i)] = i === 2 ? "|30" : `${questions[i - 1].answer}|25`;
  const appli = demarrerAppli({reseau: serveur, codeOnglet: CODE, local: fauxStockage()});
  appli.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  assert.equal(appli.api.evalEtat.commence, true);
  assert.equal(appli.api.evalEtat.suivant, 7);
  appli.api.renderCarteEvaluation();
  const carte = appli.document.getElementById(".acc").enfants[0];
  assert.ok(carte.classes.has("evalc"));
  assert.ok(carte.texte.includes("Ton évaluation est commencée") && carte.texte.includes("question 7 sur 20") && carte.texte.includes("Je continue"));
  await appli.api.commencerEvaluation();
  await new Promise(r => setTimeout(r, 5));
  assert.deepEqual(serveur.direct().at(-1), {code: CODE}, "« Je continue » relit l'état, sans « commencer »");
  assert.equal(appli.state.index, 6, "la question 7");
  assert.equal(appli.state.correct, 5, "les 6 premières relues : 5 justes, 1 vide");
  assert.equal(appli.state.responses[1].skipped, true);
  assert.equal(appli.api.DURATION, 90);
  assert.equal(appli.state.endAt - appli.state.startAt, (90 - 30) * 1000, "le temps déjà écoulé (30 s) est retiré");
  assert.equal(appli.document.getElementById("skip").hidden, false, "en tout : « Passer » reste");
  // Le professeur le fait repasser : la prochaine réponse est refusée (409), l'appli revient à l'accueil.
  serveur.etat.commence = false; serveur.etat.graines = null; serveur.etat.reponses = {};
  appli.api.repondreEvaluation(String(questions[6].answer));
  await new Promise(r => setTimeout(r, 5));
  assert.equal(appli.api.enEvaluation(), false);
  assert.ok(appli.rendus.includes("show:intro"));
  await appli.api.lireEvaluation();
  appli.api.renderCarteEvaluation();
  const nouvelle = appli.document.getElementById(".acc").enfants.find(n => !n.retire && n.classes.has("evalc"));
  assert.ok(nouvelle && nouvelle.texte.includes("Je commence"), "retour à « Je commence » : nouveau tirage au prochain départ");
});

test("en marche : le serveur muet sur une réponse — la question reste, « Valider » renvoie ; 409 à « Je commence » (fermée) — la carte s'efface", async () => {
  const {serveur, appli} = await appliEnEvaluation();
  await appli.api.commencerEvaluation();
  await new Promise(r => setTimeout(r, 5));
  const q1 = appli.state.questions[0];
  serveur.etat.forcer = {statut: 0};
  appli.api.repondreEvaluation(String(q1.answer));
  await new Promise(r => setTimeout(r, 20));
  assert.equal(appli.state.index, 0, "la question reste");
  assert.equal(appli.api.enEvaluation(), true);
  assert.ok(appli.api.evalSerie.aRenvoyer, "à renvoyer");
  assert.match(appli.document.getElementById("answer-feedback").textContent, /Le serveur ne répond pas/);
  const envoisAvant = serveur.direct().filter(c => c.numero === 1).length;
  serveur.etat.forcer = null;
  appli.api.nextEvaluation(false);
  await new Promise(r => setTimeout(r, 5));
  assert.equal(serveur.direct().filter(c => c.numero === 1).length, envoisAvant + 1, "renvoyée telle quelle");
  assert.equal(appli.state.index, 1);
  assert.equal(Object.keys(serveur.etat.reponses).length, 1, "et rangée une fois");
  // Fermée avant « Je commence ».
  const autre = serveurAvecEvaluation();
  const a2 = demarrerAppli({reseau: autre, codeOnglet: CODE, local: fauxStockage()});
  a2.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  autre.etat.ouverte = false;
  await a2.api.commencerEvaluation();
  await new Promise(r => setTimeout(r, 5));
  assert.equal(a2.api.enEvaluation(), false);
  assert.equal(a2.api.evalEtat.etat, "fermee");
});

// Correctif de relecture (15/10/2026), deux défauts vus au banc :
//  - une réponse de 4 chiffres partait, le serveur la refusait (400, 3 chiffres
//    au plus) et la question restait bloquée pour de bon — « Valider » et
//    « Passer » renvoyaient le même paquet refusé, sans retour possible ;
//  - par question, une panne pendant l'envoi : l'anneau, arrivé à zéro,
//    envoyait une réponse VIDE à la place de celle qui attendait d'être renvoyée.
test("en marche : une réponse de plus de 3 chiffres ne part pas ; par question, l'anneau n'écrase pas une réponse en attente de renvoi", async () => {
  const {serveur, appli} = await appliEnEvaluation({modele: {...MODELE, chrono: "question", secondes: 8}});
  await appli.api.commencerEvaluation();
  await new Promise(r => setTimeout(r, 5));
  assert.match(html, /state\.answer\.length >= \(enEvaluation\(\) \? CHIFFRES_EVALUATION : 6\)/, "le pavé s'arrête à 3 chiffres pendant l'évaluation");
  assert.match(BLOC, /const CHIFFRES_EVALUATION = 3;/);
  appli.state.answer = "1234";
  appli.api.nextEvaluation(false);
  await new Promise(r => setTimeout(r, 5));
  assert.ok(appli.rendus.includes("erreur de saisie"), "4 chiffres : erreur de saisie, l'élève corrige");
  assert.equal(serveur.direct().filter(c => c.numero === 1).length, 0, "rien n'est parti");
  assert.equal(appli.api.evalSerie.aRenvoyer, null, "et rien n'attend d'être renvoyé");
  const q1 = appli.state.questions[0];
  serveur.etat.forcer = {statut: 0};
  appli.api.repondreEvaluation(String(q1.answer));
  await new Promise(r => setTimeout(r, 20));
  assert.ok(appli.api.evalSerie.aRenvoyer, "la panne : la réponse attend");
  const envoisAvant = serveur.direct().filter(c => c.numero === 1).length;
  // Le temps de la question est passé pendant les essais.
  appli.api.evalSerie.debutQuestion -= 60000;
  appli.api.updateTimerEvaluation();
  await new Promise(r => setTimeout(r, 5));
  assert.equal(serveur.direct().filter(c => c.numero === 1).length, envoisAvant, "l'anneau n'envoie rien");
  assert.equal(appli.api.evalSerie.aRenvoyer.reponse, String(q1.answer), "la réponse de l'élève attend toujours");
  serveur.etat.forcer = null;
  appli.api.nextEvaluation(false);
  await new Promise(r => setTimeout(r, 5));
  assert.equal(serveur.etat.reponses["1"].split("|")[0], String(q1.answer), "c'est SA réponse qui est rangée");
  assert.equal(appli.state.index, 1);
});

test("lot E3 : « Tes erreurs » (« À revoir » avant E3b) — la question telle qu'elle a été posée, jamais sa réponse ; les ratés et les vides atteints, jamais une question pas atteinte ; six au plus ; rien à 20 / 20", async () => {
  const {appli} = await appliEnEvaluation();
  const graines = {seance: 123456, eleve: 654321};
  const questions = CORE.genererEvaluationDeClasse(MODELE, graines);
  const etat = reponses => ({...appli.api.evalEtat, etat: "ouverte", commence: true, fini: true, modele: MODELE, graines, reponses});
  const justes = n => Object.fromEntries(questions.slice(0, n).map(q => [String(q.numero), `${q.answer}|20`]));
  // Tout juste : rien à revoir, la ligne reste sur un étage.
  assert.deepEqual(appli.api.questionsARevoir(etat(justes(20))), []);
  // Un faux, un vide, et la fin jamais atteinte (copie arrêtée à 6 réponses).
  const r = justes(6);
  r[String(questions[1].numero)] = `${questions[1].answer + 1}|20`;
  r[String(questions[3].numero)] = "|80";
  assert.deepEqual(appli.api.questionsARevoir(etat(r)), [questions[1].prompt, questions[3].prompt],
    "le faux et le vide, dans l'ordre des questions ; les 14 jamais atteintes ne comptent pas");
  // Tout faux : les vingt questions, chacune telle qu'elle a été posée — les
  // nombres manquants et les divisions gardent leur « ? » (correctif 1, relevé
  // par Code sur la PR #1002 : « 7 × 3 » montrait la réponse de « 7 × ? = 21 »).
  const tout = Object.fromEntries(questions.map(q => [String(q.numero), "0|20"]));
  const liste = appli.api.questionsARevoir(etat(tout));
  assert.deepEqual(liste, questions.filter(q => q.answer !== 0).map(q => q.prompt));
  assert.ok(new Set(questions.map(q => q.category)).size === 3, "le tirage mélange produits, nombres manquants et divisions");
  for (const question of questions.filter(q => q.category !== "direct")) {
    assert.ok(liste.includes(question.prompt), `« ${question.prompt} » écrit tel quel`);
    assert.ok(!liste.includes(`${question.first} × ${question.second}`), "jamais les deux facteurs, dont l'un est la réponse");
  }
  // Plus de six : les six premières, puis « et N autres ».
  const texte = appli.api.texteTesErreurs(liste);
  assert.equal(texte, "Tes erreurs\u00a0: " + liste.slice(0, 6).map(p => p.replace(/ /g, "\u00a0")).join(" · ") + ` · et ${liste.length - 6} autres`);
  assert.ok(appli.api.texteTesErreurs(liste.slice(0, 7)).endsWith(" · et 1 autre"));
  for (const item of texte.replace(/^Tes erreurs\u00a0: /, "").split(" · ").slice(0, 6)) assert.equal((item.match(/\?/g) || []).length, 1);
  assert.doesNotMatch(BLOC, /[`"']À revoir/, "k) l'ancien libellé n'est plus écrit nulle part (seulement nommé dans un commentaire)");
  // Sans graines (serveur d'avant, état bizarre) : rien.
  assert.deepEqual(appli.api.questionsARevoir({...etat(r), graines: null}), []);
  assert.deepEqual(appli.api.questionsARevoir(null), []);
});

// ------------------------------------------- lot E3b : « À retenir » pendant

const tic = () => new Promise(r => setTimeout(r, 5));
const cleDe = (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`;

// Le serveur garde ses réponses sur api/direct.php jusqu'à ce qu'on ouvre la
// porte : la page qui s'ouvre ne sait pas encore s'il y a une évaluation.
function retarderDirect(serveur) {
  let ouvrir;
  const porte = new Promise(r => { ouvrir = r; });
  return {...serveur, ouvrir: () => ouvrir(),
    fetch: (url, options) => (url.endsWith("/api/direct.php") ? porte.then(() => serveur.fetch(url, options)) : serveur.fetch(url, options))};
}

test("lot E3b, en marche : « À retenir » attend la première réponse du serveur ; ouverte : rien tant que son passage n'est pas fini, puis la liste sans les erreurs de l'évaluation (un calcul raté aussi ce matin compris) ; « Fermer », « Terminer » : tout ; « Faire repasser » : rien", async () => {
  // Ce matin, en séance : 2 × 7 raté.
  const matin = PARCOURS.retenirErreurs(sansPrenom(parcoursAvecTravail("", 3)), [[2, 7]]);
  const serveur = serveurAvecEvaluation({progression: matin});
  const reseau = retarderDirect(serveur);
  const appli = demarrerAppli({reseau, codeOnglet: CODE, local: fauxStockage()});
  appli.api.demarrerSuivi();
  await tic();
  assert.deepEqual(PARCOURS.aRetenir(appli.api.parcours), [[2, 7]], "le parcours du serveur est là");
  assert.equal(appli.api.evalLue, false);
  assert.deepEqual(appli.api.aRetenirAffiche(), [], "i) pas encore de réponse sur l'évaluation : rien, un instant — pas ses réponses avant de savoir");
  const avant = appli.rendus.length;
  reseau.ouvrir();
  await tic();
  assert.equal(appli.api.evalLue, true);
  assert.ok(appli.rendus.slice(avant).includes("accueil"), "la réponse redessine l'accueil");
  assert.equal(appli.api.evalEtat.etat, "ouverte");
  assert.deepEqual(appli.api.aRetenirAffiche(), [], "h) ouverte, pas commencée : pas d'« À retenir » (pas de réponses à l'écran avant l'évaluation)");
  await appli.api.commencerEvaluation();
  await tic();
  const qs = appli.state.questions;
  // La 5 est aussi un calcul raté ce matin, écrit dans l'autre sens.
  appli.api.parcours = PARCOURS.retenirErreurs(appli.api.parcours, [[qs[4].second, qs[4].first]]);
  const fautes = new Set([0, 4]);
  for (let i = 0; i < 20; i++) {
    const q = appli.state.questions[appli.state.index];
    appli.api.repondreEvaluation(String(fautes.has(i) ? q.answer + 1 : q.answer));
    await tic();
    if (i === 2) assert.deepEqual(appli.api.aRetenirAffiche(), [], "h) commencée, pas finie : rien");
  }
  assert.equal(serveur.etat.fini, true);
  const tout = PARCOURS.aRetenir(appli.api.parcours);
  const caches = new Set([cleDe(qs[0].first, qs[0].second), cleDe(qs[4].first, qs[4].second)]);
  assert.ok(tout.some(([a, b]) => cleDe(a, b) === cleDe(qs[0].first, qs[0].second)), "rien ne change dans les données : le raté de l'évaluation est dans le parcours");
  assert.ok(!caches.has(cleDe(2, 7)));
  assert.deepEqual(appli.api.aRetenirAffiche(), [[2, 7]], "f) fini, encore ouverte : seulement 2 × 7 — ses ratés de l'évaluation cachés, et le calcul raté aussi ce matin avec eux");
  // « Fermer » : tout, avec les réponses.
  serveur.etat.ouverte = false;
  await appli.api.lireEvaluation();
  assert.equal(appli.api.evalEtat.etat, "fermee");
  assert.deepEqual(appli.api.aRetenirAffiche(), tout, "g) fermée : toutes les erreurs du jour");
  // « Terminer » : l'état disparaît, tout reste affiché.
  serveur.etat.ouverte = null;
  await appli.api.lireEvaluation();
  assert.equal(appli.api.evalEtat, null);
  assert.deepEqual(appli.api.aRetenirAffiche(), tout);
  // Rouverte, et son passage effacé (« Faire repasser ») : plus rien ne
  // reconnaît les ratés du premier passage — rien jusqu'à ce qu'il ait repassé.
  Object.assign(serveur.etat, {ouverte: true, commence: false, fini: false, close: false, graines: null, reponses: {}});
  await appli.api.lireEvaluation();
  assert.equal(appli.api.evalEtat.commence, false);
  assert.deepEqual(appli.api.aRetenirAffiche(), [], "h) effacé : pas les réponses du premier passage avant qu'il repasse");
});

test("lot E3b : ce qui est caché — les ratés ATTEINTS de son passage (faux ou vides), 7 × 4 comme 4 × 7, jamais une question pas atteinte ; temps écoulé : pareil ; fermée, ou plus d'état : rien de caché", async () => {
  const {appli} = await appliEnEvaluation();
  const graines = {seance: 123456, eleve: 654321};
  const questions = CORE.genererEvaluationDeClasse(MODELE, graines);
  const r = Object.fromEntries(questions.slice(0, 6).map(q => [String(q.numero), `${q.answer}|20`]));
  r[String(questions[1].numero)] = `${questions[1].answer + 1}|20`;
  r[String(questions[3].numero)] = "|80";
  const visees = new Set([cleDe(questions[1].first, questions[1].second), cleDe(questions[3].first, questions[3].second)]);
  const jamais = questions.slice(6).find(q => !visees.has(cleDe(q.first, q.second)));
  assert.ok(jamais, "une question jamais atteinte, d'un autre calcul");
  // Le temps de l'évaluation est passé après six réponses : son passage est fini.
  const brut = {etat: "ouverte", nom: "Tables 3, 4 et 6", modele: MODELE, commence: true, fini: false, close: true, suivant: 7, graines, reponses: r, ecoule: 0};
  appli.api.retenirEtatEvaluation(brut);
  assert.deepEqual([...appli.api.calculsCachesDeLEvaluation(appli.api.evalEtat)].sort(), [...visees].sort(), "le faux et le vide, rien d'autre");
  appli.api.parcours = PARCOURS.retenirErreurs(appli.api.parcours,
    [[questions[1].second, questions[1].first], [questions[3].first, questions[3].second], [jamais.first, jamais.second], [2, 7]]);
  const tout = PARCOURS.aRetenir(appli.api.parcours);
  const reste = tout.filter(([a, b]) => !visees.has(cleDe(a, b)));
  assert.deepEqual(appli.api.aRetenirAffiche(), reste);
  assert.ok(reste.some(([a, b]) => cleDe(a, b) === cleDe(jamais.first, jamais.second)), "une question jamais atteinte ne cache rien");
  assert.ok(reste.some(([a, b]) => a === 2 && b === 7));
  assert.equal(reste.length, tout.length - 2, "le faux, écrit à l'envers dans la liste, est caché quand même");
  // Envoyée (fini) : pareil.
  appli.api.retenirEtatEvaluation({...brut, fini: true, close: false});
  assert.deepEqual(appli.api.aRetenirAffiche(), reste);
  // Pas finie : rien du tout.
  appli.api.retenirEtatEvaluation({...brut, close: false});
  assert.deepEqual(appli.api.aRetenirAffiche(), []);
  // Fermée : tout.
  appli.api.retenirEtatEvaluation({...brut, etat: "fermee"});
  assert.deepEqual(appli.api.aRetenirAffiche(), tout);
  assert.equal(appli.api.calculsCachesDeLEvaluation(appli.api.evalEtat).size, 0);
  // Plus d'évaluation : tout.
  appli.api.retenirEtatEvaluation(null);
  assert.deepEqual(appli.api.aRetenirAffiche(), tout);
});

test("lot E3b : la première lecture sans évaluation, ou en panne — l'accueil se redessine et « À retenir » s'affiche (l'élève à la maison) ; sans code, la liste telle quelle", async () => {
  const matin = PARCOURS.retenirErreurs(sansPrenom(parcoursAvecTravail("", 3)), [[2, 7]]);
  for (const cas of ["sans évaluation", "panne"]) {
    const serveur = serveurAvecEvaluation({progression: matin, ouverte: cas === "panne"});
    if (cas === "sans évaluation") serveur.etat.ouverte = null;
    else serveur.etat.forcer = {statut: 503};
    const reseau = retarderDirect(serveur);
    const appli = demarrerAppli({reseau, codeOnglet: CODE, local: fauxStockage()});
    appli.api.demarrerSuivi();
    await tic();
    assert.deepEqual(appli.api.aRetenirAffiche(), [], `${cas} : rien avant la réponse`);
    const avant = appli.rendus.length;
    reseau.ouvrir();
    await tic();
    assert.equal(appli.api.evalEtat, null);
    assert.equal(appli.api.evalLue, true);
    assert.ok(appli.rendus.slice(avant).includes("accueil"), `j) ${cas} : l'accueil est redessiné (sinon « À retenir » resterait caché)`);
    assert.deepEqual(appli.api.aRetenirAffiche(), [[2, 7]], `${cas} : « À retenir » s'affiche`);
  }
  const sansCode = demarrerAppli({reseau: serveurAvecEvaluation(), local: fauxStockage()});
  sansCode.api.parcours = matin;
  assert.deepEqual(sansCode.api.aRetenirAffiche(), [[2, 7]], "sans code : rien à attendre, rien de caché");
});
