// Lot « Ma classe : le parcours de Léa » (21/10/2026). Dans « Ma classe », le
// bouton « Parcours » (« Fiche » jusqu'ici) ouvre defi_tables.html#b=<billet>&vue=fiche :
// l'appli montre l'écran Mon parcours de l'élève, tel qu'il le verrait ce
// jour-là, en LECTURE SEULE — on touche une case ou une boîte pour voir le
// détail, rien ne se lance, rien ne s'enregistre, rien ne part — puis, dessous,
// la carte « Pour le professeur » (la page 2 de la fiche) et « Imprimer sa
// fiche ». Le danger n'est pas le professeur qui clique : c'est l'APPAREIL où
// il ouvre la page (la tablette de la classe, le PC où un élève est connecté
// dans l'onglet d'à côté). Trois verrous, à des points uniques :
//  1. la mémoire jetable : storage() et stockageSession() rendent une mémoire
//     en RAM, décidée avant la migration, la purge et le chargement ;
//  2. aucun envoi sauf l'échange du billet : appelSuivi refuse tout le reste,
//     envoiPossible est faux, envoyerAvantDeFermer sort avant sendBeacon ;
//  3. launchFromParcours (et start, startRevision) inertes.
// Les tests ci-dessous EXÉCUTENT les vraies fonctions de stockage et le bloc
// « suivi » de la page dans le faux monde (stockageReel), puis épinglent ce
// que la page et « Ma classe » doivent dire.

import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {
  PARCOURS, html, SOURCE_STOCKAGE, SOURCE_SUIVI,
  fauxStockage, fauxReseau, demarrerAppli, parcoursAvecTravail, tic
} from "./defi-tables-faux-monde.mjs";

const maClasse = await readFile(new URL("../_serveur/public/prof/index.php", import.meta.url), "utf8");

const BILLET = "5f2a9c0e7b1d4a6f8e3c2b1a0d9f8e7c";
const CODE_ELEVE = "2F4FUL";   // l'élève connecté dans l'onglet d'à côté
const VIEUX = "7K3M9P";        // une case oubliée depuis 100 jours
const JOUR = 24 * 60 * 60 * 1000;

// Léa, telle que le serveur la rend pour un billet de fiche : sa progression,
// son prénom, sa classe, la date — jamais le code.
function lea() {
  const p = parcoursAvecTravail("", 2);
  p.tables[5].acquise = "2026-10-12";
  return p;
}
function billets() {
  return {[BILLET]: {existe: true, parcours: lea(), maj_le: "2026-10-17T08:10:00Z", record: {meilleur: 72000}}};
}

// L'appareil : le sel, la case d'un élève connecté (10 jours), une case
// oubliée depuis 100 jours — celle qu'une page normale purge au démarrage.
function appareil() {
  const local = fauxStockage();
  const session = fauxStockage();
  const poser = (code, ilYA) => {
    PARCOURS.sauver(local, parcoursAvecTravail("", 3), code);
    PARCOURS.sauverSync(local, code, {revision: 1, dirty: true, detache: false, maj: Date.now() - ilYA});
  };
  poser(CODE_ELEVE, 10 * JOUR);
  poser(VIEUX, 100 * JOUR);
  PARCOURS.sauverCode(session, CODE_ELEVE);
  PARCOURS.sauverIdentiteOnglet(session, CODE_ELEVE, {prenom: "Lucas", classe: "306"});
  session.setItem("mathsgo-suivi-dernier-geste", String(Date.now() - 60000));
  return {local, session};
}
// Une photo du stockage, octet pour octet.
const photo = stockage => JSON.stringify(stockage.cles().sort().map(cle => [cle, stockage.brut(cle)]));

// La vue du professeur, démarrée sur cet appareil, billet échangé.
async function vueProf({local, session}, {reseau} = {}) {
  reseau = reseau || fauxReseau({billets: billets()});
  const appli = demarrerAppli({entree: {billet: BILLET, vue: "fiche"}, local, session, reseau, stockageReel: true});
  const reponse = await appli.api.echangerBillet(BILLET);
  await tic(2);
  return {appli, reseau, reponse};
}

