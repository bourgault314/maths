// Lot 2 « outils + carte » du chantier SPLAT! ↔ suivi (08/10/2026) : la carte
// des mondes et les trois outils du parcours écrivent par le moteur partagé,
// sous le code de l'onglet, et l'habillage commun (assets/js/splat-suivi.js)
// dessine ce que l'élève voit — le bandeau de la carte, la pastille « ● Léa »
// des outils, la question de la garde. Ces tests EXÉCUTENT l'habillage, le
// <head> de la carte et les fonctions des outils telles qu'elles sont écrites
// dans les pages, dans un faux onglet (tests/splat-suivi-monde.mjs).

import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {PARCOURS, fauxStockage, fauxReseau, fauxServeur, fauxTemps, tic, A, CLE, lire, PAGES, SOURCE_SUIVI,
  fauxOnglet, outilClassiqueOuPetit, outilEqua, source} from "./splat-suivi-monde.mjs";

const LEA = {prenom: "Léa", classe: "405"};

// ------------------------------------------------------------------ la carte

// Le premier script en ligne de la carte : l'amorce du <head>, en JavaScript ancien.
const AMORCE = [...PAGES.carte.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])[0];

function amorcer(hash, search = "", codeOnglet = "") {
  const remplacees = [];
  const ecouteurs = {};
  const fenetre = {
    location: {hash, pathname: "/outils/splat_univers.html", search, rechargee: 0, reload() { this.rechargee += 1; }},
    history: {replaceState(_e, _t, url) { remplacees.push(url); }},
    addEventListener(type, fn) { ecouteurs[type] = fn; },
    document: {documentElement: {className: "js"}},
    sessionStorage: fauxStockage(codeOnglet ? {"mathsgo-suivi-code": codeOnglet} : {})
  };
  new Function("window", AMORCE)(fenetre);
  return {entree: fenetre.MATHSGO_ENTREE, remplacees, fenetre, ecouteurs, classes: fenetre.document.documentElement.className.split(" ")};
}

test("carte : l'amorce du <head> est en JavaScript ancien, avant tout autre script, et ne nomme pas le code", () => {
  const tete = PAGES.carte.slice(0, PAGES.carte.indexOf("</head>"));
  assert.ok(tete.indexOf(AMORCE) > 0 && tete.indexOf(AMORCE) < tete.indexOf("<script src="), "l'amorce passe avant les scripts chargés");
  const code = AMORCE.replace(/\/\/[^\n]*/g, "");
  assert.doesNotMatch(code, /\b(const|let)\b|=>|URLSearchParams|\?\./, "ES5 : il faut qu'elle tourne partout");
  assert.doesNotThrow(() => new vm.Script(AMORCE));
});

test("carte : #b=… sort de l'adresse avant tout, et devient l'entrée de la page", () => {
  const a = amorcer("#b=0123456789abcdef0123456789abcdef");
  assert.equal(a.entree.billet, "0123456789abcdef0123456789abcdef");
  assert.deepEqual(a.remplacees, ["/outils/splat_univers.html"], "plus rien dans le fragment");
});

test("carte : les ancres de la carte restent (#enq-bonus, #sys-bonus), le billet seul s'en va", () => {
  assert.deepEqual(amorcer("#b=abc&enq-bonus").remplacees, ["/outils/splat_univers.html#enq-bonus"]);
  assert.deepEqual(amorcer("#sys-bonus&b=abc", "?essai=1").remplacees, ["/outils/splat_univers.html?essai=1#sys-bonus"]);
  const ancre = amorcer("#monde-4");
  assert.deepEqual(ancre.remplacees, [], "une ancre seule : l'adresse ne bouge pas");
  assert.equal(ancre.entree.billet, "");
});

test("carte : un code tapé dans l'adresse n'ouvre rien, il est seulement effacé", () => {
  const a = amorcer("#code=" + A);
  assert.equal(a.entree.billet, "");
  assert.deepEqual(a.remplacees, ["/outils/splat_univers.html"]);
  assert.equal(amorcer("#fiche=" + A + "&enq-bonus").remplacees[0], "/outils/splat_univers.html#enq-bonus");
});

test("carte : le choix « Élève | Professeur » disparaît pour l'élève venu de son espace, dès le <head> — pas en vue prof ni sans code", () => {
  assert.ok(amorcer("#b=abc").classes.includes("suivi-eleve"), "un billet");
  assert.ok(amorcer("", "", A).classes.includes("suivi-eleve"), "un code déjà dans l'onglet (retour d'un outil)");
  assert.ok(!amorcer("").classes.includes("suivi-eleve"), "un visiteur sans code garde le sélecteur");
  assert.ok(!amorcer("", "?prof=1", A).classes.includes("suivi-eleve"), "la vue professeur garde son sélecteur");
  assert.ok(amorcer("", "?apres=m1e1", A).classes.includes("suivi-eleve"));
  assert.match(PAGES.carte, /html\.suivi-eleve header \.modeBar\{display:none\}/);
  assert.match(PAGES.carte, /document\.documentElement\.classList\.toggle\("suivi-eleve",!!\(SUIVI&&\(SUIVI\.actif\(\)\|\|SUIVI\.attente\(\)\|\|SUIVI\.client\.entreeRefusee\)\)\);/);
});

