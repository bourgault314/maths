import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = "_serveur/public/prof/index.php";

// Lot 7 du suivi (03/09/2026) — la page « Ma classe » et le papier.
//
// Ce qui est vérifié ici, c'est la LOGIQUE testable de la page : l'ordre et le
// contenu des deux feuilles imprimées, la file de redessin qui empêche un tri
// d'effacer une saisie de prénom en vol, le texte de la confirmation qui donne
// les codes à un collègue, le verrou d'inactivité, et la liste des zones vidées
// à la déconnexion. Le reste (le DOM réellement vide après « Se déconnecter »,
// le retour 35 minutes plus tard, la sortie de l'imprimante) se vérifie à la
// main : c'est dit dans la notice, pas prétendu ici.
//
// Sabotages attendus (chacun rend un test rouge) :
//  a) rendre `creerFileRedessin.demander()` inconditionnel → le tri efface la saisie
//  b) retirer le prénom de la bandelette → elle ne dit plus à qui la donner
//  c) remettre un trait au milieu (border-right sur .identite) → la souche revient
//  d) enlever l'adresse ou la consigne de la bandelette
//  e) enlever "corps" ou "fiche-corps" de ZONES_TEXTE
//  f) rendre texteConfirmationPartage() vide pour "ecriture"
//  g) faire dépendre creerVeille d'un compteur au lieu de l'horloge
//  h) trier les prénoms avec < et > (caractère par caractère) → Léa après Lucas
//  i) laisser les sans-prénom remonter en tête quand on trie de Z à A

const page = readFileSync(join(racine, PAGE), "utf8");
const BALISE = '<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">';
const script = (() => {
  const debut = page.indexOf(BALISE);
  const fin = page.indexOf("</script>", debut);
  assert.ok(debut > 0 && fin > debut, "le script en ligne de la page prof doit être trouvé");
  return page.slice(debut, fin);
})();

// Le texte d'un bloc { … } équilibré à partir d'une position.
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
  const position = script.indexOf(`function ${nom}(`);
  assert.ok(position > 0, `la page doit définir ${nom}()`);
  return blocDepuis(script, position);
}

// La valeur d'une const déclarée dans le script (tableau ou chaîne).
function constante(nom) {
  const position = script.indexOf(`const ${nom} = `);
  assert.ok(position > 0, `la page doit définir ${nom}`);
  const debut = position + `const ${nom} = `.length;
  let i = debut, profondeur = 0, dansTexte = "";
  for (; i < script.length; i += 1) {
    const c = script[i];
    if (dansTexte) { if (c === dansTexte && script[i - 1] !== "\\") dansTexte = ""; continue; }
    if (c === '"' || c === "'" || c === "`") { dansTexte = c; continue; }
    if ("[{(".includes(c)) profondeur += 1;
    else if ("]})".includes(c)) profondeur -= 1;
    else if (c === ";" && profondeur === 0) break;
  }
  return new Function(`return (${script.slice(debut, i)});`)();
}

// ------------------------------------------------------------ un document de poche

function creerElement(tag) {
  return {
    tag,
    className: "",
    hidden: false,
    value: "",
    style: {},
    dataset: {},
    enfants: [],
    _texte: "",
    set textContent(valeur) { this._texte = valeur === null ? "" : String(valeur); this.enfants = []; },
    get textContent() {
      if (this.enfants.length) return this.enfants.map(e => e.textContent).join(" ");
      return this._texte;
    },
    append(...noeuds) { this.enfants.push(...noeuds); },
    appendChild(noeud) { this.enfants.push(noeud); return noeud; },
  };
}

function creerDocument(ids) {
  const noeuds = new Map();
  (ids || []).forEach(id => noeuds.set(id, creerElement("div")));
  return {
    noeuds,
    $: id => {
      if (!noeuds.has(id)) noeuds.set(id, creerElement("div"));
      return noeuds.get(id);
    },
    document: {createElement: tag => creerElement(tag)},
  };
}

const ordreDeLaFeuille = new Function(`${fonction("ordreDeLaFeuille")}\nreturn ordreDeLaFeuille;`)();
const nomAffiche = new Function(`${fonction("nomAffiche")}\nreturn nomAffiche;`)();

function classeDEssai() {
  const codes = ["TDJM2L", "27XCYE", "RKUJ5F", "9K7ZE8", "MMKNRF", "ACUNB9", "RKBKW6", "LKCHEU"];
  return codes.map((code, index) => ({id: 100 + index, code, prenom: "", initiale: "", lu: {acquises: []}}));
}

// dessinerFiche / dessinerBandelettes / dessinerPapier, exécutées telles qu'elles
// sont écrites dans la page, avec un document de poche.
function papierRendu(eleves, droit = "proprietaire") {
  const faux = creerDocument();
  new Function("document", "$", "eleves", "classe", "nomAffiche", "ordreDeLaFeuille", "droitClasse",
    `${fonction("dessinerFiche")}\n${fonction("dessinerBandelettes")}\n${fonction("dessinerPapier")}\n`
    + `${script.slice(script.indexOf("const CONSIGNE_BANDELETTE"), script.indexOf("\n", script.indexOf("const ADRESSE_ELEVE")))}\n`
    + "dessinerPapier();")(
    faux.document, faux.$, eleves, {libelle: "6eB"}, nomAffiche, ordreDeLaFeuille, droit);
  const recap = faux.$("fiche-corps").enfants.map(ligne => ({
    numero: ligne.enfants[0].textContent,
    nom: ligne.enfants[1].textContent,
    code: ligne.enfants[2] ? ligne.enfants[2].textContent : "",
    cellules: ligne.enfants.length,
  }));
  const bandelettes = faux.$("bandelettes-liste").enfants.map(item => {
    const identite = item.enfants.find(e => e.className === "identite");
    const part = item.enfants.find(e => e.className === "part");
    return {identite: identite.textContent, part: part.textContent, pieces: item.enfants.map(e => e.className),
            code: part.enfants.find(e => e.className === "code-ligne").enfants.find(e => e.className === "code").textContent};
  });
  return {recap, bandelettes, faux, consigne: faux.$("bandelettes-consigne").textContent,
          titreRecap: faux.$("fiche-titre").textContent,
          titreBandelettes: faux.$("bandelettes-titre").textContent,
          ficheCachee: faux.$("fiche").hidden, bandelettesCachees: faux.$("bandelettes").hidden};
}

// ---------------------------------------------------------------- les bandelettes

