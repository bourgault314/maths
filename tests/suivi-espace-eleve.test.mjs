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
  for (const cle of cles) {
    assert.ok(page.includes(`"${cle}":`),
      `l'appli « ${cle} » n'a pas de dessin dans ICONES : une activité au dessin générique a l'air inachevée. `
      + `Ajoute-le dans _serveur/public/index.php.`);
  }
});

// 07/09/2026 — les activités annoncées. Gwenaël veut que les élèves voient
// arriver ce qui se prépare ; elles s'affichent donc pour toutes les classes,
// sans lien, avec une pastille. Deux choses à tenir : leur ORDRE (le sien) et
// le fait que leur dessin garde ses COULEURS — grisées, les cinq à venir se
// ressemblaient toutes, et c'est justement la couleur qui donne envie.

test("l'ordre d'affichage du catalogue est celui décidé le 07/09/2026", () => {
  const cles = [...catalogue.matchAll(/^\s{4}'([a-z0-9-]+)' => \[$/gm)].map(m => m[1]);
  assert.deepEqual(cles, ["defi-tables", "defi-calcul", "automatismes", "splat-equations", "soley"],
    "l'ordre du tableau CATALOGUE_APPLIS est l'ordre des tuiles chez l'élève");
});

test("les activités pas encore ouvertes sont annoncées à toutes les classes", () => {
  assert.match(catalogue, /foreach \(CATALOGUE_APPLIS as \$cle => \$appli\) \{\s*\n\s*if \(isset\(\$vues\[\$cle\]\) \|\| \(\$appli\['disponible'\] \?\? false\)\) continue;/,
    "une annonce ne dépend pas de la liste de la classe ; une activité ouverte, si");
});

test("une tuile « bientôt » garde son dessin en couleur et porte la pastille", () => {
  assert.doesNotMatch(page, /\.bientot[^{]*\{[^}]*grayscale/,
    "griser le dessin efface le soleil de Solèy et l'orange de Splat");
  assert.match(page, /<span class="pastille">Bientôt<\/span>/, "la pastille dit ce que la couleur ne dit plus");
  assert.match(page, /bloc\.querySelector\("\.texte span"\)\.textContent = appli\.description/,
    "la pastille est un <span> elle aussi : viser celui du texte, pas le premier venu");
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
  new Function("$", "window", "ecrireCode", "lireCode", "nettoyer", "afficherErreur", source)(
    $, fenetre, () => {}, () => codeEnMemoire, nettoyer, () => {});
  assert.ok(gestionnaire, "le gestionnaire de « pageshow » doit être posé");
  gestionnaire({persisted});
  return {$, elements};
}

// Le bouton et le retour de cache doivent faire EXACTEMENT le même ménage :
// c'est la raison d'être de la fonction commune. Ce test exécute l'autre
// chemin, celui du bouton, sur le même écran de départ.
test("« Se déconnecter » fait le même ménage que le retour de cache", () => {
  const {$} = executerPageshow({persisted: false, codeEnMemoire: "ABC123"});
  $("changer").ecouteurs.click();
  assert.equal($("ecran-code").hidden, false);
  assert.equal($("ecran-espace").hidden, true);
  assert.equal($("titre").textContent, "Mon espace");
  assert.equal($("classe").textContent, "");
  assert.equal($("entete-droite").hidden, true);
  assert.equal($("applis").textContent, "");
  assert.equal($("code").value, "");
});

test("après « Se déconnecter », le bouton « précédent » ne rouvre pas l'espace", () => {
  const {$} = executerPageshow({persisted: true, codeEnMemoire: ""});
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
//   g) enlever le garde-fou « parcours vide » → une tuile jamais ouverte
//      afficherait « 0 table acquise sur 9 »
//   h) charger le moteur depuis mathsgo.re
//   i) attendre (await) la jauge avant d'afficher la grille
//   j) écrire le compte avec innerHTML
//   k) mettre le code de l'élève dans l'adresse de api/parcours.php

const MOTEUR_SERVI = join(racine, "_serveur/public/prof/defi_tables_mon_parcours.js");
const { createRequire } = await import("node:module");
const PARCOURS = createRequire(import.meta.url)(MOTEUR_SERVI);

// La fonction de lecture telle qu'elle est ÉCRITE dans la page, exécutée sur
// le vrai moteur : une assertion sur le texte du fichier décrirait l'intention
// au lieu de la vérifier.
function lecteurDeJauge() {
  const debut = page.indexOf("  const JAUGES = {");
  assert.ok(debut > 0, "la page doit ranger ses lecteurs de jauge dans JAUGES");
  const fin = page.indexOf("\n  };", debut) + "\n  };".length;
  const source = page.slice(debut, fin) + "\n  return JAUGES;";
  return new Function(source)();
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
  assert.equal(lire(PARCOURS, parcoursFabrique({acquises: 4})).compte, "4 tables acquises sur 9");
  assert.equal(lire(PARCOURS, parcoursFabrique({acquises: 1})).compte, "1 table acquise sur 9",
    "au singulier, comme sur l'accueil : « 1 table acquise »");
  assert.equal(lire(PARCOURS, parcoursFabrique({acquises: 9, melangeAJour: true})).compte,
    "9 tables acquises sur 9");
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

test("le rang et le mélange de la tuile sont ceux de l'état, pas un calcul d'ici", () => {
  const lire = lecteurDeJauge()["defi-tables"];
  const quatre = lire(PARCOURS, parcoursFabrique({acquises: 4}));
  assert.equal(quatre.rang.nom, "Argent", "3 tables acquises ouvrent Argent (règle du moteur)");
  assert.equal(quatre.note, "Mon mélange à faire", "dès 2 tables acquises, le mélange bloque la suite");
  const ajour = lire(PARCOURS, parcoursFabrique({acquises: 4, melangeAJour: true}));
  assert.equal(ajour.note, "", "mélange réussi : plus rien d'orange dans la tuile");
  const legende = lire(PARCOURS, parcoursFabrique({acquises: 9, melangeAJour: true, etoiles: 5}));
  assert.equal(legende.rang.cle, "legende");
  assert.equal(legende.fait, legende.total, "la barre est pleine");
});

test("une activité jamais ouverte n'a pas de jauge du tout", () => {
  const lire = lecteurDeJauge()["defi-tables"];
  assert.equal(lire(PARCOURS, PARCOURS.creerParcours()), null,
    "une barre vide n'apprend rien à l'élève et ressemble à un reproche");
});

test("le moteur est servi d'ici et n'est chargé que s'il y a un parcours à lire", () => {
  assert.match(page, /const MOTEUR = "prof\/defi_tables_mon_parcours\.js\?v=/,
    "la copie servie par le suivi : la politique de contenu interdit un script d'un autre domaine");
  const bloc = page.slice(page.indexOf("  async function habillerJauges"));
  const lecture = bloc.indexOf("lireParcours(code, cle)");
  const chargement = bloc.indexOf("await chargerMoteur()");
  assert.ok(lecture > 0 && chargement > lecture,
    "70 ko de moteur ne se téléchargent qu'après avoir su qu'il y a quelque chose à afficher");
  assert.match(bloc, /if \(!parcours\.some\(Boolean\)\) return;/,
    "aucun parcours : on s'arrête avant le moteur");
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
function jouerHabillage({reponse, moteurCharge = true}) {
  const debut = page.indexOf('  const MOTEUR = "prof/defi_tables_mon_parcours.js');
  assert.ok(debut > 0, "la page doit nommer le moteur qu'elle charge");
  const ancre = page.indexOf("  async function habillerJauges(donnees, code) {", debut);
  const fin = page.indexOf("\n  }", page.indexOf("for (let i = aLire.length - 1", ancre)) + "\n  }".length;
  const source = page.slice(debut, fin)
    .replace(/<\?=[\s\S]*?\?>/, "0123456789")
    + "\n  return habillerJauges;";

  const tuile = {
    classes: [],
    enfants: [],
    classList: {add(nom) { tuile.classes.push(nom); }},
    querySelector: () => null,
    closest: () => ({}),
    append(noeud) { tuile.enfants.push(noeud); }
  };
  const applis = {querySelector: () => tuile, firstChild: null, insertBefore() {}};
  const $ = () => applis;
  const faireNoeud = () => {
    const noeud = {style: {}, textContent: "", enfants: [],
      append(...n) { noeud.enfants.push(...n); },
      setAttribute() {}, querySelector: () => null};
    return noeud;
  };
  const doc = {createElement: faireNoeud, createTextNode: t => ({texte: t}),
    head: {appendChild(script) { setTimeout(() => (moteurCharge ? script : script).onerror?.(), 0); }}};
  const fenetre = {MATHSGO_DEFI_TABLES_MON_PARCOURS: moteurCharge ? PARCOURS : null};
  const habiller = new Function("$", "window", "document", "fetch", "CSS", "Promise", "Math", source)(
    $, fenetre, doc, reponse, {escape: s => s}, Promise, Math);
  const donnees = {applis: [{cle: "defi-tables", disponible: true, url: "https://exemple/", ancre: null}]};
  return {habiller: habiller(donnees, "ABC123"), tuile};
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

test("parcours reçu : la jauge est posée sur la tuile", async () => {
  const parcours = JSON.parse(JSON.stringify(parcoursFabrique({acquises: 4})));
  const {habiller, tuile} = jouerHabillage({
    reponse: () => Promise.resolve({ok: true, json: () => Promise.resolve({ok: true, existe: true, parcours})})
  });
  await habiller;
  assert.equal(tuile.enfants.length, 1, "la jauge est ajoutée");
  assert.deepEqual(tuile.classes, ["a-jauge"], "et la tuile passe en plusieurs lignes");
});
