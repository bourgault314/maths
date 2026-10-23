import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = join(racine, "_serveur/public/index.php");
const CATALOGUE = join(racine, "_serveur/public/lib/applis.php");
const page = readFileSync(PAGE, "utf8");
const catalogue = readFileSync(CATALOGUE, "utf8");

// Lot « espace élève » (07/09/2026). La page d'accueil des élèves accueillera
// plusieurs activités, puis des liens vers des cours. Trois choses doivent
// tenir dans le temps, et c'est ce que ce fichier garde.

test("« Se déconnecter » est dans l'en-tête, pas au fil de la page", () => {
  const entete = page.match(/<header>[\s\S]*?<\/header>/);
  assert.ok(entete, "la page doit avoir un <header>");
  assert.match(entete[0], /id="changer"[\s\S]*?Se déconnecter/,
    "le bouton doit être dans l'en-tête : plus bas, il passe sous la ligne de flottaison dès qu'il y a plusieurs activités");
  assert.equal((page.match(/id="changer"/g) || []).length, 1, "un seul bouton de déconnexion");
  const principal = page.match(/<main>[\s\S]*?<\/main>/);
  assert.doesNotMatch(principal[0], /id="changer"/, "et nulle part ailleurs");
});

test("l'en-tête ne montre la classe et la sortie qu'à un élève entré", () => {
  assert.match(page, /<div class="entete-droite" id="entete-droite" hidden>/,
    "avant l'entrée du code, il n'y a rien à montrer");
  assert.match(page, /\$\("entete-droite"\)\.hidden = false;/, "l'entrée le montre");
  assert.match(page, /\$\("entete-droite"\)\.hidden = true;/, "la déconnexion le cache");
});

test("la liste des activités est une grille qui s'adapte au nombre d'applis", () => {
  assert.match(page, /grid-template-columns: repeat\(auto-fit, minmax\(\d+px, 1fr\)\)/,
    "une seule mise en page : large à une activité, en colonnes quand il y en a plusieurs — rien à réécrire en ajoutant une appli");
});

