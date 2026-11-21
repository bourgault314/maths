import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Serveur pro, lot 5a « Ma classe : la charte et la tête » (25/10/2026).
//
// Choix de Gwenaël (maquettes de l'étape 4, 25/10/2026) : le nom de la classe
// ouvre la liste de ses classes (« 405 ▾ », « Toutes mes classes » au bout), la
// dernière classe ouverte s'ouvre à la connexion, une seule ligne d'onglets
// (les applis défilent, Élèves et Réglages restent au bout), « + Nouvelle
// classe » en simple bouton. Et la page charge la charte commune suivi.css
// avant son <style>, qui ne garde que ce qui est propre à Ma classe.
//
// Ces tests EXÉCUTENT les fonctions de la page, telles qu'elles y sont
// écrites, dans un document de poche. Le vrai navigateur est joué par le banc
// du lot (planches avant/après 390 et 1440, voir la notice).

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = chemin => readFileSync(join(racine, chemin), "utf8");
const page = lire("_serveur/public/prof/index.php");
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

// ------------------------------------------------------------ un document de poche

class Noeud {
  constructor(balise) {
    this.balise = balise; this.enfants = []; this.attributs = {}; this.ecouteurs = {};
    this.hidden = false; this.textContent = ""; this.className = ""; this.type = "";
    this.style = {};
    const classes = new Set();
    this.classList = {add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c),
      toggle: (c, oui) => (oui ? classes.add(c) : classes.delete(c))};
  }
  getBoundingClientRect() { return this.rect || {top: 0, bottom: 0, left: 0, right: 0}; }
  append(...noeuds) { noeuds.forEach(n => this.enfants.push(typeof n === "string" ? Object.assign(new Noeud("#texte"), {textContent: n}) : n)); }
  appendChild(n) { this.enfants.push(n); return n; }
  setAttribute(nom, valeur) { this.attributs[nom] = String(valeur); }
  addEventListener(type, f) { this.ecouteurs[type] = f; }
  focus() { this.focalise = true; }
  querySelector(sel) {
    const m = /^\[aria-current="true"\]$/.exec(sel);
    const tous = [];
    const parcourir = n => { tous.push(n); n.enfants.forEach(parcourir); };
    parcourir(this);
    return m ? tous.find(n => n.attributs["aria-current"] === "true") || null : null;
  }
  set innerHTML(_) { throw new Error("innerHTML interdit : les noms viennent du serveur"); }
  get texte() { return this.textContent + this.enfants.map(n => n.texte).join(""); }
}

function document() {
  const zones = {};
  const $ = id => (zones[id] = zones[id] || new Noeud("div"));
  const el = (balise, classe, texte) => {
    const n = new Noeud(balise);
    if (classe) n.className = classe;
    if (texte !== undefined) n.textContent = texte;
    return n;
  };
  const doc = {createElement: b => new Noeud(b), documentElement: {clientWidth: 1440}};
  return {$, el, doc};
}

// La classe ouverte est celle que la page a lue (son nom, ses élèves) ; par
// défaut, telle que la liste la donne.
function menuRejoue(classes, classe, eleves) {
  const {$, el, doc} = document();
  const ouvertes = [];
  $("menu-classes").hidden = true;
  $("menu-classes").appendChild($("menu-classes-liste"));
  const dansLaListe = classe ? classes.find(c => c.id === classe.id) : null;
  const ouverte = classe ? Object.assign({libelle: dansLaListe ? dansLaListe.libelle : ""}, classe) : null;
  const sesEleves = eleves || new Array(dansLaListe ? dansLaListe.eleves : 0).fill({});
  const f = new Function("$", "el", "document", "classes", "classe", "eleves", "ouvrirClasse",
    `let menuOuvertPar = null;\nconst LIBELLES_DIRECT = {eclair: "● En direct", evaluation: "📝 Évaluation"};\n${["poserMenuClasses", "ouvrirMenuClasses", "fermerMenuClasses", "garderDansLEcran"].map(fonction).join("\n")}
     return {poserMenuClasses, ouvrirMenuClasses, fermerMenuClasses};`)(
    $, el, doc, classes, ouverte, sesEleves, id => ouvertes.push(id));
  return {$, f, ouvertes};
}