// ------------------------------------------------- verrou 1 : la mémoire jetable

test("verrou 1 — dans la vue du professeur, l'appareil ne bouge pas d'un octet, même une vieille case qu'une page normale purgerait", async () => {
  const {local, session} = appareil();
  const avantLocal = photo(local);
  const avantSession = photo(session);
  assert.ok(local.cles().includes(PARCOURS.cleSync(VIEUX, local)), "la case oubliée est bien là au départ");

  const {appli, reponse} = await vueProf({local, session});
  assert.equal(appli.api.VUE_PROF, true);
  assert.equal(reponse.donnees.type, "fiche", "le billet de fiche est échangé");
  assert.equal(photo(local), avantLocal, "localStorage : identique octet pour octet (ni migration, ni purge, ni sel)");
  assert.equal(photo(session), avantSession, "sessionStorage : identique — le code de l'élève connecté n'est pas effacé");
  assert.equal(appli.api.codeSuivi, "", "la vue n'a pas de code : le billet de fiche n'en rend pas");
  assert.equal(appli.api.suiviActif(), false);
  // Ce que la page lit et écrit va dans la mémoire jetable, pas sur l'appareil.
  assert.notEqual(appli.api.storage(), local, "storage() n'est pas localStorage");
  assert.notEqual(appli.api.stockageSession(), session, "stockageSession() n'est pas sessionStorage");
  appli.api.parcours = PARCOURS.normaliserParcours(lea());
  appli.api.sauverParcours();
  appli.api.storage().setItem("essai", "1");
  appli.api.stockageSession().setItem("essai", "1");
  assert.equal(photo(local), avantLocal, "même après une sauvegarde : rien sur l'appareil");
  assert.equal(photo(session), avantSession);
});

test("verrou 1, le témoin — la même case oubliée, sur une page NORMALE, est purgée au démarrage (c'est bien la vue qui protège)", async () => {
  const {local, session} = appareil();
  const avant = photo(local);
  const appli = demarrerAppli({entree: {}, local, session, reseau: fauxReseau({mode: "muet"}), stockageReel: true});
  assert.equal(appli.api.VUE_PROF, false);
  assert.equal(appli.api.storage(), local, "sans billet de fiche, storage() EST localStorage");
  assert.notEqual(photo(local), avant, "la page normale a touché l'appareil");
  assert.equal(local.getItem(PARCOURS.cleSync(VIEUX, local)), null, "la case de 100 jours est partie");
  assert.deepEqual(PARCOURS.charger(local, VIEUX), PARCOURS.creerParcours());
  assert.ok(local.cles().includes(PARCOURS.cleSync(CODE_ELEVE, local)), "celle de l'élève connecté (10 jours) reste");
});