// Lot « Ma classe : tri et bandelette » (21/10/2026) : la bandelette est d'un
// seul tenant. La souche que le professeur détachait (numéro et prénom) ne
// protégeait rien — qui tape un code voit de toute façon le prénom et la
// classe — et une bandelette sans prénom pouvait s'échanger à la distribution.
test("chaque bandelette, d'un seul tenant : numéro, prénom, adresse, code et consigne", () => {
  const eleves = classeDEssai();
  eleves[0].prenom = "Léa"; eleves[0].initiale = "B";
  eleves[3].prenom = "Sam";
  const {bandelettes, consigne} = papierRendu(eleves);
  assert.equal(bandelettes.length, 8);
  bandelettes.forEach((bandelette, index) => {
    assert.deepEqual(bandelette.pieces, ["identite", "part"], `bandelette ${index + 1} : le prénom à gauche, le reste à droite`);
    assert.match(bandelette.identite, new RegExp(`^n° ${index + 1}\\b`), `bandelette ${index + 1} : son numéro de la feuille`);
    assert.match(bandelette.part, /suivi\.mathsgo\.re/, `bandelette ${index + 1} : l'adresse`);
    assert.match(bandelette.part, /ton code/, `bandelette ${index + 1} : « ton code »`);
    assert.match(bandelette.part, /Ton code est personnel : ne le prête à personne\./,
      `bandelette ${index + 1} : la consigne`);
    assert.ok(bandelette.part.includes(bandelette.code), `bandelette ${index + 1} : le code`);
  });
  assert.match(bandelettes[0].identite, /Léa B\./, "le prénom et l'initiale, pour distribuer sans échange");
  assert.match(bandelettes[1].identite, /Sam/);
  // Sans prénom, la bandelette garde son numéro et un tiret : on distribue par numéro.
  assert.match(bandelettes[2].identite, /^n° 3\s*—$/);
  assert.equal(consigne, "Découpe sur les pointillés et donne à chaque élève sa bandelette. Mêmes numéros que sur la feuille prénom\u00a0↔\u00a0code.");
});