// Le dessin est choisi dans un tableau écrit DANS la page. Rien de ce qui vient
// du serveur ne doit entrer dans la page autrement que par textContent : c'est
// la règle qui protège la page depuis le lot B, et une icône ne l'entame pas.
test("les dessins sont écrits dans la page, jamais construits avec une valeur du serveur", () => {
  assert.match(page, /function icone\(cle\) \{\s*\n\s*return Object\.prototype\.hasOwnProperty\.call\(ICONES, cle\) \? ICONES\[cle\] : ICONE_DEFAUT;/,
    "la clé de l'appli ne sert qu'à choisir dans une liste fermée");
  const innerHTML = page.match(/\.innerHTML = [^\n]*\n?[^\n]*/g) || [];
  for (const ligne of innerHTML) {
    const valeursServeur = ligne.match(/\$\{appli\.(\w+)/g) || [];
    assert.deepEqual(valeursServeur, [], `${ligne.trim()} : aucune valeur du serveur ne s'écrit en HTML`);
  }
  assert.doesNotMatch(page, /<img[^>]+src="https?:\/\//, "aucune image d'un autre domaine (politique de contenu)");
});

test("chaque appli du catalogue a son propre dessin", () => {
  const cles = [...catalogue.matchAll(/^\s{4}'([a-z0-9-]+)' => \[$/gm)].map(m => m[1]);
  assert.ok(cles.length >= 5, "le catalogue doit être lisible ici");
  // Dans le tableau ICONES lui-même : depuis le lot « splat-suivi-3 », JAUGES
  // porte aussi des clés d'appli, et ne dessine pas d'icône.
  const debut = page.indexOf("  const ICONES = {");
  const icones = page.slice(debut, page.indexOf("\n  };", debut));
  assert.ok(debut > 0 && icones.length > 1000, "la page doit ranger ses dessins dans ICONES");
  assert.doesNotMatch(icones, /"splat-equations":/, "l'ancienne clé est renommée « splat » (07/10/2026)");
  for (const cle of cles) {
    assert.ok(icones.includes(`"${cle}":`),
      `l'appli « ${cle} » n'a pas de dessin dans ICONES : une activité au dessin générique a l'air inachevée. `
      + `Ajoute-le dans _serveur/public/index.php.`);
  }
});

// 07/09/2026 — les activités annoncées : elles s'affichaient pour toutes les
// classes, sans lien, avec une pastille « Bientôt ». Lot « retours de classe »
// (06/10/2026, décision de Gwenaël) : plus d'annonces — une appli n'apparaît
// que lorsqu'elle existe. Le catalogue garde son ordre (celui des tuiles le
// jour où elles s'ouvrent).

test("l'ordre d'affichage du catalogue est celui décidé le 07/09/2026", () => {
  const cles = [...catalogue.matchAll(/^\s{4}'([a-z0-9-]+)' => \[$/gm)].map(m => m[1]);
  // « splat-equations » est devenu « splat » le 07/10/2026 (lot splat-suivi-3), à la même place ;
  // Coffres magiques juste après Défi tables (lot « Coffres magiques sur le suivi », 21/10/2026),
  // puis Anzan (lot « Qui voit quoi », lot 4a, 23/10/2026 : les applis de calcul mental ensemble).
  assert.deepEqual(cles, ["defi-tables", "coffres", "flash-anzan", "defi-calcul", "automatismes", "splat", "soley"],
    "l'ordre du tableau CATALOGUE_APPLIS est l'ordre des tuiles chez l'élève");
});

test("plus d'annonces « Bientôt » : seules les applis ouvertes de la classe sont envoyées et montrées", () => {
  assert.doesNotMatch(catalogue, /foreach \(CATALOGUE_APPLIS as \$cle => \$appli\)/,
    "le serveur n'ajoute plus les activités pas encore ouvertes");
  assert.match(catalogue, /if \(!\(CATALOGUE_APPLIS\[\$cle\]\['disponible'\] \?\? false\) \|\| !CATALOGUE_APPLIS\[\$cle\]\['url'\]\) continue;/,
    "une activité pas encore ouverte, même dans la liste de la classe, n'est pas envoyée");
  assert.doesNotMatch(page, /class="pastille"|"appli bientot"|\.appli\.bientot|>Bientôt</, "la page n'a plus de quoi dessiner une tuile « Bientôt »");
  assert.match(page, /const disponibles = \(donnees\.applis \|\| \[\]\)\.filter\(a => a\.disponible && a\.url\);/,
    "un serveur d'avant qui enverrait encore des annonces : elles sont ignorées");
});

// -------------------------------------------------------------------------
// Lot « cohérence des sorties » (08/09/2026). Gwenaël a créé cet espace pour
// que ses élèves n'aillent pas sur mathsgo.re ; le pied de page les y renvoyait
// depuis la première version, et la page de confidentialité du site, écrite
// pour un visiteur, les déposait ensuite sur l'accueil du site. Un élève entré
// par son code ne quitte plus son espace, quel que soit le lien cliqué.

const INFOS = join(racine, "_serveur/public/infos.php");
const infos = readFileSync(INFOS, "utf8");

test("le pied de l'espace ne propose qu'une chose, et elle reste dans l'espace", () => {
  const pied = page.match(/<footer>[\s\S]*?<\/footer>/);
  assert.ok(pied, "la page doit avoir un pied");
  const adresses = [...pied[0].matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(adresses, ["infos.php"], "un seul lien, vers la page Infos de l'espace");
  assert.doesNotMatch(page, /https?:\/\/mathsgo\.re/,
    "plus aucune adresse du site dans la page de l'espace élève");
});

test("la page Infos ne fait sortir personne", () => {
  assert.doesNotMatch(infos, /href="https?:\/\//,
    "aucun lien vers un autre domaine : les adresses du site sont écrites en texte");
  assert.match(infos, /href="\.\/"[^>]*>← Retour à mon espace/,
    "le seul bouton ramène à l'espace");
  assert.match(infos, /href="mailto:gwenael@mathsgo\.re/,
    "l'adresse de l'éditeur (obligation légale) ouvre la messagerie de l'appareil, sans quitter la page");
  assert.match(infos, /entetes_page\(\);/,
    "mêmes en-têtes que l'accueil : politique de contenu et Cache-Control: no-store");
  assert.doesNotMatch(infos, /<script/, "pas de script : rien à exécuter sur cette page");
  assert.doesNotMatch(infos, /<img[^>]+src="https?:\/\//,
    "aucune image d'un autre domaine (politique de contenu)");
});

// Le mot « compte » est le cœur du problème signalé par Gwenaël : la page du
// site dit « maths&go ne crée pas de compte élève » à un enfant qui se croit
// connecté à un compte. Ici on dit « espace », et le mot « compte » n'apparaît
// que dans la phrase qui explique que ce n'en est pas un.
test("la page Infos dit « espace », jamais « compte »", () => {
  const corps = infos.slice(infos.indexOf("<body>"));
  const occurrences = corps.match(/\bcomptes?\b/g) || [];
  assert.equal(occurrences.length, 1, `« compte » apparaît ${occurrences.length} fois au lieu d'une`);
  assert.match(corps, /Ce n’est pas un compte : il n’y a pas d’identifiant/,
    "la seule occurrence est celle qui dit que ce n'en est pas un");
  assert.ok(corps.includes("ton espace"), "le mot employé partout ailleurs est « espace »");
});

// Le « précédent » du navigateur après une déconnexion. Chrome ressort une
// page entière de son cache arrière/avant sans réexécuter le script, même en
// « no-store », tant qu'aucun cookie n'entre en jeu — et l'espace n'en pose
// aucun. Ce test EXÉCUTE le gestionnaire tel qu'il est écrit dans la page :
// une assertion sur le texte du fichier décrirait l'intention au lieu de la
// vérifier.
function executerPageshow({persisted, codeEnMemoire}) {
  const debut = page.indexOf("  function revenirAuCode() {");
  assert.ok(debut > 0, "la page doit ranger le ménage dans une fonction");
  const ancre = page.indexOf('window.addEventListener("pageshow"', debut);
  assert.ok(ancre > debut, "la page doit écouter « pageshow »");
  const fin = page.indexOf("\n  });", ancre) + "\n  });".length;
  const source = page.slice(debut, fin);

  const elements = new Map();
  const $ = id => {
    if (!elements.has(id)) {
      elements.set(id, {
        id, hidden: false, textContent: "", value: "", ecouteurs: {},
        focus() {},
        addEventListener(type, fn) { this.ecouteurs[type] = fn; }
      });
    }
    return elements.get(id);
  };
  // L'écran tel qu'il revient du cache : celui du précédent élève.
  $("titre").textContent = "Bonjour Léa";
  $("classe").textContent = "405";
  $("classe").hidden = false;
  $("entete-droite").hidden = false;
  $("applis").textContent = "Défi tables";
  $("code").value = "ABC123";
  $("ecran-code").hidden = true;
  $("ecran-espace").hidden = false;

  let gestionnaire = null;
  const fenetre = {addEventListener(type, fn) { if (type === "pageshow") gestionnaire = fn; }};
  const nettoyer = brut => (brut || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  // Le premier écran (05/10/2026) : l'écran du code cache l'en-tête (classe
  // « sur-code » sur <body>) et redessine ses six cases. L'espace du
  // précédent élève avait l'en-tête, et ses cases pouvaient garder son code.
  const classesCorps = new Set();
  const documentFactice = {body: {classList: {
    add: c => classesCorps.add(c), remove: c => classesCorps.delete(c)
  }}};
  const dessins = {n: 0};
  // Séance en direct (07/10/2026) : le ménage arrête aussi la surveillance de
  // la séance et retire sa tuile — sinon la tuile « Séance en direct » de la
  // classe du précédent élève resterait posée sur l'écran du code.
  const directs = {arrets: 0};
  new Function("$", "window", "ecrireCode", "lireCode", "nettoyer", "afficherErreur",
               "dessinerCases", "document", "arreterDirect", source)(
    $, fenetre, () => {}, () => codeEnMemoire, nettoyer, () => {},
    () => { dessins.n += 1; }, documentFactice, () => { directs.arrets += 1; });
  assert.ok(gestionnaire, "le gestionnaire de « pageshow » doit être posé");
  gestionnaire({persisted});
  return {$, elements, classesCorps, dessins, directs};
}

// Le bouton et le retour de cache doivent faire EXACTEMENT le même ménage :
// c'est la raison d'être de la fonction commune. Ce test exécute l'autre
// chemin, celui du bouton, sur le même écran de départ.
test("« Se déconnecter » fait le même ménage que le retour de cache", () => {
  const {$, classesCorps, dessins, directs} = executerPageshow({persisted: false, codeEnMemoire: "ABC123"});
  $("changer").ecouteurs.click();
  assert.equal(directs.arrets, 1, "la surveillance de la séance en direct s'arrête, sa tuile part");
  assert.ok(classesCorps.has("sur-code"), "l'écran du code retrouve sa mise en page (sans en-tête)");
  assert.equal(dessins.n, 1, "les six cases sont redessinées : vides");
  assert.equal($("ecran-code").hidden, false);
  assert.equal($("ecran-espace").hidden, true);
  assert.equal($("titre").textContent, "Mon espace");
  assert.equal($("classe").textContent, "");
  assert.equal($("entete-droite").hidden, true);
  assert.equal($("applis").textContent, "");
  assert.equal($("code").value, "");
});

test("après « Se déconnecter », le bouton « précédent » ne rouvre pas l'espace", () => {
  const {$, classesCorps, dessins, directs} = executerPageshow({persisted: true, codeEnMemoire: ""});
  assert.equal(directs.arrets, 1, "la tuile « Séance en direct » du précédent élève part avec le reste");
  assert.ok(classesCorps.has("sur-code"), "l'en-tête du précédent élève est caché");
  assert.equal(dessins.n, 1, "ses cases ne gardent pas son code");
  assert.equal($("ecran-code").hidden, false, "l'écran du code revient");
  assert.equal($("ecran-espace").hidden, true, "l'espace est refermé");
  assert.equal($("titre").textContent, "Mon espace", "le prénom du précédent élève a disparu");
  assert.equal($("classe").textContent, "", "sa classe aussi");
  assert.equal($("classe").hidden, true);
  assert.equal($("entete-droite").hidden, true, "et la sortie n'a plus lieu d'être");
  assert.equal($("applis").textContent, "", "ses activités aussi");
  assert.equal($("code").value, "", "le champ est vide");
});

test("le retour d'un cache ne dérange pas un élève encore identifié", () => {
  const {$} = executerPageshow({persisted: true, codeEnMemoire: "ABC123"});
  assert.equal($("ecran-espace").hidden, false, "l'onglet a encore son code : rien ne bouge");
  assert.equal($("titre").textContent, "Bonjour Léa");
});

test("un affichage ordinaire (pas un retour de cache) ne touche à rien", () => {
  const {$} = executerPageshow({persisted: false, codeEnMemoire: ""});
  assert.equal($("ecran-espace").hidden, false,
    "sans « persisted », le script de la page vient de s'exécuter : c'est lui qui décide");
  assert.equal($("titre").textContent, "Bonjour Léa");
});

// -------------------------------------------------------------------------
// Lot « jauges » (08/09/2026). La tuile d'une activité COMMENCÉE porte une
// barre, « 4 tables acquises sur 9 », le badge de rang, et « Mon mélange à
// faire » quand il est dû. Trois règles tiennent tout ce qui suit, et ce sont
// elles que ce bloc garde :
//   1. la grille s'affiche d'abord, entière ; la jauge arrive après et ne peut
//      jamais l'empêcher d'exister (serveur muet, réponse illisible, moteur
//      absent : la tuile reste ce qu'elle était, sans message d'erreur) ;
//   2. c'est le MOTEUR de l'activité qui lit son parcours, pas cette page ;
//   3. rien de ce qui vient du serveur n'entre autrement que par textContent.
//
// Sabotages attendus (chacun rend un test rouge) :
//   f) compter les tables acquises dans la page au lieu d'appeler le moteur
//   g) enlever le garde-fou « aucune table acquise » (`if (!fait) return null`)
//      → une tuile jamais ouverte, ou jouée sans réussir encore une table,
//      afficherait « 0 table acquise sur 9 » au-dessus d'une barre vide
//   h) charger le moteur depuis mathsgo.re
//   i) attendre (await) la jauge avant d'afficher la grille
//   j) écrire le compte avec innerHTML
//   k) mettre le code de l'élève dans l'adresse de api/parcours.php
//   q) retirer l'écouteur « error » du chargement du moteur → la promesse ne
//      se résout jamais et le test « moteur introuvable » expire
//   t) inverser la largeur de la barre (`1 - part`) ou l'écrire en dur
//      (`100%`) → la barre ne suit plus le compte

const MOTEUR_SERVI = join(racine, "_serveur/public/prof/defi_tables_mon_parcours.js");
const { createRequire } = await import("node:module");
const PARCOURS = createRequire(import.meta.url)(MOTEUR_SERVI);

// La fonction de lecture telle qu'elle est ÉCRITE dans la page, exécutée sur
// le vrai moteur : une assertion sur le texte du fichier décrirait l'intention
// au lieu de la vérifier.
// Depuis le lot « splat-suivi-3 », chaque entrée de JAUGES porte l'adresse de
// son moteur, son nom dans la fenêtre et son lecteur : on rend les lecteurs.
function lecteurDeJauge() {
  const debut = page.indexOf("  const JAUGES = {");
  assert.ok(debut > 0, "la page doit ranger ses lecteurs de jauge dans JAUGES");
  // Lot « fignolage du 22/10 » : le lecteur de Défi tables appelle deux
  // fonctions écrites juste après JAUGES (badgeDefiTables,
  // aujourdhuiDefiTables) — on les prend avec, jusqu'au chargeur de moteur.
  const fin = page.indexOf("  // Un moteur est chargé UNE fois", debut);
  assert.ok(fin > debut, "les aides du lecteur de Défi tables sont rangées avant le chargeur de moteur");
  const source = page.slice(debut, fin) + "\n  return JAUGES;";
  const jauges = new Function(source)();
  const lecteurs = {};
  Object.keys(jauges).forEach(cle => { lecteurs[cle] = jauges[cle].lecteur; });
  return lecteurs;
}

function parcoursFabrique({acquises = 0, melangeAJour = false, etoiles = 0} = {}) {
  const parcours = PARCOURS.normaliserParcours(PARCOURS.creerParcours());
  PARCOURS.TABLES.slice(0, acquises).forEach(table => { parcours.tables[table].acquise = "2026-09-05"; });
  parcours.melange.aJour = melangeAJour;
  parcours.expert.etoiles = etoiles;
  if (etoiles >= PARCOURS.ETOILES_MAX) parcours.expert.couronne = "2026-09-08";
  parcours.rang = PARCOURS.rangDeLEtat(parcours);
  return parcours;
}

test("le compte de la tuile est mot pour mot celui de l'accueil de Défi tables", () => {
  const lire = lecteurDeJauge()["defi-tables"];
  // Lot « un seul système » (05/10/2026) : la table est « passée », ici comme
  // sur l'accueil de l'appli.
  assert.equal(lire(PARCOURS, parcoursFabrique({acquises: 4})).compte, "4 tables passées sur 9");
  assert.equal(lire(PARCOURS, parcoursFabrique({acquises: 1})).compte, "1 table passée sur 9",
    "au singulier, comme sur l'accueil : « 1 table passée »");
  assert.equal(lire(PARCOURS, parcoursFabrique({acquises: 9, melangeAJour: true})).compte,
    "9 tables passées sur 9");
  const appli = readFileSync(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");
  assert.match(appli, /\$\("acc-acquises"\)\.textContent = `\$\{nombre\} table\$\{nombre > 1 \? "s" : ""\} passée\$\{nombre > 1 \? "s" : ""\} sur \$\{PARCOURS_TABLES\.length\}`;/,
    "mot pour mot la phrase de l'accueil");
});

test("la jauge lit le parcours par le moteur, jamais par la page", () => {
  const jauges = page.slice(page.indexOf("  const JAUGES = {"), page.indexOf("\n  };", page.indexOf("  const JAUGES = {")));
  assert.match(jauges, /P\.normaliserParcours\(brut\)/, "le parcours reçu passe d'abord par le moteur");
  assert.match(jauges, /P\.etatAffichage\(parcours\)/, "et c'est le moteur qui dit l'état");
  // « acquise », « rang » et « mélange » sont les règles du moteur, et elles
  // ont changé le 08/09/2026 (lot 3). Les relire ici, c'est les réécrire.
  assert.doesNotMatch(jauges, /parcours\.tables|\.acquise\b|parcours\.rang|parcours\.melange/,
    "la page ne doit pas fouiller le parcours elle-même");
});

// Lot « un seul système » (05/10/2026) : Mon mélange est libre, il ne bloque
// plus rien — la tuile n'a donc plus de note orange « Mon mélange à faire ».
test("le rang de la tuile est celui de l'état ; plus jamais de « Mon mélange à faire » (le mélange est libre)", () => {
  const lire = lecteurDeJauge()["defi-tables"];
  const quatre = lire(PARCOURS, parcoursFabrique({acquises: 4}));
  assert.equal(quatre.rang.nom, "Argent", "3 tables passées ouvrent Argent (règle du moteur)");
  assert.equal(quatre.note, "", "mélange jamais joué : rien d'orange dans la tuile, il ne bloque rien");
  const ajour = lire(PARCOURS, parcoursFabrique({acquises: 4, melangeAJour: true}));
  assert.equal(ajour.note, "", "mélange réussi : rien non plus");
  assert.doesNotMatch(page, /"Mon mélange à faire"|etat\.melange\.du\b/, "la page ne lit plus de mélange « dû »");
  // Les 9 tables passées suffisent pour Platine : plus besoin du mélange.
  const neuf = lire(PARCOURS, parcoursFabrique({acquises: 9}));
  assert.equal(neuf.rang.nom, "Platine", "9 tables passées, mélange jamais joué : Platine quand même");
  assert.equal(neuf.note, "");
  const legende = lire(PARCOURS, parcoursFabrique({acquises: 9, melangeAJour: true, etoiles: 5}));
  assert.equal(legende.rang.cle, "legende");
  assert.equal(legende.fait, legende.total, "la barre est pleine");
});

// Lot « fignolage du 22/10 » (choix de Gwenaël) : un parcours tout neuf (l'appli
// ouverte, rien de joué) n'a toujours ni barre, ni compte, ni rang — mais la
// pastille « Aujourd'hui » dit par où commencer. L'élève qui n'a JAMAIS ouvert
// Défi tables n'a pas de parcours sur le serveur : lireParcours rend null et
// le lecteur n'est pas appelé (test « aucun parcours » plus bas).
test("un parcours tout neuf : ni barre, ni compte, ni rang — la pastille « Aujourd'hui » seule", () => {
  const lire = lecteurDeJauge()["defi-tables"];
  assert.deepEqual(lire(PARCOURS, PARCOURS.creerParcours()), {aujourdhui: {faite: false, texte: "\u{1F514} Aujourd’hui\u00a0: la table de\u00a02"}},
    "une barre vide n'apprend rien à l'élève et ressemble à un reproche ; « par où commencer » si");
  assert.equal(lire(PARCOURS, "pas un objet"), null, "un parcours illisible : rien");
  assert.equal(lire(PARCOURS, null), null);
  assert.equal(lire(PARCOURS, []), null);
});

// Le jour de la distribution des codes : l'élève ouvre l'appli, s'entraîne,
// et n'acquiert pas encore de table (20 bonnes réponses en 1 min 30, 2 erreurs
// au plus). Son parcours n'est plus vide — un score a bougé — mais sa tuile
// n'a toujours rien à montrer : « 0 table acquise sur 9 » au-dessus d'une
// barre vide est le symétrique exact de ce qu'on refuse à la carte de classe
// du professeur. Trouvé par Claude Code le 09/09/2026, sur la vraie page.
test("une activité ouverte et jouée sans table acquise n'a pas de barre non plus — la pastille seule", () => {
  const lire = lecteurDeJauge()["defi-tables"];
  const joue = parcoursFabrique();
  joue.tables[PARCOURS.TABLES[0]].entraine[PARCOURS.ENTRAINEMENTS[0]] = 1;
  joue.jours = ["2026-09-09"];
  const relu = PARCOURS.normaliserParcours(JSON.parse(JSON.stringify(joue)));
  assert.equal(PARCOURS.estVide(relu), false,
    "le parcours a bien bougé : ce n'est pas le cas « jamais ouverte », le moteur le sait");
  assert.equal(PARCOURS.etatAffichage(relu).acquises.length, 0, "et pourtant aucune table n'est acquise");
  // Lot « fignolage du 22/10 » : la pastille seule, sans barre ni compte.
  const jauge = lire(PARCOURS, relu);
  assert.deepEqual(Object.keys(jauge), ["aujourdhui"],
    "« 0 table acquise sur 9 » avec une barre vide, le premier jour, est le reproche qu'on refuse");
  assert.equal(jauge.aujourdhui.texte, "\u{1F514} Aujourd’hui\u00a0: la table de\u00a02");
  assert.equal(lire(PARCOURS, parcoursFabrique({acquises: 1})).compte, "1 table passée sur 9",
    "dès la première table, la jauge apparaît");
});

test("les moteurs sont servis d'ici et ne sont chargés que s'il y a un parcours à lire", () => {
  assert.match(page, /url: "prof\/defi_tables_mon_parcours\.js\?v=/,
    "la copie servie par le suivi : la politique de contenu interdit un script d'un autre domaine");
  assert.match(page, /url: "prof\/splat-parcours\.js\?v=/, "même chose pour le moteur de SPLAT!");
  const bloc = page.slice(page.indexOf("  async function habillerJauges"));
  const lecture = bloc.indexOf("lireParcours(code, cle)");
  const chargement = bloc.indexOf("chargerMoteur(cle)");
  assert.ok(lecture > 0 && chargement > lecture,
    "70 ko de moteur ne se téléchargent qu'après avoir su qu'il y a quelque chose à afficher");
  assert.match(bloc, /if \(!parcours\.some\(Boolean\)\) return;/,
    "aucun parcours : on s'arrête avant le moteur");
  assert.match(bloc, /parcours\[i\] \? chargerMoteur\(cle\) : null/,
    "un moteur par activité, et seulement pour celle qui a un parcours");
});

test("la grille s'affiche avant la jauge, et rien ne l'attend", () => {
  const ordre = page.indexOf('$("ecran-espace").hidden = false;');
  const appel = page.indexOf("habillerJauges(donnees, code);", ordre);
  assert.ok(ordre > 0 && appel > ordre, "la grille est à l'écran avant que la jauge soit demandée");
  assert.doesNotMatch(page.slice(ordre, appel + 60), /await habillerJauges/,
    "un « await » ici, et un serveur lent retiendrait la liste des activités");
});

test("la jauge se construit par textContent, jamais en HTML", () => {
  const debut = page.indexOf("  function poserJauge(");
  const bloc = page.slice(debut, page.indexOf("\n  }", debut));
  assert.doesNotMatch(bloc, /innerHTML/, "un parcours est fabriqué par l'appareil d'un élève");
  assert.match(bloc, /compte\.textContent = jauge\.compte;/);
  assert.match(bloc, /note\.textContent = jauge\.note;/);
  assert.match(bloc, /bonus\.textContent = jauge\.bonus;/);
  const debutPastille = page.indexOf("  function pastilleMonde(");
  const pastille = page.slice(debutPastille, page.indexOf("\n  }", debutPastille));
  assert.ok(debutPastille > 0, "les pastilles de SPLAT! sont dessinées par pastilleMonde");
  assert.doesNotMatch(pastille, /innerHTML/);
  assert.match(pastille, /chiffre\.textContent = String\(monde\.numero\);/);
});

test("lire un parcours n'écrit jamais le code dans une adresse", () => {
  const debut = page.indexOf("  async function lireParcours(");
  const bloc = page.slice(debut, page.indexOf("\n  }", debut));
  assert.match(bloc, /fetch\("api\/parcours\.php", \{\s*\n\s*method: "POST"/,
    "le code voyage dans le corps : une adresse s'inscrit en clair dans les journaux de l'hébergeur");
  assert.match(bloc, /body: JSON\.stringify\(\{code, appli: cle, lire: true\}\)/);
  assert.doesNotMatch(page, /parcours\.php\?/, "aucun paramètre d'adresse sur ce point d'entrée");
  assert.match(bloc, /catch \(_\) \{ return null; \}/, "toute avarie rend null : pas de message d'erreur à l'élève");
});

// La règle nº 1, exécutée et pas décrite : serveur muet, la grille reste
// intacte. Le bloc de la jauge est extrait tel qu'il est écrit dans la page,
// et joué avec un serveur qui ne répond jamais.
// Le moteur de SPLAT!, tel qu'il est servi par le suivi (la copie de prof/).
const MOTEUR_SPLAT = join(racine, "_serveur/public/prof/splat-parcours.js");
const SPLAT = createRequire(import.meta.url)(MOTEUR_SPLAT);

// Depuis le lot « splat-suivi-3 », un moteur par activité : chaque faux
// <script> installe le sien dans la fausse fenêtre, d'après son adresse.
const MOTEURS_DES_ADRESSES = [
  ["defi_tables_mon_parcours.js", "MATHSGO_DEFI_TABLES_MON_PARCOURS", PARCOURS],
  ["splat-parcours.js", "MathsGoSplatParcours", SPLAT]
];

// Un faux serveur qui répond par activité : {cle: parcours ou null}.
function serveurDesParcours(parActivite) {
  return (_adresse, options) => {
    const {appli} = JSON.parse(options.body);
    const parcours = parActivite[appli] || null;
    return Promise.resolve({ok: true, json: () => Promise.resolve(parcours
      ? {ok: true, existe: true, parcours: JSON.parse(JSON.stringify(parcours))}
      : {ok: true, existe: false, parcours: null})});
  };
}

function jouerHabillage({reponse, moteurCharge = true, applis = ["defi-tables"], reglages}) {
  const debut = page.indexOf("  const JAUGES = {");
  assert.ok(debut > 0, "la page doit nommer les moteurs qu'elle charge");
  const ancre = page.indexOf("  async function habillerJauges(donnees, code) {", debut);
  const fin = page.indexOf("\n  }", page.indexOf("for (let i = aLire.length - 1", ancre)) + "\n  }".length;
  const source = page.slice(debut, fin)
    .replace(/<\?=[\s\S]*?\?>/g, "0123456789")
    + "\n  return habillerJauges;";

  const faireNoeud = (nom, espace) => {
    const noeud = {nom, espace, style: {}, textContent: "", enfants: [], ecouteurs: {}, attributs: {},
      append(...n) { noeud.enfants.push(...n); },
      // La page écoute « load » et « error » par addEventListener : sans cette
      // ligne, le faux <script> n'a pas d'écouteur du tout et la promesse du
      // moteur ne se résout jamais.
      addEventListener(type, fn) { noeud.ecouteurs[type] = fn; },
      setAttribute(cle, valeur) { noeud.attributs[cle] = String(valeur); },
      querySelector: () => null};
    return noeud;
  };
  const tuiles = {};
  applis.forEach(cle => {
    const tuile = {cle, classes: [], enfants: [],
      classList: {add(nom) { tuile.classes.push(nom); }},
      querySelector: () => (tuile.enfants.length ? tuile.enfants[0] : null),
      closest: () => ({cle}),
      append(noeud) { tuile.enfants.push(noeud); }};
    tuiles[cle] = tuile;
  });
  const remontees = [];
  const liste = {
    querySelector: selecteur => tuiles[(selecteur.match(/data-cle="([^"]+)"/) || [])[1]] || null,
    firstChild: {cle: "premiere"},
    insertBefore(li) { remontees.push(li.cle); }
  };
  const $ = () => liste;
  // Le moteur se charge par un <script> ajouté à la volée. Le faux document
  // installe le moteur et rend « load », ou rend « error » selon
  // `moteurCharge` (un booléen, ou une fonction de l'adresse) : c'est le seul
  // moyen d'éprouver le MOTEUR INTROUVABLE, un cas qu'aucun serveur simulé ne
  // produit — et le troisième pied de la règle nº 1, à côté du serveur muet et
  // de la réponse illisible.
  const fenetre = {};
  const charges = [];
  const doc = {createElement: nom => faireNoeud(nom), createElementNS: (espace, nom) => faireNoeud(nom, espace),
    createTextNode: t => ({texte: t}),
    head: {appendChild(script) {
      charges.push(script.src);
      const reussit = typeof moteurCharge === "function" ? moteurCharge(script.src) : moteurCharge;
      setTimeout(() => {
        if (reussit) {
          const [, nom, moteur] = MOTEURS_DES_ADRESSES.find(([fichier]) => script.src.includes(fichier));
          fenetre[nom] = moteur;
        }
        script.ecouteurs[reussit ? "load" : "error"]?.();
      }, 0);
    }}};
  const habiller = new Function("$", "window", "document", "fetch", "CSS", "Promise", "Math", source)(
    $, fenetre, doc, reponse, {escape: x => x}, Promise, Math);
  const donnees = {applis: applis.map(cle => ({cle, disponible: true, url: "https://exemple/", ancre: null})),
    ...(reglages ? {reglages} : {})};
  return {habiller: habiller(donnees, "ABC123"), tuile: tuiles[applis[0]], tuiles, charges, remontees};
}

test("serveur muet : la tuile reste exactement ce qu'elle était", async () => {
  const {habiller, tuile} = jouerHabillage({reponse: () => Promise.reject(new Error("réseau"))});
  await habiller;
  assert.deepEqual(tuile.enfants, [], "rien n'a été ajouté à la tuile");
  assert.deepEqual(tuile.classes, [], "et elle n'a même pas changé de classe");
});

test("réponse illisible : pas de jauge, pas d'erreur affichée", async () => {
  const {habiller, tuile} = jouerHabillage({
    reponse: () => Promise.resolve({ok: true, json: () => Promise.resolve({ok: true, existe: true, parcours: "pas un objet"})})
  });
  await habiller;
  assert.deepEqual(tuile.enfants, [], "un parcours illisible ne casse rien et n'écrit rien");
});

// Le moteur absent, c'est le fichier oublié pendant un dépôt FTP, ou un cache
// qui rend une page vide. Le parcours de l'élève arrive, mais plus rien ne sait
// le lire : sa tuile doit rester exactement ce qu'elle était.
// Le délai est porté PAR LE TEST, pas par la ligne de commande : « node --test »
// n'a aucune expiration par défaut, et sans cela le jour où le chargement du
// moteur cesse de se résoudre, la CI attendrait indéfiniment au lieu d'afficher
// un rouge. Un test qui pend n'est pas un test qui échoue. (Constaté en
// rejouant le sabotage q le 09/09/2026.)
test("moteur introuvable : la grille reste entière, sans jauge et sans message", {timeout: 5000}, async () => {
  const parcours = JSON.parse(JSON.stringify(parcoursFabrique({acquises: 4})));
  const {habiller, tuile} = jouerHabillage({
    reponse: () => Promise.resolve({ok: true, json: () => Promise.resolve({ok: true, existe: true, parcours})}),
    moteurCharge: false
  });
  await habiller;
  assert.deepEqual(tuile.enfants, [],
    "le parcours est bien arrivé, mais rien ne peut le lire : la tuile ne bouge pas");
  assert.deepEqual(tuile.classes, [], "et elle ne change même pas de classe");
});

test("parcours reçu : la jauge est posée sur la tuile", async () => {
  const parcours = JSON.parse(JSON.stringify(parcoursFabrique({acquises: 4})));
  const {habiller, tuile} = jouerHabillage({
    reponse: () => Promise.resolve({ok: true, json: () => Promise.resolve({ok: true, existe: true, parcours})})
  });
  await habiller;
  assert.equal(tuile.enfants.length, 1, "la jauge est ajoutée");
  assert.deepEqual(tuile.classes, ["a-jauge"], "et la tuile passe en plusieurs lignes");
});

// La barre est le seul élément graphique du lot, et jusqu'ici aucun test ne la
// regardait : une barre toujours pleine, ou inversée, laissait 2 295 tests
// verts (relevé par Claude Code le 09/09/2026). Elle se mesure ici sur la
// tuile construite par la page : la partie remplie a une largeur en pour cent,
// arrondie, égale à la part des tables acquises.
async function largeurDeLaBarre(acquises) {
  const parcours = JSON.parse(JSON.stringify(parcoursFabrique({acquises, melangeAJour: true})));
  const {habiller, tuile} = jouerHabillage({
    reponse: () => Promise.resolve({ok: true, json: () => Promise.resolve({ok: true, existe: true, parcours})})
  });
  await habiller;
  const [bloc] = tuile.enfants;
  const [barre] = bloc.enfants;
  const [remplie] = barre.enfants;
  return remplie.style.width;
}

test("la barre de la tuile est remplie à la mesure des tables acquises", async () => {
  assert.equal(await largeurDeLaBarre(4), "44%", "4 tables sur 9 : 44,4 % arrondi à 44");
  assert.equal(await largeurDeLaBarre(1), "11%", "1 table sur 9");
  assert.equal(await largeurDeLaBarre(9), "100%", "9 sur 9 : la barre est pleine");
});

// -------------------------------------------------------------------------
// Lot « splat-suivi-3 » (07/10/2026). La tuile SPLAT!, choix B de Gwenaël :
// six pastilles rondes, une par monde, dans la couleur du monde — vide (pas
// commencé), à moitié (en cours), pleine (fini) —, et dessous « 13 étapes
// réussies sur 37 » (+ « ✨ 2 bonus »). Rien tant qu'aucune étape n'est
// réussie. Le total vient de la carte, par le moteur : jamais écrit ici.
//
// Sabotages attendus (chacun rend un test rouge) :
//   u) compter les étapes dans la page (`brut.etapes`) au lieu d'appeler
//      resumeProf
//   v) enlever le garde-fou « aucune étape réussie » de SPLAT!
//   w) écrire « sur 40 » (ou tout total en dur) au lieu de resume.total
//   x) forcer le pluriel (« 1 étapes réussies »)
//   y) charger le moteur SPLAT! même sans parcours SPLAT!
//   z) dessiner la pastille « en cours » sans sa moitié colorée

const serie = (fait, etoiles, cartes, vues) => ({fait, etoiles, cartes, vues});
const CARTE_SPLAT = SPLAT.CARTE.ETAPES.map(e => ({parcours: e[0], monde: e[4]}));

// Un parcours SPLAT! construit par le moteur, comme le serveur le rend.
function parcoursSplat({mondesFinis = [], enMonde = null, faitsEnMonde = 0, aide = false, enCours = null, bonus = 0} = {}) {
  let p = SPLAT.creer();
  CARTE_SPLAT.filter(e => mondesFinis.includes(e.monde))
    .forEach(e => { p = SPLAT.enregistrerSerie(p, e.parcours, serie(true, 4, 4, 0), "2026-09-28"); });
  CARTE_SPLAT.filter(e => e.monde === enMonde).slice(0, faitsEnMonde)
    .forEach((e, i) => { p = SPLAT.enregistrerSerie(p, e.parcours, serie(true, 3, 4, aide && i === 0 ? 1 : 0), "2026-10-05"); });
  if (enCours) p = SPLAT.enregistrerEnCours(p, enCours, {idx: 3, etoiles: 2, cartes: 4}, "2026-10-07");
  SPLAT.CARTE.BONUS.slice(0, bonus).forEach(b => { p = SPLAT.enregistrerSerie(p, b[0], serie(true, 4, 4, 0), "2026-10-06"); });
  return JSON.parse(JSON.stringify(SPLAT.pourServeur(p)));
}
// Léa, 405 : mondes 1 et 2 finis (9 étapes), 4 étapes du monde 3 dont une avec
// des réponses vues, une série en cours, 1 bonus — 13 étapes réussies.
const LEA = () => parcoursSplat({mondesFinis: [1, 2], enMonde: 3, faitsEnMonde: 4, aide: true, enCours: "enq14", bonus: 1});

test("SPLAT! : « N étape(s) réussie(s) sur 40 », le total de la carte, les Bonus à part", () => {
  const lire = lecteurDeJauge().splat;
  const lea = lire(SPLAT, LEA());
  assert.equal(lea.compte, "13 étapes réussies sur 40", "une réussite avec des réponses vues est une étape réussie");
  assert.equal(lea.bonus, "✨ 1 bonus");
  assert.equal(lea.total, 40, "40 étapes : la numérotation saute de 28 à 35, et l'échauffement É1-É3 du monde 6 compte (14/10/2026)");
  const une = lire(SPLAT, parcoursSplat({enMonde: 1, faitsEnMonde: 1}));
  assert.equal(une.compte, "1 étape réussie sur 40", "au singulier");
  assert.equal(une.bonus, "", "pas de Bonus : rien");
  assert.equal(lire(SPLAT, parcoursSplat({mondesFinis: [1], bonus: 3})).bonus, "✨ 3 bonus");
  const tout = lire(SPLAT, parcoursSplat({mondesFinis: [1, 2, 3, 4, 5, 6], bonus: 14}));
  assert.equal(tout.compte, "40 étapes réussies sur 40");
  assert.equal(tout.bonus, "✨ 14 bonus");
  const jauges = page.slice(page.indexOf("  const JAUGES = {"), page.indexOf("\n  };", page.indexOf("  const JAUGES = {")));
  assert.doesNotMatch(jauges, /sur (37|40)\b/, "le total n'est jamais écrit dans la page : c'est la carte qui le donne");
});

test("SPLAT! : pas de jauge tant qu'aucune étape n'est réussie", () => {
  const lire = lecteurDeJauge().splat;
  assert.equal(lire(SPLAT, SPLAT.pourServeur(SPLAT.creer())), null, "jamais ouvert");
  assert.equal(lire(SPLAT, parcoursSplat({enCours: "m1e1"})), null,
    "une première série commencée et pas finie : « 0 étape réussie » serait le reproche qu'on refuse");
  assert.equal(lire(SPLAT, parcoursSplat({bonus: 1})), null, "un Bonus seul ne fait pas d'étape réussie");
  assert.notEqual(lire(SPLAT, parcoursSplat({enMonde: 1, faitsEnMonde: 1})), null, "dès la première étape, la tuile parle");
});

test("SPLAT! : les six mondes, vide / en cours / fini, comme la carte des mondes", () => {
  const lire = lecteurDeJauge().splat;
  assert.deepEqual(lire(SPLAT, LEA()).mondes, [
    {numero: 1, etat: "fini"}, {numero: 2, etat: "fini"}, {numero: 3, etat: "cours"},
    {numero: 4, etat: "vide"}, {numero: 5, etat: "vide"}, {numero: 6, etat: "vide"}]);
  // Un monde est fini quand ses étapes sont faites, Bonus ou pas (comme la carte).
  const sansBonus = lire(SPLAT, parcoursSplat({mondesFinis: [3]}));
  assert.equal(sansBonus.mondes[2].etat, "fini");
});

test("SPLAT! : la page lit le parcours par le moteur, jamais elle-même", () => {
  const debut = page.indexOf('    "splat": {', page.indexOf("  const JAUGES = {"));
  const lecteur = page.slice(debut, page.indexOf("\n    }", debut));
  assert.match(lecteur, /P\.resumeProf\(brut\)/, "le moteur résume le parcours (la carte réduite est dans le moteur)");
  assert.doesNotMatch(lecteur, /\.etapes\b|\.fait\b|\.vues\b|\.idx\b/, "la page ne fouille pas le parcours elle-même");
});

test("parcours SPLAT! reçu : six pastilles numérotées, la moitié pour le monde en cours, le compte dessous", async () => {
  const {habiller, tuiles} = jouerHabillage({reponse: serveurDesParcours({splat: LEA()}), applis: ["defi-tables", "splat"]});
  await habiller;
  const tuile = tuiles.splat;
  assert.deepEqual(tuile.classes, ["a-jauge"]);
  assert.deepEqual(tuiles["defi-tables"].enfants, [], "Défi tables, jamais ouvert, reste sans jauge");
  const [bloc] = tuile.enfants;
  const [mondes, ligne] = bloc.enfants;
  assert.equal(mondes.className, "mondes");
  assert.equal(mondes.attributs.role, "img");
  assert.equal(mondes.attributs["aria-label"],
    "Monde 1 : fini, Monde 2 : fini, Monde 3 : en cours, Monde 4 : pas commencé, Monde 5 : pas commencé, Monde 6 : pas commencé");
  assert.equal(mondes.enfants.length, 6);
  mondes.enfants.forEach((pastille, i) => {
    assert.equal(pastille.espace, "http://www.w3.org/2000/svg", "une pastille est un dessin SVG");
    const chiffre = pastille.enfants.find(n => n.nom === "text");
    assert.equal(chiffre.textContent, String(i + 1), "le numéro du monde, dans l'ordre de la carte");
    assert.equal(chiffre.attributs["text-anchor"], "middle");
    assert.equal(chiffre.attributs.x, "12", "centré en largeur");
    assert.equal(Number(chiffre.attributs.y), 12 + 0.35 * Number(chiffre.attributs["font-size"]),
      "centré en hauteur : le pied du chiffre 0,35 em sous le centre");
  });
  const etats = mondes.enfants.map(p => p.attributs.class);
  assert.deepEqual(etats, ["monde-p fini", "monde-p fini", "monde-p cours", "monde-p vide", "monde-p vide", "monde-p vide"]);
  const moitie = n => n.enfants.some(e => e.nom === "path");
  assert.deepEqual(mondes.enfants.map(moitie), [false, false, true, false, false, false], "seul le monde en cours a sa moitié colorée");
  const rond = n => n.enfants.find(e => e.nom === "circle").attributs.fill;
  assert.equal(rond(mondes.enfants[0]), "#d9690c", "plein, dans la couleur du monde 1 sur la carte");
  assert.equal(rond(mondes.enfants[3]), "#fff", "vide : un rond blanc");
  assert.equal(mondes.enfants[3].enfants.find(e => e.nom === "circle").attributs.stroke, "#92400e", "cerclé de la couleur du monde 4");
  const chiffreDe = n => n.enfants.find(e => e.nom === "text").attributs;
  assert.equal(chiffreDe(mondes.enfants[0]).fill, "#fff", "fini : chiffre blanc sur la couleur");
  assert.equal(chiffreDe(mondes.enfants[3]).fill, "#92400e", "vide : chiffre de la couleur du monde");
  assert.deepEqual([chiffreDe(mondes.enfants[2]).fill, chiffreDe(mondes.enfants[2]).stroke, chiffreDe(mondes.enfants[2])["paint-order"]],
    ["#fff", "#be185d", "stroke"], "à moitié : chiffre blanc cerné de la couleur, lisible des deux côtés");
  const [compte, bonus] = ligne.enfants;
  assert.equal(compte.textContent, "13 étapes réussies sur 40");
  assert.equal(bonus.className, "bonus");
  assert.equal(bonus.textContent, "✨ 1 bonus");
});

test("le moteur SPLAT! n'est chargé que si l'élève a un parcours SPLAT!", async () => {
  const tables = parcoursFabrique({acquises: 4});
  const seulTables = jouerHabillage({reponse: serveurDesParcours({"defi-tables": tables}), applis: ["defi-tables", "splat"], moteurCharge: true});
  await seulTables.habiller;
  assert.deepEqual(seulTables.charges, ["prof/defi_tables_mon_parcours.js?v=0123456789"], "pas de moteur SPLAT! sans parcours SPLAT!");
  assert.equal(seulTables.tuiles["defi-tables"].enfants.length, 1);
  const seulSplat = jouerHabillage({reponse: serveurDesParcours({splat: LEA()}), applis: ["defi-tables", "splat"]});
  await seulSplat.habiller;
  assert.deepEqual(seulSplat.charges, ["prof/splat-parcours.js?v=0123456789"], "et pas celui de Défi tables sans parcours de tables");
  const lesDeux = jouerHabillage({reponse: serveurDesParcours({"defi-tables": tables, splat: LEA()}), applis: ["defi-tables", "splat"]});
  await lesDeux.habiller;
  assert.equal(lesDeux.charges.length, 2);
  assert.equal(lesDeux.tuiles["defi-tables"].enfants.length, 1);
  assert.equal(lesDeux.tuiles.splat.enfants.length, 1);
  assert.deepEqual(lesDeux.remontees, ["splat", "defi-tables"],
    "les deux commencées remontent, la première de la liste finit en tête");
});

test("moteur SPLAT! introuvable : la tuile SPLAT! reste nue, celle de Défi tables a sa jauge", {timeout: 5000}, async () => {
  const {habiller, tuiles} = jouerHabillage({
    reponse: serveurDesParcours({"defi-tables": parcoursFabrique({acquises: 4}), splat: LEA()}),
    applis: ["defi-tables", "splat"],
    moteurCharge: adresse => !adresse.includes("splat-parcours.js")
  });
  await habiller;
  assert.deepEqual(tuiles.splat.enfants, [], "rien ne peut lire le parcours SPLAT! : la tuile ne bouge pas");
  assert.deepEqual(tuiles.splat.classes, []);
  assert.equal(tuiles["defi-tables"].enfants.length, 1, "l'autre activité n'en souffre pas");
});

// -------------------------------------------------------------------------
// Lot « splat-suivi-5 » (08/10/2026, choix de Gwenaël sur maquettes) : quand
// le professeur n'a ouvert que certains mondes à la classe, la tuile les
// montre en gris (pointillés), et les comptes ne portent que sur les mondes
// ouverts — « 9 étapes réussies sur 9 » quand les mondes 1 et 2 sont finis.
// La liste arrive avec l'identité (api/eleve.php, reglages.splat.mondes) ;
// c'est le moteur qui la lit.

const MONDES_1_2 = {splat: {mondes: [1, 2]}};

test("SPLAT!, mondes 1 et 2 ouverts : les autres en gris, les comptes sur les mondes ouverts", () => {
  const lire = lecteurDeJauge().splat;
  const lea = lire(SPLAT, LEA(), MONDES_1_2);
  assert.equal(lea.compte, "9 étapes réussies sur 9", "les 4 étapes du monde 3 fermé ne comptent plus");
  assert.equal(lea.total, 9);
  assert.equal(lea.bonus, "", "son Bonus est dans le monde 3, fermé : pas de ✨");
  assert.deepEqual(lea.mondes, [
    {numero: 1, etat: "fini"}, {numero: 2, etat: "fini"}, {numero: 3, etat: "ferme"},
    {numero: 4, etat: "ferme"}, {numero: 5, etat: "ferme"}, {numero: 6, etat: "ferme"}]);
  const ines = lire(SPLAT, parcoursSplat({mondesFinis: [1], enCours: "m2e1"}), MONDES_1_2);
  assert.equal(ines.compte, "6 étapes réussies sur 9");
  assert.deepEqual(ines.mondes.map(m => m.etat), ["fini", "cours", "ferme", "ferme", "ferme", "ferme"]);
  // Les mondes 5 et 6 seulement (une 4e) : « sur 12 » (3 + 9, l'échauffement du monde 6 compris).
  const quatrieme = lire(SPLAT, parcoursSplat({mondesFinis: [1, 2, 5]}), {splat: {mondes: [5, 6]}});
  assert.equal(quatrieme.compte, "3 étapes réussies sur 12");
  assert.deepEqual(quatrieme.mondes.map(m => m.etat), ["ferme", "ferme", "ferme", "ferme", "fini", "vide"]);
});

test("SPLAT! : du travail seulement dans des mondes fermés, pas de jauge ; tous ouverts ou rien de lisible, rien ne change", () => {
  const lire = lecteurDeJauge().splat;
  assert.equal(lire(SPLAT, parcoursSplat({mondesFinis: [3]}), MONDES_1_2), null,
    "« 0 étape réussie sur 9 » serait le reproche qu'on refuse");
  for (const reglages of [undefined, {}, {splat: {mondes: [1, 2, 3, 4, 5, 6]}}, {splat: {mondes: "1,2"}}]) {
    assert.equal(lire(SPLAT, LEA(), reglages).compte, "13 étapes réussies sur 40", JSON.stringify(reglages));
  }
  // Un moteur d'avant le lot sur le serveur (FTP incomplet) : tout ouvert, rien ne casse.
  const ancien = Object.assign({}, SPLAT, {mondesDeReglages: undefined});
  assert.equal(lire(ancien, LEA(), MONDES_1_2).compte, "13 étapes réussies sur 40");
});

test("SPLAT! : l'espace passe les réglages de la classe à la jauge, et la pastille d'un monde fermé est grise en pointillés", async () => {
  const {habiller, tuiles} = jouerHabillage({applis: ["splat"], reglages: MONDES_1_2,
    reponse: () => Promise.resolve({ok: true, json: () => Promise.resolve({ok: true, existe: true, parcours: LEA()})})});
  await habiller;
  const tuile = tuiles.splat;
  assert.equal(tuile.enfants.length, 1, "la jauge est posée");
  const tous = (noeud, sortie = []) => { (noeud.enfants || []).forEach(n => { sortie.push(n); tous(n, sortie); }); return sortie; };
  const noeuds = tous(tuile);
  const svgs = noeuds.filter(n => n.nom === "svg");
  assert.deepEqual(svgs.map(s => s.attributs.class), ["monde-p fini", "monde-p fini", "monde-p ferme", "monde-p ferme", "monde-p ferme", "monde-p ferme"]);
  const ferme = svgs[2];
  const cercle = ferme.enfants.find(n => n.nom === "circle");
  const chiffre = ferme.enfants.find(n => n.nom === "text");
  assert.equal(cercle.attributs["stroke-dasharray"], "3.2 2.4", "pointillés");
  assert.equal(cercle.attributs.fill, "#fff");
  assert.equal(cercle.attributs.stroke, chiffre.attributs.fill, "anneau et chiffre du même gris");
  assert.ok(!ferme.enfants.some(n => n.nom === "path"), "pas de moitié : le travail d'un monde fermé ne se lit pas dans la tuile");
  assert.equal(chiffre.attributs.y, "16.375", "le chiffre centré comme sur les autres pastilles");
  assert.equal(chiffre.textContent, "3");
  assert.ok(noeuds.some(n => n.textContent === "9 étapes réussies sur 9"));
  const etiquette = noeuds.find(n => n.attributs && n.attributs["aria-label"]);
  assert.match(etiquette.attributs["aria-label"], /Monde 3 : fermé pour ta classe/);
});

// -------------------------------------------------------------------------
// Lot « Qui voit quoi » (22/10/2026). Un professeur peut ouvrir à UN élève une
// appli ou des mondes en plus de sa classe. Le SERVEUR calcule « classe +
// ajouts » et le rend sous les noms qui existent déjà, « applis » et
// « reglages » (lib/applis.php, acces_de_l_eleve) : cette page n'a RIEN à
// changer — c'est la décision D2 de la conception, et ces tests le prouvent
// sur une réponse qui contient un ajout.

test("qui-voit-quoi — la page ne lit que « applis » et « reglages » : elle ne sait pas ce qu'est un ajout", () => {
  assert.doesNotMatch(page, /ajouts?\b/i, "aucune trace d'« ajouts » dans l'espace élève : c'est le serveur qui additionne");
  assert.doesNotMatch(page, /acces\b/, "ni d'« acces »");
  assert.match(page, /const disponibles = \(donnees\.applis \|\| \[\]\)\.filter\(a => a\.disponible && a\.url\);/, "les tuiles viennent de « applis »");
  assert.match(page, /JAUGES\[aLire\[i\]\]\.lecteur\(P, parcours\[i\], donnees\.reglages \|\| \{\}\)/, "les jauges lisent « reglages »");
  // Le serveur, lui, rend la même forme qu'avant : « applis » affichables et
  // « reglages » en objet, calculés pour l'élève (par le code ET par le billet).
  const eleve = readFileSync(join(racine, "_serveur/public/api/eleve.php"), "utf8");
  assert.equal((eleve.match(/acces_affichable\(\$eleve\)/g) || []).length, 2, "par le code et à l'échange du billet");
  assert.doesNotMatch(eleve, /applis_de_classe\(|reglages_de_classe\(/, "plus jamais la classe seule : toujours l'élève");
});

test("qui-voit-quoi — Léa, 405 (mondes 1 et 2) avec le monde 3 en plus : la tuile compte sur SES mondes, sans une ligne de plus dans la page", async () => {
  // Ce que le serveur rend pour Léa : {"splat": {"mondes": [1, 2, 3]}} — la
  // classe plus son ajout, déjà additionnés. La page n'y voit qu'un réglage.
  const {habiller, tuiles} = jouerHabillage({applis: ["splat"], reglages: {splat: {mondes: [1, 2, 3]}},
    reponse: () => Promise.resolve({ok: true, json: () => Promise.resolve({ok: true, existe: true, parcours: LEA()})})});
  await habiller;
  const tuile = tuiles.splat;
  assert.equal(tuile.enfants.length, 1, "la jauge est posée");
  const tous = (noeud, sortie = []) => { (noeud.enfants || []).forEach(n => { sortie.push(n); tous(n, sortie); }); return sortie; };
  const noeuds = tous(tuile);
  const svgs = noeuds.filter(n => n.nom === "svg");
  assert.deepEqual(svgs.map(s => s.attributs.class), ["monde-p fini", "monde-p fini", "monde-p cours", "monde-p ferme", "monde-p ferme", "monde-p ferme"],
    "le monde 3 est ouvert pour elle (en cours), les trois autres fermés");
  assert.ok(noeuds.some(n => n.textContent === "13 étapes réussies sur 24"), "9 + 4 étapes, sur 9 + 15 : ses mondes à elle");
  assert.ok(noeuds.some(n => n.textContent === "✨ 1 bonus"), "son Bonus du monde 3 compte");
  // Lucas, même classe, sans ajout : exactement ce qu'il recevait avant le lot.
  const lucas = lecteurDeJauge().splat(SPLAT, LEA(), MONDES_1_2);
  assert.equal(lucas.compte, "9 étapes réussies sur 9");
  assert.deepEqual(lucas.mondes.map(m => m.etat), ["fini", "fini", "ferme", "ferme", "ferme", "ferme"]);
});

test("qui-voit-quoi — une appli donnée à un seul élève (Coffres) a sa tuile comme les autres : elle arrive dans « applis », rien d'autre", () => {
  // Le serveur rend « coffres » dans la liste de Léa, avec nom, description et
  // adresse, à sa place du catalogue : la page la dessine avec son icône.
  const debut = page.indexOf("  const ICONES = {");
  const icones = page.slice(debut, page.indexOf("\n  };", debut));
  assert.ok(icones.includes('"coffres":'), "Coffres a son dessin");
  assert.match(page, /lien\.dataset\.cle = appli\.cle;/, "la tuile porte la clé que le serveur rend");
  assert.doesNotMatch(page, /applis\.filter\([^)]*classe/, "la page ne filtre jamais sur la classe : la liste reçue est la liste");
});