// ------------------------------------------------------------ la charte

test("la charte : suivi.css est servie par le serveur et chargée AVANT le <style> de la page, avec son empreinte", () => {
  assert.ok(existsSync(join(racine, "_serveur/public/suivi.css")), "suivi.css est dans _serveur/public/");
  assert.match(page, /\$charte = __DIR__ \. '\/\.\.\/suivi\.css';\n\$versionCharte = is_file\(\$charte\) \? substr\(md5_file\(\$charte\), 0, 10\) : '0';/);
  const lien = page.indexOf('<link rel="stylesheet" href="../suivi.css?v=<?= htmlspecialchars($versionCharte, ENT_QUOTES) ?>">');
  assert.ok(lien > 0, "le lien porte l'empreinte du fichier (jamais un ancien cache mélangé)");
  assert.ok(lien < page.indexOf("<style>"), "la charte d'abord, la page ensuite : la page garde le dernier mot");
  // La politique de contenu l'autorise déjà (style-src 'self') : rien à ouvrir.
  assert.match(lire("_serveur/public/lib/entetes.php"), /style-src 'self' 'unsafe-inline'/);
});

test("la charte : le <style> de la page ne recopie plus ce que la charte fait", () => {
  for (const regle of [":root {", "* { box-sizing", "body { margin: 0", "h1 { margin", "button { min-height",
    "button.secondaire {", "button.petit", ".carte { background", ".message { margin", "footer { padding",
    ".pastille { display", "th { background: #eef3f9"]) {
    assert.ok(!style.includes("\n  " + regle), `recopié de la charte : ${regle}`);
  }
  assert.ok(!/"(?:secondaire|danger) petit"|class="[^"]*\bpetit\b/.test(page), "plus aucun bouton « petit » : trois boutons, à 44 px et 16 px");
  // Ce qui reste, par sûreté : [hidden] cache pour de bon même si suivi.css manquait.
  assert.ok(style.includes("[hidden] { display: none !important; }"));
});

test("la charte : nosniff s'étend aux feuilles de style (.htaccess)", () => {
  const htaccess = lire("_serveur/public/.htaccess");
  // Lot E « Arriver » : le manifeste de l'icône (.webmanifest) s'y ajoute.
  assert.match(htaccess, /<FilesMatch "\\\.\(js\|css\|webmanifest\)\$">\s*\n\s*Header set X-Content-Type-Options "nosniff"/);
  assert.doesNotMatch(htaccess, /<FilesMatch "\\\.js\$">/);
});

// Lot 6 (31/10/2026) : l'entrée de l'élève et Mon espace (index.php) chargent
// à leur tour la charte (tests/suivi-serveur-pro-entree-mon-espace.test.mjs).
// Lot 7 (31/10/2026) : la séance en direct (les deux écrans) et Infos aussi
// (tests/suivi-serveur-pro-direct-infos.test.mjs). Restent les pages
// d'exploitation, pour Gwenaël seul.
test("les pages d'exploitation ne chargent pas encore la charte", () => {
  for (const chemin of ["_serveur/public/verifier.php", "_serveur/public/sauvegarde.php", "_serveur/public/secours.php",
    "_serveur/public/installer.php", "_serveur/public/migrer.php"]) {
    assert.doesNotMatch(lire(chemin), /suivi\.css/, `${chemin} ne charge pas encore la charte`);
  }
});

// ------------------------------------------------------------ l'en-tête

