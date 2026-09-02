import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = "_serveur/public/prof/index.php";

// Lot 1 du suivi (02/09/2026) — « Coller la liste des prénoms ».
//
// Le professeur imprime la feuille des codes, la distribue dans l'ordre, puis
// colle la liste des prénoms dans le même ordre. Avant ce lot, le collage
// attribuait les prénoms dans l'ordre de CRÉATION des codes (a.id - b.id) alors
// que la feuille les rangeait par code : 8 associations fausses sur 8 en essai
// au navigateur — chaque enfant repartait avec le code d'un camarade.
//
// La garantie tient à UNE fonction, ordreDeLaFeuille(eleves), utilisée par la
// feuille imprimée (dessinerFiche) ET par le collage. Ces tests isolent le
// script de la page (comme suivi-moteur-copie.test.mjs) et rejouent les deux
// chemins sur les mêmes élèves : ils doivent donner le même ordre.
//
// Sabotage : dans le gestionnaire du bouton, remplacer sansPrenomDansLOrdre(eleves)
// par eleves.filter(e => !e.prenom).sort((a, b) => a.id - b.id) → rouge.

const page = readFileSync(join(racine, PAGE), "utf8");
const script = (() => {
  const debut = page.indexOf('<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">');
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

const sourceOrdre = fonction("ordreDeLaFeuille");
const sourceSansPrenom = fonction("sansPrenomDansLOrdre");
const sourceApercu = fonction("apercuCollage");
const sourceFiche = fonction("dessinerFiche");
const sourceCollage = (() => {
  const position = script.indexOf('$("coller-prenoms").addEventListener("click", async () =>');
  assert.ok(position > 0, "le bouton « Coller la liste des prénoms » doit avoir son gestionnaire");
  return blocDepuis(script, position);
})();

// Huit élèves dont l'ordre de création (id) n'est PAS l'ordre des codes : c'est
// exactement le cas où l'ancien collage se trompait.
function classeDEssai() {
  const codes = ["TDJM2L", "27XCYE", "RKUJ5F", "9K7ZE8", "MMKNRF", "ACUNB9", "RKBKW6", "LKCHEU"];
  return codes.map((code, index) => ({id: 100 + index, code, prenom: "", initiale: "", lu: {acquises: []}}));
}
const PRENOMS = ["Un", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit"];

// Les fonctions pures, exécutées telles qu'elles sont écrites dans la page.
const {ordreDeLaFeuille, sansPrenomDansLOrdre, apercuCollage} = new Function(
  `${sourceOrdre}\n${sourceSansPrenom}\n${sourceApercu}\nreturn {ordreDeLaFeuille, sansPrenomDansLOrdre, apercuCollage};`
)();

// La feuille imprimée, rendue avec un document minimal : on lit les lignes.
function feuilleRendue(eleves) {
  const lignes = [];
  const element = () => {
    const noeud = {textContent: "", className: "", style: {}, enfants: [],
      append(...e) { this.enfants.push(...e); }, appendChild(e) { this.enfants.push(e); return e; }};
    return noeud;
  };
  const corps = element();
  const document = {createElement: () => element()};
  const $ = id => (id === "fiche-corps" ? corps : element());
  new Function("document", "$", "eleves", "classe", "nomAffiche", "ordreDeLaFeuille",
    `${sourceFiche}\ndessinerFiche();`)(
    document, $, eleves, {libelle: "6eB"},
    eleve => eleve.prenom ? (eleve.initiale ? `${eleve.prenom} ${eleve.initiale}.` : eleve.prenom) : "",
    ordreDeLaFeuille);
  corps.enfants.forEach(ligne => {
    const cellules = ligne.enfants.map(td => td.textContent);
    lignes.push({numero: cellules[0], nom: cellules[1], code: cellules[2]});
  });
  return lignes;
}

// Le collage, rejoué avec des faux serveur et boîte de dialogue : on note dans
// quel ordre les élèves reçoivent les prénoms.
async function collageRejoue(eleves, texteColle, options = {}) {
  const nommes = [];
  const bouton = {disabled: false, etats: []};
  const api = async (action, corps) => {
    bouton.etats.push(bouton.disabled);
    if (action === "eleves.nommer") nommes.push({eleve_id: corps.eleve_id, prenom: corps.prenom, initiale: corps.initiale});
    return {ok: true};
  };
  const demander = async (texte, champs, opts) => {
    options.boite = {texte, apercu: opts && opts.apercu ? opts.apercu({liste: texteColle}) : null};
    return {liste: texteColle};
  };
  const contexte = {
    $: id => (id === "coller-prenoms" ? bouton : {}),
    api, demander,
    ouvrirClasse: async () => { options.rechargements = (options.rechargements || 0) + 1; },
    messager: () => {}, surErreur: erreur => { throw erreur; },
    classe: {id: 1}, eleves,
    ordreDeLaFeuille, sansPrenomDansLOrdre, apercuCollage,
  };
  const gestionnaire = new Function(...Object.keys(contexte),
    `${fonction("decouperPrenoms")}\nreturn (${sourceCollage.replace(/^\$\("coller-prenoms"\)\.addEventListener\("click", /, "")});`
  )(...Object.values(contexte));
  await gestionnaire();
  return {nommes, bouton};
}

test("ordreDeLaFeuille : prénoms d'abord, puis les codes ; pure et stable", () => {
  const eleves = classeDEssai();
  eleves[3].prenom = "Zoé";
  eleves[6].prenom = "ali";
  const copie = JSON.stringify(eleves);
  const ordre = ordreDeLaFeuille(eleves);
  assert.equal(JSON.stringify(eleves), copie, "ne modifie pas la liste reçue");
  assert.deepEqual(ordre.map(e => e.prenom || e.code),
    ["ali", "Zoé", "27XCYE", "ACUNB9", "LKCHEU", "MMKNRF", "RKUJ5F", "TDJM2L"]);
  assert.deepEqual(ordreDeLaFeuille(eleves.slice().reverse()).map(e => e.code), ordre.map(e => e.code),
    "le même ordre quel que soit l'ordre d'arrivée (donc quel que soit le tri du tableau)");
});

test("la feuille imprimée suit ordreDeLaFeuille et numérote ses lignes 1, 2, 3…", () => {
  const eleves = classeDEssai();
  eleves[5].prenom = "Léa"; eleves[5].initiale = "B";
  const feuille = feuilleRendue(eleves);
  assert.deepEqual(feuille.map(l => l.numero), ["1", "2", "3", "4", "5", "6", "7", "8"]);
  assert.deepEqual(feuille.map(l => l.code), ordreDeLaFeuille(eleves).map(e => e.code));
  assert.equal(feuille[0].nom, "Léa B.");
  assert.equal(feuille[1].nom, "—");
  assert.match(page, /<thead><tr><th>N°<\/th><th>Élève<\/th><th>Code<\/th>/, "la fiche a une colonne N°");
});

test("collage et feuille imprimée donnent le MÊME ordre (le défaut du 01/09)", async () => {
  const eleves = classeDEssai();
  const feuille = feuilleRendue(eleves);
  const {nommes} = await collageRejoue(eleves, PRENOMS.join("\n"));
  assert.equal(nommes.length, 8);
  const parId = new Map(eleves.map(e => [e.id, e.code]));
  const codesCollage = nommes.map(n => parId.get(n.eleve_id));
  assert.deepEqual(codesCollage, feuille.map(l => l.code),
    "le prénom n° i doit aller au code de la ligne i de la feuille imprimée");
  // Et donc, enfant par enfant : le prénom de sa ligne.
  feuille.forEach((ligne, index) => {
    const attribue = nommes.find(n => parId.get(n.eleve_id) === ligne.code);
    assert.equal(attribue.prenom, PRENOMS[index], `ligne ${index + 1} (${ligne.code})`);
  });
});

test("avec des prénoms déjà saisis, seuls les sans-nom reçoivent la liste, dans l'ordre de la feuille", async () => {
  const eleves = classeDEssai();
  eleves[1].prenom = "Zoé";
  eleves[4].prenom = "Ali";
  const feuille = feuilleRendue(eleves).filter(l => l.nom === "—");
  assert.equal(feuille.length, 6);
  const {nommes} = await collageRejoue(eleves, "Un, Deux, Trois, Quatre, Cinq, Six");
  const parId = new Map(eleves.map(e => [e.id, e.code]));
  assert.deepEqual(nommes.map(n => parId.get(n.eleve_id)), feuille.map(l => l.code));
  assert.ok(!nommes.some(n => n.eleve_id === eleves[1].id || n.eleve_id === eleves[4].id), "Zoé et Ali ne sont pas renommés");
});

test("l'aperçu « code → prénom » montre, avant validation, exactement ce que le collage fera", async () => {
  const eleves = classeDEssai();
  const options = {};
  const {nommes} = await collageRejoue(eleves, PRENOMS.slice(0, 5).join("\n"), options);
  assert.ok(options.boite.apercu, "la boîte reçoit un aperçu");
  const lignes = options.boite.apercu.filter(l => l.code);
  assert.equal(lignes.length, 5);
  const parId = new Map(eleves.map(e => [e.id, e.code]));
  assert.deepEqual(lignes.map(l => [l.numero, l.code, l.texte]),
    nommes.map((n, i) => [i + 1, parId.get(n.eleve_id), n.prenom]));
  assert.match(options.boite.apercu.at(-1).texte, /3 code\(s\) restent sans prénom/);
  assert.match(options.boite.texte, /numéros 1, 2, 3/, "la consigne parle des numéros de la feuille");
  // Trop de prénoms : l'aperçu prévient.
  const trop = apercuCollage(["a", "b", "c"], sansPrenomDansLOrdre(eleves).slice(0, 2));
  assert.equal(trop.filter(l => l.code).length, 2);
  assert.match(trop.at(-1).texte, /1 prénom\(s\) en trop \(c\)/);
  assert.equal(trop.at(-1).classe, "alerte");
});

test("le bouton est désactivé pendant toute la boucle, la liste rechargée avant de calculer l'ordre", async () => {
  const options = {};
  const {bouton} = await collageRejoue(classeDEssai(), PRENOMS.join("\n"), options);
  assert.equal(bouton.etats.length, 8);
  assert.ok(bouton.etats.every(Boolean), "désactivé à chaque appel au serveur");
  assert.equal(bouton.disabled, false, "réactivé à la fin");
  assert.equal(options.rechargements, 2, "rechargée avant (ordre à jour) et après (tableau à jour)");
});

test("le collage ne trie plus jamais par identifiant, et le commentaire dit la vérité", () => {
  assert.doesNotMatch(sourceCollage, /a\.id - b\.id|\.sort\(/, "aucun tri propre au collage : l'ordre vient de la feuille");
  assert.match(sourceCollage, /sansPrenomDansLOrdre\(eleves\)/);
  assert.match(sourceFiche, /ordreDeLaFeuille\(eleves\)/);
  assert.equal(script.split("function ordreDeLaFeuille(").length, 2, "une seule définition");
  assert.doesNotMatch(script, /dans l'ordre où leurs codes ont été créés/, "l'ancien commentaire (faux) a disparu");
});