test("carte : un #b= posé sur une carte déjà ouverte recharge la page (le document neuf l'échange)", () => {
  const a = amorcer("");
  a.fenetre.location.hash = "#b=abc";
  a.ecouteurs.hashchange();
  assert.equal(a.fenetre.location.rechargee, 1);
  a.fenetre.location.hash = "#enq-bonus";
  a.ecouteurs.hashchange();
  assert.equal(a.fenetre.location.rechargee, 1, "une ancre ordinaire ne recharge rien");
});

test("carte : elle lit la case de l'onglet par le moteur — rien pendant l'échange d'un billet, les deux formats sans moteur", () => {
  const f = PAGES.carte;
  assert.match(f, /function lireParcours\(\)\{\n  if\(SUIVI\)\{ if\(SUIVI\.attente\(\)\) return \{\}; const p=SUIVI\.lire\(\); if\(p\) return p\.etapes; \}/);
  // le repli sans moteur, exécuté : l'ancien contenu à plat ET le format du serveur
  const repli = f.slice(f.indexOf("  try{const brut=JSON.parse(localStorage.getItem(KEY_PARCOURS))"), f.indexOf("\n}", f.indexOf("function lireParcours(){")));
  const lireSans = contenu => new Function("localStorage", "KEY_PARCOURS", repli)(fauxStockage({[CLE]: JSON.stringify(contenu)}), CLE);
  assert.equal(lireSans({m1e1: {fait: true}}).m1e1.fait, true);
  assert.equal(lireSans(PARCOURS.enregistrerSerie(PARCOURS.creer(), "m1e1", {fait: true, etoiles: 4, cartes: 4, vues: 0})).m1e1.fait, true);
  // pas de suivi en vue professeur ; les étoiles cochées à la main ne comptent pas sous un code
  assert.match(f, /const SUIVI=\(!PROF&&window\.MathsGoSplatSuivi\)\?window\.MathsGoSplatSuivi\.creer\(\{surRepere:majSuivi,surParcours:suiviParcours\}\):null;/);
  assert.match(f, /return \(faitsLocaux\(\)&&!!faits\[id\]\)\|\|!!\(e\.p&&parcours\[e\.p\]&&parcours\[e\.p\]\.fait\);/);
  assert.match(f, /cont\.hidden=!prochaine\|\|!!\(SUIVI&&SUIVI\.attente\(\)\);/, "pas de « Continuer » tant qu'on ne sait pas qui entre");
});

test("carte : le suivi démarre APRÈS le premier dessin, jamais quand ?apres= repart aussitôt", () => {
  const f = PAGES.carte;
  const dessin = f.indexOf("ouvrirMonde(mondeEnCours(majAffichage()));\nif(!PROF) ouvrirParties();");
  const lancement = f.indexOf("if(SUIVI&&!APRES_REDIRIGE){ majSuivi(); SUIVI.lancer(); }");
  assert.ok(dessin > 0 && lancement > dessin);
  assert.equal((f.match(/APRES_REDIRIGE=true;/g) || []).length, 3, "les trois départs aussitôt : ?apres= (Bonus, étape) et ?jouer= (la suite d’un film, 11/10/2026)");
  // la flèche et le logo mènent à l'espace sous un code (ou après un billet refusé), au site sinon
  assert.match(f, /const espace=!!\(SUIVI&&\(SUIVI\.actif\(\)\|\|SUIVI\.client\.entreeRefusee\)\);/);
  // en-tête commun (31/10/2026) : la ligne de suivi SOUS LE GRAND TITRE, cachée pour tous les
  // autres ; dans la barre du haut, la flèche seule (plus de bloc pâle)
  const entete = f.slice(f.indexOf("<header>"), f.indexOf("</header>"));
  assert.doesNotMatch(entete, /suivi-repere/, "plus de bloc dans la barre du haut");
  assert.match(entete, /<a class="brand"[^\n]*\n\s*<nav class="modeBar"/);
  const titre = f.slice(f.indexOf('<div class="hero">'), f.indexOf('<div class="totalBar"'));
  assert.match(titre, /<h1>L'univers <span class="splat">SPLAT!<\/span><\/h1>\s*<!--[\s\S]*?-->\s*<p id="suivi-repere" class="suivi-repere" hidden><\/p>\s*<p class="sub">/);
  assert.doesNotMatch(f, /<\/header>\n<p id="suivi-repere"/, "plus de bandeau sous l'en-tête");
  assert.doesNotMatch(f, /mention-confidentialite\.js/, "la carte ne charge pas la mention (pas de pied à remplacer)");
});

// ------------------------------------------------------------- l'habillage

test("habillage : sans moteur, rien — la page joue comme avant", () => {
  const o = fauxOnglet({sansMoteur: true});
  assert.equal(o.fenetre.MathsGoSplatSuivi.creer({}), null);
});

test("habillage : sans code, rien ne se voit et rien ne part ; la case sans code d'aujourd'hui reçoit le travail", async () => {
  const o = fauxOnglet({local: fauxStockage({[CLE]: JSON.stringify({m1e1: {fait: true, etoiles: 9, cartes: 12, date: "2026-09-28"}})})});
  const s = o.fenetre.MathsGoSplatSuivi.creer({});
  await s.lancer();
  await tic();
  assert.equal(s.pastilleHtml(), "");
  const bloc = o.document.createElement("p");
  s.dessinerBloc(bloc);
  assert.equal(bloc.hidden, true);
  assert.equal(s.dessinerPied, undefined, "plus de pied dessiné par l'habillage (24/10/2026)");
  assert.equal(o.document.documentElement.classList.contains("suivi-eleve"), false);
  assert.equal(s.attente(), false);
  assert.equal(s.lire().etapes.m1e1.fait, true, "l'ancien contenu se lit tel quel");
  s.ecrire((P, p) => P.enregistrerSerie(p, "m1e2", {fait: true, etoiles: 4, cartes: 4, vues: 1}));
  assert.equal(o.appels.length, 0, "personne n'est suivi : aucun appel");
  const relu = JSON.parse(o.local.getItem(CLE));
  assert.equal(relu.etapes.m1e2.vues, 1);
  assert.equal(relu.etapes.m1e1.fait, true);
  assert.equal(o.local.cles().filter(c => c.startsWith(CLE)).length, 1, "pas de case à code");
  assert.equal(o.document.getElementById("suivi-garde"), null, "pas de question de garde");
});

test("habillage : sous un code, la pastille « ● Léa » (étapes) et la ligne « Suivi · Léa · 405 · Se déconnecter » (carte, en-tête commun du 31/10/2026)", async () => {
  const reseau = fauxReseau();
  const o = fauxOnglet({codeOnglet: A, identite: LEA, fetch: reseau.fetch});
  const s = o.fenetre.MathsGoSplatSuivi.creer({});
  await s.lancer();
  await tic();
  assert.equal(s.pastilleHtml(), '<span class="suivi-pastille" title="Suivi par ton professeur · Léa · 405" aria-label="Suivi par ton professeur · Léa · 405"><i aria-hidden="true"></i><span class="nom">Léa</span></span>');
  assert.ok(o.document.getElementById("suivi-splat-style"), "le style de la pastille est posé une fois");
  const bloc = o.document.createElement("p");
  s.dessinerBloc(bloc);
  assert.equal(bloc.hidden, false);
  // le texte lu : « Suivi · Léa · 405 · Se déconnecter » (« Suivi par ton professeur »
  // raccourci ; la pastille garde le texte entier) ; chaque morceau insécable
  assert.equal(bloc.texte, "Suivi · Léa · 405 · Se déconnecter");
  const morceaux = bloc.descendants().map(n => n.className).filter(Boolean);
  assert.deepEqual(morceaux, ["puce", "repere-texte", "morceau", "morceau repere-prenom", "morceau repere-classe", "sortie-bloc", "sortie"]);
  assert.equal(bloc.descendants().filter(n => n.tagName === "A").length, 0, "plus de lien « Mon espace » en texte : la flèche y mène");
  const [sortie] = bloc.descendants().filter(n => n.tagName === "BUTTON");
  assert.equal(sortie.textContent, "Se déconnecter");
  assert.equal(o.document.documentElement.classList.contains("suivi-eleve"), true, "la page de l'élève venu de son espace est marquée");
  sortie.declencher("click");
  assert.deepEqual(o.fenetre.allees, ["https://suivi.mathsgo.re/?oublier=1"], "« Se déconnecter » : l'espace oublie aussi le code");
  assert.equal(PARCOURS.chargerCode(o.session), "", "l'onglet a oublié le code");
  o.appels.forEach(a => assert.doesNotMatch(a.url, /[?#]/, "le code ne voyage jamais dans une adresse"));
});

test("habillage : le prénom est écrit tel quel, jamais interprété", async () => {
  const o = fauxOnglet({codeOnglet: A, identite: {prenom: "<b>Zoé</b>", classe: "6\"A"}, fetch: fauxReseau({identite: {prenom: "<b>Zoé</b>", classe: "6\"A"}}).fetch});
  const s = o.fenetre.MathsGoSplatSuivi.creer({});
  await s.lancer();
  await tic();
  const html = s.pastilleHtml();
  assert.ok(html.includes("&lt;b&gt;Zoé&lt;/b&gt;") && html.includes("6&quot;A"));
  assert.doesNotMatch(html, /<b>/);
});

test("habillage : hors ligne, la pastille et le bloc passent à l'orange ; au retour du réseau le travail part", async () => {
  const temps = fauxTemps();
  const serveur = fauxServeur();
  serveur.mode = "coupe";
  const o = fauxOnglet({codeOnglet: A, identite: LEA, fetch: serveur.fetch, temps});
  const s = o.fenetre.MathsGoSplatSuivi.creer({});
  await s.lancer();
  await temps.avancer(10);
  s.ecrire((P, p) => P.enregistrerSerie(p, "m1e1", {fait: true, etoiles: 12, cartes: 12, vues: 0}));
  await temps.avancer(800);
  assert.match(s.pastilleHtml(), /class="suivi-pastille hors-ligne" title="Suivi par ton professeur · travail gardé ici, pas encore envoyé"/);
  const bloc = o.document.createElement("p");
  s.dessinerBloc(bloc);
  assert.ok(bloc.classList.contains("hors-ligne"));
  assert.equal(bloc.texte, "Suivi · travail gardé ici, pas encore envoyé · Se déconnecter");
  // la pastille déjà posée par la page se met à jour sur place
  const posee = o.document.poserPastille("<span class=\"suivi-pastille\">…</span>");
  s.majPastilles();
  assert.match(posee.outerHTML, /hors-ligne/);
  assert.equal(o.caseDe(A).etapes.m1e1.fait, true, "le travail est gardé dans la case du code");
  serveur.mode = "ok";
  o.fenetre.declencher("online");
  await temps.avancer(100);
  assert.equal(serveur.etat(A).parcours.etapes.m1e1.fait, true, "au retour du réseau, il part");
  assert.equal(s.etat().etat, "ok");
});

test("habillage : un code qui ne vaut plus rien (404) — pastille et bloc gris, plus rien ne part, rien n'est perdu", async () => {
  const serveur = fauxServeur();
  serveur.forcer = {statut: 404, donnees: {ok: false}};
  const o = fauxOnglet({codeOnglet: A, identite: LEA, fetch: serveur.fetch});
  const s = o.fenetre.MathsGoSplatSuivi.creer({});
  await s.lancer();
  s.ecrire((P, p) => P.enregistrerSerie(p, "m2e1", {fait: true, etoiles: 4, cartes: 4, vues: 0}));
  await tic(20);
  assert.equal(s.etat().etat, "detache");
  assert.match(s.pastilleHtml(), /class="suivi-pastille detache" title="Ton code ne marche plus · demande le nouveau à ton professeur"/);
  const bloc = o.document.createElement("p");
  s.dessinerBloc(bloc);
  assert.ok(bloc.classList.contains("detache"));
  assert.equal(bloc.texte, "Ton code ne marche plus · demande le nouveau à ton professeur · Se déconnecter");
  const avant = o.envois().length;
  s.ecrire((P, p) => P.enregistrerSerie(p, "m2e4", {fait: true, etoiles: 6, cartes: 6, vues: 0}));
  await tic(20);
  assert.equal(o.envois().length, avant, "détaché : plus d'envoi");
  assert.equal(o.caseDe(A).etapes.m2e4.fait, true, "mais le travail se range");
});

test("habillage : un billet — aucune étoile pendant l'échange, puis la case du code ; refusé, le bloc le dit sans « Se déconnecter »", async () => {
  const BILLET = "c".repeat(32);
  const reseau = fauxReseau({billets: {[BILLET]: A}});
  const o = fauxOnglet({entree: {billet: BILLET}, fetch: reseau.fetch,
    local: fauxStockage({[CLE]: JSON.stringify({m1e1: {fait: true, etoiles: 9, cartes: 12}})})});
  const s = o.fenetre.MathsGoSplatSuivi.creer({});
  assert.equal(s.attente(), true, "on ne sait pas encore qui entre : la carte n'affiche rien");
  await s.lancer();
  await tic();
  assert.equal(s.attente(), false);
  assert.equal(s.actif(), true);
  assert.equal(s.lire().etapes.m1e1, undefined, "la case du code, pas celle sans code de l'appareil");
  const refuse = fauxOnglet({entree: {billet: "d".repeat(32)}, fetch: fauxReseau().fetch});
  const r = refuse.fenetre.MathsGoSplatSuivi.creer({});
  await r.lancer();
  await tic();
  assert.equal(r.attente(), false);
  assert.equal(r.etat().etat, "refuse");
  assert.equal(r.pastilleHtml(), "", "pas de pastille sans code");
  const bloc = refuse.document.createElement("p");
  r.dessinerBloc(bloc);
  // le seul geste utile : repasser par l'espace (comme Défi tables)
  assert.equal(bloc.texte, "Ce lien a expiré, repasse par ton espace · Mon espace");
  assert.equal(bloc.descendants().filter(n => n.tagName === "BUTTON").length, 0);
  assert.equal(bloc.descendants().find(n => n.tagName === "A").href, "https://suivi.mathsgo.re/");
});

test("habillage : ecrire() repart de la case telle qu'elle est — ce qu'une autre page de l'onglet y a mis n'est pas perdu", async () => {
  const serveur = fauxServeur();
  const o = fauxOnglet({codeOnglet: A, identite: LEA, fetch: serveur.fetch});
  const s = o.fenetre.MathsGoSplatSuivi.creer({});
  await s.lancer();
  await tic();
  // une autre page du même onglet (un autre outil) a écrit la case depuis
  const ailleurs = PARCOURS.enregistrerSerie(PARCOURS.charger(o.local, A), "enq10", {fait: true, etoiles: 4, cartes: 4, vues: 0});
  PARCOURS.sauver(o.local, ailleurs, A);
  s.ecrire((P, p) => P.enregistrerSerie(p, "enq11", {fait: true, etoiles: 3, cartes: 4, vues: 1}));
  await tic(20);
  const relu = o.caseDe(A);
  assert.equal(relu.etapes.enq10.fait, true);
  assert.equal(relu.etapes.enq11.vues, 1);
  assert.equal(serveur.etat(A).parcours.etapes.enq10.fait, true, "et le serveur reçoit les deux");
});

test("habillage : retour par « précédent » (cache du navigateur) sous un code → la page se recharge, rien de périmé ne part", async () => {
  const o = fauxOnglet({codeOnglet: A, identite: LEA, fetch: fauxServeur().fetch});
  const s = o.fenetre.MathsGoSplatSuivi.creer({});
  await s.lancer();
  await tic();
  const avant = o.appels.length;
  const e = o.fenetre.declencher("pageshow", {persisted: true});
  assert.equal(o.fenetre.rechargee, 1);
  assert.equal(e.arrete, true, "les écouteurs du client ne passent pas");
  assert.equal(o.appels.length, avant);
  o.fenetre.declencher("pageshow", {persisted: false});
  assert.equal(o.fenetre.rechargee, 1, "un chargement ordinaire ne recharge rien");
  // sans code (ni avant ni maintenant) : rien à faire
  const sans = fauxOnglet();
  await sans.fenetre.MathsGoSplatSuivi.creer({}).lancer();
  sans.fenetre.declencher("pageshow", {persisted: true});
  assert.equal(sans.fenetre.rechargee, 0);
});

test("habillage : la garde — après dix minutes, « C'est toujours toi, Léa ? », il faut retaper son code ; « Non » rend l'onglet", async () => {
  const temps = fauxTemps();
  const o = fauxOnglet({codeOnglet: A, identite: LEA, fetch: fauxServeur().fetch, temps});
  const s = o.fenetre.MathsGoSplatSuivi.creer({});
  await s.lancer();
  await temps.avancer(10);
  assert.equal(o.document.getElementById("suivi-garde"), null, "rien avant dix minutes");
  await temps.avancer(11 * 60 * 1000);
  const geste = o.document.declencher("pointerdown", {target: {closest: () => null}});
  assert.equal(geste.retenu, true, "le premier geste après l'absence est retenu");
  const g = s.elementsGarde();
  assert.equal(g.racine.hidden, false);
  assert.equal(g.racine.getAttribute("data-suivi-garde"), "", "le moteur reconnaît la question");
  assert.equal(g.titre.textContent, "C’est toujours toi, Léa ?");
  g.champ.value = "ax kq-7t";
  g.champ.declencher("input");
  assert.equal(g.champ.value, A, "majuscules, sans espace ni tiret");
  g.champ.value = "o1axkq";
  g.champ.declencher("input");
  assert.equal(g.champ.value, "AXKQ", "ni O ni 1 : l'alphabet des codes seulement");
  g.champ.value = "BBBBBB";
  g.oui.declencher("click");
  assert.equal(g.erreur.hidden, false);
  assert.equal(g.erreur.textContent, "Ce n’est pas le bon code.");
  g.champ.value = A;
  g.form.declencher("submit");
  assert.equal(g.racine.hidden, true, "le bon code : la question s'en va");
  assert.equal(s.actif(), true);
  await temps.avancer(11 * 60 * 1000);
  o.document.declencher("visibilitychange");
  assert.equal(g.racine.hidden, false);
  g.non.declencher("click");
  assert.equal(s.actif(), false);
  assert.deepEqual(o.fenetre.allees, ["https://suivi.mathsgo.re/?oublier=1"]);
});

test("habillage : le style ne colore jamais du texte en clair sur fond clair (lisible au tableau)", () => {
  assert.match(SOURCE_SUIVI, /\.suivi-pastille\{[^}]*background:#eef6f6;color:#0b5f5c;/);
  assert.match(SOURCE_SUIVI, /\.suivi-pastille\.hors-ligne\{background:#fdf0e3;color:#8a4c0a;/);
  assert.match(SOURCE_SUIVI, /\.suivi-pastille\.detache\{background:#eceff3;color:#3d4a5a;/);
});

test("habillage : la question de la garde passe au-dessus de tout, y compris la mention « Sans cookie ni traceur » des outils", () => {
  // trouvé au navigateur (banc du lot 2) : la mention, fixée en bas des outils, prenait le clic de « Non »
  const mention = Number(lire("assets/js/mention-confidentialite.js").match(/\.mg-mention-slot\{[^"]*?z-index:(\d+)/)[1]);
  const garde = Number(SOURCE_SUIVI.match(/\.suivi-garde\{[^"]*?z-index:(\d+)/)[1]);
  assert.ok(garde > mention && garde <= 2147483647, `garde ${garde}, mention ${mention}`);
});

test("equasplat.html : au téléphone, avec « Passer ▶ » ou un message, la pastille ne garde que son point (la barre tient sur une ligne)", () => {
  // mesuré au navigateur (banc du lot 2, de 360 à 414 px, douze pastilles) : avec le prénom, la barre passait sur deux lignes
  const css = PAGES.equa.slice(PAGES.equa.indexOf("@media (max-width:760px){\n    body.importMode.eleveMode{display:flex"));
  const bloc = css.slice(0, css.indexOf("\n  }\n"));
  assert.match(bloc, /#eleveBarre #elevePasser \+ \.suivi-pastille,\n\s*body\.importMode\.eleveMode #eleveBarre \.eleveBarreNote \+ \.suivi-pastille\{margin-left:-4px;padding:2px 5px;gap:0\}/);
  assert.match(bloc, /#eleveBarre #elevePasser \+ \.suivi-pastille \.nom,\n\s*body\.importMode\.eleveMode #eleveBarre \.eleveBarreNote \+ \.suivi-pastille \.nom\{display:none\}/);
  assert.match(PAGES.equa, /#eleveBarre #elevePasser \+ \.suivi-pastille\{margin-left:0\}/);
});

// ------------------------------------------------------------- les outils

const OUTILS = [["splat.html", "classique"], ["splat_tache_barre.html", "petit"]];

for (const [nom, cle] of OUTILS) {
  test(`${nom} : une série toute verte → l'étoile, vues 0, une seule série comptée (l'écran de fin redemande l'enregistrement)`, () => {
    const o = fauxOnglet();
    const t = outilClassiqueOuPetit(cle, o);
    t.regler({idx: 0, res: [true]});
    t.eleveSauverEnCours();
    t.regler({idx: 3, res: [true, true, true, true], etoiles: 4});
    t.eleveSauverEnCours(); // la dernière carte : la fin s'enregistre tout de suite
    t.eleveEnregistrerReussite(4, 4); // puis l'écran de fin
    const e = o.caseDe().etapes.p;
    assert.deepEqual([e.fait, e.etoiles, e.cartes, e.vues, e.essais, e.enCours], [true, 4, 4, 0, 1, undefined]);
  });

  test(`${nom} : une carte dont la réponse a été montrée, puis rejouée (orange) → l'étoile, mais vues 1`, () => {
    const o = fauxOnglet();
    const t = outilClassiqueOuPetit(cle, o, {parcoursId: "m2e1"});
    t.regler({idx: 1, res: [true, "ko"], vues: 1});
    t.eleveSauverEnCours();
    let e = o.caseDe().etapes.m2e1;
    assert.deepEqual(e.enCours, {sig: "SIG", idx: 2, etoiles: 0, res: [true, "ko"]}, "la reprise, locale");
    assert.equal(e.vues, 1, "le compte, dans l'étape");
    t.regler({idx: 3, res: [true, "ko", true, true], etoiles: 3});
    t.eleveSauverEnCours(); // fin de série avec une rouge : retour sur « Encore 1 carte ! »
    e = o.caseDe().etapes.m2e1;
    assert.equal(e.fait, false);
    assert.equal(e.idx, 4);
    t.regler({idx: 1, rejeu: [], res: [true, false, true, true]}); // la rouge rejouée devient orange
    t.eleveSauverEnCours();
    e = o.caseDe().etapes.m2e1;
    assert.deepEqual([e.fait, e.etoiles, e.vues, e.essais, e.enCours], [true, 3, 1, 1, undefined]);
    assert.deepEqual(Object.keys(PARCOURS.pourServeur(o.caseDe()).etapes.m2e1), ["fait", "etoiles", "cartes", "vues", "essais", "date"],
      "ce qui part au serveur : les comptes, jamais la reprise");
  });

  test(`${nom} : la meilleure série gagne — une série bâclée ne remplace pas une étoile sans aide`, () => {
    const o = fauxOnglet();
    let t = outilClassiqueOuPetit(cle, o);
    t.regler({idx: 3, res: [true, true, true, true], etoiles: 4});
    t.eleveSauverEnCours();
    t = outilClassiqueOuPetit(cle, o); // on rejoue la même étape plus tard
    t.regler({idx: 3, rejeu: [], res: [false, false, true, false], vues: 2, etoiles: 1});
    t.eleveSauverEnCours();
    const e = o.caseDe().etapes.p;
    assert.deepEqual([e.fait, e.etoiles, e.vues, e.essais], [true, 4, 0, 2]);
  });

  test(`${nom} : reprise — les réponses montrées d'une série pas encore étoilée reviennent, rouges rejouées comprises`, () => {
    const o = fauxOnglet();
    const t = outilClassiqueOuPetit(cle, o);
    t.regler({idx: 3, res: [true, "ko", "ko", true], vues: 2, etoiles: 2});
    t.eleveSauverEnCours();
    t.regler({idx: 1, rejeu: [2], res: [true, false, "ko", true]}); // une rouge rejouée, il en reste une ; on ferme
    t.eleveSauverEnCours();
    const e = t.eleveEtapeLue();
    assert.deepEqual(e.enCours.res, [true, false, "ko", true]);
    assert.equal(t.eleveVuesReprise(e, e.enCours.res), 2, "pas 1 : la rouge rejouée compte toujours");
    assert.equal(t.eleveVuesReprise({fait: true, vues: 0}, [true, "ko"]), 1, "une étape étoilée : on compte ce qui reste rouge");
  });

  test(`${nom} : « Rejouer toute la série » efface la reprise (l'étoile reste) et n'écrit rien quand rien n'est en cours`, () => {
    const o = fauxOnglet();
    const t = outilClassiqueOuPetit(cle, o);
    t.regler({idx: 3, res: [true, true, true, true], etoiles: 4});
    t.eleveSauverEnCours();
    const ecritures = [];
    const ecrire = o.local.setItem;
    o.local.setItem = (k, v) => { ecritures.push(k); ecrire(k, v); };
    t.eleveEffacerEnCours();
    assert.deepEqual(ecritures, [], "rien en cours : rien d'écrit, rien d'envoyé");
    o.local.setItem = ecrire;
    t.regler({nouvelleSerie: true, idx: 1, res: [true, "ko"], vues: 1});
    t.eleveSauverEnCours();
    t.eleveEffacerEnCours();
    const e = o.caseDe().etapes.p;
    assert.equal(e.fait, true);
    assert.equal(e.enCours, undefined);
  });

  test(`${nom} : sous un code, la série part au serveur avec ses comptes, dans la case du code`, async () => {
    const serveur = fauxServeur();
    const o = fauxOnglet({codeOnglet: A, identite: LEA, fetch: serveur.fetch});
    const t = outilClassiqueOuPetit(cle, o, {parcoursId: "m2e1"});
    t.regler({idx: 3, rejeu: [], res: [true, false, true, true], vues: 1, etoiles: 3});
    t.eleveSauverEnCours();
    await tic(20);
    assert.deepEqual(serveur.etat(A).parcours.etapes.m2e1, {fait: true, etoiles: 3, cartes: 4, vues: 1, essais: 1, date: PARCOURS.jourLocal()});
    assert.equal(o.caseDe("").etapes.m2e1, undefined, "rien dans la case sans code");
    assert.match(t.eleveSuiviPastilleHtml(), /<span class="nom">Léa<\/span><\/span>$/);
  });

  test(`${nom} : les fonctions gardent leur nom ; plus aucune écriture directe dans le stockage`, () => {
    const page = PAGES[cle];
    for (const f of ["eleveEnregistrerReussite", "eleveSauverEnCours", "eleveSauverFinDeSerie", "eleveEffacerEnCours"]) assert.ok(source(page, f));
    assert.doesNotMatch(page, /ELEVE_STORE_KEY|localStorage\.setItem\(|mathsgo-splat-parcours/);
    // la 3e erreur compte une réponse montrée, une seule fois par carte
    assert.match(page, /if ?\(eleveResultats\[eleveIdx\] !== ["']ko["']\) eleveVues\+\+;[^\n]*\n\s*eleveResultats\[eleveIdx\] = ["']ko["'];/);
    // la pastille au bout de la barre du haut
    assert.match(page, /elevePastillesHtml\(\)(?: \+ |\}\$\{)eleveSuiviPastilleHtml\(\)/);
  });
}

test("equasplat.html : eleveLireEntree / eleveEcrireEntree gardent leur forme (resolues), par le moteur", () => {
  const o = fauxOnglet();
  const t = outilEqua(o);
  t.regler({idx: 0, res: ["ko"], vues: 1});
  t.eleveSauverEnCours();
  let entree = t.eleveLireEntree();
  assert.deepEqual(entree.enCours, {sig: t.eleveSignatureSerie(), idx: 1, resolues: 0, res: ["ko"]});
  assert.equal(entree.vues, 1);
  assert.equal(o.caseDe().etapes.p.enCours.etoiles, 0, "rangé « etoiles » par le moteur");
  // « Rejouer toute la série » : {} efface la reprise ; rien en cours → rien d'écrit
  t.eleveEcrireEntree({});
  assert.equal(t.eleveLireEntree().enCours, undefined);
  const ecritures = [];
  const ecrire = o.local.setItem;
  o.local.setItem = (k, v) => { ecritures.push(k); ecrire(k, v); };
  t.eleveEcrireEntree({});
  assert.deepEqual(ecritures, [], "rien en cours : rien d'écrit, rien d'envoyé");
});

test("equasplat.html : une équation passée puis résolue au rejeu → l'étoile, vues 1, une seule série comptée", () => {
  const o = fauxOnglet();
  const t = outilEqua(o);
  t.regler({idx: 1, res: [true, "ko"], vues: 1, resolues: 1});
  t.eleveSauverEnCours();
  t.regler({idx: 3, res: [true, "ko", true, true], resolues: 3});
  t.eleveSauverEnCours();
  assert.equal(o.caseDe().etapes.p.idx, 4, "fin avec une rouge");
  t.regler({idx: 1, rejeu: [], res: [true, true, true, true], resolues: 4});
  t.eleveSauverEnCours(); // la dernière rouge résolue : l'étoile
  t.eleveEcrireEntree({fait: true, etoiles: 4, cartes: 4, date: "2026-10-08"}); // puis l'écran de fin
  const e = o.caseDe().etapes.p;
  assert.deepEqual([e.fait, e.etoiles, e.cartes, e.vues, e.essais], [true, 4, 4, 1, 1]);
  assert.match(PAGES.equa, /if\(eleveRes\[eleveIdx\] !== "ko"\) eleveVues\+\+;[^\n]*\n    eleveRes\[eleveIdx\] = "ko";/, "« Passer » compte une réponse vue");
  assert.doesNotMatch(PAGES.equa, /ELEVE_STORE_KEY|localStorage\.setItem\(|mathsgo-splat-parcours/);
  assert.match(source(PAGES.equa, "eleveBarreHtml", "  "), /eleveSuiviPastilleHtml\(\);/, "la pastille au bout de la barre");
});

test("equasplat.html : reprise — le compte des équations passées revient, et repart de zéro avec « Rejouer toute la série »", () => {
  const f = PAGES.equa;
  assert.match(source(f, "eleveDemarrerSerie", "  "), /eleveVues = 0; eleveSerieNotee = false;\n    const entree = eleveLireEntree\(\);/);
  assert.equal((source(f, "eleveDemarrerSerie", "  ").match(/eleveVues = eleveVuesReprise\(entree, /g) || []).length, 2, "les deux reprises");
  assert.match(source(f, "eleveFinDeSerie", "  "), /eleveIdx = 0; eleveResolues = 0; eleveRes = \[\]; eleveRejeu = null; eleveVues = 0; eleveSerieNotee = false;\n      eleveEcrireEntree\(\{\}\);/);
});

test("les trois outils créent le suivi au premier besoin, seulement dans le parcours (?parcours=)", () => {
  assert.match(source(PAGES.classique, "eleveSuivi"), /if\(parcoursId && window\.MathsGoSplatSuivi\)\{/);
  assert.match(source(PAGES.petit, "eleveSuivi"), /if \(parcoursId && window\.MathsGoSplatSuivi\) \{/);
  assert.match(source(PAGES.equa, "eleveSuivi", "  "), /if\(eleveParcours && window\.MathsGoSplatSuivi\)\{/);
  // hors parcours : pas de suivi, pas de pastille
  const o = fauxOnglet({codeOnglet: A, identite: LEA});
  const t = outilClassiqueOuPetit("classique", o, {parcoursId: ""});
  assert.equal(t.eleveSuivi(), null);
  assert.equal(t.eleveSuiviPastilleHtml(), "");
  assert.equal(o.appels.length, 0);
});

// ------------------------------------------------------- confidentialité

test("confidentialite.html nomme les nouvelles clés de SPLAT! sur l'appareil", () => {
  const page = lire("confidentialite.html");
  for (const cle of ["mathsgo-splat-parcours", "mathsgo-splat-parcours:CODE", "mathsgo-splat-sync:CODE", "mathsgo-splat-sel", "mathsgo-splat-univers"]) {
    assert.ok(page.includes(`<code>${cle}</code>`), cle);
  }
});