test("plus de souche : ni trait au milieu, ni consigne « tu détaches… », ni classe .souche", () => {
  const style = page.slice(page.indexOf("<style>"), page.indexOf("</style>"));
  const regle = style.slice(style.indexOf(".bandelette .identite {"), style.indexOf("}", style.indexOf(".bandelette .identite {")));
  assert.ok(regle.length > 0, "la règle de la partie gauche existe");
  assert.doesNotMatch(regle, /border/, "pas de trait entre le prénom et le code : une seule pièce");
  assert.match(style, /\.bandelette \{ display: flex;[^}]*border: 1px dashed #8a8a8a;/, "le cadre en pointillés reste autour de chaque bandelette");
  assert.doesNotMatch(page, /class(Name)? ?=? ?"souche"|\.souche\b/, "plus aucune souche dans la page");
  assert.doesNotMatch(page, /[Tt]u détaches|ne porte pas son\s+prénom|son code sans son prénom/, "plus de consigne de souche");
  assert.match(page, /title="À découper et à distribuer : une par élève, avec son prénom et son code">Imprimer les bandelettes</);
});

test("bandelettes et feuille prénom ↔ code : même ordre, mêmes numéros", () => {
  const eleves = classeDEssai();
  eleves[2].prenom = "Zoé";
  eleves[6].prenom = "ali";
  const {recap, bandelettes, titreRecap, titreBandelettes} = papierRendu(eleves);
  const attendu = ordreDeLaFeuille(eleves).map(e => e.code);
  assert.deepEqual(recap.map(l => l.code), attendu);
  assert.deepEqual(bandelettes.map(b => b.code), attendu);
  assert.deepEqual(recap.map(l => l.numero), ["1", "2", "3", "4", "5", "6", "7", "8"]);
  bandelettes.forEach((b, i) => assert.match(b.identite, new RegExp(`n° ${i + 1}\\b`)));
  assert.match(titreRecap, /Prénom ↔ code — 6eB/);
  assert.match(titreBandelettes, /Bandelettes à découper — 6eB/);
  // La feuille récapitulative n'a plus de colonne « Découper » : les ciseaux
  // sont passés sur les bandelettes.
  assert.deepEqual([...new Set(recap.map(l => l.cellules))], [3]);
  assert.match(page, /<thead><tr><th>N°<\/th><th>Élève<\/th><th>Code<\/th><\/tr><\/thead>/);
});

test("en lecture seule, aucune des deux feuilles n'est construite", () => {
  const {recap, bandelettes, ficheCachee, bandelettesCachees, titreRecap} =
    papierRendu(classeDEssai(), "lecture");
  assert.equal(recap.length, 0, "pas de feuille prénom ↔ code");
  assert.equal(bandelettes.length, 0, "pas de bandelettes");
  assert.equal(ficheCachee, true);
  assert.equal(bandelettesCachees, true);
  assert.equal(titreRecap, "", "pas même le titre « Codes des élèves » sur une feuille vide");
});

test("la feuille des codes ne sort que par un bouton : Ctrl+P imprime le mode d'emploi", () => {
  assert.match(page, /body\.imprime-recap \.fiche \{ display: block; \}/);
  assert.match(page, /body\.imprime-bandelettes \.bandelettes \{ display: block; \}/);
  // Lot 4b : « Imprimer » du parcours Anzan a sa classe à lui (imprime-anzan).
  assert.match(page, /body:not\(\.imprime-recap\):not\(\.imprime-bandelettes\):not\(\.imprime-anzan\) \.note-impression \{ display: block; \}/);
  const source = fonction("imprimer");
  assert.match(source, /droitClasse === "lecture"/, "un collègue en lecture seule n'imprime rien");
  assert.match(source, /classList\.add\(classeCss\)/);
  assert.match(source, /afterprint/);
  assert.match(script, /\$\("imprimer-bandelettes"\)\.addEventListener\("click", \(\) => imprimer\("bandelettes"\)\)/);
  assert.match(script, /\$\("imprimer-recap"\)\.addEventListener\("click", \(\) => imprimer\("recap"\)\)/);
});

// Lot 2b (03/10/2026) : en retirant les styles de la colonne Expert, le lot
// avait emporté tout le bloc qui suivait — à l'écran, les bandelettes et la
// feuille prénom ↔ code s'affichaient sous le tableau, [hidden] ne cachait
// plus les cartes, et les boîtes de dialogue perdaient leur dessin.
test("à l'écran, les deux feuilles restent cachées et [hidden] cache pour de bon", () => {
  const style = page.slice(page.indexOf("<style>"), page.indexOf("</style>"));
  const ecran = style.slice(0, style.indexOf("@media"));
  [
    ".fiche, .bandelettes, .note-impression { display: none; }",
    "[hidden] { display: none !important; }",
    ".bandelette { display: flex;",
    ".bandelette .identite {",
    ".bandelette .code-ligne .code {",
    ".avertissement-papier {",
    ".apercu {",
    "dialog {",
    "dialog::backdrop {",
    ".fragiles strong {",
    ".barre-outils {"
  ].forEach(regle => assert.ok(ecran.includes(regle), `règle perdue : ${regle}`));
  assert.ok(!style.includes(".rang {") && !style.includes(".expert-case"), "les styles de la colonne Expert, eux, sont partis");
});

// ------------------------------------------------- le tri « Prénom » des tableaux

// Lot « Ma classe : tri et bandelette » (21/10/2026) : les prénoms se
// comparaient caractère par caractère, Léa passait après Lucas et Maëlys après
// Mathis. Le tableau trié par prénom suit maintenant la feuille prénom ↔ code.
const trierPar = (liste, tri) => new Function("eleves", "tri",
  `${fonction("ordreDeLaFeuille")}\n${fonction("trierEleves")}\ntrierEleves();\nreturn eleves;`)(liste, tri);
const classeAccents = () => ["Lucas", "", "Léa", "Mathis", "Lina", "émile", "Maëlys", "Loïc", "", "Manon", "Zoé", "ali"]
  .map((prenom, i) => ({id: i + 1, code: `C${String(20 - i).padStart(2, "0")}XYZ`, prenom, initiale: "", lu: {}}));

test("tri « Prénom » de A à Z : à la française, et exactement l'ordre de la feuille prénom ↔ code", () => {
  const eleves = classeAccents();
  const memeTableau = eleves;
  const trie = trierPar(eleves, {colonne: "prenom", sens: 1});
  assert.equal(trie, memeTableau, "le tableau est trié sur place (les autres fonctions gardent la même liste)");
  assert.deepEqual(trie.map(e => e.prenom),
    ["ali", "émile", "Léa", "Lina", "Loïc", "Lucas", "Maëlys", "Manon", "Mathis", "Zoé", "", ""]);
  assert.deepEqual(trie.map(e => e.id), ordreDeLaFeuille(classeAccents()).map(e => e.id),
    "même ordre que la feuille, sans-prénom compris (rangés par code)");
});

test("tri « Prénom » de Z à A : l'inverse, et les sans-prénom restent en bas", () => {
  const trie = trierPar(classeAccents(), {colonne: "prenom", sens: -1});
  assert.deepEqual(trie.map(e => e.prenom),
    ["Zoé", "Mathis", "Manon", "Maëlys", "Lucas", "Loïc", "Lina", "Léa", "émile", "ali", "", ""]);
  const feuille = ordreDeLaFeuille(classeAccents()).filter(e => !e.prenom).map(e => e.code);
  assert.deepEqual(trie.slice(-2).map(e => e.code), feuille, "les sans-prénom dans l'ordre de la feuille");
});

test("le clic sur un titre de colonne passe par trierEleves ; plus de menu « Trier par » (serveur pro, lot 5c)", () => {
  assert.match(fonction("dessinerTableau"), /^\s*function dessinerTableau\(\) \{\s*trierEleves\(\);/);
  const clic = blocDepuis(script, script.indexOf('document.querySelectorAll("th button[data-tri]")'));
  assert.match(clic, /tri = \{colonne, sens: tri\.colonne === colonne \? -tri\.sens : \(colonne === "prenom" \? 1 : -1\)\};/);
  assert.match(clic, /redessin\.demander\(\)/);
  assert.doesNotMatch(page, /id="tri"|Trier&nbsp;par|\$\("tri"\)/, "le menu « Trier par » est parti");
});

// ------------------------------------------------- tri pendant une saisie de prénom

const creerFileRedessin = new Function(`${fonction("creerFileRedessin")}\nreturn creerFileRedessin;`)();

test("un tri demandé pendant qu'un prénom part au serveur attend la réponse", () => {
  const dessins = [];
  const file = creerFileRedessin(() => dessins.push(dessins.length + 1));
  // Rien en vol : le tri redessine tout de suite.
  assert.equal(file.demander(), true);
  assert.equal(dessins.length, 1);
  // Une saisie part ; le clic sur l'en-tête de tri ne redessine pas.
  file.debut();
  assert.equal(file.demander(), false);
  assert.equal(dessins.length, 1, "le champ de saisie n'est pas détruit sous les doigts");
  assert.equal(file.enAttente(), true);
  // La réponse arrive : le redessin en attente part, une seule fois.
  file.fin();
  assert.equal(dessins.length, 2);
  assert.equal(file.enAttente(), false);
  assert.equal(file.combien(), 0);
});

test("plusieurs saisies en vol : un seul redessin, à la dernière réponse", () => {
  let dessins = 0;
  const file = creerFileRedessin(() => { dessins += 1; });
  file.debut(); file.debut(); file.debut();
  file.demander(); file.demander(); file.demander();
  assert.equal(dessins, 0);
  file.fin(); assert.equal(dessins, 0);
  file.fin(); assert.equal(dessins, 0);
  file.fin(); assert.equal(dessins, 1);
  // Une réponse de trop ne fait pas descendre le compteur sous zéro.
  file.fin();
  assert.equal(file.combien(), 0);
  assert.equal(dessins, 1);
});

test("les deux commandes de tri et les redessins d'action passent par la file", () => {
  // Le clic sur un en-tête, le menu « Trier par », « Nouveau code » et
  // « Supprimer » : plus aucun dessinerTableau() direct dans un gestionnaire.
  const gestionnaireEntete = blocDepuis(script, script.indexOf('document.querySelectorAll("th button[data-tri]")'));
  assert.match(gestionnaireEntete, /redessin\.demander\(\)/);
  assert.ok(!/dessinerTableau\(\)/.test(gestionnaireEntete), "l'en-tête ne redessine plus directement");
  // Lot 5c : la recherche aussi passe par la file.
  const gestionnaireRecherche = blocDepuis(script, script.indexOf('$("chercher-eleve").addEventListener("input"'));
  assert.match(gestionnaireRecherche, /redessin\.demander\(\)/);
  assert.ok(!/dessinerTableau\(\)/.test(gestionnaireRecherche));
  const source = fonction("nommer");
  assert.match(source, /redessin\.debut\(\)/);
  assert.match(source, /redessin\.fin\(\)/);
  // Mise à jour optimiste : le prénom tapé vaut avant la réponse, et revient en
  // arrière si le serveur refuse.
  const avantAppel = source.slice(0, source.indexOf("await api("));
  assert.match(avantAppel, /eleve\.prenom = prenom/, "le prénom est posé AVANT l'appel");
  assert.match(source, /eleve\.prenom = avant\.prenom/, "et remis en place si le serveur refuse");
});

test("« Léa B. » se lit pareil au clavier et dans la liste collée", () => {
  const lireNom = new Function(`${fonction("lireNom")}\nreturn lireNom;`)();
  assert.deepEqual(lireNom("  Léa   B. "), {prenom: "Léa", initiale: "B"});
  assert.deepEqual(lireNom("Sam"), {prenom: "Sam", initiale: ""});
  assert.deepEqual(lireNom(""), {prenom: "", initiale: ""});
  assert.deepEqual(lireNom("Jean Baptiste"), {prenom: "Jean", initiale: "B"});
  // Le collage l'utilise aussi : une seule règle pour les deux chemins.
  const collage = blocDepuis(script, script.indexOf('$("coller-prenoms").addEventListener("click"'));
  assert.match(collage, /lireNom\(prenoms\[index\]\)/);
});

// ------------------------------------------------------- donner les codes à un collègue

const texteConfirmationPartage =
  new Function(`${fonction("texteConfirmationPartage")}\nreturn texteConfirmationPartage;`)();

test("passer un collègue en écriture demande confirmation, en nommant les codes donnés", () => {
  const texte = texteConfirmationPartage("collegue-lecture", "ecriture", 28);
  assert.match(texte, /Autoriser collegue-lecture à modifier cette classe \?/);
  assert.match(texte, /les 28 codes des élèves/);
  assert.match(texte, /on ouvre l’appli comme l’élève/);
  assert.equal(texteConfirmationPartage("x", "ecriture", 1).includes("le code de l’élève"), true);
  assert.match(texteConfirmationPartage("x", "ecriture", 0), /les codes des élèves/);
  // Retirer un droit ne donne rien à personne : pas de question dans ce sens.
  assert.equal(texteConfirmationPartage("collegue", "lecture", 28), "");
});

test("les deux chemins qui donnent l'écriture passent par la confirmation", () => {
  assert.match(fonction("demanderPuisPartager"), /texteConfirmationPartage\(/);
  assert.match(fonction("demanderPuisPartager"), /if \(question && !await demander\(question, null, \{oui: "Autoriser"\}\)\) return;/);
  const listeur = fonction("chargerPartages");
  assert.match(listeur, /demanderPuisPartager\(partage,/);
  assert.ok(!/=> partager\(partage\.prof_id,/.test(listeur), "plus d'appel direct depuis la liste");
  const ajout = blocDepuis(script, script.indexOf('$("ajouter-partage").addEventListener("click"'));
  assert.match(ajout, /texteConfirmationPartage\(/);
});

// ------------------------------------------------------------- verrou d'inactivité

const creerVeille = new Function(`${fonction("creerVeille")}\nreturn creerVeille;`)();

test("30 minutes sans un geste ferment la session, un geste réarme le verrou", () => {
  const MINUTE = 60000;
  const veille = creerVeille(30 * MINUTE);
  assert.equal(veille.active(), false, "avant la connexion, rien à surveiller");
  assert.equal(veille.doitFermer(1e12), false);
  const t0 = 1_000_000_000_000;
  veille.demarrer(t0);
  assert.equal(veille.doitFermer(t0 + 29 * MINUTE), false);
  assert.equal(veille.doitFermer(t0 + 30 * MINUTE), true);
  // Un geste à la 29e minute repousse l'échéance.
  veille.geste(t0 + 29 * MINUTE);
  assert.equal(veille.doitFermer(t0 + 45 * MINUTE), false);
  assert.equal(veille.doitFermer(t0 + 59 * MINUTE + 1), true);
  // Machine mise en veille trois heures : les minuteurs n'ont pas tourné, mais
  // l'horloge, si. C'est elle qui décide.
  veille.geste(t0);
  assert.equal(veille.doitFermer(t0 + 3 * 3600 * 1000), true);
  // Après la déconnexion, plus rien à fermer (et pas de boucle de rechargement).
  veille.arreter();
  assert.equal(veille.doitFermer(t0 + 10 * 3600 * 1000), false);
});

test("le verrou est armé à la connexion et contrôlé au retour sur l'onglet", () => {
  assert.match(script, /const INACTIVITE_MS = 30 \* 60 \* 1000;/);
  assert.match(script, /veille\.demarrer\(Date\.now\(\)\)/);
  assert.match(fonction("controlerVeille"), /deconnecter\(\{recharger: true, avis: "inactivite"\}\)/);
  assert.match(script, /document\.addEventListener\("visibilitychange"/);
  assert.match(script, /setInterval\(controlerVeille, 60000\)/);
  assert.match(fonction("oublierEtat"), /veille\.arreter\(\)/);
  // Le message survit au rechargement : il est posé avant, lu après.
  assert.match(script, /inactivite: "Tu as été déconnecté après 30 minutes/);
  assert.match(fonction("lireAvis"), /sessionStorage\.removeItem\(CLE_AVIS\)/);
});

// --------------------------------------------------- ce qui reste après « Se déconnecter »

const ZONES_TEXTE = constante("ZONES_TEXTE");
const ZONES_MESSAGE = constante("ZONES_MESSAGE");
const CHAMPS_A_VIDER = constante("CHAMPS_A_VIDER");
const BLOCS_A_CACHER = constante("BLOCS_A_CACHER");

test("viderZones() vide toutes les zones annoncées, referme les boîtes", () => {
  const tous = [...ZONES_TEXTE, ...ZONES_MESSAGE, ...CHAMPS_A_VIDER, ...BLOCS_A_CACHER, "boite", "secret"];
  const faux = creerDocument(tous);
  tous.forEach(id => {
    const noeud = faux.$(id);
    noeud.textContent = "Léa B. A65TV3";
    noeud.value = "A65TV3";
    noeud.hidden = false;
    noeud.open = true;
    noeud.close = () => { noeud.open = false; };
  });
  let impressionsQuittees = 0;
  new Function("$", "ZONES_TEXTE", "ZONES_MESSAGE", "CHAMPS_A_VIDER", "BLOCS_A_CACHER", "quitterImpressions",
    `${fonction("viderZones")}\nviderZones();`)(faux.$, ZONES_TEXTE, ZONES_MESSAGE, CHAMPS_A_VIDER, BLOCS_A_CACHER, () => { impressionsQuittees += 1; });
  assert.equal(impressionsQuittees, 1, "lot 4b-bis : plus aucune feuille prête à sortir à l'imprimante après la déconnexion");
  ZONES_TEXTE.forEach(id => assert.equal(faux.$(id).textContent, "", `${id} vidé`));
  ZONES_MESSAGE.forEach(id => {
    assert.equal(faux.$(id).textContent, "", `${id} vidé`);
    assert.equal(faux.$(id).hidden, true, `${id} masqué`);
  });
  CHAMPS_A_VIDER.forEach(id => assert.equal(faux.$(id).value, "", `${id} vidé`));
  BLOCS_A_CACHER.forEach(id => assert.equal(faux.$(id).hidden, true, `${id} masqué`));
  assert.equal(faux.$("boite").open, false, "la boîte de dialogue est refermée");
  assert.equal(faux.$("secret").open, false, "le mot de passe temporaire ne reste pas affiché");
});

test("toute zone de la page qui reçoit des données est dans la liste à vider", () => {
  // Le garde-fou qui survivra aux lots suivants : si quelqu'un ajoute une
  // liste, un tableau ou un titre rempli par le script, il doit apparaître
  // dans ZONES_TEXTE, sinon les prénoms et les codes y resteront après la
  // déconnexion.
  const conteneurs = [...page.matchAll(/<(ul|tbody|h1|h2)\b[^>]*\bid="([^"]+)"/g)].map(m => m[2]);
  assert.ok(conteneurs.length >= 10, `assez de conteneurs trouvés (${conteneurs.length})`);
  conteneurs.forEach(id => assert.ok(ZONES_TEXTE.includes(id),
    `« ${id} » est rempli par le script : il doit être dans ZONES_TEXTE`));
  const messages = [...page.matchAll(/<p class="message(?: erreur)?"[^>]*\bid="([^"]+)"/g)].map(m => m[1]);
  assert.ok(messages.length >= 6, `assez de zones de message trouvées (${messages.length})`);
  messages.forEach(id => assert.ok(ZONES_MESSAGE.includes(id),
    `« ${id} » peut porter un prénom ou un mot de passe : il doit être dans ZONES_MESSAGE`));
});

test("« Se déconnecter » vide d'abord, prévient le serveur ensuite, puis recharge", () => {
  const source = fonction("deconnecter");
  const posOublier = source.indexOf("oublierEtat()");
  const posVider = source.indexOf("viderZones()");
  const posFermer = source.indexOf("fermerSession(");
  assert.ok(posOublier > 0 && posVider > posOublier && posFermer > posVider,
    "on vide l'état et le document AVANT d'attendre le réseau");
  assert.ok(!/await/.test(source.slice(0, posFermer)), "aucune attente avant d'avoir vidé la page");
  assert.match(script, /\$\("deconnexion"\)\.addEventListener\("click", \(\) => deconnecter\(\{recharger: true\}\)\)/);
  // Réseau coupé : deux essais, puis on le dit au lieu d'avaler l'échec.
  const fermer = fonction("fermerSession");
  assert.match(fermer, /essai < 2/);
  assert.match(script, /"serveur-muet": "Déconnexion faite sur cet appareil/);
  assert.match(source, /poserAvis\("serveur-muet"\)/);
});

test("le mot de passe temporaire d'un collègue ne s'écrit plus dans la page", () => {
  assert.ok(!/messager\([^;]*motdepasse/s.test(script),
    "aucun message de la page ne contient le mot de passe temporaire");
  assert.match(fonction("reinitialiserProf"), /montrerSecret\(/);
  assert.match(blocDepuis(script, script.indexOf('$("ajouter-prof").addEventListener("click"')), /montrerSecret\(/);
  const secret = fonction("montrerSecret");
  assert.match(secret, /setTimeout\(effacer, 120000\)/, "effacé tout seul au bout de deux minutes");
  assert.match(secret, /\$\("secret-note"\)\.onclick = effacer/, "« J’ai noté » l'efface");
  assert.match(secret, /\$\("secret-valeur"\)\.textContent = ""/);
});

test("les boutons qui envoient sont désactivés pendant l'envoi", () => {
  // Lot « Ma classe : élèves » (18/10/2026) : « + Nouvelle classe » ouvre une
  // petite fenêtre ; une création à la fois, même si l'on reclique pendant l'envoi.
  const creerClasse = fonction("creerClasse");
  assert.match(creerClasse, /if \(creationEnCours\) return;/);
  assert.match(creerClasse, /creationEnCours = true;/);
  assert.match(creerClasse, /finally \{ creationEnCours = false; \}/);
  const ajouter = blocDepuis(script, script.indexOf('$("ajouter").addEventListener("click"'));
  assert.match(ajouter, /bouton\.disabled = true/);
  assert.match(ajouter, /finally \{ bouton\.disabled = false; \}/);
  const voirFiche = fonction("voirFiche");
  assert.match(voirFiche, /bouton\.disabled = true/);
});

// ------------------------------------------------------------------ hors de mathsgo.re

test("la page ne charge plus aucune image de mathsgo.re", () => {
  const balises = [...page.matchAll(/<(img|link)\b[^>]*>/g)].map(m => m[0]);
  balises.forEach(balise => {
    assert.ok(!/https?:\/\//.test(balise), `image ou icône chargée d'ailleurs : ${balise}`);
  });
  assert.match(page, /<img src="\.\.\/mathsgo-logo\.png"/);
  assert.match(page, /<link rel="icon" href="\.\.\/favicon\.ico"/);
  assert.match(page, /<link rel="apple-touch-icon" href="\.\.\/apple-touch-icon\.png"/);
});

// ------------------------------------------------------- l'espace élève, même mot

test("dans l'espace élève, le bouton s'appelle « Se déconnecter » et ne laisse rien", () => {
  const espace = readFileSync(join(racine, "_serveur/public/index.php"), "utf8");
  assert.match(espace, /<button type="button" class="secondaire" id="changer">Se déconnecter<\/button>/,
    "le même mot que dans l’appli (« Ce n’est pas moi » disait autre chose au même endroit)");
  assert.ok(!espace.includes("id=\"changer\">Ce n’est pas moi"), "l'ancien libellé a disparu");
  const debut = espace.indexOf('$("changer").addEventListener("click"');
  assert.ok(debut > 0, "le bouton a son gestionnaire");
  const bloc = espace.slice(debut, espace.indexOf("});", debut));
  assert.ok(bloc.includes("revenirAuCode();"),
    "le bouton passe par le ménage commun (08/09/2026 : le retour d’un cache arrière/avant en a besoin aussi)");
  // Le ménage lui-même, où qu'il soit appelé : rien du précédent élève ne reste.
  const menage = espace.slice(espace.indexOf("function revenirAuCode() {"));
  ['$("titre").textContent = "Mon espace"', '$("classe").textContent = ""', '$("applis").textContent = ""']
    .forEach(attendu => assert.ok(menage.slice(0, menage.indexOf("\n  }")).includes(attendu),
      `« Se déconnecter » doit aussi nettoyer la page : ${attendu}`));
  // Les icônes et le logo de l'espace élève viennent d'ici, comme pour Ma classe.
  [...espace.matchAll(/<(img|link)\b[^>]*>/g)].map(m => m[0]).forEach(balise => {
    assert.ok(!/https?:\/\//.test(balise), `image ou icône chargée d'ailleurs : ${balise}`);
  });
});

// -------------------------------------------------------------------------
// Lot « jauges » (08/09/2026). Deux choses arrivent dans « Ma classe » :
//   - la colonne Expert montre 👑 pour une Légende (elle affichait cinq
//     étoiles : depuis le lot 3 de Défi tables, la couronne est la MARCHE
//     D'APRÈS les quatre étoiles, pas une cinquième), et la pastille du rang
//     à côté ;
//   - une jauge de classe, un objectif commun, calculée sur les progressions
//     DÉJÀ chargées : aucun appel de plus, et surtout aucun élève désigné.
//
// Sabotages attendus (chacun rend un test rouge) :
//   l) remettre "★".repeat(etat.expert.niveau) → une Légende reprend 5 étoiles
//   m) faire dire un prénom ou un code à la jauge de classe
//   n) demander les totaux au serveur au lieu de les compter ici
//   o) retirer « objectif » de BLOCS_A_CACHER → les chiffres d'une classe
//      restent affichés sous la suivante
//   r) montrer la carte alors qu'aucune table n'est acquise (seuil sur les
//      parcours au lieu de `objectif.fait`)
//   u) inverser la largeur de la barre de classe (`1 - part`) ou l'écrire en
//      dur (`100%`) → la barre ne suit plus le compte
//   v) remettre « 0 n'a encore rien fait » quand tout le monde a commencé

const MOTEUR_PROF = join(racine, "_serveur/public/prof/defi_tables_mon_parcours.js");
const { createRequire: requerir } = await import("node:module");
const MON_PARCOURS = requerir(import.meta.url)(MOTEUR_PROF);

// -------------------------------------------------------------------------
// Lot 2b de « Ma séance du jour » (03/10/2026) : le tableau de la classe.
// Colonnes : Élève · Code · Tables acquises · En cours · Cette semaine · En
// retard · Dernière activité. « À travailler », « Mélange », « Expert » et la
// pastille du rang ont quitté le tableau : le mélange et les étoiles se lisent
// dans « En cours », une LIGNE COURTE (décision de Gwenaël) calculée par le
// moteur (resumeProf). Deux alertes, sans compteur de plus : la table qui dure
// (8 séances et plus) et l'élève qu'on ne voit plus (7 jours et plus).
//
// Sabotages attendus (chacun rend un test rouge) :
//   l) écrire "★".repeat(5) pour une Légende → la couronne redevient 5 étoiles
//   w) compter une table « commencée » sur sa rangée (3 × 2 et 3 × 5 pleins
//      dès que la 2 et la 5 sont acquises) → « tables 3 et 4 » à tort
//   x) laisser la table en cours devant un mélange dû
//   y) baisser le seuil des séances longues, ou le lire sur une autre table
//   z) compter l'absence depuis le début de la semaine au lieu du dernier jour

const jourP = n => MON_PARCOURS.ajouterJours("2026-09-28", n);
function eleveProf({acquises = [], commencees = {}, melange = true} = {}) {
  let p = MON_PARCOURS.creerParcours();
  acquises.forEach(table => {
    p.tables[table].acquise = jourP(0);
    MON_PARCOURS.faitsDeLaTable(table).forEach(cle => {
      p.calculs[cle] = {boite: 4, vu: jourP(0), erreur: null, gagne: jourP(0), echeance: jourP(20)};
    });
  });
  if (acquises.length >= 2 && melange) { p.melange.aJour = true; p.melange.tables = [...acquises]; p.melange.dernier = jourP(0); }
  Object.entries(commencees).forEach(([table, seance]) => { p.tables[table].seance = {depart: 3, ...seance}; });
  return MON_PARCOURS.normaliserParcours(p);
}

test("« En cours » : une ligne courte — table et cases pleines, deux tables, étoiles, couronne ; plus jamais « mélange à faire »", () => {
  const resume = p => MON_PARCOURS.resumeProf(p, jourP(4));
  assert.equal(resume(MON_PARCOURS.creerParcours()).enCours.texte, "—", "rien fait : un tiret");
  // 2 et 5 acquises, la 3 en cours : 3 × 2 et 3 × 5 sont déjà pleins (boîte 4).
  const lea = eleveProf({acquises: [2, 5], commencees: {3: {n: 2, dernier: jourP(3)}}});
  assert.deepEqual({...resume(lea).enCours}, {type: "table", tables: [3], pleines: 2, total: 10, texte: "table de 3 · 2 sur 10", ordre: 402});
  // La 4 n'est PAS commencée, même si 4 × 2 et 4 × 5 sont pleins.
  assert.equal(resume(lea).enCours.type, "table", "une rangée à moitié pleine ne fait pas une table commencée");
  const deux = eleveProf({acquises: [2, 5], commencees: {3: {n: 2, dernier: jourP(1)}, 7: {n: 1, dernier: jourP(3)}}});
  assert.equal(resume(deux).enCours.texte, "tables 3 et 7");
  const trois = eleveProf({acquises: [2, 5], commencees: {3: {n: 1, dernier: jourP(1)}, 4: {n: 1, dernier: jourP(2)}, 7: {n: 1, dernier: jourP(3)}}});
  assert.equal(resume(trois).enCours.texte, "tables 3, 4 et 7");
  // Lot « un seul système » (05/10/2026) : Mon mélange est libre — un mélange
  // jamais joué ne passe plus devant la table, « En cours » dit la table.
  const melange = eleveProf({acquises: [2, 5], commencees: {3: {n: 2, dernier: jourP(3)}}, melange: false});
  assert.deepEqual({...resume(melange).enCours}, {...resume(lea).enCours}, "mélange joué ou non : la même ligne, la table en cours");
  assert.equal(resume(melange).enCours.texte, "table de 3 · 2 sur 10");
  const source = readFileSync(MOTEUR_PROF, "utf8");
  assert.doesNotMatch(source.slice(source.indexOf("function resumeProf("), source.indexOf("// ---------------------------------------------------- le rangement par code")), /mélange|melange/, "resumeProf ne parle plus du mélange");
  const toutes = eleveProf({acquises: [...MON_PARCOURS.TABLES]});
  assert.equal(resume(toutes).enCours.texte, "les 9 tables");
  const etoiles = MON_PARCOURS.normaliserParcours({...toutes, expert: {...toutes.expert, etoiles: 2}});
  assert.equal(resume(etoiles).enCours.texte, "★★");
  const legende = MON_PARCOURS.normaliserParcours({...toutes, expert: {...toutes.expert, etoiles: 5, couronne: jourP(3)}});
  assert.equal(resume(legende).enCours.texte, "👑", "la couronne est la marche d'après les quatre étoiles, pas une cinquième étoile");
});

test("« En cours » se trie : rien, puis les tables dans l'ordre conseillé et par cases pleines, les étoiles — le mélange ne déplace personne", () => {
  const ordre = p => MON_PARCOURS.resumeProf(p, jourP(4)).enCours.ordre;
  const rien = ordre(MON_PARCOURS.creerParcours());
  const table2 = ordre(eleveProf({commencees: {2: {n: 1, dernier: jourP(1)}}}));
  const table3 = ordre(eleveProf({acquises: [2, 10, 5], commencees: {3: {n: 1, dernier: jourP(1)}}}));
  const table7 = ordre(eleveProf({acquises: [2, 10, 5], commencees: {7: {n: 1, dernier: jourP(1)}}}));
  const toutes = ordre(eleveProf({acquises: [...MON_PARCOURS.TABLES]}));
  assert.ok(rien < table2 && table2 < table3 && table3 < table7 && table7 < toutes,
    `ordre attendu croissant : ${[rien, table2, table3, table7, toutes].join(" < ")}`);
  // Lot « un seul système » (05/10/2026) : un mélange jamais joué ne range
  // plus l'élève à part — il est trié sur sa table, comme les autres.
  assert.equal(ordre(eleveProf({acquises: [2, 5], melange: false})), ordre(eleveProf({acquises: [2, 5]})), "mélange joué ou non : la même place");
  assert.equal(MON_PARCOURS.resumeProf(eleveProf({acquises: [2, 5], melange: false}), jourP(4)).enCours.type, "table");
});

test("les alertes : la table qui dure (8 séances), les séances de la semaine — lues dans le parcours, sans compteur de plus", () => {
  assert.deepEqual({...MON_PARCOURS.SEUILS.prof}, {seancesLongues: 8, absenceJours: 7});
  const sept = eleveProf({acquises: [2, 5], commencees: {3: {n: 7, dernier: jourP(3)}}});
  assert.equal(MON_PARCOURS.resumeProf(sept, jourP(4)).longue, null, "7 séances : rien");
  const huit = eleveProf({acquises: [2, 5], commencees: {3: {n: 8, dernier: jourP(3)}}});
  assert.deepEqual({...MON_PARCOURS.resumeProf(huit, jourP(4)).longue}, {table: 3, seances: 8});
  // Les séances d'une table ACQUISE ne comptent pas, ni celles d'une autre table.
  const acquise = eleveProf({acquises: [2, 5], commencees: {3: {n: 1, dernier: jourP(3)}}});
  acquise.tables[2].seance.n = 12;
  assert.equal(MON_PARCOURS.resumeProf(acquise, jourP(4)).longue, null);
  // « Cette semaine » : les jours avec une séance finie, depuis lundi.
  const semaine = eleveProf({acquises: [2, 5], commencees: {3: {n: 2, dernier: jourP(3)}}});
  semaine.seances = [jourP(-3), jourP(0), jourP(2), jourP(2)];
  assert.equal(MON_PARCOURS.resumeProf(MON_PARCOURS.normaliserParcours(semaine), jourP(4)).seances, 2, "deux jours (deux séances le même jour comptent pour un)");
  // Et la page les écrit telles quelles.
  assert.match(page, /alerte\.textContent = `\$\{eleve\.lu\.longue\.seances\} séances dessus`;/);
  assert.match(page, /alerte\.textContent = `rien depuis \$\{absence\} jours`;/);
});

test("« rien depuis N jours » : compté depuis la dernière activité, à l'heure de La Réunion, à partir de 7 jours", () => {
  const debut = page.indexOf("  function joursSansRien(eleve) {");
  assert.ok(debut > 0, "la page doit compter les jours sans activité");
  const source = page.slice(debut, page.indexOf("\n  }", debut) + 4) + "\n  return joursSansRien;";
  const compter = aujourdhui => new Function("PARCOURS", source)({...MON_PARCOURS, jourLocal: () => aujourdhui});
  assert.equal(compter("2026-10-03")({maj_le: null}), null, "jamais venu : la colonne dit déjà « rien fait »");
  assert.equal(compter("2026-10-03")({maj_le: "2026-09-27T06:00:00Z"}), null, "6 jours : rien");
  assert.equal(compter("2026-10-03")({maj_le: "2026-09-26T06:00:00Z"}), 7);
  assert.equal(compter("2026-10-03")({maj_le: "2026-09-24T06:00:00Z"}), 9);
  // 21 h à Paris le 25, c'est déjà le 26 à La Réunion (UTC + 4).
  assert.equal(compter("2026-10-03")({maj_le: "2026-09-25T20:30:00Z"}), 7, "le jour est celui de La Réunion, comme les journées du serveur");
});

test("le tableau : six colonnes et la flèche, la liste des tables écrite, la ligne entière qui s'ouvre (serveur pro, lot 5c)", () => {
  // Lot « splat-suivi-4 » : l'en-tête de Défi tables est la rangée
  // « entete-defi-tables » (celle de SPLAT! est testée dans suivi-prof-splat).
  const debutEntete = page.indexOf('<tr id="entete-defi-tables">');
  const entete = page.slice(debutEntete, page.indexOf("</tr>", debutEntete));
  assert.deepEqual([...entete.matchAll(/<th(?: class="(\w+)")?>(?:<button type="button" data-tri="(\w+)">)?([^<]*)/g)].map(m => `${m[3]}${m[2] ? `:${m[2]}` : ""}${m[1] ? ` (${m[1]})` : ""}`),
    ["Élève:prenom", "Tables passées:acquises", "En cours:encours (large)", "Cette semaine:semaine (large)", "En retard:retard (large)", "Dernière activité:date", ""]);
  // Lot « un seul système » (05/10/2026) : « Tables passées » partout (la clé de tri reste « acquises »).
  assert.doesNotMatch(page, /Tables acquises|"Acquises"/);
  assert.doesNotMatch(page, /À travailler|cMelange|cExpert|caseExpert|badgeRang|calculsATravailler\(/, "les trois colonnes d'avant sont retirées, et leur code avec");
  assert.match(page, /if \(tri\.colonne === "encours"\) return eleve\.lu\.enCours\.ordre;\s*if \(tri\.colonne === "semaine"\) return eleve\.lu\.seances;/);
  assert.match(script, /"defi-tables": \["prenom", "acquises", "encours", "semaine", "retard", "date"\]/);
  // La liste des tables se LIT (une info-bulle ne s'imprime pas).
  assert.match(page, /liste\.textContent = reste\.length <= 3 \? `reste \$\{reste\.join\(", "\)\}` : eleve\.lu\.acquises\.join\(", "\);\s*cAcquises\.append\(liste\);/);
  // Plus de bouton sur la ligne : la ligne entière ouvre la fenêtre de
  // l'élève, où sont « Voir son parcours » et « Revenir à… ». Le menu « ⋯ »
  // reste celui de l'onglet Élèves (testé dans suivi-ma-classe-eleves).
  assert.doesNotMatch(page, /fiche\.textContent = "Parcours"/);
  assert.match(page, /\[cEnCours, cSemaine, cRetard\]\.forEach\(large\);\s*ligne\.append\(cNom, cAcquises, cEnCours, cSemaine, cRetard, cDate\);\s*finirLigne\(ligne, eleve, cNom\);/);
  assert.match(fonction("menuGestes"), /if \(!boutons\.length\) return;[\s\S]*menu\.addEventListener\("click", \(\) => \{ plus\.open = false; \}\);\s*plus\.addEventListener\("toggle", \(\) => placerMenu\(plus, poignee, menu\)\);\s*cActions\.append\(plus\);/, "pas de menu vide");
  assert.match(page, /\.plus\[open\] > div \{ position: fixed; z-index: 5;/);
  assert.match(page, /document\.addEventListener\("click", fermerMenus\);\s*window\.addEventListener\("scroll", \(\) => fermerMenus\(null\), true\);/);
});

test("« lireProgression » demande tout au moteur, et un parcours illisible donne une ligne vide complète", () => {
  const debut = page.indexOf("  function lireProgression(brut) {");
  const bloc = page.slice(debut, page.indexOf("\n  }", debut));
  ["couronne: etat.expert.couronne", "etat.jours ? etat.jours.semaine : 0", "enCours: resume.enCours", "seances: resume.seances", "longue: resume.longue"]
    .forEach(attendu => assert.ok(bloc.includes(attendu),
      `la page doit lire « ${attendu} » dans ce que rend le moteur, sans le recalculer`));
  assert.match(bloc, /const resume = PARCOURS\.resumeProf \? PARCOURS\.resumeProf\(parcours\) :/, "un moteur d'avant le lot 2b resté sur le serveur ne vide pas le tableau");
  assert.match(bloc, /const vide = \{[^}]*couronne: null[^}]*enCours: \{type: "rien", texte: "—", ordre: 0/s,
    "un parcours illisible doit donner un état vide complet, sinon la ligne plante");
});

// La jauge de classe. Le point sensible n'est pas le calcul, c'est ce qu'elle
// dit : jamais un nom, jamais un chiffre par élève, jamais un classement.
function jaugeDeClasse(eleves) {
  const debut = page.indexOf("  function objectifDeLaClasse() {");
  assert.ok(debut > 0, "la page doit calculer son objectif de classe");
  const fin = page.indexOf("\n  }", page.indexOf("  function dessinerObjectif() {", debut)) + "\n  }".length;
  const source = page.slice(debut, fin) + "\n  return {objectifDeLaClasse, dessinerObjectif};";
  const zones = new Map();
  const noeud = id => {
    if (!zones.has(id)) zones.set(id, {id, style: {}, textContent: "", hidden: true, enfants: [],
      append(...e) { zones.get(id).enfants.push(...e); }, appendChild(e) { zones.get(id).enfants.push(e); }});
    return zones.get(id);
  };
  const document = {createElement: () => {
    const n = {style: {}, textContent: "", enfants: [], append(...e) { n.enfants.push(...e); }};
    return n;
  }, createTextNode: t => ({texte: t})};
  const fabriques = new Function("$", "document", "eleves", "PARCOURS", "Math", source)(
    noeud, document, eleves, MON_PARCOURS, Math);
  fabriques.dessinerObjectif();
  return {zones, ...fabriques};
}

function eleveDeTest(prenom, code, acquises, semaine) {
  return {
    prenom, code,
    lu: {acquises: MON_PARCOURS.TABLES.slice(0, acquises), semaine, parcours: {}, melange: "à jour"}
  };
}

test("la jauge de classe additionne, et ne nomme personne", () => {
  const {zones} = jaugeDeClasse([
    eleveDeTest("Léa", "ABCD01", 9, 2),
    eleveDeTest("Noé", "ABCD02", 4, 1),
    eleveDeTest("Amina", "ABCD03", 0, 0)
  ]);
  const compte = zones.get("objectif-compte").textContent;
  assert.equal(compte, "Ensemble : 13 tables passées sur 27", "9 + 4 + 0 sur 3 élèves × 9 tables");
  assert.ok(compte.includes("tables passées"), "au pluriel dès 2 : le singulier est réservé à « 1 table passée »");
  const tout = [compte, JSON.stringify([...zones.values()].map(z => [z.textContent, z.enfants]))].join(" ");
  ["Léa", "Noé", "Amina", "ABCD01", "ABCD02", "ABCD03"].forEach(interdit =>
    assert.ok(!tout.includes(interdit),
      `« ${interdit} » n'a rien à faire dans un objectif de classe : c'est le seul endroit de la page où personne n'est désigné`));
  assert.equal(zones.get("objectif").hidden, false, "la carte s'affiche");
});

test("la ligne de la semaine compte des élèves, jamais lesquels", () => {
  const {zones} = jaugeDeClasse([
    eleveDeTest("Léa", "ABCD01", 9, 2),
    eleveDeTest("Noé", "ABCD02", 4, 1),
    eleveDeTest("Amina", "ABCD03", 0, 0)
  ]);
  const lignes = zones.get("objectif-lignes").enfants;
  assert.equal(lignes.length, 1, "une seule petite ligne : le signe de vie de la semaine");
  const texte = lignes[0].enfants.map(e => e.texte || e.textContent).join("");
  assert.equal(texte, "2 élèves ont travaillé cette semaine");
});

test("une classe sans élève ne montre pas de jauge vide", () => {
  const {zones} = jaugeDeClasse([]);
  assert.equal(zones.get("objectif").hidden, true, "« 0 sur 0 » n'est pas un objectif");
});

// Le vrai cas de la rentrée : les codes sont distribués, personne n'a encore
// joué. « Ensemble : 0 table acquise sur 54 » redit, en moins clair, la phrase
// déjà écrite au-dessus du tableau (« 12 élèves · 12 n'ont encore rien fait »)
// — et c'est exactement ce qu'on refuse à l'élève.
test("une classe où personne n'a commencé ne montre pas de jauge à zéro", () => {
  const attendent = ["Léa", "Noé", "Amina"].map((prenom, i) => ({
    prenom, code: `ABCD0${i + 1}`,
    lu: {acquises: [], semaine: 0, parcours: null, melange: "—"}
  }));
  const {zones} = jaugeDeClasse(attendent);
  assert.equal(zones.get("objectif").hidden, true,
    "une barre à zéro n'est pas un objectif de classe, c'est un constat déjà écrit ailleurs");
});

// Le jour de la distribution des codes : toute la classe OUVRE l'appli, joue
// un peu, et personne n'acquiert de table dans l'heure — il en faut 20 bonnes
// réponses en 1 min 30. Ces élèves ont donc un parcours enregistré. Compter
// les parcours ramenait la barre à zéro exactement le jour qu'on voulait
// éviter : le seuil porte sur les TABLES acquises.
test("des élèves qui ont ouvert l'appli sans rien acquérir ne suffisent pas", () => {
  const ouvert = ["Léa", "Noé", "Amina"].map((prenom, i) => ({
    prenom, code: `ABCD0${i + 1}`,
    lu: {acquises: [], semaine: 1, parcours: {}, melange: "—"}
  }));
  const {zones} = jaugeDeClasse(ouvert);
  assert.equal(zones.get("objectif").hidden, true,
    "ils ont bien travaillé, mais la jauge n'a toujours rien à montrer : « 0 table acquise sur 27 » est la barre vide qu'on refuse");
});

test("une seule table passée dans toute la classe suffit à ouvrir la jauge", () => {
  const {zones} = jaugeDeClasse([
    eleveDeTest("Léa", "ABCD01", 1, 1),
    {prenom: "Noé", code: "ABCD02", lu: {acquises: [], semaine: 0, parcours: null, melange: "—"}}
  ]);
  assert.equal(zones.get("objectif").hidden, false, "dès qu'un chiffre bouge, la classe a un objectif");
  assert.equal(zones.get("objectif-compte").textContent, "Ensemble : 1 table passée sur 18",
    "le dénominateur compte TOUS les élèves, y compris ceux qui n'ont pas commencé");
});

// La barre est le seul élément graphique de la carte, et aucun test ne la
// regardait : inversée ou toujours pleine, 2 295 tests restaient verts (relevé
// par Claude Code le 09/09/2026). Sa largeur est la part des tables acquises,
// en pour cent arrondi.
test("la barre de classe est remplie à la mesure des tables acquises", () => {
  const largeur = eleves => jaugeDeClasse(eleves).zones.get("objectif-barre").style.width;
  assert.equal(largeur([
    eleveDeTest("Léa", "ABCD01", 9, 2),
    eleveDeTest("Noé", "ABCD02", 4, 1),
    eleveDeTest("Amina", "ABCD03", 0, 0)
  ]), "48%", "13 tables sur 27 : 48,1 % arrondi à 48");
  assert.equal(largeur([
    eleveDeTest("Léa", "ABCD01", 1, 1),
    eleveDeTest("Noé", "ABCD02", 0, 0)
  ]), "6%", "1 table sur 18");
  assert.equal(largeur([eleveDeTest("Léa", "ABCD01", 9, 1)]), "100%", "9 sur 9 : pleine");
});

// La ligne au-dessus du tableau, extraite telle qu'elle est écrite dans la
// page. C'est elle qui reste quand la carte de classe se tait : elle doit
// dire juste, surtout ce jour-là.
function resumeDeLaClasse() {
  const debut = page.indexOf("  function resumeDeLaClasse(liste, aCommence = e => Boolean(e.maj_le), quoi = \"rien reçu\") {");
  assert.ok(debut > 0, "la page doit avoir sa ligne de résumé de classe");
  const fin = page.indexOf("\n  }", debut) + "\n  }".length;
  return new Function(page.slice(debut, fin) + "\n  return resumeDeLaClasse;")();
}

// Lot « textes justes » (24/10/2026) : le serveur ne sait pas qui n'a « rien
// fait », il sait de qui il n'a rien reçu (travail hors ligne possible).
test("le résumé de classe compte ceux dont le serveur n'a encore rien reçu", () => {
  const resume = resumeDeLaClasse();
  const eleve = maj_le => ({maj_le});
  assert.equal(resume([]), "Aucun élève. Commence par en ajouter.");
  assert.equal(resume([eleve(null), eleve(null), eleve(null)]), "3 élèves · rien reçu pour 3",
    "les codes sont distribués, personne n'a joué");
  assert.equal(resume([eleve("2026-09-09"), eleve(null), eleve(null)]), "3 élèves · rien reçu pour 2");
  assert.equal(resume([eleve("2026-09-09"), eleve("2026-09-09"), eleve(null)]), "3 élèves · rien reçu pour 1");
  assert.equal(resume([eleve(null)]), "1 élève · rien reçu pour 1");
  assert.equal(resume([eleve(null)], e => Boolean(e.maj_le), "aucun calcul reçu"), "1 élève · aucun calcul reçu pour 1", "Anzan dit ce qu'il compte");
});

// Le jour de la distribution des codes, en fin d'heure : tout le monde a ouvert
// l'appli, personne n'a encore acquis de table. La carte de classe se tait, et
// c'est cette ligne qui doit dire que ça a tourné — pas « 0 n'a encore rien
// fait » (lot 7), une phrase juste par le nombre et fausse par la forme.
test("quand tout le monde a commencé, le résumé le dit au lieu de compter zéro", () => {
  const resume = resumeDeLaClasse();
  const commence = ["2026-09-09", "2026-09-09", "2026-09-08"].map(maj_le => ({maj_le}));
  const texte = resume(commence);
  assert.equal(texte, "3 élèves · tout le monde a commencé");
  assert.ok(!/pour 0\b/.test(texte), "« rien reçu pour 0 » n'est pas une phrase");
});

test("la jauge de classe ne demande rien de plus au serveur", () => {
  const debut = page.indexOf("  function objectifDeLaClasse() {");
  const bloc = page.slice(debut, page.indexOf("  // Ce qu'il faut revoir au tableau", debut));
  assert.doesNotMatch(bloc, /\bapi\(|fetch\(/,
    "elle se calcule sur les progressions déjà chargées : un point d'API de plus serait une surface de plus à protéger");
  assert.ok(BLOCS_A_CACHER.includes("objectif"),
    "la carte doit disparaître à la déconnexion, comme les autres blocs de la classe ouverte");
});