test("l'en-tête : la classe de la charte, et le nom de l'écran ouvert (plus « Ma classe » partout)", () => {
  assert.match(page, /<header class="entete">\s*<img src="\.\.\/mathsgo-logo\.png" alt="maths&go">\s*<span class="titre" id="titre-page">Suivi des élèves<\/span>/);
  assert.match(page, /<span class="qui" id="qui" hidden><\/span>\s*<button type="button" class="secondaire" id="mon-compte" hidden>Mon compte<\/button>\s*<button type="button" class="secondaire" id="deconnexion" hidden>Se déconnecter<\/button>/);
  const {$} = document();
  const montrer = new Function("$", "arreterVeilleEvaluation", "fermerMenuClasses", "fermerMenuApplis", "mdpTemporaire",
    `const TITRES_ECRANS = {"ecran-connexion": "Suivi des élèves", "ecran-premiere-classe": "Ma classe", "ecran-classe": "Ma classe", "ecran-compte": "Mon compte"};
     ${fonction("montrer")}\nreturn montrer;`)($, () => {}, () => {}, () => {}, false);
  for (const [ecran, titre] of [["ecran-connexion", "Suivi des élèves"], ["ecran-premiere-classe", "Ma classe"], ["ecran-classe", "Ma classe"], ["ecran-compte", "Mon compte"]]) {
    montrer(ecran);
    assert.equal($("titre-page").textContent, titre, ecran);
  }
  assert.match(script, /const TITRES_ECRANS = \{"ecran-connexion": "Suivi des élèves", "ecran-premiere-classe": "Ma classe",\s*"ecran-classe": "Ma classe", "ecran-compte": "Mon compte"\};/);
  assert.match(page, /<footer class="pied">/);
});

// ------------------------------------------------------------ plus d'écran « Mes classes » (lot 5d)