test("verrou 1 — la décision est prise AVANT la clé ?seance=1, la migration, la purge et le chargement de la case", () => {
  // L'ordre dans la page : le bloc [stockage] (MEMOIRE_PROF décidé sur
  // l'entrée lue par le <head>) vient AVANT le bloc [suivi] où vivent
  // migrerStockage, effacerCode, purger et charger.
  const stockage = html.indexOf("// [stockage:debut]");
  const suivi = html.indexOf("// [suivi:debut]");
  assert.ok(stockage > 0 && suivi > stockage, "le bloc [stockage] précède le bloc [suivi]");
  assert.match(SOURCE_STOCKAGE, /const MEMOIRE_PROF = estVueProf\(lireEntree\(\)\) \? \{durable: memoireJetable\(\), onglet: memoireJetable\(\)\} : null;/);
  assert.match(SOURCE_STOCKAGE, /if \(!MEMOIRE_PROF\) \{ try \{ window\.localStorage\.removeItem\("mathsgo-defi-tables-seance"\); \} catch \(_\) \{\} \}/,
    "même la trace de ?seance=1 n'est pas retirée de l'appareil dans la vue du professeur");
  assert.match(SOURCE_STOCKAGE, /function storage\(\) \{\s*\n\s*if \(MEMOIRE_PROF\) return MEMOIRE_PROF\.durable;\s*\n\s*try \{ return window\.localStorage; \}/);
  assert.match(SOURCE_STOCKAGE, /function stockageSession\(\) \{\s*\n\s*if \(MEMOIRE_PROF\) return MEMOIRE_PROF\.onglet;\s*\n\s*try \{ return window\.sessionStorage; \}/);
  assert.match(SOURCE_SUIVI, /const VUE_PROF = estVueProf\(ENTREE\);/);
  assert.match(SOURCE_SUIVI, /function estVueProf\(entree\) \{\s*\n\s*return Boolean\(entree && entree\.billet\) && String\(entree\.vue \|\| ""\) === "fiche";/);
  // Les quatre lignes de démarrage, inchangées, toujours derrière storage() / stockageSession().
  assert.match(SOURCE_SUIVI, /PARCOURS\.migrerStockage\(storage\(\)\);\s*\n\s*if \(ENTREE\.billet\) PARCOURS\.effacerCode\(stockageSession\(\)\);\s*\n\s*let codeSuivi = codeInitial\(ENTREE\);\s*\n\s*PARCOURS\.purger\(storage\(\), \{maintenant: Date\.now\(\), garder: codeSuivi\}\);\s*\n\s*let parcours = codeSuivi \? PARCOURS\.charger\(storage\(\), codeSuivi\) : caseSansCode\(\);/);
  // Et aucun accès direct à localStorage / sessionStorage ailleurs que dans ce bloc.
  const page = html.slice(html.indexOf("// [stockage:fin]"));
  assert.doesNotMatch(page.replace(/\/\/[^\n]*/g, ""), /window\.localStorage|window\.sessionStorage|\blocalStorage\.|\bsessionStorage\./,
    "toute lecture ou écriture passe par storage() / stockageSession()");
});

// ------------------------------------------------- verrou 2 : aucun envoi

test("verrou 2 — la seule requête est l'échange du billet : tout le reste est refusé par appelSuivi, et rien ne part à la fermeture", async () => {
  const {local, session} = appareil();
  const avantLocal = photo(local);
  const {appli, reseau} = await vueProf({local, session});
  assert.deepEqual(reseau.appels.map(a => a.url.replace("https://suivi.mathsgo.re", "")), ["/api/eleve.php"], "un seul appel");
  assert.equal(reseau.appels[0].billet, BILLET);
  const api = appli.api;
  // Tout ce qui envoie, appelé exprès, avec un parcours à envoyer :
  api.parcours = PARCOURS.normaliserParcours(lea());
  api.sauverParcours();
  api.envoyerMaintenant();
  api.envoyerAvantDeFermer();
  api.demarrerSuivi();
  api.lancerCourse();
  api.chargerRecords();
  api.envoyerCourseEnAttente();
  api.veillerEvaluation();
  await api.lireEvaluation();
  api.renderRepere();
  api.verifierGarde();
  appli.declencher("pagehide");
  appli.document.visibilityState = "hidden";
  appli.document.declencher("visibilitychange");
  appli.declencher("online");
  await tic(3);
  assert.deepEqual(reseau.appels.map(a => a.url.replace("https://suivi.mathsgo.re", "")), ["/api/eleve.php"], "toujours un seul appel");
  assert.deepEqual(appli.balises, [], "aucun sendBeacon");
  assert.equal(photo(local), avantLocal, "et toujours rien sur l'appareil");
  assert.equal(api.suiviActif(), false, "demarrerSuivi n'a adopté aucun code");
  // Le point unique : appelSuivi lui-même.
  assert.match(SOURCE_SUIVI, /async function appelSuivi\(chemin, options\) \{\s*\n\s*if \(VUE_PROF && !echangeDuBillet\) return \{statut: 0, donnees: null\};/);
  assert.match(SOURCE_SUIVI, /function echangerBillet\(billet\) \{[\s\S]*?echangeDuBillet = true;\s*\n\s*try \{\s*\n\s*return appelSuivi\("\/api\/eleve\.php"[\s\S]*?\} finally \{\s*\n\s*echangeDuBillet = false;\s*\n\s*\}/);
  assert.match(SOURCE_SUIVI, /function envoiPossible\(\) \{[\s\S]*?if \(VUE_PROF\) return false;/);
  assert.match(SOURCE_SUIVI, /function envoyerAvantDeFermer\(\) \{[\s\S]*?if \(VUE_PROF\) return;\s*\n\s*if \(!envoiPossible\(\) \|\| !sync\.dirty\) return;/);
  assert.match(SOURCE_SUIVI, /function demarrerSuivi\(\) \{[\s\S]*?if \(VUE_PROF\) \{ finAttente\(\); return; \}/);
});

test("verrou 2 — le billet refusé (périmé, ou serveur muet) : le bandeau le dit avec le mot « parcours », et rien d'autre ne part", async () => {
  const perime = await vueProf(appareil(), {reseau: fauxReseau({billets: {}})});
  assert.equal(perime.reponse.statut, 404);
  perime.appli.api.renderRepere();
  assert.match(SOURCE_SUIVI, /"Ce lien a expiré : rouvre le parcours depuis « Ma classe »\."/);
  assert.match(SOURCE_SUIVI, /"Le serveur n’a pas répondu\. Réessaie dans un instant\."/);
  assert.doesNotMatch(html, /rouvre la fiche depuis/, "plus de « fiche » dans le message");
  // L'écran qui ouvre la vue : le message vient de profEtat.erreur.
  assert.match(html, /profEtat = \{erreur: reponse\.statut === 404 \|\| donnees \? "expire" : "injoignable"\};\s*\n\s*renderRepere\(\);/);
  const muet = await vueProf(appareil(), {reseau: fauxReseau({mode: "coupe"})});
  assert.equal(muet.reponse.statut, 0);
  assert.equal(muet.reseau.appels.length, 1);
});

// ------------------------------------------------- le bandeau

test("le bandeau : « Léa · 306 · lecture seule · dernière activité le 17/10/2026 », le record à la suite ; ni puce, ni sortie", async () => {
  const {appli} = await vueProf(appareil());
  const api = appli.api;
  const repere = appli.repere();
  // Le temps de l'échange : « Un instant… ».
  api.renderRepere();
  assert.equal(repere.hidden, false);
  assert.ok(repere.classes.has("lecture-seule"));
  assert.equal(repere.texte, "Un instant…");
  // Ce que fait afficherFicheEleve, une fois le billet échangé.
  assert.match(html, /profEtat = \{prenom: distant\.prenom, classe: classe \|\| "", maj_le: maj_le \|\| null, record\};/);
  // Le texte d'un élément du faux monde : ses enfants, texte ou textContent.
  const texteDe = morceaux => morceaux.map(m => typeof m === "string" ? m : (m.enfants && m.enfants.length ? texteDe(m.enfants) : m.textContent)).join("");
  // On rejoue renderRepereProf (le vrai code du bloc) sur un profEtat donné.
  const rendre = profEtat => {
    const debut = SOURCE_SUIVI.indexOf("function renderRepereProf(repere) {");
    const fin = SOURCE_SUIVI.indexOf("\n      }\n", debut) + 8;
    const fauxRepere = appli.document.createElement("p");
    new Function("document", "PARCOURS", "profEtat", "repere", `${SOURCE_SUIVI.slice(debut, fin)}\nrenderRepereProf(repere);`)(appli.document, PARCOURS, profEtat, fauxRepere);
    return fauxRepere;
  };
  const plein = rendre({prenom: "Léa", classe: "306", maj_le: "2026-10-17T08:10:00Z", record: {meilleur: 72000}});
  assert.equal(plein.hidden, false);
  assert.ok(plein.classes.has("lecture-seule") && !plein.classes.has("detache"));
  const texte = plein.enfants[0];
  assert.equal(texte.className, "repere-lecture");
  // Trois morceaux insécables : « Léa · 306 · lecture seule », « · dernière activité le 17/10/2026 », « · record 1 min 12 ».
  const morceaux = texte.enfants.filter(n => typeof n !== "string");
  assert.equal(morceaux.length, 3);
  assert.equal(texteDe(morceaux[0].enfants), "Léa · 306 · lecture seule");
  assert.equal(morceaux[0].enfants.at(-1).textContent, "lecture seule", "« lecture seule » est le <b>");
  assert.equal(texteDe(morceaux[1].enfants), "· dernière activité le 17/10/2026");
  assert.equal(texteDe(morceaux[2].enfants), `· record ${PARCOURS.formatTemps(72000)}`);
  assert.ok(!plein.enfants.some(n => n && n.classes && (n.classes.has("puce") || n.classes.has("sortie-bloc"))), "ni puce ni « Se déconnecter »");
  const sansRecord = rendre({prenom: "Léa", classe: "306", maj_le: null, record: null});
  const m2 = sansRecord.enfants[0].enfants.filter(n => typeof n !== "string");
  assert.equal(m2.length, 2);
  assert.equal(texteDe(m2[1].enfants), "· aucune activité enregistrée");
  const erreur = rendre({erreur: "expire"});
  assert.ok(erreur.classes.has("detache"));
  assert.equal(erreur.enfants[0].textContent, "Ce lien a expiré : rouvre le parcours depuis « Ma classe ».");
});

// ------------------------------------------------- verrou 3 : rien ne se lance ; la page

test("verrou 3 — launchFromParcours, start et startRevision sortent en premier ; les marches gardent leur aspect mais ne promettent pas « Lancer »", () => {
  assert.match(html, /function launchFromParcours\(config, origin = "parcours", \{puis\} = \{\}\) \{\s*\n(\s*\/\/[^\n]*\n)*\s*if \(VUE_PROF\) return;/);
  assert.match(html, /function start\(\) \{\s*\n\s*if \(VUE_PROF\) return;/);
  assert.match(html, /function startRevision\(table = null, origin = "parcours"\) \{\s*\n\s*if \(VUE_PROF\) return;/);
  assert.match(html, /\$\{config && !VUE_PROF \? "Lancer\." : ""\}/);
  assert.match(html, /if \(\(!config && action\) \|\| VUE_PROF\) cell\.setAttribute\("aria-disabled", "true"\);/);
  // Un seul écran (show), et rien de ce que le parcours affiche ne se modifie :
  // la flèche « Ma table », le Retour du navigateur, « Non, ce n'est pas moi »
  // (quitterSuivi partait vers l'espace élève), « Recommencer à zéro », le
  // prénom — cachés, et inertes même par un clic forcé.
  assert.match(html, /function show\(name\) \{[\s\S]{0,900}?if \(VUE_PROF\) name = "parcours";[\s\S]{0,400}?\["intro", "launch", "play", "result", "parcours", "lire", "fiche"\]\.forEach/);
  assert.match(SOURCE_SUIVI, /function quitterSuivi\(\) \{\s*\n(\s*\/\/[^\n]*\n)*\s*if \(VUE_PROF\) return;\s*\n\s*envoyerAvantDeFermer\(\);/);
  assert.match(html, /\$\("parcours-confirm-yes"\)\.addEventListener\("click", \(\) => \{\s*\n\s*if \(VUE_PROF\) return;\s*\n\s*parcours = PARCOURS\.remettreAZero\(parcours\);/);
  assert.match(html, /\$\("parcours-name"\)\.addEventListener\("submit", event => \{\s*\n\s*event\.preventDefault\(\);\s*\n(\s*\/\/[^\n]*\n)*\s*if \(VUE_PROF\) return;/);
  assert.match(html, /\$\("fiche-prenom-form"\)\.addEventListener\("submit", event => \{\s*\n\s*event\.preventDefault\(\);\s*\n\s*if \(VUE_PROF\) return;/);
  // Pas de grisé : la seule règle sur .cell dans la vue est le curseur.
  assert.match(html, /body\.mode-prof \.cell \{ cursor: default; \}/);
  assert.doesNotMatch(html, /body\.mode-prof[^{]*\.cell[^{]*\{[^}]*(opacity|filter|color)/, "aucun grisé des marches");
});

test("la page : l'écran Mon parcours de l'élève, « Le parcours de Léa », sans flèche, ⋯, ▶, « Comment ça marche ? », plein écran ni pied ; Mon mélange sur une colonne", () => {
  assert.match(html, /if \(VUE_PROF && document\.body\) document\.body\.classList\.add\("mode-prof"\);/);
  assert.match(html, /if \(VUE_PROF\) return `Le parcours \$\{deNom\(\(parcours && parcours\.prenom\) \|\| "l’élève"\)\}`;/);
  assert.match(html, /\$\("parcours-name"\)\.hidden = VUE_PROF \|\| suiviActif\(\) \|\|/);
  assert.match(html, /classList\.toggle\("mode-eleve", Boolean\(suiviActif\(\) \|\| entreeRefusee \|\| VUE_PROF\)\)/, "la même barre fine que l'élève");
  const regle = /body\.mode-prof \.fullscreen-toggle, body\.mode-prof #intro,\s*\n\s*body\.mode-prof #parcours-options, body\.mode-prof #parcours-name, body\.mode-prof #parcours-confirm,\s*\n\s*body\.mode-prof \.parcours-notice-action \.saut, body\.mode-prof #parcours-notice-bouton, body\.mode-prof #parcours-notice,\s*\n\s*body\.mode-prof #parcours-melange \.mp-melange > \.cell \{ display: none !important; \}/;
  assert.match(html, regle);
  assert.match(html, /body\.mode-prof #parcours-back, body\.mode-prof #parcours-more \{ visibility: hidden; pointer-events: none; \}/, "leur place reste : le titre ne bouge pas");
  assert.match(html, /body\.mode-prof #parcours-melange \.mp-melange \{ grid-template-columns: minmax\(0, 1fr\); \}/, "sans le ▶, les coupes ne chevauchent plus « Mon mélange »");
  // Le bandeau : morceaux insécables, « lecture seule » en gras.
  assert.match(html, /\.suivi-repere\.lecture-seule \.repere-lecture > span \{ display: inline-block; white-space: nowrap; \}/);
  assert.match(html, /\.suivi-repere\.lecture-seule b \{ font-weight: 800; \}/);
  // Plus de pied de page dans l'appli (24/10/2026) : rien à cacher en bas pour le
  // professeur, et la page ne charge plus mention-confidentialite.js (23/10/2026).
  assert.doesNotMatch(html, /<footer class="site-footer"/);
  assert.doesNotMatch(html, /<script[^>]*mention-confidentialite\.js/);
});

test("la page : « Pour le professeur » dans une seconde carte sous le parcours — le même rendu que la page 2, le tableau défile de côté, colonne fixe, pas de hauteur mini ; hors de la mesure de l'échelle", () => {
  assert.match(html, /<\/section>\s*\n\s*<!--[\s\S]*?-->\s*\n\s*<section id="parcours-prof" class="panel parcours-prof" aria-label="Pour le professeur" hidden><\/section>\s*\n\s*<\/main>/);
  assert.match(html, /function renderCarteProf\(\) \{[\s\S]*?const copie = \$\("fiche-prof"\)\.querySelector\("\.fiche-prof"\)\.cloneNode\(true\);\s*\n\s*copie\.querySelectorAll\("\[id\]"\)\.forEach\(element => element\.removeAttribute\("id"\)\);[\s\S]*?defile\.className = "parcours-prof-defile";[\s\S]*?carte\.replaceChildren\(copie\);\s*\n\s*carte\.hidden = false;/);
  assert.match(html, /\.parcours-prof \{ min-height: 0; margin-top: 18px; \}/);
  assert.match(html, /\.parcours-prof \.fiche-prof \{ padding: 4px 6px; border: 0; \}/);
  assert.match(html, /\.parcours-prof-defile \{ overflow-x: auto; -webkit-overflow-scrolling: touch; \}/);
  assert.match(html, /\.parcours-prof \.fiche-prof table \{ min-width: 640px; \}/);
  assert.match(html, /\.parcours-prof \.fiche-prof tbody th \{ position: sticky; left: 0; background: #fff; \}/);
  // L'échelle : ajusterEchelle mesure le corps ; la carte en est retirée le
  // temps de la mesure — le cadre du parcours seul doit tenir, comme chez l'élève.
  assert.match(html, /body\.mesure-cadre #parcours-prof \{ display: none !important; \}/);
  assert.match(html, /corps\.classList\.add\("mesure-cadre"\);[\s\S]*?if \(!fige && corps\.offsetHeight > limite\) return false;|if \(!fige && corps\.offsetHeight > limite\) return false;[\s\S]*?corps\.classList\.add\("mesure-cadre"\);/);
  // La feuille imprimée : toujours les deux pages, remplies depuis ficheAffichee.
  assert.match(html, /body > \*:not\(#fiche-print\) \{ display: none !important; \}/);
  assert.match(html, /window\.addEventListener\("beforeprint", \(\) => renderFiche\(ficheAffichee\)\)/);
  assert.match(html, /function imprimerFicheProf\(\) \{\s*\n\s*window\.setTimeout\(\(\) => window\.print\(\), 30\);/);
  assert.match(html, /\$\("parcours-fiche"\)\.removeAttribute\("aria-controls"\);/);
});

test("l'adresse reste #b=…&vue=fiche : la page prof et le site se mettent à jour dans n'importe quel ordre", () => {
  assert.match(maClasse, /#b=\$\{encodeURIComponent\(r\.billet\)\}&vue=fiche/);
  assert.match(html, /\} else if \(ENTREE\.billet && ENTREE\.vue === "fiche"\) \{\s*\n\s*ouvrirFicheParBillet\(ENTREE\.billet\);/);
  // L'ancienne page (sans ce lot) répondait à la même adresse par la fiche A4 ;
  // la nouvelle y répond par le parcours : « Ma classe » n'a rien à savoir.
  assert.doesNotMatch(maClasse, /vue=parcours/);
});

// ------------------------------------------------- Ma classe

test("Ma classe : « Parcours » à la place de « Fiche », même bouton, même place, même classe — pour le propriétaire et pour un collègue « voir seulement »", () => {
  assert.match(maClasse, /const fiche = document\.createElement\("button"\);\s*\n\s*fiche\.type = "button";\s*\n\s*fiche\.className = "secondaire petit";\s*\n\s*fiche\.textContent = "Parcours";\s*\n\s*fiche\.title = "Voir son parcours";\s*\n\s*fiche\.addEventListener\("click", \(\) => voirFiche\(eleve, fiche\)\);\s*\n\s*cActions\.append\(fiche\);/);
  assert.doesNotMatch(maClasse, /textContent = "Fiche"|"Voir sa fiche"/);
  // Le bouton est posé AVANT poserGestes(eleve, ecriture, …) : il ne dépend pas
  // du droit d'écriture — un collègue en lecture seule l'a aussi.
  assert.match(maClasse, /cActions\.append\(fiche\);\s*\n\s*\/\/[^\n]*\n\s*poserGestes\(eleve, ecriture, cActions\);/);
  // Le « Détail » de SPLAT! ne bouge pas.
  assert.match(maClasse, /detail\.textContent = ouvert \? "Replier ▴" : "Détail ▾";/, "le bouton « Détail » de SPLAT! est toujours là");
});