test("lot 5d : plus d'écran « Mes classes » ni de tuiles ; chargerClasses lit la liste et n'affiche rien", () => {
  assert.doesNotMatch(page, /id="ecran-classes"|id="liste-classes"|class="tuiles"/);
  assert.doesNotMatch(script, /"ecran-classes"|"liste-classes"/);
  const charger = fonction("chargerClasses");
  assert.match(charger, /const donnees = await api\("classes\.liste"\);/);
  assert.match(charger, /annoncerFinAnnee\(donnees, classes\.length\);/);
  assert.doesNotMatch(charger, /montrer\(|ouvrirClasse|innerHTML|catch/, "ni écran, ni ouverture ; une erreur remonte à l'appelant");
});

// ------------------------------------------------------------ le menu « 405 ▾ »

test("le menu des classes : le HTML — le nom de la classe est le bouton, « + Nouvelle classe » au bout (lot 5d)", () => {
  assert.match(page, /<h1><button type="button" id="bouton-classes" aria-haspopup="true" aria-expanded="false" aria-controls="menu-classes"><span id="titre-classe"><\/span><span class="rond" aria-hidden="true">/);
  assert.match(page, /<div class="menu-classes" id="menu-classes" hidden>\s*<ul id="menu-classes-liste" aria-label="Mes classes"><\/ul>\s*<button type="button" id="nouvelle-classe"><svg [^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/svg>Nouvelle classe<\/button>\s*<\/div>/);
  assert.match(page, /<\/div>\s*<button type="button" id="seance-direct">Séance en direct<\/button>\s*<\/div>\s*<p class="sous" id="resume-classe"><\/p>/, "« Séance en direct » sur la ligne du nom");
  assert.doesNotMatch(page, /class="ligne-retour"/, "plus de ligne de retour au-dessus du titre");
  // Se déconnecter : les noms des classes partent avec le reste, le menu se cache.
  assert.match(script, /const ZONES_TEXTE = \[[^\]]*"menu-classes-liste"/);
  assert.match(script, /const BLOCS_A_CACHER = \[[^\]]*"menu-classes",/);
});

test("le menu des classes : toutes les classes, l'ouverte cochée ; choisir une autre classe l'ouvre, la même ne fait que fermer", () => {
  const classes = [{id: 3, libelle: "306", eleves: 24, droit: "proprietaire"}, {id: 5, libelle: "405", eleves: 1, droit: "proprietaire"},
    {id: 9, libelle: "<b>x</b>", eleves: 2, droit: "proprietaire"}];
  const {$, f, ouvertes} = menuRejoue(classes, {id: 5});
  f.ouvrirMenuClasses();
  assert.equal($("menu-classes").hidden, false);
  assert.equal($("bouton-classes").attributs["aria-expanded"], "true");
  const boutons = $("menu-classes-liste").enfants.map(li => li.enfants[0]);
  assert.deepEqual(boutons.map(b => b.texte), ["30624 élèves", "4051 élève", "<b>x</b>2 élèves"], "le nom en texte, jamais en HTML");
  assert.deepEqual(boutons.map(b => b.enfants[0].balise), ["strong", "strong", "strong"], "le nom d'abord, en gras");
  assert.deepEqual(boutons.map(b => b.attributs["aria-current"] || ""), ["", "true", ""]);
  assert.equal(boutons[1].focalise, true, "la main va sur la classe ouverte");
  boutons[1].ecouteurs.click();
  assert.equal($("menu-classes").hidden, true);
  assert.deepEqual(ouvertes, [], "la classe déjà ouverte n'est pas relue");
  f.ouvrirMenuClasses();
  $("menu-classes-liste").enfants[0].enfants[0].ecouteurs.click();
  assert.deepEqual(ouvertes, [3]);
  assert.equal($("bouton-classes").attributs["aria-expanded"], "false");
});

test("lot 5d : la ligne du menu dit ce que disait la tuile — partagée par qui, ce qu'on peut y faire, la séance restée ouverte", () => {
  const classes = [
    {id: 3, libelle: "306", eleves: 24, droit: "proprietaire", direct: "eclair"},
    {id: 4, libelle: "5e B", eleves: 4, droit: "ecriture", proprietaire: "<i>collegue</i>"},
    {id: 6, libelle: "4e A", eleves: 26, droit: "lecture", proprietaire: null, direct: "evaluation"},
    {id: 7, libelle: "306", eleves: 1, droit: "proprietaire", direct: "inconnu"}];
  const {$, f} = menuRejoue(classes, {id: 3});
  f.ouvrirMenuClasses();
  const boutons = $("menu-classes-liste").enfants.map(li => li.enfants[0]);
  assert.deepEqual(boutons.map(b => b.texte), [
    "30624 élèves● En direct",
    "5e B4 élèvespartagée par <i>collegue</i> · modifiable",
    "4e A26 élèves📝 Évaluationpartagée par un collègue · lecture seule",
    "3061 élève"], "tout en texte : un identifiant de collègue n'est jamais du HTML ; un mode inconnu n'a pas de pastille");
  const pastille = boutons[0].enfants[1].enfants[0].enfants[1];
  assert.equal(pastille.balise, "em");
  assert.equal(pastille.className, "en-direct");
  assert.equal(boutons[1].enfants[1].enfants[1].className, "partage");
});

test("le menu des classes : rien sans classe ouverte ; Échap et un clic ailleurs le ferment", () => {
  const {$, f} = menuRejoue([{id: 3, libelle: "306", eleves: 24}], null);
  f.ouvrirMenuClasses();
  assert.equal($("menu-classes").hidden, true, "pas de menu hors d'une classe");
  const avec = menuRejoue([{id: 3, libelle: "306", eleves: 24}], {id: 3});
  avec.f.ouvrirMenuClasses();
  avec.f.fermerMenuClasses(true);
  assert.equal(avec.$("menu-classes").hidden, true);
  assert.equal(avec.$("bouton-classes").focalise, true, "Échap rend la main au nom de la classe");
  assert.match(script, /if \(evenement\.key === "Escape" && !\$\("menu-classes"\)\.hidden\) \{ evenement\.preventDefault\(\); fermerMenuClasses\(true\); \}/);
  assert.match(script, /if \(!evenement\.target\.closest \|\| !evenement\.target\.closest\("\.choix-classe, #bouton-classes-colle"\)\) fermerMenuClasses\(\);/);
  assert.match(fonction("montrer"), /fermerMenuClasses\(\);/, "changer d'écran ferme le menu");
});

// ------------------------------------------------------------ la dernière classe

function derniereRejouee(rangee) {
  const magasin = new Map(rangee === undefined ? [] : [["mathsgo-suivi-prof-derniere-classe", rangee]]);
  const localStorage = {
    getItem: k => (magasin.has(k) ? magasin.get(k) : null),
    setItem: (k, v) => magasin.set(k, String(v)),
    removeItem: k => magasin.delete(k)
  };
  const f = new Function("localStorage",
    `const CLE_DERNIERE_CLASSE = "mathsgo-suivi-prof-derniere-classe";
     ${["lireDerniereClasse", "retenirDerniereClasse", "oublierDerniereClasse"].map(fonction).join("\n")}
     return {lireDerniereClasse, retenirDerniereClasse, oublierDerniereClasse};`)(localStorage);
  return {f, magasin};
}

test("la dernière classe : seul son numéro est gardé, à chaque ouverture réussie ; l'ancre de la séance en direct passe d'abord", () => {
  const {f, magasin} = derniereRejouee(undefined);
  f.retenirDerniereClasse(42);
  assert.deepEqual([...magasin.entries()], [["mathsgo-suivi-prof-derniere-classe", "42"]], "un numéro, rien d'autre (ni nom, ni élève, ni identifiant)");
  assert.equal(f.lireDerniereClasse(), 42);
  for (const rangee of ["abc", "", "-1x"]) assert.equal(derniereRejouee(rangee).f.lireDerniereClasse(), 0, `« ${rangee} »`);
  const ouvrir = fonction("ouvrirClasse");
  assert.ok(ouvrir.indexOf("retenirDerniereClasse(classe.id);") > ouvrir.indexOf("if (numero !== demandeAppli || !jeton) return false;"),
    "retenue seulement quand le serveur a répondu pour CETTE ouverture");
  // Correctif des lots 5 : l'ancre (lue avant un mot de passe temporaire), puis la dernière classe.
  assert.match(script, /const duLien = classeDemandee\(\);[\s\S]*?return allerSansPerdre\("", duLien, lireDerniereClasse\(\)\);/);
  assert.doesNotMatch(fonction("deconnecter"), /CLE_DERNIERE_CLASSE|oublierDerniereClasse/, "se déconnecter la garde : c'est pour la prochaine connexion");
  // Un accès au stockage refusé (navigation privée stricte) ne casse rien.
  const refuse = new Function("localStorage",
    `const CLE_DERNIERE_CLASSE = "x";\n${["lireDerniereClasse", "retenirDerniereClasse", "oublierDerniereClasse"].map(fonction).join("\n")}
     return {lireDerniereClasse, retenirDerniereClasse, oublierDerniereClasse};`)(
    {getItem() { throw new Error("refusé"); }, setItem() { throw new Error("refusé"); }, removeItem() { throw new Error("refusé"); }});
  assert.equal(refuse.lireDerniereClasse(), 0);
  assert.doesNotThrow(() => refuse.retenirDerniereClasse(3));
  assert.doesNotThrow(() => refuse.oublierDerniereClasse());
});

// ------------------------------------------------------------ les onglets

test("les onglets : une ligne — les applis (qui défilent) puis Élèves et Réglages, qui restent au bout", () => {
  assert.match(page, /<div class="barre-onglets" id="onglets">\s*<button [^>]*id="bouton-classes-colle"[^>]*>[\s\S]*?<\/button>\s*<!--[\s\S]*?-->\s*<div class="onglets onglets-vue" role="group" aria-label="Toutes les applis">\s*<button type="button" id="onglet-classe" aria-pressed="false">[\s\S]*?<\/button>\s*<\/div>\s*<div class="choix-appli-menu" id="choix-appli-menu" hidden>[\s\S]*?<\/div>\s*<\/div>\s*<div class="onglets" id="choix-appli" role="group" aria-label="Activité affichée">/);
  assert.match(page, /<div class="onglets onglets-classe" role="group" aria-label="La classe">\s*<button type="button" class="onglet-eleves" id="onglet-eleves"/);
  assert.match(style, /\.barre-onglets > \.onglets-classe \{ flex: none; overflow: visible;/, "Élèves et Réglages ne défilent pas");
  assert.match(style, /\.barre-onglets > \.onglets\.suite \{[^}]*mask-image: linear-gradient\(90deg, #000 80%, transparent\);/);
  assert.match(fonction("poserOnglets"), /montrerOngletChoisi\(\);\s*return presentes;/);
});

test("les onglets : la rangée s'efface vers la droite seulement quand il reste des onglets à droite", () => {
  const classes = new Set();
  const rangee = {scrollLeft: 0, clientWidth: 240, scrollWidth: 420, classList: {toggle: (c, oui) => (oui ? classes.add(c) : classes.delete(c))}};
  const marquer = new Function("$", `${fonction("marquerSuiteOnglets")}\nreturn marquerSuiteOnglets;`)(() => rangee);
  marquer();
  assert.ok(classes.has("suite"), "au début : une suite à droite");
  rangee.scrollLeft = 180; marquer();
  assert.ok(!classes.has("suite"), "au bout : plus d'effacement, le dernier onglet se lit en entier");
  rangee.scrollLeft = 0; rangee.scrollWidth = 240; marquer();
  assert.ok(!classes.has("suite"), "tout tient (ordinateur) : rien ne s'efface");
});

// ------------------------------------------------------------ la barre collée (téléphone)

test("la barre collée : le HTML — un repère, puis la barre avec « 405 ▾ » en petit, caché tant qu'elle n'est pas collée", () => {
  assert.match(page, /<div id="repere-onglets"><\/div>\s*<div class="barre-onglets" id="onglets">\s*<button type="button" class="classe-collee" id="bouton-classes-colle" aria-haspopup="true" aria-expanded="false" aria-controls="menu-classes" hidden><span id="titre-classe-colle"><\/span>/);
  assert.match(style.slice(0, style.indexOf("@media")), /\.barre-onglets \{ position: sticky; top: 0; z-index: 5;[^}]*background: var\(--page\); \}/,
    "collée en haut à toutes les largeurs (téléphone et ordinateur), sur le fond de la page");
  assert.match(script, /const ZONES_TEXTE = \[[^\]]*"titre-classe-colle"/, "le nom de la classe part aussi à la déconnexion");
  assert.match(fonction("ouvrirClasse"), /\$\("titre-classe-colle"\)\.textContent = classe\.libelle;/);
});

test("la barre collée : « 405 ▾ » n'apparaît que collée, dans une classe ; le menu ouvert depuis elle se ferme quand elle se décolle", () => {
  const {$, el, doc} = document();
  $("ecran-classe").hidden = false;
  $("menu-classes").hidden = true;
  $("menu-classes").appendChild($("menu-classes-liste"));
  const etat = {classe: {id: 5}, suite: 0};
  const f = new Function("$", "el", "document", "window", "classes", "etat", "montrerOngletChoisi",
    `let menuOuvertPar = null;\nlet classe = etat.classe;\nconst eleves = [];\nconst LIBELLES_DIRECT = {};
     ${["poserMenuClasses", "ouvrirMenuClasses", "fermerMenuClasses", "garderDansLEcran", "barreCollee", "marquerBarreCollee", "remonterALaBarre"].map(fonction).join("\n")}
     return {ouvrirMenuClasses, marquerBarreCollee, remonterALaBarre, ouvertPar: () => menuOuvertPar};`)(
    $, el, doc, {scrollY: 900, scrollTo: (x, y) => { etat.vers = y; }}, [{id: 5, libelle: "405", eleves: 10}], etat, () => { etat.suite += 1; });
  $("repere-onglets").rect = {top: 120, bottom: 120, left: 0, right: 0};
  f.marquerBarreCollee();
  assert.equal($("onglets").classList.contains("collee"), false);
  $("repere-onglets").rect = {top: -800, bottom: -800, left: 0, right: 0};
  f.marquerBarreCollee();
  assert.equal($("onglets").classList.contains("collee"), true, "on a descendu : la barre est collée");
  assert.equal($("bouton-classes-colle").hidden, false, "« 405 ▾ » apparaît au début de la barre");
  assert.ok(etat.suite >= 1, "les onglets refont leur effacement (la place a changé)");
  $("bouton-classes-colle").rect = {top: 0, bottom: 48, left: 16, right: 80};
  f.ouvrirMenuClasses($("bouton-classes-colle"));
  assert.ok($("menu-classes").classList.contains("depuis-barre"));
  assert.equal($("menu-classes").style.top, "54px", "le menu s'ouvre juste sous la barre");
  f.remonterALaBarre();
  assert.equal(etat.vers, 106, "changer d'appli depuis la barre : on arrive au début de l'appli (900 − 800, plus la marge), barre toujours collée");
  $("repere-onglets").rect = {top: 50, bottom: 50, left: 0, right: 0};
  f.marquerBarreCollee();
  assert.equal($("bouton-classes-colle").hidden, true);
  assert.equal($("menu-classes").hidden, true, "décollée : le menu ouvert depuis elle se ferme");
  assert.equal($("menu-classes").style.top, "");
  $("ecran-classe").hidden = true;
  $("repere-onglets").rect = {top: -800, bottom: -800, left: 0, right: 0};
  f.marquerBarreCollee();
  assert.equal($("onglets").classList.contains("collee"), false, "hors de Ma classe, jamais collée");
});

test("changer de classe ramène en haut de la page ; rouvrir la même classe (un élève ajouté) ne bouge pas", () => {
  const ouvrir = fonction("ouvrirClasse");
  assert.match(ouvrir, /if \(!memeClasse\) window\.scrollTo\(0, 0\);/);
  assert.ok(ouvrir.indexOf("window.scrollTo(0, 0)") > ouvrir.indexOf("if (numero !== demandeAppli || !jeton) return;"), "seulement quand la nouvelle classe est là");
  assert.match(script, /\$\("choix-appli"\)\.addEventListener\("click", evenement => \{\s*if \(evenement\.target\.closest && evenement\.target\.closest\("button\[data-appli\]"\)\) remonterALaBarre\(\);/);
  assert.match(script, /closest\("\.choix-classe, #bouton-classes-colle"\)\) fermerMenuClasses\(\);/, "toucher « 405 ▾ » de la barre ne referme pas le menu qu'il ouvre");
});

// ------------------------------------------------------------ onglets ou sélecteur d'appli

test("onglets ou sélecteur : les onglets tant qu'ils tiennent sur la ligne, sinon « Défi tables ▾ » (la page mesure)", () => {
  const {$} = document();
  const etat = {appliAffichee: "coffres", vue: "appli", largeur: 600};
  $("menu-applis").hidden = true;
  Object.defineProperty($("choix-appli"), "scrollWidth", {get: () => etat.largeur});
  $("choix-appli").clientWidth = 400;
  const poser = new Function("$", "APPLIS", "etat",
    `let appliAffichee = etat.appliAffichee; let vue = etat.vue;\n${["poserModeApplis", "fermerMenuApplis"].map(fonction).join("\n")}\nreturn poserModeApplis;`)(
    $, [{cle: "defi-tables", nom: "Défi tables"}, {cle: "coffres", nom: "Coffres magiques"}], etat);
  assert.equal(poser(), true, "600 px d'onglets dans 400 px : le sélecteur");
  assert.equal($("choix-appli-menu").hidden, false);
  assert.ok($("onglets").classList.contains("mode-selecteur"));
  assert.equal($("nom-appli").textContent, "Coffres magiques", "il dit l'appli regardée");
  assert.ok($("bouton-applis").classList.contains("actif"));
  etat.largeur = 380;
  assert.equal(poser(), false, "tout tient : les onglets");
  assert.equal($("choix-appli-menu").hidden, true);
  assert.ok(!$("onglets").classList.contains("mode-selecteur"));
  assert.match(style, /\.barre-onglets\.mode-selecteur > #choix-appli \{ display: none; \}/);
  assert.match(fonction("montrerOngletChoisi"), /if \(poserModeApplis\(\)\) return;/);
});

test("le sélecteur d'appli : la liste des onglets, l'appli regardée cochée, le gris recopié (lot 5b), plus de pastille (lot 8) ; choisir = toucher son onglet", () => {
  const {$, el} = document();
  // Lot 5b : chaque appli a toujours son onglet. Coffres est fermé à la
  // classe (grisé), Anzan n'est ouvert qu'à un élève (lot 8 : sans pastille,
  // le lecteur d'écran entend « ouvert à 1 élève »).
  const onglets = ["defi-tables", "coffres", "flash-anzan", "splat"].map((cle, i) => {
    const onglet = Object.assign(new Noeud("button"), {dataset: {appli: cle}, textContent: ["Défi tables", "Coffres magiques", "Anzan", "SPLAT!"][i],
      touche: 0, click() { this.touche += 1; }});
    if (cle === "coffres") { onglet.classList.add("eteint"); onglet.attributs["aria-label"] = "Coffres magiques, fermé à la classe"; }
    if (cle === "flash-anzan") onglet.attributs["aria-label"] = "Anzan, ouvert à 1 élève";
    onglet.hasAttribute = nom => nom in onglet.attributs;
    onglet.getAttribute = nom => onglet.attributs[nom];
    onglet.querySelector = sel => (sel === ".compte-plus" ? onglet.enfants.find(n => n.className === "compte-plus") || null : null);
    return onglet;
  });
  const doc = {createElement: b => new Noeud(b), querySelectorAll: () => onglets, documentElement: {clientWidth: 1440}};
  $("menu-applis").hidden = true;
  $("menu-applis-liste").querySelector = function (sel) {
    const tous = this.enfants.map(li => li.enfants[0]);
    return sel.includes("aria-current") ? tous.find(b => b.attributs["aria-current"] === "true") || null : tous[0] || null;
  };
  const APPLIS = [{cle: "defi-tables", nom: "Défi tables"}, {cle: "coffres", nom: "Coffres magiques"}, {cle: "flash-anzan", nom: "Anzan"}, {cle: "splat", nom: "SPLAT!"}];
  const f = new Function("$", "el", "document", "classe", "APPLIS", `let vue = "appli"; let appliAffichee = "splat";\n${["nomDeLAppli", "ouvrirMenuApplis", "fermerMenuApplis", "garderDansLEcran"].map(fonction).join("\n")}\nreturn {ouvrirMenuApplis};`)(
    $, el, doc, {id: 5}, APPLIS);
  f.ouvrirMenuApplis();
  const boutons = $("menu-applis-liste").enfants.map(li => li.enfants[0]);
  assert.deepEqual(boutons.map(b => b.textContent), ["Défi tables", "Coffres magiques", "Anzan", "SPLAT!"], "toutes les applis, comme leurs onglets");
  assert.deepEqual(boutons.map(b => b.className), ["", "eteint", "", ""], "Coffres, fermé à la classe, est grisé comme son onglet");
  assert.deepEqual(boutons[2].enfants, [], "Anzan : son nom seul, plus de pastille « 1 » (lot 8)");
  assert.doesNotMatch(fonction("ouvrirMenuApplis"), /compte-plus|cloneNode/);
  assert.equal(boutons[2].attributs["aria-label"], "Anzan, ouvert à 1 élève");
  assert.equal(boutons[1].attributs["aria-label"], "Coffres magiques, fermé à la classe");
  assert.deepEqual(boutons.map(b => b.attributs["aria-current"] || ""), ["", "", "", "true"]);
  assert.equal(boutons[3].focalise, true);
  boutons[1].ecouteurs.click();
  assert.equal(onglets[1].touche, 1, "le même chemin que l'onglet : mêmes vérifications, même retour en haut de l'appli");
  assert.equal($("menu-applis").hidden, true);
  assert.match(script, /if \(evenement\.key === "Escape" && !\$\("menu-applis"\)\.hidden\) \{ evenement\.preventDefault\(\); fermerMenuApplis\(true\); \}/);
});
